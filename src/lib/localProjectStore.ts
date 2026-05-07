/**
 * Local-first project & spec storage using IndexedDB.
 * - Primary source of truth for projects & specs
 * - Works fully offline
 * - Provides cloud-sync hooks (push/pull) but does not require them
 */

import type { DesignInputs, OverrideKeys } from "@/stores/designInputsStore";

const DB_NAME = "pipepal-local";
const DB_VERSION = 1;
const STORE_PROJECTS = "projects";
const STORE_SPECS = "specs";
const STORE_META = "meta";

export interface LocalProject {
  id: string;                       // uuid (matches cloud id when synced)
  name: string;
  description: string;
  designInputs: DesignInputs;
  overrides: Partial<Record<OverrideKeys, boolean>>;
  modulesUsed?: string[];
  results?: Record<string, unknown>;
  createdAt: string;                // ISO
  updatedAt: string;                // ISO (local last-modified)
  cloudUpdatedAt?: string;          // ISO of last known cloud version
  syncStatus: "local-only" | "synced" | "pending" | "conflict";
  origin: "local" | "cloud";
}

export interface LocalSpec {
  id: string;
  /** Parent project this spec belongs to. Optional for legacy / orphaned specs. */
  projectId?: string;
  specNumber: string;
  specName: string;
  materialGroup: string;
  flangeRating: string;
  scheduleBand: string;
  serviceType: string;
  createdAt: string;
  updatedAt?: string;
  legacyImported?: boolean;
  data?: unknown;                  // full PipingMaterialSpec snapshot
  designInputs?: DesignInputs;
  overrides?: Partial<Record<OverrideKeys, boolean>>;
  cloudUpdatedAt?: string;         // ISO of last known cloud version
  syncStatus?: "local-only" | "synced" | "pending" | "conflict";
}

export interface SyncMeta {
  lastSyncAt?: string;
  lastSyncStatus?: "ok" | "error" | "partial";
  lastSyncMessage?: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_SPECS)) {
        db.createObjectStore(STORE_SPECS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | Promise<T>): Promise<T> {
  return openDb().then(db => new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const result = fn(s);
    if (result instanceof Promise) {
      result.then(resolve, reject);
      return;
    }
    result.onsuccess = () => resolve(result.result);
    result.onerror = () => reject(result.error);
  }));
}

function uuid(): string {
  return (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
    "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ============ Projects ============

export async function listProjects(): Promise<LocalProject[]> {
  const all = await tx<LocalProject[]>(STORE_PROJECTS, "readonly", s => s.getAll() as IDBRequest<LocalProject[]>);
  return [...all].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProject(id: string): Promise<LocalProject | undefined> {
  return tx<LocalProject | undefined>(STORE_PROJECTS, "readonly", s => s.get(id) as IDBRequest<LocalProject | undefined>);
}

export async function createProject(input: {
  name: string;
  description?: string;
  designInputs: DesignInputs;
  overrides: Partial<Record<OverrideKeys, boolean>>;
  modulesUsed?: string[];
}): Promise<LocalProject> {
  const now = new Date().toISOString();
  const p: LocalProject = {
    id: uuid(),
    name: input.name,
    description: input.description ?? "",
    designInputs: input.designInputs,
    overrides: input.overrides,
    modulesUsed: input.modulesUsed,
    createdAt: now,
    updatedAt: now,
    syncStatus: "local-only",
    origin: "local",
  };
  await tx<IDBValidKey>(STORE_PROJECTS, "readwrite", s => s.put(p));
  return p;
}

export async function updateProject(id: string, patch: Partial<LocalProject>): Promise<LocalProject> {
  const existing = await getProject(id);
  if (!existing) throw new Error("Project not found");
  const updated: LocalProject = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: new Date().toISOString(),
    syncStatus: patch.syncStatus ?? (existing.syncStatus === "synced" ? "pending" : existing.syncStatus),
  };
  await tx<IDBValidKey>(STORE_PROJECTS, "readwrite", s => s.put(updated));
  return updated;
}

export async function deleteProject(id: string): Promise<void> {
  await tx<undefined>(STORE_PROJECTS, "readwrite", s => s.delete(id) as IDBRequest<undefined>);
}

/** Upsert a project from cloud (used during sync/import). Returns conflict info if local has unsynced edits. */
export async function upsertFromCloud(cloud: {
  id: string;
  name: string;
  description?: string | null;
  design_inputs: unknown;
  overrides: unknown;
  created_at: string;
  updated_at: string;
}): Promise<{ project: LocalProject; conflict: boolean }> {
  const existing = await getProject(cloud.id);
  const cloudProject: LocalProject = {
    id: cloud.id,
    name: cloud.name,
    description: cloud.description ?? "",
    designInputs: cloud.design_inputs as DesignInputs,
    overrides: cloud.overrides as Partial<Record<OverrideKeys, boolean>>,
    createdAt: cloud.created_at,
    updatedAt: cloud.updated_at,
    cloudUpdatedAt: cloud.updated_at,
    syncStatus: "synced",
    origin: "cloud",
  };

  if (!existing) {
    await tx<IDBValidKey>(STORE_PROJECTS, "readwrite", s => s.put(cloudProject));
    return { project: cloudProject, conflict: false };
  }

  // Conflict: local has changes since last sync AND cloud changed too
  const localNewer = existing.updatedAt > (existing.cloudUpdatedAt ?? "");
  const cloudNewer = cloud.updated_at > (existing.cloudUpdatedAt ?? "");
  if (localNewer && cloudNewer && existing.updatedAt !== cloud.updated_at) {
    const flagged: LocalProject = { ...existing, syncStatus: "conflict", cloudUpdatedAt: cloud.updated_at };
    await tx<IDBValidKey>(STORE_PROJECTS, "readwrite", s => s.put(flagged));
    return { project: flagged, conflict: true };
  }

  // No conflict — apply cloud version
  await tx<IDBValidKey>(STORE_PROJECTS, "readwrite", s => s.put(cloudProject));
  return { project: cloudProject, conflict: false };
}

/** Mark a project as successfully pushed to cloud. */
export async function markSynced(id: string, cloudUpdatedAt: string): Promise<void> {
  const existing = await getProject(id);
  if (!existing) return;
  const updated: LocalProject = { ...existing, syncStatus: "synced", cloudUpdatedAt };
  await tx<IDBValidKey>(STORE_PROJECTS, "readwrite", s => s.put(updated));
}

// ============ Specs ============

export async function listSpecs(): Promise<LocalSpec[]> {
  const all = await tx<LocalSpec[]>(STORE_SPECS, "readonly", s => s.getAll() as IDBRequest<LocalSpec[]>);
  return [...all].sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt));
}

