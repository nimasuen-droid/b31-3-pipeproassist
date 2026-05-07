/**
 * ASME B16.5 — Flange Pressure-Temperature Rating Data
 * Source: ASME B16.5 Table 2-1.1 (Group 1.1 Carbon Steel) and multi-group data
 * Reference: engineeringtoolbox.com, stewarts-group.com (publicly available reference data)
 * 
 * Pressures in bar, temperatures in °C.
 * NOT copyrighted table reproduction — P-T ratings are widely published reference data.
 */

export interface FlangePTRating {
  materialGroup: string;
  materialDescription: string;
  applicableMaterials: string[];
  class: number;
  ratings: { tempC: number; pressureBar: number }[];
}

// ──── Group 1.1: Carbon Steel (A105, A350 LF2, A216 WCB) ────────
const GROUP_1_1_TEMPS = [-29, 38, 50, 100, 150, 200, 250, 300, 325, 350, 375, 400, 425, 450, 475, 500, 538];

const G11_150 = [19.6, 19.6, 19.2, 17.7, 15.8, 13.8, 12.1, 10.2, 9.3, 8.4, 7.4, 6.5, 5.5, 4.6, 3.7, 2.8, 1.4];
const G11_300 = [51.1, 51.1, 50.1, 46.6, 45.1, 43.8, 41.9, 39.8, 38.7, 37.6, 36.4, 34.7, 28.8, 23.0, 17.4, 11.8, 5.9];
const G11_400 = [68.1, 68.1, 66.8, 62.1, 60.1, 58.4, 55.9, 53.1, 51.6, 50.1, 48.5, 46.3, 38.4, 30.7, 23.2, 15.7, 7.9];
const G11_600 = [102.1, 102.1, 100.2, 93.2, 90.2, 87.6, 83.9, 79.6, 77.4, 75.1, 72.7, 69.4, 57.5, 46.0, 34.9, 23.5, 11.8];
const G11_900 = [153.2, 153.2, 150.4, 139.8, 135.2, 131.4, 125.8, 119.5, 116.1, 112.7, 109.1, 104.2, 86.3, 69.0, 52.3, 35.3, 17.7];
const G11_1500 = [255.3, 255.3, 250.6, 233.0, 225.4, 219.0, 209.7, 199.1, 193.6, 187.8, 181.8, 173.6, 143.8, 115.0, 87.2, 58.8, 29.5];
const G11_2500 = [425.5, 425.5, 417.7, 388.3, 375.6, 365.0, 349.5, 331.8, 322.6, 313.0, 303.1, 289.3, 239.7, 191.7, 145.3, 97.9, 49.2];

function buildRatings(temps: number[], pressures: number[]): { tempC: number; pressureBar: number }[] {
  return temps.map((t, i) => ({ tempC: t, pressureBar: pressures[i] }));
}

export const B16_5_GROUP_1_1: FlangePTRating[] = [
  { materialGroup: "1.1", materialDescription: "Carbon Steel", applicableMaterials: ["A105", "A350 LF2", "A350 LF6 Cl.1", "A216 WCB", "A515 Gr.70", "A516 Gr.70"], class: 150, ratings: buildRatings(GROUP_1_1_TEMPS, G11_150) },
  { materialGroup: "1.1", materialDescription: "Carbon Steel", applicableMaterials: ["A105", "A350 LF2", "A350 LF6 Cl.1", "A216 WCB", "A515 Gr.70", "A516 Gr.70"], class: 300, ratings: buildRatings(GROUP_1_1_TEMPS, G11_300) },
  { materialGroup: "1.1", materialDescription: "Carbon Steel", applicableMaterials: ["A105", "A350 LF2", "A350 LF6 Cl.1", "A216 WCB", "A515 Gr.70", "A516 Gr.70"], class: 400, ratings: buildRatings(GROUP_1_1_TEMPS, G11_400) },
  { materialGroup: "1.1", materialDescription: "Carbon Steel", applicableMaterials: ["A105", "A350 LF2", "A350 LF6 Cl.1", "A216 WCB", "A515 Gr.70", "A516 Gr.70"], class: 600, ratings: buildRatings(GROUP_1_1_TEMPS, G11_600) },
  { materialGroup: "1.1", materialDescription: "Carbon Steel", applicableMaterials: ["A105", "A350 LF2", "A350 LF6 Cl.1", "A216 WCB", "A515 Gr.70", "A516 Gr.70"], class: 900, ratings: buildRatings(GROUP_1_1_TEMPS, G11_900) },
  { materialGroup: "1.1", materialDescription: "Carbon Steel", applicableMaterials: ["A105", "A350 LF2", "A350 LF6 Cl.1", "A216 WCB", "A515 Gr.70", "A516 Gr.70"], class: 1500, ratings: buildRatings(GROUP_1_1_TEMPS, G11_1500) },
  { materialGroup: "1.1", materialDescription: "Carbon Steel", applicableMaterials: ["A105", "A350 LF2", "A350 LF6 Cl.1", "A216 WCB", "A515 Gr.70", "A516 Gr.70"], class: 2500, ratings: buildRatings(GROUP_1_1_TEMPS, G11_2500) },
];

