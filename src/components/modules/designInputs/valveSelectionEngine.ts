/**
 * Valve Selection Engine — Design Guide Edition
 *
 * Recommends valve materials, trim, seat, packing, bore type, fire-safe
 * requirement, and size range based on service conditions.
 * Every recommendation includes a "Why" explanation and code reference.
 *
 * References: ASME B16.34, B31.3, API 600/602/608/6D/607, NACE MR0175, CGA G-4.1
 */

import {
  classifyMaterialFamily,
  classifyServiceSeverity,
  getValveBodyForFamily,
  getValveTrimForConditions,
  getValveSeatForConditions,
  type MaterialFamily,
  type ServiceSeverity,
} from "./engineeringClassification";
import type { CalculationTrace, SourceOrigin } from "@/stores/sourceRegistry";

// ════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════

export type ValveType = "Gate" | "Globe" | "Ball" | "Check" | "Wafer" | "Needle";
export type ValveApplication = "Isolation" | "Throttling" | "Non-Return" | "Control" | "Vent/Drain";
export type BoreType = "Full Bore" | "Reduced Bore";
export type SeatType = "Soft Seat" | "Metal Seat";
export type ActuationType = "Manual" | "Gear Operated" | "Pneumatic" | "Electric" | "Hydraulic";
export type ValveFunction = "On/Off" | "Throttle" | "Non-Return" | "Control" | "Vent/Drain";

export interface ValveRefinement {
  valveFunction: ValveFunction;
  boreType: BoreType;
  fireSafe: boolean;
  seatType: SeatType;
  actuationType: ActuationType;
  criticalService: boolean;
  corrosiveService: boolean;
  highTemperature: boolean;
}

export const defaultRefinement: ValveRefinement = {
  valveFunction: "On/Off",
  boreType: "Full Bore",
  fireSafe: false,
  seatType: "Soft Seat",
  actuationType: "Manual",
  criticalService: false,
  corrosiveService: false,
  highTemperature: false,
};

// ── Recommendation item with why + reference ──

export interface ServiceRecommendation {
  label: string;
  value: string;
  why: string;
  reference: string;
  referenceSection: string;
  warnings: string[];
}

export interface ValveTypeRecommendation {
  type: ValveType;
  application: ValveApplication;
  tier: "Recommended" | "Alternative" | "Not Suitable";
  reason: string;
  sizeGuidance: string;
  npsRange: string;
  standards: string[];
}

export interface ValveMaterialResult {
  bodyMaterial: string;
  bodySpec: string;
  trimMaterial: string;
  seatMaterial: string;
  stemPacking: string;
}

export interface ValveRecommendation {
  typeRecommendations: ValveTypeRecommendation[];
  material: ValveMaterialResult;
  refinement: ValveRefinement;
  /** Auto-recommended refinement based on service */
  autoRefinement: ValveRefinement;
  family: MaterialFamily;
  /** Service-driven recommendation cards */
  serviceRecs: {
    body: ServiceRecommendation;
    trim: ServiceRecommendation;
    seat: ServiceRecommendation;
    packing: ServiceRecommendation;
    bore: ServiceRecommendation;
    fireSafe: ServiceRecommendation;
    sizeRange: ServiceRecommendation;
    criticalService: ServiceRecommendation;
    corrosive: ServiceRecommendation;
    highTemp: ServiceRecommendation;
  };
  traces: Record<string, CalculationTrace>;
}

// ════════════════════════════════════════════════════════════════
// VALVE TYPE DATABASE
// ════════════════════════════════════════════════════════════════

interface ValveProfile {
  type: ValveType;
  primaryApps: ValveApplication[];
  strengthApps: string[];
  weaknesses: string[];
  smallBore: boolean;
  largeBore: boolean;
  npsRange: string;
  throttleCapable: boolean;
  standards: string[];
}

