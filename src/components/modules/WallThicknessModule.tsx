import { useState, useMemo, useEffect, useRef } from "react";
import { Calculator, AlertTriangle, Info, Printer } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { EngineeringDisclaimer } from "../EngineeringDisclaimer";
import { LearningMoment } from "../LearningMoment";
import { ReferenceBadge } from "@/components/ReferenceBadge";
import { TeachBadge } from "@/components/TeachBadge";
import { BackToLineNps } from "@/components/BackToLineNps";
import { normalizeNpsForDataKey, normalizeNpsForPicker } from "@/lib/nps";
import { getDefaultTrace, type CalculationTrace } from "@/stores/sourceRegistry";
import { useDesignInputs } from "@/stores/designInputsStore";
import { B36_10M_PIPE_DATA } from "./designInputs/sourceData/b36_10m_data";
import { getPipeDimensionsForMaterial } from "./designInputs/sourceData";
import { selectPipeSchedule, getStructuralMinimumThickness_mm } from "./designInputs/pipeScheduleEngine";
import {
  stressUnit,
  pressureUnit,
  lengthUnit,
  normalizePressureToBar,
  normalizeStressToMPa,
  normalizeLengthToMM,
  MPA_TO_KSI,
  MM_TO_IN,
  type UnitSystem,
} from "@/lib/unitConversion";

