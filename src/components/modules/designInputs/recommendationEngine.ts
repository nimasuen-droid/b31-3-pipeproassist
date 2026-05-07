import { 
  PIPE_MATERIALS, FLANGE_MATERIALS, FITTING_MATERIALS, BOLT_MATERIALS, GASKET_TYPES,
  PIPE_COMPATIBILITY, findPipeIdByDesignation, getFilteredPipeMaterials,
  type MaterialSpec, type CompatibleSet
} from "./materialDatabase";
import { getAllowableStress } from "./sourceData/secIID_data";
import { selectFlangeClass } from "./sourceData/b16_5_data";
import { B36_10M_PIPE_DATA } from "./sourceData/b36_10m_data";
import { getPipeDimensionsForMaterial } from "./sourceData";
import {
  normalizeTempToC, normalizePressureToBar,
  MPA_TO_KSI, MM_TO_IN, BAR_TO_PSI,
  type UnitSystem,
} from "@/lib/unitConversion";
import {
  classifyFlangePTGroup,
  classifyMaterialFamily,
  isStainlessFamily,
} from "./engineeringClassification";
import { PIPE_PRESSURE_DESIGN_RULES, TEST_PRESSURE_RULES } from "./engineeringRules";

export type MaterialTier = "Best Match" | "Recommended" | "Alternative" | "Not Permissible";

export interface ClassifiedOption {
  designation: string;
  tier: MaterialTier;
  reason: string;
}

export interface MaterialRecommendation {
  value: string;
  reason: string;
  source: string;
  confidence: "Recommended" | "Common Practice" | "User Review Required";
  options: string[];  // dropdown options (flat list for backward compat)
  classifiedOptions: ClassifiedOption[];
}

export interface AllowanceRecommendation {
  value: string;
  reason: string;
  source: string;
}

export interface TableLookupResult {
  value: string;
  displayValue: string;
  reason: string;
  source: string;
  tableRef: string;
  interpolated?: boolean;
}

export interface Recommendations {
  pipeMaterial: MaterialRecommendation;
  flangeMaterial: MaterialRecommendation;
  fittingMaterial: MaterialRecommendation;
  boltMaterial: MaterialRecommendation;
  gasketType: MaterialRecommendation;
  flangeFacing: AllowanceRecommendation;
  corrosionAllowance: AllowanceRecommendation;
  millTolerance: AllowanceRecommendation;
  jointQualityFactor: AllowanceRecommendation;
  testPressure: AllowanceRecommendation;
  testMedium: AllowanceRecommendation;
  // Auto-populated from source tables
  allowableStress: TableLookupResult | null;
  flangeClass: TableLookupResult | null;
  pipeOD: TableLookupResult | null;
  availableSchedules: { schedule: string; thickness_mm: number }[];
}

function formatCorrosionAllowance(valueMm: number, unitSystem: UnitSystem): string {
  return unitSystem === "SI" ? valueMm.toFixed(1) : (valueMm * MM_TO_IN).toFixed(3);
}