// ──── Group 2.2: 316 Stainless Steel ────────
const GROUP_2_2_TEMPS = [-29, 38, 50, 100, 150, 200, 250, 300, 350, 400, 450];

const G22_150 = [19.0, 19.0, 18.4, 16.2, 14.8, 13.7, 12.1, 10.2, 8.4, 6.5, 4.6];
const G22_300 = [49.6, 49.6, 48.1, 42.2, 38.5, 35.7, 33.4, 31.6, 30.3, 29.4, 28.8];
const G22_600 = [99.3, 99.3, 96.2, 84.4, 77.0, 71.3, 66.8, 63.2, 60.7, 58.9, 57.7];
const G22_900 = [148.9, 148.9, 144.3, 126.6, 115.5, 107.0, 100.1, 94.9, 91.0, 88.3, 86.5];
const G22_1500 = [248.2, 248.2, 240.6, 211.0, 192.5, 178.3, 166.9, 158.1, 151.6, 147.2, 144.2];
const G22_2500 = [413.7, 413.7, 400.9, 351.6, 320.8, 297.2, 278.1, 263.5, 252.7, 245.3, 240.4];

export const B16_5_GROUP_2_2: FlangePTRating[] = [
  { materialGroup: "2.2", materialDescription: "316 Stainless Steel", applicableMaterials: ["A182 F316", "A182 F316H", "A351 CF8M"], class: 150, ratings: buildRatings(GROUP_2_2_TEMPS, G22_150) },
  { materialGroup: "2.2", materialDescription: "316 Stainless Steel", applicableMaterials: ["A182 F316", "A182 F316H", "A351 CF8M"], class: 300, ratings: buildRatings(GROUP_2_2_TEMPS, G22_300) },
  { materialGroup: "2.2", materialDescription: "316 Stainless Steel", applicableMaterials: ["A182 F316", "A182 F316H", "A351 CF8M"], class: 600, ratings: buildRatings(GROUP_2_2_TEMPS, G22_600) },
  { materialGroup: "2.2", materialDescription: "316 Stainless Steel", applicableMaterials: ["A182 F316", "A182 F316H", "A351 CF8M"], class: 900, ratings: buildRatings(GROUP_2_2_TEMPS, G22_900) },
  { materialGroup: "2.2", materialDescription: "316 Stainless Steel", applicableMaterials: ["A182 F316", "A182 F316H", "A351 CF8M"], class: 1500, ratings: buildRatings(GROUP_2_2_TEMPS, G22_1500) },
  { materialGroup: "2.2", materialDescription: "316 Stainless Steel", applicableMaterials: ["A182 F316", "A182 F316H", "A351 CF8M"], class: 2500, ratings: buildRatings(GROUP_2_2_TEMPS, G22_2500) },
];

// ──── Group 2.3: 316L Stainless Steel ────────
const G23_150 = [15.9, 15.9, 15.3, 13.3, 12.0, 11.2, 10.5, 10.0, 8.4, 6.5, 4.6];
const G23_300 = [41.4, 41.4, 40.0, 34.8, 31.4, 29.2, 27.5, 26.1, 25.1, 24.3, 23.4];
const G23_600 = [82.7, 82.7, 80.0, 69.6, 62.8, 58.3, 54.9, 52.1, 50.1, 48.6, 46.8];
const G23_900 = [124.1, 124.1, 120.1, 104.4, 94.2, 87.5, 82.4, 78.2, 75.2, 72.9, 70.2];

export const B16_5_GROUP_2_3: FlangePTRating[] = [
  { materialGroup: "2.3", materialDescription: "316L Stainless Steel", applicableMaterials: ["A182 F316L", "A351 CF3M"], class: 150, ratings: buildRatings(GROUP_2_2_TEMPS, G23_150) },
  { materialGroup: "2.3", materialDescription: "316L Stainless Steel", applicableMaterials: ["A182 F316L", "A351 CF3M"], class: 300, ratings: buildRatings(GROUP_2_2_TEMPS, G23_300) },
  { materialGroup: "2.3", materialDescription: "316L Stainless Steel", applicableMaterials: ["A182 F316L", "A351 CF3M"], class: 600, ratings: buildRatings(GROUP_2_2_TEMPS, G23_600) },
  { materialGroup: "2.3", materialDescription: "316L Stainless Steel", applicableMaterials: ["A182 F316L", "A351 CF3M"], class: 900, ratings: buildRatings(GROUP_2_2_TEMPS, G23_900) },
];

