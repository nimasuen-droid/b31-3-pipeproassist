import { useMemo, useState, useRef, useCallback } from "react";
import { useDesignInputs } from "@/stores/designInputsStore";
import { selectPipeSchedule, PIPE_DIMENSIONS, type ScheduleSelectionResult, type ScheduleRecommendation } from "./designInputs/pipeScheduleEngine";
import { EngineeringDisclaimer } from "../EngineeringDisclaimer";
import { LearningMoment } from "../LearningMoment";
import { AlertTriangle, CheckCircle2, Table2, Download, Printer, LayoutGrid, Star, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pressureUnit, stressUnit, lengthUnit, MM_TO_IN } from "@/lib/unitConversion";
import { escapeHtml } from "@/lib/utils";

// EPC-standard NPS sizes — excludes 2½″ and 3½″ (non-preferred, procurement issues)
const ALL_NPS = ["1/4","1/2","3/4","1","1-1/4","1-1/2","2","3","4","6","8","10","12","14","16","18","20","24"];

const NPS_TO_KEY: Record<string,string> = {
  "1/4":"0.25","1/2":"0.5","3/4":"0.75","1":"1","1-1/4":"1.25","1-1/2":"1.5",
  "2":"2","3":"3","4":"4","6":"6","8":"8","10":"10","12":"12",
  "14":"14","16":"16","18":"18","20":"20","24":"24",
};

function getOdForNps(npsKey: string): number {
  const dim = PIPE_DIMENSIONS.find(p => p.nps.replace(/[^\d.]/g,"") === npsKey);
  return dim?.od_mm || 0;
}

