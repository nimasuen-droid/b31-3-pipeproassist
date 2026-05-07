import { useState, useMemo, useEffect, useRef } from "react";
import { Save, RotateCcw, Calculator, Lightbulb, Database, Shuffle, Trash2 } from "lucide-react";
import { EngineeringDisclaimer } from "../EngineeringDisclaimer";
import { LearningMoment } from "../LearningMoment";
import { ActiveProjectBar } from "../ActiveProjectBar";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { SmartInputField, SmartSelectField } from "./designInputs/SmartField";
import { TeachingPanel } from "./designInputs/TeachingPanel";
import { PIPE_MATERIALS } from "./designInputs/materialDatabase";
import { getDefaultTrace } from "@/stores/sourceRegistry";
import { useDesignInputs, defaultInputs, type DesignInputs, type OverrideKeys } from "@/stores/designInputsStore";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  convertPressure, convertTemperature, convertLength,
  BAR_TO_PSI, PSI_TO_BAR, IN_TO_MM, MM_TO_IN,
  type UnitSystem,
} from "@/lib/unitConversion";

const SAMPLE_DATA_SETS: DesignInputs[] = [
  {
    ...defaultInputs,
    projectName: "Sample – Crude Oil Transfer",
    lineNumber: "HC-101-4\"-A1A-N",
    serviceDescription: "Crude Oil Transfer from Separator to Storage",
    serviceType: "General Hydrocarbon",
    fluidPhase: "Liquid",
    pipingCategory: "Normal Fluid Service",
    designPressure: "25",
    designTemperature: "150",
    operatingPressure: "18",
    operatingTemperature: "120",
    testPressure: "37.5",
    testMedium: "Water",
    corrosionAllowance: "3",
    millTolerance: "12.5",
    jointQualityFactor: "1.0",
    weldType: "Butt Weld",
    pipeMaterial: "A106 Gr.B",
    flangeMaterial: "A105",
    fittingMaterial: "A234 WPB",
    boltMaterial: "A193 B7 / A194 2H",
    gasketType: "Spiral Wound – CGI (ASME B16.20)",
    nominalPipeSize: "4\"",
    insulationType: "None",
    insulationThickness: "",
    corrosionSeverity: "Low",
    cyclicService: "No",
    categoryM: "No",
    highPressure: "No",
    severeCyclic: "No",
    standardEdition: "ASME B31.3 – 2022",
    unitSystem: "SI",
  },
  {
    ...defaultInputs,
    projectName: "Sample – HP Steam Header",
    lineNumber: "ST-201-6\"-B2B-H",
    serviceDescription: "42 barg Superheated Steam to Turbine",
    serviceType: "High Pressure Steam",
    fluidPhase: "Gas / Vapor",
    pipingCategory: "Normal Fluid Service",
    designPressure: "45",
    designTemperature: "400",
    operatingPressure: "42",
    operatingTemperature: "380",
    testPressure: "67.5",
    testMedium: "Water",
    corrosionAllowance: "1.5",
    millTolerance: "12.5",
    jointQualityFactor: "1.0",
    weldType: "Butt Weld",
    pipeMaterial: "A335 P11",
    flangeMaterial: "A182 F11 Cl.2",
    fittingMaterial: "A234 WP11",
    boltMaterial: "A193 B16 / A194 4",
    gasketType: "Spiral Wound – Graphite (ASME B16.20)",
    nominalPipeSize: "6\"",
    insulationType: "Calcium Silicate",
    insulationThickness: "75",
    corrosionSeverity: "Low",
    cyclicService: "No",
    categoryM: "No",
    highPressure: "No",
    severeCyclic: "No",
    standardEdition: "ASME B31.3 – 2022",
    unitSystem: "SI",
  },
  {
    ...defaultInputs,
    projectName: "Sample – Cooling Water Return",
    lineNumber: "CW-301-8\"-C1A-N",
    serviceDescription: "Cooling Water Return to Cooling Tower",
    serviceType: "Cooling Water",
    fluidPhase: "Liquid",
    pipingCategory: "Normal Fluid Service",
    designPressure: "10",
    designTemperature: "65",
    operatingPressure: "6",
    operatingTemperature: "35",
    testPressure: "15",
    testMedium: "Water",
    corrosionAllowance: "3",
    millTolerance: "12.5",
    jointQualityFactor: "1.0",
    weldType: "Butt Weld",
    pipeMaterial: "A106 Gr.B",
    flangeMaterial: "A105",
    fittingMaterial: "A234 WPB",
    boltMaterial: "A193 B7 / A194 2H",
    gasketType: "Spiral Wound – CGI (ASME B16.20)",
    nominalPipeSize: "8\"",
    insulationType: "None",
    insulationThickness: "",
    corrosionSeverity: "Medium",
    cyclicService: "No",
    categoryM: "No",
    highPressure: "No",
    severeCyclic: "No",
    standardEdition: "ASME B31.3 – 2022",
    unitSystem: "SI",
  },
  {
    ...defaultInputs,
    projectName: "Sample – Sour Gas to Amine",
    lineNumber: "SS-401-3\"-D1A-M",
    serviceDescription: "Sour Gas (>50 ppm H₂S) to Amine Contactor",
    serviceType: "Corrosive / Sour Service",
    fluidPhase: "Gas / Vapor",
    pipingCategory: "Category M Fluid Service",
    designPressure: "35",
    designTemperature: "80",
    operatingPressure: "30",
    operatingTemperature: "60",
    testPressure: "52.5",
    testMedium: "Water",
    corrosionAllowance: "6",
    millTolerance: "12.5",
    jointQualityFactor: "1.0",
    weldType: "Butt Weld",
    pipeMaterial: "A106 Gr.B (NACE MR0175)",
    flangeMaterial: "A105 (NACE MR0175)",
    fittingMaterial: "A234 WPB (NACE MR0175)",
    boltMaterial: "A193 B7M / A194 2HM",
    gasketType: "Spiral Wound – Graphite (ASME B16.20)",
    nominalPipeSize: "3\"",
    insulationType: "None",
    insulationThickness: "",
    corrosionSeverity: "High",
    cyclicService: "No",
    categoryM: "Yes",
    highPressure: "No",
    severeCyclic: "No",
    standardEdition: "ASME B31.3 – 2022",
    unitSystem: "SI",
  },
  {
    ...defaultInputs,
    projectName: "Sample – Instrument Air",
    lineNumber: "IA-501-2\"-E1A-N",
    serviceDescription: "Instrument Air Distribution Header",
    serviceType: "Instrument Air",
    fluidPhase: "Gas / Vapor",
    pipingCategory: "Normal Fluid Service",
    designPressure: "10",
    designTemperature: "50",
    operatingPressure: "7",
    operatingTemperature: "35",
    testPressure: "15",
    testMedium: "Air",
    corrosionAllowance: "0",
    millTolerance: "12.5",
    jointQualityFactor: "1.0",
    weldType: "Butt Weld",
    pipeMaterial: "A106 Gr.B",
    flangeMaterial: "A105",
    fittingMaterial: "A234 WPB",
    boltMaterial: "A193 B7 / A194 2H",
    gasketType: "Spiral Wound – CGI (ASME B16.20)",
    nominalPipeSize: "2\"",
    insulationType: "None",
    insulationThickness: "",
    corrosionSeverity: "Low",
    cyclicService: "No",
    categoryM: "No",
    highPressure: "No",
    severeCyclic: "No",
    standardEdition: "ASME B31.3 – 2022",
    unitSystem: "SI",
  },
  {
    ...defaultInputs,
    projectName: "Sample – Hydrogen Service",
    lineNumber: "HY-601-3\"-F1A-H",
    serviceDescription: "Hydrogen Feed to Hydrocracker Reactor",
    serviceType: "Hydrogen Service",
    fluidPhase: "Gas / Vapor",
    pipingCategory: "Normal Fluid Service",
    designPressure: "170",
    designTemperature: "350",
    operatingPressure: "155",
    operatingTemperature: "320",
    testPressure: "255",
    testMedium: "Water",
    corrosionAllowance: "1.5",
    millTolerance: "12.5",
    jointQualityFactor: "1.0",
    weldType: "Butt Weld",
    pipeMaterial: "A335 P11",
    flangeMaterial: "A182 F11 Cl.2",
    fittingMaterial: "A234 WP11",
    boltMaterial: "A193 B7 / A194 2H",
    gasketType: "Spiral Wound – Graphite (ASME B16.20)",
    nominalPipeSize: "3\"",
    insulationType: "Mineral Wool",
    insulationThickness: "50",
    corrosionSeverity: "Low",
    cyclicService: "No",
    categoryM: "No",
    highPressure: "Yes",
    severeCyclic: "No",
    standardEdition: "ASME B31.3 – 2022",
    unitSystem: "SI",
  },
];

