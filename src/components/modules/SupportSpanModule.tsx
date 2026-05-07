import { useMemo } from "react";
import { useDesignInputs } from "@/stores/designInputsStore";
import { estimateSupportSpan } from "./designInputs/supportSpanEngine";
import { EngineeringDisclaimer } from "../EngineeringDisclaimer";
import { LearningMoment } from "../LearningMoment";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { TeachBadge } from "../TeachBadge";
import { normalizeLengthToMM, type UnitSystem } from "@/lib/unitConversion";

const FLUID_DENSITIES: Record<string, number> = {
  "Liquid": 850, "Gas": 5, "Two-Phase": 500, "Steam": 3, "Slurry": 1300,
};

const INSULATION_DENSITIES: Record<string, number> = {
  "None": 0, "Hot Insulation": 150, "Cold Insulation": 80, "Personnel Protection": 100, "Acoustic": 200,
};

export function SupportSpanModule() {
  const { inputs, recommendations, calculated } = useDesignInputs();

  const result = useMemo(() => {
    const nps = inputs.nominalPipeSize?.replace(/['"]/g, "").trim() || "";
    if (!nps || !recommendations.pipeOD) return null;

    const us = (inputs.unitSystem || "SI") as UnitSystem;
    const od_mm = normalizeLengthToMM(recommendations.pipeOD.value, us);
    if (od_mm <= 0) return null;

    // Find a representative schedule WT
    const schedules = recommendations.availableSchedules;
    // Use Sch 40 or first available
    const sch40 = schedules.find(s => s.schedule === "40");
    const wt_mm = sch40?.thickness_mm || schedules[0]?.thickness_mm || 0;
    if (wt_mm <= 0) return null;

    const fluidDensity = FLUID_DENSITIES[inputs.fluidPhase] || 850;
    const insThk = normalizeLengthToMM(inputs.insulationThickness, us);
    const insDensity = INSULATION_DENSITIES[inputs.insulationType] || 0;

    return estimateSupportSpan({
      nps: `${nps}"`,
      od_mm, wt_mm, pipeWeightPerMeter: 0,
      fluidDensity, insulationThickness_mm: insThk,
      insulationDensity: insDensity, fluidPhase: inputs.fluidPhase,
    });
  }, [inputs, recommendations]);

  if (!calculated) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Support Span</h2>
        <div className="eng-card border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Go to <strong>Inputs</strong> tab, enter NPS, insulation, and fluid details, then click <strong>Calculate & Recommend</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Support Span Estimation</h2>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Per ASME B31.1 Table 121.5 / MSS SP-69 • NPS {inputs.nominalPipeSize || "—"} • {inputs.fluidPhase}
          </p>
          <TeachBadge calcId="support-span" label="Learn calc" />
          <TeachBadge refId="MSS-SP69" label="SP-69" />
        </div>
      </div>

      {result ? (
        <>
          {/* Span Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="eng-card border-primary/20 bg-primary/5 text-center">
              <div className="eng-label mb-1">Empty Span</div>
              <div className="text-xl font-mono font-bold text-foreground">{result.emptySpan_m.toFixed(1)} m</div>
              <div className="text-[11px] text-muted-foreground">{result.emptySpan_ft.toFixed(0)} ft</div>
            </div>
            <div className="eng-card border-primary/20 bg-primary/5 text-center">
              <div className="eng-label mb-1">Operating Span</div>
              <div className="text-xl font-mono font-bold text-primary">{result.operatingSpan_m.toFixed(1)} m</div>
              <div className="text-[11px] text-muted-foreground">{result.operatingSpan_ft.toFixed(0)} ft</div>
            </div>
            <div className="eng-card border-primary/20 bg-primary/5 text-center">
              <div className="eng-label mb-1">Hydrotest Span</div>
              <div className="text-xl font-mono font-bold text-foreground">{result.hydroTestSpan_m.toFixed(1)} m</div>
              <div className="text-[11px] text-muted-foreground">{result.hydroTestSpan_ft.toFixed(0)} ft</div>
            </div>
          </div>

          {/* Load Breakdown */}
          <div className="eng-card">
            <div className="eng-label mb-3">Load Breakdown</div>
            <table className="eng-table text-[11px]">
              <tbody>
                <tr><td className="text-muted-foreground">Pipe weight</td><td className="text-right font-mono">{result.pipeWeight_kgm.toFixed(2)} kg/m</td></tr>
                <tr><td className="text-muted-foreground">Fluid weight ({inputs.fluidPhase})</td><td className="text-right font-mono">{result.fluidWeight_kgm.toFixed(2)} kg/m</td></tr>
                <tr><td className="text-muted-foreground">Insulation weight</td><td className="text-right font-mono">{result.insulationWeight_kgm.toFixed(2)} kg/m</td></tr>
                <tr><td className="font-semibold">Total operating load</td><td className="text-right font-mono font-semibold">{result.totalOperatingLoad_kgm.toFixed(2)} kg/m</td></tr>
              </tbody>
            </table>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="eng-card border-amber-500/20 bg-amber-500/5">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-700">{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Support Types */}
          <div className="eng-card">
            <div className="eng-label mb-3">Recommended Support Types</div>
            <div className="overflow-x-auto">
              <table className="eng-table text-[11px]">
                <thead><tr><th>Type</th><th>Application</th><th>Standard</th></tr></thead>
                <tbody>
                  <tr><td>Pipe Shoe</td><td>Horizontal runs, thermal movement</td><td>MSS SP-58</td></tr>
                  <tr><td>Rest Support</td><td>General horizontal support</td><td>MSS SP-58</td></tr>
                  <tr><td>U-Bolt Clamp</td><td>Fixed supports, small-bore</td><td>MSS SP-69</td></tr>
                  <tr><td>Guide</td><td>Axial movement restriction</td><td>MSS SP-58</td></tr>
                  <tr><td>Trunnion</td><td>Large-bore horizontal runs</td><td>MSS SP-58</td></tr>
                  <tr><td>Spring Hanger</td><td>Vertical movement (thermal displacement)</td><td>MSS SP-58</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="eng-card">
            <p className="text-[11px] text-muted-foreground leading-relaxed">{result.explanation}</p>
            <div className="text-[9px] font-mono text-primary mt-1">{result.source}</div>
          </div>
        </>
      ) : (
        <div className="eng-card border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Insufficient data. Ensure NPS is specified and pipe dimensional data (B36.10M) is available.
            </p>
          </div>
        </div>
      )}

      <LearningMoment
        title="What limits a support span?"
        principle="A pipe between two supports behaves like a beam — gravity (pipe + fluid + insulation) bends it downward. Two limits drive the maximum span: (1) deflection — typically capped at 2.5 mm so liquids drain and flanges don't misalign; (2) bending stress — kept well below the material's allowable. Hydrotest fills gas/steam lines with water, dramatically increasing weight, so hydrotest spans are shorter. Span scales roughly with √(EI / w), so larger pipes carry farther but heavy contents shrink the span fast."
        reference="ASME B31.1 Table 121.5 • MSS SP-69 support spacing"
      />

      <EngineeringDisclaimer />
    </div>
  );
}
