import { BriefcaseBusiness, Sparkles, AlertTriangle, Info, Crown } from "lucide-react";
import { useEntitlements, RESTRICTED_MESSAGE } from "@/hooks/useEntitlements";

interface PaidGateProps {
  /** Tab/module id (must match the id used in Index.tsx tabs) */
  moduleId: string;
  /** Friendly module name for the prompt */
  moduleName: string;
  children: React.ReactNode;
  /** Optional handler to navigate the user back to Inputs. */
  onGoToInputs?: () => void;
  /** Optional handler reserved for future pricing/access pages. */
  onGoToPricing?: () => void;
}

/**
 * Wraps a module that may be entitlement-gated in a future paid rollout.
 * In the free launch build, every app module is included in FREE_MODULE_IDS.
 */
export function PaidGate({ moduleId, moduleName, children, onGoToInputs, onGoToPricing }: PaidGateProps) {
  const { canAccessModule, blockReason, demoRunsRemaining, demoRunsLimit, isPaid } = useEntitlements();

  if (canAccessModule(moduleId)) {
    return (
      <>
        {!isPaid && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-200 print:hidden">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              <span>Reference engineering dataset workspace. Editing or importing data moves the session into a custom workspace.</span>
            </div>
            {Number.isFinite(demoRunsLimit) && (
              <span className="font-mono">
                {demoRunsRemaining}/{demoRunsLimit} runs left
              </span>
            )}
          </div>
        )}
        {children}
      </>
    );
  }

  const reason = blockReason(moduleId);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/20 p-2 text-primary">
            <BriefcaseBusiness className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {moduleName} - Free Launch Access
              </h2>
              <p className="text-xs text-muted-foreground">This module is available in the free launch build.</p>
            </div>

            <div className="whitespace-pre-line text-sm text-foreground/90 leading-relaxed">
              {RESTRICTED_MESSAGE}
            </div>

            {reason === "sample-edited" && (
              <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>The reference dataset has been edited. Reload the Default Engineering Dataset, or continue in a licensed/custom workspace.</span>
              </div>
            )}
            {reason === "demo-exhausted" && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>The reference-workflow run limit has been reached. Free launch access should bypass this message; refresh the app and try again.</span>
              </div>
            )}
            {reason === "needs-sample" && Number.isFinite(demoRunsLimit) && (
              <div className="text-xs text-muted-foreground">
                Reference workflow runs remaining once the default dataset is loaded:{" "}
                <span className="font-mono text-foreground">{demoRunsRemaining}/{demoRunsLimit}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {onGoToInputs && (
                <button
                  onClick={onGoToInputs}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Go to Inputs &amp; Load Sample Data
                </button>
              )}
              <button
                onClick={onGoToPricing}
                disabled={!onGoToPricing}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-gradient-to-r from-primary to-primary/80 px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Crown className="h-3.5 w-3.5" />
                Access Info
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
