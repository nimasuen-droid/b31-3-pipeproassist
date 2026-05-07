import { useEffect, useRef, useState } from "react";

/**
 * Persistent useState backed by window.localStorage.
 *
 * - SSR / no-window safe (falls back to initialValue on the server).
 * - Reads once on mount; writes on every state change.
 * - Versioned: bumping the `version` arg invalidates older stored payloads
 *   (use this when the shape of T changes incompatibly).
 * - Quota / parse errors are swallowed so a corrupt entry never breaks the UI.
 *
 * Usage:
 *   const [tab, setTab] = useLocalStorage("ui:active-tab", "home");
 *   const [inputs, setInputs] = useLocalStorage("session:inputs", defaultInputs, 2);
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  version = 1,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const storageKey = `b313:v${version}:${key}`;

  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw == null) return initialValue;
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  });

  // Avoid an immediate write on first mount when the value is unchanged
  const isFirstWrite = useRef(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isFirstWrite.current) {
      isFirstWrite.current = false;
      // Still write so any defaults get persisted for cross-tab consistency
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage disabled — silently ignore
    }
  }, [storageKey, value]);

  return [value, setValue];
}
