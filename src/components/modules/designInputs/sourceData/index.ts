/**
 * Source Data Index — Central export for all loaded ASME reference data
 * 
 * Standards loaded:
 * - ASME B36.10M — Pipe dimensions (wall thickness, OD, schedule)
 * - ASME B36.19M — Stainless steel pipe dimensions (via B36.10M data with standard flag)
 * - ASME B16.5 — Flange P-T ratings (Groups 1.1, 2.2, 2.3)
 * - ASME Sec II-D / B31.3 Table A-1 — Allowable stress values
 * - ASME B31.3 — Design code rules (embedded in engines)
 * - ASME B16.9 — Fitting dimensions (material data in materialDatabase.ts)
 * - ASME B16.11 — Forged fitting data (material data in materialDatabase.ts)
 */

export { B36_10M_PIPE_DATA, B36_10M_SOURCE } from "./b36_10m_data";
export { B36_19M_PIPE_DATA, B36_19M_SOURCE } from "./b36_19m_data";

import { B36_10M_PIPE_DATA as _B36_10M } from "./b36_10m_data";
import { B36_19M_PIPE_DATA as _B36_19M } from "./b36_19m_data";

/** Combined pipe dimension table — B36.10M + B36.19M.
 *  Both tables share the same OD per NPS; B36.19M adds the S-schedules
 *  (5S/10S/40S/80S) used for stainless and high-alloy specifications. */
export const ALL_PIPE_DIMENSIONS = [..._B36_10M, ..._B36_19M];

/** Returns true if the given pipe-material designation maps to a stainless /
 *  duplex / nickel family — i.e. ASME B36.19M is the governing dimensional
 *  standard rather than B36.10M. Accepts free-form designations
 *  (e.g. "A312 TP316L", "A790 S31803", "B167 N06600"). */
export function isStainlessDimensionalStandard(designation: string | undefined | null): boolean {
  if (!designation) return false;
  const d = designation.toUpperCase();
  // Stainless / Duplex / Nickel ASTM specs governed by B36.19M
  return /\bA(?:312|358|376|409|813|814|790|928|268|249)\b/.test(d)
    || /\bA182\s*F(?:30[14]|316|321|347|44|51|53|55)\b/.test(d)
    || /\bB(?:167|161|163|166|407|423|444|619|622|626|464|705|729)\b/.test(d)
    || /\bTP\s*\d/.test(d)        // TP304/TP316/etc.
    || /\bS3\d{4}\b/.test(d)      // UNS duplex (S31803, S32750, …)
    || /\bN0\d{4}\b/.test(d)      // UNS nickel alloys (N06600, N08825, …)
    || /\b(?:STAINLESS|DUPLEX|NICKEL)\b/.test(d);
}

/** Pipe dimensions filtered to the standard governing the given material. */
export function getPipeDimensionsForMaterial(designation: string | undefined | null) {
  return isStainlessDimensionalStandard(designation) ? _B36_19M : _B36_10M;
}
export { 
  ALL_FLANGE_PT_RATINGS, 
  B16_5_GROUP_1_1, 
  B16_5_GROUP_2_2, 
  B16_5_GROUP_2_3, 
  B16_5_SOURCE,
  selectFlangeClass,
  type FlangePTRating,
} from "./b16_5_data";
export { 
  ALLOWABLE_STRESS_DATA, 
  SEC_IID_SOURCE, 
  getAllowableStress,
  type AllowableStressEntry,
} from "./secIID_data";

/** Summary of all loaded source data for traceability panel */
export const LOADED_SOURCES_SUMMARY = [
  { id: "std_b3610", standard: "ASME B36.10M", status: "active" as const, tables: 1, description: "Pipe schedule/wall thickness data — NPS 1/8\" to 24\", all schedules" },
  { id: "std_b3619", standard: "ASME B36.19M", status: "active" as const, tables: 1, description: "Stainless steel pipe dimensions — Schedules 5S/10S/40S/80S, NPS 1/2\" to 24\"" },
  { id: "std_b165", standard: "ASME B16.5", status: "active" as const, tables: 3, description: "Flange P-T ratings: Group 1.1 (CS), 2.2 (316SS), 2.3 (316L)" },
  { id: "std_sec2d", standard: "ASME Sec II-D", status: "active" as const, tables: 1, description: "Allowable stress: A106 B/C, A333-6, A335 P11/P22, A312 304/304L/316/316L/321" },
  { id: "std_b313", standard: "ASME B31.3", status: "active" as const, tables: 0, description: "Design code rules embedded in calculation engines" },
  { id: "std_b169", standard: "ASME B16.9", status: "active" as const, tables: 0, description: "Fitting material compatibility data in materialDatabase.ts" },
  { id: "std_b1611", standard: "ASME B16.11", status: "active" as const, tables: 0, description: "Forged fitting material data in materialDatabase.ts" },
];
