/**
 * B31.3 Compliance Screening Check Engine
 * Runs automated checks against ASME B31.3 requirements
 * 
 * Sources: ASME B31.3-2022, ASME Section II-D
 */

import { PIPE_MATERIALS, findPipeIdByDesignation, PIPE_COMPATIBILITY } from "./materialDatabase";
import { isBoltNACECompliant } from "./engineeringClassification";

export type CheckStatus = "pass" | "fail" | "review" | "missing" | "warning";

export interface ComplianceCheck {
  id: string;
  item: string;
  reference: string;
  status: CheckStatus;
  detail: string;
  inputs: string;       // what inputs controlled this
  source: string;
}

export interface ComplianceResult {
  checks: ComplianceCheck[];
  summary: {
    pass: number;
    fail: number;
    review: number;
    warning: number;
    missing: number;
  };
}

export function runComplianceChecks(inputs: {
  designPressure: string;
  designTemperature: string;
  operatingPressure: string;
  operatingTemperature: string;
  testPressure: string;
  pipeMaterial: string;
  flangeMaterial: string;
  fittingMaterial: string;
  boltMaterial: string;
  gasketType: string;
  corrosionAllowance: string;
  millTolerance: string;
  jointQualityFactor: string;
  weldType: string;
  categoryM: string;
  highPressure: string;
  severeCyclic: string;
  cyclicService: string;
  corrosionSeverity: string;
  fluidPhase: string;
  serviceDescription: string;
  unitSystem: string;
}): ComplianceResult {
  const checks: ComplianceCheck[] = [];

  const dp = parseFloat(inputs.designPressure) || 0;
  const dt = parseFloat(inputs.designTemperature) || 0;
  const tp = parseFloat(inputs.testPressure) || 0;
  const ca = parseFloat(inputs.corrosionAllowance) || 0;
  const ej = parseFloat(inputs.jointQualityFactor) || 0;
  const mt = parseFloat(inputs.millTolerance) || 0;
  const tempC = inputs.unitSystem === "SI" ? dt : (dt - 32) * 5 / 9;
  const dpPsi = inputs.unitSystem === "SI" ? dp * 14.5038 : dp;

  // 1. Pressure design basis
  checks.push({
    id: "PD-01",
    item: "Design pressure specified",
    reference: "B31.3 §301.2",
    status: dp > 0 ? "pass" : "missing",
    detail: dp > 0
      ? `Design pressure = ${dp} ${inputs.unitSystem === "SI" ? "barg" : "psig"}.`
      : "Design pressure not entered. Required for all pressure-containing calculations.",
    inputs: "designPressure",
    source: "ASME B31.3 §301.2",
  });

  // 2. Design temperature
  checks.push({
    id: "DT-01",
    item: "Design temperature specified and within material limits",
    reference: "B31.3 §301.3",
    status: dt !== 0 ? "pass" : "missing",
    detail: dt !== 0
      ? `Design temperature = ${dt} ${inputs.unitSystem === "SI" ? "°C" : "°F"} (${tempC.toFixed(0)}°C).`
      : "Design temperature not entered.",
    inputs: "designTemperature",
    source: "ASME B31.3 §301.3",
  });

  // 3. Material temperature suitability
  const pipeSpec = PIPE_MATERIALS.find(p => p.designation === inputs.pipeMaterial);
  if (pipeSpec) {
    const inRange = tempC >= pipeSpec.minTempC && tempC <= pipeSpec.maxTempC;
    checks.push({
      id: "MAT-01",
      item: "Pipe material suitable for design temperature",
      reference: "B31.3 §323.2",
      status: inRange ? "pass" : "fail",
      detail: inRange
        ? `${pipeSpec.designation} is rated ${pipeSpec.minTempC}°C to ${pipeSpec.maxTempC}°C. Design temp ${tempC.toFixed(0)}°C is within range.`
        : `${pipeSpec.designation} is rated ${pipeSpec.minTempC}°C to ${pipeSpec.maxTempC}°C. Design temp ${tempC.toFixed(0)}°C is OUTSIDE range. Select appropriate material.`,
      inputs: "pipeMaterial, designTemperature",
      source: pipeSpec.source,
    });
  } else if (inputs.pipeMaterial) {
    checks.push({
      id: "MAT-01",
      item: "Pipe material suitable for design temperature",
      reference: "B31.3 §323.2",
      status: "review",
      detail: `Material ${inputs.pipeMaterial} selected but not found in database. Manual verification required.`,
      inputs: "pipeMaterial, designTemperature",
      source: "ASME B31.3 §323.2, ASME II-D",
    });
  } else {
    checks.push({
      id: "MAT-01",
      item: "Pipe material specified",
      reference: "B31.3 §323.2",
      status: "missing",
      detail: "No pipe material selected.",
      inputs: "pipeMaterial",
      source: "ASME B31.3 §323.2",
    });
  }

  // 4. Material compatibility (pipe-flange-fitting-bolt-gasket)
  const pipeId = inputs.pipeMaterial ? findPipeIdByDesignation(inputs.pipeMaterial) : null;
  const compat = pipeId ? PIPE_COMPATIBILITY[pipeId] : null;
  if (compat && inputs.flangeMaterial) {
    const flangeOk = compat.flanges.includes(inputs.flangeMaterial);
    checks.push({
      id: "MAT-02",
      item: "Flange material compatible with pipe",
      reference: "B31.3 §323.1",
      status: flangeOk ? "pass" : "warning",
      detail: flangeOk
        ? `${inputs.flangeMaterial} is a compatible flange for ${inputs.pipeMaterial}.`
        : `${inputs.flangeMaterial} is not in the standard compatibility set for ${inputs.pipeMaterial}. Verify metallurgical compatibility.`,
      inputs: "pipeMaterial, flangeMaterial",
      source: "ASME B31.3 §323.1, ASME B16.5",
    });
  }

  if (compat && inputs.boltMaterial) {
    const boltOk = compat.bolts.includes(inputs.boltMaterial);
    checks.push({
      id: "MAT-03",
      item: "Bolt material compatible with flange/pipe",
      reference: "B31.3 §323.1, B16.5 Table 6",
      status: boltOk ? "pass" : "warning",
      detail: boltOk
        ? `${inputs.boltMaterial} is compatible for ${inputs.pipeMaterial} service.`
        : `${inputs.boltMaterial} is not in the standard bolt set for ${inputs.pipeMaterial}. Verify suitability.`,
      inputs: "pipeMaterial, boltMaterial",
      source: "ASME B16.5 Table 6, ASTM A193/A194",
    });
  }

  // 5. Corrosion allowance
  checks.push({
    id: "CA-01",
    item: "Corrosion allowance specified",
    reference: "B31.3 §302.4",
    status: ca > 0 ? "pass" : inputs.corrosionSeverity === "Low" ? "review" : "warning",
    detail: ca > 0
      ? `Corrosion allowance = ${ca} ${inputs.unitSystem === "SI" ? "mm" : "in"}. Severity: ${inputs.corrosionSeverity}.`
      : inputs.corrosionSeverity === "Low"
        ? "No corrosion allowance set (Low severity). Confirm with process/corrosion engineer."
        : `No corrosion allowance set despite ${inputs.corrosionSeverity} corrosion severity. This is likely inadequate.`,
    inputs: "corrosionAllowance, corrosionSeverity",
    source: "ASME B31.3 §302.4",
  });

  // 6. Test pressure logic
  if (dp > 0) {
    const minTestP = dp * 1.5;
    const testOk = tp >= minTestP;
    checks.push({
      id: "TP-01",
      item: "Hydrostatic test pressure meets minimum",
      reference: "B31.3 §345.4.2(a)",
      status: tp > 0 ? (testOk ? "pass" : "fail") : "missing",
      detail: tp > 0
        ? testOk
          ? `Test pressure ${tp} ≥ 1.5 × ${dp} = ${minTestP.toFixed(1)}. Meets B31.3 §345.4.2(a).`
          : `Test pressure ${tp} < 1.5 × ${dp} = ${minTestP.toFixed(1)}. Does NOT meet B31.3 §345.4.2(a) minimum.`
        : "Test pressure not specified.",
      inputs: "testPressure, designPressure",
      source: "ASME B31.3 §345.4.2(a)",
    });
  }

  // 7. Joint quality factor
  checks.push({
    id: "EJ-01",
    item: "Joint quality factor (Ej) appropriate for weld type",
    reference: "B31.3 Table A-1B",
    status: ej > 0 ? "pass" : "missing",
    detail: ej > 0
      ? `Ej = ${ej} for ${inputs.weldType}. ${inputs.weldType === "Seamless" ? "Ej = 1.0 correct for seamless." : inputs.weldType === "ERW" ? "Ej = 0.85 standard for ERW (1.0 if 100% RT)." : `Verify Ej for ${inputs.weldType} per Table A-1B.`}`
      : "Joint quality factor not specified.",
    inputs: "jointQualityFactor, weldType",
    source: "ASME B31.3 Table A-1B, §302.3.4",
  });

  // 8. Category M special requirements
  if (inputs.categoryM === "Yes") {
    checks.push({
      id: "CM-01",
      item: "Category M — Enhanced examination requirements",
      reference: "B31.3 Chapter VIII, §M341",
      status: "review",
      detail: "Category M service requires 100% visual + radiographic or ultrasonic examination of all girth welds. Socket welds require PT or MT. Verify examination plan meets §M341.",
      inputs: "categoryM",
      source: "ASME B31.3 §M341",
    });
  }

  // 9. Severe cyclic requirements
  if (inputs.severeCyclic === "Yes") {
    checks.push({
      id: "SC-01",
      item: "Severe cyclic — Fatigue analysis required",
      reference: "B31.3 §302.3.5, §300.2",
      status: "review",
      detail: "Severe cyclic conditions require fatigue analysis per §302.3.5(d). Socket welds prohibited per §328.2.2 note. Verify thermal cycle count and displacement stress range.",
      inputs: "severeCyclic",
      source: "ASME B31.3 §302.3.5, §328.2.2",
    });
  }

  // 10. Flexibility / stress screening
  checks.push({
    id: "FX-01",
    item: "Flexibility / thermal stress screening",
    reference: "B31.3 §319.4.1",
    status: "review",
    detail: "Formal flexibility analysis may be required if: (a) the system is not a simple replicate of a proven design, (b) design temperature produces significant expansion, or (c) the displacement stress range SE exceeds Sa. Screen using §319.4.1 criteria.",
    inputs: "designTemperature, pipeMaterial",
    source: "ASME B31.3 §319.4.1",
  });

  // 11. High pressure chapter applicability
  if (inputs.highPressure === "Yes" || dpPsi > 2500) {
    checks.push({
      id: "HP-01",
      item: "High Pressure Chapter IX applicability",
      reference: "B31.3 Chapter IX, §K300",
      status: "review",
      detail: `Design pressure ${dp} ${inputs.unitSystem === "SI" ? "barg" : "psig"} (≈${dpPsi.toFixed(0)} psi). Chapter IX applies. Special design equations (§K304), examination (§K341), and testing (§K345) required.`,
      inputs: "highPressure, designPressure",
      source: "ASME B31.3 Chapter IX",
    });
  }

  // 12. Sour service check
  const desc = inputs.serviceDescription.toLowerCase();
  if (/\b(sour|h2s)\b/.test(desc)) {
    checks.push({
      id: "SS-01",
      item: "Sour service — NACE MR0175 compliance",
      reference: "NACE MR0175/ISO 15156",
      status: isBoltNACECompliant(inputs.boltMaterial) ? "pass" : "warning",
      detail: isBoltNACECompliant(inputs.boltMaterial)
        ? `Bolt material ${inputs.boltMaterial} meets NACE hardness requirements (HRC ≤ 22).`
        : `Sour service detected. Verify all materials comply with NACE MR0175/ISO 15156. Bolts must be HRC ≤ 22 (use B7M or equivalent).`,
      inputs: "serviceDescription, boltMaterial, pipeMaterial",
      source: "NACE MR0175/ISO 15156, ASME B31.3 §323.1.1",
    });
  }

  // Summary
  const summary = {
    pass: checks.filter(c => c.status === "pass").length,
    fail: checks.filter(c => c.status === "fail").length,
    review: checks.filter(c => c.status === "review").length,
    warning: checks.filter(c => c.status === "warning").length,
    missing: checks.filter(c => c.status === "missing").length,
  };

  return { checks, summary };
}
