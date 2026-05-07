/**
 * Cloud sync layer (optional). Wraps Supabase calls and reconciles with IndexedDB.
 * Local store remains source of truth.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  listProjects, upsertFromCloud, markSynced, setSyncMeta, getSyncMeta,
  listSpecs, saveSpec, getSpec, markSpecSynced,
  type LocalProject, type LocalSpec,
} from "./localProjectStore";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SyncResult = {
  pushed: number;
  pulled: number;
  conflicts: string[]; // project ids
  errors: string[];
};

/** Pull all cloud projects into local DB. Flags conflicts; does not auto-overwrite local edits. */
export async function pullFromCloud(userId: string): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, conflicts: [], errors: [] };
  const { data, error } = await supabase
    .from("saved_projects")
    .select("*")
    .eq("user_id", userId);
  if (error) { result.errors.push(error.message); return result; }
  for (const row of data ?? []) {
    try {
      const { conflict } = await upsertFromCloud(row as Parameters<typeof upsertFromCloud>[0]);
      if (conflict) result.conflicts.push(row.id);
      else result.pulled++;
    } catch (e) {
      result.errors.push(String(e));
    }
  }
  return result;
}

/** Push all local-only / pending projects up to cloud. Skips conflicts. */
export async function pushToCloud(userId: string): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, conflicts: [], errors: [] };
  const all = await listProjects();
  for (const p of all) {
    if (p.syncStatus === "synced") continue;
    if (p.syncStatus === "conflict") { result.conflicts.push(p.id); continue; }
    try {
      const payload = {
        id: p.id,
        user_id: userId,
        name: p.name,
        description: p.description,
        design_inputs: JSON.parse(JSON.stringify(p.designInputs)) as Json,
        overrides: JSON.parse(JSON.stringify(p.overrides)) as Json,
        updated_at: p.updatedAt,
      };
      const { data, error } = await supabase
        .from("saved_projects")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();
      if (error) { result.errors.push(`${p.name}: ${error.message}`); continue; }
      await markSynced(p.id, data.updated_at);
      result.pushed++;
    } catch (e) {
      result.errors.push(`${p.name}: ${String(e)}`);
    }
  }
  return result;
}

/** Pull all cloud specs into local DB. Cloud is source of truth (last-write-wins by updated_at). */
export async function pullSpecsFromCloud(userId: string): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, conflicts: [], errors: [] };
  const { data, error } = await supabase
    .from("saved_specs")
    .select("*")
    .eq("user_id", userId);
  if (error) {
    result.errors.push(`specs pull: ${error.message}`);
    return result;
  }
  for (const row of data ?? []) {
    try {
      const local = await getSpec(row.id);
      const cloudSpec: LocalSpec = {
        id: row.id,
        projectId: row.project_id ?? undefined,
        specNumber: row.spec_number,
        specName: row.spec_name,
        materialGroup: row.material_group,
        flangeRating: row.flange_rating,
        scheduleBand: row.schedule_band,
        serviceType: row.service_type,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        data: row.data,
        designInputs: row.design_inputs as unknown as LocalSpec["designInputs"],
        overrides: row.overrides as unknown as LocalSpec["overrides"],
        cloudUpdatedAt: row.updated_at,
        syncStatus: "synced",
      };

      if (!local) {
        await saveSpec(cloudSpec);
        result.pulled++;
        continue;
      }

      const baseline = local.cloudUpdatedAt ?? "";
      const localTs = local.updatedAt ?? local.createdAt;
      const localNewer = localTs > baseline;
      const cloudNewer = row.updated_at > baseline;
      if (localNewer && cloudNewer && localTs !== row.updated_at) {
        await saveSpec({ ...local, syncStatus: "conflict", cloudUpdatedAt: row.updated_at });
        result.conflicts.push(row.id);
        continue;
      }

      if (localTs > row.updated_at) continue; // local newer, will push

      await saveSpec(cloudSpec);
      result.pulled++;
    } catch (e) {
      result.errors.push(`spec ${row.id}: ${String(e)}`);
    }
  }
  return result;
}

/** Push pending / local-only specs to cloud. */
export async function pushSpecsToCloud(userId: string): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, conflicts: [], errors: [] };
  const all = await listSpecs();
  for (const s of all) {
    if (s.syncStatus === "synced") continue;
    if (s.syncStatus === "conflict") { result.conflicts.push(s.id); continue; }
    if (!UUID_RE.test(s.id)) {
      result.errors.push(`spec "${s.specNumber}" has legacy id, skipped`);
      continue;
    }
    if (s.projectId && !UUID_RE.test(s.projectId)) {
      result.errors.push(`spec "${s.specNumber}" has legacy project id, skipped`);
      continue;
    }
    try {
      const payload = {
        id: s.id,
        user_id: userId,
        project_id: s.projectId ?? null,
        spec_number: s.specNumber,
        spec_name: s.specName ?? "",
        material_group: s.materialGroup ?? "",
        flange_rating: s.flangeRating ?? "",
        schedule_band: s.scheduleBand ?? "",
        service_type: s.serviceType ?? "",
        data: JSON.parse(JSON.stringify(s.data ?? {})) as Json,
        design_inputs: JSON.parse(JSON.stringify(s.designInputs ?? {})) as Json,
        overrides: JSON.parse(JSON.stringify(s.overrides ?? {})) as Json,
        updated_at: s.updatedAt ?? s.createdAt,
      };
      const { data, error } = await supabase
        .from("saved_specs")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();
      if (error) { result.errors.push(`spec "${s.specNumber}": ${error.message}`); continue; }
      await markSpecSynced(s.id, data.updated_at);
      result.pushed++;
    } catch (e) {
      result.errors.push(`spec "${s.specNumber}": ${String(e)}`);
    }
  }
  return result;
}

