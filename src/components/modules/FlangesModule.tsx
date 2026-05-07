import { useDesignInputs } from "@/stores/designInputsStore";
import { EngineeringDisclaimer } from "../EngineeringDisclaimer";
import { LearningMoment } from "../LearningMoment";
import { AlertTriangle, CheckCircle2, Info, Layers, ShieldCheck } from "lucide-react";
import { TeachBadge } from "../TeachBadge";

const STANDARD_FITTINGS = [
  "90 deg Elbow (LR)",
  "45 deg Elbow",
  "Equal Tee",
  "Reducing Tee",
  "Concentric Reducer",
  "Eccentric Reducer",
  "Cap",
];

export function FlangesModule() {
  const { inputs, recommendations, activePipeMaterial, calculated } = useDesignInputs();

  if (!calculated) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Flanges & Fittings</h2>
        <div className="eng-card border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs text-muted-foreground">
              Go to <strong>Inputs</strong>, complete design conditions and material selection, then calculate recommendations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const flangeClass = recommendations.flangeClass;
  const exceeds = flangeClass?.value === "EXCEEDS";
  const tempUnit = inputs.unitSystem === "SI" ? "degC" : "degF";
  const pressureUnit = inputs.unitSystem === "SI" ? "barg" : "psig";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Flanges & Fittings</h2>
        <p className="text-sm text-muted-foreground">
          ASME B16.5 / B16.9 - {activePipeMaterial} - {inputs.designTemperature} {tempUnit} / {inputs.designPressure} {pressureUnit}
        </p>
      </div>

      <div className={`eng-card ${exceeds ? "border-destructive/30 bg-destructive/5" : "border-primary/20 bg-primary/5"}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              {exceeds ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-primary" />}
              <span className="text-sm font-medium">
                {flangeClass ? `Minimum Flange Class: ${flangeClass.displayValue}` : "Flange class not determined"}
              </span>
            </div>
            {flangeClass && (
              <>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{flangeClass.reason}</p>
                <div className="mt-1 text-[9px] font-mono text-primary">{flangeClass.tableRef}</div>
              </>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <TeachBadge calcId="flange-class" label="How?" />
            <TeachBadge refId="B16.5" label="B16.5" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="eng-card">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <div className="eng-label">Flange Material</div>
          </div>
          <div className="text-sm font-mono font-semibold">{recommendations.flangeMaterial.value}</div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{recommendations.flangeMaterial.reason}</p>
          <div className="mt-1 text-[9px] font-mono text-primary">{recommendations.flangeMaterial.source}</div>
        </div>

        <div className="eng-card">
          <div className="mb-2 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <div className="eng-label">Fitting Material</div>
          </div>
          <div className="text-sm font-mono font-semibold">{recommendations.fittingMaterial.value}</div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{recommendations.fittingMaterial.reason}</p>
          <div className="mt-1 text-[9px] font-mono text-primary">{recommendations.fittingMaterial.source}</div>
        </div>
      </div>

      <div className="eng-card">
        <div className="eng-label mb-3">Flange Specification</div>
        <div className="grid grid-cols-2 gap-2 text-[11px] md:grid-cols-3">
          {[
            ["Type", "Weld Neck (WN)"],
            ["Facing", recommendations.flangeFacing.value === "RTJ" ? "Ring Type Joint (RTJ)" : "Raised Face (RF)"],
            ["Material", recommendations.flangeMaterial.value],
            ["Class", flangeClass?.displayValue || "-"],
            ["NPS", inputs.nominalPipeSize || "-"],
            ["Bore", "To suit connected pipe schedule"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-border bg-secondary/30 p-2">
              <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
              <div className={`mt-1 font-mono text-xs font-medium ${label === "Facing" && recommendations.flangeFacing.value === "RTJ" ? "text-amber-500" : "text-foreground"}`}>
                {value}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-start gap-1 text-[10px] text-muted-foreground">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          {recommendations.flangeFacing.reason}
        </div>
        <div className="mt-1 text-[9px] font-mono text-primary">{recommendations.flangeFacing.source}</div>
      </div>

      <div className="eng-card">
        <div className="eng-label mb-3">Standard Fittings - ASME B16.9</div>
        <div className="table-scroll">
          <table className="eng-table min-w-[520px] text-[11px]">
            <thead>
              <tr><th>Component</th><th>Standard</th><th>Material</th><th>End</th></tr>
            </thead>
            <tbody>
              {STANDARD_FITTINGS.map(component => (
                <tr key={component}>
                  <td>{component}</td>
                  <td>B16.9</td>
                  <td className="font-mono">{recommendations.fittingMaterial.value}</td>
                  <td>BW</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {inputs.branchType !== "None" && (
          <div className="mt-3 flex items-start gap-1 rounded-md border border-amber-500/25 bg-amber-500/10 p-2 text-[10px] text-amber-500">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            Branch type "{inputs.branchType}" selected. Reinforcement check per ASME B31.3 304.3 may be required.
          </div>
        )}
      </div>

      <LearningMoment
        title="How flange class is chosen"
        principle="ASME B16.5 rates flanges by pressure class, but the class number is not the allowable pressure. Each class has a pressure-temperature curve by material group. The app picks the lowest class whose curve remains above the design pressure at the design temperature. RTJ facing is selected for high-pressure classes where metal ring seating is required by project or industry practice."
        reference="ASME B16.5 Tables 2-1 through 2-3; ASME B16.20 gasket selection"
      />

      <EngineeringDisclaimer />
    </div>
  );
}
