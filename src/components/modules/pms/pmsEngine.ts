/**
 * Piping Material Specification Engine v2
 * Rule-driven engineering system generating PIP-style PMS from design basis.
 * 
 * Enhancements:
 *  1. P-T rating block (B16.5)
 *  2. Complete component coverage (pipe, nipples, fittings SB/LB, valves, flanges, gaskets, bolting)
 *  3. True NPS-based engineering splits
 *  4. Conditional notes linked to rows
 *  5. Material continuity checks
 *  6. Expanded valve specs (body/trim/seat/bore/end)
 *  7. Rule-based flange logic
 *  8. Logic-driven branch table
 *  9. Standardized header/spec identity
 * 10. Auto-generated references
 * 11. Engineering traceability layer
 */

import type { DesignInputs } from "@/stores/designInputsStore";
import type { Recommendations } from "@/components/modules/designInputs/recommendationEngine";
import { selectBandByThickness, SCHEDULE_BANDS, type ScheduleBand } from "./scheduleBandEngine";
import { getServiceSchedulePhilosophy, normalizeScheduleNps, scheduleIndex, selectPipeSchedule, SCHEDULE_ORDER } from "@/components/modules/designInputs/pipeScheduleEngine";
import { getPipeDimensionsForMaterial, isStainlessDimensionalStandard } from "@/components/modules/designInputs/sourceData";
import { ALL_FLANGE_PT_RATINGS, type FlangePTRating } from "@/components/modules/designInputs/sourceData/b16_5_data";
import {
  normalizeTempToC, BAR_TO_PSI, PSI_TO_BAR,
  normalizeStressToMPa, normalizeLengthToMM,
  pressureUnit, tempUnit, lengthUnit,
  type UnitSystem,
} from "@/lib/unitConversion";
import {
  classifyMaterialFamily,
  classifyPMSGroup,
  classifyGroupCode,
  classifyFlangePTGroup,
  classifyServiceSeverity,
  getWeldedPipeEquivalent,
  getForgedFittingSpec,
  getPWHTThreshold,
  isBoltNACECompliant,
  type MaterialFamily,
  type PMSMaterialGroup,
  type MaterialGroupCode,
} from "@/components/modules/designInputs/engineeringClassification";
import { buildValveClassTable, type ClassValveType } from "@/components/modules/designInputs/valveClassTableEngine";
import { validateHydrogenService, isHydrogenService, type H2ValidationResult } from "./hydrogenServiceEngine";
import { PMS_PRACTICE_RULES } from "@/components/modules/designInputs/engineeringRules";

// ════════════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════════════

export interface PMSDesignBasis {
  specNumber: string;
  specName: string;
  designCode: string;
  serviceType: string;
  fluidPhase: string;
  designPressure: string;
  designTemperature: string;
  operatingPressure: string;
  operatingTemperature: string;
  testPressure: string;
  testMedium: string;
  corrosionAllowance: string;
  materialGroup: string;
  flangeRating: string;
  unitSystem: string;
  revision: string;
  date: string;
  useB165AsDesignBasis?: boolean;
  b165DerivedPressure?: number;
  b165Note?: string;
}

export interface PMSPTRating {
  tempC: number;
  pressureBar: number;
}

export interface PMSPTRatingBlock {
  materialGroup: string;
  materialDescription: string;
  ratingClass: number;
  standard: string;
  ratings: PMSPTRating[];
  note: string; // e.g. "Full flange rating per ASME B16.5"
}

export interface PMSMaterialRow {
  component: string;
  category: "pipe" | "nipple" | "fitting-sb" | "fitting-lb" | "valve" | "flange" | "gasket" | "bolting";
  specification: string;
  grade: string;
  size: string;
  schedule: string;
  rating: string;
  endConnection: string;
  notes: string;
  notApplicable?: boolean; // "Not used in this class"
  traceability?: PMSTraceability;
  // Valve-specific extended fields
  valveBody?: string;
  valveTrim?: string;
  valveSeat?: string;
  valveBore?: string;
}

export interface PMSNote {
  id: number;
  category: "general" | "branch" | "connection" | "welding" | "examination" | "service";
  text: string;
  reference: string;
  triggerCondition: string;   // Why this note was generated
  linkedRows: string[];       // Component names referencing this note
}

export interface PMSBranchRule {
  headerSize: string;
  branchSize: string;
  connectionType: string;
  reinforcement: string;
  note: string;
}

export type BranchCode = "T" | "W" | "S" | "R" | "";

export interface BranchMatrix {
  headerSizes: string[];
  branchSizes: string[];
  grid: BranchCode[][];
}

export interface PMSReference {
  standard: string;
  title: string;
  appliedTo: string;
}

export interface PMSTraceability {
  whySelected: string;
  governingRule: string;
  sourceField?: string;
}

export interface MaterialContinuityCheck {
  component: string;
  material: string;
  compatible: boolean;
  note: string;
}

export interface PMSScheduleValidation {
  nps: string;
  materialSpecSchedule: string;
  materialSpecWall_mm: number | null;
  calculatedSchedule: string;
  calculatedWall_mm: number;
  minimumRequired_mm: number;
  standard: string;
  meetsMinimumWall: boolean;
  meetsCalculatedSchedule: boolean;
}

export const BRANCH_LEGEND: { code: BranchCode; label: string }[] = [
  { code: "T", label: "Tee (equal, ASME B16.9 / B16.11)" },
  { code: "R", label: "Reducing Tee (ASME B16.9 / B16.11)" },
  { code: "W", label: "Weldolet (MSS SP-97)" },
  { code: "S", label: "Sockolet (MSS SP-97)" },
];

export interface PipingMaterialSpec {
  designBasis: PMSDesignBasis;
  ptRatingBlock: PMSPTRatingBlock | null;
  materialTable: PMSMaterialRow[];
  notes: PMSNote[];
  branchRules: PMSBranchRule[];
  branchMatrix: BranchMatrix;
  scheduleBand: ScheduleBand;
  references: PMSReference[];
  materialContinuity: MaterialContinuityCheck[];
  hydrogenValidation: H2ValidationResult | null;
  scheduleValidation: PMSScheduleValidation[];
}

// ════════════════════════════════════════════════════════════════
// HELPERS (classification-backed)
// ════════════════════════════════════════════════════════════════

/** Get PMS display group name via structured classification lookup */
function getMaterialGroup(pipe: string): PMSMaterialGroup {
  return classifyPMSGroup(pipe);
}

/** Get short material group code via classification */
function getMaterialGroupCode(pipe: string): MaterialGroupCode {
  return classifyGroupCode(pipe);
}

/** Get B16.5 flange P-T rating group from pipe designation */
function getFlangeMaterialGroup(pipe: string): string {
  return classifyFlangePTGroup(pipe);
}

/** Classify sour/corrosive service from structured service type field */
function isSourService(svc: string): boolean {
  const severity = classifyServiceSeverity({ serviceType: svc });
  return severity.has("sour") || severity.has("corrosive");
}

/** High temperature classification */
function isHighTempService(tempC: number): boolean {
  return tempC > 425;
}

// ════════════════════════════════════════════════════════════════
// P-T RATING BLOCK
// ════════════════════════════════════════════════════════════════

function buildPTRatingBlock(
  flangeClassNum: number,
  pipe: string,
): PMSPTRatingBlock | null {
  if (!flangeClassNum || flangeClassNum <= 0) return null;

  const matGroup = getFlangeMaterialGroup(pipe);
  const rating = ALL_FLANGE_PT_RATINGS.find(
    r => r.materialGroup === matGroup && r.class === flangeClassNum
  );

  if (!rating) {
    return {
      materialGroup: matGroup,
      materialDescription: getMaterialGroup(pipe),
      ratingClass: flangeClassNum,
      standard: flangeClassNum >= 900 ? "ASME B16.5 / B16.47" : "ASME B16.5",
      ratings: [],
      note: `Full flange rating per ASME B16.5 Table 2-${matGroup}. Calculated for NPS ≥ 12 where applicable.`,
    };
  }

  return {
    materialGroup: matGroup,
    materialDescription: rating.materialDescription,
    ratingClass: flangeClassNum,
    standard: "ASME B16.5",
    ratings: rating.ratings.map(r => ({ tempC: r.tempC, pressureBar: r.pressureBar })),
    note: `Per ASME B16.5 Table 2-${matGroup} (Group ${matGroup}: ${rating.materialDescription})`,
  };
}