const VALVE_PROFILES: ValveProfile[] = [
  {
    type: "Gate", primaryApps: ["Isolation"],
    strengthApps: ["Full bore flow path", "Low pressure drop", "Bi-directional shutoff"],
    weaknesses: ["Not suitable for throttling — causes wire-drawing erosion", "Slow operation in large sizes"],
    smallBore: true, largeBore: true, npsRange: 'NPS ½"–48"', throttleCapable: false,
    standards: ["API 600 (Flanged)", "API 602 (Forged Small-Bore)", "API 6D"],
  },
  {
    type: "Globe", primaryApps: ["Throttling", "Control"],
    strengthApps: ["Excellent throttling characteristics", "Precise flow control", "Good shutoff"],
    weaknesses: ["Higher pressure drop than gate valves", "Unidirectional flow", "Heavier and more expensive"],
    smallBore: true, largeBore: true, npsRange: 'NPS ½"–24"', throttleCapable: true,
    standards: ["API 623", "BS 1873", "ASME B16.34"],
  },
  {
    type: "Ball", primaryApps: ["Isolation"],
    strengthApps: ["Quarter-turn operation", "Bubble-tight shutoff", "Low torque", "Fast operation"],
    weaknesses: ["Limited throttling capability (trunnion excepted)", "Cavity pressure buildup risk"],
    smallBore: true, largeBore: true, npsRange: 'NPS ½"–36"', throttleCapable: false,
    standards: ["API 608 (Floating)", "API 6D (Trunnion)", "ASME B16.34"],
  },
  {
    type: "Check", primaryApps: ["Non-Return"],
    strengthApps: ["Prevents reverse flow", "Automatic operation", "No external actuation"],
    weaknesses: ["Cannot be used for isolation", "Pressure drop varies by design", "Slam risk on sudden closure"],
    smallBore: true, largeBore: true, npsRange: 'NPS ½"–48"', throttleCapable: false,
    standards: ["API 594 (Wafer/Dual-Plate)", "API 6D", "BS 1868 (Swing)"],
  },
  {
    type: "Wafer", primaryApps: ["Non-Return", "Isolation"],
    strengthApps: ["Compact (fits between flanges)", "Light weight", "Low cost", "Short face-to-face"],
    weaknesses: ["Lower pressure rating", "Cannot be used as line blind", "Alignment-sensitive installation"],
    smallBore: false, largeBore: true, npsRange: 'NPS 2"–48"', throttleCapable: false,
    standards: ["API 594", "MSS SP-67 (Butterfly)"],
  },
  {
    type: "Needle", primaryApps: ["Throttling", "Vent/Drain"],
    strengthApps: ["Fine flow control", "Ideal for instrumentation", "Good shutoff at small sizes"],
    weaknesses: ["Small bore only", "Not suitable for slurries or viscous fluids"],
    smallBore: true, largeBore: false, npsRange: 'NPS ¼"–2"', throttleCapable: true,
    standards: ["ASME B16.34", "MSS SP-83"],
  },
];

// ════════════════════════════════════════════════════════════════
// BODY MATERIAL MAPPING
// ════════════════════════════════════════════════════════════════

const BODY_SPEC: Record<MaterialFamily, { castSpec: string; forgedSpec: string }> = {
  "Carbon Steel": { castSpec: "ASTM A216 Gr. WCB", forgedSpec: "ASTM A105" },
  "Low Alloy": { castSpec: "ASTM A217 Gr. WC6", forgedSpec: "ASTM A182 Gr. F11" },
  "Stainless": { castSpec: "ASTM A351 Gr. CF8M", forgedSpec: "ASTM A182 Gr. F316" },
  "Duplex": { castSpec: "ASTM A995 Gr. 4A", forgedSpec: "ASTM A182 Gr. F51" },
  "Nickel Alloy": { castSpec: "ASTM A494 Gr. CY40", forgedSpec: "ASTM B564 UNS N06625" },
};

const STEM_PACKING: Record<string, string> = {
  normal: "Graphite / PTFE",
  sour: "Low-chloride graphite (NACE MR0175)",
  oxygen: "Monel packing (cleaned for O₂ service)",
  high_temp: "Flexible graphite (Grafoil®)",
  cryogenic: "Extended bonnet with PTFE packing",
  default: "Graphite / PTFE",
};

