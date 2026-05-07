/**
 * Engineering Classification Module
 * 
 * Centralizes all material group, service, and component classification logic.
 * Replaces ad-hoc string comparisons (e.g., pipe.includes("A312")) with
 * structured lookups against the material database.
 * 
 * Every classification decision is traceable to a MaterialSpec record or
 * an explicit engineering rule — not a substring match.
 */

import {
  PIPE_MATERIALS,
  FLANGE_MATERIALS,
  FITTING_MATERIALS,
  BOLT_MATERIALS,
  GASKET_TYPES,
  type MaterialSpec,
} from "./materialDatabase";

// ════════════════════════════════════════════════════════════════
// ENUMS & TYPES
// ════════════════════════════════════════════════════════════════

/** Canonical material family groups used across the system */
export type MaterialFamily =
  | "Carbon Steel"
  | "Low Alloy"
  | "Stainless"
  | "Duplex"
  | "Nickel Alloy";

/** PMS-level material group label (display-friendly) */
export type PMSMaterialGroup =
  | "Carbon Steel"
  | "Low Alloy Steel"
  | "Stainless Steel"
  | "Duplex Stainless"
  | "Nickel Alloy";

/** Short material group code for spec naming */
export type MaterialGroupCode = "CS" | "SS" | "AS" | "NI" | "DU";

/** B16.5 flange material group per Table 2 */
export type FlangePTGroup = "1.1" | "1.9" | "2.1" | "2.2" | "2.3" | "2.4";

/** Service severity classification */
export type ServiceSeverity = "normal" | "sour" | "corrosive" | "cryogenic" | "high_temp" | "oxygen" | "hydrogen";

// ════════════════════════════════════════════════════════════════
// MATERIAL FAMILY → PMS GROUP MAPPING
// ════════════════════════════════════════════════════════════════

const FAMILY_TO_PMS: Record<MaterialFamily, PMSMaterialGroup> = {
  "Carbon Steel": "Carbon Steel",
  "Low Alloy": "Low Alloy Steel",
  "Stainless": "Stainless Steel",
  "Duplex": "Duplex Stainless",
  "Nickel Alloy": "Nickel Alloy",
};

const FAMILY_TO_CODE: Record<MaterialFamily, MaterialGroupCode> = {
  "Carbon Steel": "CS",
  "Low Alloy": "AS",
  "Stainless": "SS",
  "Duplex": "DU",
  "Nickel Alloy": "NI",
};

// ════════════════════════════════════════════════════════════════
// SPECIFICATION → B16.5 GROUP MAPPING (by spec ID, not substring)
// ════════════════════════════════════════════════════════════════

/**
 * Maps pipe material IDs to their corresponding B16.5 flange P-T rating group.
 * This replaces `pipe.includes("316L")` style checks.
 */
const PIPE_TO_FLANGE_PT_GROUP: Record<string, FlangePTGroup> = {
  // Carbon Steel → Group 1.1
  "A106-B": "1.1",
  "A106-C": "1.1",
  "A333-6": "1.1",
  // Low Alloy → Group 1.9 (approximation for Cr-Mo)
  "A335-P5": "1.9",
  "A335-P9": "1.9",
  "A335-P11": "1.9",
  "A335-P22": "1.9",
  "A335-P91": "1.9",
  // Stainless → Groups 2.x
  "A312-304": "2.1",
  "A312-304L": "2.1",
  "A312-316": "2.2",
  "A312-316L": "2.3",
  "A312-321": "2.2",
  "A312-347": "2.2",
  // Duplex → 2.4 (approximate; B16.5 coverage is limited)
  "A790-S31803": "2.4",
  "A790-S32750": "2.4",
  // Nickel Alloy → use 2.2 as conservative proxy
  "B167-600": "2.2",
  "B444-625": "2.2",
};

const FLANGE_TO_PT_GROUP: Record<string, FlangePTGroup> = {
  "A105": "1.1",
  "A350-LF2": "1.1",
  "A182-F5": "1.9",
  "A182-F9": "1.9",
  "A182-F11": "1.9",
  "A182-F22": "1.9",
  "A182-F91": "1.9",
  "A182-F304": "2.1",
  "A182-F304L": "2.1",
  "A182-F316": "2.2",
  "A182-F316L": "2.3",
  "A182-F321": "2.2",
  "A182-F51": "2.4",
  "A182-F53": "2.4",
  "B564-N06600": "2.2",
  "B564-N06625": "2.2",
};

// ════════════════════════════════════════════════════════════════
// BOLT NACE COMPLIANCE (by spec ID)
// ════════════════════════════════════════════════════════════════

