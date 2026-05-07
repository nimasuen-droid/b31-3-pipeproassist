// ASME B31.3 Process Piping — wall thickness calculations
// Reference: ASME B31.3 §304.1.2

export type Units = "us" | "si";

export interface ThicknessInput {
  P: number;   // design pressure (psi or MPa)
  D: number;   // outside diameter (in or mm)
  S: number;   // allowable stress (psi or MPa)
  E: number;   // quality factor (0..1)
  W: number;   // weld joint strength reduction factor (0..1)
  Y: number;   // coefficient (0.4 typical for ferritic steel ≤ 900°F)
  c: number;   // mechanical/corrosion/erosion allowance (in or mm)
  millTolerance: number; // percent (e.g., 12.5)
}

export interface ThicknessResult {
  t: number;        // pressure design thickness
  tm: number;       // minimum required thickness (t + c)
  tNom: number;     // nominal thickness accounting for mill tolerance
  ratio: number;    // t/D — Eq applicability check
  highPressure: boolean; // true when t ≥ D/6 (special considerations apply)
}

// Eq. 3a:  t = (P*D) / (2 * (S*E*W + P*Y))
export function pressureDesignThickness(i: ThicknessInput): ThicknessResult {
  const t = (i.P * i.D) / (2 * (i.S * i.E * i.W + i.P * i.Y));
  const tm = t + i.c;
  const tol = Math.max(0, Math.min(99, i.millTolerance)) / 100;
  const tNom = tm / (1 - tol);
  const ratio = t / i.D;
  return { t, tm, tNom, ratio, highPressure: ratio >= 1 / 6 };
}

// MAWP given a nominal thickness:
// solve P from t = (P*D)/(2*(S*E*W + P*Y))
// => P = (2*t*S*E*W) / (D - 2*t*Y)
export function mawpFromThickness(
  tNom: number, c: number, millTol: number,
  D: number, S: number, E: number, W: number, Y: number,
): number {
  const tol = Math.max(0, Math.min(99, millTol)) / 100;
  const tAvail = tNom * (1 - tol) - c;
  if (tAvail <= 0) return 0;
  const denom = D - 2 * tAvail * Y;
  if (denom <= 0) return Infinity;
  return (2 * tAvail * S * E * W) / denom;
}

export const MATERIALS: Array<{
  id: string; name: string; grade: string;
  // allowable stress at moderate temp; representative values for UI demo
  S_us: number; // psi
  S_si: number; // MPa
  Y: number;
}> = [
  { id: "a106b",  name: "Carbon Steel", grade: "ASTM A106 Gr.B",  S_us: 20000, S_si: 137.9, Y: 0.4 },
  { id: "a53b",   name: "Carbon Steel", grade: "ASTM A53 Gr.B",   S_us: 20000, S_si: 137.9, Y: 0.4 },
  { id: "a312-304", name: "Stainless",  grade: "A312 TP304",      S_us: 20000, S_si: 137.9, Y: 0.4 },
  { id: "a312-316", name: "Stainless",  grade: "A312 TP316",      S_us: 20000, S_si: 137.9, Y: 0.4 },
  { id: "a335-p11", name: "Low Alloy",  grade: "A335 P11",        S_us: 18300, S_si: 126.2, Y: 0.4 },
  { id: "a335-p22", name: "Low Alloy",  grade: "A335 P22",        S_us: 17900, S_si: 123.4, Y: 0.4 },
];

// Common NPS schedules — outside diameter in inches and mm
export const NPS_OD: Array<{ nps: string; in: number; mm: number }> = [
  { nps: "1/2",  in: 0.840,  mm: 21.3 },
  { nps: "3/4",  in: 1.050,  mm: 26.7 },
  { nps: "1",    in: 1.315,  mm: 33.4 },
  { nps: "1-1/2",in: 1.900,  mm: 48.3 },
  { nps: "2",    in: 2.375,  mm: 60.3 },
  { nps: "3",    in: 3.500,  mm: 88.9 },
  { nps: "4",    in: 4.500,  mm: 114.3 },
  { nps: "6",    in: 6.625,  mm: 168.3 },
  { nps: "8",    in: 8.625,  mm: 219.1 },
  { nps: "10",   in: 10.750, mm: 273.0 },
  { nps: "12",   in: 12.750, mm: 323.8 },
  { nps: "16",   in: 16.000, mm: 406.4 },
  { nps: "24",   in: 24.000, mm: 609.6 },
];

export function fmt(n: number, d = 3): string {
  if (!isFinite(n)) return "—";
  if (Math.abs(n) >= 10000) return n.toExponential(2);
  return n.toFixed(d);
}