// ════════════════════════════════════════════════════════════════
// SERVICE → AUTO RECOMMENDATIONS
// ════════════════════════════════════════════════════════════════

function buildAutoRefinement(
  severity: Set<ServiceSeverity>,
  tempC: number,
  nps: number,
  serviceType: string,
): ValveRefinement {
  const highTemp = severity.has("high_temp") || tempC > 250;
  const corrosive = severity.has("sour") || severity.has("corrosive");
  const isHydrocarbon = serviceType.includes("Hydrocarbon") || serviceType.includes("Sour");
  const fireSafe = isHydrocarbon || corrosive;
  const criticalService = corrosive || severity.has("hydrogen") || severity.has("oxygen");

   return {
    valveFunction: "On/Off" as ValveFunction,
    boreType: nps >= 2 ? "Full Bore" : "Full Bore",
    fireSafe,
    seatType: highTemp || (fireSafe && tempC > 180) ? "Metal Seat" : "Soft Seat",
    actuationType: nps >= 10 ? "Gear Operated" : "Manual",
    criticalService,
    corrosiveService: corrosive,
    highTemperature: highTemp,
  };
}

function buildServiceRecs(
  family: MaterialFamily,
  severity: Set<ServiceSeverity>,
  tempC: number,
  nps: number,
  serviceType: string,
  mat: ValveMaterialResult,
  autoRef: ValveRefinement,
): ValveRecommendation["serviceRecs"] {
  const isSmallBore = nps <= 1.5;
  const bodySpecs = BODY_SPEC[family];

  return {
    body: {
      label: "Body Material",
      value: isSmallBore ? bodySpecs.forgedSpec : bodySpecs.castSpec,
      why: isSmallBore
        ? `Forged body (${bodySpecs.forgedSpec}) recommended for small bore (NPS ≤ 1½") per API 602. Forging provides superior grain structure and strength for compact valve configurations.`
        : `Cast body (${bodySpecs.castSpec}) recommended for large bore (NPS ≥ 2") per API 600. Casting is the standard manufacturing method for large gate, globe, and check valves.`,
      reference: isSmallBore ? "API 602" : "API 600",
      referenceSection: isSmallBore ? "Section 4 — Materials" : "Section 5 — Materials",
      warnings: severity.has("sour") ? ["Verify hardness ≤ 22 HRC per NACE MR0175/ISO 15156"] : [],
    },

    trim: {
      label: "Trim Material",
      value: mat.trimMaterial,
      why: severity.has("sour")
        ? "Trim 5 (13% Cr) selected for sour/corrosive service. Provides superior erosion and corrosion resistance. Required for H₂S environments per NACE MR0175."
        : tempC > 400
        ? "Trim 5 (13% Cr) selected for elevated temperature service (>400°C). Maintains hardness and wear resistance at high temperatures."
        : `Standard trim for ${family} material family. Provides adequate corrosion resistance and wear life for the design temperature of ${tempC}°C.`,
      reference: "API 600",
      referenceSection: "Table 3 — Trim number designation",
      warnings: tempC > 400 ? ["High temperature — verify trim stress rupture properties"] : [],
    },

    seat: {
      label: "Seat Material",
      value: autoRef.seatType === "Metal Seat" ? "Metal (Stellite 6)" : mat.seatMaterial,
      why: autoRef.seatType === "Metal Seat"
        ? tempC > 250
          ? `Metal seat (Stellite 6) recommended: design temperature ${tempC}°C exceeds soft seat limit (~200–250°C). PTFE deforms and loses sealing integrity above this range.`
          : "Metal seat (Stellite 6) recommended for fire-safe and/or corrosive service. Provides reliable shutoff during fire exposure per API 607 and resists chemical attack."
        : severity.has("oxygen")
          ? "PTFE seat (oxygen-cleaned) selected per CGA G-4.1 for oxygen service. Must be degreased with documented O2 compatibility."
          : "PTFE / RPTFE soft seat recommended for standard service. Provides bubble-tight shutoff at moderate temperatures with low operating torque.",
      reference: autoRef.seatType === "Metal Seat" ? "API 607 / ASME B16.34" : "ASME B16.34 / API 608",
      referenceSection: "Seat material selection per service conditions",
      warnings: tempC > 200 && autoRef.seatType === "Soft Seat" ? ["Soft seat may not be suitable above 200°C — consider metal seat"] : [],
    },

    packing: {
      label: "Stem Packing",
      value: mat.stemPacking,
      why: severity.has("sour")
        ? "Low-chloride graphite packing required for sour service per NACE MR0175. Standard packing may cause chloride stress corrosion cracking of stainless components."
        : severity.has("oxygen")
          ? "Monel packing selected for oxygen service per CGA G-4.1. Must be degreased with documented compatibility in enriched O2 atmosphere."
          : severity.has("high_temp")
            ? "Flexible graphite (Grafoil®) packing selected for high temperature service. Maintains sealing integrity and prevents fugitive emissions above 250°C."
            : severity.has("cryogenic")
              ? "Extended bonnet with PTFE packing for cryogenic service. Extended bonnet prevents packing from reaching cryogenic temperatures."
              : "Standard graphite/PTFE packing suitable for normal service. Meets fugitive emission requirements per API 622 / ISO 15848-1.",
      reference: "API 622 / ISO 15848-1",
      referenceSection: "Fugitive emissions and packing material selection",
      warnings: severity.has("sour") ? ["Verify packing is low-chloride for sour service per NACE"] : [],
    },

    bore: {
      label: "Bore Type",
      value: autoRef.boreType,
      why: autoRef.boreType === "Full Bore"
        ? "Full bore recommended for process piping. Provides unrestricted flow, allows pigging, and avoids erosion at bore transitions. Required for most hydrocarbon and corrosive services."
        : "Reduced bore acceptable for non-critical utility services where pressure drop is tolerable. Reduces valve size and cost.",
      reference: "API 6D / ASME B16.34",
      referenceSection: "Section 6.1 — Bore dimensions",
      warnings: severity.has("corrosive") && autoRef.boreType === "Reduced Bore"
        ? ["Reduced bore may cause erosion in corrosive service — full bore preferred"]
        : [],
    },

    fireSafe: {
      label: "Fire-Safe Design",
      value: autoRef.fireSafe ? "Required (API 607)" : "Not Required",
      why: autoRef.fireSafe
        ? "Fire-safe design required per API 607. Hydrocarbon and flammable services require valves that maintain integrity during fire exposure. Soft seats must be backed by metal-to-metal secondary seal."
        : "Fire-safe qualification is not normally required for this non-flammable service. Standard valve construction is acceptable.",
      reference: autoRef.fireSafe ? "API 607 / API 6FA" : "Good Engineering Practice",
      referenceSection: autoRef.fireSafe ? "Fire test of quarter-turn valves" : "N/A",
      warnings: [],
    },

    sizeRange: {
      label: "Recommended Size Range",
      value: isSmallBore ? `Small Bore — NPS ${nps}" (≤ 1½")` : `Large Bore — NPS ${nps}" (≥ 2")`,
      why: isSmallBore
        ? `NPS ${nps}" falls within small bore range (≤ 1½"). Use forged body valves per API 602 with socket-weld or threaded ends. Needle valves preferred for vent/drain and instrument connections.`
        : `NPS ${nps}" falls within large bore range (≥ 2"). Use cast body valves per API 600 with flanged or butt-weld ends. Gate valves for isolation, globe for throttling.`,
      reference: isSmallBore ? "API 602" : "API 600 / API 6D",
      referenceSection: isSmallBore ? "Compact steel gate valves — Forged" : "Steel gate valves — Flanged, butt-welded",
      warnings: [],
    },

    criticalService: {
      label: "Critical Service",
      value: autoRef.criticalService ? "Yes — Enhanced requirements" : "No",
      why: autoRef.criticalService
        ? severity.has("sour")
          ? "Sour service classified as critical per NACE MR0175/ISO 15156. All wetted parts must meet hardness, chemistry, and heat treatment requirements with documented NACE MR0175 suitability."
          : severity.has("hydrogen")
            ? "Hydrogen service classified as critical per API 941. Valve body and trim must resist hydrogen embrittlement and decarburization at elevated temperatures."
            : severity.has("oxygen")
              ? "Oxygen service classified as critical per CGA G-4.1. All valve internals must be cleaned for oxygen service. Non-sparking materials required."
              : "Service classified as critical based on fluid hazard and operating conditions. Enhanced quality requirements including NDE, witness testing, and documentation apply."
        : "Standard (non-critical) service. Normal manufacturing quality and testing per API 598 is acceptable.",
      reference: autoRef.criticalService
        ? severity.has("sour") ? "NACE MR0175 / ISO 15156" : "ASME B31.3 Chapter IX"
        : "API 598",
      referenceSection: autoRef.criticalService ? "Critical service requirements" : "Valve inspection and testing",
      warnings: autoRef.criticalService ? ["Enhanced NDE and witness testing recommended"] : [],
    },

    corrosive: {
      label: "Corrosive Service",
      value: autoRef.corrosiveService ? "Yes — Corrosion-resistant upgrades" : "No",
      why: autoRef.corrosiveService
        ? severity.has("sour")
          ? "H₂S/sour environment detected. All wetted materials must comply with NACE MR0175. Consider upgraded trim (13% Cr or Stellite), metal seats, and low-chloride packing."
          : "Corrosive fluid service detected. Upgraded trim and seat materials recommended. Consider corrosion-resistant alloy (CRA) upgrade if corrosion rates exceed 0.125 mm/yr."
        : "Non-corrosive service. Standard trim and seat materials are acceptable for the expected corrosion environment.",
      reference: autoRef.corrosiveService ? "NACE MR0175 / ASME B31.3 §304.1.2" : "ASME B31.3",
      referenceSection: autoRef.corrosiveService ? "Material requirements for sour/corrosive service" : "General material requirements",
      warnings: [],
    },

    highTemp: {
      label: "High Temperature Service",
      value: autoRef.highTemperature ? `Yes — ${tempC}°C exceeds threshold` : "No",
      why: autoRef.highTemperature
        ? `Design temperature ${tempC}°C exceeds the 250°C threshold for standard valve components. Metal seats required (PTFE unsuitable). Graphite packing replaces PTFE. Verify body material allowable stress at temperature per ASME B16.34 Table 2.`
        : `Design temperature ${tempC}°C is within standard range. Normal seat and packing materials are suitable.`,
      reference: autoRef.highTemperature ? "ASME B16.34 / ASME Sec II-D" : "ASME B16.34",
      referenceSection: autoRef.highTemperature ? "Table 2 — P-T ratings and material limits" : "Standard service conditions",
      warnings: tempC > 400 ? ["Verify creep/stress rupture properties for body and trim above 400°C"] : [],
    },
  };
}

