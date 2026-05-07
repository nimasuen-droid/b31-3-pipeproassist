import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  ALL_FLANGE_PT_RATINGS,
  ALLOWABLE_STRESS_DATA,
  B36_10M_PIPE_DATA,
  B36_19M_PIPE_DATA,
  LOADED_SOURCES_SUMMARY,
  selectFlangeClass,
} from "@/components/modules/designInputs/sourceData";
import { parseTSVText, validateDatasetForType } from "@/stores/datasetManager";
import {
  PIPE_PRESSURE_DESIGN_RULES,
  PMS_PRACTICE_RULES,
  TEST_PRESSURE_RULES,
} from "@/components/modules/designInputs/engineeringRules";

const expectedEpcNps = new Set([
  "0.25",
  "0.5",
  "0.75",
  "1",
  "1.25",
  "1.5",
  "2",
  "3",
  "4",
  "6",
  "8",
  "10",
  "12",
  "14",
  "16",
  "18",
  "20",
  "24",
]);

function normalizeNps(nps: string) {
  return nps.replace(/['"]/g, "").trim();
}

describe("bundled engineering source data", () => {
  it("registers every loaded baseline source as active", () => {
    expect(LOADED_SOURCES_SUMMARY.map((s) => s.standard)).toEqual(
      expect.arrayContaining([
        "ASME B31.3",
        "ASME B36.10M",
        "ASME B36.19M",
        "ASME B16.5",
        "ASME Sec II-D",
        "ASME B16.9",
        "ASME B16.11",
      ]),
    );
    expect(LOADED_SOURCES_SUMMARY.every((s) => s.status === "active")).toBe(true);
  });

  it("has internally consistent B36.10M pipe dimensions for EPC NPS sizes", () => {
    const seen = new Set<string>();

    for (const row of B36_10M_PIPE_DATA) {
      const nps = normalizeNps(row.nps);
      const key = `${nps}:${row.schedule}`;
      expect(seen.has(key), `duplicate B36.10M row ${key}`).toBe(false);
      seen.add(key);

      expect(row.standard).toBe("B36.10M");
      expect(row.od_mm).toBeGreaterThan(0);
      expect(row.od_in).toBeGreaterThan(0);
      expect(row.wt_mm).toBeGreaterThan(0);
      expect(row.wt_in).toBeGreaterThan(0);
      expect(row.weightPerMeter).toBeGreaterThan(0);
      expect(row.id_mm).toBeCloseTo(row.od_mm - 2 * row.wt_mm, 1);
    }

    for (const nps of expectedEpcNps) {
      expect(B36_10M_PIPE_DATA.some((row) => normalizeNps(row.nps) === nps), `missing NPS ${nps}`).toBe(true);
    }
  });

  it("has internally consistent B36.19M stainless dimensions", () => {
    const seen = new Set<string>();

    for (const row of B36_19M_PIPE_DATA) {
      const nps = normalizeNps(row.nps);
      const key = `${nps}:${row.schedule}`;
      expect(seen.has(key), `duplicate B36.19M row ${key}`).toBe(false);
      seen.add(key);

      expect(row.standard).toBe("B36.19M");
      expect(row.schedule.endsWith("S")).toBe(true);
      expect(row.od_mm).toBeGreaterThan(0);
      expect(row.wt_mm).toBeGreaterThan(0);
      expect(row.weightPerMeter).toBeGreaterThan(0);
      expect(row.id_mm).toBeCloseTo(row.od_mm - 2 * row.wt_mm, 2);
    }
  });

  it("keeps B16.5 P-T rating curves ordered and non-increasing with temperature", () => {
    for (const rating of ALL_FLANGE_PT_RATINGS) {
      expect(rating.materialGroup).toMatch(/^\d\.\d$/);
      expect([150, 300, 400, 600, 900, 1500, 2500]).toContain(rating.class);
      expect(rating.ratings.length).toBeGreaterThan(0);

      for (let i = 1; i < rating.ratings.length; i++) {
        expect(rating.ratings[i].tempC).toBeGreaterThan(rating.ratings[i - 1].tempC);
        expect(rating.ratings[i].pressureBar).toBeLessThanOrEqual(rating.ratings[i - 1].pressureBar);
      }
    }
  });

  it("does not select Class 400 even if source data contains it", () => {
    const result = selectFlangeClass(55, 100, "1.1");
    expect(result?.class).toBe(600);
  });

  it("keeps Sec II-D stress tables ordered with positive stress values", () => {
    for (const entry of ALLOWABLE_STRESS_DATA) {
      expect(entry.material).toBeTruthy();
      expect(entry.spec).toMatch(/^ASTM /);
      expect(entry.stressValues.length).toBeGreaterThan(0);

      for (let i = 0; i < entry.stressValues.length; i++) {
        const stress = entry.stressValues[i];
        expect(stress.stress_ksi).toBeGreaterThan(0);
        expect(stress.stress_MPa).toBeGreaterThan(0);
        if (i > 0) {
          expect(stress.tempF).toBeGreaterThan(entry.stressValues[i - 1].tempF);
          expect(stress.stress_ksi).toBeLessThanOrEqual(entry.stressValues[i - 1].stress_ksi);
        }
      }
    }
  });
});

describe("dataset import validation", () => {
  it("accepts a valid imported pipe schedule table", () => {
    const parsed = parseTSVText("NPS\tOD\tSchedule\tWall Thickness\n1\t33.4\t40\t3.38\n2\t60.3\t80\t5.54");
    const result = validateDatasetForType("pipe-schedule", parsed.columns, parsed.rows);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("blocks duplicate imported pipe schedule rows", () => {
    const parsed = parseTSVText("NPS\tOD\tSchedule\tWall Thickness\n2\t60.3\t40\t3.91\n2\t60.3\t40\t3.91");
    const result = validateDatasetForType("pipe-schedule", parsed.columns, parsed.rows);

    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("duplicate NPS/schedule");
  });

  it("blocks unsupported imported flange classes", () => {
    const parsed = parseTSVText("Class\tTemperature\tPressure\n400\t38\t68.2\n600\t38\t102.1");
    const result = validateDatasetForType("flange-rating", parsed.columns, parsed.rows);

    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("class 400");
  });

  it("blocks negative corrosion allowance rows", () => {
    const parsed = parseTSVText("Service\tCA\nCooling Water\t-1");
    const result = validateDatasetForType("corrosion-allowance", parsed.columns, parsed.rows);

    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("cannot be negative");
  });
});

describe("engineering rule references", () => {
  it("keeps code-derived numeric defaults tied to explicit source references", () => {
    expect(PIPE_PRESSURE_DESIGN_RULES.yCoefficientFerrousBelowCreep.value).toBe(0.4);
    expect(PIPE_PRESSURE_DESIGN_RULES.yCoefficientFerrousBelowCreep.reference).toContain("ASME B31.3");
    expect(PIPE_PRESSURE_DESIGN_RULES.standardPipeMillTolerancePercent.value).toBe(12.5);
    expect(PIPE_PRESSURE_DESIGN_RULES.standardPipeMillTolerancePercent.reference).toContain("ASTM A530");
    expect(TEST_PRESSURE_RULES.hydrostaticFactor.value).toBe(1.5);
    expect(TEST_PRESSURE_RULES.hydrostaticFactor.reference).toContain("ASME B31.3");
  });

  it("marks PMS schedule defaults as project practice instead of ASME code mandates", () => {
    for (const rule of Object.values(PMS_PRACTICE_RULES)) {
      expect(rule.basis).toBe("project-default");
      expect(rule.reference.toLowerCase()).not.toContain("asme b31.3");
    }
  });
});

describe("independent benchmark fixtures", () => {
  it("pins known B36.10M and B36.19M NPS 6 schedule dimensions", () => {
    const csSch40 = B36_10M_PIPE_DATA.find((row) => row.nps === '6"' && row.schedule === "40");
    const ssSch40s = B36_19M_PIPE_DATA.find((row) => row.nps === '6"' && row.schedule === "40S");
    const ssSch80s = B36_19M_PIPE_DATA.find((row) => row.nps === '6"' && row.schedule === "80S");

    expect(csSch40).toMatchObject({ od_mm: 168.3, wt_mm: 7.11, id_mm: 154.08, standard: "B36.10M" });
    expect(ssSch40s).toMatchObject({ od_mm: 168.3, wt_mm: 7.11, standard: "B36.19M" });
    expect(ssSch80s).toMatchObject({ od_mm: 168.3, wt_mm: 10.97, standard: "B36.19M" });
  });

  it("pins known B16.5 Group 1.1 pressure-temperature class values", () => {
    const class150 = ALL_FLANGE_PT_RATINGS.find((row) => row.materialGroup === "1.1" && row.class === 150);
    const class300 = ALL_FLANGE_PT_RATINGS.find((row) => row.materialGroup === "1.1" && row.class === 300);

    expect(class150?.ratings.find((r) => r.tempC === 100)?.pressureBar).toBe(17.7);
    expect(class300?.ratings.find((r) => r.tempC === 100)?.pressureBar).toBe(46.6);
    expect(selectFlangeClass(17.7, 100, "1.1")?.class).toBe(150);
    expect(selectFlangeClass(17.8, 100, "1.1")?.class).toBe(300);
  });

  it("pins known ASME Sec II-D A106 Gr.B allowable stress fixture values", () => {
    const a106b = ALLOWABLE_STRESS_DATA.find((row) => row.material === "A106 Gr.B");

    expect(a106b?.spec).toBe("ASTM A106");
    expect(a106b?.stressValues.find((row) => row.tempF === 100)?.stress_ksi).toBe(20);
    expect(a106b?.stressValues.find((row) => row.tempF === 600)?.stress_ksi).toBe(17.1);
    expect(a106b?.source).toContain("ASME Sec II-D");
  });
});

describe("Supabase production security contract", () => {
  const migrationDir = join(process.cwd(), "supabase", "migrations");
  const migrationSql = readdirSync(migrationDir)
    .filter((name) => name.endsWith(".sql"))
    .map((name) => readFileSync(join(migrationDir, name), "utf8"))
    .join("\n");

  it("enables RLS on role and saved spec tables", () => {
    expect(migrationSql).toContain("alter table public.user_roles enable row level security");
    expect(migrationSql).toContain("alter table public.saved_specs enable row level security");
  });

  it("keeps saved specs scoped to the authenticated owner", () => {
    expect(migrationSql).toContain("Users can view own specs");
    expect(migrationSql).toContain("Users can create own specs");
    expect(migrationSql).toContain("Users can update own specs");
    expect(migrationSql).toContain("Users can delete own specs");
    expect(migrationSql).toContain("auth.uid() = user_id");
  });

  it("does not include a payment provider integration in the current migrations", () => {
    expect(migrationSql.toLowerCase()).not.toContain("paddle");
    expect(migrationSql.toLowerCase()).not.toContain("payment_audit");
    expect(migrationSql.toLowerCase()).not.toContain("subscriptions");
  });
});