// ════════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ════════════════════════════════════════════════════════════════

export function generatePMS(
  inputs: DesignInputs,
  recommendations: Recommendations,
  activePipeMaterial: string,
  overrides: Record<string, boolean>,
  specNumber?: string,
  specName?: string,
  options?: { useB165AsDesignBasis?: boolean },
): PipingMaterialSpec {
  const nps = parseFloat(inputs.nominalPipeSize) || 4;
  const flangeClass = recommendations.flangeClass?.value || "150";
  const flangeClassNum = parseInt(flangeClass) || 150;
  const matGroup = getMaterialGroup(activePipeMaterial);
  const matGroupCode = getMaterialGroupCode(activePipeMaterial);
  const us = (inputs.unitSystem || "SI") as UnitSystem;
  const svc = inputs.serviceType || "General Hydrocarbon";
  const tempC = normalizeTempToC(inputs.designTemperature, us);
  let designP = parseFloat(inputs.designPressure) || 0;

  // ── B16.5 P-T as design basis (optional) ──
  let b165DerivedPressure: number | undefined;
  let b165Note: string | undefined;
  const useB165 = options?.useB165AsDesignBasis ?? false;

  if (useB165) {
    const flangePTGroup = getFlangeMaterialGroup(activePipeMaterial);
    const rating = ALL_FLANGE_PT_RATINGS.find(
      r => r.materialGroup === flangePTGroup && r.class === flangeClassNum
    );
    if (rating && rating.ratings.length > 0) {
      const sorted = [...rating.ratings].sort((a, b) => a.tempC - b.tempC);
      let allowable = 0;
      if (tempC <= sorted[0].tempC) {
        allowable = sorted[0].pressureBar;
      } else if (tempC >= sorted[sorted.length - 1].tempC) {
        allowable = sorted[sorted.length - 1].pressureBar;
      } else {
        for (let i = 0; i < sorted.length - 1; i++) {
          if (tempC >= sorted[i].tempC && tempC <= sorted[i + 1].tempC) {
            const frac = (tempC - sorted[i].tempC) / (sorted[i + 1].tempC - sorted[i].tempC);
            allowable = sorted[i].pressureBar + frac * (sorted[i + 1].pressureBar - sorted[i].pressureBar);
            break;
          }
        }
      }
      b165DerivedPressure = parseFloat(allowable.toFixed(1));
      // Convert B16.5 pressure (bar) to user's unit system for designP
      designP = us === "SI" ? b165DerivedPressure : b165DerivedPressure * BAR_TO_PSI;
      b165Note = `Design pressure is based on ASME B16.5 pressure–temperature rating limits for Class ${flangeClassNum}, Group ${flangePTGroup} (${rating.materialDescription}) at ${tempC.toFixed(0)}°C = ${b165DerivedPressure} bar.`;
    }
  }

  // ── Design Basis ──
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const svcCode = svc.replace(/[^A-Z]/gi, "").substring(0, 4).toUpperCase();
  const autoSpecNum = `PMS-${svcCode}-${flangeClass}`;

  const pUnitLabel = pressureUnit(us);
  const designPressureDisplay = useB165 && b165DerivedPressure
    ? `${designP.toFixed(1)} ${pUnitLabel} (B16.5 rated)`
    : `${inputs.designPressure} ${pUnitLabel}`;

  // ── Test Pressure — use B16.5-derived pressure when enabled ──
  const baseTestPressure = useB165 && b165DerivedPressure
    ? (designP * 1.5).toFixed(1)
    : recommendations.testPressure.value;

  const tUnitLabel = tempUnit(us);
  const lUnitLabel = lengthUnit(us);

  const designBasis: PMSDesignBasis = {
    specNumber: specNumber || autoSpecNum,
    specName: specName || `${svc} — ${matGroup} — Class ${flangeClass}`,
    designCode: "ASME B31.3",
    serviceType: svc,
    fluidPhase: inputs.fluidPhase,
    designPressure: designPressureDisplay,
    designTemperature: `${inputs.designTemperature} ${tUnitLabel}`,
    operatingPressure: `${inputs.operatingPressure} ${pUnitLabel}`,
    operatingTemperature: `${inputs.operatingTemperature} ${tUnitLabel}`,
    testPressure: `${baseTestPressure} ${pUnitLabel}${useB165 ? " (based on B16.5 P-T)" : ""}`,
    testMedium: recommendations.testMedium.value,
    corrosionAllowance: `${recommendations.corrosionAllowance.value} ${lUnitLabel}`,
    materialGroup: matGroup,
    flangeRating: `Class ${flangeClass}`,
    unitSystem: inputs.unitSystem,
    revision: "0",
    date: today,
    useB165AsDesignBasis: useB165,
    b165DerivedPressure,
    b165Note,
  };

  // ── P-T Rating Block ──
  const ptRatingBlock = buildPTRatingBlock(flangeClassNum, activePipeMaterial);

  // ── Schedule calculation — per-NPS with standardization ──
  const allowableS = recommendations.allowableStress
    ? normalizeStressToMPa(recommendations.allowableStress.value, us)
    : 0;
  const ca = normalizeLengthToMM(
    overrides.corrosionAllowance ? inputs.corrosionAllowance : recommendations.corrosionAllowance.value,
    us,
  );
  const mt = parseFloat(overrides.millTolerance ? inputs.millTolerance : recommendations.millTolerance.value) || 12.5;
  const E = parseFloat(overrides.jointQualityFactor ? inputs.jointQualityFactor : recommendations.jointQualityFactor.value) || 1.0;

  // All NPS sizes the PMS covers — EPC-preferred standard sizes only.
  // NPS 2½″ and 3½″ excluded: non-standard for EPC procurement — fittings, flanges,
  // and valves are not commonly stocked, leading to long lead times and cost premium.
  // Per PIP PNSC0001 and industry practice, material specs should only include sizes
  // that are readily procurable and reduce warehouse line items.
  const allNPS = ["0.5","0.75","1","1.25","1.5","2","3","4","6","8","10","12","14","16","18","20","24"];

  interface PerNPSCalc {
    nps: string;
    od_mm: number;
    tMin_mm: number;
    selectedSchedule: string | null;
    wt_mm: number;
  }

  const perNPSResults: PerNPSCalc[] = [];

  // IMPORTANT: allowableS is already normalized to MPa and ca is already normalized to mm.
  // We MUST pass unitSystem "SI" to selectPipeSchedule to avoid double-conversion.
  // Design pressure (designP) is still in user units (barg or psig) — normalize to barg here.
  const designP_bar = us === "SI" ? designP : designP * PSI_TO_BAR;
  const pmsDimTable = getPipeDimensionsForMaterial(activePipeMaterial);
  const usesB3619 = isStainlessDimensionalStandard(activePipeMaterial);
  const pipeDimensionalStandard = usesB3619 ? "ASME B36.19M" : "ASME B36.10M";
  const pipeDimensionalTitle = usesB3619 ? "Stainless Steel Pipe" : "Welded and Seamless Wrought Steel Pipe";

  if (allowableS > 0 && designP_bar > 0) {
    for (const npsVal of allNPS) {
      // Look up OD for this NPS — use the dimensional standard governing the
      // active pipe material (B36.19M for stainless / duplex / nickel alloys).
      const dimForNps = pmsDimTable.find(p => {
        const pNps = normalizeScheduleNps(p.nps);
        return pNps === npsVal;
      });
      if (!dimForNps) continue;

      // All values already in SI (MPa, mm, barg) — pass unitSystem "SI"
      const result = selectPipeSchedule({
        nps: npsVal,
        designPressure: designP_bar,
        outsideDiameter: dimForNps.od_mm,
        allowableStress: allowableS,
        jointFactor: E,
        yCoefficient: 0.4,
        corrosionAllowance: ca,
        millTolerance: mt,
        unitSystem: "SI",
        pipeMaterial: activePipeMaterial,
        serviceType: svc,
      });

      const sel = result.recommendation?.recommended || result.selectedSchedule;
      perNPSResults.push({
        nps: npsVal,
        od_mm: dimForNps.od_mm,
        tMin_mm: result.minimumRequired_mm,
        selectedSchedule: sel?.schedule ?? null,
        wt_mm: sel?.wt_mm || 0,
      });
    }
  }

  // ══════════════════════════════════════════════════════════════
  // VALIDATED SCHEDULE BANDING — WORLD-CLASS EPC PRACTICE
  // ══════════════════════════════════════════════════════════════
  // EPC best practice: define fixed structural bands by size range FIRST,
  // then validate and upgrade each band. Never fragment into per-NPS schedules.
  //
  // World-class PMS uses 2–3 bands maximum:
  //   Band 1: Small Bore   (½″–1½″)  → Sch 80 minimum (safety: threading, vibration, handling)
  //   Band 2: Medium Bore  (2″–12″)  → Sch 40 default (standard process piping)
  //   Band 3: Large Bore   (14″–24″) → Sch 20/30/40 (wall thickness driven, cost-sensitive)
  //
  // Rules:
  //  1. Start with EPC-default schedule for each band
  //  2. Validate every NPS in band against B31.3 tMin
  //  3. If ANY size fails → upgrade the ENTIRE band (never split)
  //  4. Only create a 4th band if upgrade would be unreasonably heavy for majority
  // ══════════════════════════════════════════════════════════════

  interface ValidatedBand { schedule: string; sizes: string[]; explanation: string; validated: boolean }

  function schedOrderIdx(s: string): number { return scheduleIndex(s); }

  function validateBand(candidateSch: string, members: PerNPSCalc[]): { pass: PerNPSCalc[]; fail: PerNPSCalc[] } {
    const pass: PerNPSCalc[] = [];
    const fail: PerNPSCalc[] = [];
    for (const m of members) {
      const dim = pmsDimTable.find(p => {
        const pNps = normalizeScheduleNps(p.nps);
        return pNps === m.nps && p.schedule === candidateSch;
      });
      if (dim && dim.wt_mm >= m.tMin_mm) {
        pass.push(m);
      } else {
        fail.push(m);
      }
    }
    return { pass, fail };
  }

  /** Find next heavier schedule that exists for ALL given NPS sizes */
  function nextHeavierForAll(currentSch: string, members: PerNPSCalc[]): string | null {
    const curIdx = schedOrderIdx(currentSch);
    for (let i = curIdx + 1; i < SCHEDULE_ORDER.length; i++) {
      const candidate = SCHEDULE_ORDER[i];
      // Must exist for ALL members, not just some
      const allExist = members.every(m =>
        pmsDimTable.some(p => {
          const pNps = normalizeScheduleNps(p.nps);
          return pNps === m.nps && p.schedule === candidate;
        })
      );
      if (allExist) return candidate;
    }
    // Fallback: exists for at least majority
    for (let i = curIdx + 1; i < SCHEDULE_ORDER.length; i++) {
      const candidate = SCHEDULE_ORDER[i];
      const count = members.filter(m =>
        pmsDimTable.some(p => {
          const pNps = normalizeScheduleNps(p.nps);
          return pNps === m.nps && p.schedule === candidate;
        })
      ).length;
      if (count >= members.length * 0.8) return candidate;
    }
    return null;
  }

  let scheduleValidationFailed = false;

  function npsToNum(s: string): number {
    const map: Record<string,number> = {"0.25":0.25,"0.5":0.5,"0.75":0.75,"1":1,"1.25":1.25,"1.5":1.5,"2":2,"3":3,"4":4,"6":6,"8":8,"10":10,"12":12,"14":14,"16":16,"18":18,"20":20,"24":24};
    return map[s] ?? parseFloat(s);
  }

  function standardizeSchedules(results: PerNPSCalc[]): ValidatedBand[] {
    const schedulePhilosophy = getServiceSchedulePhilosophy(svc);
    const defaults = schedulePhilosophy.preferred;
    const smallDefault = usesB3619 && schedulePhilosophy.smallBoreMinimum === "80"
      ? PMS_PRACTICE_RULES.smallBoreMinimumScheduleB3619.value
      : schedulePhilosophy.smallBoreMinimum;
    const mediumDefault = usesB3619 && defaults.medium[0] === "40" ? "40S" : defaults.medium[0];
    const largeDefault = usesB3619 && defaults.large[0] === "40" ? "10S" : defaults.large[0];
    if (results.length === 0) {
      return [
        { schedule: smallDefault, sizes: ["0.5","0.75","1","1.25","1.5"], explanation: `Default - Sch ${smallDefault} minimum for small bore per EPC practice and ${pipeDimensionalStandard}.`, validated: false },
        { schedule: mediumDefault, sizes: ["2","3","4","6","8","10","12"], explanation: `Default - Sch ${mediumDefault} standard for medium bore process piping per ${pipeDimensionalStandard}.`, validated: false },
        { schedule: largeDefault, sizes: ["14","16","18","20","24"], explanation: `Default - Sch ${largeDefault} for large bore per ${pipeDimensionalStandard}.`, validated: false },
      ];
    }

    // ── Step 1: Define structural bands (world-class EPC standard) ──
    const bandDefs: { label: string; defaultSch: string; sizes: string[]; minSch: string }[] = [
      {
        label: "Small Bore",
        defaultSch: smallDefault,
        minSch: smallDefault,
        sizes: ["0.5","0.75","1","1.25","1.5"],
      },
      {
        label: "Medium Bore",
        defaultSch: mediumDefault,
        minSch: mediumDefault,
        sizes: ["2","3","4","6","8","10","12"],
      },
      {
        label: "Large Bore",
        defaultSch: largeDefault,
        minSch: usesB3619 ? largeDefault : "10",
        sizes: ["14","16","18","20","24"],
      },
    ];

    const finalBands: ValidatedBand[] = [];

    for (const bandDef of bandDefs) {
      // Get calc results for sizes in this band
      const members = results.filter(r => bandDef.sizes.includes(r.nps));
      if (members.length === 0) continue;

      // Start with the EPC default schedule for this band
      let schedule = bandDef.defaultSch;

      // Ensure we don't go below the floor
      if (schedOrderIdx(schedule) < schedOrderIdx(bandDef.minSch)) {
        schedule = bandDef.minSch;
      }

      // ── Step 2: Check if any NPS requires heavier than default ──
      // Find the heaviest individually-required schedule across all members
      const heaviestRequired = members.reduce((maxIdx, m) => {
        const idx = m.selectedSchedule ? schedOrderIdx(m.selectedSchedule) : 999;
        return idx > maxIdx ? idx : maxIdx;
      }, schedOrderIdx(schedule));

      // If any member requires heavier, start validation from there
      if (heaviestRequired > schedOrderIdx(schedule)) {
      const candidate = SCHEDULE_ORDER[heaviestRequired];
      if (candidate) schedule = candidate;
      else scheduleValidationFailed = true;
      }

      // ── Step 3: Validate — upgrade entire band until ALL pass ──
      let { pass, fail } = validateBand(schedule, members);
      let attempts = 0;
      while (fail.length > 0 && attempts < 8) {
        const heavier = nextHeavierForAll(schedule, members);
        if (!heavier) break;
        schedule = heavier;
        ({ pass, fail } = validateBand(schedule, members));
        attempts++;
      }

      if (fail.length === 0) {
        // Format size range for display
        const sortedSizes = members.map(m => m.nps).sort((a, b) => npsToNum(a) - npsToNum(b));
        finalBands.push({
          schedule,
          sizes: sortedSizes,
          explanation: `${bandDef.label}: Sch ${schedule} validated per ASME B31.3 and ${pipeDimensionalStandard} for all sizes in band. ${
            schedule !== bandDef.defaultSch
              ? `Upgraded from default Sch ${bandDef.defaultSch} to satisfy thickness requirements.`
              : `EPC standard schedule for ${bandDef.label.toLowerCase()} process piping.`
          }`,
          validated: true,
        });
      } else {
        // Very rare: band cannot be unified even at XXS.
        // EPC practice: flag for engineering review, do NOT fragment.
        scheduleValidationFailed = true;
        const sortedSizes = members.map(m => m.nps).sort((a, b) => npsToNum(a) - npsToNum(b));
        finalBands.push({
          schedule,
          sizes: sortedSizes,
          explanation: `${bandDef.label}: Sch ${schedule} — ENGINEERING REVIEW REQUIRED. ` +
            `NPS ${fail.map(f => f.nps + '″').join(', ')} do not comply at this schedule. ` +
            `Consider increased NPS, material upgrade, or reduced design pressure.`,
          validated: false,
        });
      }
    }

    return finalBands;
  }

  const scheduleBands = standardizeSchedules(perNPSResults);

  // Primary schedule label for the spec (most common band)
  const primaryBand = [...scheduleBands].sort((a, b) => b.sizes.length - a.sizes.length)[0];
  const scheduleLabel = primaryBand?.schedule || "40";
  const scheduleExplanation = primaryBand?.explanation || "";

  // Build a schedule string that shows banding if multiple bands exist
  const scheduleDisplay = scheduleBands.length === 1
    ? scheduleLabel
    : scheduleBands.map(b => {
        const sizeRange = b.sizes.length > 2
          ? `NPS ${b.sizes[0]}″–${b.sizes[b.sizes.length - 1]}″`
          : b.sizes.map(s => `NPS ${s}″`).join(", ");
        return `${b.schedule} (${sizeRange})`;
      }).join(" / ");

  // Legacy band result for backward compat
  const reqThickness = perNPSResults.find(r => r.nps === (inputs.nominalPipeSize || "4"))?.tMin_mm || 0;
  const bandResult = selectBandByThickness(inputs.nominalPipeSize || "4", reqThickness, pmsDimTable);

  const scheduleValidation: PMSScheduleValidation[] = perNPSResults.map((result) => {
    const band = scheduleBands.find((candidate) => candidate.sizes.includes(result.nps));
    const materialSpecSchedule = band?.schedule || result.selectedSchedule || "ENGINEERING REVIEW";
    const materialSpecDim = pmsDimTable.find((dim) => {
      const dimNps = normalizeScheduleNps(dim.nps);
      return dimNps === result.nps && dim.schedule === materialSpecSchedule;
    });

    return {
      nps: result.nps,
      materialSpecSchedule,
      materialSpecWall_mm: materialSpecDim?.wt_mm ?? null,
      calculatedSchedule: result.selectedSchedule || "NO STANDARD SCHEDULE",
      calculatedWall_mm: result.wt_mm,
      minimumRequired_mm: result.tMin_mm,
      standard: pipeDimensionalStandard,
      meetsMinimumWall: !!materialSpecDim && materialSpecDim.wt_mm >= result.tMin_mm,
      meetsCalculatedSchedule: !!materialSpecDim && materialSpecDim.wt_mm >= result.wt_mm,
    };
  });

  // ── Material references (classification-backed) ──
  const pipe = activePipeMaterial;
  const flange = recommendations.flangeMaterial.value;
  const fitting = recommendations.fittingMaterial.value;
  const bolt = recommendations.boltMaterial.value;
  const gasket = recommendations.gasketType.value;
  const pipeFamily = classifyMaterialFamily(pipe);

  // ── Hydrogen service validation ──
  const h2Active = isHydrogenService(svc, inputs.serviceDescription);
  const designPBar = us === "SI" ? designP : designP / BAR_TO_PSI;
  const hydrogenValidation: H2ValidationResult | null = h2Active
    ? validateHydrogenService(pipeFamily, tempC, designPBar)
    : null;
  const valveClassTable = buildValveClassTable({
    pipeMaterial: pipe,
    serviceType: svc,
    corrosionSeverity: inputs.corrosionSeverity,
    designTemperature: String(tempC),
    designPressure: String(designPBar),
    serviceDescription: inputs.serviceDescription,
    flangeClass,
  });
  const valveMaterialByType = new Map<ClassValveType, typeof valveClassTable.rows[number]>(
    valveClassTable.rows.map((row) => [row.valveType, row]),
  );
  const flangeStandard = nps >= 24 ? "ASME B16.5 / B16.47" : "ASME B16.5";

  // Determine facing
  const isRtj = flangeClassNum >= 900;
  const facing = isRtj ? "RTJ" : "RF";

  // ════════════════════════════════════════════════════════════
  // BUILD MATERIAL TABLE — Complete Component Coverage
  // ════════════════════════════════════════════════════════════

  const materialTable: PMSMaterialRow[] = [];
  const noteTracker: PMSNote[] = [];
  let noteId = 1;

  function addNote(cat: PMSNote["category"], text: string, ref: string, trigger: string, linked: string[]): number {
    const id = noteId++;
    noteTracker.push({ id, category: cat, text, reference: ref, triggerCondition: trigger, linkedRows: linked });
    return id;
  }

  // ── 1. PIPE — split by manufacturing route (continuous NPS coverage) ──
  // Engineering rule: Spec must cover FULL NPS range regardless of user-selected size
  // Seamless: ½″–16″ (always), Welded: 18″–24″ (always for CS, conditional for SS)
  const pipeSmls = pipe.split(" ")[0] || "ASTM";
  const specMaxNps = 24; // Full spec coverage upper limit
  const seamlessMax = 16; // Industry boundary: seamless availability limit
  const weldedMin = 18;   // Welded pipe starts here

  const seamlessPipeNote = pipeFamily === "Carbon Steel"
    ? `Seamless pipe per ${pipeSmls}. Killed & normalized. Hydrostatic test per mill.`
    : `Seamless pipe per ${pipeSmls}. Solution annealed per applicable ASTM specification. Hydrostatic test per mill.`;
  const smNote = addNote("general", seamlessPipeNote, "ASME B31.3 §323.1", "Always: seamless pipe spec", ["Pipe (Seamless)"]);

  materialTable.push({
    component: "Pipe (Seamless)",
    category: "pipe",
    specification: pipeSmls,
    grade: pipe,
    size: `NPS ½″–${seamlessMax}″`,
    schedule: scheduleDisplay,
    rating: "-",
    endConnection: "PE (½″–1½″) / BW (2″+)",
    notes: `Note ${smNote}`,
    traceability: {
      whySelected: `${scheduleExplanation} Seamless pipe is the primary manufacturing route for process piping up to NPS ${seamlessMax}″.`,
        governingRule: `ASME B31.3 §304.1.2 — Wall thickness; ${pipeDimensionalStandard}; §323.1 — material suitability`,
      sourceField: "pipeMaterial",
    },
  });

  // Welded pipe row — NPS 18″–24″ (continuous from seamless boundary, no gap)
  const weldedEquiv = getWeldedPipeEquivalent(pipe);
  const weldedGrade = weldedEquiv?.grade || pipe;
  const weldedSpec = weldedEquiv?.spec || pipeSmls;
  const wNote = addNote("general", `Welded pipe for NPS ${weldedMin}″–${specMaxNps}″ with 100% RT. ERW or DSAW per applicable spec.`, "ASME B31.3 §302.3.4", "NPS > 16″ — welded pipe for large bore continuity", ["Pipe (Welded)"]);
  materialTable.push({
    component: "Pipe (Welded — ERW/DSAW)",
    category: "pipe",
    specification: weldedSpec,
    grade: weldedGrade,
    size: `NPS ${weldedMin}″–${specMaxNps}″`,
    schedule: scheduleDisplay,
    rating: "-",
    endConnection: "BW (Butt Weld)",
    notes: `Note ${wNote}`,
    traceability: {
      whySelected: "Welded pipe is a project-practice large-bore manufacturing route. Joint quality factor and radiography assumptions must be verified per ASME B31.3 Table A-1B and §302.3.4.",
      governingRule: "ASME B31.3 §302.3.4 — Welded pipe with RT",
      sourceField: "pipeMaterial",
    },
  });

  // ── 2. NIPPLES ──
  const nippleMinimumSchedule = usesB3619 ? "80S" : "80";
  const nipNote = addNote("general", `Nipples: seamless, minimum Sch ${nippleMinimumSchedule} (small bore ≤ 2″) or matching pipe schedule (large bore). Close nipple minimum length per MSS SP-97.`, `${pipeDimensionalStandard}, MSS SP-97`, "Always: nipple specification", ["Nipples"]);
  materialTable.push({
    component: "Nipples",
    category: "nipple",
    specification: pipeSmls,
    grade: pipe,
    size: `NPS ½″–2″`,
    schedule: `Sch ${nippleMinimumSchedule} (min)`,
    rating: "-",
    endConnection: "PE / THD / SW",
    notes: `Note ${nipNote}`,
    traceability: {
      whySelected: `Nipples specified at minimum Sch ${nippleMinimumSchedule} for small bore per industry practice and ${pipeDimensionalStandard} to compensate for threading and handling damage.`,
      governingRule: "PIP PNSC0001 — Nipple minimum schedule",
      sourceField: "pipeMaterial",
    },
  });

  // ── 3. FITTINGS — Small Bore (< 2″) ──
  // Engineering rule: BW connections start at NPS 2″. Below 2″ → SW/THD only (B31.3 §314.2)
  const sbFittingSpec = getForgedFittingSpec(pipeFamily);
  const sbFittingStd = "ASME B16.11";
  const sbNote = addNote("general", `Small bore fittings (NPS ½″–1½″): forged, socket weld or threaded per ${sbFittingStd}. Class 3000 minimum. Butt-weld connections not used below NPS 2″.`, sbFittingStd, "NPS < 2″ boundary — forged/SW/THD fittings per B31.3", ["Elbow 90° (SB)", "Elbow 45° (SB)", "Tee (SB)", "Coupling (SB)", "Half Coupling (SB)"]);

  // NPS ≤ 2″ → forged materials: A105 for CS, A182 F316L for 316L SS, etc.
  function deriveForgedGrade(bwFitting: string, family: MaterialFamily): string {
    if (family === "Carbon Steel") return "A105";
    // Map wrought BW grades to forged equivalents
    const bwToForged: Record<string, string> = {
      "A403 WP316L": "A182 F316L",
      "A403 WP316": "A182 F316",
      "A403 WP304L": "A182 F304L",
      "A403 WP304": "A182 F304",
      "A234 WP11": "A182 F11",
      "A234 WP22": "A182 F22",
      "A234 WP5": "A182 F5",
      "A234 WP9": "A182 F9",
      "A234 WPB": "A105",
    };
    // Strip ASTM prefix for matching
    const stripped = bwFitting.replace(/^ASTM\s*/i, "").trim();
    return bwToForged[stripped] || `A182 ${stripped.replace(/^A\d+\s*/, "F")}`;
  }
  const sbForgedGrade = deriveForgedGrade(fitting, pipeFamily);
  const sbRows = [
    { comp: "Elbow 90° (SB)", grade: sbForgedGrade },
    { comp: "Elbow 45° (SB)", grade: sbForgedGrade },
    { comp: "Tee (SB)", grade: sbForgedGrade },
    { comp: "Coupling (SB)", grade: sbForgedGrade },
    { comp: "Half Coupling (SB)", grade: sbForgedGrade },
  ];
  for (const r of sbRows) {
    materialTable.push({
      component: r.comp,
      category: "fitting-sb",
      specification: sbFittingSpec,
      grade: r.grade,
      size: `NPS ½″–1½″`,
      schedule: "Class 3000",
      rating: "-",
      endConnection: "SW (Socket Weld)",
      notes: `Note ${sbNote}`,
      traceability: {
        whySelected: "Forged fittings for small bore per B16.11. Socket weld ends for NPS < 2″ per ASME B31.3 §314.2.",
        governingRule: `${sbFittingStd} — Forged fittings, SW/THD below NPS 2″`,
        sourceField: "fittingMaterial",
      },
    });
  }

  // ── 4. FITTINGS — Large Bore (≥ 2″) ──
  // Engineering rule: BW connections start at NPS 2″ per B31.3
  const lbNote = addNote("general", `Large bore fittings (NPS ≥ 2″): wrought butt-weld per ASME B16.9. Thickness matching required for butt-weld joints.`, "ASME B16.9", "NPS ≥ 2″ boundary — BW fittings per B31.3", ["Elbow 90° LR (LB)", "Elbow 45° (LB)", "Tee Equal (LB)", "Reducer Con/Ecc (LB)", "Cap (LB)"]);
  const thkNote = addNote("welding", `Buttweld fittings: wall thickness to match pipe schedule (±12.5%). Transition tapers per B31.3 §328.4.3 for thickness mismatch > 1.6 mm.`, "ASME B31.3 §328.4.3", "BW fittings exist — thickness matching required", ["Elbow 90° LR (LB)", "Elbow 45° (LB)", "Tee Equal (LB)", "Reducing Tee (LB)", "Reducer Con/Ecc (LB)", "Cap (LB)"]);

  // NPS > 2″ → wrought BW fittings (A234 WPB for CS)
  const lbFittingGrade = pipeFamily === "Carbon Steel" ? "ASTM A234 WPB" : fitting;
  const lbFittingSpec = pipeFamily === "Carbon Steel" ? "ASTM" : (fitting.split(" ")[0] || "ASTM");
  const lbRows = [
    { comp: "Elbow 90° LR (LB)" },
    { comp: "Elbow 45° (LB)" },
    { comp: "Tee Equal (LB)" },
    { comp: "Reducing Tee (LB)" },
    { comp: "Reducer Con/Ecc (LB)" },
    { comp: "Cap (LB)" },
  ];
  for (const r of lbRows) {
    materialTable.push({
      component: r.comp,
      category: "fitting-lb",
      specification: lbFittingSpec,
      grade: lbFittingGrade,
      size: `NPS 2″–${specMaxNps}″`,
      schedule: `Note ${thkNote}`,
      rating: "-",
      endConnection: "BW (Butt Weld)",
      notes: `Note ${lbNote}, ${thkNote}`,
      traceability: {
        whySelected: `Wrought butt-weld fittings per B16.9 for NPS ≥ 2″. ${pipeFamily === "Carbon Steel" ? "A234 WPB for carbon steel BW fittings." : ""} BW connections start at NPS 2″ per ASME B31.3.`,
        governingRule: "ASME B16.9 — BW fittings from NPS 2″, thickness per pipe schedule",
        sourceField: "fittingMaterial",
      },
    });
  }

  // ── 5. VALVES — Expanded (body/trim/seat/bore/end) ──
  const valveNote = addNote("general", `Valves: full bore (FB) for NPS ≤ 2″, regular bore for larger sizes. Gear operator for NPS ≥ 8″.`, "API 600, API 602", "Always: valve bore/operator rules", ["Gate Valve (SB)", "Gate Valve (LB)", "Globe Valve (SB)", "Globe Valve (LB)", "Check Valve (SB)", "Check Valve (LB)", "Ball Valve (SB)", "Ball Valve (LB)"]);
  const ballNote = addNote("general", `Ball valves: floating ball for NPS ≤ 2″, trunnion mounted for NPS ≥ 3″. Full bore, fire-safe per API 607.`, "API 608, API 607", "Ball valve selection rules", ["Ball Valve (SB)", "Ball Valve (LB)"]);
  const valveEndNote = addNote("connection", `Valve end connections: Socket Weld (SW) for NPS ≤ 1½″. Flanged (${facing}) or Butt Weld (BW) for NPS ≥ 2″ per ASME B31.3.`, "ASME B31.3 §314.2, API 600/602", "Valve end connection by size — BW/flanged from NPS 2″", ["Gate Valve (SB)", "Gate Valve (LB)", "Globe Valve (SB)", "Globe Valve (LB)", "Check Valve (SB)", "Check Valve (LB)", "Ball Valve (SB)", "Ball Valve (LB)"]);

  // Split valves into Small Bore and Large Bore rows for correct end connections
  const valveDefs: { name: ClassValveType; specSB: string; specLB: string; sizeSB: string; sizeLB: string; boreSB: string; boreLB: string; endSB: string; endLB: string; isBall?: boolean }[] = [
    { name: "Gate Valve", specSB: "API 602", specLB: "API 600", sizeSB: `NPS ½″–1½″`, sizeLB: `NPS 2″–${specMaxNps}″`, boreSB: "FB", boreLB: "RB", endSB: "SW", endLB: `${facing} / BW` },
    { name: "Globe Valve", specSB: "API 602", specLB: "BS 1873", sizeSB: `NPS ½″–1½″`, sizeLB: `NPS 2″–${specMaxNps}″`, boreSB: "FB", boreLB: "FB", endSB: "SW", endLB: facing },
    { name: "Check Valve", specSB: "API 602", specLB: "API 594", sizeSB: `NPS ½″–1½″`, sizeLB: `NPS 2″–${specMaxNps}″`, boreSB: "FB", boreLB: "RB", endSB: "SW", endLB: `${facing} / BW` },
    { name: "Ball Valve", specSB: "API 608", specLB: "API 608", sizeSB: `NPS ½″–1½″`, sizeLB: `NPS 2″–${specMaxNps}″`, boreSB: "FB", boreLB: "FB", endSB: "SW", endLB: facing, isBall: true },
  ];

  for (const v of valveDefs) {
    const valveMaterials = valveMaterialByType.get(v.name);
    if (!valveMaterials) continue;
    const smallBoreBody = valveMaterials.smallBoreBody || valveMaterials.body;
    const largeBoreBody = valveMaterials.largeBoreBody || valveMaterials.body;
    const noteStr = v.isBall ? `Note ${valveNote}, ${ballNote}, ${valveEndNote}` : `Note ${valveNote}, ${valveEndNote}`;
    // Small Bore row
    materialTable.push({
      component: `${v.name} (SB)`,
      category: "valve",
      specification: v.specSB,
      grade: smallBoreBody,
      size: v.sizeSB,
      schedule: "-",
      rating: `Class ${flangeClass}`,
      endConnection: v.endSB,
      notes: noteStr,
      valveBody: smallBoreBody,
      valveTrim: valveMaterials.trim,
      valveSeat: valveMaterials.seat,
      valveBore: v.boreSB,
      traceability: {
        whySelected: `${v.name} SB: ${v.specSB}, forged/small-bore body ${smallBoreBody}. ${valveMaterials.basis}`,
        governingRule: `${v.specSB} — Small bore valve`,
        sourceField: "valve class table",
      },
    });
    // Large Bore row
    materialTable.push({
      component: `${v.name} (LB)`,
      category: "valve",
      specification: v.specLB,
      grade: largeBoreBody,
      size: v.sizeLB,
      schedule: "-",
      rating: `Class ${flangeClass}`,
      endConnection: v.endLB,
      notes: noteStr,
      valveBody: largeBoreBody,
      valveTrim: valveMaterials.trim,
      valveSeat: valveMaterials.seat,
      valveBore: v.boreLB,
      traceability: {
        whySelected: `${v.name} LB: ${v.specLB}, cast/large-bore body ${largeBoreBody}. ${valveMaterials.basis}`,
        governingRule: `${v.specLB} — Large bore valve`,
        sourceField: "valve class table",
      },
    });
  }

  // ── 6. FLANGES — Rule-based (WN/SO/SW/Blind) — continuous NPS coverage ──
  const flangeSchNote = addNote("general", `Flanges: bore and attachment to suit connected pipe schedule.`, `${flangeStandard}`, "Flange bore/schedule matching", ["Flange — Weld Neck (WN)", "Flange — Slip-On (SO)", "Flange — Socket Weld (SW)", "Flange — Blind"]);
  const flangeTypeNote = addNote("general", `Weld Neck flanges preferred for NPS ≥ 2″. Socket Weld for NPS ≤ 1½″. Flanged connections at smaller sizes may be used where required by design, maintenance access, vendor interface, or project practice. All ${facing} unless noted. Blind flanges per ${flangeStandard}.`, `${flangeStandard}, ASME B31.3 §314.2`, "Flange type rules by NPS", ["Flange — Weld Neck (WN)", "Flange — Socket Weld (SW)", "Flange — Blind"]);

  const flangeSpec = flange.split(" ")[0] || "ASTM";

  // WN flanges — NPS 2″–24″ (primary large bore flange, includes NPS 2″)
  materialTable.push({
    component: "Flange — Weld Neck (WN)",
    category: "flange",
    specification: flangeSpec,
    grade: flange,
    size: `NPS 2″–${specMaxNps}″`,
    schedule: "-",
    rating: `CL ${flangeClass} / Note ${flangeSchNote}`,
    endConnection: `${facing}`,
    notes: `Note ${flangeTypeNote}`,
    traceability: {
      whySelected: `WN flanges provide integral hub reinforcement for butt-weld connection. Preferred for NPS ≥ 2″. ${flange} forged material matches pipe family for weldability.`,
      governingRule: `${flangeStandard} — WN preferred for NPS ≥ 2″`,
      sourceField: "flangeMaterial + nominalPipeSize",
    },
  });

  // Note: SO flanges removed from standard spec — WN covers NPS ≥ 2″. BW/flanged connections not used below NPS 2″ per B31.3.

  // SW flanges — NPS ½″–1½″
  materialTable.push({
    component: "Flange — Socket Weld (SW)",
    category: "flange",
    specification: flangeSpec,
    grade: flange,
    size: `NPS ½″–1½″`,
    schedule: "-",
    rating: `CL ${flangeClass} / Note ${flangeSchNote}`,
    endConnection: "SW",
    notes: `Note ${flangeTypeNote}`,
    traceability: {
      whySelected: "SW flanges for small bore connections. Socket weld provides reliable joint without need for butt-weld preparation at small sizes.",
      governingRule: `${flangeStandard} — SW for NPS ≤ 1½″`,
      sourceField: "flangeMaterial + nominalPipeSize",
    },
  });

  // Blind flanges — full range
  materialTable.push({
    component: "Flange — Blind",
    category: "flange",
    specification: flangeSpec,
    grade: flange,
    size: `NPS ½″–${specMaxNps}″`,
    schedule: "-",
    rating: `CL ${flangeClass} / Note ${flangeSchNote}`,
    endConnection: facing,
    notes: `Note ${flangeTypeNote}`,
    traceability: {
      whySelected: "Blind flanges for line termination, vessel nozzles, and equipment isolation points.",
      governingRule: `${flangeStandard} — Blind flanges`,
      sourceField: "flangeMaterial",
    },
  });

  // ── 7. GASKETS — full spec range ──
  const gasketNote = addNote("general", `Gasket inner ring material to match piping material group. Centering ring carbon steel unless otherwise specified.${isRtj ? " RTJ gaskets for ≥900# service." : ""}`, "ASME B16.20", `Flange class ${flangeClass} → gasket type`, ["Gasket"]);
  materialTable.push({
    component: "Gasket",
    category: "gasket",
    specification: "ASME B16.20",
    grade: gasket,
    size: `NPS ½″–${specMaxNps}″`,
    schedule: "-",
    rating: `Class ${flangeClass}`,
    endConnection: "-",
    notes: `Note ${gasketNote}`,
    traceability: {
      whySelected: `${gasket} selected for Class ${flangeClass} ${facing} service. ${isRtj ? "RTJ required for ≥900# per industry practice." : "Spiral wound is standard for RF flanges."}`,
      governingRule: "ASME B16.20 — Gasket specification",
      sourceField: "flangeClass + flangeFacing",
    },
  });

  // ── 8. BOLTING ──
  const boltNote = addNote("welding", `Stud bolts: length per ${flangeStandard}. Hot-dip galvanized nuts for outdoor service. ${isSourService(svc) ? "Xylan coated for sour service. Max hardness 22 HRC per NACE MR0175." : ""}`, `${flangeStandard}, ASTM A193/A194${isSourService(svc) ? ", NACE MR0175" : ""}`, "Always: bolting spec", ["Stud Bolt", "Hex Nut"]);
  
  materialTable.push({
    component: "Stud Bolt",
    category: "bolting",
    specification: bolt.split(" ")[0] || "ASTM",
    grade: bolt.split("/")[0]?.trim() || bolt,
    size: `Per flange table`,
    schedule: "-",
    rating: `Class ${flangeClass}`,
    endConnection: "-",
    notes: `Note ${boltNote}`,
    traceability: {
      whySelected: `${bolt} selected for temperature range and material compatibility with ${flange} flanges.`,
      governingRule: `${flangeStandard} Table 6 — Bolting`,
      sourceField: "boltMaterial",
    },
  });

  materialTable.push({
    component: "Hex Nut",
    category: "bolting",
    specification: bolt.split("/")[1]?.trim().split(" ")[0] || "ASTM",
    grade: bolt.split("/")[1]?.trim() || "A194 2H",
    size: `Per flange table`,
    schedule: "-",
    rating: `Class ${flangeClass}`,
    endConnection: "-",
    notes: `Note ${boltNote}`,
    traceability: {
      whySelected: `Nut grade matched to stud bolt per ${flangeStandard}.`,
      governingRule: `${flangeStandard} Table 6 — Nut grade`,
      sourceField: "boltMaterial",
    },
  });

  // ════════════════════════════════════════════════════════════
  // CONDITIONAL NOTES (only when triggered)
  // ════════════════════════════════════════════════════════════

  // PWHT note — triggered by thickness threshold
  const wallThreshold = getPWHTThreshold(pipeFamily);
  const userNpsCalc = perNPSResults.find(r => r.nps === (inputs.nominalPipeSize || "4"));
  const actualWall = userNpsCalc?.wt_mm || 0;
  if (actualWall > wallThreshold || isHighTempService(tempC)) {
    addNote("welding", `PWHT required: wall thickness ${actualWall.toFixed(1)} mm exceeds ${wallThreshold} mm threshold for ${matGroup}. Per B31.3 §331.1.1.`, "ASME B31.3 §331.1.1", `Wall > ${wallThreshold}mm or T > 425°C → PWHT required`, ["Pipe (Seamless)", "Elbow 90° LR (LB)", "Tee Equal (LB)"]);
  }

  // NDE note
  addNote("examination", `NDE per ASME B31.3 Table 341.3.2.${inputs.categoryM === "Yes" ? " Category M fluid service requires 100% RT for all butt welds per Chapter VIII." : ""} ${designP > 100 ? "High pressure service: increased NDE scope recommended." : ""}`, "ASME B31.3 §341.3", "Always: NDE requirements", ["Pipe (Seamless)", "Elbow 90° LR (LB)"]);

  // Sour/corrosive service note — conditional, not blanket acceptance
  if (isSourService(svc)) {
    const sourNote = pipeFamily === "Stainless" || pipeFamily === "Duplex"
      ? "Sour service compliance is conditional: all materials must be qualified per NACE MR0175/ISO 15156 for the applicable service severity level, H₂S partial pressure, pH, chloride concentration, and temperature. Austenitic stainless steels may be acceptable depending on hardness (≤22 HRC), cold work limits, and environmental conditions per NACE Table A.3/A.4. PMI required for all alloy components."
      : "All materials to comply with NACE MR0175/ISO 15156. Max hardness 22 HRC for CS, 35 HRC for alloy steel. Positive Material Identification (PMI) required for all alloy components.";
    addNote("service", sourNote, "NACE MR0175/ISO 15156", "Service type is Sour/Corrosive → NACE qualification required", ["Pipe (Seamless)", "Flange — Weld Neck (WN)", "Gate Valve (LB)"]);
  }

  // Category M note — Chapter VIII (NOT Chapter IX which is High Pressure)
  if (inputs.categoryM === "Yes") {
    addNote("service", "Category M fluid service: enhanced NDE, sensitive leak test, and restricted joint types per ASME B31.3 Chapter VIII (§M300–M345). No pneumatic testing permitted.", "ASME B31.3 Chapter VIII", "Category M = Yes → Chapter VIII (toxic/lethal) requirements", ["Pipe (Seamless)", "Gate Valve (LB)", "Gasket"]);
  }

  // Threading restriction for small bore
  if (nps >= 0.5) {
    addNote("connection", "Threaded connections: NPS ≤ 1½″ only, and not permitted for Category M, flammable, or toxic service per B31.3 §314.2.1. Seal-welded where used.", "ASME B31.3 §314.2.1", "Small bore sizes exist → threading restriction", ["Coupling (SB)", "Half Coupling (SB)"]);
  }

  // ════════════════════════════════════════════════════════════
  // MATERIAL CONTINUITY CHECKS
  // ════════════════════════════════════════════════════════════

  const materialContinuity: MaterialContinuityCheck[] = [];

  function checkContinuity(comp: string, mat: string, expectedGroup: PMSMaterialGroup) {
    const actualGroup = classifyPMSGroup(mat);
    // Cast valve bodies (e.g., WCB for CS) are compatible even though classified differently
    const castValveBody = comp.startsWith("Valve Body");
    const ok = actualGroup === expectedGroup || castValveBody;
    materialContinuity.push({
      component: comp,
      material: mat,
      compatible: ok,
      note: ok
        ? `${mat} is compatible with ${pipe} (${expectedGroup} family)`
        : `⚠ Review Required: ${mat} (${actualGroup}) does not match pipe family (${expectedGroup}). Verify weldability and galvanic compatibility.`,
    });
  }

  checkContinuity("Pipe", pipe, matGroup);
  checkContinuity("Flange", flange, matGroup);
  checkContinuity("Fitting", fitting, matGroup);
  const smallBoreValveBodies = new Set(valveClassTable.rows.map((row) => row.smallBoreBody));
  for (const valveBody of smallBoreValveBodies) {
    checkContinuity("Valve Body (SB forged)", valveBody, matGroup);
  }
  const largeBoreValveBodies = new Set(
    valveClassTable.rows
      .filter((row) => row.valveType !== "Needle Valve")
      .map((row) => row.largeBoreBody),
  );
  for (const valveBody of largeBoreValveBodies) {
    checkContinuity("Valve Body (LB cast)", valveBody, matGroup);
  }
  checkContinuity("Bolt", bolt, matGroup === "Carbon Steel" ? "Carbon Steel" : matGroup); // Bolts are typically alloy

  // Mark bolt as always compatible (alloy bolts are standard across groups)
  const boltCheck = materialContinuity.find(c => c.component === "Bolt");
  if (boltCheck) {
    boltCheck.compatible = true;
    boltCheck.note = `${bolt} — alloy steel bolting is standard across all material groups per ASME B16.5.`;
  }

  // ════════════════════════════════════════════════════════════
  // BRANCH CONNECTION (logic-driven, not static)
  // ════════════════════════════════════════════════════════════

  const branchRules: PMSBranchRule[] = [
    { headerSize: `NPS ≥ 2″`, branchSize: "Equal", connectionType: "Tee (BW)", reinforcement: "Standard tee per ASME B16.9", note: "ASME B16.9" },
    { headerSize: `NPS ≥ 2″`, branchSize: "1–2 sizes down", connectionType: "Reducing Tee (BW)", reinforcement: "Standard reducing tee per ASME B16.9", note: "ASME B16.9" },
    { headerSize: `NPS ≥ 2″`, branchSize: "≥ 3 sizes down (NPS ≥ 2″ branch)", connectionType: "Weldolet (BW)", reinforcement: "Integral per MSS SP-97", note: "MSS SP-97" },
    { headerSize: `NPS ≥ 2″`, branchSize: "NPS ≤ 1½″ branch", connectionType: "Sockolet (SW)", reinforcement: "Integral per MSS SP-97", note: "MSS SP-97" },
    { headerSize: `NPS ≤ 1½″`, branchSize: "Equal", connectionType: "Tee (SW)", reinforcement: "-", note: "ASME B16.11" },
    { headerSize: `NPS ≤ 1½″`, branchSize: "1 size down", connectionType: "Reducing Tee (SW)", reinforcement: "-", note: "ASME B16.11" },
  ];

  // Dynamic branch matrix
  const headerSizes = ["48","42","36","30","24","20","18","16","14","12","10","8","6","4","3","2","1-1/2","1","3/4","1/2"];
  const branchSizes = [...headerSizes];

  function sizeToNum(s: string): number {
    const map: Record<string, number> = {"1/2":0.5,"3/4":0.75,"1":1,"1-1/2":1.5,"2":2,"3":3,"4":4,"6":6,"8":8,"10":10,"12":12,"14":14,"16":16,"18":18,"20":20,"24":24,"30":30,"36":36,"42":42,"48":48};
    return map[s] || parseFloat(s);
  }

  const sizeOrder = [0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30, 36, 42, 48];

  const grid: BranchCode[][] = branchSizes.map(branch => {
    const bNum = sizeToNum(branch);
    const bIdx = sizeOrder.indexOf(bNum);
    return headerSizes.map(header => {
      const hNum = sizeToNum(header);
      const hIdx = sizeOrder.indexOf(hNum);
      if (bNum > hNum) return "" as BranchCode;
      if (bNum === hNum) return "T" as BranchCode;
      const stepsDiff = hIdx - bIdx;
      if (bNum <= 1.5 && hNum >= 2) return "S" as BranchCode;
      if (bNum <= 1.5 && hNum <= 1.5) {
        return stepsDiff <= 1 ? "R" as BranchCode : "S" as BranchCode;
      }
      if (stepsDiff <= 2) return "R" as BranchCode;
      return "W" as BranchCode;
    });
  });

  const branchMatrix: BranchMatrix = { headerSizes, branchSizes, grid };

  // ════════════════════════════════════════════════════════════
  // REFERENCES (auto-generated from applied rules)
  // ════════════════════════════════════════════════════════════

  const references: PMSReference[] = [
    { standard: "ASME B31.3", title: "Process Piping", appliedTo: "Design code, wall thickness, NDE, testing" },
    { standard: flangeStandard, title: "Pipe Flanges and Flanged Fittings", appliedTo: "Flange rating, P-T curves, dimensions" },
    { standard: "ASME B16.9", title: "Factory-Made Wrought BW Fittings", appliedTo: "Large bore fittings (NPS > 2″)" },
    { standard: "ASME B16.11", title: "Forged Fittings, Socket-Welding and Threaded", appliedTo: "Small bore fittings (NPS ≤ 2″)" },
    { standard: "ASME B16.20", title: "Metallic Gaskets for Pipe Flanges", appliedTo: "Gasket specification" },
    { standard: pipeDimensionalStandard, title: pipeDimensionalTitle, appliedTo: "Pipe dimensions and schedules" },
    { standard: "MSS SP-97", title: "Integrally Reinforced Forged Branch Outlet Fittings", appliedTo: "Weldolets, Sockolets" },
    { standard: "API 600", title: "Steel Gate Valves", appliedTo: "Gate valves NPS > 2″" },
    { standard: "API 602", title: "Compact Steel Gate Valves", appliedTo: "Small bore valves NPS ≤ 2″" },
    { standard: "API 608", title: "Metal Ball Valves", appliedTo: "Ball valves" },
    { standard: "ASME Sec II-D", title: "Materials — Properties", appliedTo: "Allowable stress values" },
  ];

  // Add conditional references
  if (isSourService(svc)) {
    references.push({ standard: "NACE MR0175/ISO 15156", title: "Sulfide Stress Cracking Resistant Materials", appliedTo: "Material hardness and chemistry limits" });
  }
  if (nps >= 24) {
    references.push({ standard: "ASME B16.47", title: "Large Diameter Steel Flanges (NPS 26–60)", appliedTo: "Flanges NPS ≥ 26″" });
  }
  if (inputs.categoryM === "Yes") {
    references.push({ standard: "ASME B31.3 Ch. VIII", title: "Piping for Category M Fluid Service", appliedTo: "Category M (toxic/lethal) fluid service" });
  }
  if (inputs.highPressure === "Yes") {
    references.push({ standard: "ASME B31.3 Ch. IX", title: "High Pressure Piping", appliedTo: "High pressure piping design" });
  }

  // ── Hydrogen service notes and references ──
  if (hydrogenValidation) {
    const h2 = hydrogenValidation;
    // Main validation note
    addNote("service",
      h2.status === "Acceptable"
        ? `Material selection validated against hydrogen service considerations (${h2.nelsonCurveRef}). ${h2.explanation}`
        : `⚠ ${h2.explanation}`,
      "API RP 941, ASME B31.3 §323.1",
      `Hydrogen service detected → Nelson Curve evaluation (${h2.status})`,
      ["Pipe (Seamless)", "Pipe (Welded — ERW/DSAW)", "Elbow 90° LR (LB)", "Tee Equal (LB)"],
    );

    // Material escalation note
    if (h2.materialEscalation) {
      addNote("service", h2.materialEscalation,
        "API RP 941 Fig. 1",
        "Hydrogen service material escalation recommendation",
        ["Pipe (Seamless)"],
      );
    }

    // Recommendations as individual notes
    for (const rec of h2.recommendations) {
      addNote("service", rec, "API RP 941", "Hydrogen service recommendation", ["Pipe (Seamless)"]);
    }

    // NDE upgrade
    if (h2.ndeUpgrade) {
      addNote("examination", h2.ndeNote,
        "API RP 941, ASME B31.3 §341.3",
        "Enhanced NDE required for hydrogen service",
        ["Pipe (Seamless)", "Pipe (Welded — ERW/DSAW)", "Elbow 90° LR (LB)", "Tee Equal (LB)", "Flange — Weld Neck (WN)"],
      );
    }

    references.push({ standard: "API RP 941", title: "Steels for Hydrogen Service at Elevated Temperatures", appliedTo: "Hydrogen service material suitability (Nelson Curves)" });
  }

  // ── Schedule validation note ──
  if (perNPSResults.length > 0 && !scheduleValidationFailed) {
    addNote("general",
      "Pipe schedules shown have been validated per ASME B31.3 for all NPS within each listed size band. Schedule grouping is minimized for practical material control, but no grouped band is accepted unless all included sizes satisfy the required thickness and are not below the pipe schedule module result for that NPS.",
      `ASME B31.3 §304.1.2, ${pipeDimensionalStandard}`,
      "Schedule validation passed for all grouped bands",
      ["Pipe (Seamless)", "Pipe (Welded — ERW/DSAW)"],
    );
  } else if (scheduleValidationFailed) {
    addNote("general",
      "Schedule grouping review required — one or more sizes do not comply within the proposed common band. Individual schedules have been assigned where the common band could not be validated.",
      `ASME B31.3 §304.1.2, ${pipeDimensionalStandard}`,
      "Schedule validation failed for one or more NPS in proposed band",
      ["Pipe (Seamless)", "Pipe (Welded — ERW/DSAW)"],
    );
  }

  return {
    designBasis,
    ptRatingBlock,
    materialTable,
    notes: noteTracker,
    branchRules,
    branchMatrix,
    scheduleBand: bandResult.band,
    references,
    materialContinuity,
    hydrogenValidation,
    scheduleValidation,
  };
}
