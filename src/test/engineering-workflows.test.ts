import { describe, expect, it } from "vitest";
import { defaultInputs, type OverrideKeys } from "@/stores/designInputsStore";
import { getRecommendations } from "@/components/modules/designInputs/recommendationEngine";
import { isScheduleAtLeast, normalizeScheduleNps, selectPipeSchedule } from "@/components/modules/designInputs/pipeScheduleEngine";
import { generatePMS } from "@/components/modules/pms/pmsEngine";
import { getReportContent, type ReportId } from "@/components/modules/reports/reportGenerator";
import { normalizeNpsForDataKey, normalizeNpsForPicker } from "@/lib/nps";
import { getBoltAssembly } from "@/components/modules/designInputs/boltingGasketEngine";
import { buildValveClassTable } from "@/components/modules/designInputs/valveClassTableEngine";
import { getPipeDimensionsForMaterial } from "@/components/modules/designInputs/sourceData";
import { normalizeLengthToMM, normalizeStressToMPa } from "@/lib/unitConversion";

const noOverrides: Record<OverrideKeys, boolean> = {
  pipeMaterial: false,
  flangeMaterial: false,
  fittingMaterial: false,
  boltMaterial: false,
  gasketType: false,
  corrosionAllowance: false,
  millTolerance: false,
  jointQualityFactor: false,
  testPressure: false,
  testMedium: false,
};

const designInputs = {
  ...defaultInputs,
  projectName: "Validation Project",
  lineNumber: "P-1001",
  serviceDescription: "General hydrocarbon validation line",
  serviceType: "General Hydrocarbon",
  fluidPhase: "Liquid",
  designPressure: "20",
  designTemperature: "100",
  operatingPressure: "12",
  operatingTemperature: "80",
  nominalPipeSize: '6"',
  unitSystem: "SI",
};