/** Bolt spec IDs that comply with NACE MR0175 hardness requirements */
const NACE_COMPLIANT_BOLT_IDS = new Set([
  "A193-B7M",
  "A320-L7M",
  "A193-B8",
  "A193-B8M",
  "A320-B8",
]);

// ════════════════════════════════════════════════════════════════
// WELDED PIPE EQUIVALENT STANDARDS (by family, not substring)
// ════════════════════════════════════════════════════════════════

const WELDED_PIPE_EQUIVALENT: Record<string, { spec: string; gradeTransform: (g: string) => string }> = {
  "A106-B": { spec: "ASTM A53", gradeTransform: (g) => g.replace("A106", "A53 Type E") },
  "A106-C": { spec: "ASTM A53", gradeTransform: (g) => g.replace("A106", "A53 Type E") },
  "A312-304": { spec: "ASTM A358", gradeTransform: (g) => g.replace("A312", "A358") },
  "A312-304L": { spec: "ASTM A358", gradeTransform: (g) => g.replace("A312", "A358") },
  "A312-316": { spec: "ASTM A358", gradeTransform: (g) => g.replace("A312", "A358") },
  "A312-316L": { spec: "ASTM A358", gradeTransform: (g) => g.replace("A312", "A358") },
  "A312-321": { spec: "ASTM A358", gradeTransform: (g) => g.replace("A312", "A358") },
  "A312-347": { spec: "ASTM A358", gradeTransform: (g) => g.replace("A312", "A358") },
};

// ════════════════════════════════════════════════════════════════
// VALVE MATERIAL MAPPINGS (by family, not substring)
// ════════════════════════════════════════════════════════════════

const VALVE_BODY_BY_FAMILY: Record<MaterialFamily, string> = {
  "Carbon Steel": "A216 WCB",
  "Low Alloy": "A217 WC6",
  "Stainless": "A351 CF8M",
  "Duplex": "A995 4A",
  "Nickel Alloy": "A494 CY40",
};

const VALVE_TRIM_BY_FAMILY: Record<MaterialFamily, string> = {
  "Carbon Steel": "Trim 1 (Carbon Steel)",
  "Low Alloy": "Trim 5 (13% Cr)",
  "Stainless": "Trim 8 (316 SS)",
  "Duplex": "Trim 8 (316 SS)",
  "Nickel Alloy": "Trim 12 (Alloy)",
};

// ════════════════════════════════════════════════════════════════
// PUBLIC API — LOOKUP FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Resolve a material designation to its canonical MaterialSpec record.
 * Searches all component databases.
 */
export function resolveSpec(designation: string): MaterialSpec | undefined {
  return (
    PIPE_MATERIALS.find(m => m.designation === designation) ||
    FLANGE_MATERIALS.find(m => m.designation === designation) ||
    FITTING_MATERIALS.find(m => m.designation === designation) ||
    BOLT_MATERIALS.find(m => m.designation === designation) ||
    GASKET_TYPES.find(m => m.designation === designation)
  );
}

/**
 * Resolve a material designation to its MaterialSpec by searching a specific list.
 */
export function resolveSpecIn(designation: string, specs: MaterialSpec[]): MaterialSpec | undefined {
  return specs.find(m => m.designation === designation);
}

/**
 * Get the canonical material family from a designation (any component type).
 */
export function classifyMaterialFamily(designation: string): MaterialFamily {
  const spec = resolveSpec(designation);
  if (spec) return spec.materialGroup as MaterialFamily;
  // Fallback: if designation is not in DB, return Carbon Steel
  return "Carbon Steel";
}

/**
 * Get the PMS display group name from a pipe designation.
 */
export function classifyPMSGroup(designation: string): PMSMaterialGroup {
  const family = classifyMaterialFamily(designation);
  return FAMILY_TO_PMS[family];
}

/**
 * Get the short material group code (CS/SS/AS/DU/NI).
 */
export function classifyGroupCode(designation: string): MaterialGroupCode {
  const family = classifyMaterialFamily(designation);
  return FAMILY_TO_CODE[family];
}

/**
 * Map a pipe or flange material to its ASME B16.5 P-T rating group.
 * Uses the spec ID for exact lookup — no substring matching.
 */
