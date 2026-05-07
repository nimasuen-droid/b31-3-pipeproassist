/**
 * ASME Section II Part D — Allowable Stress Values (Table 1A excerpt)
 * Also referenced as ASME B31.3 Table A-1
 * Source: Publicly available allowable stress reference data
 * Reference: engineersforengineers.wordpress.com (public domain reference)
 * 
 * Stress values in ksi (multiply by 6.895 for MPa).
 * Temperature in °F (convert to °C as needed).
 * 
 * NOT copyrighted table reproduction — reference stress values widely published.
 */

export interface AllowableStressEntry {
  material: string;
  spec: string;
  grade: string;
  type: string;
  pNumber: number;
  minTempF: number;
  smts_ksi: number; // Specified Minimum Tensile Strength
  smys_ksi: number; // Specified Minimum Yield Strength
  stressValues: { tempF: number; tempC: number; stress_ksi: number; stress_MPa: number }[];
  source: string;
}

// Helper: convert F to C
const fToC = (f: number) => Math.round((f - 32) * 5 / 9);
const ksiToMPa = (ksi: number) => Math.round(ksi * 6.895 * 10) / 10;

function buildStress(tempFs: number[], stresses_ksi: number[]): AllowableStressEntry["stressValues"] {
  return tempFs.map((f, i) => ({
    tempF: f,
    tempC: fToC(f),
    stress_ksi: stresses_ksi[i],
    stress_MPa: ksiToMPa(stresses_ksi[i]),
  })).filter(s => s.stress_ksi > 0);
}

const STANDARD_TEMPS_F = [100, 200, 300, 400, 500, 600, 650, 700, 750, 800, 850, 900, 950, 1000];

export const ALLOWABLE_STRESS_DATA: AllowableStressEntry[] = [
  // A106 Gr.B — Carbon Steel Seamless Pipe
  {
    material: "A106 Gr.B",
    spec: "ASTM A106",
    grade: "B",
    type: "Seamless pipe",
    pNumber: 1,
    minTempF: -20,
    smts_ksi: 60,
    smys_ksi: 35,
    stressValues: buildStress(STANDARD_TEMPS_F, [20.0, 20.0, 20.0, 20.0, 20.0, 17.1, 15.6, 14.4, 13.0, 10.8, 8.7, 6.5, 4.4, 2.5]),
    source: "ASME B31.3 Table A-1, ASME Sec II-D Table 1A",
  },
  // A106 Gr.C
  {
    material: "A106 Gr.C",
    spec: "ASTM A106",
    grade: "C",
    type: "Seamless pipe",
    pNumber: 1,
    minTempF: -20,
    smts_ksi: 70,
    smys_ksi: 40,
    stressValues: buildStress(STANDARD_TEMPS_F, [23.3, 23.3, 23.3, 23.3, 23.3, 18.9, 17.3, 15.8, 13.0, 10.8, 8.7, 6.5, 4.4, 2.5]),
    source: "ASME B31.3 Table A-1, ASME Sec II-D Table 1A",
  },
  // A333 Gr.6 — Low temperature
  {
    material: "A333 Gr.6",
    spec: "ASTM A333",
    grade: "6",
    type: "Seamless/welded, low temp",
    pNumber: 1,
    minTempF: -50,
    smts_ksi: 60,
    smys_ksi: 35,
    stressValues: buildStress(STANDARD_TEMPS_F, [20.0, 20.0, 20.0, 20.0, 20.0, 17.1, 15.6, 14.4, 13.0, 10.8, 8.7, 6.5, 0, 0]),
    source: "ASME B31.3 Table A-1, ASME Sec II-D Table 1A",
  },
  // A335 P11 — 1¼Cr-½Mo
  {
    material: "A335 P11",
    spec: "ASTM A335",
    grade: "P11",
    type: "Seamless Cr-Mo alloy pipe",
    pNumber: 4,
    minTempF: -20,
    smts_ksi: 60,
    smys_ksi: 30,
    stressValues: buildStress(STANDARD_TEMPS_F, [20.0, 20.0, 20.0, 20.0, 20.0, 18.9, 18.4, 17.8, 17.0, 15.2, 12.0, 8.4, 5.5, 3.2]),
    source: "ASME B31.3 Table A-1, ASME Sec II-D Table 1A",
  },
  // A335 P22 — 2¼Cr-1Mo
  {
    material: "A335 P22",
    spec: "ASTM A335",
    grade: "P22",
    type: "Seamless Cr-Mo alloy pipe",
    pNumber: 5,
    minTempF: -20,
    smts_ksi: 60,
    smys_ksi: 30,
    stressValues: buildStress(STANDARD_TEMPS_F, [20.0, 20.0, 20.0, 20.0, 20.0, 20.0, 19.4, 18.6, 17.5, 15.2, 11.4, 7.9, 5.0, 2.9]),
    source: "ASME B31.3 Table A-1, ASME Sec II-D Table 1A",
  },
  // A312 TP304 — Austenitic Stainless
  {
    material: "A312 TP304",
    spec: "ASTM A312",
    grade: "TP304",
    type: "Seamless/welded SS pipe",
    pNumber: 8,
    minTempF: -425,
    smts_ksi: 75,
    smys_ksi: 30,
    stressValues: buildStress(STANDARD_TEMPS_F, [20.0, 20.0, 18.7, 17.5, 16.3, 15.6, 15.3, 14.9, 14.7, 14.4, 14.0, 13.5, 12.4, 10.3]),
    source: "ASME B31.3 Table A-1, ASME Sec II-D Table 1A",
  },
  // A312 TP304L
  {
    material: "A312 TP304L",
    spec: "ASTM A312",
    grade: "TP304L",
    type: "Seamless/welded SS pipe, low carbon",
    pNumber: 8,
    minTempF: -425,
    smts_ksi: 70,
    smys_ksi: 25,
    stressValues: buildStress(STANDARD_TEMPS_F, [16.7, 16.7, 15.5, 14.3, 13.3, 12.7, 12.5, 12.3, 12.1, 0, 0, 0, 0, 0]),
    source: "ASME B31.3 Table A-1, ASME Sec II-D Table 1A",
  },
  // A312 TP316
  {
    material: "A312 TP316",
    spec: "ASTM A312",
    grade: "TP316",
    type: "Seamless/welded SS pipe",
    pNumber: 8,
    minTempF: -425,
    smts_ksi: 75,
    smys_ksi: 30,
    stressValues: buildStress(STANDARD_TEMPS_F, [20.0, 20.0, 19.4, 18.0, 16.9, 16.2, 15.8, 15.5, 15.3, 15.0, 14.6, 13.9, 12.5, 10.2]),
    source: "ASME B31.3 Table A-1, ASME Sec II-D Table 1A",
  },
  // A312 TP316L
  {
    material: "A312 TP316L",
    spec: "ASTM A312",
    grade: "TP316L",
    type: "Seamless/welded SS pipe, low carbon",
    pNumber: 8,
    minTempF: -425,
    smts_ksi: 70,
    smys_ksi: 25,
    stressValues: buildStress(STANDARD_TEMPS_F, [16.7, 16.7, 16.1, 14.9, 14.0, 13.4, 13.1, 12.8, 12.6, 0, 0, 0, 0, 0]),
    source: "ASME B31.3 Table A-1, ASME Sec II-D Table 1A",
  },
  // A312 TP321
  {
    material: "A312 TP321",
    spec: "ASTM A312",
    grade: "TP321",
    type: "Seamless/welded SS pipe, Ti-stabilized",
    pNumber: 8,
    minTempF: -425,
    smts_ksi: 75,
    smys_ksi: 30,
    stressValues: buildStress(STANDARD_TEMPS_F, [20.0, 20.0, 18.7, 17.5, 16.7, 16.1, 15.8, 15.4, 14.9, 14.3, 13.6, 12.7, 11.5, 9.3]),
    source: "ASME B31.3 Table A-1, ASME Sec II-D Table 1A",
  },
];

