import { useState, useMemo } from "react";
import {
  CheckCircle2, XCircle, AlertTriangle, HelpCircle, AlertOctagon,
  MessageSquare, ChevronDown, ChevronRight, Lock, Unlock, RefreshCw
} from "lucide-react";
import { EngineeringDisclaimer } from "../EngineeringDisclaimer";
import { LearningMoment } from "../LearningMoment";
import { ReferenceBadge } from "@/components/ReferenceBadge";
import { useDesignInputs } from "@/stores/designInputsStore";
import { runComplianceChecks, type ComplianceCheck, type CheckStatus } from "@/components/modules/designInputs/complianceCheckEngine";
import type { CalculationTrace } from "@/stores/sourceRegistry";

interface CheckOverride {
  status?: CheckStatus;
  comment?: string;
}

function makeCheckTrace(check: ComplianceCheck): CalculationTrace {
  return {
    fieldName: check.item,
    appliedValue: check.detail,
    sourceOrigin: "default-rule",
    standard: check.source.split("§")[0].trim(),
    sectionRef: check.reference,
    whySelected: check.detail,
    assumptions: [`Auto-evaluated from project design inputs`],
    warnings: check.status === "fail" || check.status === "warning" ? [check.detail] : [],
    confidenceLevel: "default-rule",
    overrideStatus: "recommended",
  };
}

