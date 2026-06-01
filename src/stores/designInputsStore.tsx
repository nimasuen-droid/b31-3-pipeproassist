import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { getRecommendations, type Recommendations } from "@/components/modules/designInputs/recommendationEngine";

export interface DesignInputs {
  projectName: string;
  lineNumber: string;
  serviceDescription: string;
  serviceType: string;
  specialService: string;
  fluidPhase: string;
  pipingCategory: string;
  designPressure: string;
  designTemperature: string;
  operatingPressure: string;
  operatingTemperature: string;
  testPressure: string;
  testMedium: string;
  corrosionAllowance: string;
  millTolerance: string;
  jointQualityFactor: string;
  weldType: string;
  pipeMaterial: string;
  flangeMaterial: string;
  fittingMaterial: string;
  boltMaterial: string;
  gasketType: string;
  nominalPipeSize: string;
  branchType: string;
  insulationType: string;
  insulationThickness: string;
  supportSpacing: string;
  corrosionSeverity: string;
  cyclicService: string;
  categoryM: string;
  highPressure: string;
  severeCyclic: string;
  standardEdition: string;
  companySpecOverride: string;
  unitSystem: string;
  /** Apply project/company structural minimum wall thickness check
   *  (handling, fabrication, vibration robustness safeguard). Default: "Yes". */
  applyStructuralMinimum: string;
}

export const defaultInputs: DesignInputs = {
  projectName: "", lineNumber: "", serviceDescription: "", serviceType: "General Hydrocarbon", specialService: "Process",
  fluidPhase: "Liquid",
  pipingCategory: "Normal Fluid Service", designPressure: "", designTemperature: "",
  operatingPressure: "", operatingTemperature: "", testPressure: "", testMedium: "Water",
  corrosionAllowance: "", millTolerance: "12.5", jointQualityFactor: "1.0",
  weldType: "Butt Weld", pipeMaterial: "", flangeMaterial: "", fittingMaterial: "",
  boltMaterial: "", gasketType: "", nominalPipeSize: '6"', branchType: "None",
  insulationType: "None", insulationThickness: "", supportSpacing: "",
  corrosionSeverity: "Low", cyclicService: "No", categoryM: "No",
  highPressure: "No", severeCyclic: "No", standardEdition: "", companySpecOverride: "No",
  unitSystem: "SI", applyStructuralMinimum: "Yes",
};

export type OverrideKeys = "pipeMaterial" | "flangeMaterial" | "fittingMaterial" | "boltMaterial" | "gasketType" | "corrosionAllowance" | "millTolerance" | "jointQualityFactor" | "testPressure" | "testMedium";

/** Tracks the origin of the current working state */
export interface SessionSource {
  type: "unsaved" | "project" | "spec";
  name: string;
  id?: string;
  dirty?: boolean;
}

interface DesignInputsContextType {
  inputs: DesignInputs;
  setInputs: React.Dispatch<React.SetStateAction<DesignInputs>>;
  update: (key: keyof DesignInputs) => (value: string) => void;
  overrides: Record<OverrideKeys, boolean>;
  setOverrides: React.Dispatch<React.SetStateAction<Record<OverrideKeys, boolean>>>;
  toggleOverride: (key: OverrideKeys) => void;
  recommendations: Recommendations;
  activePipeMaterial: string;
  calculated: boolean;
  setCalculated: React.Dispatch<React.SetStateAction<boolean>>;
  sessionSource: SessionSource;
  setSessionSource: React.Dispatch<React.SetStateAction<SessionSource>>;
}

const DesignInputsContext = createContext<DesignInputsContextType | null>(null);

const defaultOverrides: Record<OverrideKeys, boolean> = {
  pipeMaterial: false, flangeMaterial: false, fittingMaterial: false,
  boltMaterial: false, gasketType: false, corrosionAllowance: false,
  millTolerance: false, jointQualityFactor: false, testPressure: false, testMedium: false,
};

export function DesignInputsProvider({ children }: { children: React.ReactNode }) {
  // Persist working session locally so a refresh / reopen restores all inputs.
  // Bump the version when DesignInputs shape changes incompatibly.
  const [inputs, setInputs] = useLocalStorage<DesignInputs>("session:inputs", defaultInputs, 3);
  const [overrides, setOverrides] = useLocalStorage<Record<OverrideKeys, boolean>>(
    "session:overrides",
    { ...defaultOverrides },
    2,
  );
  const [calculated, setCalculated] = useLocalStorage<boolean>("session:calculated", false, 2);
  const [sessionSource, setSessionSource] = useLocalStorage<SessionSource>(
    "session:source",
    { type: "unsaved", name: "New Session" },
    2,
  );

  const update = (key: keyof DesignInputs) => (value: string) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const toggleOverride = (key: OverrideKeys) =>
    setOverrides((prev) => ({ ...prev, [key]: !prev[key] }));

  const recommendations = useMemo(() => getRecommendations({
    ...inputs,
    serviceType: inputs.serviceType,
    pipeMaterial: overrides.pipeMaterial ? inputs.pipeMaterial : "",
    nominalPipeSize: inputs.nominalPipeSize,
  }), [inputs, overrides.pipeMaterial]);

  const activePipeMaterial = overrides.pipeMaterial ? inputs.pipeMaterial : recommendations.pipeMaterial.value;

  return (
    <DesignInputsContext.Provider value={{
      inputs, setInputs, update, overrides, setOverrides, toggleOverride,
      recommendations, activePipeMaterial, calculated, setCalculated,
      sessionSource, setSessionSource,
    }}>
      {children}
    </DesignInputsContext.Provider>
  );
}

export function useDesignInputs() {
  const ctx = useContext(DesignInputsContext);
  if (!ctx) throw new Error("useDesignInputs must be used within DesignInputsProvider");
  return ctx;
}
