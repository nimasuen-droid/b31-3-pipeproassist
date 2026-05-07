import { normalizeNpsForPicker } from "@/lib/nps";

export interface BoltAssembly {
  boltSize: string;
  boltCount: number;
  boltLength: string;
  nutType: string;
  source: string;
}

// B16.5 Appendix E excerpt loaded in the app. Keep this exported and tested so
// unsupported class/size pairs fail visibly instead of inventing bolt data.
export const B16_5_BOLT_DATA: Record<string, Record<string, BoltAssembly>> = {
  "150": {
    "2": { boltSize: '5/8"', boltCount: 4, boltLength: '3.5"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "3": { boltSize: '5/8"', boltCount: 4, boltLength: '3.75"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "4": { boltSize: '5/8"', boltCount: 8, boltLength: '4"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "6": { boltSize: '3/4"', boltCount: 8, boltLength: '4.25"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "8": { boltSize: '3/4"', boltCount: 8, boltLength: '4.75"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "10": { boltSize: '7/8"', boltCount: 12, boltLength: '5.25"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "12": { boltSize: '7/8"', boltCount: 12, boltLength: '5.5"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
  },
  "300": {
    "2": { boltSize: '5/8"', boltCount: 8, boltLength: '4.25"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "3": { boltSize: '3/4"', boltCount: 8, boltLength: '4.75"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "4": { boltSize: '3/4"', boltCount: 8, boltLength: '5.25"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "6": { boltSize: '3/4"', boltCount: 12, boltLength: '5.5"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "8": { boltSize: '7/8"', boltCount: 12, boltLength: '6.25"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "10": { boltSize: '1"', boltCount: 16, boltLength: '6.75"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "12": { boltSize: '1 1/8"', boltCount: 16, boltLength: '7.25"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
  },
  "600": {
    "2": { boltSize: '3/4"', boltCount: 8, boltLength: '5"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "3": { boltSize: '3/4"', boltCount: 8, boltLength: '5.5"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "4": { boltSize: '7/8"', boltCount: 8, boltLength: '6"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "6": { boltSize: '1"', boltCount: 12, boltLength: '6.75"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "8": { boltSize: '1 1/8"', boltCount: 12, boltLength: '7.5"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "10": { boltSize: '1 1/4"', boltCount: 16, boltLength: '8.25"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
    "12": { boltSize: '1 3/8"', boltCount: 20, boltLength: '8.75"', nutType: "Heavy Hex", source: "ASME B16.5 Table E-1" },
  },
};

export function getBoltAssembly(flangeClass: string | undefined | null, nps: string | undefined | null): BoltAssembly | null {
  const classKey = String(flangeClass ?? "").replace(/[^\d]/g, "");
  const npsKey = normalizeNpsForPicker(nps);
  return B16_5_BOLT_DATA[classKey]?.[npsKey] ?? null;
}
