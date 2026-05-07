import { PRODUCT_NAME, PRODUCT_OWNER } from "@/lib/brand";

// EULA metadata + acceptance storage helpers.
export const EULA_VERSION = "1.1.0";
export const EULA_EFFECTIVE_DATE = "1 May 2026";
export const EULA_LAST_UPDATED = "4 May 2026";
export const EULA_OWNER = PRODUCT_OWNER;
export const EULA_APP_NAME = PRODUCT_NAME;
export const EULA_GOVERNING_LAW = "Federal Republic of Nigeria";

const STORAGE_KEY = "eula.acceptance.v1";

export interface EulaAcceptance {
  version: string;
  acceptedAt: string; // ISO
}

export function getEulaAcceptance(): EulaAcceptance | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EulaAcceptance;
    if (parsed?.version === EULA_VERSION && parsed?.acceptedAt) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function setEulaAccepted(): EulaAcceptance {
  const record: EulaAcceptance = {
    version: EULA_VERSION,
    acceptedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore
  }
  return record;
}

export function clearEulaAcceptance() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
