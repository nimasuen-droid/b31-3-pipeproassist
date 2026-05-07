import { useDesignInputs, type OverrideKeys } from "@/stores/designInputsStore";
import { PIPE_MATERIALS, FLANGE_MATERIALS, FITTING_MATERIALS, BOLT_MATERIALS, GASKET_TYPES } from "./designInputs/materialDatabase";
import { EngineeringDisclaimer } from "../EngineeringDisclaimer";
import { LearningMoment } from "../LearningMoment";
import { AlertTriangle, CheckCircle2, Info, Pencil, RotateCcw, Star, ShieldCheck, ShieldX } from "lucide-react";
import { TeachBadge } from "../TeachBadge";
import { OverrideExplanationPanel } from "../OverrideExplanationPanel";
import { getOverrideExplanation } from "./designInputs/overrideExplanationEngine";
import type { MaterialRecommendation, ClassifiedOption, MaterialTier } from "./designInputs/recommendationEngine";
import { normalizePressureToBar } from "@/lib/unitConversion";

const TIER_STYLES: Record<MaterialTier, { icon: typeof Star; color: string; bg: string; border: string }> = {
  "Best Match": { icon: Star, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
  "Recommended": { icon: ShieldCheck, color: "text-green-600", bg: "bg-green-500/10", border: "border-green-500/30" },
  "Alternative": { icon: Info, color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  "Not Permissible": { icon: ShieldX, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
};

function TierBadge({ tier }: { tier: MaterialTier }) {
  const style = TIER_STYLES[tier];
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded ${style.color} ${style.bg} border ${style.border}`}>
      <Icon className="h-2.5 w-2.5" />
      {tier}
    </span>
  );
}

function buildClassifiedLabel(designation: string, classifiedOptions: ClassifiedOption[]): string {
  const opt = classifiedOptions.find(o => o.designation === designation);
  if (!opt) return designation;
  if (opt.tier === "Best Match") return `★ ${designation} (Best Match)`;
  return `${designation} (${opt.tier})`;
}

function MatCard({ title, designation, reason, source, confidence, tempRange, fieldKey, recommendation }: {
  title: string; designation: string; reason: string; source: string;
  confidence: string; tempRange?: string;
  fieldKey: OverrideKeys; recommendation: MaterialRecommendation;
}) {
  const { inputs, overrides, toggleOverride, update, recommendations } = useDesignInputs();
  const isOverridden = overrides[fieldKey];
  const activeValue = isOverridden ? inputs[fieldKey] : designation;
  const classified = recommendation.classifiedOptions || [];

  // Find classification for active selection
  const activeClassified = classified.find(o => o.designation === activeValue);
  const bestClassified = classified.find(o => o.designation === designation);

  // Compute context for override explanation
  const tempC = inputs.unitSystem === "SI"
    ? parseFloat(inputs.designTemperature) || 0
    : ((parseFloat(inputs.designTemperature) || 0) - 32) * 5 / 9;
  const pressureBar = normalizePressureToBar(inputs.designPressure, inputs.unitSystem === "Imperial" ? "Imperial" : "SI");
  const flangeClassNum = recommendations.flangeClass ? parseInt(recommendations.flangeClass.value) || 0 : 0;

  const overrideExplanation = isOverridden
    ? getOverrideExplanation(title, designation, reason, inputs[fieldKey], {
        tempC, pressureBar, serviceType: inputs.serviceType, flangeClassNum
      })
    : null;

  const isNotPermissible = activeClassified?.tier === "Not Permissible";
  const isAlternative = activeClassified?.tier === "Alternative";

  return (
    <div className={`eng-card ${isNotPermissible ? "border-destructive/30" : isAlternative ? "border-amber-500/30" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="eng-label">{title}</span>
        <div className="flex items-center gap-2">
          {activeClassified && <TierBadge tier={activeClassified.tier} />}
          <button
            onClick={() => toggleOverride(fieldKey)}
            className="p-1 rounded hover:bg-secondary transition-colors"
            title={isOverridden ? "Revert to recommended" : "Override selection"}
          >
            {isOverridden ? <RotateCcw className="h-3 w-3 text-amber-500" /> : <Pencil className="h-3 w-3 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {isOverridden ? (
        <>
          <select
            value={inputs[fieldKey]}
            onChange={(e) => update(fieldKey)(e.target.value)}
            className={`w-full text-sm font-mono font-semibold bg-secondary border rounded px-2 py-1 mb-1 eng-select ${
              isNotPermissible ? "border-destructive/50" : isAlternative ? "border-amber-500/50" : "border-amber-500/30"
            }`}
          >
            {classified.map(opt => (
              <option key={opt.designation} value={opt.designation}>
                {buildClassifiedLabel(opt.designation, classified)}
              </option>
            ))}
          </select>

          {/* Show tier justification for selected material */}
          {activeClassified && inputs[fieldKey] !== designation && (
            <div className={`mt-1.5 rounded px-2.5 py-1.5 text-[10px] flex items-start gap-1.5 border ${
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
                <span className="font-semibold">{activeClassified.tier}: </span>
                <span>{activeClassified.reason}</span>
                <div className="mt-1">
                  <span className="font-semibold">System recommends: </span>
                  <span className="font-mono">{designation}</span>
                  {bestClassified && (
                    <span className="text-muted-foreground ml-1">— {bestClassified.reason.split(".")[0]}.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2 mb-1">
          <Star className="h-3 w-3 text-accent fill-accent shrink-0" />
          <span className="text-sm font-mono font-semibold text-foreground">{activeValue || "—"}</span>
          {activeValue && <TeachBadge materialId={activeValue} label="Why?" />}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{reason}</p>
      {tempRange && <div className="text-[10px] text-muted-foreground">Range: {tempRange}</div>}
      <div className="text-[9px] font-mono text-primary mt-1">{source}</div>

      {/* Classified alternatives summary (when not overridden) */}
      {!isOverridden && classified.length > 1 && (
        <div className="mt-2 border-t border-border pt-2 space-y-1">
          {(["Recommended", "Alternative"] as MaterialTier[]).map(tier => {
            const tierOpts = classified.filter(o => o.tier === tier);
            if (tierOpts.length === 0) return null;
            return (
              <div key={tier}>
                <div className="text-[10px] text-muted-foreground mb-0.5">{tier} ({tierOpts.length})</div>
                <div className="flex flex-wrap gap-1">
                  {tierOpts.slice(0, 4).map(a => {
                    const style = TIER_STYLES[tier];
                    return (
                      <span key={a.designation} className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${style.bg} ${style.border} ${style.color}`} title={a.reason}>
                        {a.designation}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {overrideExplanation && <OverrideExplanationPanel explanation={overrideExplanation} fieldLabel={title} />}
    </div>
  );
}

export function MaterialSelectionModule() {
  const { inputs, recommendations, activePipeMaterial, calculated } = useDesignInputs();

  if (!calculated) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Material Selection</h2>
        <div className="eng-card border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Design inputs required</p>
              <p className="text-xs text-muted-foreground mt-1">
                Go to the <strong>Inputs</strong> tab, fill in service type, design conditions, and pipe material, then click <strong>Calculate & Recommend</strong>.
                All material selections will auto-populate here.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pipeSpec = PIPE_MATERIALS.find(p => p.designation === activePipeMaterial);
  const flangeSpec = FLANGE_MATERIALS.find(f => f.designation === recommendations.flangeMaterial.value);
  const fittingSpec = FITTING_MATERIALS.find(f => f.designation === recommendations.fittingMaterial.value);
  const boltSpec = BOLT_MATERIALS.find(b => b.designation === recommendations.boltMaterial.value);
  const gasketSpec = GASKET_TYPES.find(g => g.designation === recommendations.gasketType.value);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Material Selection</h2>
        <p className="text-sm text-muted-foreground">
          Auto-populated from Design Inputs • Service: {inputs.serviceType} • {inputs.designTemperature}{inputs.unitSystem === "SI" ? "°C" : "°F"} / {inputs.designPressure} {inputs.unitSystem === "SI" ? "barg" : "psig"}
        </p>
      </div>

      {/* Classification Legend */}
      <div className="eng-card border-border/50 bg-muted/30">
        <div className="text-[10px] font-medium text-muted-foreground mb-1.5">Material Classification Legend</div>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(TIER_STYLES) as [MaterialTier, typeof TIER_STYLES["Best Match"]][]).map(([tier, style]) => {
            const Icon = style.icon;
            const desc = tier === "Best Match" ? "Optimal for service conditions"
              : tier === "Recommended" ? "Compatible and code-compliant"
              : tier === "Alternative" ? "Acceptable but not primary match"
              : "Outside allowable limits";
            return (
              <div key={tier} className={`flex items-center gap-1 text-[9px] px-2 py-1 rounded border ${style.bg} ${style.border} ${style.color}`}>
                <Icon className="h-2.5 w-2.5" />
                <span className="font-semibold">{tier}</span>
                <span className="text-muted-foreground">— {desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="eng-card border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Material Set Summary</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
          <div><span className="text-muted-foreground">Pipe:</span> <span className="font-mono font-medium">{activePipeMaterial}</span></div>
          <div><span className="text-muted-foreground">Flange:</span> <span className="font-mono font-medium">{recommendations.flangeMaterial.value}</span></div>
          <div><span className="text-muted-foreground">Fitting:</span> <span className="font-mono font-medium">{recommendations.fittingMaterial.value}</span></div>
          <div><span className="text-muted-foreground">Bolt:</span> <span className="font-mono font-medium">{recommendations.boltMaterial.value}</span></div>
          <div><span className="text-muted-foreground">Gasket:</span> <span className="font-mono font-medium">{recommendations.gasketType.value}</span></div>
        </div>
        <div className="mt-2 pt-2 border-t border-border text-[11px]">
          <span className="text-muted-foreground">Flange Facing:</span>{" "}
          <span className="font-mono font-semibold">{recommendations.flangeFacing.value}</span>
          <span className="text-muted-foreground ml-2">— {recommendations.flangeFacing.reason.split(".")[0]}.</span>
        </div>
      </div>

      {/* Material Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MatCard
          title="Pipe Material (Primary)"
          designation={activePipeMaterial}
          reason={recommendations.pipeMaterial.reason}
          source={recommendations.pipeMaterial.source}
          confidence={recommendations.pipeMaterial.confidence}
          tempRange={pipeSpec ? `${pipeSpec.minTempC}°C to ${pipeSpec.maxTempC}°C` : undefined}
          fieldKey="pipeMaterial"
          recommendation={recommendations.pipeMaterial}
        />
        <MatCard
          title="Flange Material"
          designation={recommendations.flangeMaterial.value}
          reason={recommendations.flangeMaterial.reason}
          source={recommendations.flangeMaterial.source}
          confidence={recommendations.flangeMaterial.confidence}
          tempRange={flangeSpec ? `${flangeSpec.minTempC}°C to ${flangeSpec.maxTempC}°C` : undefined}
          fieldKey="flangeMaterial"
          recommendation={recommendations.flangeMaterial}
        />
        <MatCard
          title="Fitting Material"
          designation={recommendations.fittingMaterial.value}
          reason={recommendations.fittingMaterial.reason}
          source={recommendations.fittingMaterial.source}
          confidence={recommendations.fittingMaterial.confidence}
          tempRange={fittingSpec ? `${fittingSpec.minTempC}°C to ${fittingSpec.maxTempC}°C` : undefined}
          fieldKey="fittingMaterial"
          recommendation={recommendations.fittingMaterial}
        />
        <MatCard
          title="Bolt Material"
          designation={recommendations.boltMaterial.value}
          reason={recommendations.boltMaterial.reason}
          source={recommendations.boltMaterial.source}
          confidence={recommendations.boltMaterial.confidence}
          tempRange={boltSpec ? `${boltSpec.minTempC}°C to ${boltSpec.maxTempC}°C` : undefined}
          fieldKey="boltMaterial"
          recommendation={recommendations.boltMaterial}
        />
        <MatCard
          title="Gasket Type / Material"
          designation={recommendations.gasketType.value}
          reason={recommendations.gasketType.reason}
          source={recommendations.gasketType.source}
          confidence={recommendations.gasketType.confidence}
          tempRange={gasketSpec ? `${gasketSpec.minTempC}°C to ${gasketSpec.maxTempC}°C` : undefined}
          fieldKey="gasketType"
          recommendation={recommendations.gasketType}
        />
      </div>

      {/* Allowable Stress from source tables */}
      {recommendations.allowableStress && (
        <div className="eng-card">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-3.5 w-3.5 text-primary" />
            <span className="eng-label">Allowable Stress (S) — from Source Table</span>
            <TeachBadge refId="SecIID-Table1A" label="§II-D Table 1A" />
          </div>
          <div className="text-sm font-mono font-semibold">{recommendations.allowableStress.displayValue}</div>
          <p className="text-[10px] text-muted-foreground mt-1">{recommendations.allowableStress.reason}</p>
          <div className="text-[9px] font-mono text-primary mt-0.5">{recommendations.allowableStress.tableRef}</div>
        </div>
      )}

      <LearningMoment
        title="The four temperature regimes"
        principle="Material choice follows temperature: below −29°C (−20°F) carbon steel becomes brittle — switch to impact-tested LTCS (A333) or stainless. From ambient to ~425°C carbon steel (A106-B, A105) is cheap and capable. Above ~425°C creep dominates and chromium-moly alloys (A335 P11/P22/P91) maintain strength. Above ~600°C or in oxidizing/corrosive service, austenitic stainless (304/316/321) takes over. Within each band, the fluid (sour, chloride, hydrogen, cryogenic) and economics decide the specific grade."
        reference="ASME B31.3 §323 • Sec II Part D allowable stress tables"
      />

      <EngineeringDisclaimer />
    </div>
  );
}