export function WallThicknessModule() {
  const { inputs: designInputs, recommendations, overrides, calculated } = useDesignInputs();

  // Local what-if NPS picker — does NOT modify the shared design basis.
  // Defaults to the active line NPS and stays in sync until the engineer
  // explicitly picks a different size for sensitivity / batch checks.
  const lineNps = normalizeNpsForPicker(designInputs.nominalPipeSize);
  // Bumped version to v3 so existing stale persisted values are discarded and
  // the picker correctly defaults to the active line NPS.
  const [localNpsRaw, setLocalNpsRaw] = useLocalStorage<string>("wt:localNps", lineNps, 3);
  const localNps = normalizeNpsForPicker(localNpsRaw || lineNps);
  const previousLineNpsRef = useRef(lineNps);
  // Always follow the line NPS unless the user has explicitly diverged to a
  // different non-empty value. Empty/missing local state -> snap to line NPS.
  useEffect(() => {
    const previousLineNps = previousLineNpsRef.current;
    setLocalNpsRaw((prev) => {
      const cleanPrev = normalizeNpsForPicker(prev);
      if (!cleanPrev) return lineNps;
      if (cleanPrev === previousLineNps) return lineNps;
      return cleanPrev;
    });
    previousLineNpsRef.current = lineNps;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineNps]);
  const npsDiverged = localNps !== lineNps && localNps !== "";

  // Look up OD from B36.10M for the LOCAL NPS (so what-if size drives OD)
  const localOdRow = useMemo(() => {
    if (!localNps) return null;
    const dataKey = normalizeNpsForDataKey(localNps);
    return B36_10M_PIPE_DATA.find((p) => p.nps === dataKey) || null;
  }, [localNps]);
  const localOdValue = localOdRow
    ? designInputs.unitSystem === "Imperial"
      ? localOdRow.od_in.toString()
      : localOdRow.od_mm.toString()
    : "";

  // Auto-populate from shared design inputs
  const autoP = designInputs.designPressure || "";
  const autoD = npsDiverged && localOdValue
    ? localOdValue
    : (recommendations.pipeOD?.value || "");
  const autoS = recommendations.allowableStress?.value || "";
  const autoSSource = recommendations.allowableStress ? `${recommendations.allowableStress.tableRef} — ${recommendations.allowableStress.reason}` : "";
  const autoEj = overrides.jointQualityFactor ? designInputs.jointQualityFactor : recommendations.jointQualityFactor.value;
  const autoCA = overrides.corrosionAllowance ? designInputs.corrosionAllowance : recommendations.corrosionAllowance.value;
  const autoMT = overrides.millTolerance ? designInputs.millTolerance : recommendations.millTolerance.value;
  const autoUnit = designInputs.unitSystem as "SI" | "Imperial";

  const [localOverrides, setLocalOverrides] = useLocalStorage<Record<string, string>>("wt:localOverrides", {});
  const [result, setResult] = useState<null | {
    tDesign: number; tCorr: number; tMinPressure: number; tMin: number; tNom: number;
    structuralMin: number; structuralApplied: boolean; structuralGoverns: boolean;
    traces: { tDesign: CalculationTrace; tCorr: CalculationTrace; tMin: CalculationTrace; tNom: CalculationTrace; equation: CalculationTrace };
  }>(null);

  const get = (key: string, auto: string) => localOverrides[key] ?? auto;

  const P_str = get("designPressure", autoP);
  const D_str = get("outsideDiameter", autoD);
  const S_str = get("allowableStress", autoS);
  const stressSource = get("stressSource", autoSSource);
  const Ej_str = get("jointFactor", autoEj);
  const Y_str = get("yCoefficient", "0.4");
  const CA_str = get("corrosionAllowance", autoCA);
  const MT_str = get("millTolerance", autoMT);
  const unitSystem = autoUnit;

  const us = autoUnit as UnitSystem;
  const pUnit = pressureUnit(us);
  const sUnit = stressUnit(us);
  const lUnit = lengthUnit(us);

  const setLocal = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setLocalOverrides(prev => ({ ...prev, [key]: e.target.value }));

  const calculate = () => {
    const P_input = parseFloat(P_str);
    const D_input = parseFloat(D_str);
    const S_input = parseFloat(S_str);
    const E = parseFloat(Ej_str);
    const Y = parseFloat(Y_str);
    const c_input = parseFloat(CA_str) || 0;
    const mt = parseFloat(MT_str) || 12.5;

    if (isNaN(P_input) || isNaN(D_input) || isNaN(S_input) || isNaN(E) || isNaN(Y)) return;
    if (S_input <= 0 || E <= 0) return;

    const P = normalizePressureToBar(P_str, us) * 0.1;
    const D = normalizeLengthToMM(D_str, us);
    const S = normalizeStressToMPa(S_str, us);
    const c = normalizeLengthToMM(CA_str, us);

    const tDesign = (P * D) / (2 * (S * E + P * Y));
    const tCorr = tDesign + c;
    const tMinPressure = tCorr / (1 - mt / 100);

    // Structural minimum check (project/company practical floor)
    const applyStructural = designInputs.applyStructuralMinimum !== "No";
    const cleanNps = normalizeNpsForPicker(localNps);
    const npsNumMap: Record<string, number> = {
      "1/4": 0.25, "1/2": 0.5, "3/4": 0.75, "1": 1, "1-1/4": 1.25, "1-1/2": 1.5,
      "2": 2, "3": 3, "4": 4, "6": 6, "8": 8, "10": 10, "12": 12, "14": 14,
      "16": 16, "18": 18, "20": 20, "24": 24,
    };
    const npsNum = npsNumMap[cleanNps] ?? parseFloat(cleanNps) ?? 0;
    const structuralMin = applyStructural ? getStructuralMinimumThickness_mm(npsNum) : 0;
    const structuralGoverns = applyStructural && structuralMin > tMinPressure;
    const tMin = Math.max(tMinPressure, structuralMin);
    const tNom = Math.ceil(tMin * 100) / 100;

    const displayLength = (valueMm: number, decimals = 3) =>
      us === "SI" ? `${valueMm.toFixed(decimals)} ${lUnit}` : `${(valueMm * MM_TO_IN).toFixed(decimals)} ${lUnit}`;

    const stressSrc = stressSource || "User-provided (source not specified)";

    const traces = {
      equation: {
        fieldName: "Governing Equation", appliedValue: "t = PD / 2(SE + PY)",
        sourceOrigin: "default-rule" as const, standard: "ASME B31.3", sectionRef: "§304.1.2, Eq. (3a)",
        whySelected: "Standard pressure design equation for straight pipe under internal pressure per ASME B31.3.",
        assumptions: ["Straight pipe under internal pressure", "t < D/6 (thin wall assumption)", "Material is ductile at design temperature"],
        warnings: [], confidenceLevel: "default-rule" as const, overrideStatus: "recommended" as const,
      },
      tDesign: {
        fieldName: "Pressure Design Thickness (t)", appliedValue: displayLength(tDesign),
        sourceOrigin: "default-rule" as const, standard: "ASME B31.3", sectionRef: "§304.1.2, Eq. (3a)",
        whySelected: `Calculated as PD/2(SE+PY) using normalized internal units: ${P.toFixed(4)} MPa × ${D.toFixed(3)} mm / 2(${S.toFixed(3)} MPa × ${E}+${P.toFixed(4)} MPa × ${Y}) = ${displayLength(tDesign)}.`,
        assumptions: [
          `Input pressure = ${P_input} ${pUnit} → ${P.toFixed(4)} MPa`,
          `Input OD = ${D_input} ${lUnit} → ${D.toFixed(3)} mm`,
          `Input allowable stress = ${S_input} ${sUnit} → ${S.toFixed(3)} MPa (${stressSrc})`,
          `E = ${E}`,
          `Y = ${Y}`,
        ],
        warnings: stressSource ? [] : ["Allowable stress source not specified — traceability incomplete"],
        confidenceLevel: "default-rule" as const, overrideStatus: "recommended" as const,
      },
      tCorr: {
        fieldName: "Thickness + Corrosion Allowance", appliedValue: displayLength(tCorr),
        sourceOrigin: "default-rule" as const, standard: "ASME B31.3", sectionRef: "§304.1.1",
        whySelected: `Design thickness + corrosion allowance: ${displayLength(tDesign)} + ${us === "SI" ? c_input : c_input.toFixed(3)} ${lUnit} = ${displayLength(tCorr)}.`,
        assumptions: [`Corrosion allowance c = ${c_input} ${lUnit} → ${c.toFixed(3)} mm`],
        warnings: c_input === 0 ? ["Zero corrosion allowance — verify this is intentional"] : [],
        confidenceLevel: "default-rule" as const, overrideStatus: "recommended" as const,
      },
      tMin: {
        fieldName: "Minimum Required Thickness", appliedValue: displayLength(tMin),
        sourceOrigin: "default-rule" as const,
        standard: structuralGoverns ? "Project / Company Spec" : "ASTM A530",
        sectionRef: structuralGoverns ? "Structural Min. Wall Table" : "§10, Mill Tolerance",
        whySelected: structuralGoverns
          ? `Structural minimum (${structuralMin.toFixed(2)} mm) governs over pressure-derived ${displayLength(tMinPressure)} for NPS ${cleanNps || "—"}.`
          : `Adjusted for -${mt}% manufacturing tolerance: ${displayLength(tCorr)} / (1 - ${mt}/100) = ${displayLength(tMinPressure)}.`,
        assumptions: applyStructural
          ? [`Mill tolerance = -${mt}%`, `Structural minimum applied = ${structuralMin.toFixed(2)} mm (NPS ${cleanNps || "—"})`]
          : [`Mill tolerance = -${mt}%`, "Structural minimum check disabled"],
        warnings: structuralGoverns
          ? ["Structural minimum is a practical robustness safeguard, not an ASME B31.3 fixed minimum."]
          : [],
        confidenceLevel: "default-rule" as const, overrideStatus: "recommended" as const,
      },
      tNom: {
        fieldName: "Recommended Nominal Thickness", appliedValue: us === "SI" ? `${tNom.toFixed(2)} ${lUnit}` : `${(tNom * MM_TO_IN).toFixed(3)} ${lUnit}`,
        sourceOrigin: "default-rule" as const, standard: "ASME B36.10M / B36.19M", sectionRef: "Schedule dimensional table",
        whySelected: `Rounded up from minimum required ${displayLength(tMin)}. Select nearest standard schedule.`,
        assumptions: ["Rounded to next 0.01 increment"], warnings: [],
        confidenceLevel: "default-rule" as const, overrideStatus: "recommended" as const,
      },
    };

    setResult({ tDesign, tCorr, tMinPressure, tMin, tNom, structuralMin, structuralApplied: applyStructural, structuralGoverns, traces });
  };

  // Schedule selection result (computed when result exists)
  const scheduleResult = useMemo(() => {
    if (!result) return null;
    const nps = normalizeNpsForPicker(localNps);
    const od = parseFloat(D_str) || 0;
    const S = parseFloat(S_str) || 0;
    const Ej = parseFloat(Ej_str) || 1.0;
    const ca = parseFloat(CA_str) || 0;
    const mt = parseFloat(MT_str) || 12.5;
    const dp = parseFloat(P_str) || 0;
    if (!nps || od <= 0 || S <= 0 || dp <= 0) return null;
    const pipeMaterial = recommendations.pipeMaterial?.value || designInputs.pipeMaterial;
    return selectPipeSchedule({
      nps, designPressure: dp, outsideDiameter: od,
      allowableStress: S, jointFactor: Ej, yCoefficient: 0.4,
      corrosionAllowance: ca, millTolerance: mt, unitSystem: designInputs.unitSystem,
      pipeMaterial,
      serviceType: designInputs.serviceType,
      applyStructuralMinimum: designInputs.applyStructuralMinimum !== "No",
    });
  }, [
    result,
    localNps,
    designInputs.unitSystem,
    designInputs.applyStructuralMinimum,
    designInputs.pipeMaterial,
    designInputs.serviceType,
    recommendations.pipeMaterial?.value,
    D_str,
    S_str,
    Ej_str,
    CA_str,
    MT_str,
    P_str,
  ]);

  // Full B36.10M / B36.19M table for the selected (local) NPS — uses the
  // dimensional standard governing the active pipe material.
  const activePipeForDims = recommendations.pipeMaterial?.value || designInputs.pipeMaterial;
  const fullScheduleTable = useMemo(() => {
    const npsRaw = localNps || "";
    if (!npsRaw) return [];
    const dataKey = normalizeNpsForDataKey(npsRaw);
    const npsClean = dataKey.replace(/[^\d./]/g, "");
    const table = getPipeDimensionsForMaterial(activePipeForDims);
    return table.filter(pd => {
      const pdClean = pd.nps.replace(/[^\d./]/g, "");
      return pdClean === npsClean || pd.nps === dataKey;
    });
  }, [localNps, activePipeForDims]);

  const autoPopulated = !!(autoS || autoD || autoP);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Wall Thickness Calculation</h2>
        <p className="text-sm text-muted-foreground">Per ASME B31.3 §304.1.2 — Straight Pipe Under Internal Pressure</p>
      </div>

      {autoPopulated && (
        <div className="eng-card border-primary/20 bg-primary/5">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-primary">
              Inputs auto-populated from Design Basis tab. Values can be overridden below.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="eng-card space-y-3">
          <div className="eng-label">Calculation Inputs {autoPopulated && <span className="text-primary text-[9px] ml-1">Auto-populated</span>}</div>
          <div className="flex items-center gap-2 mb-2">
            <label className="eng-label">Unit System</label>
            <span className="eng-input w-32 bg-secondary text-center">{unitSystem === "SI" ? "SI (mm, MPa)" : "Imperial (in, ksi)"}</span>
          </div>

          {/* Local NPS picker — for what-if / sensitivity checks only.
              Does NOT modify the active line NPS on the Inputs tab. */}
          <div className={`p-2 rounded-md border ${npsDiverged ? "border-amber-500/50 bg-amber-500/5" : "border-border bg-muted/20"}`}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="eng-label">
                NPS (this module)
                {npsDiverged && <span className="ml-2 text-[9px] text-amber-500 font-semibold">WHAT-IF</span>}
              </label>
              <BackToLineNps
                onReset={(n) => { setLocalNpsRaw(normalizeNpsForPicker(n)); setLocalOverrides((p) => { const { outsideDiameter, ...rest } = p; return rest; }); }}
                currentLocal={localNps}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={localNps}
                onChange={(e) => { setLocalNpsRaw(normalizeNpsForPicker(e.target.value)); setLocalOverrides((p) => { const { outsideDiameter, ...rest } = p; return rest; }); }}
                className="eng-select flex-1"
              >
                {["1/4","1/2","3/4","1","1-1/4","1-1/2","2","3","4","6","8","10","12","14","16","18","20","24"].map((n) => (
                  <option key={n} value={n}>{n}"</option>
                ))}
              </select>
              <span className="text-[10px] text-muted-foreground">
                Line: <span className="font-mono">{lineNps || "—"}{lineNps ? "\"" : ""}</span>
              </span>
            </div>
            {npsDiverged && (
              <p className="text-[10px] text-amber-600 mt-1">
                Sensitivity check only — line design basis remains NPS {lineNps}". Use the Inputs tab to change the design basis.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <label className="eng-label">Design Pressure (P)</label>
              <div className="flex items-center gap-1">
                <input type="number" value={P_str} onChange={setLocal("designPressure")} className="eng-input" placeholder="0.0" />
                <span className="text-[10px] text-muted-foreground w-10 text-right">{pUnit}</span>
              </div>
            </div>
            <div>
              <label className="eng-label">Outside Diameter (D)</label>
              <div className="flex items-center gap-1">
                <input type="number" value={D_str} onChange={setLocal("outsideDiameter")} className="eng-input" placeholder="0.0" />
                <span className="text-[10px] text-muted-foreground w-10 text-right">{lUnit}</span>
              </div>
            </div>
            <div>
              <label className="eng-label">Allowable Stress (S)</label>
              <div className="flex items-center gap-1">
                <input type="number" value={S_str} onChange={setLocal("allowableStress")} className="eng-input" placeholder="0.0" />
                <span className="text-[10px] text-muted-foreground w-10 text-right">{sUnit}</span>
              </div>
              {autoS && !localOverrides["allowableStress"] && (
                <div className="text-[9px] text-primary mt-0.5">From: {recommendations.allowableStress?.tableRef}</div>
              )}
            </div>
            <div>
              <label className="eng-label">Stress Source Reference</label>
              <input type="text" value={stressSource} onChange={setLocal("stressSource")} className="eng-input" placeholder="e.g. ASME Sec II-D, Table 1A" />
            </div>
            <div>
              <label className="eng-label">Longitudinal Joint Factor (Ej)</label>
              <input type="number" value={Ej_str} onChange={setLocal("jointFactor")} className="eng-input" />
            </div>
            <div>
              <label className="eng-label">Coefficient Y</label>
              <input type="number" value={Y_str} onChange={setLocal("yCoefficient")} className="eng-input" />
            </div>
            <div>
              <label className="eng-label">Corrosion Allowance (c)</label>
              <div className="flex items-center gap-1">
                <input type="number" value={CA_str} onChange={setLocal("corrosionAllowance")} className="eng-input" placeholder="0.0" />
                <span className="text-[10px] text-muted-foreground w-10 text-right">{lUnit}</span>
              </div>
            </div>
            <div>
              <label className="eng-label">Mill Tolerance (%)</label>
              <input type="number" value={MT_str} onChange={setLocal("millTolerance")} className="eng-input" />
            </div>
          </div>
          <button onClick={calculate} className="min-h-10 bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity w-full justify-center mt-2">
            <Calculator className="h-4 w-4" />
            Calculate Wall Thickness
          </button>
        </div>

        <div className="space-y-4">
          <div className="eng-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="eng-label">Governing Equation</div>
                <TeachBadge calcId="wall-thickness" label="Learn equation" />
              </div>
              {result && <ReferenceBadge trace={result.traces.equation} />}
            </div>
            <div className="bg-secondary rounded p-3 font-mono text-sm text-center">
              t = PD / 2(SE + PY)
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p><span className="font-mono text-foreground">t</span> = Pressure design thickness</p>
              <p><span className="font-mono text-foreground">P</span> = Internal design pressure <TeachBadge refId="B31.3-301.2" label="§301.2" /></p>
              <p><span className="font-mono text-foreground">D</span> = Outside diameter of pipe <TeachBadge refId="B36.10M" label="B36.10M" /></p>
              <p><span className="font-mono text-foreground">S</span> = Allowable stress at design temperature <TeachBadge refId="SecIID-Table1A" label="Sec II-D" /></p>
              <p><span className="font-mono text-foreground">E</span> = Longitudinal joint quality factor <TeachBadge refId="B31.3-TableA1B" label="Table A-1B" /></p>
              <p><span className="font-mono text-foreground">Y</span> = Coefficient from Table 304.1.1</p>
            </div>
            <div className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              Ref: ASME B31.3, §304.1.2, Eq. (3a)
            </div>
          </div>

          {result && (
            <div className="eng-card border-primary/30">
              <div className="eng-label mb-3">Calculation Results</div>
              <table className="eng-table">
                <tbody>
                  <tr>
                    <td className="text-muted-foreground font-sans">
                      <div className="flex items-center gap-1">Pressure design thickness (t) <ReferenceBadge trace={result.traces.tDesign} compact /></div>
                    </td>
                      <td className="text-right">{us === "SI" ? result.tDesign.toFixed(3) : (result.tDesign * MM_TO_IN).toFixed(3)} {lUnit}</td>
                  </tr>
                  <tr>
                    <td className="text-muted-foreground font-sans">
                      <div className="flex items-center gap-1">+ Corrosion allowance (t + c) <ReferenceBadge trace={result.traces.tCorr} compact /></div>
                    </td>
                      <td className="text-right">{us === "SI" ? result.tCorr.toFixed(3) : (result.tCorr * MM_TO_IN).toFixed(3)} {lUnit}</td>
                  </tr>
                  <tr>
                    <td className="text-muted-foreground font-sans">+ Mill tolerance allowance</td>
                    <td className="text-right">{us === "SI" ? result.tMinPressure.toFixed(3) : (result.tMinPressure * MM_TO_IN).toFixed(3)} {lUnit}</td>
                  </tr>
                  <tr>
                    <td className="text-muted-foreground font-sans">
                      Structural minimum applied
                    </td>
                    <td className="text-right">
                      {result.structuralApplied
                        ? <span className={result.structuralGoverns ? "text-amber-500 font-semibold" : ""}>
                            Yes — {us === "SI" ? `${result.structuralMin.toFixed(2)} mm` : `${(result.structuralMin * MM_TO_IN).toFixed(3)} in`}
                            {result.structuralGoverns && " (governs)"}
                          </span>
                        : <span className="text-muted-foreground">No</span>}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted-foreground font-sans">
                      <div className="flex items-center gap-1">Governing required thickness <ReferenceBadge trace={result.traces.tMin} compact /></div>
                    </td>
                      <td className="text-right font-semibold">{us === "SI" ? result.tMin.toFixed(3) : (result.tMin * MM_TO_IN).toFixed(3)} {lUnit}</td>
                  </tr>
                  <tr>
                    <td className="text-muted-foreground font-sans">
                      <div className="flex items-center gap-1">Recommended nominal thickness <ReferenceBadge trace={result.traces.tNom} compact /></div>
                    </td>
                      <td className="text-right font-semibold text-primary">{us === "SI" ? result.tNom.toFixed(2) : (result.tNom * MM_TO_IN).toFixed(3)} {lUnit}</td>
                  </tr>
                </tbody>
              </table>

              {/* Recommended Schedule */}
              {scheduleResult?.selectedSchedule && (
                <div className="mt-3 p-2.5 rounded border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary">✓ Recommended Schedule: {scheduleResult.selectedSchedule.schedule}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                     <div><span className="text-muted-foreground">WT:</span> <span className="font-mono">{us === "SI" ? `${scheduleResult.selectedSchedule.wt_mm} mm` : `${scheduleResult.selectedSchedule.wt_in.toFixed(3)} in`}</span></div>
                     <div><span className="text-muted-foreground">ID:</span> <span className="font-mono">{us === "SI" ? `${scheduleResult.selectedSchedule.id_mm.toFixed(1)} mm` : `${(scheduleResult.selectedSchedule.id_mm * MM_TO_IN).toFixed(3)} in`}</span></div>
                    <div><span className="text-muted-foreground">Weight:</span> <span className="font-mono">{scheduleResult.selectedSchedule.weightPerMeter.toFixed(2)} kg/m</span></div>
                    <div><span className="text-muted-foreground">Util:</span> <span className={`font-mono font-semibold ${scheduleResult.utilizationRatio > 0.9 ? "text-amber-600" : "text-green-600"}`}>{(scheduleResult.utilizationRatio * 100).toFixed(1)}%</span></div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{scheduleResult.governingCase}</p>
                </div>
              )}
              {scheduleResult && !scheduleResult.selectedSchedule && (
                <div className="mt-3 p-2.5 rounded border border-destructive/30 bg-destructive/5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5" />
                    <p className="text-[11px] text-destructive">No standard schedule meets {scheduleResult.minimumRequired_mm.toFixed(2)} mm. Consider heavier schedule or larger NPS.</p>
                  </div>
                </div>
              )}
              {result.structuralApplied && (
                <p className="mt-2 text-[10px] text-muted-foreground italic leading-relaxed">
                  ⚠ Minimum wall thickness check is a practical robustness safeguard. Final wall schedule
                  must still comply with ASME B31.3 pressure design, ASME B36.10M/B36.19M available
                  schedules, project specifications, corrosion allowance, and mechanical load checks.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full ASME B36.10M Schedule Table */}
      {fullScheduleTable.length > 0 && (
        <div className="eng-card print:border print:shadow-none" id="schedule-table-printable">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="eng-label">ASME B36.10M — Pipe Dimensions for NPS {localNps || "—"}{npsDiverged && <span className="ml-2 text-amber-500 font-normal">(what-if size, not line basis)</span>}</div>
              <div className="text-[10px] text-muted-foreground">Source: ASME B36.10M Table 1 — Welded and Seamless Wrought Steel Pipe</div>
            </div>
            <button onClick={handlePrint} className="flex min-h-10 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2.5 py-1.5 hover:bg-secondary transition-colors print:hidden">
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
          </div>

          {result && (
            <div className="mb-3 p-2 rounded bg-secondary text-[11px] print:bg-gray-100">
              <span className="text-muted-foreground">Min. required thickness:</span>{" "}
              <span className="font-mono font-semibold">{result.tMin.toFixed(3)} mm</span>
              <span className="text-muted-foreground ml-3">Schedules meeting requirement are shown in</span>{" "}
              <span className="inline-block w-3 h-3 bg-green-500/15 border border-green-500/50 rounded-sm align-middle" />{" "}
              <span className="text-muted-foreground">green</span>
              {scheduleResult?.selectedSchedule && (
                <>
                  <span className="text-muted-foreground ml-3">• Selected:</span>{" "}
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-sm align-middle" />{" "}
                  <span className="font-mono font-semibold text-green-700">Sch {scheduleResult.selectedSchedule.schedule}</span>
                </>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse print:text-[10px]">
              <thead>
                <tr className="border-b-2 border-foreground/20">
                  <th className="text-left py-1.5 px-2 font-semibold">Schedule</th>
                  <th className="text-right py-1.5 px-2 font-semibold">OD (mm)</th>
                  <th className="text-right py-1.5 px-2 font-semibold">OD (in)</th>
                  <th className="text-right py-1.5 px-2 font-semibold">WT (mm)</th>
                  <th className="text-right py-1.5 px-2 font-semibold">WT (in)</th>
                  <th className="text-right py-1.5 px-2 font-semibold">ID (mm)</th>
                  <th className="text-right py-1.5 px-2 font-semibold">kg/m</th>
                  {result && <th className="text-center py-1.5 px-2 font-semibold">Status</th>}
                </tr>
              </thead>
              <tbody>
                {fullScheduleTable.map((row) => {
                  const meetsReq = result ? row.wt_mm >= result.tMin : false;
                  const isSelected = scheduleResult?.selectedSchedule?.schedule === row.schedule;
                  const rowClass = isSelected
                    ? "bg-green-500/30 border-l-2 border-green-400 font-semibold text-green-100 print:text-green-900 print:bg-green-100"
                    : meetsReq && result
                      ? "bg-green-500/10 text-green-200 print:text-green-800 print:bg-green-50"
                      : "";

                  return (
                    <tr key={row.schedule} className={`border-b border-border/50 ${rowClass} print:border-gray-300`}>
                      <td className="py-1.5 px-2 font-mono">
                        {isSelected && <span className="text-green-600 mr-1">▸</span>}
                        {row.schedule}
                      </td>
                      <td className="text-right py-1.5 px-2 font-mono">{row.od_mm}</td>
                      <td className="text-right py-1.5 px-2 font-mono">{row.od_in}</td>
                      <td className={`text-right py-1.5 px-2 font-mono ${meetsReq && result ? "text-green-300 print:text-green-700 font-medium" : ""}`}>
                        {row.wt_mm}
                      </td>
                      <td className="text-right py-1.5 px-2 font-mono">{row.wt_in}</td>
                      <td className="text-right py-1.5 px-2 font-mono">{row.id_mm.toFixed(1)}</td>
                      <td className="text-right py-1.5 px-2 font-mono">{row.weightPerMeter.toFixed(2)}</td>
                      {result && (
                        <td className="text-center py-1.5 px-2 text-[10px]">
                          {isSelected ? (
                            <span className="text-green-700 dark:text-green-400 font-bold">✓ SELECTED</span>
                          ) : meetsReq ? (
                            <span className="text-green-600 dark:text-green-500">Acceptable</span>
                          ) : (
                            <span className="text-muted-foreground">Below min.</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-[9px] text-muted-foreground print:text-[8px]">
            <p>Reference: ASME B36.10M — Welded and Seamless Wrought Steel Pipe, Table 1</p>
            <p className="mt-0.5">Engineering support tool — final design subject to approval by qualified engineer</p>
          </div>
        </div>
      )}

      <LearningMoment
        title="Why PD/2(SE+PY)?"
        principle="Internal pressure tries to burst the pipe by stretching the wall in the hoop (circumferential) direction — the dominant stress in a thin cylinder is roughly twice the longitudinal stress. Barlow's equation balances this hoop stress against the material's allowable stress (S), reduced by joint efficiency (E) for welded seams. The Y-coefficient corrects for thicker walls where stress is no longer uniform across thickness."
        reference="ASME B31.3 §304.1.2 • Barlow's formula derivation"
      >
        Then we add corrosion allowance (metal you expect to lose over service life) and divide by (1 − mill tolerance) because rolled pipe can legitimately ship up to 12.5% thinner than nominal. Finally, round up to a standard schedule — you can't order arbitrary thicknesses.
      </LearningMoment>

      <EngineeringDisclaimer />
    </div>
  );
}