function buildCorrosionAllowanceRecommendation(inputs: {
  serviceType: string;
  corrosionSeverity: string;
  fluidPhase: string;
  materialFamily: ReturnType<typeof classifyMaterialFamily>;
  unitSystem: UnitSystem;
}): AllowanceRecommendation {
  const severity = inputs.corrosionSeverity;
  const svc = inputs.serviceType;
  const family = inputs.materialFamily;
  const isCRA = isStainlessFamily(family) || family === "Duplex" || family === "Nickel Alloy";
  const isSevere = severity === "Severe" || severity === "High";
  const isModerate = severity === "Moderate" || severity === "Medium";
  const isSour = svc === "Corrosive / Sour Service" || svc.includes("Sour");
  const isChlorideCaustic = svc === "Chloride / Caustic";
  const isCoolingWater = svc === "Cooling Water";
  const isCleanDry = svc === "Instrument Air" || svc === "Oxygen Service";
  const isSteam = svc.includes("Steam") || inputs.fluidPhase === "Steam";

  let valueMm = 1.0;
  let philosophy = "General process service uses a project default corrosion allowance where no corrosion study is loaded.";
  let source = "Owner/project corrosion philosophy; ASME B31.3 wall thickness allowance basis";

  if (isCleanDry) {
    valueMm = 0.5;
    philosophy = `${svc} is treated as clean/dry service. Minimal allowance is applied; contamination, moisture, or cleaning residues require review.`;
  } else if (isChlorideCaustic) {
    if (isCRA) {
      valueMm = isSevere ? 1.0 : 0.5;
      philosophy = "Chloride/caustic service is primarily a material-selection and SCC problem for stainless/CRA. Corrosion allowance does not mitigate SCC; verify concentration, chloride level, pH, temperature, and stress relief requirements.";
    } else {
      valueMm = isSevere ? 3.0 : 1.5;
      philosophy = "Chloride/caustic service on carbon or low-alloy steel requires a corrosion-study allowance and may require lining, PWHT, or material upgrade.";
    }
    source = "Corrosion study / owner PMS required; NACE/industry caustic and chloride service practice";
  } else if (isSour) {
    if (isCRA) {
      valueMm = isSevere ? 1.0 : 0.5;
      philosophy = "Sour service is governed by NACE MR0175/ISO 15156 qualification, hardness, chemistry, and cracking risk. For stainless/CRA, CA is kept modest unless metal-loss corrosion is proven by corrosion study.";
    } else {
      valueMm = isSevere ? 3.0 : isModerate ? 1.5 : 1.0;
      philosophy = "Sour/corrosive carbon steel service requires allowance for credible metal loss, plus NACE MR0175/ISO 15156 qualification. CA does not replace hardness and environmental limits.";
    }
    source = "NACE MR0175/ISO 15156 plus owner corrosion study/project PMS";
  } else if (isCoolingWater) {
    valueMm = isSevere ? 3.0 : 1.5;
    philosophy = "Cooling water corrosion depends on open/closed loop chemistry, oxygen ingress, biocide, chlorides, velocity, and coating/lining. Moderate default is applied until a water chemistry basis is loaded.";
    source = "Owner cooling-water corrosion philosophy / project PMS";
  } else if (isSteam) {
    valueMm = isModerate || isSevere ? 1.5 : 1.0;
    philosophy = "Steam service normally uses modest CA; condensate return, wet steam, oxygen ingress, and FAC risk may require higher project-specific allowance.";
  } else if (isModerate) {
    valueMm = 1.5;
    philosophy = "Moderate corrosion severity increases the project default allowance pending a corrosion-study value.";
  } else if (isSevere) {
    valueMm = isCRA ? 1.0 : 3.0;
    philosophy = isCRA
      ? "Severe service with stainless/CRA should be resolved through material suitability and corrosion study; CA is not treated as a blanket 3 mm addition."
      : "Severe corrosion severity on carbon/low-alloy steel uses a heavy default allowance pending corrosion-study confirmation.";
    source = "Owner/project corrosion study required";
  }

  return {
    value: formatCorrosionAllowance(valueMm, inputs.unitSystem),
    reason: philosophy,
    source,
  };
}

/**
 * Classify material options into tiers based on compatibility, temperature, and service.
 * @param bestMatch - The system-recommended designation
 * @param compatibleDesignations - Designations from the compatibility map (first-tier compatible)
 * @param allOptions - All dropdown options (temperature-filtered)
 * @param allSpecs - Full material spec list for the category
 * @param tempC - Design temperature in °C
 * @param category - "pipe" | "flange" | "fitting" | "bolt" | "gasket"
 */
function classifyOptions(
  bestMatch: string,
  compatibleDesignations: string[],
  allOptions: string[],
  allSpecs: MaterialSpec[],
  tempC: number,
  category: string,
): ClassifiedOption[] {
  const classified: ClassifiedOption[] = [];
  const seen = new Set<string>();

  // Helper: get spec
  const getSpec = (d: string) => allSpecs.find(s => s.designation === d);

  // 1. Best Match first
  if (bestMatch) {
    classified.push({
      designation: bestMatch,
      tier: "Best Match",
      reason: `Optimal ${category} for the given service, temperature, and pressure conditions.`,
    });
    seen.add(bestMatch);
  }

  // 2. Compatible designations → Recommended
  for (const d of compatibleDesignations) {
    if (seen.has(d)) continue;
    const spec = getSpec(d);
    classified.push({
      designation: d,
      tier: "Recommended",
      reason: spec
        ? `Compatible with selected pipe material. ${spec.description}. Rated ${spec.minTempC}°C to ${spec.maxTempC}°C.`
        : `Listed as compatible in the material compatibility map.`,
    });
    seen.add(d);
  }

  // 3. Remaining options in temp range → Alternative
  for (const d of allOptions) {
    if (seen.has(d)) continue;
    const spec = getSpec(d);
    if (spec && tempC >= spec.minTempC && tempC <= spec.maxTempC) {
      classified.push({
        designation: d,
        tier: "Alternative",
        reason: `Acceptable temperature range (${spec.minTempC}°C to ${spec.maxTempC}°C) but not the primary compatible match. ${spec.description}.`,
      });
      seen.add(d);
    }
  }

  // 4. Out-of-range materials → Not Permissible
  for (const spec of allSpecs) {
    if (seen.has(spec.designation)) continue;
    const outOfRange = tempC < spec.minTempC || tempC > spec.maxTempC;
    if (outOfRange) {
      classified.push({
        designation: spec.designation,
        tier: "Not Permissible",
        reason: `Outside allowable temperature range (${spec.minTempC}°C to ${spec.maxTempC}°C). Design temp ${tempC.toFixed(0)}°C ${tempC < spec.minTempC ? "below minimum" : "above maximum"}.`,
      });
      seen.add(spec.designation);
    }
  }

  return classified;
}


