/**
 * Schedule Band Reduction Engine
 * Reduces all ASME B36.10M / B36.19M schedules to 4 standardized bands using next-highest selection logic.
 * Uses schedule-based designations only (Sch 5/10/20/30/40/60/80/100/120/140/160 and 5S/10S/40S/80S).
 *
 * Bands (PIP-style):
 *   Band A — Sch 10 / 10S (lightest, utility/low-pressure)
 *   Band B — Sch 40 / 40S (standard process)
 *   Band C — Sch 80 / 80S (heavy wall / high-pressure)
 *   Band D — Sch 160 (extra-heavy / critical)
 */

import { PIPE_DIMENSIONS, type PipeDimension } from "@/components/modules/designInputs/pipeScheduleEngine";

export type ScheduleBand = "A" | "B" | "C" | "D";

export interface BandDefinition {
  band: ScheduleBand;
  label: string;
  description: string;
  targetSchedules: string[];   // schedules that map to this band
  color: string;
}

export const SCHEDULE_BANDS: BandDefinition[] = [
  { band: "A", label: "Band A — Light", description: "Sch 5/10 / 5S/10S — Utility, low-pressure services", targetSchedules: ["5", "5S", "10", "10S"], color: "text-blue-600" },
  { band: "B", label: "Band B — Standard", description: "Sch 40 / 40S — Standard process piping", targetSchedules: ["20", "30", "40", "40S"], color: "text-green-600" },
  { band: "C", label: "Band C — Heavy", description: "Sch 80 / 80S — High-pressure / corrosive", targetSchedules: ["60", "80", "80S"], color: "text-amber-600" },
  { band: "D", label: "Band D — Extra Heavy", description: "Sch 160 — Critical / severe service", targetSchedules: ["100", "120", "140", "160"], color: "text-red-600" },
];

/** Map any schedule string to its band */
export function getScheduleBand(schedule: string): ScheduleBand {
  const clean = schedule.replace(/^Sch\s*/i, "").replace(/^Schedule\s*/i, "").trim();
  for (const bd of SCHEDULE_BANDS) {
    if (bd.targetSchedules.some(s => s.toLowerCase() === clean.toLowerCase())) return bd.band;
  }
  // Fallback: parse numeric and assign by range
  const num = parseInt(clean, 10);
  if (!isNaN(num)) {
    if (num <= 10) return "A";
    if (num <= 40) return "B";
    if (num <= 80) return "C";
    return "D";
  }
  return "B"; // default
}

/** Given required thickness, select next-highest band */
export function selectBandByThickness(
  nps: string,
  requiredThickness_mm: number,
  dimensions: PipeDimension[] = PIPE_DIMENSIONS,
): { band: ScheduleBand; schedule: PipeDimension | null; allBands: { band: ScheduleBand; schedule: PipeDimension | null }[] } {
  // Get all schedules for this NPS
  const npsClean = nps.replace(/['"]/g, "").trim();
  const npsMap: Record<string, string> = {
    "1/4": "0.25", "1/2": "0.5", "3/4": "0.75", "1-1/4": "1.25", "1-1/2": "1.5", "2-1/2": "2.5", "3-1/2": "3.5",
  };
  const npsNorm = npsMap[npsClean] || npsClean;

  const available = dimensions.filter(pd => {
    const pdNps = pd.nps.replace(/[^\d./]/g, "");
    return pdNps === npsNorm;
  });

  // For each band, find representative schedule (thinnest in band)
  const allBands = SCHEDULE_BANDS.map(bd => {
    const bandSchedules = available
      .filter(pd => getScheduleBand(pd.schedule) === bd.band)
      .sort((a, b) => a.wt_mm - b.wt_mm);
    return { band: bd.band, schedule: bandSchedules[0] || null };
  });

  // Select: next-highest band whose thinnest schedule meets required thickness
  let selected: ScheduleBand = "D";
  let selectedSchedule: PipeDimension | null = null;
  for (const b of allBands) {
    if (b.schedule && b.schedule.wt_mm >= requiredThickness_mm) {
      selected = b.band;
      selectedSchedule = b.schedule;
      break;
    }
  }

  return { band: selected, schedule: selectedSchedule, allBands };
}

/** Get the representative schedule for a band at a given NPS */
export function getBandScheduleForNPS(nps: string, band: ScheduleBand): PipeDimension | null {
  const npsClean = nps.replace(/['"]/g, "").trim();
  const npsMap: Record<string, string> = {
    "1/4": "0.25", "1/2": "0.5", "3/4": "0.75", "1-1/4": "1.25", "1-1/2": "1.5", "2-1/2": "2.5", "3-1/2": "3.5",
  };
  const npsNorm = npsMap[npsClean] || npsClean;

  const available = PIPE_DIMENSIONS.filter(pd => {
    const pdNps = pd.nps.replace(/[^\d./]/g, "");
    return pdNps === npsNorm;
  });

  const bandSchedules = available
    .filter(pd => getScheduleBand(pd.schedule) === band)
    .sort((a, b) => a.wt_mm - b.wt_mm);

  return bandSchedules[0] || null;
}
