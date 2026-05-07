import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { OverrideExplanation } from "./modules/designInputs/overrideExplanationEngine";

interface Props {
  explanation: OverrideExplanation;
  fieldLabel: string;
}

export function OverrideExplanationPanel({ explanation, fieldLabel }: Props) {
  const VerdictIcon = explanation.verdict === "Acceptable" ? CheckCircle2
    : explanation.verdict === "Not Recommended" ? XCircle
    : explanation.verdict === "Conditionally Acceptable" ? AlertTriangle
    : Info;

  return (
    <div className="mt-2 rounded-md border border-border bg-muted/30 p-3 space-y-2 text-[11px]">
      <div className="flex items-center gap-2">
        <VerdictIcon className={`h-4 w-4 shrink-0 ${explanation.verdictColor}`} />
        <span className={`font-semibold text-xs ${explanation.verdictColor}`}>
          Override: {explanation.verdict}
        </span>
      </div>

      {/* System recommendation */}
      <div className="bg-primary/5 border border-primary/10 rounded p-2">
        <div className="text-[10px] text-muted-foreground font-medium mb-0.5">System Recommended: {fieldLabel}</div>
        <div className="font-mono font-semibold text-foreground">{explanation.systemRecommended}</div>
        <p className="text-muted-foreground leading-relaxed mt-0.5">{explanation.systemReason}</p>
      </div>

      {/* User override */}
      <div className="bg-secondary/50 border border-border rounded p-2">
        <div className="text-[10px] text-muted-foreground font-medium mb-0.5">Your Selection</div>
        <div className="font-mono font-semibold text-foreground">{explanation.userSelected}</div>
      </div>

      {/* Explanation */}
      <p className="text-muted-foreground leading-relaxed">{explanation.explanation}</p>

      {/* Engineering considerations */}
      {explanation.considerations.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] font-medium text-muted-foreground">Engineering Considerations:</div>
          {explanation.considerations.map((c, i) => (
            <div key={i} className="text-[10px] text-muted-foreground leading-relaxed pl-1">
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