export function getRecommendations(inputs: {
  fluidPhase: string;
  pipingCategory: string;
  designPressure: string;
  designTemperature: string;
  corrosionSeverity: string;
  cyclicService: string;
  categoryM: string;
  highPressure: string;
  weldType: string;
  unitSystem: string;
  pipeMaterial: string;
  serviceType: string;
  nominalPipeSize?: string;
}): Recommendations {
  const us = (inputs.unitSystem || "SI") as UnitSystem;
  const tempC = normalizeTempToC(inputs.designTemperature, us);

  const isHighTemp = tempC > 427;
  const isCryogenic = tempC < -29;
  const isCorrosive = inputs.corrosionSeverity === "Severe";
  const isModerateCorrosion = inputs.corrosionSeverity === "Moderate";
  const isSteam = inputs.fluidPhase === "Steam";
  const isGas = inputs.fluidPhase === "Gas";
  const svc = inputs.serviceType || "General Hydrocarbon";

  // Filter pipe materials by temperature
  const validPipes = getFilteredPipeMaterials(tempC);
  const allPipeOptions = validPipes.map(p => p.designation);

  // Determine recommended pipe material — service type is primary driver
  let recPipeDesignation: string;
  let pipeReason: string;
  let pipeSource: string;

  // Service-type-driven material logic (takes priority, then temperature/corrosion refine)
  if (svc === "Cryogenic Service" || isCryogenic) {
    recPipeDesignation = "A312 TP304L";
    pipeReason = "Austenitic stainless steel required for cryogenic service (below -29°C / -20°F) per B31.3 §323.2.2. Carbon steel loses ductility and impact toughness at low temperatures.";
    pipeSource = "ASME B31.3 §323.2.2, ASTM A312/A312M";
  } else if (svc === "Hydrogen Service") {
    recPipeDesignation = "A106 Gr.B";
    pipeReason = "Killed carbon steel for hydrogen service. Must comply with API 941 Nelson Curve limits. Above ~260°C consider Cr-Mo (A335 P11/P22) to resist hydrogen attack (HTHA). Hardness limits per NACE MR0175 if H₂S present.";
    pipeSource = "API 941, ASME B31.3 §323.2, ASTM A106";
  } else if (svc === "Oxygen Service") {
    recPipeDesignation = "A312 TP316L";
    pipeReason = "Stainless steel preferred for oxygen service to minimize ignition risk. System must be cleaned per CGA G-4.1 / ASTM G93. Carbon steel acceptable at low pressures (<1.5 MPa) with strict cleaning.";
    pipeSource = "CGA G-4.1, ASTM G93, ASME B31.3 §323.1";
  } else if (svc === "Corrosive / Sour Service") {
    recPipeDesignation = "A312 TP316L";
    pipeReason = "316L stainless provides superior corrosion resistance via molybdenum content. For sour (H₂S) service, materials must comply with NACE MR0175/ISO 15156 hardness and chemistry limits. 'L' grade resists intergranular corrosion.";
    pipeSource = "NACE MR0175/ISO 15156, ASME B31.3 §323.1.1, ASTM A312";
  } else if (svc === "Chloride / Caustic") {
    recPipeDesignation = "A312 TP304L";
    pipeReason = "For caustic (NaOH) service, austenitic SS or carbon steel is used depending on concentration and temperature (refer to caustic soda corrosion chart). For chloride service, 316L or duplex may be needed. Post-weld stress relief often required for caustic.";
    pipeSource = "ASME B31.3 §323.1, NACE SP0403, Industry Caustic Curves";
  } else if (svc === "High Pressure Steam" || (isSteam && tempC > 400)) {
    recPipeDesignation = "A335 P11";
    pipeReason = "Chrome-Moly alloy steel (1¼Cr-½Mo) for high-pressure/high-temperature steam. Maintains creep strength above 425°C where carbon steel allowable stress drops sharply.";
    pipeSource = "ASME B31.1/B31.3, ASME II-D Table 1A, ASTM A335";
  } else if (svc === "Low Pressure Steam") {
    recPipeDesignation = "A106 Gr.B";
    pipeReason = "Standard carbon steel suitable for low-pressure steam up to ~400°C. Widely available with well-established allowable stress values.";
    pipeSource = "ASME B31.3 Table A-1, ASTM A106";
  } else if (svc === "High Temperature (>425°C)" || isHighTemp) {
    recPipeDesignation = "A335 P11";
    pipeReason = "Chrome-Moly alloy steel (1¼Cr-½Mo) maintains allowable stress above 425°C (800°F). Carbon steel loses significant strength and enters creep range above this threshold.";
    pipeSource = "ASME B31.3 §323.2.1, ASME II-D Table 1A";
  } else if (svc === "Cooling Water") {
    recPipeDesignation = "A106 Gr.B";
    pipeReason = "Carbon steel standard for cooling water service. If brackish or seawater, consider 90/10 CuNi or GRP lining. Ensure adequate corrosion allowance and internal coating for open-loop systems.";
    pipeSource = "ASME B31.3 Table A-1, ASTM A106";
  } else if (svc === "Instrument Air") {
    recPipeDesignation = "A106 Gr.B";
    pipeReason = "Carbon steel for instrument air service. Galvanized carbon steel or stainless tubing commonly used downstream of air dryers. System must be dry and oil-free.";
    pipeSource = "ASME B31.3 Table A-1, ASTM A106, ISA-7.0.01";
  } else if (isCorrosive) {
    recPipeDesignation = "A312 TP316L";
    pipeReason = "316L stainless provides superior corrosion resistance via molybdenum. 'L' grade reduces susceptibility to intergranular corrosion in welded joints.";
    pipeSource = "ASME B31.3 §323.1.1, ASTM A312/A312M";
  } else {
    // General Hydrocarbon or fallback
    recPipeDesignation = "A106 Gr.B";
    pipeReason = "Standard carbon steel pipe for normal hydrocarbon process service (-29°C to 427°C). Most cost-effective with widest availability and well-established allowable stress data.";
    pipeSource = "ASME B31.3 Table A-1, ASTM A106/A106M";
  }

  // Use selected pipe material for cascading, or fall back to recommendation
  const activePipeDesignation = inputs.pipeMaterial || recPipeDesignation;
  const activePipeId = findPipeIdByDesignation(activePipeDesignation);
  const compat = activePipeId ? PIPE_COMPATIBILITY[activePipeId] : null;

  const pipeAllOptions = allPipeOptions.length > 0 ? allPipeOptions : PIPE_MATERIALS.map(p => p.designation);
  const pipeMat: MaterialRecommendation = {
    value: recPipeDesignation,
    reason: pipeReason,
    source: pipeSource,
    confidence: "Recommended",
    options: pipeAllOptions,
    classifiedOptions: classifyOptions(recPipeDesignation, [], pipeAllOptions, PIPE_MATERIALS, tempC, "pipe"),
  };

  // ═══════════════════════════════════════════════════════════
  // FLANGE MATERIAL + TYPE SELECTION (separated)
  // ═══════════════════════════════════════════════════════════
  // Flange material from compatibility map
  const flangeOptions = compat ? compat.flanges : FLANGE_MATERIALS.filter(f => tempC >= f.minTempC && tempC <= f.maxTempC).map(f => f.designation);
  // For carbon steel service, A105 (forged) is ALWAYS the primary flange material regardless of size
  const recFlange = flangeOptions[0] || "A105";
  const flangeSpec = FLANGE_MATERIALS.find(f => f.designation === recFlange);
  const castDesignation = flangeSpec?.castEquivalent;

  // Size-based flange TYPE selection (not material)
  const npsValue = parseFloat(String(inputs.nominalPipeSize || "0"));
  let flangeTypeNote: string;
  if (npsValue > 0 && npsValue <= 2) {
    flangeTypeNote = "NPS ≤ 2″: Slip-On (SO) or Socket Weld (SW) flanges acceptable.";
  } else if (npsValue > 2) {
    flangeTypeNote = `NPS ${npsValue}″ (> 2″): Weld Neck (WN) flanges preferred for structural integrity and radiographic examination.`;
  } else {
    flangeTypeNote = "Select NPS to determine flange type (WN for > 2″, SO/SW for ≤ 2″).";
  }

  // Build classified options — A105 always Best Match for flanges; cast is Alternative (restricted)
  const flangeClassified: ClassifiedOption[] = [];
  const seenFlange = new Set<string>();

  // Best Match: forged material (A105 for CS, or the compat-recommended forged)
  flangeClassified.push({
    designation: recFlange,
    tier: "Best Match",
    reason: `${recFlange} selected as forged ${flangeSpec?.materialGroup || "carbon steel"} flange material for strength, weldability, and compliance with ASME B16.5/B31.3. ${flangeTypeNote}`,
  });
  seenFlange.add(recFlange);

  // Alternative (Cast) — if a cast equivalent exists, add it as restricted
  if (castDesignation && !seenFlange.has(castDesignation)) {
    flangeClassified.push({
      designation: castDesignation,
      tier: "Alternative",
      reason: `Acceptable for cast components (valve bodies, pump casings) but not preferred for piping flanges due to lower toughness and weld reliability compared to forged ${recFlange}. Restricted use per engineering review.`,
    });
    seenFlange.add(castDesignation);
  }

  // Remaining compatible options → Recommended or Alternative
  for (const d of flangeOptions) {
    if (seenFlange.has(d)) continue;
    const spec = FLANGE_MATERIALS.find(f => f.designation === d);
    if (spec && tempC >= spec.minTempC && tempC <= spec.maxTempC) {
      flangeClassified.push({
        designation: d,
        tier: "Recommended",
        reason: spec ? `Compatible with ${activePipeDesignation} pipe. ${spec.description}. Rated ${spec.minTempC}°C to ${spec.maxTempC}°C.` : "Listed as compatible.",
      });
    }
    seenFlange.add(d);
  }

  // Out-of-range → Not Permissible
  for (const spec of FLANGE_MATERIALS) {
    if (seenFlange.has(spec.designation)) continue;
    if (tempC < spec.minTempC || tempC > spec.maxTempC) {
      flangeClassified.push({
        designation: spec.designation,
        tier: "Not Permissible",
        reason: `Outside allowable temperature range (${spec.minTempC}°C to ${spec.maxTempC}°C). Design temp ${tempC.toFixed(0)}°C ${tempC < spec.minTempC ? "below minimum" : "above maximum"}.`,
      });
    }
  }

  // Add cast designation to options list if not already present
  const allFlangeOptions = [...flangeOptions];
  if (castDesignation && !allFlangeOptions.includes(castDesignation)) {
    allFlangeOptions.push(castDesignation);
  }

  const flangeMat: MaterialRecommendation = {
    value: recFlange,
    reason: `${recFlange} selected as forged ${flangeSpec?.materialGroup || "carbon steel"} flange material for strength, weldability, and compliance with ASME B16.5/B31.3. ${flangeTypeNote}${castDesignation ? ` Cast equivalent (${castDesignation}) acceptable for cast components only — not recommended as primary flange material.` : ""}`,
    source: flangeSpec?.source || "ASME B16.5 Table 1A, ASTM A105/A105M",
    confidence: compat ? "Recommended" : "User Review Required",
    options: allFlangeOptions,
    classifiedOptions: flangeClassified,
  };

  // Fitting options
  const fittingOptions = compat ? compat.fittings : FITTING_MATERIALS.filter(f => tempC >= f.minTempC && tempC <= f.maxTempC).map(f => f.designation);
  const recFitting = fittingOptions[0] || "A234 WPB";
  const fittingSpec = FITTING_MATERIALS.find(f => f.designation === recFitting);

  // Bolt options
  const boltOptions = compat ? compat.bolts : BOLT_MATERIALS.filter(b => tempC >= b.minTempC && tempC <= b.maxTempC).map(b => b.designation);
  const recBolt = boltOptions[0] || "A193 B7 / A194 2H";
  const boltSpec = BOLT_MATERIALS.find(b => b.designation === recBolt);

  // Gasket options (initial — may be overridden after flange class determination)
  let gasketOptions = compat ? compat.gaskets : GASKET_TYPES.filter(g => tempC >= g.minTempC && tempC <= g.maxTempC).map(g => g.designation);
  let recGasket = gasketOptions[0] || "Spiral Wound, CS/Flex.Graphite";
  let gasketReason = "";
  let gasketSource = "";

  const fittingMat: MaterialRecommendation = {
    value: recFitting,
    reason: compat
      ? `Compatible butt-weld fitting for ${activePipeDesignation} pipe. ${fittingSpec?.description || ""}`
      : `Standard fitting for the selected temperature range. ${fittingSpec?.description || ""}`,
    source: fittingSpec?.source || "ASME B16.9, ASTM A234",
    confidence: compat ? "Recommended" : "User Review Required",
    options: fittingOptions,
    classifiedOptions: classifyOptions(recFitting, compat ? compat.fittings : [], fittingOptions, FITTING_MATERIALS, tempC, "fitting"),
  };

  const boltMat: MaterialRecommendation = {
    value: recBolt,
    reason: compat
      ? `Compatible stud bolt/nut set for ${activePipeDesignation} flange joints. ${boltSpec?.description || ""}`
      : `Standard bolting for the selected temperature range. ${boltSpec?.description || ""}`,
    source: boltSpec?.source || "ASME B16.5 Table 6, ASTM A193/A194",
    confidence: compat ? "Recommended" : "User Review Required",
    options: boltOptions,
    classifiedOptions: classifyOptions(recBolt, compat ? compat.bolts : [], boltOptions, BOLT_MATERIALS, tempC, "bolt"),
  };

  // Gasket finalization is deferred until after flange class determination (see below)

  // Allowances (unchanged logic)
  // Corrosion allowance — refined by service type
  const caUnit = inputs.unitSystem === "SI" ? "mm" : "in";
  let ca: AllowanceRecommendation;
  if (svc === "Corrosive / Sour Service" || svc === "Chloride / Caustic" || isCorrosive) {
    ca = { value: inputs.unitSystem === "SI" ? "3.0" : "0.125", reason: `${svc} — severe corrosion/erosion requires 3.0 ${caUnit === "mm" ? "mm" : '1/8"'} minimum. Confirm from corrosion study or materials engineer.`, source: "Company Standard / Corrosion Study" };
  } else if (svc === "Cooling Water" || isModerateCorrosion) {
    ca = { value: inputs.unitSystem === "SI" ? "1.5" : "0.0625", reason: `${svc} — moderate corrosion expected, 1.5 ${caUnit === "mm" ? "mm" : '1/16"'} per industry practice. Increase for open-loop or untreated water.`, source: "Company Standard / Industry Practice" };
  } else if (svc === "Instrument Air" || svc === "Oxygen Service") {
    ca = { value: inputs.unitSystem === "SI" ? "0.5" : "0.02", reason: `${svc} — clean/dry service, minimal corrosion expected. Minimal allowance applied.`, source: "Company Standard / Industry Practice" };
  } else {
    ca = { value: inputs.unitSystem === "SI" ? "1.0" : "0.04", reason: `Standard corrosion allowance for ${svc} service.`, source: "Company Standard / Industry Practice" };
  }
  ca = buildCorrosionAllowanceRecommendation({
    serviceType: svc,
    corrosionSeverity: inputs.corrosionSeverity,
    fluidPhase: inputs.fluidPhase,
    materialFamily: classifyMaterialFamily(activePipeDesignation),
    unitSystem: us,
  });

  const mt: AllowanceRecommendation = {
    value: String(PIPE_PRESSURE_DESIGN_RULES.standardPipeMillTolerancePercent.value),
    reason: `${PIPE_PRESSURE_DESIGN_RULES.standardPipeMillTolerancePercent.value}% negative wall thickness tolerance basis. ${PIPE_PRESSURE_DESIGN_RULES.standardPipeMillTolerancePercent.note}`,
    source: PIPE_PRESSURE_DESIGN_RULES.standardPipeMillTolerancePercent.reference,
  };

  let ej: AllowanceRecommendation;
  if (inputs.weldType === "Seamless") {
    ej = { value: "1.0", reason: "Seamless pipe: Ej = 1.0, no longitudinal weld.", source: "ASME B31.3 Table A-1B" };
  } else if (inputs.weldType === "ERW") {
    ej = { value: "0.85", reason: "ERW pipe: Ej = 0.85 unless 100% radiographed (Ej = 1.0).", source: "ASME B31.3 Table A-1B" };
  } else {
    ej = { value: "1.0", reason: "Full radiography allows Ej = 1.0 per B31.3 §302.3.4.", source: "ASME B31.3 Table A-1B, §302.3.4" };
  }

  // ═══════════════════════════════════════════════════════════
  // AUTO-POPULATED FROM SOURCE TABLES
  // ═══════════════════════════════════════════════════════════

  // 1. Allowable Stress (S) from Sec II-D Table 1A
  // Output in user's unit system: SI → MPa, Imperial → ksi
  let allowableStress: TableLookupResult | null = null;
  const lookupMaterial = activePipeDesignation || recPipeDesignation;
  if (lookupMaterial) {
    const stressResult = getAllowableStress(lookupMaterial, tempC);
    if (stressResult) {
      const stressInUserUnits = us === "SI" ? stressResult.stress_MPa : stressResult.stress_ksi;
      const stressLabel = us === "SI" ? "MPa" : "ksi";
      allowableStress = {
        value: String(stressInUserUnits),
        displayValue: `${stressResult.stress_MPa} MPa (${stressResult.stress_ksi} ksi)`,
        reason: stressResult.explanation,
        source: stressResult.source,
        tableRef: "ASME Sec II-D Table 1A",
        interpolated: stressResult.explanation.includes("interpolated"),
      };
    }
  }

  // 2. Flange Class from B16.5 P-T ratings
  let flangeClass: TableLookupResult | null = null;
  const dp = parseFloat(inputs.designPressure) || 0;
  const pressureBar = normalizePressureToBar(inputs.designPressure, us);
  if (dp > 0) {
    // Map pipe material group to flange material group using classification engine
    const flangeMatGroup = classifyFlangePTGroup(lookupMaterial);
    const flangeResult = selectFlangeClass(pressureBar, tempC, flangeMatGroup);
    if (flangeResult) {
      flangeClass = {
        value: String(flangeResult.class),
        displayValue: `Class ${flangeResult.class}`,
        reason: flangeResult.explanation,
        source: flangeResult.source,
        tableRef: `ASME B16.5 Table 2-${flangeMatGroup}`,
      };
    } else {
      flangeClass = {
        value: "EXCEEDS",
        displayValue: "Exceeds B16.5 range",
        reason: `Design pressure ${pressureBar.toFixed(1)} bar at ${tempC.toFixed(0)}°C exceeds all B16.5 class ratings. Consider B16.47 or special design.`,
        source: "ASME B16.5",
        tableRef: "ASME B16.5 Table 2",
      };
    }
  }

  // ═══════════════════════════════════════════════════════════
  // RTJ DEFAULT FOR ≥900# AND FLANGE FACING DETERMINATION
  // ═══════════════════════════════════════════════════════════
  const flangeClassNum = flangeClass ? parseInt(flangeClass.value) || 0 : 0;
  const isRtjDefault = flangeClassNum >= 900;

  let flangeFacing: AllowanceRecommendation;
  if (isRtjDefault) {
    flangeFacing = {
      value: "RTJ",
      reason: `Class ${flangeClassNum} (≥900#) — Ring Type Joint (RTJ) facing is the industry standard for high-pressure service. RTJ provides metal-to-metal sealing with controlled deformation of the ring gasket in the groove, ensuring superior leak-tightness at high pressures and temperatures. RF facing is not recommended above Class 600 for critical service.`,
      source: "ASME B16.5 §6.4, API 6A, Industry Practice",
    };
    // Override gasket to RTJ type — match ring material to flange P-T group
    const pipePTGroup = classifyFlangePTGroup(activePipeDesignation);
    if (pipePTGroup === "2.2" || pipePTGroup === "2.3") {
      recGasket = "RTJ SS316 (R-type)";
    } else if (pipePTGroup === "2.1" || pipePTGroup === "2.4") {
      recGasket = "RTJ SS304 (R-type)";
    } else {
      recGasket = "RTJ Soft Iron (R-type)";
    }
    gasketReason = `RTJ gasket required for Class ${flangeClassNum} (≥900#) service. Ring material must be softer than the flange groove per ASME B16.20.`;
    gasketSource = "ASME B16.20, ASME B16.5 §6.4";
    // Add RTJ options to gasket dropdown
    const rtjOptions = GASKET_TYPES.filter(g => g.designation.startsWith("RTJ")).map(g => g.designation);
    gasketOptions = [...rtjOptions, ...gasketOptions.filter(g => !g.startsWith("RTJ"))];
  } else {
    flangeFacing = {
      value: "RF",
      reason: `Raised Face (RF) is the standard flange facing for Class ${flangeClassNum || "150-600"}. RF with spiral wound gasket provides reliable sealing for normal process pressures and temperatures.`,
      source: "ASME B16.5 §6.2, Industry Practice",
    };
  }

  // Finalize gasket recommendation
  const gasketSpec = GASKET_TYPES.find(g => g.designation === recGasket);
  const gasketMat: MaterialRecommendation = {
    value: recGasket,
    reason: gasketReason || (compat
      ? `Compatible gasket for ${activePipeDesignation} flanged joints. ${gasketSpec?.description || ""}`
      : `Standard gasket for the selected temperature range. ${gasketSpec?.description || ""}`),
    source: gasketSource || gasketSpec?.source || "ASME B16.20",
    confidence: isRtjDefault ? "Recommended" : (compat ? "Recommended" : "User Review Required"),
    options: gasketOptions,
    classifiedOptions: classifyOptions(recGasket, compat ? compat.gaskets : [], gasketOptions, GASKET_TYPES, tempC, "gasket"),
  };

  // 3. Pipe OD and available schedules from B36.10M
  let pipeOD: TableLookupResult | null = null;
  let availableSchedules: { schedule: string; thickness_mm: number }[] = [];
  const nps = inputs.nominalPipeSize?.replace(/['"]/g, "").trim() || "";
  if (nps) {
    const npsSearch = nps.includes("/") ? nps : nps;
    const dimTable = getPipeDimensionsForMaterial(activePipeDesignation);
    const matchingPipes = dimTable.filter(p => {
      const pNps = p.nps.replace(/['"]/g, "").trim();
      return pNps === npsSearch || pNps === `${npsSearch}` || p.nps === `${nps}"`;
    });
    if (matchingPipes.length > 0) {
      const od_mm = matchingPipes[0].od_mm;
      const od_in = matchingPipes[0].od_in;
      // Output OD in user's unit system
      const odValue = us === "SI" ? od_mm : od_in;
      const dimStd = matchingPipes[0].standard === "B36.19M" ? "ASME B36.19M" : "ASME B36.10M";
      pipeOD = {
        value: String(odValue),
        displayValue: `${od_mm} mm (${od_in} in)`,
        reason: `NPS ${nps} outer diameter per ${dimStd}`,
        source: `${dimStd} Table 1`,
        tableRef: dimStd,
      };
      availableSchedules = matchingPipes.map(p => ({
        schedule: p.schedule,
        thickness_mm: p.wt_mm,
      }));
    }
  }

  let tp: AllowanceRecommendation;
  if (dp > 0) {
    const hydroFactor = TEST_PRESSURE_RULES.hydrostaticFactor.value;
    const testP = (dp * hydroFactor).toFixed(1);
    tp = { value: testP, reason: `Hydrostatic test = ${hydroFactor} × ${dp} = ${testP}. ${TEST_PRESSURE_RULES.hydrostaticFactor.note}`, source: TEST_PRESSURE_RULES.hydrostaticFactor.reference };
  } else {
    tp = { value: "", reason: "Enter design pressure to auto-calculate.", source: TEST_PRESSURE_RULES.hydrostaticFactor.reference };
  }

  let tm: AllowanceRecommendation;
  if (inputs.categoryM === "Yes") {
    tm = { value: "Water", reason: "Category M requires hydrostatic testing per B31.3 §345.4.", source: "ASME B31.3 §345.4, §323.5" };
  } else {
    tm = { value: "Water", reason: "Water is the standard test medium per B31.3 §345.4.", source: "ASME B31.3 §345.4.1" };
  }

  return {
    pipeMaterial: pipeMat,
    flangeMaterial: flangeMat,
    fittingMaterial: fittingMat,
    boltMaterial: boltMat,
    gasketType: gasketMat,
    flangeFacing,
    corrosionAllowance: ca,
    millTolerance: mt,
    jointQualityFactor: ej,
    testPressure: tp,
    testMedium: tm,
    allowableStress,
    flangeClass,
    pipeOD,
    availableSchedules,
  };
}
