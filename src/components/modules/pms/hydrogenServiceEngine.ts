/**
 * Hydrogen Service Validation Engine
 * 
 * Evaluates material suitability for hydrogen service based on:
 *  - API RP 941 (Nelson Curve) — HTHA risk zones
 *  - Design pressure and temperature
 *  - Material family
 * 
 * All logic is advisory — flags risks and recommends alternatives
 * without hard-rejecting any selection.
 * 
 * Sources:
 *  - API RP 941 (8th Ed.) — Steels for Hydrogen Service at Elevated Temperatures
 *  - ASME B31.3 §323.1 — Material selection
 *  - API TR 941 — Nelson Curves (simplified envelope)
 */

import type { MaterialFamily } from "@/components/modules/designInputs/engineeringClassification";

// ════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════

export type H2Status = "Acceptable" | "Review Required" | "Not Recommended";

export interface H2ValidationResult {
  status: H2Status;
  explanation: string;
  recommendations: string[];
  ndeUpgrade: boolean;
  ndeNote: string;
  nelsonCurveRef: string;
  materialEscalation: string | null;
}

// ════════════════════════════════════════════════════════════════
// SIMPLIFIED NELSON CURVE ENVELOPES (API RP 941)
//
// Each entry defines a max temperature (°C) at a given H₂ partial
// pressure (MPa abs) below which the material is considered safe
// from HTHA. Values are conservative engineering approximations
// derived from published Nelson Curve data.
//
// Format: { pMPa, maxTempC }
// If operating above the curve → "Review Required"
// ════════════════════════════════════════════════════════════════

interface NelsonPoint {
  pMPa: number;   // H₂ partial pressure (MPa absolute)
  maxTempC: number; // Max safe operating temperature
}

/** Carbon steel (A106 Gr.B / A234 WPB) — lowest curve */
const NELSON_CS: NelsonPoint[] = [
  { pMPa: 0.7,  maxTempC: 260 },
  { pMPa: 1.4,  maxTempC: 250 },
  { pMPa: 3.5,  maxTempC: 235 },
  { pMPa: 7.0,  maxTempC: 220 },
  { pMPa: 10.0, maxTempC: 210 },
  { pMPa: 14.0, maxTempC: 200 },
  { pMPa: 21.0, maxTempC: 190 },
];

/** 1.25Cr-0.5Mo (A335 P11 / A234 WP11) */
const NELSON_1_25CR: NelsonPoint[] = [
  { pMPa: 0.7,  maxTempC: 400 },
  { pMPa: 3.5,  maxTempC: 370 },
  { pMPa: 7.0,  maxTempC: 345 },
  { pMPa: 14.0, maxTempC: 315 },
  { pMPa: 21.0, maxTempC: 300 },
];

/** 2.25Cr-1Mo (A335 P22 / A234 WP22) */
const NELSON_2_25CR: NelsonPoint[] = [
  { pMPa: 0.7,  maxTempC: 480 },
  { pMPa: 3.5,  maxTempC: 445 },
  { pMPa: 7.0,  maxTempC: 420 },
  { pMPa: 14.0, maxTempC: 395 },
  { pMPa: 21.0, maxTempC: 375 },
];

/** Austenitic stainless (304/316/321) — essentially immune to HTHA */
const NELSON_SS: NelsonPoint[] = [
  { pMPa: 21.0, maxTempC: 590 },
];

function getCurveForFamily(family: MaterialFamily): { curve: NelsonPoint[]; label: string } {
  switch (family) {
    case "Carbon Steel":
      return { curve: NELSON_CS, label: "Carbon Steel (API RP 941 Fig. 1)" };
    case "Low Alloy":
      return { curve: NELSON_1_25CR, label: "1.25Cr-0.5Mo (API RP 941 Fig. 1)" };
    case "Stainless":
    case "Duplex":
      return { curve: NELSON_SS, label: "Austenitic SS — generally resistant to HTHA" };
    case "Nickel Alloy":
      return { curve: NELSON_SS, label: "Nickel alloy — generally resistant to HTHA" };
  }
}

/**
 * Interpolate the Nelson Curve to find the max allowable temperature
 * at a given H₂ partial pressure.
 */
function interpolateNelson(curve: NelsonPoint[], pMPa: number): number {
  if (pMPa <= curve[0].pMPa) return curve[0].maxTempC;
  if (pMPa >= curve[curve.length - 1].pMPa) return curve[curve.length - 1].maxTempC;
  for (let i = 0; i < curve.length - 1; i++) {
    if (pMPa >= curve[i].pMPa && pMPa <= curve[i + 1].pMPa) {
      const frac = (pMPa - curve[i].pMPa) / (curve[i + 1].pMPa - curve[i].pMPa);
      return curve[i].maxTempC + frac * (curve[i + 1].maxTempC - curve[i].maxTempC);
    }
  }
  return curve[curve.length - 1].maxTempC;
}

// ════════════════════════════════════════════════════════════════
// MAIN VALIDATION FUNCTION
// ════════════════════════════════════════════════════════════════

/**
 * Validate material suitability for hydrogen service.
 * 
 * @param family       Material family of the selected pipe
 * @param designTempC  Design temperature in °C
 * @param designPBar   Design pressure in bar (used as approximate H₂ partial pressure)
 * @param designPMPa   Design pressure in MPa (if available; otherwise derived from bar)
 */
