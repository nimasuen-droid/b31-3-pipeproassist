/**
 * Pipe Schedule Selection Engine
 * Standard dimensions from ASME B36.10M (carbon/alloy) and B36.19M (stainless)
 * 
 * Sources:
 * - ASME B36.10M — Welded and Seamless Wrought Steel Pipe
 * - ASME B36.19M — Stainless Steel Pipe
 * - Wall thickness formula: ASME B31.3 §304.1.2, Eq. (3a)
 */

import { ALL_PIPE_DIMENSIONS, getPipeDimensionsForMaterial, isStainlessDimensionalStandard } from "./sourceData";
import {
  normalizeStressToMPa, normalizeLengthToMM,
  PSI_TO_MPA, IN_TO_MM, MM_TO_IN,
  type UnitSystem,
} from "@/lib/unitConversion";
import { PMS_PRACTICE_RULES } from "./engineeringRules";

export interface PipeDimension {
  nps: string;           // Nominal Pipe Size
  od_mm: number;         // Outside diameter (mm)
  od_in: number;         // Outside diameter (inches)
  schedule: string;
  wt_mm: number;         // Wall thickness (mm)
  wt_in: number;         // Wall thickness (inches)
  id_mm: number;         // Inside diameter (mm)
  weightPerMeter: number; // kg/m (empty steel)
  standard: string;      // B36.10M or B36.19M
}

// Combined dimension table — B36.10M + B36.19M (S-schedules).
// Callers that need a material-specific subset should use
// getPipeDimensionsForMaterial(designation) from ./sourceData.
export const PIPE_DIMENSIONS: PipeDimension[] = ALL_PIPE_DIMENSIONS;



export interface ScheduleSelectionResult {
  requiredThickness_mm: number;
  corroded_mm: number;
  /** Min thickness from pressure/CA/mill-tol BEFORE structural floor */
  pressureMinRequired_mm: number;
  /** Structural minimum applied (mm); 0 if not applied */
  structuralMin_mm: number;
  /** Whether the structural minimum check was applied */
  structuralMinApplied: boolean;
  /** Whether the structural minimum governs over the pressure-derived value */
  structuralGoverns: boolean;
  /** Final governing minimum required thickness */
  minimumRequired_mm: number;
  selectedSchedule: PipeDimension | null;
  availableSchedules: PipeDimension[];
  utilizationRatio: number;
  governingCase: string;
  explanation: string;
  source: string;
  /** New: engineering recommendation details */
  recommendation: ScheduleRecommendation;
}

export interface ScheduleRecommendation {
  /** The engineer-recommended schedule (may differ from min-passing) */
  recommended: PipeDimension | null;
  /** The minimum passing schedule (thinnest that works) */
  minimumPassing: PipeDimension | null;
  /** All technically acceptable schedules */
  acceptable: PipeDimension[];
  /** Human-readable reason for the recommendation */
  reason: string;
  /** Decision factors that contributed */
  factors: RecommendationFactor[];
}

export interface RecommendationFactor {
  name: string;
  weight: "high" | "medium" | "low";
  description: string;
}

/** Common/preferred schedules by NPS range — EPC best practice for materials management.
 * Safety-first: small bore minimum Sch 80 (handling/threading damage compensation).
 * Materials management: fewer schedule varieties = easier procurement and warehousing. */
const PREFERRED_SCHEDULES: Record<string, string[]> = {
  small: [PMS_PRACTICE_RULES.smallBoreMinimumScheduleB3610.value, "160"],
  medium: ["40", "80", "160"],          // NPS 2″–6″ — Sch 40 is standard process
  large: ["40", "80"],                  // NPS 8″–12″
  xlarge: ["20", "30", "40"],           // NPS 14″+
};

type ScheduleSizeRange = "small" | "medium" | "large" | "xlarge";

export interface ServiceSchedulePhilosophy {
  preferred: Record<ScheduleSizeRange, string[]>;
  smallBoreMinimum: string;
  reason: string;
}