// ════════════════════════════════════════════════════════════════
// MAIN RECOMMENDATION ENGINE
// ════════════════════════════════════════════════════════════════

export function getValveRecommendations(inputs: {
  pipeMaterial: string;
  serviceType: string;
  corrosionSeverity: string;
  designTemperature: string;
  designPressure: string;
  nominalPipeSize: string;
  serviceDescription?: string;
  refinement: ValveRefinement;
}): ValveRecommendation {
  const family = classifyMaterialFamily(inputs.pipeMaterial);
  const tempC = parseFloat(inputs.designTemperature) || 20;
  const nps = parseFloat(inputs.nominalPipeSize?.replace(/['"]/g, "")) || 2;
  const isSmallBore = nps <= 1.5;

  const severity = classifyServiceSeverity({
    serviceType: inputs.serviceType,
    corrosionSeverity: inputs.corrosionSeverity,
    designTempC: tempC,
    serviceDescription: inputs.serviceDescription,
  });

  // Manual refinement overrides
  if (inputs.refinement.corrosiveService) severity.add("corrosive");
  if (inputs.refinement.highTemperature) severity.add("high_temp");
  if (inputs.refinement.criticalService) severity.delete("normal");

  // Auto-recommend based on service
  const autoRef = buildAutoRefinement(severity, tempC, nps, inputs.serviceType);

  // Merge: user refinement overrides auto where user has explicitly set
  const effectiveRef = { ...autoRef, ...inputs.refinement };

  const primaryApp = inferApplication(inputs.serviceType, effectiveRef);

  // Build type recommendations
  const typeRecommendations = VALVE_PROFILES.map(profile => {
    const sizeOK = isSmallBore ? profile.smallBore : profile.largeBore;
    const appMatch = profile.primaryApps.includes(primaryApp);

    let tier: "Recommended" | "Alternative" | "Not Suitable";
    let reason: string;

    if (appMatch && sizeOK) {
      tier = "Recommended";
      reason = `${profile.type} valve is the preferred selection for ${primaryApp.toLowerCase()} service. ${profile.strengthApps[0]}.`;
    } else if (appMatch && !sizeOK) {
      tier = "Alternative";
      reason = `${profile.type} valve suits ${primaryApp.toLowerCase()} but is ${isSmallBore ? "not optimal for small bore" : "not available in large bore sizes"}.`;
    } else if (sizeOK && !appMatch) {
      tier = "Alternative";
      reason = `${profile.type} can be used at NPS ${nps}" but is primarily for ${profile.primaryApps.join("/")}. ${profile.weaknesses[0]}.`;
    } else {
      tier = "Not Suitable";
      reason = `${profile.type} is not recommended: ${profile.weaknesses[0]}.`;
    }

    return {
      type: profile.type,
      application: profile.primaryApps[0],
      tier,
      reason,
      sizeGuidance: isSmallBore
        ? `Small bore (NPS ${nps}"): ${profile.smallBore ? "Suitable" : "Not typically used"}`
        : `Large bore (NPS ${nps}"): ${profile.largeBore ? "Suitable" : "Not typically used"}`,
      npsRange: profile.npsRange,
      standards: profile.standards,
    };
  }).sort((a, b) => {
    const order = { "Recommended": 0, "Alternative": 1, "Not Suitable": 2 };
    return order[a.tier] - order[b.tier];
  });

  // Material selection
  const bodySpecs = BODY_SPEC[family];
  const bodyMaterial = getValveBodyForFamily(family);
  const bodySpec = isSmallBore ? bodySpecs.forgedSpec : bodySpecs.castSpec;
  const trimMaterial = getValveTrimForConditions(family, severity, tempC);
  const seatMaterial = effectiveRef.seatType === "Metal Seat"
    ? "Metal (Stellite 6)"
    : getValveSeatForConditions(severity, tempC);

  const packingKey = severity.has("sour") ? "sour"
    : severity.has("oxygen") ? "oxygen"
    : severity.has("high_temp") ? "high_temp"
    : severity.has("cryogenic") ? "cryogenic"
    : "default";
  const stemPacking = STEM_PACKING[packingKey];

  const material: ValveMaterialResult = { bodyMaterial, bodySpec, trimMaterial, seatMaterial, stemPacking };

  // Build service recommendation cards
  const serviceRecs = buildServiceRecs(family, severity, tempC, nps, inputs.serviceType, material, autoRef);

  // Build traces
  const traces = buildTraces(typeRecommendations, material, family, severity, inputs);

  return {
    typeRecommendations,
    material,
    refinement: effectiveRef,
    autoRefinement: autoRef,
    family,
    serviceRecs,
    traces,
  };
}

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function inferApplication(_serviceType: string, refinement: ValveRefinement): ValveApplication {
  const fnMap: Record<ValveFunction, ValveApplication> = {
    "On/Off": "Isolation",
    "Throttle": "Throttling",
    "Non-Return": "Non-Return",
    "Control": "Control",
    "Vent/Drain": "Vent/Drain",
  };
  return fnMap[refinement.valveFunction] || "Isolation";
}

function buildTraces(
  types: ValveTypeRecommendation[],
  mat: ValveMaterialResult,
  family: MaterialFamily,
  severity: Set<ServiceSeverity>,
  inputs: { serviceType: string; designTemperature: string; pipeMaterial: string },
): Record<string, CalculationTrace> {
  const traces: Record<string, CalculationTrace> = {};
  const recommended = types.find(t => t.tier === "Recommended");

  if (recommended) {
    traces.valveType = {
      fieldName: "Valve Type",
      appliedValue: recommended.type,
      sourceOrigin: "default-rule" as SourceOrigin,
      standard: recommended.standards[0] || "ASME B16.34",
      sectionRef: "Valve type selection per application",
      whySelected: recommended.reason,
      assumptions: ["Valve type selected based on primary application", "Size suitability verified"],
      warnings: severity.has("sour") ? ["Sour service — verify NACE MR0175 compliance"] : [],
      confidenceLevel: "default-rule",
      overrideStatus: "recommended",
    };
  }

  traces.bodyMaterial = {
    fieldName: "Valve Body Material",
    appliedValue: `${mat.bodyMaterial} (${mat.bodySpec})`,
    sourceOrigin: "default-rule" as SourceOrigin,
    standard: "ASME B16.34",
    sectionRef: "Table 1 — Material groups and specifications",
    whySelected: `Body material ${mat.bodySpec} selected for ${family} pipe system to maintain material continuity.`,
    assumptions: [`Material family: ${family}`, `Matched to pipe: ${inputs.pipeMaterial}`],
    warnings: [],
    confidenceLevel: "mapped",
    overrideStatus: "recommended",
  };

  traces.trimMaterial = {
    fieldName: "Valve Trim",
    appliedValue: mat.trimMaterial,
    sourceOrigin: "default-rule" as SourceOrigin,
    standard: "API 600 / API 602",
    sectionRef: "Table 3 — Trim number designation",
    whySelected: severity.has("sour")
      ? "Trim 5 (13% Cr) selected for sour/corrosive service per NACE MR0175."
      : `Trim selected for ${family} at ${inputs.designTemperature}°C.`,
    assumptions: ["Trim follows API 600 numbering", "Compatible with body and fluid"],
    warnings: parseFloat(inputs.designTemperature) > 400 ? ["High temp — verify trim properties"] : [],
    confidenceLevel: "default-rule",
    overrideStatus: "recommended",
  };

  traces.seatMaterial = {
    fieldName: "Valve Seat",
    appliedValue: mat.seatMaterial,
    sourceOrigin: "default-rule" as SourceOrigin,
    standard: "ASME B16.34 / API 608",
    sectionRef: "Seat material selection per service conditions",
    whySelected: mat.seatMaterial.includes("Metal")
      ? "Metal seat selected for high temperature or fire-safe requirement."
      : "Soft seat selected for standard service — bubble-tight shutoff.",
    assumptions: ["Seat compatible with process fluid", "Temperature within seat limits"],
    warnings: parseFloat(inputs.designTemperature) > 200 && !mat.seatMaterial.includes("Metal")
      ? ["Soft seat may not be suitable above 200°C"] : [],
    confidenceLevel: "default-rule",
    overrideStatus: "recommended",
  };

  traces.stemPacking = {
    fieldName: "Stem Packing",
    appliedValue: mat.stemPacking,
    sourceOrigin: "default-rule" as SourceOrigin,
    standard: "API 622 / ISO 15848-1",
    sectionRef: "Fugitive emissions and packing selection",
    whySelected: `Packing selected for: ${[...severity].join(", ")}.`,
    assumptions: ["Compatible with process fluid and temperature"],
    warnings: severity.has("sour") ? ["Verify low-chloride per NACE"] : [],
    confidenceLevel: "default-rule",
    overrideStatus: "recommended",
  };

  return traces;
}
