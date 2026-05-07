import { Pencil, RotateCcw, Star, AlertTriangle, ShieldX, ShieldCheck, Info } from "lucide-react";
import { ReferenceBadge } from "@/components/ReferenceBadge";
import { TeachTooltip } from "@/components/TeachTooltip";
import type { CalculationTrace } from "@/stores/sourceRegistry";
import type { FieldDefinition } from "./fieldDefinitions";
import type { ClassifiedOption, MaterialTier } from "./recommendationEngine";

const TIER_CONFIG: Record<MaterialTier, { icon: typeof Star; label: string; color: string; bgColor: string; borderColor: string }> = {
  "Best Match": { icon: Star, label: "Best Match", color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/30" },
  "Recommended": { icon: ShieldCheck, label: "Recommended", color: "text-green-600", bgColor: "bg-green-500/10", borderColor: "border-green-500/30" },
  "Alternative": { icon: Info, label: "Alternative", color: "text-amber-600", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30" },
  "Not Permissible": { icon: ShieldX, label: "Not Permissible", color: "text-destructive", bgColor: "bg-destructive/10", borderColor: "border-destructive/30" },
};

function getTierForDesignation(designation: string, classifiedOptions?: ClassifiedOption[]): ClassifiedOption | undefined {
  return classifiedOptions?.find(o => o.designation === designation);
}

function buildClassifiedLabel(designation: string, classifiedOptions?: ClassifiedOption[]): string {
  const opt = getTierForDesignation(designation, classifiedOptions);
  if (!opt) return designation;
  if (opt.tier === "Best Match") return `★ ${designation} (Best Match)`;
  return `${designation} (${opt.tier})`;
}

interface SmartInputFieldProps {
  label: string;
  value: string;
  recommendedValue: string;
  isOverridden: boolean;
  onToggleOverride: () => void;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  unit?: string;
  confidence?: string;
  trace?: CalculationTrace;
  fieldDef?: FieldDefinition;
  classifiedOptions?: ClassifiedOption[];
}

export function SmartInputField({
  label, value, recommendedValue, isOverridden, onToggleOverride, onChange,
  type = "text", placeholder, unit, confidence, trace, fieldDef,
}: SmartInputFieldProps) {
  const displayValue = isOverridden ? value : recommendedValue;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <label className="eng-label">{label}</label>
          {fieldDef && <TeachTooltip definition={fieldDef} />}
          {trace && <ReferenceBadge trace={trace} compact />}
        </div>
        {confidence && !isOverridden && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
            {confidence}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <div className="relative flex-1">
          <input
            type={type}
            value={displayValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={!isOverridden}
            className={`eng-input pr-8 ${!isOverridden ? "bg-primary/5 border-primary/30" : "border-accent/50 bg-accent/5"}`}
          />
          <button
            type="button"
            onClick={onToggleOverride}
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
              isOverridden
                ? "text-accent hover:text-accent/70"
                : "text-muted-foreground hover:text-primary"
            }`}
            title={isOverridden ? "Revert to recommendation" : "Override manually"}
          >
            {isOverridden ? <RotateCcw className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
          </button>
        </div>
        {unit && <span className="text-[10px] text-muted-foreground w-10 shrink-0 text-right">{unit}</span>}
      </div>
      <div className="mt-0.5 h-3.5">
        {isOverridden ? (
          <span className="text-[9px] text-accent font-medium flex items-center gap-1">
            <Pencil className="h-2.5 w-2.5" /> Manual override — click ↺ to revert
          </span>
        ) : recommendedValue ? (
          <span className="text-[9px] text-primary">Auto-recommended — click ✎ to override</span>
        ) : null}
      </div>
    </div>
  );
}

interface SmartSelectFieldProps {
  label: string;
  value: string;
  recommendedValue: string;
  isOverridden: boolean;
  onToggleOverride: () => void;
  onChange: (v: string) => void;
  options: string[];
  confidence?: string;
  trace?: CalculationTrace;
  fieldDef?: FieldDefinition;
  classifiedOptions?: ClassifiedOption[];
}

export function SmartSelectField({
  label, value, recommendedValue, isOverridden, onToggleOverride, onChange, options, confidence, trace, fieldDef, classifiedOptions,
}: SmartSelectFieldProps) {
  const displayValue = isOverridden ? value : recommendedValue;

  // Check if current override diverges from recommendation
  const isDiverged = isOverridden && displayValue !== recommendedValue;
  const selectedClassified = getTierForDesignation(displayValue, classifiedOptions);
  const recommendedClassified = getTierForDesignation(recommendedValue, classifiedOptions);

  // Determine warning severity based on tier
  const isNotPermissible = selectedClassified?.tier === "Not Permissible";
  const isAlternative = selectedClassified?.tier === "Alternative";

  // Build sorted options: Best Match → Recommended → Alternative → Not Permissible
  const sortedOptions = classifiedOptions && classifiedOptions.length > 0
    ? classifiedOptions.map(o => o.designation)
    : options;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <label className="eng-label">{label}</label>
          {fieldDef && <TeachTooltip definition={fieldDef} />}
          {trace && <ReferenceBadge trace={trace} compact />}
        </div>
        {confidence && !isOverridden && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
            {confidence}
          </span>
        )}
      </div>
      <div className="relative">
        <select
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={!isOverridden}
          className={`eng-select pr-8 ${!isOverridden ? "bg-primary/5 border-primary/30" : isNotPermissible ? "border-destructive/50 bg-destructive/5" : isAlternative ? "border-amber-500/50 bg-amber-500/5" : "border-accent/50 bg-accent/5"}`}
        >
          {sortedOptions.map((o) => (
            <option key={o} value={o}>{buildClassifiedLabel(o, classifiedOptions)}</option>
          ))}
          {!sortedOptions.includes(displayValue) && displayValue && (
            <option value={displayValue}>{displayValue}</option>
          )}
        </select>
        <button
          type="button"
          onClick={onToggleOverride}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
            isOverridden
              ? "text-accent hover:text-accent/70"
              : "text-muted-foreground hover:text-primary"
          }`}
          title={isOverridden ? "Revert to recommendation" : "Override manually"}
        >
          {isOverridden ? <RotateCcw className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
        </button>
      </div>

      {/* Override warning — color-coded by tier */}
      {isDiverged && selectedClassified && (
        <div className={`mt-1 rounded px-2 py-1.5 text-[9px] flex items-start gap-1.5 border ${
          isNotPermissible
            ? "border-destructive/40 bg-destructive/10 text-destructive"
            : isAlternative
            ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            : "border-accent/40 bg-accent/10 text-accent-foreground"
        }`}>
          {isNotPermissible
            ? <ShieldX className="h-3 w-3 mt-0.5 shrink-0" />
            : <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
          }
          <div>
            <span className="font-semibold">{selectedClassified.tier}: </span>
            <span>{selectedClassified.reason}</span>
            {recommendedValue && (
              <div className="mt-0.5">
                <span className="font-semibold">System recommends: </span>
                <span className="font-mono">{recommendedValue}</span>
                {recommendedClassified && (
                  <span className="text-muted-foreground ml-1">— {recommendedClassified.reason.split(".")[0]}.</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-0.5 h-3.5">
        {isOverridden && !isDiverged ? (
          <span className="text-[9px] text-accent font-medium flex items-center gap-1">
            <Pencil className="h-2.5 w-2.5" /> Manual override — click ↺ to revert
          </span>
        ) : !isOverridden && recommendedValue ? (
          <span className="text-[9px] text-primary flex items-center gap-1">
            <Star className="h-2.5 w-2.5 fill-primary" /> Auto-recommended — click ✎ to override
          </span>
        ) : null}
      </div>
    </div>
  );
}