export function getServiceSchedulePhilosophy(serviceType?: string): ServiceSchedulePhilosophy {
  if (serviceType === "Instrument Air") {
    return {
      preferred: {
        small: ["40", "80"],
        medium: ["10", "20", "40"],
        large: ["10", "20", "40"],
        xlarge: ["10", "20", "30", "40"],
      },
      smallBoreMinimum: "40",
      reason: "Instrument air is clean, dry, low-pressure utility service; use the lightest validated common schedule instead of global process-service stock defaults.",
    };
  }

  return {
    preferred: PREFERRED_SCHEDULES as Record<ScheduleSizeRange, string[]>,
    smallBoreMinimum: PMS_PRACTICE_RULES.smallBoreMinimumScheduleB3610.value,
    reason: "Process-service PMS default prioritizes robustness, handling, threading tolerance, and warehouse standardization.",
  };
}

/**
 * Default project/company structural minimum wall thickness table (mm).
 * Practical robustness safeguard for handling, fabrication, installation,
 * vibration tolerance. NOT an ASME B31.3 fixed minimum.
 */
export function getStructuralMinimumThickness_mm(npsNum: number): number {
  if (npsNum <= 1) return 1.5;          // NPS 1/2 to 1
  if (npsNum <= 2) return 2.0;          // NPS 1-1/2 to 2
  if (npsNum <= 6) return 2.5;          // NPS 3 to 6
  return 3.0;                           // NPS 8 and above
}

/** Canonical schedule ordering for sorting & comparison
 *  Schedule-based designations only per ASME B36.10M / B36.19M.
 *  Std/XS/XXS labels are intentionally excluded. */
export const SCHEDULE_ORDER = ["5","5S","10","10S","20","30","40","40S","60","80","80S","100","120","140","160"];

export function scheduleIndex(sch: string): number {
  const idx = SCHEDULE_ORDER.indexOf(sch);
  return idx === -1 ? 999 : idx;
}

export function isScheduleAtLeast(candidate: string, required: string): boolean {
  return scheduleIndex(candidate) >= scheduleIndex(required);
}

function npsToNumber(nps: string): number {
  const map: Record<string, number> = {
    "0.25": 0.25, "0.5": 0.5, "0.75": 0.75, "1": 1, "1.25": 1.25,
    "1.5": 1.5, "2": 2, "2.5": 2.5, "3": 3, "3.5": 3.5, "4": 4,
    "6": 6, "8": 8, "10": 10, "12": 12, "14": 14, "16": 16,
    "18": 18, "20": 20, "24": 24,
  };
  return map[nps] ?? (parseFloat(nps) || 0);
}

function getNpsSizeRange(npsNum: number): ScheduleSizeRange {
  if (npsNum <= 1.5) return "small";
  if (npsNum <= 6) return "medium";
  if (npsNum <= 12) return "large";
  return "xlarge";
}

