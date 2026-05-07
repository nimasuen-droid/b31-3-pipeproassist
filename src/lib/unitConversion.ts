/**
 * Centralized Unit Conversion Utility
 * Single source of truth for all unit conversions across the application.
 * All engines must use these functions — no inline conversion constants.
 */

export type UnitSystem = "SI" | "Imperial";

// ═══════════════════════════════════════════════════════════
// PRESSURE CONVERSIONS
// ═══════════════════════════════════════════════════════════
// SI base: MPa (for stress), barg (for process pressure)
// Imperial: ksi (for stress), psig (for process pressure)
// Note: barg and MPa differ by factor 10 (1 MPa = 10 bar)

/** MPa → ksi */
export const MPA_TO_KSI = 0.145038;
/** ksi → MPa */
export const KSI_TO_MPA = 6.89476;
/** bar → psi */
export const BAR_TO_PSI = 14.5038;
/** psi → bar */
export const PSI_TO_BAR = 1 / 14.5038;
/** MPa → psi */
export const MPA_TO_PSI = 145.038;
/** psi → MPa */
export const PSI_TO_MPA = 0.00689476;

/** Convert process pressure (barg ↔ psig) */
export function convertPressure(value: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return value;
  return from === "SI" ? value * BAR_TO_PSI : value * PSI_TO_BAR;
}

/** Convert stress (MPa ↔ ksi) */
export function convertStress(value: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return value;
  return from === "SI" ? value * MPA_TO_KSI : value * KSI_TO_MPA;
}

// ═══════════════════════════════════════════════════════════
// LENGTH CONVERSIONS
// ═══════════════════════════════════════════════════════════

/** mm → inches */
export const MM_TO_IN = 1 / 25.4;
/** inches → mm */
export const IN_TO_MM = 25.4;

/** Convert length (mm ↔ inches) */
export function convertLength(value: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return value;
  return from === "SI" ? value * MM_TO_IN : value * IN_TO_MM;
}

// ═══════════════════════════════════════════════════════════
// TEMPERATURE CONVERSIONS
// ═══════════════════════════════════════════════════════════

/** °C → °F */
export function celsiusToFahrenheit(c: number): number {
  return c * 9 / 5 + 32;
}

/** °F → °C */
export function fahrenheitToCelsius(f: number): number {
  return (f - 32) * 5 / 9;
}

/** Convert temperature based on unit system */
export function convertTemperature(value: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return value;
  return from === "SI" ? celsiusToFahrenheit(value) : fahrenheitToCelsius(value);
}

// ═══════════════════════════════════════════════════════════
// NORMALIZATION HELPERS
// ═══════════════════════════════════════════════════════════
// All engineering engines should normalize to SI internally.
// These helpers take a value in the user's unit system and return SI.

/** Parse a string value and normalize pressure from user units to barg (SI) */
export function normalizePressureToBar(value: string, unitSystem: UnitSystem): number {
  const n = parseFloat(value);
  if (isNaN(n)) return 0;
  return unitSystem === "SI" ? n : n * PSI_TO_BAR;
}

/** Parse a string value and normalize stress from user units to MPa (SI) */
export function normalizeStressToMPa(value: string, unitSystem: UnitSystem): number {
  const n = parseFloat(value);
  if (isNaN(n)) return 0;
  // Stress in SI is MPa, in Imperial is ksi
  return unitSystem === "SI" ? n : n * KSI_TO_MPA;
}

/** Parse a string value and normalize length from user units to mm (SI) */
export function normalizeLengthToMM(value: string, unitSystem: UnitSystem): number {
  const n = parseFloat(value);
  if (isNaN(n)) return 0;
  return unitSystem === "SI" ? n : n * IN_TO_MM;
}

/** Parse a string value and normalize temperature from user units to °C (SI) */
export function normalizeTempToC(value: string, unitSystem: UnitSystem): number {
  const n = parseFloat(value);
  if (isNaN(n)) return 0;
  return unitSystem === "SI" ? n : fahrenheitToCelsius(n);
}

// ═══════════════════════════════════════════════════════════
// DISPLAY HELPERS
// ═══════════════════════════════════════════════════════════

/** Get pressure unit label */
export function pressureUnit(unitSystem: UnitSystem): string {
  return unitSystem === "SI" ? "barg" : "psig";
}

/** Get stress unit label */
export function stressUnit(unitSystem: UnitSystem): string {
  return unitSystem === "SI" ? "MPa" : "ksi";
}

/** Get length unit label */
export function lengthUnit(unitSystem: UnitSystem): string {
  return unitSystem === "SI" ? "mm" : "in";
}

/** Get temperature unit label */
export function tempUnit(unitSystem: UnitSystem): string {
  return unitSystem === "SI" ? "°C" : "°F";
}

/** Format stress for display in user's unit system. Input is always MPa. */
export function displayStress(mpa: number, unitSystem: UnitSystem, decimals = 1): string {
  if (unitSystem === "SI") return `${mpa.toFixed(decimals)} MPa`;
  return `${(mpa * MPA_TO_KSI).toFixed(decimals)} ksi`;
}

/** Format length for display in user's unit system. Input is always mm. */
export function displayLength(mm: number, unitSystem: UnitSystem, decimals = 2): string {
  if (unitSystem === "SI") return `${mm.toFixed(decimals)} mm`;
  return `${(mm * MM_TO_IN).toFixed(decimals === 2 ? 3 : decimals)} in`;
}
