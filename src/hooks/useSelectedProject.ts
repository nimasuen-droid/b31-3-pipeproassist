import { useEffect, useState, useCallback } from "react";
import { getProject, type LocalProject } from "@/lib/localProjectStore";

const KEY = "b313:v1:ui:selected-project-id";
const EVENT = "pipepal:selected-project-changed";

function readId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string | null) : null;
  } catch {
    return null;
  }
}

function writeId(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(id));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
  } catch {
    /* ignore */
  }
}

/**
 * Tracks the currently-selected project (folder) across the app.
 * - Persisted in localStorage so navigation between tabs keeps the selection.
 * - Cross-instance sync: a CustomEvent + storage event keeps every hook in sync.
 * - `selectedProjectId === null` means "no project open".
 */
export function useSelectedProjectId(): [string | null, (id: string | null) => void] {
  const [id, setId] = useState<string | null>(() => readId());

  useEffect(() => {
    const onCustom = (e: Event) => setId((e as CustomEvent<string | null>).detail ?? null);
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setId(readId()); };
    window.addEventListener(EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const set = useCallback((next: string | null) => {
    setId(next);
    writeId(next);
  }, []);

  return [id, set];
}

export function useSelectedProject(): {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedProject: LocalProject | null;
  reload: () => Promise<void>;
} {
  const [selectedProjectId, setSelectedProjectId] = useSelectedProjectId();
  const [selectedProject, setSelectedProject] = useState<LocalProject | null>(null);

  const reload = useCallback(async () => {
    if (!selectedProjectId) {
      setSelectedProject(null);
      return;
    }
    const p = await getProject(selectedProjectId);
    if (p) setSelectedProject(p);
    else {
      setSelectedProject(null);
      setSelectedProjectId(null);
    }
  }, [selectedProjectId, setSelectedProjectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Refresh when projects change elsewhere (rename, update, delete)
  useEffect(() => {
    const fn = () => reload();
    window.addEventListener("pipepal:projects-changed", fn);
    return () => window.removeEventListener("pipepal:projects-changed", fn);
  }, [reload]);

  return { selectedProjectId, setSelectedProjectId, selectedProject, reload };
}