export function normalizeScheduleNps(nps: string): string {
  const npsClean = nps.replace(/['"]/g, "").trim();
  const npsMap: Record<string, string> = {
    "1/4": "0.25", "1/2": "0.5", "3/4": "0.75", "1-1/4": "1.25", "1-1/2": "1.5", "2-1/2": "2.5", "3-1/2": "3.5",
  };
  return npsMap[npsClean] || npsClean.replace(/[^\d.]/g, "");
}

/**
 * Engineering schedule recommendation engine.
 * Evaluates all passing schedules and selects the best-fit using multi-criteria logic.
 */
function recommendSchedule(
  acceptable: PipeDimension[],
  tMin: number,
  npsNorm: string,
  philosophy: ServiceSchedulePhilosophy,
  allSizesContext?: { nps: string; schedule: string }[],
): ScheduleRecommendation {
  if (acceptable.length === 0) {
    return {
      recommended: null,
      minimumPassing: null,
      acceptable: [],
      reason: "No standard schedule meets the minimum required thickness.",
      factors: [],
    };
  }

  // Sort acceptable by wall thickness ascending
  const sorted = [...acceptable].sort((a, b) => a.wt_mm - b.wt_mm);
  const minimumPassing = sorted[0];
  const npsNum = npsToNumber(npsNorm);
  const sizeRange = getNpsSizeRange(npsNum);
  const preferred = philosophy.preferred[sizeRange];

  // Score each acceptable schedule — SAFETY-FIRST EPC approach
  const scored = sorted.map(sch => {
    let score = 0;
    const factors: RecommendationFactor[] = [];
    const npsNum = npsToNumber(npsNorm);
    const isSmallBore = npsNum <= 1.5;

    // Factor 1: Safety margin (HIGHEST PRIORITY in EPC)
    // Target utilization: 50-75% for safety. >85% is unacceptable in practice.
    const util = tMin / sch.wt_mm;
    if (util >= 0.50 && util <= 0.75) {
      score += 40;
      factors.push({ name: "Safety margin", weight: "high", description: `Utilization ${(util*100).toFixed(0)}% — excellent safety margin for EPC practice` });
    } else if (util > 0.75 && util <= 0.85) {
      score += 25;
      factors.push({ name: "Safety margin", weight: "medium", description: `Utilization ${(util*100).toFixed(0)}% — adequate margin` });
    } else if (util > 0.85) {
      score += 5;
      factors.push({ name: "Safety margin", weight: "low", description: `Utilization ${(util*100).toFixed(0)}% — too tight for EPC, consider heavier schedule` });
    } else {
      // util < 0.50 — conservative but acceptable for safety
      score += 20;
      factors.push({ name: "Safety margin", weight: "medium", description: `Utilization ${(util*100).toFixed(0)}% — conservative, acceptable for safety-critical service` });
    }

    // Factor 2: project/client PMS small-bore robustness default.
    // B31.3 does not mandate Sch 80; the app cites this as project practice.
    if (isSmallBore) {
      const schIdx = scheduleIndex(sch.schedule);
      const minimumIdx = scheduleIndex(philosophy.smallBoreMinimum);
      const smallBoreBasis =
        philosophy.smallBoreMinimum === PMS_PRACTICE_RULES.smallBoreMinimumScheduleB3610.value
          ? `project default minimum Sch ${philosophy.smallBoreMinimum} (${PMS_PRACTICE_RULES.smallBoreMinimumScheduleB3610.reference})`
          : `service-specific minimum Sch ${philosophy.smallBoreMinimum} (${philosophy.reason})`;
      if (schIdx >= minimumIdx) {
        score += 30;
        factors.push({ name: "Small bore safety", weight: "high", description: `${sch.schedule} meets ${smallBoreBasis} for small bore - compensates for threading, handling, and vibration review where applicable` });
      } else {
        score -= 20;
        factors.push({ name: "Small bore safety", weight: "low", description: `${sch.schedule} is below ${smallBoreBasis} - review against the client PMS` });
      }
    }

    // Factor 3: Materials management — prefer common schedules to reduce warehouse variety
    if (preferred.includes(sch.schedule)) {
      score += 25;
      factors.push({ name: "Materials management", weight: "high", description: `${sch.schedule} is a preferred stocked schedule — easier procurement and warehouse control` });
    } else {
      const wellKnown = ["40", "80", "160"];
      if (wellKnown.includes(sch.schedule)) {
        score += 10;
        factors.push({ name: "Materials management", weight: "medium", description: `${sch.schedule} is recognized but not preferred for this size range` });
      } else {
        score -= 5;
        factors.push({ name: "Materials management", weight: "low", description: `${sch.schedule} is non-standard — may impact procurement lead time and cost` });
      }
    }

    // Factor 4: Line class standardization — match adjacent sizes for fewer line items
    if (allSizesContext && allSizesContext.length > 0) {
      const adjacentSchedules = allSizesContext
        .filter(c => Math.abs(npsToNumber(c.nps) - npsNum) <= 2)
        .map(c => c.schedule);
      if (adjacentSchedules.includes(sch.schedule)) {
        score += 20;
        factors.push({ name: "Standardization", weight: "high", description: `Matches adjacent sizes — reduces line class variety for materials management` });
      }
    } else {
      if (sch.schedule === preferred[0] || sch.schedule === preferred[1]) {
        score += 10;
        factors.push({ name: "Standardization", weight: "medium", description: `Default preference for ${sch.schedule} to maintain spec consistency` });
      }
    }

    // Factor 5: NEVER select minimum passing when utilization > 80% (safety override)
    if (sch === minimumPassing && util > 0.80 && sorted.length > 1) {
      score -= 15;
      factors.push({ name: "Safety override", weight: "high", description: `Minimum passing at ${(util*100).toFixed(0)}% — next heavier schedule required for safety` });
    }

    // Factor 6: Weight efficiency — deprioritized (safety > cost in EPC)
    const weightRatio = sch.weightPerMeter / minimumPassing.weightPerMeter;
    if (weightRatio <= 1.5) {
      score += 5;
      factors.push({ name: "Weight efficiency", weight: "low", description: `Weight within 50% of minimum — acceptable for EPC` });
    } else if (weightRatio > 2.0) {
      score -= 2;
      factors.push({ name: "Weight efficiency", weight: "low", description: `${((weightRatio-1)*100).toFixed(0)}% heavier — review for structural/support implications` });
    }

    return { schedule: sch, score, factors };
  });

  // Sort by score descending, then by wall thickness ascending for tie-breaking
  scored.sort((a, b) => b.score - a.score || a.schedule.wt_mm - b.schedule.wt_mm);

  const winner = scored[0];
  const recommended = winner.schedule;

  // Build explanation
  let reason: string;
  if (recommended.schedule === minimumPassing.schedule) {
    const util = (tMin / recommended.wt_mm * 100).toFixed(0);
    reason = `${recommended.schedule} selected as it is the minimum passing schedule with ${util}% utilization and is a preferred industry schedule for NPS ${npsNum}″.`;
  } else {
    const util = (tMin / recommended.wt_mm * 100).toFixed(0);
    const minUtil = (tMin / minimumPassing.wt_mm * 100).toFixed(0);
    reason = `${recommended.schedule} selected over minimum-passing ${minimumPassing.schedule} (${minUtil}% util.) because it provides better engineering margin (${util}% util.)`;
    // Add top contributing factor
    const topFactor = winner.factors.filter(f => f.weight === "high")[0];
    if (topFactor) {
      reason += `, ${topFactor.description.toLowerCase()}`;
    }
    reason += ".";
  }

  return {
    recommended,
    minimumPassing,
    acceptable: sorted,
    reason,
    factors: winner.factors,
  };
}


export function selectPipeSchedule(inputs: {
  nps: string;
  designPressure: number;
  outsideDiameter: number;
  allowableStress: number;
  jointFactor: number;
  yCoefficient: number;
  corrosionAllowance: number;
  millTolerance: number;
  unitSystem: string;
  /** Pipe material designation — drives B36.10M vs B36.19M selection */
  pipeMaterial?: string;
  serviceType?: string;
  /** Optional: context of adjacent size selections for standardization */
  adjacentSizes?: { nps: string; schedule: string }[];
  /** Apply project/company structural minimum wall thickness floor.
   *  Defaults to true. Practical robustness safeguard. */
  applyStructuralMinimum?: boolean;
}): ScheduleSelectionResult {
  const { designPressure, outsideDiameter, allowableStress, jointFactor, yCoefficient, corrosionAllowance, millTolerance } = inputs;
  const dimensionTable = getPipeDimensionsForMaterial(inputs.pipeMaterial);
  const isStainless = isStainlessDimensionalStandard(inputs.pipeMaterial);
  const applyStructural = inputs.applyStructuralMinimum !== false;
  const serviceSchedulePhilosophy = getServiceSchedulePhilosophy(inputs.serviceType);


  const us = (inputs.unitSystem || "SI") as UnitSystem;

  const BAR_TO_MPA = 0.1;
  const KSI_TO_MPA_FACTOR = 6.89476;
  const P_mpa = us === "SI" ? designPressure * BAR_TO_MPA : designPressure * PSI_TO_MPA;
  const D_mm = us === "SI" ? outsideDiameter : outsideDiameter * IN_TO_MM;
  const S_mpa = us === "SI" ? allowableStress : allowableStress * KSI_TO_MPA_FACTOR;
  const E = jointFactor;
  const Y = yCoefficient;
  const c_mm = us === "SI" ? corrosionAllowance : corrosionAllowance * IN_TO_MM;
  const mt = millTolerance;

  const emptyRec: ScheduleRecommendation = {
    recommended: null, minimumPassing: null, acceptable: [],
    reason: "Insufficient input data.", factors: [],
  };

  const invalidInput = (explanation: string): ScheduleSelectionResult => ({
    requiredThickness_mm: 0,
    corroded_mm: 0,
    pressureMinRequired_mm: 0,
    structuralMin_mm: 0,
    structuralMinApplied: applyStructural,
    structuralGoverns: false,
    minimumRequired_mm: 0,
    selectedSchedule: null,
    availableSchedules: [],
    utilizationRatio: 0,
    governingCase: "Invalid input data",
    explanation,
    source: "ASME B31.3 §304.1.2",
    recommendation: { ...emptyRec, reason: explanation },
  });

  if (!Number.isFinite(P_mpa) || !Number.isFinite(S_mpa) || !Number.isFinite(D_mm) || !Number.isFinite(c_mm) || !Number.isFinite(mt)) {
    return invalidInput("Provide finite numeric design inputs.");
  }

  if (P_mpa <= 0 || S_mpa <= 0 || E <= 0 || D_mm <= 0 || Y < 0) {
    return invalidInput("Provide positive design pressure, OD, allowable stress, joint factor, and Y coefficient.");
  }

  if (c_mm < 0) {
    return invalidInput("Corrosion allowance cannot be negative.");
  }

  if (mt < 0 || mt >= 100) {
    return invalidInput("Mill tolerance must be between 0% and less than 100%.");
  }

  // t = PD / 2(SE + PY) — all in SI (MPa, mm)
  const tDesign = (P_mpa * D_mm) / (2 * (S_mpa * E + P_mpa * Y));
  const tCorroded = tDesign + c_mm;
  const tMinPressure = tCorroded / (1 - mt / 100);

  const npsNorm = normalizeScheduleNps(inputs.nps);
  const npsNum = npsToNumber(npsNorm);

  // Structural minimum (project/company practical floor)
  const structMin = applyStructural ? getStructuralMinimumThickness_mm(npsNum) : 0;
  const structuralGoverns = applyStructural && structMin > tMinPressure;
  const tMin = Math.max(tMinPressure, structMin);

  const available = dimensionTable.filter(pd => {
    const pdNps = normalizeScheduleNps(pd.nps);
    return pdNps === npsNorm;
  });

  const acceptable = available.filter(pd => pd.wt_mm >= tMin);
  acceptable.sort((a, b) => a.wt_mm - b.wt_mm);

  const recommendation = recommendSchedule(acceptable, tMin, npsNorm, serviceSchedulePhilosophy, inputs.adjacentSizes);

  const selected = recommendation.recommended;
  const utilizationRatio = selected ? tMin / selected.wt_mm : 0;

  const governingCase = structuralGoverns
    ? `Structural minimum (${structMin.toFixed(1)} mm) governs over pressure-derived ${tMinPressure.toFixed(2)} mm`
    : c_mm > tDesign * 0.5
      ? "Corrosion allowance governs (>50% of design thickness)"
      : mt > 10
        ? "Mill tolerance is significant contributor"
        : "Internal pressure design thickness governs";

  return {
    requiredThickness_mm: tDesign,
    corroded_mm: tCorroded,
    pressureMinRequired_mm: tMinPressure,
    structuralMin_mm: structMin,
    structuralMinApplied: applyStructural,
    structuralGoverns,
    minimumRequired_mm: tMin,
    selectedSchedule: selected,
    availableSchedules: available,
    utilizationRatio,
    governingCase,
    explanation: selected
      ? `${recommendation.reason} ${governingCase}.`
      : `Required minimum thickness = ${tMin.toFixed(2)} mm. No standard schedule found for NPS ${inputs.nps} that meets this requirement. Consider heavier schedule or larger NPS.`,
    source: isStainless
      ? "ASME B31.3 §304.1.2 Eq.(3a), ASME B36.19M (stainless)"
      : "ASME B31.3 §304.1.2 Eq.(3a), ASME B36.10M",
    recommendation,
  };
}

/**
 * Get available NPS sizes from the dimension table
 */
export function getAvailableNPSSizes(): string[] {
  const sizes = new Set(PIPE_DIMENSIONS.map(p => p.nps));
  return Array.from(sizes);
}

/**
 * Get OD for a given NPS
 */
export function getODForNPS(nps: string, unitSystem: string): number {
  const dim = PIPE_DIMENSIONS.find(p => p.nps === nps);
  if (!dim) return 0;
  return unitSystem === "SI" ? dim.od_mm : dim.od_in;
}