describe("engineering workflows", () => {
  it("normalizes line NPS and what-if NPS values consistently", () => {
    expect(normalizeNpsForPicker('6"')).toBe("6");
    expect(normalizeNpsForPicker("1.5")).toBe("1-1/2");
    expect(normalizeNpsForPicker('1.5"')).toBe("1-1/2");
    expect(normalizeNpsForPicker("1 1/2")).toBe("1-1/2");
    expect(normalizeNpsForDataKey("1-1/2")).toBe('1.5"');
    expect(normalizeNpsForDataKey('6"')).toBe('6"');
  });

  it("calculates B31.3 wall thickness consistently in SI and Imperial units", () => {
    const si = selectPipeSchedule({
      nps: "6",
      designPressure: 20,
      outsideDiameter: 168.3,
      allowableStress: 138,
      jointFactor: 1,
      yCoefficient: 0.4,
      corrosionAllowance: 1,
      millTolerance: 12.5,
      unitSystem: "SI",
      pipeMaterial: "A106 Gr.B",
      applyStructuralMinimum: false,
    });
    const imperial = selectPipeSchedule({
      nps: "6",
      designPressure: 290.075,
      outsideDiameter: 6.626,
      allowableStress: 20.015,
      jointFactor: 1,
      yCoefficient: 0.4,
      corrosionAllowance: 0.03937,
      millTolerance: 12.5,
      unitSystem: "Imperial",
      pipeMaterial: "A106 Gr.B",
      applyStructuralMinimum: false,
    });

    const expectedDesignThickness = (2 * 168.3) / (2 * (138 + 2 * 0.4));
    const expectedMinimum = (expectedDesignThickness + 1) / 0.875;

    expect(si.requiredThickness_mm).toBeCloseTo(expectedDesignThickness, 3);
    expect(si.minimumRequired_mm).toBeCloseTo(expectedMinimum, 3);
    expect(imperial.minimumRequired_mm).toBeCloseTo(si.minimumRequired_mm, 2);
  });

  it("refuses invalid calculation inputs instead of returning a plausible schedule", () => {
    const base = {
      nps: "6",
      outsideDiameter: 168.3,
      allowableStress: 138,
      jointFactor: 1,
      yCoefficient: 0.4,
      corrosionAllowance: 1,
      millTolerance: 12.5,
      unitSystem: "SI",
      pipeMaterial: "A106 Gr.B",
    };

    const negativePressure = selectPipeSchedule({ ...base, designPressure: -1 });
    const impossibleMillTolerance = selectPipeSchedule({ ...base, designPressure: 20, millTolerance: 100 });
    const negativeCorrosion = selectPipeSchedule({ ...base, designPressure: 20, corrosionAllowance: -1 });

    for (const result of [negativePressure, impossibleMillTolerance, negativeCorrosion]) {
      expect(result.selectedSchedule).toBeNull();
      expect(result.minimumRequired_mm).toBe(0);
      expect(result.governingCase).toBe("Invalid input data");
    }
  });

  it("applies EPC small-bore schedule preference above minimum-passing wall", () => {
    const result = selectPipeSchedule({
      nps: "1",
      designPressure: 10,
      outsideDiameter: 33.4,
      allowableStress: 137.9,
      jointFactor: 1,
      yCoefficient: 0.4,
      corrosionAllowance: 1,
      millTolerance: 12.5,
      unitSystem: "SI",
      pipeMaterial: "A106 Gr.B",
    });

    expect(result.recommendation.minimumPassing?.schedule).toBeTruthy();
    expect(result.recommendation.recommended?.schedule).toMatch(/^(80|160)$/);
    expect(result.selectedSchedule?.schedule).toBe(result.recommendation.recommended?.schedule);
    expect(result.minimumRequired_mm).toBeGreaterThan(result.pressureMinRequired_mm);
    expect(result.structuralGoverns).toBe(true);
  });

  it("generates a traceable PMS from validated design inputs", () => {
    const recommendations = getRecommendations(designInputs);
    const activePipeMaterial = recommendations.pipeMaterial.value;
    const pms = generatePMS(designInputs, recommendations, activePipeMaterial, noOverrides);

    expect(pms.designBasis.designCode).toBe("ASME B31.3");
    expect(pms.designBasis.specNumber).toMatch(/^PMS-/);
    expect(["A", "B", "C", "D"]).toContain(pms.scheduleBand);
    expect(pms.materialTable.length).toBeGreaterThan(0);
    expect(pms.references.map((r) => r.standard)).toContain("ASME B31.3");
    expect(pms.references.map((r) => r.standard)).toContain("ASME Sec II-D");
    expect(pms.notes.some((note) => note.text.includes("Pipe schedules shown have been validated"))).toBe(true);
    expect(new Set(pms.materialTable.map((row) => row.category))).toEqual(
      new Set(["pipe", "nipple", "fitting-sb", "fitting-lb", "valve", "flange", "gasket", "bolting"]),
    );
    expect(pms.references.map((r) => r.standard)).toContain("ASME B16.5");
    expect(pms.references.map((r) => r.standard)).toContain("ASME B16.20");

    for (const row of pms.materialTable) {
      expect(row.component).toBeTruthy();
      expect(row.traceability, `${row.component} is missing traceability`).toBeTruthy();
      expect(row.traceability?.whySelected).toBeTruthy();
      expect(row.traceability?.governingRule).toBeTruthy();
    }
  });

  it("carries drain and vent line functions into PMS design basis and notes", () => {
    const drainInputs = {
      ...designInputs,
      specialService: "Drain",
    };
    const drainRecommendations = getRecommendations(drainInputs);
    const drainPms = generatePMS(drainInputs, drainRecommendations, drainRecommendations.pipeMaterial.value, noOverrides);

    expect(drainPms.designBasis.specialService).toBe("Drain");
    expect(drainPms.notes.some((note) => note.text.toLowerCase().includes("low-point valved drain"))).toBe(true);

    const ventInputs = {
      ...designInputs,
      specialService: "Vent",
    };
    const ventRecommendations = getRecommendations(ventInputs);
    const ventPms = generatePMS(ventInputs, ventRecommendations, ventRecommendations.pipeMaterial.value, noOverrides);

    expect(ventPms.designBasis.specialService).toBe("Vent");
    expect(ventPms.notes.some((note) => note.text.toLowerCase().includes("high-point valved vent"))).toBe(true);
  });

  it("selects flange, fitting, gasket, and bolting data from referenced engineering rules", () => {
    const recommendations = getRecommendations(designInputs);
    const boltInfo = getBoltAssembly(recommendations.flangeClass?.value, designInputs.nominalPipeSize);

    expect(recommendations.flangeClass?.source).toContain("ASME B16.5");
    expect(recommendations.flangeClass?.value).toBe("300");
    expect(recommendations.flangeMaterial.source).toMatch(/ASME B16\.5|ASTM/);
    expect(recommendations.fittingMaterial.source).toMatch(/ASME B16\.9|ASTM/);
    expect(recommendations.gasketType.source).toContain("ASME B16.20");
    expect(recommendations.boltMaterial.source).toMatch(/ASME B16\.5|ASTM/);
    expect(boltInfo).toMatchObject({
      boltSize: '3/4"',
      boltCount: 12,
      boltLength: '5.5"',
      source: "ASME B16.5 Table E-1",
    });
  });

  it("does not fabricate bolting dimensions for unloaded class/NPS combinations", () => {
    expect(getBoltAssembly("900", '6"')).toBeNull();
    expect(getBoltAssembly("300", '18"')).toBeNull();
  });

  it("uses B36.19M S-schedules for stainless PMS pipe schedules", () => {
    const stainlessInputs = {
      ...designInputs,
      serviceType: "Corrosive / Sour Service",
      pipeMaterial: "A312 TP316L",
      nominalPipeSize: '6"',
    };
    const recommendations = getRecommendations(stainlessInputs);
    const pms = generatePMS(stainlessInputs, recommendations, "A312 TP316L", noOverrides);
    const pipeRows = pms.materialTable.filter((row) => row.category === "pipe");
    const nippleRow = pms.materialTable.find((row) => row.category === "nipple");

    expect(pms.references.map((r) => r.standard)).toContain("ASME B36.19M");
    expect(pms.references.map((r) => r.standard)).not.toContain("ASME B36.10M");
    expect(pipeRows.length).toBeGreaterThan(0);
    for (const row of pipeRows) {
      expect(row.schedule, row.component).toMatch(/\b(?:10S|40S|80S)\b/);
      expect(row.schedule, row.component).not.toMatch(/\b(?:10|40|80)\b(?!S)/);
    }
    expect(nippleRow?.schedule).toContain("80S");
    expect(pms.notes.some((note) => note.reference.includes("ASME B36.19M"))).toBe(true);
  });

  it("uses B36.10M non-S schedules for carbon steel PMS pipe schedules", () => {
    const recommendations = getRecommendations(designInputs);
    const pms = generatePMS(designInputs, recommendations, "A106 Gr.B", noOverrides);
    const pipeRows = pms.materialTable.filter((row) => row.category === "pipe");

    expect(pms.references.map((r) => r.standard)).toContain("ASME B36.10M");
    expect(pms.references.map((r) => r.standard)).not.toContain("ASME B36.19M");
    expect(pipeRows.length).toBeGreaterThan(0);
    for (const row of pipeRows) {
      expect(row.schedule, row.component).toMatch(/\b(?:10|40|80|160)\b/);
      expect(row.schedule, row.component).not.toMatch(/\b(?:10S|40S|80S)\b/);
    }
  });

  it("keeps material spec schedules at or above calculated pipe schedule results for every PMS line size", () => {
    const cases = [
      { pipeMaterial: "A106 Gr.B", expectedStandard: "ASME B36.10M", inputs: designInputs },
      {
        pipeMaterial: "A312 TP316L",
        expectedStandard: "ASME B36.19M",
        inputs: {
          ...designInputs,
          serviceType: "Corrosive / Sour Service",
          pipeMaterial: "A312 TP316L",
        },
      },
    ];
    const expectedNps = ["0.5", "0.75", "1", "1.25", "1.5", "2", "3", "4", "6", "8", "10", "12", "14", "16", "18", "20", "24"];

    for (const testCase of cases) {
      const recommendations = getRecommendations(testCase.inputs);
      const pms = generatePMS(testCase.inputs, recommendations, testCase.pipeMaterial, noOverrides);
      const dimTable = getPipeDimensionsForMaterial(testCase.pipeMaterial);

      expect(pms.scheduleValidation.map((row) => row.nps)).toEqual(expectedNps);
      for (const validation of pms.scheduleValidation) {
        const dim = dimTable.find((row) => normalizeScheduleNps(row.nps) === validation.nps);
        expect(dim, `missing ${testCase.expectedStandard} dimensions for NPS ${validation.nps}`).toBeTruthy();

        const calculated = selectPipeSchedule({
          nps: validation.nps,
          designPressure: Number(testCase.inputs.designPressure),
          outsideDiameter: dim?.od_mm ?? 0,
          allowableStress: Number(recommendations.allowableStress.value),
          jointFactor: Number(recommendations.jointQualityFactor.value),
          yCoefficient: 0.4,
          corrosionAllowance: Number(recommendations.corrosionAllowance.value),
          millTolerance: Number(recommendations.millTolerance.value),
          unitSystem: "SI",
          pipeMaterial: testCase.pipeMaterial,
          serviceType: testCase.inputs.serviceType,
        });

        expect(validation.standard).toBe(testCase.expectedStandard);
        expect(validation.minimumRequired_mm).toBeCloseTo(calculated.minimumRequired_mm, 3);
        if (!calculated.selectedSchedule) {
          expect(validation.calculatedSchedule, `${testCase.pipeMaterial} NPS ${validation.nps}`).toBe("NO STANDARD SCHEDULE");
          expect(validation.meetsMinimumWall, `${testCase.pipeMaterial} NPS ${validation.nps} should require engineering review`).toBe(false);
          continue;
        }
        expect(validation.calculatedSchedule, `${testCase.pipeMaterial} NPS ${validation.nps}`).toBe(calculated.selectedSchedule.schedule);
        expect(validation.meetsMinimumWall, `${testCase.pipeMaterial} NPS ${validation.nps} below B31.3 required wall`).toBe(true);
        expect(validation.meetsCalculatedSchedule, `${testCase.pipeMaterial} NPS ${validation.nps} below calculated schedule module`).toBe(true);
        expect(validation.materialSpecWall_mm ?? 0).toBeGreaterThanOrEqual(calculated.selectedSchedule.wt_mm);
      }
    }
  });

  it("keeps corrosion allowance philosophy driven by service and material family", () => {
    const carbonSour = getRecommendations({
      ...designInputs,
      serviceType: "Corrosive / Sour Service",
      corrosionSeverity: "Severe",
      pipeMaterial: "A106 Gr.B",
    });
    const stainlessSour = getRecommendations({
      ...designInputs,
      serviceType: "Corrosive / Sour Service",
      corrosionSeverity: "Severe",
      pipeMaterial: "A312 TP316L",
    });
    const chlorideCra = getRecommendations({
      ...designInputs,
      serviceType: "Chloride / Caustic",
      corrosionSeverity: "Severe",
      pipeMaterial: "A312 TP304L",
    });
    const coolingWater = getRecommendations({
      ...designInputs,
      serviceType: "Cooling Water",
      corrosionSeverity: "Moderate",
      pipeMaterial: "A106 Gr.B",
    });
    const instrumentAir = getRecommendations({
      ...designInputs,
      serviceType: "Instrument Air",
      corrosionSeverity: "Low",
      pipeMaterial: "A106 Gr.B",
    });

    expect(carbonSour.corrosionAllowance.value).toBe("3.0");
    expect(carbonSour.corrosionAllowance.reason).toContain("metal loss");
    expect(carbonSour.corrosionAllowance.source).toContain("NACE MR0175");

    expect(stainlessSour.corrosionAllowance.value).toBe("1.0");
    expect(stainlessSour.corrosionAllowance.reason).toContain("hardness");
    expect(stainlessSour.corrosionAllowance.reason).toContain("modest");

    expect(chlorideCra.corrosionAllowance.value).toBe("1.0");
    expect(chlorideCra.corrosionAllowance.reason).toContain("does not mitigate SCC");

    expect(coolingWater.corrosionAllowance.value).toBe("1.5");
    expect(coolingWater.corrosionAllowance.reason).toContain("water chemistry");

    expect(instrumentAir.corrosionAllowance.value).toBe("0.5");
    expect(instrumentAir.corrosionAllowance.reason).toContain("clean/dry");
  });

  it("does not apply process-service overschedule defaults to instrument air", () => {
    const inputs = {
      ...designInputs,
      serviceType: "Instrument Air",
      fluidPhase: "Gas",
      corrosionSeverity: "Low",
      designPressure: "7",
      designTemperature: "40",
      nominalPipeSize: '6"',
    };
    const recommendations = getRecommendations(inputs);
    const activePipeMaterial = recommendations.pipeMaterial.value;
    const dimTable = getPipeDimensionsForMaterial(activePipeMaterial);
    const dim6 = dimTable.find((row) => normalizeScheduleNps(row.nps) === "6");
    const schedule = selectPipeSchedule({
      nps: "6",
      designPressure: Number(inputs.designPressure),
      outsideDiameter: dim6?.od_mm ?? 0,
      allowableStress: normalizeStressToMPa(recommendations.allowableStress?.value ?? "", "SI"),
      jointFactor: Number.parseFloat(recommendations.jointQualityFactor.value) || 1,
      yCoefficient: 0.4,
      corrosionAllowance: normalizeLengthToMM(recommendations.corrosionAllowance.value, "SI"),
      millTolerance: Number.parseFloat(recommendations.millTolerance.value) || 12.5,
      unitSystem: "SI",
      pipeMaterial: activePipeMaterial,
      serviceType: inputs.serviceType,
    });
    const pms = generatePMS(inputs, recommendations, activePipeMaterial, noOverrides);
    const nps6 = pms.scheduleValidation.find((row) => row.nps === "6");

    expect(schedule.selectedSchedule?.schedule).not.toBe("40");
    expect(schedule.selectedSchedule?.schedule).toBe("10");
    expect(nps6?.calculatedSchedule).toBe("10");
    expect(nps6?.materialSpecSchedule).toBe("10");
    expect(nps6?.meetsMinimumWall).toBe(true);
  });

  it("aligns wall thickness, pipe schedule, and PMS schedule across service classifications and requested NPS sizes", () => {
    const requestedNps = ["0.5", "1", "1.5", "2", "6", "8", "10", "12", "16", "18", "24"];
    const services = [
      { serviceType: "General Hydrocarbon", pressure: "20", temperature: "100", corrosion: "Low", phase: "Liquid" },
      { serviceType: "Corrosive / Sour Service", pressure: "35", temperature: "120", corrosion: "Severe", phase: "Gas" },
      { serviceType: "High Pressure Steam", pressure: "80", temperature: "420", corrosion: "Low", phase: "Vapor" },
      { serviceType: "Low Pressure Steam", pressure: "8", temperature: "180", corrosion: "Low", phase: "Vapor" },
      { serviceType: "Cooling Water", pressure: "10", temperature: "45", corrosion: "Moderate", phase: "Liquid" },
      { serviceType: "Instrument Air", pressure: "7", temperature: "40", corrosion: "Low", phase: "Gas" },
      { serviceType: "Hydrogen Service", pressure: "50", temperature: "380", corrosion: "Low", phase: "Gas" },
      { serviceType: "Oxygen Service", pressure: "15", temperature: "40", corrosion: "Low", phase: "Gas" },
      { serviceType: "Cryogenic Service", pressure: "25", temperature: "-80", corrosion: "Low", phase: "Liquid" },
      { serviceType: "High Temperature (>425°C)", pressure: "30", temperature: "450", corrosion: "Low", phase: "Vapor" },
      { serviceType: "Chloride / Caustic", pressure: "18", temperature: "90", corrosion: "Severe", phase: "Liquid" },
    ];

    for (const service of services) {
      const inputs = {
        ...designInputs,
        serviceDescription: `${service.serviceType} validation`,
        serviceType: service.serviceType,
        corrosionSeverity: service.corrosion,
        fluidPhase: service.phase,
        designPressure: service.pressure,
        designTemperature: service.temperature,
        nominalPipeSize: '6"',
      };
      const recommendations = getRecommendations(inputs);
      const activePipeMaterial = recommendations.pipeMaterial.value;
      const pms = generatePMS(inputs, recommendations, activePipeMaterial, noOverrides);
      const dimTable = getPipeDimensionsForMaterial(activePipeMaterial);
      const allowableStress = normalizeStressToMPa(recommendations.allowableStress.value, "SI");
      const corrosionAllowance = normalizeLengthToMM(recommendations.corrosionAllowance.value, "SI");
      const millTolerance = Number.parseFloat(recommendations.millTolerance.value) || 12.5;
      const jointFactor = Number.parseFloat(recommendations.jointQualityFactor.value) || 1;

      for (const nps of requestedNps) {
        const validation = pms.scheduleValidation.find((row) => row.nps === nps);
        const dim = dimTable.find((row) => normalizeScheduleNps(row.nps) === nps);
        expect(validation, `${service.serviceType} missing PMS validation row for NPS ${nps}`).toBeTruthy();
        expect(dim, `${service.serviceType} missing dimensions for ${activePipeMaterial} NPS ${nps}`).toBeTruthy();

        const calculated = selectPipeSchedule({
          nps,
          designPressure: Number(inputs.designPressure),
          outsideDiameter: dim?.od_mm ?? 0,
          allowableStress,
          jointFactor,
          yCoefficient: 0.4,
          corrosionAllowance,
          millTolerance,
          unitSystem: "SI",
          pipeMaterial: activePipeMaterial,
          serviceType: inputs.serviceType,
        });

        expect(validation?.minimumRequired_mm, `${service.serviceType} NPS ${nps} wall thickness mismatch`).toBeCloseTo(calculated.minimumRequired_mm, 3);
        if (!calculated.selectedSchedule) {
          expect(validation?.calculatedSchedule, `${service.serviceType} NPS ${nps} should not fabricate a schedule`).toBe("NO STANDARD SCHEDULE");
          expect(validation?.meetsMinimumWall, `${service.serviceType} NPS ${nps} should require engineering review`).toBe(false);
          continue;
        }

        expect(validation?.calculatedSchedule, `${service.serviceType} NPS ${nps} pipe schedule mismatch`).toBe(calculated.selectedSchedule.schedule);
        expect(validation?.meetsMinimumWall, `${service.serviceType} NPS ${nps} PMS below required wall`).toBe(true);
        expect(validation?.meetsCalculatedSchedule, `${service.serviceType} NPS ${nps} PMS below calculated schedule`).toBe(true);
        expect(
          isScheduleAtLeast(validation?.materialSpecSchedule ?? "", calculated.selectedSchedule?.schedule ?? ""),
          `${service.serviceType} NPS ${nps}: PMS ${validation?.materialSpecSchedule} is below calculated ${calculated.selectedSchedule?.schedule}`,
        ).toBe(true);
      }
    }
  });

  it("keeps PMS valve materials aligned with the material selection valve class table", () => {
    const recommendations = getRecommendations(designInputs);
    const pms = generatePMS(designInputs, recommendations, recommendations.pipeMaterial.value, noOverrides);
    const valveClassTable = buildValveClassTable({
      pipeMaterial: recommendations.pipeMaterial.value,
      serviceType: designInputs.serviceType,
      corrosionSeverity: designInputs.corrosionSeverity,
      designTemperature: designInputs.designTemperature,
      designPressure: designInputs.designPressure,
      serviceDescription: designInputs.serviceDescription,
      flangeClass: recommendations.flangeClass?.value,
    });

    for (const valve of ["Gate Valve", "Globe Valve", "Check Valve", "Ball Valve"] as const) {
      const classRow = valveClassTable.rows.find((row) => row.valveType === valve);
      const pmsRows = pms.materialTable.filter((row) => row.category === "valve" && row.component.startsWith(valve));

      expect(classRow, `${valve} missing from class table`).toBeTruthy();
      expect(pmsRows.length, `${valve} missing from PMS`).toBe(2);
      for (const pmsRow of pmsRows) {
        const expectedBody = pmsRow.component.includes("(SB)") ? classRow?.smallBoreBody : classRow?.largeBoreBody;
        expect(pmsRow.valveBody).toBe(expectedBody);
        expect(pmsRow.grade).toBe(expectedBody);
        expect(pmsRow.valveTrim).toBe(classRow?.trim);
        expect(pmsRow.valveSeat).toBe(classRow?.seat);
        expect(pmsRow.traceability?.sourceField).toBe("valve class table");
      }
    }
  });

  it("summarizes valve body continuity without duplicate generic rows", () => {
    const recommendations = getRecommendations(designInputs);
    const pms = generatePMS(designInputs, recommendations, recommendations.pipeMaterial.value, noOverrides);
    const genericValveRows = pms.materialContinuity.filter((row) => row.component === "Valve Body");
    const smallBoreRows = pms.materialContinuity.filter((row) => row.component === "Valve Body (SB forged)");
    const largeBoreRows = pms.materialContinuity.filter((row) => row.component === "Valve Body (LB cast)");

    expect(genericValveRows).toHaveLength(0);
    expect(smallBoreRows).toHaveLength(1);
    expect(largeBoreRows).toHaveLength(1);
    expect(new Set(pms.materialContinuity.map((row) => `${row.component}|${row.material}`)).size).toBe(pms.materialContinuity.length);
  });

  it("keeps valve body, trim, and seat philosophy service-driven", () => {
    const standard = buildValveClassTable({
      pipeMaterial: "ASTM A106 Gr.B",
      serviceType: "Utility / Water",
      corrosionSeverity: "Low",
      designTemperature: "80",
      designPressure: "20",
      flangeClass: "300",
    });
    const sour = buildValveClassTable({
      pipeMaterial: "ASTM A106 Gr.B",
      serviceType: "Corrosive/Sour Service",
      corrosionSeverity: "Severe",
      designTemperature: "80",
      designPressure: "20",
      flangeClass: "300",
    });
    const hydrocarbon = buildValveClassTable({
      pipeMaterial: "ASTM A106 Gr.B",
      serviceType: "General Hydrocarbon",
      corrosionSeverity: "Low",
      designTemperature: "80",
      designPressure: "20",
      flangeClass: "300",
    });
    const oxygen = buildValveClassTable({
      pipeMaterial: "ASTM A312 TP316L",
      serviceType: "Oxygen Service",
      corrosionSeverity: "Low",
      designTemperature: "40",
      designPressure: "15",
      flangeClass: "150",
    });

    const standardGate = standard.rows.find((row) => row.valveType === "Gate Valve");
    const standardBall = standard.rows.find((row) => row.valveType === "Ball Valve");
    const sourGate = sour.rows.find((row) => row.valveType === "Gate Valve");
    const sourBall = sour.rows.find((row) => row.valveType === "Ball Valve");
    const hydrocarbonBall = hydrocarbon.rows.find((row) => row.valveType === "Ball Valve");
    const oxygenBall = oxygen.rows.find((row) => row.valveType === "Ball Valve");

    expect(standardGate?.smallBoreBody).toContain("A105");
    expect(standardGate?.largeBoreBody).toContain("A216 WCB");
    expect(standardGate?.seat).toContain("Stellite");
    expect(standardBall?.seat).toContain("RPTFE");
    expect(hydrocarbonBall?.seat).toContain("fire-safe API 607");

    expect(sourGate?.smallBoreBody).toContain("NACE MR0175");
    expect(sourGate?.largeBoreBody).toContain("NACE MR0175");
    expect(sourGate?.trim).toContain("NACE MR0175");
    expect(sourBall?.trim).toContain("NACE-qualified");
    expect(oxygenBall?.trim).toContain("oxygen-clean");
    expect(oxygenBall?.seat).toContain("oxygen-clean");
  });

  it("includes valve material integrity in the material recommendation report", () => {
    const recommendations = getRecommendations(designInputs);
    const data = {
      inputs: designInputs,
      recommendations,
      overrides: noOverrides,
      activePipeMaterial: recommendations.pipeMaterial.value,
      calculated: true,
    };
    const { content } = getReportContent("material", data);
    const valveClassTable = buildValveClassTable({
      pipeMaterial: recommendations.pipeMaterial.value,
      serviceType: designInputs.serviceType,
      corrosionSeverity: designInputs.corrosionSeverity,
      designTemperature: designInputs.designTemperature,
      designPressure: designInputs.designPressure,
      serviceDescription: designInputs.serviceDescription,
      flangeClass: recommendations.flangeClass?.value,
    });
    const gateValve = valveClassTable.rows.find((row) => row.valveType === "Gate Valve");
    const ballValve = valveClassTable.rows.find((row) => row.valveType === "Ball Valve");

    expect(content).toContain("VALVE MATERIALS");
    expect(content).toContain(`Gate Valve: Body ${gateValve?.body}`);
    expect(content).toContain(`Trim ${gateValve?.trim}`);
    expect(content).toContain(`Ball Valve: Body ${ballValve?.body}`);
    expect(content).toContain(`Seat ${ballValve?.seat}`);
  });

  it("includes the engineering disclaimer in every generated report", () => {
    const recommendations = getRecommendations(designInputs);
    const data = {
      inputs: designInputs,
      recommendations,
      overrides: noOverrides,
      activePipeMaterial: recommendations.pipeMaterial.value,
      calculated: true,
    };
    const reportIds: ReportId[] = [
      "line-summary",
      "thickness",
      "material",
      "flange-bolt",
      "support",
      "b313-checklist",
      "audit-trail",
    ];

    for (const id of reportIds) {
      const { content, title } = getReportContent(id, data);
      expect(title).toBeTruthy();
      expect(content).toContain("DISCLAIMER");
      expect(content).toContain("Engineering decision support only");
      expect(content).toContain("does not provide certification");
      expect(content).toContain("checker sign-off");
    }
  });
});