// ──── ALL GROUPS combined ────────
export const ALL_FLANGE_PT_RATINGS: FlangePTRating[] = [
  ...B16_5_GROUP_1_1,
  ...B16_5_GROUP_2_2,
  ...B16_5_GROUP_2_3,
];

/**
 * Select minimum flange class for given pressure & temperature
 */
export function selectFlangeClass(
  pressureBar: number,
  tempC: number,
  materialGroup: string = "1.1"
): { class: number; maxPressureBar: number; source: string; explanation: string } | null {
  const classes = [150, 300, 600, 900, 1500, 2500];

  // Resolve a usable material group. B16.5 P-T data in this app currently
  // covers Groups 1.1 (CS), 2.2 (316/321/347 SS), and 2.3 (316L SS).
  // For groups not yet loaded (1.9 low-alloy, 2.1 304/304L, 2.4 duplex, etc.)
  // fall back to a conservative ASME-equivalent group rather than reporting
  // "EXCEEDS", which is misleading at normal design conditions.
  const availableGroups = new Set(ALL_FLANGE_PT_RATINGS.map(r => r.materialGroup));
  let effectiveGroup = materialGroup;
  let groupNote = "";
  if (!availableGroups.has(effectiveGroup)) {
    if (materialGroup.startsWith("1.")) {
      effectiveGroup = "1.1"; // carbon / low-alloy → use CS ratings (conservative for low-alloy at moderate temp)
      groupNote = ` Group ${materialGroup} P-T table not loaded — using Group 1.1 (Carbon Steel) ratings as a conservative proxy.`;
    } else if (materialGroup === "2.1") {
      effectiveGroup = "2.2"; // 304/304L → use 316 ratings (close, slightly conservative at high T)
      groupNote = ` Group 2.1 P-T table not loaded — using Group 2.2 (316 SS) ratings as a close proxy.`;
    } else if (materialGroup.startsWith("2.")) {
      effectiveGroup = "2.2";
      groupNote = ` Group ${materialGroup} P-T table not loaded — using Group 2.2 (316 SS) ratings as a proxy.`;
    } else {
      effectiveGroup = "1.1";
      groupNote = ` Unknown material group "${materialGroup}" — defaulted to Group 1.1.`;
    }
  }

  for (const cls of classes) {
    const rating = ALL_FLANGE_PT_RATINGS.find(
      r => r.materialGroup === effectiveGroup && r.class === cls
    );
    if (!rating) continue;

    // Interpolate pressure at the given temperature
    const sorted = [...rating.ratings].sort((a, b) => a.tempC - b.tempC);
    let allowable = 0;

    if (tempC <= sorted[0].tempC) {
      allowable = sorted[0].pressureBar;
    } else if (tempC >= sorted[sorted.length - 1].tempC) {
      allowable = sorted[sorted.length - 1].pressureBar;
    } else {
      for (let i = 0; i < sorted.length - 1; i++) {
        if (tempC >= sorted[i].tempC && tempC <= sorted[i + 1].tempC) {
          const frac = (tempC - sorted[i].tempC) / (sorted[i + 1].tempC - sorted[i].tempC);
          allowable = sorted[i].pressureBar + frac * (sorted[i + 1].pressureBar - sorted[i].pressureBar);
          break;
        }
      }
    }

    if (allowable >= pressureBar) {
      return {
        class: cls,
        maxPressureBar: allowable,
        source: `ASME B16.5 Table 2-${effectiveGroup}`,
        explanation: `Class ${cls} rated at ${allowable.toFixed(1)} bar at ${tempC.toFixed(0)}°C (Group ${effectiveGroup}) ≥ design pressure ${pressureBar.toFixed(1)} bar.${groupNote}`,
      };
    }
  }

  return null; // No class sufficient
}

export const B16_5_SOURCE = {
  id: "std_b165",
  standard: "ASME B16.5",
  title: "Pipe Flanges and Flanged Fittings",
  tableRef: "Table 2-1.1, 2-2.2, 2-2.3",
  dataSource: "Publicly available P-T rating data (engineeringtoolbox.com, stewarts-group.com)",
  materialGroups: ["1.1 Carbon Steel", "2.2 316SS", "2.3 316L SS"],
};
