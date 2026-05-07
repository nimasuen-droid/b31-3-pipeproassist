/**
 * ASME B36.10M — Welded and Seamless Wrought Steel Pipe Dimensions
 * Source: ASME B36.10M Table 1 — publicly available dimensional data
 * Reference: ferrobend.com, mpjtubing.com (publicly listed reference data)
 * 
 * Wall thickness values in mm. OD in mm.
 * NOT copyrighted table reproduction — standard dimensional data widely published.
 */

import type { PipeDimension } from "../pipeScheduleEngine";

export const B36_10M_PIPE_DATA: PipeDimension[] = [
  // NPS 1/8" (DN 6) — OD 10.3 mm
  { nps: '0.125"', od_mm: 10.3, od_in: 0.405, schedule: "10", wt_mm: 1.24, wt_in: 0.049, id_mm: 7.82, weightPerMeter: 0.28, standard: "B36.10M" },
  { nps: '0.125"', od_mm: 10.3, od_in: 0.405, schedule: "30", wt_mm: 1.45, wt_in: 0.057, id_mm: 7.40, weightPerMeter: 0.32, standard: "B36.10M" },
  { nps: '0.125"', od_mm: 10.3, od_in: 0.405, schedule: "40", wt_mm: 1.73, wt_in: 0.068, id_mm: 6.84, weightPerMeter: 0.37, standard: "B36.10M" },
  { nps: '0.125"', od_mm: 10.3, od_in: 0.405, schedule: "80", wt_mm: 2.41, wt_in: 0.095, id_mm: 5.48, weightPerMeter: 0.47, standard: "B36.10M" },

  // NPS 1/4" (DN 8) — OD 13.7 mm
  { nps: '0.25"', od_mm: 13.7, od_in: 0.540, schedule: "10", wt_mm: 1.65, wt_in: 0.065, id_mm: 10.40, weightPerMeter: 0.49, standard: "B36.10M" },
  { nps: '0.25"', od_mm: 13.7, od_in: 0.540, schedule: "30", wt_mm: 1.85, wt_in: 0.073, id_mm: 10.00, weightPerMeter: 0.54, standard: "B36.10M" },
  { nps: '0.25"', od_mm: 13.7, od_in: 0.540, schedule: "40", wt_mm: 2.24, wt_in: 0.088, id_mm: 9.22, weightPerMeter: 0.63, standard: "B36.10M" },
  { nps: '0.25"', od_mm: 13.7, od_in: 0.540, schedule: "80", wt_mm: 3.02, wt_in: 0.119, id_mm: 7.66, weightPerMeter: 0.80, standard: "B36.10M" },

  // NPS 3/8" (DN 10) — OD 17.1 mm
  { nps: '0.375"', od_mm: 17.1, od_in: 0.675, schedule: "10", wt_mm: 1.65, wt_in: 0.065, id_mm: 13.80, weightPerMeter: 0.63, standard: "B36.10M" },
  { nps: '0.375"', od_mm: 17.1, od_in: 0.675, schedule: "30", wt_mm: 1.85, wt_in: 0.073, id_mm: 13.40, weightPerMeter: 0.70, standard: "B36.10M" },
  { nps: '0.375"', od_mm: 17.1, od_in: 0.675, schedule: "40", wt_mm: 2.31, wt_in: 0.091, id_mm: 12.48, weightPerMeter: 0.84, standard: "B36.10M" },
  { nps: '0.375"', od_mm: 17.1, od_in: 0.675, schedule: "80", wt_mm: 3.20, wt_in: 0.126, id_mm: 10.70, weightPerMeter: 1.10, standard: "B36.10M" },

  // NPS 1/2" (DN 15) — OD 21.3 mm
  { nps: '0.5"', od_mm: 21.3, od_in: 0.840, schedule: "5", wt_mm: 1.65, wt_in: 0.065, id_mm: 18.00, weightPerMeter: 0.80, standard: "B36.10M" },
  { nps: '0.5"', od_mm: 21.3, od_in: 0.840, schedule: "10", wt_mm: 2.11, wt_in: 0.083, id_mm: 17.08, weightPerMeter: 1.00, standard: "B36.10M" },
  { nps: '0.5"', od_mm: 21.3, od_in: 0.840, schedule: "40", wt_mm: 2.77, wt_in: 0.109, id_mm: 15.76, weightPerMeter: 1.27, standard: "B36.10M" },
  { nps: '0.5"', od_mm: 21.3, od_in: 0.840, schedule: "80", wt_mm: 3.73, wt_in: 0.147, id_mm: 13.84, weightPerMeter: 1.62, standard: "B36.10M" },
  { nps: '0.5"', od_mm: 21.3, od_in: 0.840, schedule: "160", wt_mm: 4.78, wt_in: 0.188, id_mm: 11.74, weightPerMeter: 1.95, standard: "B36.10M" },

  // NPS 3/4" (DN 20) — OD 26.7 mm
  { nps: '0.75"', od_mm: 26.7, od_in: 1.050, schedule: "5", wt_mm: 1.65, wt_in: 0.065, id_mm: 23.40, weightPerMeter: 1.03, standard: "B36.10M" },
  { nps: '0.75"', od_mm: 26.7, od_in: 1.050, schedule: "10", wt_mm: 2.11, wt_in: 0.083, id_mm: 22.48, weightPerMeter: 1.28, standard: "B36.10M" },
  { nps: '0.75"', od_mm: 26.7, od_in: 1.050, schedule: "40", wt_mm: 2.87, wt_in: 0.113, id_mm: 20.96, weightPerMeter: 1.69, standard: "B36.10M" },
  { nps: '0.75"', od_mm: 26.7, od_in: 1.050, schedule: "80", wt_mm: 3.91, wt_in: 0.154, id_mm: 18.88, weightPerMeter: 2.20, standard: "B36.10M" },
  { nps: '0.75"', od_mm: 26.7, od_in: 1.050, schedule: "160", wt_mm: 5.56, wt_in: 0.219, id_mm: 15.58, weightPerMeter: 2.90, standard: "B36.10M" },

  // NPS 1" (DN 25) — OD 33.4 mm
  { nps: '1"', od_mm: 33.4, od_in: 1.315, schedule: "5", wt_mm: 1.65, wt_in: 0.065, id_mm: 30.10, weightPerMeter: 1.29, standard: "B36.10M" },
  { nps: '1"', od_mm: 33.4, od_in: 1.315, schedule: "10", wt_mm: 2.77, wt_in: 0.109, id_mm: 27.86, weightPerMeter: 2.09, standard: "B36.10M" },
  { nps: '1"', od_mm: 33.4, od_in: 1.315, schedule: "40", wt_mm: 3.38, wt_in: 0.133, id_mm: 26.64, weightPerMeter: 2.50, standard: "B36.10M" },
  { nps: '1"', od_mm: 33.4, od_in: 1.315, schedule: "80", wt_mm: 4.55, wt_in: 0.179, id_mm: 24.30, weightPerMeter: 3.24, standard: "B36.10M" },
  { nps: '1"', od_mm: 33.4, od_in: 1.315, schedule: "160", wt_mm: 6.35, wt_in: 0.250, id_mm: 20.70, weightPerMeter: 4.24, standard: "B36.10M" },

  // NPS 1-1/4" (DN 32) — OD 42.2 mm
  { nps: '1.25"', od_mm: 42.2, od_in: 1.660, schedule: "5", wt_mm: 1.65, wt_in: 0.065, id_mm: 38.90, weightPerMeter: 1.65, standard: "B36.10M" },
  { nps: '1.25"', od_mm: 42.2, od_in: 1.660, schedule: "10", wt_mm: 2.77, wt_in: 0.109, id_mm: 36.66, weightPerMeter: 2.69, standard: "B36.10M" },
  { nps: '1.25"', od_mm: 42.2, od_in: 1.660, schedule: "40", wt_mm: 3.56, wt_in: 0.140, id_mm: 35.08, weightPerMeter: 3.39, standard: "B36.10M" },
  { nps: '1.25"', od_mm: 42.2, od_in: 1.660, schedule: "80", wt_mm: 4.85, wt_in: 0.191, id_mm: 32.50, weightPerMeter: 4.47, standard: "B36.10M" },
  { nps: '1.25"', od_mm: 42.2, od_in: 1.660, schedule: "160", wt_mm: 6.35, wt_in: 0.250, id_mm: 29.50, weightPerMeter: 5.61, standard: "B36.10M" },

  // NPS 1-1/2" (DN 40) — OD 48.3 mm
  { nps: '1.5"', od_mm: 48.3, od_in: 1.900, schedule: "5", wt_mm: 1.65, wt_in: 0.065, id_mm: 45.00, weightPerMeter: 1.90, standard: "B36.10M" },
  { nps: '1.5"', od_mm: 48.3, od_in: 1.900, schedule: "10", wt_mm: 2.77, wt_in: 0.109, id_mm: 42.76, weightPerMeter: 3.11, standard: "B36.10M" },
  { nps: '1.5"', od_mm: 48.3, od_in: 1.900, schedule: "40", wt_mm: 3.68, wt_in: 0.145, id_mm: 40.94, weightPerMeter: 4.05, standard: "B36.10M" },
  { nps: '1.5"', od_mm: 48.3, od_in: 1.900, schedule: "80", wt_mm: 5.08, wt_in: 0.200, id_mm: 38.14, weightPerMeter: 5.41, standard: "B36.10M" },
  { nps: '1.5"', od_mm: 48.3, od_in: 1.900, schedule: "160", wt_mm: 7.14, wt_in: 0.281, id_mm: 34.02, weightPerMeter: 7.25, standard: "B36.10M" },

  // NPS 2" (DN 50) — OD 60.3 mm
  { nps: '2"', od_mm: 60.3, od_in: 2.375, schedule: "5", wt_mm: 1.65, wt_in: 0.065, id_mm: 57.00, weightPerMeter: 2.39, standard: "B36.10M" },
  { nps: '2"', od_mm: 60.3, od_in: 2.375, schedule: "10", wt_mm: 2.77, wt_in: 0.109, id_mm: 54.76, weightPerMeter: 3.93, standard: "B36.10M" },
  { nps: '2"', od_mm: 60.3, od_in: 2.375, schedule: "40", wt_mm: 3.91, wt_in: 0.154, id_mm: 52.48, weightPerMeter: 5.44, standard: "B36.10M" },
  { nps: '2"', od_mm: 60.3, od_in: 2.375, schedule: "80", wt_mm: 5.54, wt_in: 0.218, id_mm: 49.22, weightPerMeter: 7.48, standard: "B36.10M" },
  { nps: '2"', od_mm: 60.3, od_in: 2.375, schedule: "160", wt_mm: 8.74, wt_in: 0.344, id_mm: 42.82, weightPerMeter: 11.11, standard: "B36.10M" },

  // NPS 2-1/2" (DN 65) — OD 73.0 mm
  { nps: '2.5"', od_mm: 73.0, od_in: 2.875, schedule: "5", wt_mm: 2.11, wt_in: 0.083, id_mm: 68.78, weightPerMeter: 3.69, standard: "B36.10M" },
  { nps: '2.5"', od_mm: 73.0, od_in: 2.875, schedule: "10", wt_mm: 3.05, wt_in: 0.120, id_mm: 66.90, weightPerMeter: 5.26, standard: "B36.10M" },
  { nps: '2.5"', od_mm: 73.0, od_in: 2.875, schedule: "40", wt_mm: 5.16, wt_in: 0.203, id_mm: 62.68, weightPerMeter: 8.63, standard: "B36.10M" },
  { nps: '2.5"', od_mm: 73.0, od_in: 2.875, schedule: "80", wt_mm: 7.01, wt_in: 0.276, id_mm: 58.98, weightPerMeter: 11.41, standard: "B36.10M" },
  { nps: '2.5"', od_mm: 73.0, od_in: 2.875, schedule: "160", wt_mm: 9.53, wt_in: 0.375, id_mm: 53.94, weightPerMeter: 14.92, standard: "B36.10M" },

  // NPS 3" (DN 80) — OD 88.9 mm
  { nps: '3"', od_mm: 88.9, od_in: 3.500, schedule: "5", wt_mm: 2.11, wt_in: 0.083, id_mm: 84.68, weightPerMeter: 4.52, standard: "B36.10M" },
  { nps: '3"', od_mm: 88.9, od_in: 3.500, schedule: "10", wt_mm: 3.05, wt_in: 0.120, id_mm: 82.80, weightPerMeter: 6.46, standard: "B36.10M" },
  { nps: '3"', od_mm: 88.9, od_in: 3.500, schedule: "40", wt_mm: 5.49, wt_in: 0.216, id_mm: 77.92, weightPerMeter: 11.29, standard: "B36.10M" },
  { nps: '3"', od_mm: 88.9, od_in: 3.500, schedule: "80", wt_mm: 7.62, wt_in: 0.300, id_mm: 73.66, weightPerMeter: 15.27, standard: "B36.10M" },
  { nps: '3"', od_mm: 88.9, od_in: 3.500, schedule: "160", wt_mm: 11.13, wt_in: 0.438, id_mm: 66.64, weightPerMeter: 21.35, standard: "B36.10M" },

  // NPS 3-1/2" (DN 90) — OD 101.6 mm
  { nps: '3.5"', od_mm: 101.6, od_in: 4.000, schedule: "5", wt_mm: 2.11, wt_in: 0.083, id_mm: 97.38, weightPerMeter: 5.18, standard: "B36.10M" },
  { nps: '3.5"', od_mm: 101.6, od_in: 4.000, schedule: "10", wt_mm: 3.05, wt_in: 0.120, id_mm: 95.50, weightPerMeter: 7.41, standard: "B36.10M" },
  { nps: '3.5"', od_mm: 101.6, od_in: 4.000, schedule: "40", wt_mm: 5.74, wt_in: 0.226, id_mm: 90.12, weightPerMeter: 13.57, standard: "B36.10M" },
  { nps: '3.5"', od_mm: 101.6, od_in: 4.000, schedule: "80", wt_mm: 8.08, wt_in: 0.318, id_mm: 85.44, weightPerMeter: 18.64, standard: "B36.10M" },

  // NPS 4" (DN 100) — OD 114.3 mm
  { nps: '4"', od_mm: 114.3, od_in: 4.500, schedule: "5", wt_mm: 2.11, wt_in: 0.083, id_mm: 110.08, weightPerMeter: 5.84, standard: "B36.10M" },
  { nps: '4"', od_mm: 114.3, od_in: 4.500, schedule: "10", wt_mm: 3.05, wt_in: 0.120, id_mm: 108.20, weightPerMeter: 8.37, standard: "B36.10M" },
  { nps: '4"', od_mm: 114.3, od_in: 4.500, schedule: "40", wt_mm: 6.02, wt_in: 0.237, id_mm: 102.26, weightPerMeter: 16.08, standard: "B36.10M" },
  { nps: '4"', od_mm: 114.3, od_in: 4.500, schedule: "80", wt_mm: 8.56, wt_in: 0.337, id_mm: 97.18, weightPerMeter: 22.32, standard: "B36.10M" },
  { nps: '4"', od_mm: 114.3, od_in: 4.500, schedule: "120", wt_mm: 11.13, wt_in: 0.438, id_mm: 92.04, weightPerMeter: 28.32, standard: "B36.10M" },
  { nps: '4"', od_mm: 114.3, od_in: 4.500, schedule: "160", wt_mm: 13.49, wt_in: 0.531, id_mm: 87.32, weightPerMeter: 33.54, standard: "B36.10M" },

  // NPS 5" (DN 125) — OD 141.3 mm
  { nps: '5"', od_mm: 141.3, od_in: 5.563, schedule: "5", wt_mm: 2.77, wt_in: 0.109, id_mm: 135.76, weightPerMeter: 9.46, standard: "B36.10M" },
  { nps: '5"', od_mm: 141.3, od_in: 5.563, schedule: "10", wt_mm: 3.40, wt_in: 0.134, id_mm: 134.50, weightPerMeter: 11.56, standard: "B36.10M" },
  { nps: '5"', od_mm: 141.3, od_in: 5.563, schedule: "40", wt_mm: 6.55, wt_in: 0.258, id_mm: 128.20, weightPerMeter: 21.77, standard: "B36.10M" },
  { nps: '5"', od_mm: 141.3, od_in: 5.563, schedule: "80", wt_mm: 9.53, wt_in: 0.375, id_mm: 122.24, weightPerMeter: 30.97, standard: "B36.10M" },
  { nps: '5"', od_mm: 141.3, od_in: 5.563, schedule: "120", wt_mm: 12.70, wt_in: 0.500, id_mm: 115.90, weightPerMeter: 40.28, standard: "B36.10M" },
  { nps: '5"', od_mm: 141.3, od_in: 5.563, schedule: "160", wt_mm: 15.88, wt_in: 0.625, id_mm: 109.54, weightPerMeter: 49.12, standard: "B36.10M" },

  // NPS 6" (DN 150) — OD 168.3 mm
  { nps: '6"', od_mm: 168.3, od_in: 6.625, schedule: "5", wt_mm: 2.77, wt_in: 0.109, id_mm: 162.76, weightPerMeter: 11.31, standard: "B36.10M" },
  { nps: '6"', od_mm: 168.3, od_in: 6.625, schedule: "10", wt_mm: 3.40, wt_in: 0.134, id_mm: 161.50, weightPerMeter: 13.83, standard: "B36.10M" },
  { nps: '6"', od_mm: 168.3, od_in: 6.625, schedule: "40", wt_mm: 7.11, wt_in: 0.280, id_mm: 154.08, weightPerMeter: 28.26, standard: "B36.10M" },
  { nps: '6"', od_mm: 168.3, od_in: 6.625, schedule: "80", wt_mm: 10.97, wt_in: 0.432, id_mm: 146.36, weightPerMeter: 42.56, standard: "B36.10M" },
  { nps: '6"', od_mm: 168.3, od_in: 6.625, schedule: "120", wt_mm: 14.27, wt_in: 0.562, id_mm: 139.76, weightPerMeter: 54.21, standard: "B36.10M" },
  { nps: '6"', od_mm: 168.3, od_in: 6.625, schedule: "160", wt_mm: 18.26, wt_in: 0.719, id_mm: 131.78, weightPerMeter: 67.57, standard: "B36.10M" },

  // NPS 8" (DN 200) — OD 219.1 mm
  { nps: '8"', od_mm: 219.1, od_in: 8.625, schedule: "5", wt_mm: 2.77, wt_in: 0.109, id_mm: 213.56, weightPerMeter: 14.78, standard: "B36.10M" },
  { nps: '8"', od_mm: 219.1, od_in: 8.625, schedule: "10", wt_mm: 3.76, wt_in: 0.148, id_mm: 211.58, weightPerMeter: 19.97, standard: "B36.10M" },
  { nps: '8"', od_mm: 219.1, od_in: 8.625, schedule: "20", wt_mm: 6.35, wt_in: 0.250, id_mm: 206.40, weightPerMeter: 33.32, standard: "B36.10M" },
  { nps: '8"', od_mm: 219.1, od_in: 8.625, schedule: "30", wt_mm: 7.04, wt_in: 0.277, id_mm: 205.02, weightPerMeter: 36.82, standard: "B36.10M" },
  { nps: '8"', od_mm: 219.1, od_in: 8.625, schedule: "40", wt_mm: 8.18, wt_in: 0.322, id_mm: 202.74, weightPerMeter: 42.55, standard: "B36.10M" },
  { nps: '8"', od_mm: 219.1, od_in: 8.625, schedule: "60", wt_mm: 10.31, wt_in: 0.406, id_mm: 198.48, weightPerMeter: 53.09, standard: "B36.10M" },
  { nps: '8"', od_mm: 219.1, od_in: 8.625, schedule: "80", wt_mm: 12.70, wt_in: 0.500, id_mm: 193.70, weightPerMeter: 64.64, standard: "B36.10M" },
  { nps: '8"', od_mm: 219.1, od_in: 8.625, schedule: "100", wt_mm: 15.09, wt_in: 0.594, id_mm: 188.92, weightPerMeter: 75.92, standard: "B36.10M" },
  { nps: '8"', od_mm: 219.1, od_in: 8.625, schedule: "120", wt_mm: 18.26, wt_in: 0.719, id_mm: 182.58, weightPerMeter: 90.44, standard: "B36.10M" },
  { nps: '8"', od_mm: 219.1, od_in: 8.625, schedule: "140", wt_mm: 20.62, wt_in: 0.812, id_mm: 177.86, weightPerMeter: 100.93, standard: "B36.10M" },
  { nps: '8"', od_mm: 219.1, od_in: 8.625, schedule: "160", wt_mm: 23.01, wt_in: 0.906, id_mm: 173.08, weightPerMeter: 111.27, standard: "B36.10M" },

  // NPS 10" (DN 250) — OD 273.0 mm
  { nps: '10"', od_mm: 273.0, od_in: 10.750, schedule: "5", wt_mm: 3.40, wt_in: 0.134, id_mm: 266.20, weightPerMeter: 22.61, standard: "B36.10M" },
  { nps: '10"', od_mm: 273.0, od_in: 10.750, schedule: "10", wt_mm: 4.19, wt_in: 0.165, id_mm: 264.62, weightPerMeter: 27.78, standard: "B36.10M" },
  { nps: '10"', od_mm: 273.0, od_in: 10.750, schedule: "20", wt_mm: 6.35, wt_in: 0.250, id_mm: 260.30, weightPerMeter: 41.76, standard: "B36.10M" },
  { nps: '10"', od_mm: 273.0, od_in: 10.750, schedule: "30", wt_mm: 7.80, wt_in: 0.307, id_mm: 257.40, weightPerMeter: 51.01, standard: "B36.10M" },
  { nps: '10"', od_mm: 273.0, od_in: 10.750, schedule: "40", wt_mm: 9.27, wt_in: 0.365, id_mm: 254.46, weightPerMeter: 60.29, standard: "B36.10M" },
  { nps: '10"', od_mm: 273.0, od_in: 10.750, schedule: "60", wt_mm: 12.70, wt_in: 0.500, id_mm: 247.60, weightPerMeter: 81.53, standard: "B36.10M" },
  { nps: '10"', od_mm: 273.0, od_in: 10.750, schedule: "80", wt_mm: 15.09, wt_in: 0.594, id_mm: 242.82, weightPerMeter: 95.98, standard: "B36.10M" },
  { nps: '10"', od_mm: 273.0, od_in: 10.750, schedule: "100", wt_mm: 18.26, wt_in: 0.719, id_mm: 236.48, weightPerMeter: 114.71, standard: "B36.10M" },
  { nps: '10"', od_mm: 273.0, od_in: 10.750, schedule: "120", wt_mm: 21.44, wt_in: 0.844, id_mm: 230.12, weightPerMeter: 133.01, standard: "B36.10M" },
  { nps: '10"', od_mm: 273.0, od_in: 10.750, schedule: "140", wt_mm: 25.40, wt_in: 1.000, id_mm: 222.20, weightPerMeter: 155.10, standard: "B36.10M" },
  { nps: '10"', od_mm: 273.0, od_in: 10.750, schedule: "160", wt_mm: 28.58, wt_in: 1.125, id_mm: 215.84, weightPerMeter: 172.27, standard: "B36.10M" },

  // NPS 12" (DN 300) — OD 323.8 mm
  { nps: '12"', od_mm: 323.8, od_in: 12.750, schedule: "5", wt_mm: 3.96, wt_in: 0.156, id_mm: 315.88, weightPerMeter: 31.24, standard: "B36.10M" },
  { nps: '12"', od_mm: 323.8, od_in: 12.750, schedule: "10", wt_mm: 4.57, wt_in: 0.180, id_mm: 314.66, weightPerMeter: 35.98, standard: "B36.10M" },
  { nps: '12"', od_mm: 323.8, od_in: 12.750, schedule: "20", wt_mm: 6.35, wt_in: 0.250, id_mm: 311.10, weightPerMeter: 49.71, standard: "B36.10M" },
  { nps: '12"', od_mm: 323.8, od_in: 12.750, schedule: "30", wt_mm: 8.38, wt_in: 0.330, id_mm: 307.04, weightPerMeter: 65.19, standard: "B36.10M" },
  { nps: '12"', od_mm: 323.8, od_in: 12.750, schedule: "40", wt_mm: 10.31, wt_in: 0.406, id_mm: 303.18, weightPerMeter: 79.71, standard: "B36.10M" },
  { nps: '12"', od_mm: 323.8, od_in: 12.750, schedule: "60", wt_mm: 14.27, wt_in: 0.562, id_mm: 295.26, weightPerMeter: 108.93, standard: "B36.10M" },
  { nps: '12"', od_mm: 323.8, od_in: 12.750, schedule: "80", wt_mm: 17.48, wt_in: 0.688, id_mm: 288.84, weightPerMeter: 132.05, standard: "B36.10M" },
  { nps: '12"', od_mm: 323.8, od_in: 12.750, schedule: "100", wt_mm: 21.44, wt_in: 0.844, id_mm: 280.92, weightPerMeter: 159.87, standard: "B36.10M" },
  { nps: '12"', od_mm: 323.8, od_in: 12.750, schedule: "120", wt_mm: 25.40, wt_in: 1.000, id_mm: 273.00, weightPerMeter: 186.92, standard: "B36.10M" },
  { nps: '12"', od_mm: 323.8, od_in: 12.750, schedule: "140", wt_mm: 28.58, wt_in: 1.125, id_mm: 266.64, weightPerMeter: 208.08, standard: "B36.10M" },
  { nps: '12"', od_mm: 323.8, od_in: 12.750, schedule: "160", wt_mm: 33.32, wt_in: 1.312, id_mm: 257.16, weightPerMeter: 238.69, standard: "B36.10M" },

  // NPS 14" (DN 350) — OD 355.6 mm
  { nps: '14"', od_mm: 355.6, od_in: 14.000, schedule: "5", wt_mm: 3.96, wt_in: 0.156, id_mm: 347.68, weightPerMeter: 34.34, standard: "B36.10M" },
  { nps: '14"', od_mm: 355.6, od_in: 14.000, schedule: "10", wt_mm: 6.35, wt_in: 0.250, id_mm: 342.90, weightPerMeter: 54.69, standard: "B36.10M" },
  { nps: '14"', od_mm: 355.6, od_in: 14.000, schedule: "20", wt_mm: 7.92, wt_in: 0.312, id_mm: 339.76, weightPerMeter: 67.91, standard: "B36.10M" },
  { nps: '14"', od_mm: 355.6, od_in: 14.000, schedule: "30", wt_mm: 9.53, wt_in: 0.375, id_mm: 336.54, weightPerMeter: 81.33, standard: "B36.10M" },
  { nps: '14"', od_mm: 355.6, od_in: 14.000, schedule: "40", wt_mm: 11.13, wt_in: 0.438, id_mm: 333.34, weightPerMeter: 94.55, standard: "B36.10M" },
  { nps: '14"', od_mm: 355.6, od_in: 14.000, schedule: "60", wt_mm: 15.09, wt_in: 0.594, id_mm: 325.42, weightPerMeter: 126.72, standard: "B36.10M" },
  { nps: '14"', od_mm: 355.6, od_in: 14.000, schedule: "80", wt_mm: 19.05, wt_in: 0.750, id_mm: 317.50, weightPerMeter: 158.11, standard: "B36.10M" },
  { nps: '14"', od_mm: 355.6, od_in: 14.000, schedule: "100", wt_mm: 23.83, wt_in: 0.938, id_mm: 307.94, weightPerMeter: 194.98, standard: "B36.10M" },
  { nps: '14"', od_mm: 355.6, od_in: 14.000, schedule: "120", wt_mm: 27.79, wt_in: 1.094, id_mm: 300.02, weightPerMeter: 224.66, standard: "B36.10M" },
  { nps: '14"', od_mm: 355.6, od_in: 14.000, schedule: "140", wt_mm: 31.75, wt_in: 1.250, id_mm: 292.10, weightPerMeter: 253.58, standard: "B36.10M" },
  { nps: '14"', od_mm: 355.6, od_in: 14.000, schedule: "160", wt_mm: 35.71, wt_in: 1.406, id_mm: 284.18, weightPerMeter: 281.72, standard: "B36.10M" },

  // NPS 16" (DN 400) — OD 406.4 mm
  { nps: '16"', od_mm: 406.4, od_in: 16.000, schedule: "5", wt_mm: 4.19, wt_in: 0.165, id_mm: 398.02, weightPerMeter: 41.56, standard: "B36.10M" },
  { nps: '16"', od_mm: 406.4, od_in: 16.000, schedule: "10", wt_mm: 6.35, wt_in: 0.250, id_mm: 393.70, weightPerMeter: 62.65, standard: "B36.10M" },
  { nps: '16"', od_mm: 406.4, od_in: 16.000, schedule: "20", wt_mm: 7.92, wt_in: 0.312, id_mm: 390.56, weightPerMeter: 77.83, standard: "B36.10M" },
  { nps: '16"', od_mm: 406.4, od_in: 16.000, schedule: "30", wt_mm: 9.53, wt_in: 0.375, id_mm: 387.34, weightPerMeter: 93.27, standard: "B36.10M" },
  { nps: '16"', od_mm: 406.4, od_in: 16.000, schedule: "40", wt_mm: 12.70, wt_in: 0.500, id_mm: 381.00, weightPerMeter: 123.31, standard: "B36.10M" },
  { nps: '16"', od_mm: 406.4, od_in: 16.000, schedule: "60", wt_mm: 16.66, wt_in: 0.656, id_mm: 373.08, weightPerMeter: 160.13, standard: "B36.10M" },
  { nps: '16"', od_mm: 406.4, od_in: 16.000, schedule: "80", wt_mm: 21.44, wt_in: 0.844, id_mm: 363.52, weightPerMeter: 203.54, standard: "B36.10M" },
  { nps: '16"', od_mm: 406.4, od_in: 16.000, schedule: "100", wt_mm: 26.19, wt_in: 1.031, id_mm: 354.02, weightPerMeter: 245.57, standard: "B36.10M" },
  { nps: '16"', od_mm: 406.4, od_in: 16.000, schedule: "120", wt_mm: 30.96, wt_in: 1.219, id_mm: 344.48, weightPerMeter: 286.66, standard: "B36.10M" },
  { nps: '16"', od_mm: 406.4, od_in: 16.000, schedule: "140", wt_mm: 36.53, wt_in: 1.438, id_mm: 333.34, weightPerMeter: 333.21, standard: "B36.10M" },
  { nps: '16"', od_mm: 406.4, od_in: 16.000, schedule: "160", wt_mm: 40.49, wt_in: 1.594, id_mm: 325.42, weightPerMeter: 365.38, standard: "B36.10M" },

  // NPS 18" (DN 450) — OD 457 mm
  { nps: '18"', od_mm: 457.0, od_in: 18.000, schedule: "5", wt_mm: 4.19, wt_in: 0.165, id_mm: 448.62, weightPerMeter: 46.79, standard: "B36.10M" },
  { nps: '18"', od_mm: 457.0, od_in: 18.000, schedule: "10", wt_mm: 6.35, wt_in: 0.250, id_mm: 444.30, weightPerMeter: 70.57, standard: "B36.10M" },
  { nps: '18"', od_mm: 457.0, od_in: 18.000, schedule: "20", wt_mm: 7.92, wt_in: 0.312, id_mm: 441.16, weightPerMeter: 87.71, standard: "B36.10M" },
  { nps: '18"', od_mm: 457.0, od_in: 18.000, schedule: "30", wt_mm: 11.13, wt_in: 0.438, id_mm: 434.74, weightPerMeter: 122.38, standard: "B36.10M" },
  { nps: '18"', od_mm: 457.0, od_in: 18.000, schedule: "40", wt_mm: 14.27, wt_in: 0.562, id_mm: 428.46, weightPerMeter: 155.81, standard: "B36.10M" },
  { nps: '18"', od_mm: 457.0, od_in: 18.000, schedule: "60", wt_mm: 19.05, wt_in: 0.750, id_mm: 418.90, weightPerMeter: 205.75, standard: "B36.10M" },
  { nps: '18"', od_mm: 457.0, od_in: 18.000, schedule: "80", wt_mm: 23.83, wt_in: 0.938, id_mm: 409.34, weightPerMeter: 254.57, standard: "B36.10M" },
  { nps: '18"', od_mm: 457.0, od_in: 18.000, schedule: "100", wt_mm: 29.36, wt_in: 1.156, id_mm: 398.28, weightPerMeter: 309.64, standard: "B36.10M" },
  { nps: '18"', od_mm: 457.0, od_in: 18.000, schedule: "120", wt_mm: 34.93, wt_in: 1.375, id_mm: 387.14, weightPerMeter: 363.60, standard: "B36.10M" },
  { nps: '18"', od_mm: 457.0, od_in: 18.000, schedule: "140", wt_mm: 39.67, wt_in: 1.562, id_mm: 377.66, weightPerMeter: 408.26, standard: "B36.10M" },
  { nps: '18"', od_mm: 457.0, od_in: 18.000, schedule: "160", wt_mm: 45.24, wt_in: 1.781, id_mm: 366.52, weightPerMeter: 459.30, standard: "B36.10M" },

  // NPS 20" (DN 500) — OD 508 mm
  { nps: '20"', od_mm: 508.0, od_in: 20.000, schedule: "5", wt_mm: 4.78, wt_in: 0.188, id_mm: 498.44, weightPerMeter: 59.29, standard: "B36.10M" },
  { nps: '20"', od_mm: 508.0, od_in: 20.000, schedule: "10", wt_mm: 5.54, wt_in: 0.218, id_mm: 496.92, weightPerMeter: 68.64, standard: "B36.10M" },
  { nps: '20"', od_mm: 508.0, od_in: 20.000, schedule: "20", wt_mm: 9.53, wt_in: 0.375, id_mm: 488.94, weightPerMeter: 117.15, standard: "B36.10M" },
  { nps: '20"', od_mm: 508.0, od_in: 20.000, schedule: "30", wt_mm: 12.70, wt_in: 0.500, id_mm: 482.60, weightPerMeter: 155.12, standard: "B36.10M" },
  { nps: '20"', od_mm: 508.0, od_in: 20.000, schedule: "40", wt_mm: 15.09, wt_in: 0.594, id_mm: 477.82, weightPerMeter: 183.42, standard: "B36.10M" },
  { nps: '20"', od_mm: 508.0, od_in: 20.000, schedule: "60", wt_mm: 20.62, wt_in: 0.812, id_mm: 466.76, weightPerMeter: 247.83, standard: "B36.10M" },
  { nps: '20"', od_mm: 508.0, od_in: 20.000, schedule: "80", wt_mm: 26.19, wt_in: 1.031, id_mm: 455.62, weightPerMeter: 311.17, standard: "B36.10M" },
  { nps: '20"', od_mm: 508.0, od_in: 20.000, schedule: "100", wt_mm: 32.54, wt_in: 1.281, id_mm: 442.92, weightPerMeter: 381.53, standard: "B36.10M" },
  { nps: '20"', od_mm: 508.0, od_in: 20.000, schedule: "120", wt_mm: 38.10, wt_in: 1.500, id_mm: 431.80, weightPerMeter: 441.49, standard: "B36.10M" },
  { nps: '20"', od_mm: 508.0, od_in: 20.000, schedule: "140", wt_mm: 44.45, wt_in: 1.750, id_mm: 419.10, weightPerMeter: 508.11, standard: "B36.10M" },
  { nps: '20"', od_mm: 508.0, od_in: 20.000, schedule: "160", wt_mm: 50.01, wt_in: 1.969, id_mm: 407.98, weightPerMeter: 564.81, standard: "B36.10M" },

  // NPS 24" (DN 600) — OD 609.6 mm
  { nps: '24"', od_mm: 609.6, od_in: 24.000, schedule: "5", wt_mm: 5.54, wt_in: 0.218, id_mm: 598.52, weightPerMeter: 82.46, standard: "B36.10M" },
  { nps: '24"', od_mm: 609.6, od_in: 24.000, schedule: "10", wt_mm: 6.35, wt_in: 0.250, id_mm: 596.90, weightPerMeter: 94.53, standard: "B36.10M" },
  { nps: '24"', od_mm: 609.6, od_in: 24.000, schedule: "20", wt_mm: 9.53, wt_in: 0.375, id_mm: 590.54, weightPerMeter: 141.12, standard: "B36.10M" },
  { nps: '24"', od_mm: 609.6, od_in: 24.000, schedule: "30", wt_mm: 14.27, wt_in: 0.562, id_mm: 581.06, weightPerMeter: 209.64, standard: "B36.10M" },
  { nps: '24"', od_mm: 609.6, od_in: 24.000, schedule: "40", wt_mm: 17.48, wt_in: 0.688, id_mm: 574.64, weightPerMeter: 255.41, standard: "B36.10M" },
  { nps: '24"', od_mm: 609.6, od_in: 24.000, schedule: "60", wt_mm: 24.61, wt_in: 0.969, id_mm: 560.38, weightPerMeter: 355.26, standard: "B36.10M" },
  { nps: '24"', od_mm: 609.6, od_in: 24.000, schedule: "80", wt_mm: 30.96, wt_in: 1.219, id_mm: 547.68, weightPerMeter: 441.49, standard: "B36.10M" },
  { nps: '24"', od_mm: 609.6, od_in: 24.000, schedule: "100", wt_mm: 38.89, wt_in: 1.531, id_mm: 531.82, weightPerMeter: 547.45, standard: "B36.10M" },
  { nps: '24"', od_mm: 609.6, od_in: 24.000, schedule: "120", wt_mm: 46.02, wt_in: 1.812, id_mm: 517.56, weightPerMeter: 639.73, standard: "B36.10M" },
  { nps: '24"', od_mm: 609.6, od_in: 24.000, schedule: "140", wt_mm: 52.37, wt_in: 2.062, id_mm: 504.86, weightPerMeter: 720.15, standard: "B36.10M" },
  { nps: '24"', od_mm: 609.6, od_in: 24.000, schedule: "160", wt_mm: 59.54, wt_in: 2.344, id_mm: 490.52, weightPerMeter: 808.19, standard: "B36.10M" },
];

export const B36_10M_SOURCE = {
  id: "std_b3610",
  standard: "ASME B36.10M",
  title: "Welded and Seamless Wrought Steel Pipe",
  tableRef: "Table 1",
  dataSource: "Publicly available dimensional data (ferrobend.com, mpjtubing.com)",
  rowCount: B36_10M_PIPE_DATA.length,
};
