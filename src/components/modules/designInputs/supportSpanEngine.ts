/**
 * Support Span Estimation Engine
 * Estimates maximum allowable pipe support spacing per standard references
 * 
 * Sources:
 * - ASME B31.1 Table 121.5 (guideline, commonly referenced by B31.3 projects)
 * - MSS SP-69 — Pipe Hangers and Supports
 * - Perry's Chemical Engineers' Handbook — beam deflection criteria
 * 
 * Method: Simplified beam formula with deflection limit of 2.5 mm (0.1") per span
 * L = (384 × E × I × δ / (5 × w))^0.25
 * where w = total distributed load (pipe + fluid + insulation)
 * 
 * NOTE: These are screening estimates. Final support design requires formal analysis.
 */

export interface SupportSpanResult {
  emptySpan_m: number;
  emptySpan_ft: number;
  operatingSpan_m: number;
  operatingSpan_ft: number;
  hydroTestSpan_m: number;
  hydroTestSpan_ft: number;
  pipeWeight_kgm: number;
  fluidWeight_kgm: number;
  insulationWeight_kgm: number;
  totalOperatingLoad_kgm: number;
  explanation: string;
  source: string;
  warnings: string[];
}

// Standard support spans per ASME B31.1 Table 121.5 (for reference/comparison)
// These are for Schedule 40 carbon steel, water-filled
const REFERENCE_SPANS: Record<string, { water_ft: number; steam_ft: number }> = {
  "1\"":   { water_ft: 7,  steam_ft: 9 },
  "1.5\"": { water_ft: 9,  steam_ft: 12 },
  "2\"":   { water_ft: 10, steam_ft: 13 },
  "3\"":   { water_ft: 12, steam_ft: 15 },
  "4\"":   { water_ft: 14, steam_ft: 17 },
  "6\"":   { water_ft: 17, steam_ft: 21 },
  "8\"":   { water_ft: 19, steam_ft: 24 },
  "10\"":  { water_ft: 22, steam_ft: 27 },
  "12\"":  { water_ft: 23, steam_ft: 30 },
  "16\"":  { water_ft: 27, steam_ft: 35 },
  "20\"":  { water_ft: 30, steam_ft: 39 },
  "24\"":  { water_ft: 32, steam_ft: 42 },
};

export function estimateSupportSpan(inputs: {
  nps: string;
  od_mm: number;
  wt_mm: number;
  pipeWeightPerMeter: number;  // kg/m (steel pipe)
  fluidDensity: number;        // kg/m³ (water=1000, steam≈1-5, oil≈800-900)
  insulationThickness_mm: number;
  insulationDensity: number;   // kg/m³ (typically 100-200 for mineral wool)
  fluidPhase: string;
}): SupportSpanResult {
  const warnings: string[] = [];

  const od = inputs.od_mm / 1000; // m
  const id = (inputs.od_mm - 2 * inputs.wt_mm) / 1000; // m
  const wt = inputs.wt_mm / 1000; // m

  // Steel properties
  const E_steel = 200e9; // Pa (carbon steel elastic modulus at ambient)
  const rho_steel = 7850; // kg/m³

  // Moment of inertia for hollow cylinder: π/64 × (OD⁴ - ID⁴)
  const I = (Math.PI / 64) * (Math.pow(od, 4) - Math.pow(id, 4)); // m⁴

  // Weight calculations
  const pipeArea = (Math.PI / 4) * (od * od - id * id); // m²
  const pipeWeight = inputs.pipeWeightPerMeter > 0
    ? inputs.pipeWeightPerMeter
    : pipeArea * rho_steel; // kg/m

  const fluidArea = (Math.PI / 4) * id * id; // m²
  const fluidWeight = fluidArea * inputs.fluidDensity; // kg/m

  // Insulation weight
  const insOD = od + 2 * (inputs.insulationThickness_mm / 1000);
  const insArea = (Math.PI / 4) * (insOD * insOD - od * od);
  const insulationWeight = insArea * inputs.insulationDensity; // kg/m

  // Total distributed loads
  const w_empty = (pipeWeight + insulationWeight) * 9.81; // N/m
  const w_operating = (pipeWeight + fluidWeight + insulationWeight) * 9.81; // N/m
  const w_hydrotest = (pipeWeight + fluidArea * 1000 + insulationWeight) * 9.81; // N/m (water for test)

  // Deflection limit
  const delta = 0.0025; // 2.5 mm deflection limit

  // L = (384 × E × I × δ / (5 × w))^0.25
  const calcSpan = (w: number): number => {
    if (w <= 0 || I <= 0) return 0;
    return Math.pow((384 * E_steel * I * delta) / (5 * w), 0.25);
  };

  const emptySpan = calcSpan(w_empty);
  const operatingSpan = calcSpan(w_operating);
  const hydroTestSpan = calcSpan(w_hydrotest);

  // Compare with reference table
  const refSpan = REFERENCE_SPANS[inputs.nps];
  if (refSpan) {
    const refSpanM = refSpan.water_ft * 0.3048;
    if (Math.abs(operatingSpan - refSpanM) / refSpanM > 0.3) {
      warnings.push(`Calculated span differs >30% from B31.1 Table 121.5 reference (${refSpan.water_ft} ft for water). Verify inputs and schedule.`);
    }
  }

  if (inputs.fluidDensity > 1200) {
    warnings.push("High fluid density detected. Ensure support design accounts for concentrated loads and dynamic effects.");
  }

  if (inputs.insulationThickness_mm > 100) {
    warnings.push("Thick insulation adds significant dead load. Consider insulation support rings at each pipe support.");
  }

  return {
    emptySpan_m: emptySpan,
    emptySpan_ft: emptySpan / 0.3048,
    operatingSpan_m: operatingSpan,
    operatingSpan_ft: operatingSpan / 0.3048,
    hydroTestSpan_m: hydroTestSpan,
    hydroTestSpan_ft: hydroTestSpan / 0.3048,
    pipeWeight_kgm: pipeWeight,
    fluidWeight_kgm: fluidWeight,
    insulationWeight_kgm: insulationWeight,
    totalOperatingLoad_kgm: pipeWeight + fluidWeight + insulationWeight,
    explanation: `Support span estimated using simply-supported beam with 2.5 mm deflection limit. Empty span: ${emptySpan.toFixed(1)} m (${(emptySpan / 0.3048).toFixed(0)} ft), Operating span: ${operatingSpan.toFixed(1)} m (${(operatingSpan / 0.3048).toFixed(0)} ft). ${refSpan ? `B31.1 Table 121.5 reference: ${refSpan.water_ft} ft (water), ${refSpan.steam_ft} ft (steam/gas).` : ""}`,
    source: "ASME B31.1 Table 121.5, MSS SP-69, Simplified beam deflection (δ = 2.5 mm)",
    warnings,
  };
}
