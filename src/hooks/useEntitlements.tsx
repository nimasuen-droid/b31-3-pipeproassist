import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDesignInputs, defaultInputs, type DesignInputs } from "@/stores/designInputsStore";
import { appEnv } from "@/lib/env";
import { resolvePaidEntitlement } from "@/lib/entitlements";

/** Modules that are FREE for all users (always accessible). */
export const FREE_MODULE_IDS = new Set<string>([
  "home",
  "projects",
  "inputs",
  "thickness",       // Wall Thickness — explicitly free per spec
  "source-library",
  "manual",
  "about",
  "eula",
  "pricing",         // Upgrade page is always accessible
]);

/** Demo run cap for free users. (Infinity = unlimited) */
export const DEMO_RUN_LIMIT = Infinity;

export const RESTRICTED_MESSAGE =
  "This module is available in a licensed engineering workspace.\n\n" +
  "To review the workflow with reference cases, go to Inputs and load the Default Engineering Dataset.\n\n" +
  "Custom imported or edited engineering datasets remain available in the free workspace for Wall Thickness calculations.";

type Tier = "free" | "paid";

interface EntitlementsContextType {
  tier: Tier;
  isPaid: boolean;
  /** True when the active session inputs originated from a default reference dataset action. */
  sampleDataMode: boolean;
  /** True when sample-loaded inputs have since been edited. */
  sampleDataModified: boolean;
  /** Free-tier demo runs consumed (calculate / generate presses on gated modules). */
  demoRunsUsed: number;
  demoRunsLimit: number;
  demoRunsRemaining: number;
  /** Local dev override (no payment system yet) — flips tier without auth. */
  devPaidOverride: boolean;
  setDevPaidOverride: (v: boolean) => void;
  /** Mark that the user just loaded a clean sample dataset. */
  markSampleLoaded: (snapshot: DesignInputs) => void;
  /** Clear sample mode (e.g., user pressed Clear All). */
  clearSampleMode: () => void;
  /** Returns true if the given tab/module id is accessible right now. */
  canAccessModule: (id: string) => boolean;
  /** Reason a gated module is blocked (for UI display). */
  blockReason: (id: string) => null | "not-paid" | "needs-sample" | "sample-edited" | "demo-exhausted";
  /** Record one demo run; returns true if allowed (and consumed), false if cap hit. */
  recordDemoRun: () => boolean;
  /** Reset demo runs counter (admin/testing). */
  resetDemoRuns: () => void;
}

const EntitlementsContext = createContext<EntitlementsContextType | null>(null);

/** Stable hash of just the editable design inputs for sample-modification detection. */
function hashInputs(i: DesignInputs): string {
  // JSON.stringify is deterministic enough for our shape; key order is fixed by the interface
  return JSON.stringify(i);
}

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { inputs } = useDesignInputs();

  const [hasPaidRole, setHasPaidRole] = useState(false);
  const [storedDevPaidOverride, setStoredDevPaidOverride] = useLocalStorage<boolean>("entitlement:dev-paid", false);
  const [demoRunsUsed, setDemoRunsUsed] = useLocalStorage<number>("entitlement:demo-runs", 0);
  const [sampleHash, setSampleHash] = useLocalStorage<string>("entitlement:sample-hash", "");

  // Look up paid role from user_roles when signed in, and live-refresh on changes
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setHasPaidRole(false);
      return;
    }
    const refresh = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["paid", "admin"]);
      if (!cancelled && !error) setHasPaidRole((data?.length ?? 0) > 0);
    };
    refresh();

    // Realtime: re-check whenever this user's server-backed roles change.
    const channel = supabase
      .channel(`entitlements:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles", filter: `user_id=eq.${user.id}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const devPaidOverride = appEnv.allowDevEntitlementOverride ? storedDevPaidOverride : false;
  const setDevPaidOverride = useCallback((enabled: boolean) => {
    setStoredDevPaidOverride(appEnv.allowDevEntitlementOverride ? enabled : false);
  }, [setStoredDevPaidOverride]);
  const isPaid = resolvePaidEntitlement({
    hasPaidRole,
    devPaidOverride: storedDevPaidOverride,
    allowDevOverride: appEnv.allowDevEntitlementOverride,
  });
  const tier: Tier = isPaid ? "paid" : "free";

  const sampleDataMode = sampleHash !== "";
  const sampleDataModified = sampleDataMode && hashInputs(inputs) !== sampleHash;

  const demoRunsRemaining = Math.max(0, DEMO_RUN_LIMIT - demoRunsUsed);

  const markSampleLoaded = useCallback((snapshot: DesignInputs) => {
    setSampleHash(hashInputs(snapshot));
  }, [setSampleHash]);

  const clearSampleMode = useCallback(() => {
    setSampleHash("");
  }, [setSampleHash]);

  const canAccessModule = useCallback((id: string): boolean => {
    if (FREE_MODULE_IDS.has(id)) return true;
    if (isPaid) return true;
    // Free user on a gated module: needs clean sample data + remaining runs
    if (!sampleDataMode) return false;
    if (sampleDataModified) return false;
    return demoRunsRemaining > 0;
  }, [isPaid, sampleDataMode, sampleDataModified, demoRunsRemaining]);

  const blockReason = useCallback((id: string): EntitlementsContextType["blockReason"] extends (x: any) => infer R ? R : never => {
    if (FREE_MODULE_IDS.has(id) || isPaid) return null;
    if (!sampleDataMode) return "needs-sample";
    if (sampleDataModified) return "sample-edited";
    if (demoRunsRemaining <= 0) return "demo-exhausted";
    return null;
  }, [isPaid, sampleDataMode, sampleDataModified, demoRunsRemaining]);

  const recordDemoRun = useCallback((): boolean => {
    if (isPaid) return true;
    if (demoRunsUsed >= DEMO_RUN_LIMIT) return false;
    setDemoRunsUsed((n) => n + 1);
    return true;
  }, [isPaid, demoRunsUsed, setDemoRunsUsed]);

  const resetDemoRuns = useCallback(() => setDemoRunsUsed(0), [setDemoRunsUsed]);

  const value = useMemo<EntitlementsContextType>(() => ({
    tier, isPaid,
    sampleDataMode, sampleDataModified,
    demoRunsUsed, demoRunsLimit: DEMO_RUN_LIMIT, demoRunsRemaining,
    devPaidOverride, setDevPaidOverride,
    markSampleLoaded, clearSampleMode,
    canAccessModule, blockReason,
    recordDemoRun, resetDemoRuns,
  }), [tier, isPaid, sampleDataMode, sampleDataModified, demoRunsUsed, demoRunsRemaining,
      devPaidOverride, setDevPaidOverride, markSampleLoaded, clearSampleMode,
      canAccessModule, blockReason, recordDemoRun, resetDemoRuns]);

  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements() {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) throw new Error("useEntitlements must be used within EntitlementsProvider");
  return ctx;
}

// Re-export for convenience
export { defaultInputs };
