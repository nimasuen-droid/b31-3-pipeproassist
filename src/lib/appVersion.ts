// Centralized version metadata. Bump these on each release.
export const APP_VERSION = "1.0.0";
export const APP_BUILD_DATE = "2026-04-27";

// Dataset version reflects bundled engineering reference data
// (ASME B36.10M, B16.5, Sec II-D and derived tables).
export const DATASET_VERSION = "2024.1";
export const DATASET_LAST_UPDATED = "2026-04-27";

export const RELEASE_ATTESTATION_VERSION = "1.0";
export const DATASET_RELEASE_ATTESTATION_LINES = [
  "Released by PipePro B31.3 Design Assistant",
  "Dataset Integrity Verified",
  `Version ${RELEASE_ATTESTATION_VERSION}`,
] as const;
export const DATASET_RELEASE_ATTESTATION_TEXT = DATASET_RELEASE_ATTESTATION_LINES.join("\n");

export const SUPPORT_EMAIL = "nimasuen@gmail.com";