/** Force-resolve a spec conflict by choosing local (push) or cloud (pull). */
export async function resolveSpecConflict(
  userId: string,
  specId: string,
  choice: "local" | "cloud"
): Promise<void> {
  const local = await getSpec(specId);
  if (!local && choice === "local") throw new Error("Spec not found locally");
  if (choice === "local" && local) {
    const payload = {
      id: local.id,
      user_id: userId,
      project_id: local.projectId ?? null,
      spec_number: local.specNumber,
      spec_name: local.specName ?? "",
      material_group: local.materialGroup ?? "",
      flange_rating: local.flangeRating ?? "",
      schedule_band: local.scheduleBand ?? "",
      service_type: local.serviceType ?? "",
      data: JSON.parse(JSON.stringify(local.data ?? {})) as Json,
      design_inputs: JSON.parse(JSON.stringify(local.designInputs ?? {})) as Json,
      overrides: JSON.parse(JSON.stringify(local.overrides ?? {})) as Json,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("saved_specs").upsert(payload, { onConflict: "id" })
      .select().single();
    if (error) throw error;
    await markSpecSynced(local.id, data.updated_at);
  } else {
    const { data, error } = await supabase
      .from("saved_specs").select("*").eq("id", specId).single();
    if (error) throw error;
    const cloudSpec: LocalSpec = {
      id: data.id,
      projectId: data.project_id ?? undefined,
      specNumber: data.spec_number,
      specName: data.spec_name,
      materialGroup: data.material_group,
      flangeRating: data.flange_rating,
      scheduleBand: data.schedule_band,
      serviceType: data.service_type,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      data: data.data,
      designInputs: data.design_inputs as unknown as LocalSpec["designInputs"],
      overrides: data.overrides as unknown as LocalSpec["overrides"],
      cloudUpdatedAt: data.updated_at,
      syncStatus: "synced",
    };
    await saveSpec(cloudSpec);
  }
}

/** Full bidirectional sync: pull, then push. */
export async function syncAll(userId: string): Promise<SyncResult> {
  const pull = await pullFromCloud(userId);
  const push = await pushToCloud(userId);
  const specsPull = await pullSpecsFromCloud(userId);
  const specsPush = await pushSpecsToCloud(userId);
  const merged: SyncResult = {
    pushed: push.pushed + specsPush.pushed,
    pulled: pull.pulled + specsPull.pulled,
    conflicts: [...new Set([...pull.conflicts, ...push.conflicts, ...specsPull.conflicts, ...specsPush.conflicts])],
    errors: [...pull.errors, ...push.errors, ...specsPull.errors, ...specsPush.errors],
  };
  await setSyncMeta({
    lastSyncAt: new Date().toISOString(),
    lastSyncStatus: merged.errors.length ? (merged.pushed + merged.pulled > 0 ? "partial" : "error") : "ok",
    lastSyncMessage: merged.errors[0],
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pipepal:sync-complete", { detail: merged }));
  }
  return merged;
}

/** Force-resolve a conflict by choosing local (push) or cloud (pull) version. */
export async function resolveConflict(
  userId: string,
  projectId: string,
  choice: "local" | "cloud"
): Promise<void> {
  if (choice === "local") {
    const local = (await listProjects()).find(p => p.id === projectId);
    if (!local) return;
    const payload = {
      id: local.id,
      user_id: userId,
      name: local.name,
      description: local.description,
      design_inputs: JSON.parse(JSON.stringify(local.designInputs)) as Json,
      overrides: JSON.parse(JSON.stringify(local.overrides)) as Json,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("saved_projects")
      .upsert(payload, { onConflict: "id" })
      .select().single();
    if (error) throw error;
    await markSynced(local.id, data.updated_at);
  } else {
    const { data, error } = await supabase
      .from("saved_projects")
      .select("*").eq("id", projectId).single();
    if (error) throw error;
    await upsertFromCloud(data as Parameters<typeof upsertFromCloud>[0]);
    // Force overwrite by clearing conflict flag via a fresh upsert
    await markSynced(projectId, data.updated_at);
  }
}

export { getSyncMeta };