export async function saveSpec(spec: LocalSpec): Promise<void> {
  // Mark as pending if it had been previously synced (so push picks it up)
  const next: LocalSpec = {
    ...spec,
    syncStatus: spec.syncStatus ?? (spec.cloudUpdatedAt ? "pending" : "local-only"),
  };
  await tx<IDBValidKey>(STORE_SPECS, "readwrite", s => s.put(next));
}

/** Mark a spec as successfully pushed to cloud. */
export async function markSpecSynced(id: string, cloudUpdatedAt: string): Promise<void> {
  const existing = await getSpec(id);
  if (!existing) return;
  const updated: LocalSpec = { ...existing, syncStatus: "synced", cloudUpdatedAt };
  await tx<IDBValidKey>(STORE_SPECS, "readwrite", s => s.put(updated));
}

export async function deleteSpec(id: string): Promise<void> {
  await tx<undefined>(STORE_SPECS, "readwrite", s => s.delete(id) as IDBRequest<undefined>);
}

export async function getSpec(id: string): Promise<LocalSpec | undefined> {
  return tx<LocalSpec | undefined>(STORE_SPECS, "readonly", s => s.get(id) as IDBRequest<LocalSpec | undefined>);
}

/** Return only the specs that belong to the given project (or orphaned specs when projectId is null). */
export async function listSpecsByProject(projectId: string | null): Promise<LocalSpec[]> {
  const all = await listSpecs();
  if (projectId === null) return all.filter(s => !s.projectId);
  return all.filter(s => s.projectId === projectId);
}

/** Update a spec by id; returns the updated spec or undefined if not found. */
export async function updateSpec(id: string, patch: Partial<LocalSpec>): Promise<LocalSpec | undefined> {
  const existing = await getSpec(id);
  if (!existing) return undefined;
  const updated: LocalSpec = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: new Date().toISOString(),
    syncStatus: patch.syncStatus ?? (existing.syncStatus === "synced" ? "pending" : existing.syncStatus ?? "local-only"),
  };
  await tx<IDBValidKey>(STORE_SPECS, "readwrite", s => s.put(updated));
  return updated;
}

/** Rename a spec (changes specNumber and optionally specName). */
export async function renameSpec(id: string, newSpecNumber: string, newSpecName?: string): Promise<LocalSpec | undefined> {
  const patch: Partial<LocalSpec> = { specNumber: newSpecNumber };
  if (typeof newSpecName === "string") patch.specName = newSpecName;
  return updateSpec(id, patch);
}

/** Delete every spec belonging to a given project (used when the project is removed). */
export async function deleteSpecsByProject(projectId: string): Promise<number> {
  const all = await listSpecsByProject(projectId);
  for (const s of all) await deleteSpec(s.id);
  return all.length;
}

/** One-time migration of legacy localStorage spec library into IndexedDB.
 *  - Idempotent (uses a migration flag)
 *  - Dedupes against existing IndexedDB specs by id and specNumber
 *  - Marks migrated entries with `legacyImported: true`
 *  - Does NOT delete the legacy localStorage key
 */
export async function migrateLegacySpecsFromLocalStorage(): Promise<number> {
  const KEY = "pipepal-spec-library";
  const FLAG = "pipepal-spec-library-migrated-v1";
  if (localStorage.getItem(FLAG)) return 0;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) { localStorage.setItem(FLAG, "1"); return 0; }
    const arr = JSON.parse(raw) as LocalSpec[];
    const existing = await listSpecs();
    const existingIds = new Set(existing.map(s => s.id));
    const existingNums = new Set(existing.map(s => s.specNumber));
    let n = 0;
    for (const s of arr) {
      if (existingIds.has(s.id) || existingNums.has(s.specNumber)) continue;
      await saveSpec({ ...s, legacyImported: true, updatedAt: s.updatedAt ?? s.createdAt });
      n++;
    }
    localStorage.setItem(FLAG, "1");
    return n;
  } catch {
    return 0;
  }
}

// ============ Sync metadata ============

export async function getSyncMeta(): Promise<SyncMeta> {
  const rec = await tx<{ key: string; value: SyncMeta } | undefined>(
    STORE_META, "readonly", s => s.get("sync") as IDBRequest<{ key: string; value: SyncMeta } | undefined>
  );
  return rec?.value ?? {};
}

export async function setSyncMeta(meta: SyncMeta): Promise<void> {
  await tx<IDBValidKey>(STORE_META, "readwrite", s => s.put({ key: "sync", value: meta }));
}