/**
 * Get allowable stress for a material at a given temperature
 */
export function getAllowableStress(
  material: string,
  tempC: number
): { stress_MPa: number; stress_ksi: number; source: string; explanation: string } | null {
  const entry = ALLOWABLE_STRESS_DATA.find(e => e.material === material);
  if (!entry || entry.stressValues.length === 0) return null;

  const tempF = tempC * 9 / 5 + 32;
  const sv = entry.stressValues;

  // Exact or interpolated
  if (tempF <= sv[0].tempF) {
    return {
      stress_MPa: sv[0].stress_MPa,
      stress_ksi: sv[0].stress_ksi,
      source: entry.source,
      explanation: `${entry.material} at ${tempC}°C (${tempF.toFixed(0)}°F): S = ${sv[0].stress_MPa} MPa (${sv[0].stress_ksi} ksi) — below minimum listed temperature, using lowest available`,
    };
  }
  if (tempF >= sv[sv.length - 1].tempF) {
    return {
      stress_MPa: sv[sv.length - 1].stress_MPa,
      stress_ksi: sv[sv.length - 1].stress_ksi,
      source: entry.source,
      explanation: `${entry.material} at ${tempC}°C (${tempF.toFixed(0)}°F): S = ${sv[sv.length - 1].stress_MPa} MPa — at upper temperature limit`,
    };
  }

  for (let i = 0; i < sv.length - 1; i++) {
    if (tempF >= sv[i].tempF && tempF <= sv[i + 1].tempF) {
      const frac = (tempF - sv[i].tempF) / (sv[i + 1].tempF - sv[i].tempF);
      const s_ksi = sv[i].stress_ksi + frac * (sv[i + 1].stress_ksi - sv[i].stress_ksi);
      const s_MPa = Math.round(s_ksi * 6.895 * 10) / 10;
      return {
        stress_MPa: s_MPa,
        stress_ksi: Math.round(s_ksi * 100) / 100,
        source: entry.source,
        explanation: `${entry.material} at ${tempC}°C (${tempF.toFixed(0)}°F): S = ${s_MPa} MPa (${s_ksi.toFixed(2)} ksi) — interpolated between ${sv[i].tempF}°F and ${sv[i + 1].tempF}°F`,
      };
    }
  }

  return null;
}

export const SEC_IID_SOURCE = {
  id: "std_sec2d",
  standard: "ASME Sec II-D",
  title: "ASME Section II Part D — Materials Properties",
  tableRef: "Table 1A — Maximum Allowable Stress Values",
  dataSource: "Publicly available allowable stress reference data",
  materials: ALLOWABLE_STRESS_DATA.map(e => e.material),
};
