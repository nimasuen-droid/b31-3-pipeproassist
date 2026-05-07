/**
 * Override Explanation Engine
 * 
 * When a user overrides a system-recommended material, this engine generates
 * a detailed engineering comparison explaining:
 * 1. What the system recommended and why
 * 2. Whether the user's override is acceptable, conditionally acceptable, or not recommended
 * 3. Engineering-based reasoning covering P/T suitability, code compliance, sealing, corrosion, availability
 */

import { PIPE_MATERIALS, FLANGE_MATERIALS, FITTING_MATERIALS, BOLT_MATERIALS, GASKET_TYPES, type MaterialSpec } from "./materialDatabase";

export interface OverrideExplanation {
  systemRecommended: string;
  systemReason: string;
  userSelected: string;
  verdict: "Acceptable" | "Conditionally Acceptable" | "Not Recommended" | "Review Required";
  verdictColor: string;
  explanation: string;
  considerations: string[];
}

function findMaterialSpec(designation: string): MaterialSpec | undefined {
  return (
    PIPE_MATERIALS.find(m => m.designation === designation) ||
    FLANGE_MATERIALS.find(m => m.designation === designation) ||
    FITTING_MATERIALS.find(m => m.designation === designation) ||
    BOLT_MATERIALS.find(m => m.designation === designation) ||
    GASKET_TYPES.find(m => m.designation === designation)
  );
}

function getGroupCompatibility(recGroup: string, selGroup: string): "same" | "upgrade" | "downgrade" | "mismatch" {
  const hierarchy = ["Carbon Steel", "Low Alloy", "Stainless", "Duplex", "Nickel Alloy"];
  const recIdx = hierarchy.indexOf(recGroup);
  const selIdx = hierarchy.indexOf(selGroup);
  if (recIdx === selIdx) return "same";
  if (selIdx > recIdx) return "upgrade";
  if (selIdx < recIdx && selIdx >= 0) return "downgrade";
  return "mismatch";
}