const SERVICE_TYPE_OPTIONS = [
  "General Hydrocarbon",
  "Corrosive / Sour Service",
  "High Pressure Steam",
  "Low Pressure Steam",
  "Cooling Water",
  "Instrument Air",
  "Hydrogen Service",
  "Oxygen Service",
  "Cryogenic Service",
  "High Temperature (>425°C)",
  "Chloride / Caustic",
];

function InputField({ label, value, onChange, type = "text", placeholder, unit }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; unit?: string;
}) {
  return (
    <div>
      <label className="eng-label block mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} className="eng-input" />
        {unit && <span className="text-[10px] text-muted-foreground w-10 shrink-0 text-right">{unit}</span>}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <label className="eng-label block mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="eng-select">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function DesignInputsModule() {
  const {
    inputs, setInputs, update, overrides, setOverrides, toggleOverride,
    recommendations, activePipeMaterial, calculated, setCalculated,
  } = useDesignInputs();
  const { selectedProject } = useSelectedProject();
  const { markSampleLoaded, clearSampleMode, recordDemoRun, isPaid, demoRunsRemaining, demoRunsLimit } = useEntitlements();
  const [showTeaching, setShowTeaching] = useState(false);
  const [showFloatingCalc, setShowFloatingCalc] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Show the floating Calculate FAB once the top quick-actions bar scrolls
  // out of view. Uses IntersectionObserver against the nearest scroll container.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowFloatingCalc(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handlePipeMaterialChange = (value: string) => {
    setInputs(prev => ({ ...prev, pipeMaterial: value }));
    setOverrides(prev => ({
      ...prev,
      flangeMaterial: false,
      fittingMaterial: false,
      boltMaterial: false,
      gasketType: false,
    }));
  };

  const traces = useMemo(() => {
    const r = recommendations;
    return {
      pipeMaterial: getDefaultTrace("Pipe Material", r.pipeMaterial.value, r.pipeMaterial, overrides.pipeMaterial),
      flangeMaterial: getDefaultTrace("Flange Material", r.flangeMaterial.value, r.flangeMaterial, overrides.flangeMaterial),
      fittingMaterial: getDefaultTrace("Fitting Material", r.fittingMaterial.value, r.fittingMaterial, overrides.fittingMaterial),
      boltMaterial: getDefaultTrace("Bolt Material", r.boltMaterial.value, r.boltMaterial, overrides.boltMaterial),
      gasketType: getDefaultTrace("Gasket Type", r.gasketType.value, r.gasketType, overrides.gasketType),
      corrosionAllowance: getDefaultTrace("Corrosion Allowance", r.corrosionAllowance.value, r.corrosionAllowance, overrides.corrosionAllowance),
      millTolerance: getDefaultTrace("Mill Tolerance", r.millTolerance.value + "%", r.millTolerance, overrides.millTolerance),
      jointQualityFactor: getDefaultTrace("Joint Quality Factor (Ej)", r.jointQualityFactor.value, r.jointQualityFactor, overrides.jointQualityFactor),
      testPressure: getDefaultTrace("Test Pressure", r.testPressure.value || "–", r.testPressure, overrides.testPressure),
      testMedium: getDefaultTrace("Test Medium", r.testMedium.value, r.testMedium, overrides.testMedium),
    };
  }, [recommendations, overrides]);

  const pressureUnit = inputs.unitSystem === "SI" ? "barg" : "psig";
  const tempUnit = inputs.unitSystem === "SI" ? "°C" : "°F";
  const lengthUnit = inputs.unitSystem === "SI" ? "mm" : "in";

  const handleUnitChange = (newUnit: string) => {
    const oldUnit = inputs.unitSystem;
    if (oldUnit === newUnit) return;

    const fromUS = oldUnit as UnitSystem;
    const toUS = newUnit as UnitSystem;

    const conv = (val: string, factor: number, decimals = 1): string => {
      const n = parseFloat(val);
      if (isNaN(n) || val.trim() === "") return val;
      return (n * factor).toFixed(decimals);
    };

    // Pressure: barg ↔ psig (1 bar = 14.5038 psi)
    const pFactor = fromUS === "SI" ? BAR_TO_PSI : PSI_TO_BAR;
    // Temperature: °C ↔ °F
    const toTemp = (val: string): string => {
      const n = parseFloat(val);
      if (isNaN(n) || val.trim() === "") return val;
      return convertTemperature(n, fromUS, toUS).toFixed(1);
    };
    // Length: mm ↔ inches
    const lFactor = fromUS === "SI" ? MM_TO_IN : IN_TO_MM;

    setInputs(prev => ({
      ...prev,
      unitSystem: newUnit,
      designPressure: conv(prev.designPressure, pFactor, 2),
      operatingPressure: conv(prev.operatingPressure, pFactor, 2),
      testPressure: conv(prev.testPressure, pFactor, 2),
      designTemperature: toTemp(prev.designTemperature),
      operatingTemperature: toTemp(prev.operatingTemperature),
      corrosionAllowance: conv(prev.corrosionAllowance, lFactor, 2),
      insulationThickness: conv(prev.insulationThickness, lFactor, 1),
    }));
  };

  const handleCalculate = () => {
    if (!isPaid) {
      const ok = recordDemoRun();
      if (!ok) {
        // Out of demo runs — still allow the calc to flip but the gated tabs will block.
      }
    }
    setCalculated(true);
    setShowTeaching(true);
  };

  const defaultOverrides: Record<OverrideKeys, boolean> = {
    pipeMaterial: false, flangeMaterial: false, fittingMaterial: false,
    boltMaterial: false, gasketType: false, corrosionAllowance: false,
    millTolerance: false, jointQualityFactor: false, testPressure: false, testMedium: false,
  };

  const loadSampleData = () => {
    const sample = SAMPLE_DATA_SETS[Math.floor(Math.random() * SAMPLE_DATA_SETS.length)];
    setInputs(sample);
    setOverrides(defaultOverrides);
    setCalculated(false);
    setShowTeaching(false);
    markSampleLoaded(sample);
  };

  const clearAllFields = () => {
    setInputs(defaultInputs);
    setOverrides(defaultOverrides);
    setCalculated(false);
    setShowTeaching(false);
    clearSampleMode();
  };

  return (
    <div className="space-y-4">
      <ActiveProjectBar />
      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30">
        <button onClick={loadSampleData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <Shuffle className="h-3.5 w-3.5" /> Load Sample Data
        </button>
        <button onClick={clearAllFields}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
          <Trash2 className="h-3.5 w-3.5" /> Clear All Fields
        </button>
        {!isPaid && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
            {Number.isFinite(demoRunsLimit)
              ? `Reference workflow · ${demoRunsRemaining}/${demoRunsLimit} runs left`
              : "Reference workflow · Unlimited dataset runs"}
          </span>
        )}
        <span className={`text-[10px] text-muted-foreground hidden sm:inline ${!isPaid ? "" : "ml-auto"}`}>Load sample data → Calculate → review recommendations</span>
      </div>
      {/* Sentinel: when this scrolls out of view, the floating Calculate FAB appears */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Design Basis & Inputs</h2>
          <p className="text-sm text-muted-foreground">Materials auto-cascade from pipe selection • {PIPE_MATERIALS.length} pipe specs loaded</p>
        </div>
        <div className="flex items-center gap-2">
          <SelectField label="" value={inputs.unitSystem} onChange={handleUnitChange} options={["SI", "Imperial"]} />
          <button onClick={clearAllFields} className="p-2 text-muted-foreground hover:text-foreground" title="Reset">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Project Identification */}
      <div className="eng-card">
        <div className="eng-label mb-3">Project Identification</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InputField
            label={selectedProject ? "Active Project Name (edit to rename on save)" : "Project Name (used when creating new project)"}
            value={inputs.projectName}
            onChange={update("projectName")}
            placeholder={selectedProject ? selectedProject.name : "Enter project name"}
          />
          <InputField label="Line Number" value={inputs.lineNumber} onChange={update("lineNumber")} placeholder='e.g. 6"-HC-1001-A1A-N' />
          <InputField label="Service Description" value={inputs.serviceDescription} onChange={update("serviceDescription")} placeholder="e.g. Crude Oil Transfer" />
        </div>
      </div>

      {/* Service Classification */}
      <div className="eng-card">
        <div className="eng-label mb-3">Service Classification</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <SelectField label="Service Type" value={inputs.serviceType} onChange={update("serviceType")} options={SERVICE_TYPE_OPTIONS} />
          <SelectField label="Fluid Phase" value={inputs.fluidPhase} onChange={update("fluidPhase")} options={["Liquid", "Gas", "Two-Phase", "Steam", "Slurry"]} />
          <SelectField label="Piping Category" value={inputs.pipingCategory} onChange={update("pipingCategory")} options={["Normal Fluid Service", "Category D Fluid Service", "Category M Fluid Service", "High Pressure Piping", "Elevated Temperature"]} />
          <SelectField label="Category M" value={inputs.categoryM} onChange={update("categoryM")} options={["No", "Yes"]} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
          <SelectField label="High Pressure" value={inputs.highPressure} onChange={update("highPressure")} options={["No", "Yes"]} />
          <SelectField label="Cyclic Service" value={inputs.cyclicService} onChange={update("cyclicService")} options={["No", "Yes"]} />
          <SelectField label="Severe Cyclic" value={inputs.severeCyclic} onChange={update("severeCyclic")} options={["No", "Yes"]} />
          <SelectField label="Corrosion Severity" value={inputs.corrosionSeverity} onChange={update("corrosionSeverity")} options={["Low", "Moderate", "Severe"]} />
        </div>

        {/* Structural minimum wall thickness safeguard */}
        <div className="mt-3 p-3 rounded-md border border-border bg-muted/20">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={inputs.applyStructuralMinimum === "Yes"}
              onChange={(e) => update("applyStructuralMinimum")(e.target.checked ? "Yes" : "No")}
              className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer"
            />
            <div className="flex-1">
              <div className="text-xs font-semibold text-foreground">
                Apply minimum wall thickness / structural integrity check
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Keeps selected pipe wall thickness practical for handling, fabrication, installation,
                vibration tolerance, and robustness. This is an engineering safeguard, not a direct
                ASME B31.3 fixed minimum.
              </p>
              {inputs.applyStructuralMinimum === "Yes" && (
                <div className="mt-2 text-[10px] text-muted-foreground">
                  <span className="font-semibold text-foreground/80">Default minima:</span>{" "}
                  NPS ½–1: 1.5 mm · NPS 1½–2: 2.0 mm · NPS 3–6: 2.5 mm · NPS 8+: 3.0 mm
                  <p className="mt-1 text-amber-500/90">
                    ⚠ Practical robustness safeguard only. Final wall schedule must still comply with
                    ASME B31.3 pressure design, ASME B36.10M/B36.19M available schedules, project
                    specifications, corrosion allowance, and mechanical load checks.
                  </p>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Design Conditions */}
      <div className="eng-card">
        <div className="eng-label mb-3">Design Conditions</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <InputField label="Design Pressure" value={inputs.designPressure} onChange={update("designPressure")} type="number" placeholder="0.0" unit={pressureUnit} />
          <InputField label="Design Temperature" value={inputs.designTemperature} onChange={update("designTemperature")} type="number" placeholder="0.0" unit={tempUnit} />
          <InputField label="Operating Pressure" value={inputs.operatingPressure} onChange={update("operatingPressure")} type="number" placeholder="0.0" unit={pressureUnit} />
          <InputField label="Operating Temperature" value={inputs.operatingTemperature} onChange={update("operatingTemperature")} type="number" placeholder="0.0" unit={tempUnit} />
        </div>
      </div>

      {/* Auto-Populated from Source Tables */}
      {(recommendations.allowableStress || recommendations.flangeClass || recommendations.pipeOD) && (
        <div className="eng-card border-primary/20 bg-primary/5">
          <div className="eng-label mb-3 flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-primary" />
            Source Table Lookups <span className="text-primary text-[9px] ml-1">Auto-populated from ASME/ASTM data</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendations.allowableStress && (
              <div className="p-2.5 rounded border border-border bg-background">
                <div className="text-[10px] text-muted-foreground mb-0.5">Allowable Stress (S)</div>
                <div className="text-sm font-mono font-semibold text-foreground">{recommendations.allowableStress.displayValue}</div>
                <div className="text-[9px] text-muted-foreground mt-1 leading-relaxed">{recommendations.allowableStress.reason}</div>
                <div className="text-[9px] font-mono text-primary mt-0.5">{recommendations.allowableStress.tableRef}</div>
                {recommendations.allowableStress.interpolated && (
                  <div className="text-[9px] text-amber-600 mt-0.5">⚠ Interpolated value</div>
                )}
              </div>
            )}
            {recommendations.flangeClass && (
              <div className="p-2.5 rounded border border-border bg-background">
                <div className="text-[10px] text-muted-foreground mb-0.5">Minimum Flange Class</div>
                <div className={`text-sm font-mono font-semibold ${recommendations.flangeClass.value === "EXCEEDS" ? "text-destructive" : "text-foreground"}`}>
                  {recommendations.flangeClass.displayValue}
                </div>
                <div className="text-[9px] text-muted-foreground mt-1 leading-relaxed">{recommendations.flangeClass.reason}</div>
                <div className="text-[9px] font-mono text-primary mt-0.5">{recommendations.flangeClass.tableRef}</div>
              </div>
            )}
            {recommendations.pipeOD && (
              <div className="p-2.5 rounded border border-border bg-background">
                <div className="text-[10px] text-muted-foreground mb-0.5">Pipe OD (NPS {inputs.nominalPipeSize})</div>
                <div className="text-sm font-mono font-semibold text-foreground">{recommendations.pipeOD.displayValue}</div>
                <div className="text-[9px] text-muted-foreground mt-1">{recommendations.pipeOD.reason}</div>
                <div className="text-[9px] font-mono text-primary mt-0.5">{recommendations.pipeOD.tableRef}</div>
                {recommendations.availableSchedules.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {recommendations.availableSchedules.map(s => (
                      <span key={s.schedule} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary border border-border font-mono">
                        Sch {s.schedule}: {s.thickness_mm}mm
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Conditions */}
      <div className="eng-card">
        <div className="eng-label mb-3">Test Conditions <span className="text-primary text-[9px] ml-1">Auto-calculated</span></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <SmartInputField label="Test Pressure" value={inputs.testPressure} recommendedValue={recommendations.testPressure.value} isOverridden={overrides.testPressure} onToggleOverride={() => toggleOverride("testPressure")} onChange={update("testPressure")} type="number" placeholder="0.0" unit={pressureUnit} trace={traces.testPressure} />
          <SmartSelectField label="Test Medium" value={inputs.testMedium} recommendedValue={recommendations.testMedium.value} isOverridden={overrides.testMedium} onToggleOverride={() => toggleOverride("testMedium")} onChange={update("testMedium")} options={["Water", "Air", "Nitrogen", "Other"]} trace={traces.testMedium} />
        </div>
      </div>

      {/* Allowances & Factors */}
      <div className="eng-card">
        <div className="eng-label mb-3">Allowances & Factors <span className="text-primary text-[9px] ml-1">Auto-recommended</span></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <SmartInputField label="Corrosion Allowance" value={inputs.corrosionAllowance} recommendedValue={recommendations.corrosionAllowance.value} isOverridden={overrides.corrosionAllowance} onToggleOverride={() => toggleOverride("corrosionAllowance")} onChange={update("corrosionAllowance")} type="number" placeholder="0.0" unit={lengthUnit} trace={traces.corrosionAllowance} />
          <SmartInputField label="Mill Tolerance (%)" value={inputs.millTolerance} recommendedValue={recommendations.millTolerance.value} isOverridden={overrides.millTolerance} onToggleOverride={() => toggleOverride("millTolerance")} onChange={update("millTolerance")} type="number" placeholder="12.5" unit="%" trace={traces.millTolerance} />
          <SmartInputField label="Joint Quality Factor (Ej)" value={inputs.jointQualityFactor} recommendedValue={recommendations.jointQualityFactor.value} isOverridden={overrides.jointQualityFactor} onToggleOverride={() => toggleOverride("jointQualityFactor")} onChange={update("jointQualityFactor")} type="number" placeholder="1.0" trace={traces.jointQualityFactor} />
          <SelectField label="Weld Type" value={inputs.weldType} onChange={update("weldType")} options={["Butt Weld", "Socket Weld", "Fillet Weld", "ERW", "Seamless"]} />
        </div>
      </div>

      {/* Materials */}
      <div className="eng-card">
        <div className="flex items-center justify-between mb-3">
          <div className="eng-label">Materials <span className="text-primary text-[9px] ml-1">Sourced from ASME/ASTM standards</span></div>
          {activePipeMaterial && (
            <span className="text-[10px] text-muted-foreground">
              Cascading from: <span className="text-foreground font-mono">{activePipeMaterial}</span>
            </span>
          )}
        </div>

        <div className="mb-4 p-3 rounded border border-primary/20 bg-primary/5">
          <div className="text-[10px] text-primary font-medium mb-2">▸ PRIMARY — Changing pipe material will update all dependent materials</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SmartSelectField
              label="Pipe Material"
              value={inputs.pipeMaterial}
              recommendedValue={recommendations.pipeMaterial.value}
              isOverridden={overrides.pipeMaterial}
              onToggleOverride={() => toggleOverride("pipeMaterial")}
              onChange={handlePipeMaterialChange}
              options={recommendations.pipeMaterial.options}
              confidence={recommendations.pipeMaterial.confidence}
              trace={traces.pipeMaterial}
              classifiedOptions={recommendations.pipeMaterial.classifiedOptions}
            />
            <div className="flex items-end pb-1">
              <div className="text-[10px] text-muted-foreground leading-relaxed">
                {(() => {
                  const spec = PIPE_MATERIALS.find(p => p.designation === activePipeMaterial);
                  return spec ? (
                    <span>
                      <span className="text-foreground font-medium">{spec.description}</span><br />
                      Range: {spec.minTempC}°C to {spec.maxTempC}°C • {spec.standard}<br />
                      <span className="font-mono text-[9px]">{spec.source}</span>
                    </span>
                  ) : "Select a pipe material to see details";
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SmartSelectField label="Flange Material" value={inputs.flangeMaterial} recommendedValue={recommendations.flangeMaterial.value} isOverridden={overrides.flangeMaterial} onToggleOverride={() => toggleOverride("flangeMaterial")} onChange={update("flangeMaterial")} options={recommendations.flangeMaterial.options} confidence={recommendations.flangeMaterial.confidence} trace={traces.flangeMaterial} classifiedOptions={recommendations.flangeMaterial.classifiedOptions} />
          <SmartSelectField label="Fitting Material" value={inputs.fittingMaterial} recommendedValue={recommendations.fittingMaterial.value} isOverridden={overrides.fittingMaterial} onToggleOverride={() => toggleOverride("fittingMaterial")} onChange={update("fittingMaterial")} options={recommendations.fittingMaterial.options} confidence={recommendations.fittingMaterial.confidence} trace={traces.fittingMaterial} classifiedOptions={recommendations.fittingMaterial.classifiedOptions} />
          <SmartSelectField label="Bolt Material" value={inputs.boltMaterial} recommendedValue={recommendations.boltMaterial.value} isOverridden={overrides.boltMaterial} onToggleOverride={() => toggleOverride("boltMaterial")} onChange={update("boltMaterial")} options={recommendations.boltMaterial.options} confidence={recommendations.boltMaterial.confidence} trace={traces.boltMaterial} classifiedOptions={recommendations.boltMaterial.classifiedOptions} />
          <SmartSelectField label="Gasket Type / Material" value={inputs.gasketType} recommendedValue={recommendations.gasketType.value} isOverridden={overrides.gasketType} onToggleOverride={() => toggleOverride("gasketType")} onChange={update("gasketType")} options={recommendations.gasketType.options} confidence={recommendations.gasketType.confidence} trace={traces.gasketType} classifiedOptions={recommendations.gasketType.classifiedOptions} />
        </div>
      </div>

      {/* Pipe Size */}
      <div className="eng-card">
        <div className="eng-label mb-3">Pipe Size & Configuration</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <SelectField label="Nominal Pipe Size (NPS)" value={inputs.nominalPipeSize} onChange={update("nominalPipeSize")} options={['1/4"', '1/2"', '1"', '1.5"', '2"', '3"', '4"', '6"', '8"', '10"', '12"', '14"', '16"', '18"', '20"', '24"']} />
          <SelectField label="Branch Type" value={inputs.branchType} onChange={update("branchType")} options={["None", "Tee", "Weldolet", "Sockolet", "Threadolet", "Elbolet", "Lateral"]} />
        </div>
      </div>

      {/* Insulation */}
      <div className="eng-card">
        <div className="eng-label mb-3">Insulation & Support</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <SelectField label="Insulation Type" value={inputs.insulationType} onChange={update("insulationType")} options={["None", "Hot Insulation", "Cold Insulation", "Personnel Protection", "Acoustic"]} />
          <InputField label="Insulation Thickness" value={inputs.insulationThickness} onChange={update("insulationThickness")} type="number" placeholder="0.0" unit={lengthUnit} />
          <InputField label="Support Spacing" value={inputs.supportSpacing} onChange={update("supportSpacing")} placeholder="Per company standard" />
        </div>
      </div>

      {/* Standard */}
      <div className="eng-card">
        <div className="eng-label mb-3">Standard & Specification</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InputField label="Standard Edition" value={inputs.standardEdition} onChange={update("standardEdition")} placeholder="e.g. ASME B31.3-2022" />
          <SelectField label="Company Spec Override" value={inputs.companySpecOverride} onChange={update("companySpecOverride")} options={["No", "Yes"]} />
        </div>
      </div>

      {/* Calculate */}
      <div className="flex items-center gap-3">
        <button onClick={handleCalculate} className="bg-sky-700 text-white px-6 py-2.5 rounded text-sm font-semibold flex items-center gap-2 hover:bg-sky-800 transition-colors">
          <Calculator className="h-4 w-4" />
          Calculate & Recommend
        </button>
        <button onClick={() => setShowTeaching(!showTeaching)} className={`px-4 py-2.5 rounded text-sm font-medium flex items-center gap-2 transition-colors border ${showTeaching ? "border-accent text-accent bg-accent/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
          <Lightbulb className="h-4 w-4" />
          {showTeaching ? "Hide" : "Show"} Rationale
        </button>
      </div>

      <TeachingPanel recommendations={recommendations} visible={showTeaching && calculated} />

      <div className="flex items-center justify-between">
        <LearningMoment
          title="Why these inputs matter"
          principle="Every downstream recommendation — material, schedule, flange class, supports — flows from this design basis. Design pressure and temperature define the worst credible operating condition (not normal operation), with margin for upsets. Fluid service category (Normal, Category M, High Pressure, Severe Cyclic) decides which sections of B31.3 apply and how strict the rules become. Get this page wrong and every calculation downstream inherits the error."
          reference="ASME B31.3 §301 Design Conditions • §300.2 Definitions"
        />
        <EngineeringDisclaimer />
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0 ml-3">
          <Save className="h-4 w-4" />
          Save Design Basis
        </button>
      </div>

      {/* Floating Calculate FAB — appears once the top quick-actions bar
          scrolls out of view, so users don't have to scroll back up. */}
      <button
        onClick={handleCalculate}
        aria-label="Calculate and recommend"
        title="Calculate & Recommend"
        className={`fixed right-4 md:right-6 bottom-[calc(env(safe-area-inset-bottom)+148px)] md:bottom-20 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-sky-700 text-white text-sm font-semibold shadow-lg shadow-sky-900/30 ring-1 ring-sky-500/40 hover:bg-sky-800 transition-all duration-200 ${
          showFloatingCalc ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <Calculator className="h-4 w-4" />
        <span className="hidden sm:inline">Calculate</span>
      </button>
    </div>
  );
}