const StatusIcon = ({ status }: { status: CheckStatus }) => {
  switch (status) {
    case "pass": return <CheckCircle2 className="h-4 w-4 text-success shrink-0" />;
    case "fail": return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
    case "review": return <AlertTriangle className="h-4 w-4 text-accent shrink-0" />;
    case "warning": return <AlertOctagon className="h-4 w-4 text-amber-500 shrink-0" />;
    case "missing": return <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
};

const statusLabel = (s: CheckStatus) => {
  switch (s) {
    case "pass": return "Pass";
    case "fail": return "Fail";
    case "review": return "Review";
    case "warning": return "Warning";
    case "missing": return "Missing";
  }
};

const statusColor = (s: CheckStatus) => {
  switch (s) {
    case "pass": return "text-success";
    case "fail": return "text-destructive";
    case "review": return "text-accent";
    case "warning": return "text-amber-500";
    case "missing": return "text-muted-foreground";
  }
};

/** Maps compliance input field names to readable labels */
const INPUT_FIELD_LABELS: Record<string, string> = {
  designPressure: "Design Pressure",
  designTemperature: "Design Temperature",
  operatingPressure: "Operating Pressure",
  operatingTemperature: "Operating Temperature",
  testPressure: "Test Pressure",
  pipeMaterial: "Pipe Material",
  flangeMaterial: "Flange Material",
  fittingMaterial: "Fitting Material",
  boltMaterial: "Bolt Material",
  gasketType: "Gasket Type",
  corrosionAllowance: "Corrosion Allowance",
  corrosionSeverity: "Corrosion Severity",
  millTolerance: "Mill Tolerance (%)",
  jointQualityFactor: "Joint Quality Factor (Ej)",
  weldType: "Weld Type",
  categoryM: "Category M Service",
  highPressure: "High Pressure (Ch. IX)",
  severeCyclic: "Severe Cyclic Conditions",
  cyclicService: "Cyclic Service",
  fluidPhase: "Fluid Phase",
  serviceDescription: "Service Description",
  unitSystem: "Unit System",
};

export function DesignChecksModule() {
  const { inputs, activePipeMaterial, overrides, recommendations, calculated } = useDesignInputs();
  const [checkOverrides, setCheckOverrides] = useState<Record<string, CheckOverride>>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Build the effective inputs for compliance checks
  const effectiveInputs = useMemo(() => ({
    designPressure: inputs.designPressure,
    designTemperature: inputs.designTemperature,
    operatingPressure: inputs.operatingPressure,
    operatingTemperature: inputs.operatingTemperature,
    testPressure: inputs.testPressure,
    pipeMaterial: activePipeMaterial,
    flangeMaterial: overrides.flangeMaterial ? inputs.flangeMaterial : recommendations.flangeMaterial?.value || "",
    fittingMaterial: overrides.fittingMaterial ? inputs.fittingMaterial : recommendations.fittingMaterial?.value || "",
    boltMaterial: overrides.boltMaterial ? inputs.boltMaterial : recommendations.boltMaterial?.value || "",
    gasketType: overrides.gasketType ? inputs.gasketType : recommendations.gasketType?.value || "",
    corrosionAllowance: overrides.corrosionAllowance ? inputs.corrosionAllowance : recommendations.corrosionAllowance?.value || "",
    millTolerance: overrides.millTolerance ? inputs.millTolerance : recommendations.millTolerance?.value || "12.5",
    jointQualityFactor: overrides.jointQualityFactor ? inputs.jointQualityFactor : recommendations.jointQualityFactor?.value || "1.0",
    weldType: inputs.weldType,
    categoryM: inputs.categoryM,
    highPressure: inputs.highPressure,
    severeCyclic: inputs.severeCyclic,
    cyclicService: inputs.cyclicService,
    corrosionSeverity: inputs.corrosionSeverity,
    fluidPhase: inputs.fluidPhase,
    serviceDescription: inputs.serviceDescription,
    unitSystem: inputs.unitSystem,
  }), [inputs, activePipeMaterial, overrides, recommendations]);

  // Run compliance checks automatically
  const complianceResult = useMemo(() => runComplianceChecks(effectiveInputs), [effectiveInputs]);

  // Merge auto-evaluated results with engineer overrides
  const mergedChecks = useMemo(() =>
    complianceResult.checks.map(check => {
      const ov = checkOverrides[check.id];
      return {
        ...check,
        autoStatus: check.status,
        status: ov?.status ?? check.status,
        comment: ov?.comment ?? "",
        isOverridden: !!ov?.status,
      };
    }),
  [complianceResult.checks, checkOverrides]);

  const counts = useMemo(() => {
    const c = { pass: 0, fail: 0, review: 0, warning: 0, missing: 0 };
    mergedChecks.forEach(ch => c[ch.status]++);
    return c;
  }, [mergedChecks]);

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const overrideStatus = (id: string, status: CheckStatus) => {
    setCheckOverrides(prev => ({ ...prev, [id]: { ...prev[id], status } }));
  };

  const setComment = (id: string, comment: string) => {
    setCheckOverrides(prev => ({ ...prev, [id]: { ...prev[id], comment } }));
  };

  const resetOverride = (id: string) => {
    setCheckOverrides(prev => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id].status;
        if (!next[id].comment) delete next[id];
      }
      return next;
    });
  };

  /** Parse comma-separated input field names from a check */
  const getInputFields = (inputsStr: string): string[] =>
    inputsStr.split(",").map(s => s.trim()).filter(Boolean);

  const getInputValue = (field: string): string => {
    const val = (effectiveInputs as Record<string, string>)[field];
    return val || "—";
  };

  const isDataLoaded = calculated || !!inputs.designPressure;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">B31.3 Design Review Checks</h2>
        <p className="text-sm text-muted-foreground">
          Auto-evaluated from project inputs and calculations - review each item before engineering use
        </p>
      </div>

      {!isDataLoaded && (
        <div className="eng-card border-accent/40 bg-accent/5 p-3">
          <p className="text-sm text-accent flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Enter design inputs and calculate to auto-populate design review checks.
          </p>
        </div>
      )}

      {/* Summary counters */}
      <div className="grid grid-cols-5 gap-3">
        {(["pass", "fail", "warning", "review", "missing"] as CheckStatus[]).map(s => (
          <div key={s} className="eng-card text-center py-2">
            <div className={`text-xl font-mono font-bold ${statusColor(s)}`}>{counts[s]}</div>
            <div className="eng-label">{statusLabel(s)}</div>
          </div>
        ))}
      </div>

      {/* Checks table */}
      <div className="eng-card overflow-x-auto">
        <table className="eng-table w-full">
          <thead>
            <tr>
              <th className="w-6"></th>
              <th className="w-16">ID</th>
              <th>Check Item</th>
              <th className="w-40">Reference</th>
              <th className="w-24">Auto</th>
              <th className="w-32">Status</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {mergedChecks.map((check) => {
              const expanded = expandedRows.has(check.id);
              const inputFields = getInputFields(check.inputs);
              return (
                <>
                  <tr
                    key={check.id}
                    className="group cursor-pointer hover:bg-muted/30"
                    onClick={() => toggleExpand(check.id)}
                  >
                    <td className="text-muted-foreground">
                      {expanded
                        ? <ChevronDown className="h-3.5 w-3.5" />
                        : <ChevronRight className="h-3.5 w-3.5" />
                      }
                    </td>
                    <td className="font-mono text-xs text-muted-foreground">{check.id}</td>
                    <td className="font-sans text-sm">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={check.status} />
                        <span>{check.item}</span>
                        {check.isOverridden && (
                          <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-medium">
                            OVERRIDDEN
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">{check.reference}</span>
                        <ReferenceBadge trace={makeCheckTrace(check)} compact />
                      </div>
                    </td>
                    <td>
                      <span className={`text-xs font-mono font-medium ${statusColor(check.autoStatus)}`}>
                        {statusLabel(check.autoStatus)}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <select
                          value={check.status}
                          onChange={(e) => overrideStatus(check.id, e.target.value as CheckStatus)}
                          className="eng-select text-xs py-1 flex-1"
                        >
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                          <option value="review">Review</option>
                          <option value="warning">Warning</option>
                          <option value="missing">Missing</option>
                        </select>
                        {check.isOverridden && (
                          <button
                            onClick={() => resetOverride(check.id)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Reset to auto-evaluated status"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Add comment"
                        onClick={() => {
                          const c = prompt("Engineer comment:", check.comment);
                          if (c !== null) setComment(check.id, c);
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded: Input Data Review */}
                  {expanded && (
                    <tr key={`${check.id}-detail`}>
                      <td colSpan={7} className="p-0">
                        <div className="bg-muted/20 border-t border-b border-border/50 px-4 py-3 space-y-2">
                          {/* Evaluation detail */}
                          <div className="text-sm text-foreground/80">
                            <span className="font-medium text-foreground">Evaluation: </span>
                            {check.detail}
                          </div>

                          {/* Input Data Review table */}
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              Input Data Review
                            </div>
                            <div className="rounded border border-border/50 overflow-x-auto">
                              <table className="w-full text-xs min-w-[520px]">
                                <thead>
                                  <tr className="bg-muted/40">
                                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Source Field</th>
                                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Loaded Value</th>
                                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Check Parameter</th>
                                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground w-20">Source</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inputFields.map(field => (
                                    <tr key={field} className="border-t border-border/30">
                                      <td className="px-3 py-1.5 font-mono text-muted-foreground">{field}</td>
                                      <td className="px-3 py-1.5 font-mono font-medium">{getInputValue(field)}</td>
                                      <td className="px-3 py-1.5">{INPUT_FIELD_LABELS[field] || field}</td>
                                      <td className="px-3 py-1.5">
                                        {overrides[field as keyof typeof overrides] !== undefined ? (
                                          overrides[field as keyof typeof overrides] ? (
                                            <span className="inline-flex items-center gap-0.5 text-accent">
                                              <Unlock className="h-3 w-3" /> Override
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-0.5 text-success">
                                              <Lock className="h-3 w-3" /> Auto
                                            </span>
                                          )
                                        ) : (
                                          <span className="text-muted-foreground">Input</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Engineer comment */}
                          {check.comment && (
                            <div className="text-sm text-foreground/70 italic border-l-2 border-accent/40 pl-2">
                              <span className="font-medium not-italic">Engineer note:</span> {check.comment}
                            </div>
                          )}

                          {/* Code reference */}
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Code ref:</span> {check.source}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <LearningMoment
        title="Why design review checks come last"
        principle="The individual calculations (wall thickness, flange class, supports) only show that each item has been evaluated in isolation. These review checks support the final engineering review across the system: hydrotest pressure, material suitability for the fluid service category, wall thickness after corrosion allowance, and service-specific limits. They are decision-support prompts, not automated compliance approval."
        reference="ASME B31.3 §345 Testing • §323 Materials • Table 326.1"
      />

      <EngineeringDisclaimer />
    </div>
  );
}