export function getOverrideExplanation(
  fieldLabel: string,
  systemRecommended: string,
  systemReason: string,
  userSelected: string,
  context: { tempC: number; pressureBar: number; serviceType: string; flangeClassNum: number }
): OverrideExplanation | null {
  if (!userSelected || userSelected === systemRecommended) return null;

  // Strip cast designation formatting for comparison
  const cleanRec = systemRecommended.replace(/\s*\(.*\)/, "").trim();
  if (userSelected === cleanRec) return null;

  const recSpec = findMaterialSpec(cleanRec) || findMaterialSpec(systemRecommended);
  const selSpec = findMaterialSpec(userSelected);

  const considerations: string[] = [];
  let verdict: OverrideExplanation["verdict"] = "Review Required";
  let explanation = "";

  if (!selSpec) {
    // Can't find the selected spec — could be a custom/free text entry
    return {
      systemRecommended, systemReason, userSelected,
      verdict: "Review Required",
      verdictColor: "text-amber-600",
      explanation: `The selected material "${userSelected}" is not in the standard database. Verify it meets the service requirements for ${context.serviceType} at ${context.tempC.toFixed(0)}°C / ${context.pressureBar.toFixed(1)} bar.`,
      considerations: [
        "Confirm material is listed in ASME B31.3 Table A-1 or project-approved material list",
        "Verify allowable stress at design temperature from ASME Section II-D",
        "Check compatibility with other piping components in the material set",
        "Ensure procurement availability and lead time are acceptable"
      ],
    };
  }

  const compat = recSpec ? getGroupCompatibility(recSpec.materialGroup, selSpec.materialGroup) : "mismatch";

  // Temperature check
  if (context.tempC > selSpec.maxTempC) {
    verdict = "Not Recommended";
    considerations.push(`❌ Selected material max temperature is ${selSpec.maxTempC}°C, but design temperature is ${context.tempC.toFixed(0)}°C — EXCEEDS material limit.`);
  } else if (context.tempC < selSpec.minTempC) {
    verdict = "Not Recommended";
    considerations.push(`❌ Selected material min temperature is ${selSpec.minTempC}°C, but design temperature is ${context.tempC.toFixed(0)}°C — below material's low-temperature limit. Impact testing may be required per B31.3 §323.2.2.`);
  } else {
    considerations.push(`✓ Temperature ${context.tempC.toFixed(0)}°C is within material range (${selSpec.minTempC}°C to ${selSpec.maxTempC}°C)`);
  }

  // Material group analysis
  if (compat === "same") {
    verdict = verdict === "Not Recommended" ? verdict : "Acceptable";
    explanation = `Both recommended and selected materials are in the same material group (${selSpec.materialGroup}). They share similar mechanical properties and corrosion resistance characteristics.`;
    considerations.push("✓ Same material family — welding procedures and PWHT requirements are similar");
    considerations.push("✓ Compatible with other components in the material set");
  } else if (compat === "upgrade") {
    verdict = verdict === "Not Recommended" ? verdict : "Acceptable";
    explanation = `The selected material (${selSpec.materialGroup}) is a higher-grade alloy than recommended (${recSpec?.materialGroup || "—"}). This generally provides better corrosion resistance and/or higher temperature capability, but at increased cost.`;
    considerations.push(`✓ ${selSpec.materialGroup} offers improved properties vs ${recSpec?.materialGroup || "recommended"}`);
    considerations.push("⚠ Higher cost — confirm project budget allows this upgrade");
    considerations.push("⚠ Check weld procedure compatibility with adjacent carbon steel components (dissimilar metal joints)");
  } else if (compat === "downgrade") {
    verdict = verdict === "Not Recommended" ? verdict : "Conditionally Acceptable";
    explanation = `The selected material (${selSpec.materialGroup}) is a lower-grade alloy than recommended (${recSpec?.materialGroup || "—"}). This may be acceptable for less severe service but should be reviewed for corrosion and temperature suitability.`;
    considerations.push(`⚠ Downgrade from ${recSpec?.materialGroup || "recommended"} to ${selSpec.materialGroup} — reduced corrosion resistance`);
    considerations.push("⚠ Verify adequacy for the specific service environment and fluid composition");
  } else {
    verdict = verdict === "Not Recommended" ? verdict : "Review Required";
    explanation = `The selected material is in a different material group than recommended. Engineering review is required to confirm suitability.`;
  }

  // Service-specific checks
  if (context.serviceType === "Corrosive / Sour Service" && selSpec.materialGroup === "Carbon Steel") {
    if (verdict !== "Not Recommended") verdict = "Conditionally Acceptable";
    considerations.push("⚠ Carbon steel in sour/corrosive service requires NACE MR0175 compliance and hardness limits (HRC ≤ 22 for bolting)");
  }
  if (context.serviceType === "Hydrogen Service" && selSpec.materialGroup === "Stainless") {
    considerations.push("✓ Austenitic stainless has good hydrogen embrittlement resistance, but verify against API 941 Nelson Curves for HTHA");
  }
  if (context.serviceType === "Cryogenic Service" && selSpec.materialGroup === "Carbon Steel" && selSpec.minTempC > -46) {
    verdict = "Not Recommended";
    considerations.push("❌ Standard carbon steel is not suitable for cryogenic service — requires impact-tested or austenitic stainless materials per B31.3 §323.2.2");
  }
  if (context.serviceType === "Oxygen Service" && selSpec.materialGroup === "Carbon Steel") {
    if (verdict !== "Not Recommended") verdict = "Conditionally Acceptable";
    considerations.push("⚠ Carbon steel in oxygen service acceptable only at low pressures (<1.5 MPa) with strict cleaning per CGA G-4.1 / ASTM G93");
  }

  // Flange class considerations for gaskets
  if (fieldLabel.toLowerCase().includes("gasket")) {
    if (context.flangeClassNum >= 900 && !userSelected.startsWith("RTJ")) {
      verdict = "Not Recommended";
      considerations.push(`❌ For Class ${context.flangeClassNum} (≥900#), RTJ gaskets are the industry standard. Spiral wound or sheet gaskets do not provide adequate sealing reliability at these pressures.`);
    }
    if (context.flangeClassNum < 900 && userSelected.startsWith("RTJ")) {
      if (verdict !== "Not Recommended") verdict = "Conditionally Acceptable";
      considerations.push(`⚠ RTJ gaskets for Class ${context.flangeClassNum} — while technically workable, RTJ is typically reserved for ≥900#. RF with spiral wound is more cost-effective and standard for this class.`);
    }
  }

  // Availability consideration
  if (selSpec.materialGroup === "Nickel Alloy" || selSpec.materialGroup === "Duplex") {
    considerations.push("⚠ Specialty alloys may have longer procurement lead times (12-20 weeks typical)");
  }

  const verdictColor = verdict === "Acceptable" ? "text-green-600"
    : verdict === "Conditionally Acceptable" ? "text-amber-600"
    : verdict === "Not Recommended" ? "text-destructive"
    : "text-blue-600";

  return {
    systemRecommended, systemReason, userSelected,
    verdict, verdictColor, explanation, considerations,
  };
}