export function PipeScheduleModule() {
  const { inputs, recommendations, activePipeMaterial, overrides, calculated } = useDesignInputs();
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [summaryView, setSummaryView] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const us = inputs.unitSystem === "Imperial" ? "Imperial" : "SI";
  const pUnit = pressureUnit(us);
  const sUnit = stressUnit(us);
  const lUnit = lengthUnit(us);
  const formatLength = useCallback((mm: number, decimalsSI = 3, decimalsImp = 3) => (
    us === "SI" ? `${mm.toFixed(decimalsSI)} mm` : `${(mm * MM_TO_IN).toFixed(decimalsImp)} in`
  ), [us]);
  const formatBareLength = useCallback((mm: number, decimalsSI = 3, decimalsImp = 3) => (
    us === "SI" ? mm.toFixed(decimalsSI) : (mm * MM_TO_IN).toFixed(decimalsImp)
  ), [us]);

  const getCalcParams = useCallback(() => {
    const dp = parseFloat(inputs.designPressure) || 0;
    const S = recommendations.allowableStress ? parseFloat(recommendations.allowableStress.value) : 0;
    const Ej = parseFloat(overrides.jointQualityFactor ? inputs.jointQualityFactor : recommendations.jointQualityFactor.value) || 1.0;
    const ca = parseFloat(overrides.corrosionAllowance ? inputs.corrosionAllowance : recommendations.corrosionAllowance.value) || 0;
    const mt = parseFloat(overrides.millTolerance ? inputs.millTolerance : recommendations.millTolerance.value) || 12.5;
    return { dp, S, Ej, ca, mt };
  }, [inputs, recommendations, overrides]);

  const result = useMemo(() => {
    const { dp, S, Ej, ca, mt } = getCalcParams();
    const nps = inputs.nominalPipeSize?.replace(/['"]/g, "").trim() || "";
    if (!nps || dp <= 0 || S <= 0) return null;
    const od = recommendations.pipeOD ? parseFloat(recommendations.pipeOD.value) : 0;
    if (od <= 0) return null;
    return selectPipeSchedule({
      nps, designPressure: dp, outsideDiameter: od,
      allowableStress: S, jointFactor: Ej, yCoefficient: 0.4,
      corrosionAllowance: ca, millTolerance: mt, unitSystem: inputs.unitSystem,
      pipeMaterial: activePipeMaterial,
      serviceType: inputs.serviceType,
    });
  }, [inputs, recommendations, activePipeMaterial, getCalcParams]);

  const allSizesResults = useMemo(() => {
    if (!showAllSizes) return null;
    const { dp, S, Ej, ca, mt } = getCalcParams();
    if (dp <= 0 || S <= 0) return null;
    const results: { npsLabel: string; result: ScheduleSelectionResult }[] = [];
    for (const npsLabel of ALL_NPS) {
      const npsKey = NPS_TO_KEY[npsLabel] || npsLabel;
      const od = getOdForNps(npsKey);
      if (od <= 0) continue;
      const r = selectPipeSchedule({
        nps: npsLabel, designPressure: dp, outsideDiameter: od,
        allowableStress: S, jointFactor: Ej, yCoefficient: 0.4,
        corrosionAllowance: ca, millTolerance: mt, unitSystem: inputs.unitSystem,
        pipeMaterial: activePipeMaterial,
        serviceType: inputs.serviceType,
      });
      results.push({ npsLabel, result: r });
    }
    return results;
  }, [showAllSizes, getCalcParams, inputs.unitSystem, inputs.serviceType, activePipeMaterial]);

  const handlePrint = () => {
    const el = tableRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>ASME B36.10M Schedule Summary</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:10px;margin:20px;color:#1a1a1a}
        h1{font-size:16px;margin-bottom:4px}
        .meta{font-size:10px;color:#666;margin-bottom:12px}
        table{border-collapse:collapse;width:100%;margin-bottom:16px}
        th,td{border:1px solid #ccc;padding:3px 6px;text-align:center}
        th{background:#f0f0f0;font-weight:600}
        .ok{background:#dcfce7;color:#166534}
        .sel{background:#bbf7d0;color:#14532d;font-weight:700}
        .thin{color:#999}
        .nps-header{background:#e0e7ff;font-weight:700;text-align:left}
        @media print{body{margin:10px}table{page-break-inside:auto}tr{page-break-inside:avoid}}
      </style></head><body>
      <h1>ASME B36.10M — Complete Schedule Summary</h1>
      <div class="meta">
        Material: ${escapeHtml(activePipeMaterial)} | P = ${escapeHtml(inputs.designPressure)} ${escapeHtml(pUnit)} | T = ${escapeHtml(inputs.designTemperature)} ${inputs.unitSystem === "SI" ? "°C" : "°F"} |
        S = ${escapeHtml(recommendations.allowableStress?.value ?? "—")} ${escapeHtml(sUnit)} | CA = ${escapeHtml(getCalcParams().ca)} ${escapeHtml(lUnit)} | Mill Tol = ${escapeHtml(getCalcParams().mt)}%
      </div>
      ${el.innerHTML}
      <p style="font-size:9px;color:#999;margin-top:16px">Engineering support tool – final design subject to approval. Generated ${new Date().toISOString().slice(0,10)}</p>
    </body></html>`);
    w.document.close();
    w.print();
  };

  const handleExcelDownload = () => {
    if (!allSizesResults) return;
    const rows: string[][] = [[`NPS`,`OD (${lUnit})`,`Schedule`,`WT (${lUnit})`,`ID (${lUnit})`,`kg/m`,`t_min (${lUnit})`,`Status`]];
    for (const { npsLabel, result: r } of allSizesResults) {
      for (const s of r.availableSchedules) {
        const ok = s.wt_mm >= r.minimumRequired_mm;
        const selected = r.selectedSchedule?.schedule === s.schedule;
        rows.push([
          npsLabel, formatBareLength(s.od_mm, 1, 3), s.schedule, formatBareLength(s.wt_mm, 2, 3),
          formatBareLength(s.id_mm, 1, 3), s.weightPerMeter.toFixed(2),
          formatBareLength(r.minimumRequired_mm, 3, 3),
          selected ? "SELECTED" : ok ? "Acceptable" : "Too thin",
        ]);
      }
    }
    const csv = rows.map(r => r.join("\t")).join("\n");
    const blob = new Blob([csv], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `B36_10M_Schedule_Summary_${new Date().toISOString().slice(0,10)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!calculated) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Pipe Schedule Selection</h2>
        <div className="eng-card border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Go to <strong>Inputs</strong> tab. Enter NPS, design pressure, temperature, and material, then click <strong>Calculate & Recommend</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Pipe Schedule Selection</h2>
        <p className="text-sm text-muted-foreground">
          Per ASME B31.3 §304.1.2 & ASME B36.10M • NPS {inputs.nominalPipeSize || "—"} • {activePipeMaterial}
        </p>
      </div>

      {result ? (
        <>
          {/* Thickness Summary */}
          <div className="eng-card">
            <div className="eng-label mb-3">Thickness Calculation Summary</div>
            <table className="eng-table">
              <tbody>
                <tr><td className="text-muted-foreground">Design thickness (t)</td><td className="text-right font-mono">{formatLength(result.requiredThickness_mm)}</td></tr>
                <tr><td className="text-muted-foreground">+ Corrosion allowance</td><td className="text-right font-mono">{formatLength(result.corroded_mm)}</td></tr>
                <tr><td className="text-muted-foreground font-semibold">Minimum required (incl. mill tol.)</td><td className="text-right font-mono font-semibold">{formatLength(result.minimumRequired_mm)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Selected Schedule */}
          {result.selectedSchedule ? (
            <div className="eng-card border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-medium">Engineer Recommended: {result.selectedSchedule.schedule}</span>
                {result.recommendation.minimumPassing && result.recommendation.minimumPassing.schedule !== result.selectedSchedule.schedule && (
                  <span className="text-[10px] text-muted-foreground ml-1">(min. passing: {result.recommendation.minimumPassing.schedule})</span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                <div><span className="text-muted-foreground">OD:</span> <span className="font-mono">{us === "SI" ? `${result.selectedSchedule.od_mm} mm` : `${result.selectedSchedule.od_in.toFixed(3)} in`}</span></div>
                <div><span className="text-muted-foreground">WT:</span> <span className="font-mono">{us === "SI" ? `${result.selectedSchedule.wt_mm} mm` : `${result.selectedSchedule.wt_in.toFixed(3)} in`}</span></div>
                <div><span className="text-muted-foreground">ID:</span> <span className="font-mono">{formatLength(result.selectedSchedule.id_mm, 1, 3)}</span></div>
                <div><span className="text-muted-foreground">Weight:</span> <span className="font-mono">{result.selectedSchedule.weightPerMeter.toFixed(2)} kg/m</span></div>
              </div>
              <div className="mt-2 text-[11px]">
                <span className="text-muted-foreground">Utilization:</span>{" "}
                <span className={`font-mono font-semibold ${result.utilizationRatio > 0.9 ? "text-amber-600" : "text-green-600"}`}>
                  {(result.utilizationRatio * 100).toFixed(1)}%
                </span>
              </div>
              {/* Recommendation reasoning */}
              <div className="mt-2 p-2 rounded bg-background/50 border border-border/50">
                <div className="flex items-start gap-1.5 mb-1">
                  <Info className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-[11px] text-foreground leading-relaxed">{result.recommendation.reason}</p>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {result.recommendation.factors.map((f, i) => (
                    <span key={i} className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium ${
                      f.weight === "high" ? "bg-primary/10 text-primary" :
                      f.weight === "medium" ? "bg-amber-500/10 text-amber-600" :
                      "bg-muted text-muted-foreground"
                    }`} title={f.description}>
                      {f.name}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{result.governingCase}</p>
              <div className="text-[9px] font-mono text-primary mt-1">{result.source}</div>
            </div>
          ) : (
            <div className="eng-card border-destructive/20 bg-destructive/5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">No standard schedule meets the required thickness of {formatLength(result.minimumRequired_mm, 2, 3)}. Consider a heavier schedule or larger NPS.</p>
              </div>
            </div>
          )}

          {/* Available Schedules for selected NPS */}
          {result.availableSchedules.length > 0 && (
            <div className="eng-card">
              <div className="eng-label mb-3">Available Schedules for NPS {inputs.nominalPipeSize}</div>
              <div className="overflow-x-auto">
                <table className="eng-table text-[11px]">
                  <thead>
                    <tr>
                      <th>Schedule</th><th>OD ({lUnit})</th><th>WT ({lUnit})</th><th>ID ({lUnit})</th><th>kg/m</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.availableSchedules.map(s => {
                      const ok = s.wt_mm >= result.minimumRequired_mm;
                      const isRecommended = result.selectedSchedule?.schedule === s.schedule;
                      const isMinPassing = result.recommendation.minimumPassing?.schedule === s.schedule && !isRecommended;
                      return (
                        <tr key={s.schedule} className={isRecommended ? "bg-primary/10" : isMinPassing ? "bg-amber-500/5" : ""}>
                          <td className="font-mono">{s.schedule}</td>
                          <td>{formatBareLength(s.od_mm, 1, 3)}</td>
                          <td className={ok ? "text-green-600 font-medium" : "text-muted-foreground"}>{formatBareLength(s.wt_mm, 2, 3)}</td>
                          <td>{formatBareLength(s.id_mm, 1, 3)}</td>
                          <td>{s.weightPerMeter.toFixed(2)}</td>
                          <td>
                            {isRecommended ? (
                              <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-amber-500 fill-amber-500" />Recommended</span>
                            ) : isMinPassing ? (
                              <span className="text-amber-600">Min. passing</span>
                            ) : ok ? "Acceptable" : "Too thin"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="eng-card">
            <p className="text-[11px] text-muted-foreground leading-relaxed">{result.explanation}</p>
          </div>
        </>
      ) : (
        <div className="eng-card border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Insufficient data for schedule selection. Ensure NPS, design pressure, and material are specified in the Inputs tab.
              {!recommendations.allowableStress && " Allowable stress could not be determined — material may not be in the stress database."}
            </p>
          </div>
        </div>
      )}

      {/* Generate All Sizes Button */}
      <div className="eng-card border-accent/20">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={showAllSizes ? "secondary" : "default"}
            onClick={() => setShowAllSizes(!showAllSizes)}
            disabled={!result}
          >
            <Table2 className="h-4 w-4 mr-1" />
            {showAllSizes ? "Hide All Sizes" : "Calculate All Sizes (1/4\" – 24\")"}
          </Button>
          {showAllSizes && allSizesResults && (
            <>
              <Button size="sm" variant={summaryView ? "default" : "outline"} onClick={() => setSummaryView(!summaryView)}>
                <LayoutGrid className="h-4 w-4 mr-1" />{summaryView ? "Detail View" : "Summary View"}
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />Print / PDF
              </Button>
              <Button size="sm" variant="outline" onClick={handleExcelDownload}>
                <Download className="h-4 w-4 mr-1" />Download Excel
              </Button>
            </>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Calculates recommended schedule for all standard NPS sizes using current design inputs (P, T, S, CA, mill tolerance).
        </p>
      </div>

      {/* All Sizes — Summary (pivot) or Detail view */}
      {showAllSizes && allSizesResults && summaryView && (() => {
        const allScheds = Array.from(new Set(allSizesResults.flatMap(r => r.result.availableSchedules.map(s => s.schedule))));
        const schedOrder = ["5","5S","10","10S","20","30","40","40S","60","80","80S","100","120","140","160"];
        allScheds.sort((a, b) => {
          const ia = schedOrder.indexOf(a), ib = schedOrder.indexOf(b);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });
        return (
          <div ref={tableRef} className="eng-card p-2">
            <div className="eng-label mb-2">Summary View — Recommended Schedule per NPS</div>
            <div className="overflow-x-auto">
              <table className="eng-table text-[9px] w-full">
                <thead>
                  <tr>
                    <th className="py-1 px-1 text-left sticky left-0 bg-background z-10">NPS</th>
                     <th className="py-1 px-1">OD ({lUnit})</th>
                     <th className="py-1 px-1">t<sub>min</sub> ({lUnit})</th>
                    {allScheds.map(sch => <th key={sch} className="py-1 px-1">{sch}</th>)}
                    <th className="py-1 px-1">Rec.</th>
                  </tr>
                </thead>
                <tbody>
                  {allSizesResults.map(({ npsLabel, result: r }) => {
                    const schedMap = new Map(r.availableSchedules.map(s => [s.schedule, s]));
                    return (
                      <tr key={npsLabel}>
                        <td className="py-0.5 px-1 font-semibold sticky left-0 bg-background">{npsLabel}"</td>
                        <td className="py-0.5 px-1">{r.availableSchedules[0] ? formatBareLength(r.availableSchedules[0].od_mm, 1, 3) : "—"}</td>
                        <td className="py-0.5 px-1 font-mono">{formatBareLength(r.minimumRequired_mm, 2, 3)}</td>
                        {allScheds.map(sch => {
                          const s = schedMap.get(sch);
                          if (!s) return <td key={sch} className="py-0.5 px-1 text-muted-foreground/30">—</td>;
                          const ok = s.wt_mm >= r.minimumRequired_mm;
                          const sel = r.selectedSchedule?.schedule === sch;
                          return (
                            <td
                              key={sch}
                              className={`py-0.5 px-1 font-mono ${sel ? "bg-green-500/30 font-bold text-green-200 print:text-green-800" : ok ? "text-green-300 print:text-green-700" : "text-muted-foreground"}`}
                            >
                              {formatBareLength(s.wt_mm, 2, 3)}
                            </td>
                          );
                        })}
                        <td className="py-0.5 px-1 font-mono font-semibold text-primary">
                          {r.selectedSchedule ? r.selectedSchedule.schedule : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="text-[9px] text-muted-foreground text-center pt-2">
              WT values in {lUnit} • Green = meets t<sub>min</sub> • Highlighted = recommended • ASME B36.10M / B31.3 §304.1.2
            </div>
          </div>
        );
      })()}

      {showAllSizes && allSizesResults && !summaryView && (
        <div ref={tableRef} className="eng-card p-2">
          <div className="eng-label mb-2">Complete Schedule Summary — All Standard Sizes</div>
          <div className="overflow-x-auto">
            <table className="eng-table text-[10px] w-full">
              <thead>
                <tr>
                  <th className="py-1 px-1 text-left">NPS</th>
                  <th className="py-1 px-1">OD ({lUnit})</th>
                  <th className="py-1 px-1">Schedule</th>
                  <th className="py-1 px-1">WT ({lUnit})</th>
                  <th className="py-1 px-1">ID ({lUnit})</th>
                  <th className="py-1 px-1">kg/m</th>
                  <th className="py-1 px-1">t<sub>min</sub> ({lUnit})</th>
                  <th className="py-1 px-1">Util. %</th>
                  <th className="py-1 px-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {allSizesResults.flatMap(({ npsLabel, result: r }) =>
                  r.availableSchedules.map((s, i) => {
                    const ok = s.wt_mm >= r.minimumRequired_mm;
                    const isRec = r.selectedSchedule?.schedule === s.schedule;
                    const isMin = r.recommendation.minimumPassing?.schedule === s.schedule && !isRec;
                    const util = ok ? (r.minimumRequired_mm / s.wt_mm * 100) : 0;
                    return (
                      <tr
                        key={`${npsLabel}-${s.schedule}`}
                        className={isRec ? "bg-green-500/20 font-semibold text-green-100 print:text-green-900" : isMin ? "bg-amber-500/20 text-amber-100 print:text-amber-900" : ""}
                      >
                        {i === 0 ? (
                          <td className="py-0.5 px-1 font-semibold border-t border-border" rowSpan={r.availableSchedules.length}>
                            {npsLabel}"
                          </td>
                        ) : null}
                        <td className={`py-0.5 px-1 ${i === 0 ? "border-t border-border" : ""}`}>{formatBareLength(s.od_mm, 1, 3)}</td>
                        <td className={`py-0.5 px-1 font-mono ${i === 0 ? "border-t border-border" : ""}`}>{s.schedule}</td>
                        <td className={`py-0.5 px-1 ${i === 0 ? "border-t border-border" : ""} ${ok ? "text-green-300 print:text-green-700" : "text-muted-foreground"}`}>{formatBareLength(s.wt_mm, 2, 3)}</td>
                        <td className={`py-0.5 px-1 ${i === 0 ? "border-t border-border" : ""}`}>{formatBareLength(s.id_mm, 1, 3)}</td>
                        <td className={`py-0.5 px-1 ${i === 0 ? "border-t border-border" : ""}`}>{s.weightPerMeter.toFixed(2)}</td>
                        <td className={`py-0.5 px-1 font-mono ${i === 0 ? "border-t border-border" : ""}`}>{i === 0 ? formatBareLength(r.minimumRequired_mm, 2, 3) : ""}</td>
                        <td className={`py-0.5 px-1 font-mono ${i === 0 ? "border-t border-border" : ""} ${isRec && util > 90 ? "text-amber-600" : isRec ? "text-green-600" : ""}`}>{ok ? util.toFixed(0) + "%" : ""}</td>
                        <td className={`py-0.5 px-1 ${i === 0 ? "border-t border-border" : ""}`}>{isRec ? "★ RECOMMENDED" : isMin ? "Min. pass" : ok ? "OK" : "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="text-[9px] text-muted-foreground text-center pt-2">
            ASME B36.10M • B31.3 §304.1.2 Eq.(3a) • {activePipeMaterial} • P={inputs.designPressure} {inputs.unitSystem==="SI"?"barg":"psig"} • Generated {new Date().toISOString().slice(0,10)}
          </div>
        </div>
      )}

      <LearningMoment
        title="Schedule vs. wall thickness"
        principle={`Pipe is sold by 'schedule' (40, 80, 160, XS, XXS) — a shorthand for nominal wall thickness at a given NPS. The trick: the same schedule number means different actual thicknesses across NPS. Sch 40 on a 2" pipe is 0.154"; on a 12" pipe it's 0.406". We compute the minimum required wall (Barlow + corrosion + mill tolerance), then round UP to the next available standard schedule. Going thinner saves weight and cost; going thicker buys safety margin and erosion life.`}
        reference="ASME B36.10M (carbon/alloy) • B36.19M (stainless) schedule tables"
      />

      <EngineeringDisclaimer />
    </div>
  );
}