export function validateHydrogenService(
  family: MaterialFamily,
  designTempC: number,
  designPBar: number,
): H2ValidationResult {
  const pMPa = designPBar * 0.1; // bar → MPa
  const { curve, label } = getCurveForFamily(family);
  const maxSafeTempC = interpolateNelson(curve, pMPa);

  const isHighTemp = designTempC > 250;
  const isHighPressure = pMPa > 3.5;
  const exceedsCurve = designTempC > maxSafeTempC;

  // ── Determine status ──
  let status: H2Status;
  let explanation: string;
  const recommendations: string[] = [];
  let materialEscalation: string | null = null;

  if (family === "Stainless" || family === "Duplex" || family === "Nickel Alloy") {
    // SS/Duplex/Nickel are generally resistant to HTHA
    status = "Acceptable";
    explanation = `${label}. Material is generally resistant to High Temperature Hydrogen Attack (HTHA) at these conditions (${designTempC}°C, ${pMPa.toFixed(1)} MPa). Verify hydrogen embrittlement considerations if temperature is below 150°C.`;
    if (designTempC < 150) {
      recommendations.push("Verify low-temperature hydrogen embrittlement (HE) resistance for the selected grade. Consider solution-annealed condition and low-ferrite content.");
    }
  } else if (exceedsCurve) {
    status = "Review Required";
    explanation = `Design conditions (${designTempC}°C, ${pMPa.toFixed(1)} MPa H₂) exceed the ${label} Nelson Curve safe operating limit of ${maxSafeTempC.toFixed(0)}°C at this pressure. Material review required — risk of HTHA.`;
    
    // Recommend escalation
    if (family === "Carbon Steel") {
      recommendations.push("Consider upgrading to 1.25Cr-0.5Mo (ASTM A335 P11 / A234 WP11) — extends Nelson Curve limit by ~100–150°C.");
      recommendations.push("Consider upgrading to 2.25Cr-1Mo (ASTM A335 P22 / A234 WP22) for higher temperature service.");
      recommendations.push("Austenitic stainless steel (304H/321H) eliminates HTHA risk but changes material class and cost.");
      materialEscalation = "Upgrade from carbon steel to Cr-Mo low alloy steel recommended. 1.25Cr-0.5Mo (P11) or 2.25Cr-1Mo (P22) depending on severity.";
    } else if (family === "Low Alloy") {
      recommendations.push("Consider upgrading to 2.25Cr-1Mo (ASTM A335 P22) if current alloy limit is exceeded.");
      recommendations.push("Consider 2.25Cr-1Mo-V (P91/P92) for extreme conditions — requires specialist welding.");
      recommendations.push("Austenitic stainless steel eliminates HTHA risk entirely.");
      materialEscalation = "Current low alloy steel may be at its Nelson Curve limit. Consider higher Cr-Mo grade or austenitic SS.";
    }
  } else {
    // Within curve limits
    const margin = maxSafeTempC - designTempC;
    status = "Acceptable";
    explanation = `Design conditions (${designTempC}°C, ${pMPa.toFixed(1)} MPa H₂) are within the ${label} Nelson Curve limits (max ${maxSafeTempC.toFixed(0)}°C at this pressure, margin: ${margin.toFixed(0)}°C). Material is acceptable for hydrogen service per API RP 941.`;
    
    if (margin < 30) {
      status = "Review Required";
      explanation += ` However, the margin is small (< 30°C). Engineering review is recommended to confirm long-term suitability.`;
      recommendations.push("Small margin to Nelson Curve limit — consider whether long-term creep or weld HAZ effects reduce actual margin.");
    }
  }

  // ── NDE upgrade logic ──
  const ndeUpgrade = isHighPressure || isHighTemp || exceedsCurve;
  let ndeNote = "";
  if (ndeUpgrade) {
    const reasons: string[] = [];
    if (isHighPressure) reasons.push(`high pressure (${pMPa.toFixed(1)} MPa)`);
    if (isHighTemp) reasons.push(`elevated temperature (${designTempC}°C)`);
    if (exceedsCurve) reasons.push("Nelson Curve exceedance");
    ndeNote = `Enhanced NDE required due to hydrogen service with ${reasons.join(" and ")}. 100% RT/UT for all butt welds. Hardness survey required: max 200 HBW (22 HRC) for CS/low alloy per API RP 941 and owner requirements.`;
  } else {
    ndeNote = "Standard NDE per ASME B31.3 Table 341.3.2. Hardness testing recommended for hydrogen service welds.";
  }

  // ── Material escalation for CS at elevated temp ──
  if (family === "Carbon Steel" && isHighTemp && !exceedsCurve && !materialEscalation) {
    materialEscalation = `Carbon steel is within Nelson Curve limits but operating above 250°C in hydrogen. Consider Cr-Mo upgrade for improved long-term HTHA resistance.`;
    recommendations.push("Carbon steel above 250°C in hydrogen — evaluate whether 1.25Cr-0.5Mo provides better long-term reliability.");
  }

  return {
    status,
    explanation,
    recommendations,
    ndeUpgrade,
    ndeNote,
    nelsonCurveRef: label,
    materialEscalation,
  };
}

/**
 * Check if a service type string indicates hydrogen service.
 */
export function isHydrogenService(serviceType: string, serviceDescription?: string): boolean {
  const svc = serviceType.toLowerCase();
  if (svc.includes("hydrogen")) return true;
  if (serviceDescription) {
    const desc = serviceDescription.toLowerCase();
    if (/\b(hydrogen|h2|hydroprocessing|hydrotreater|hydrocracker|reformer)\b/.test(desc)) return true;
  }
  return false;
}