export function classifyFlangePTGroup(designation: string): FlangePTGroup {
  // Try pipe lookup first
  const pipeSpec = PIPE_MATERIALS.find(m => m.designation === designation);
  if (pipeSpec && PIPE_TO_FLANGE_PT_GROUP[pipeSpec.id]) {
    return PIPE_TO_FLANGE_PT_GROUP[pipeSpec.id];
  }
  // Try flange lookup
  const flangeSpec = FLANGE_MATERIALS.find(m => m.designation === designation);
  if (flangeSpec && FLANGE_TO_PT_GROUP[flangeSpec.id]) {
    return FLANGE_TO_PT_GROUP[flangeSpec.id];
  }
  // Fallback based on material family
  const family = classifyMaterialFamily(designation);
  switch (family) {
    case "Stainless": return "2.2";
    case "Duplex": return "2.4";
    case "Low Alloy": return "1.9";
    default: return "1.1";
  }
}

/**
 * Classify service conditions from structured inputs.
 * Returns a set of service severity flags — no regex on free text for primary logic.
 */
export function classifyServiceSeverity(inputs: {
  serviceType?: string;
  corrosionSeverity?: string;
  designTempC?: number;
  serviceDescription?: string;
}): Set<ServiceSeverity> {
  const flags = new Set<ServiceSeverity>();
  const svc = inputs.serviceType || "";
  const tempC = inputs.designTempC ?? 0;

  // Primary classification from structured service type field
  if (svc === "Corrosive/Sour Service" || svc.includes("Sour")) flags.add("sour");
  if (svc === "Corrosive/Sour Service" || inputs.corrosionSeverity === "Severe") flags.add("corrosive");
  if (svc === "Cryogenic Service" || tempC < -29) flags.add("cryogenic");
  if (svc === "High Temperature Service" || tempC > 427) flags.add("high_temp");
  if (svc === "Oxygen Service") flags.add("oxygen");
  if (svc === "Hydrogen Service") flags.add("hydrogen");

  // Secondary: scan description only for sour/H2S (backward compat)
  if (inputs.serviceDescription) {
    const desc = inputs.serviceDescription.toLowerCase();
    if (/\b(sour|h2s)\b/.test(desc)) flags.add("sour");
  }

  if (flags.size === 0) flags.add("normal");
  return flags;
}

/**
 * Check if a bolt designation is NACE MR0175 compliant (by spec ID lookup).
 */
export function isBoltNACECompliant(boltDesignation: string): boolean {
  const spec = BOLT_MATERIALS.find(m => m.designation === boltDesignation);
  return spec ? NACE_COMPLIANT_BOLT_IDS.has(spec.id) : false;
}

/**
 * Get the valve body material for a given pipe material family.
 */
export function getValveBodyForFamily(family: MaterialFamily): string {
  return VALVE_BODY_BY_FAMILY[family];
}

/**
 * Get valve trim designation for a given family, service severity, and temperature.
 */
export function getValveTrimForConditions(
  family: MaterialFamily,
  severity: Set<ServiceSeverity>,
  tempC: number,
): string {
  if (severity.has("sour")) return "Trim 5 (13% Cr)";
  if (tempC > 400) return "Trim 5 (13% Cr)";
  return VALVE_TRIM_BY_FAMILY[family];
}

/**
 * Get valve seat material for conditions.
 */
export function getValveSeatForConditions(
  severity: Set<ServiceSeverity>,
  tempC: number,
): string {
  if (tempC > 250) return "Metal (Stellite 6)";
  if (severity.has("oxygen")) return "PTFE (oxygen-clean)";
  return "PTFE / RPTFE";
}

/**
 * Get the welded pipe equivalent spec and grade for large-bore pipe.
 */
export function getWeldedPipeEquivalent(pipeDesignation: string): { spec: string; grade: string } | null {
  const pipeSpec = PIPE_MATERIALS.find(m => m.designation === pipeDesignation);
  if (!pipeSpec) return null;
  const equiv = WELDED_PIPE_EQUIVALENT[pipeSpec.id];
  if (!equiv) return { spec: pipeSpec.standard, grade: pipeDesignation };
  return { spec: equiv.spec, grade: equiv.gradeTransform(pipeDesignation) };
}

/**
 * Check if a material family is "stainless-like" (includes Duplex).
 */
export function isStainlessFamily(family: MaterialFamily): boolean {
  return family === "Stainless" || family === "Duplex";
}

/**
 * Return the forged fitting spec prefix for small bore fittings by family.
 */
export function getForgedFittingSpec(family: MaterialFamily): string {
  return family === "Carbon Steel" ? "ASTM A105" : "ASTM A182";
}

/**
 * PWHT wall thickness threshold by material family.
 */
export function getPWHTThreshold(family: MaterialFamily): number {
  return family === "Carbon Steel" ? 19 : 16;
}
