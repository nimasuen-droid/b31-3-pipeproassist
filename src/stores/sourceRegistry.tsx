import { createContext, useContext, useState, useCallback, type ReactNode, useMemo } from "react";
import { B36_10M_PIPE_DATA } from "@/components/modules/designInputs/sourceData/b36_10m_data";
import { ALL_FLANGE_PT_RATINGS } from "@/components/modules/designInputs/sourceData/b16_5_data";
import { ALLOWABLE_STRESS_DATA } from "@/components/modules/designInputs/sourceData/secIID_data";

// ======================== TYPES ========================

export type SourceStatus = "draft" | "parsed" | "approved" | "active" | "superseded" | "archived";
export type MappingGranularity = "document" | "section" | "table" | "row" | "cell" | "rule";
export type SourceOrigin = "user-uploaded" | "company-internal" | "standard-derived" | "default-rule";
export type ApprovalAction = "upload" | "edit" | "mapping_change" | "activate" | "deactivate" | "approve" | "supersede" | "delete" | "archive";

export interface SourceDocument {
  id: string;
  title: string;
  type: string; // e.g. "allowable-stress", "schedule-table", "flange-rating", etc.
  standard: string;
  edition: string;
  revision: string;
  fileName: string;
  fileHash: string;
  uploadedBy: string;
  uploadDate: string;
  reviewedBy: string;
  approvedBy: string;
  approvalDate: string;
  effectiveDate: string;
  supersededDate: string;
  status: SourceStatus;
  origin: SourceOrigin;
  modulesLinked: string[];
  mappingCompleteness: number; // 0-100
  notes: string;
}

export interface SourceTable {
  id: string;
  sourceId: string;
  tableName: string;
  tableNumber: string;
  columns: SourceColumn[];
  rows: Record<string, string>[];
  version: string;
  status: SourceStatus;
  moduleUsage: string[];
  createdDate: string;
  createdBy: string;
  history?: TableVersion[];
}

export interface TableVersion {
  version: string;
  date: string;
  changedBy: string;
  changeLog: string;
  rowCount: number;
  snapshot?: Record<string, string>[]; // previous row data
}

// ======================== TABLE UTILITIES ========================

export function downloadTableAsCSV(table: SourceTable): void {
  const headers = table.columns.map(c => c.label);
  const csvRows = [headers.join(",")];
  for (const row of table.rows) {
    csvRows.push(table.columns.map(c => `"${(row[c.key] || "").replace(/"/g, '""')}"`).join(","));
  }
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${table.tableName.replace(/\s/g, "_")}_v${table.version}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadTableAsJSON(table: SourceTable, source?: SourceDocument): void {
  const exportData = {
    metadata: {
      tableName: table.tableName,
      tableNumber: table.tableNumber,
      version: table.version,
      sourceId: table.sourceId,
      sourceTitle: source?.title || "",
      standard: source?.standard || "",
      edition: source?.edition || "",
      exportDate: new Date().toISOString(),
      rowCount: table.rows.length,
    },
    columns: table.columns,
    rows: table.rows,
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${table.tableName.replace(/\s/g, "_")}_v${table.version}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface TableDiff {
  added: Record<string, string>[];
  removed: Record<string, string>[];
  modified: { rowIndex: number; old: Record<string, string>; new: Record<string, string>; changedKeys: string[] }[];
  unchanged: number;
}

export function compareTableRows(oldRows: Record<string, string>[], newRows: Record<string, string>[], columns: SourceColumn[]): TableDiff {
  const keys = columns.map(c => c.key);
  const rowKey = (row: Record<string, string>) => keys.map(k => row[k] || "").join("|");

  const oldMap = new Map(oldRows.map((r, i) => [rowKey(r), { row: r, index: i }]));
  const newMap = new Map(newRows.map((r, i) => [rowKey(r), { row: r, index: i }]));

  const added: Record<string, string>[] = [];
  const removed: Record<string, string>[] = [];
  const modified: TableDiff["modified"] = [];
  let unchanged = 0;

  // Simple positional comparison
  const maxLen = Math.max(oldRows.length, newRows.length);
  for (let i = 0; i < maxLen; i++) {
    const oldR = oldRows[i];
    const newR = newRows[i];
    if (!oldR && newR) { added.push(newR); continue; }
    if (oldR && !newR) { removed.push(oldR); continue; }
    if (!oldR || !newR) continue;
    const changedKeys = keys.filter(k => (oldR[k] || "") !== (newR[k] || ""));
    if (changedKeys.length > 0) {
      modified.push({ rowIndex: i, old: oldR, new: newR, changedKeys });
    } else {
      unchanged++;
    }
  }

  return { added, removed, modified, unchanged };
}

export interface SourceColumn {
  key: string;
  label: string;
  unit?: string;
  type: "text" | "number" | "temperature" | "pressure" | "dimension";
}

export interface SourceMapping {
  id: string;
  sourceId: string;
  tableId?: string;
  rowIndex?: number;
  cellKey?: string;
  sectionRef?: string;
  granularity: MappingGranularity;
  targetModule: string;
  targetField: string;
  lookupFilters?: Record<string, string>;
  description: string;
}

export interface CalculationTrace {
  fieldName: string;
  appliedValue: string;
  sourceId?: string;
  sourceTitle?: string;
  sourceOrigin: SourceOrigin;
  standard?: string;
  edition?: string;
  sectionRef?: string;
  tableRef?: string;
  tableNumber?: string;
  rowBasis?: string;
  cellBasis?: string;
  lookupFilters?: Record<string, string>;
  whySelected: string;
  assumptions: string[];
  warnings: string[];
  relatedRefs?: string[];
  confidenceLevel: "exact-match" | "mapped" | "default-rule" | "unmapped";
  overrideStatus: "recommended" | "manual-override";
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: ApprovalAction;
  sourceId: string;
  userId: string;
  details: string;
}

// ======================== BUILT-IN TRACES ========================

export function getDefaultTrace(fieldName: string, value: string, rec: { reason: string; source: string }, overridden: boolean): CalculationTrace {
  // Parse source string into structured refs
  const sourceStr = rec.source || "";
  const standard = sourceStr.split(",")[0]?.trim() || "";
  const sectionRef = sourceStr.split(",").slice(1).join(",").trim() || "";
  
  return {
    fieldName,
    appliedValue: value,
    sourceOrigin: "default-rule",
    standard,
    sectionRef,
    whySelected: rec.reason,
    assumptions: ["Based on built-in engineering rules", "Verify against reviewed project-specific sources and licensed source documents"],
    warnings: value ? [] : ["No value determined — insufficient input data"],
    confidenceLevel: "default-rule",
    overrideStatus: overridden ? "manual-override" : "recommended",
  };
}

// ======================== CONTEXT ========================

interface SourceRegistryState {
  sources: SourceDocument[];
  tables: SourceTable[];
  mappings: SourceMapping[];
  auditLog: AuditEntry[];
  addSource: (src: Omit<SourceDocument, "id">) => string;
  updateSource: (id: string, updates: Partial<SourceDocument>) => void;
  removeSource: (id: string) => void;
  addTable: (table: Omit<SourceTable, "id">) => string;
  updateTable: (id: string, updates: Partial<SourceTable>) => void;
  removeTable: (id: string) => void;
  addMapping: (mapping: Omit<SourceMapping, "id">) => void;
  addAuditEntry: (entry: Omit<AuditEntry, "id" | "timestamp">) => void;
  getSourceById: (id: string) => SourceDocument | undefined;
  getTablesBySource: (sourceId: string) => SourceTable[];
  getActiveSourceForStandard: (standard: string) => SourceDocument | undefined;
  getTraceForField: (module: string, field: string) => SourceMapping | undefined;
}

const SourceRegistryContext = createContext<SourceRegistryState | null>(null);

let _nextId = 1;
const genId = () => `src_${Date.now()}_${_nextId++}`;

// Default standards registry
const DEFAULT_STANDARDS: SourceDocument[] = [
  { id: "std_b313", title: "ASME B31.3 Process Piping", type: "design-code", standard: "ASME B31.3", edition: "2022", revision: "", fileName: "built-in", fileHash: "", uploadedBy: "system", uploadDate: "2026-04-02", reviewedBy: "system", approvedBy: "system", approvalDate: "2026-04-02", effectiveDate: "2026-04-02", supersededDate: "", status: "active", origin: "standard-derived", modulesLinked: ["inputs", "thickness", "checks", "pms"], mappingCompleteness: 100, notes: "Design code rules embedded in calculation engines — all clauses mapped" },
  { id: "std_sec2d", title: "ASME Section II Part D — Table 1A", type: "allowable-stress", standard: "ASME Sec II-D", edition: "2021", revision: "", fileName: "secIID_data.ts", fileHash: "", uploadedBy: "system", uploadDate: "2026-04-02", reviewedBy: "system", approvedBy: "system", approvalDate: "2026-04-02", effectiveDate: "2026-04-02", supersededDate: "", status: "active", origin: "standard-derived", modulesLinked: ["inputs", "thickness", "pms"], mappingCompleteness: 100, notes: "Allowable stress fully loaded: A106 B/C, A333-6, A335 P11/P22, A312 304/304L/316/316L/321" },
  { id: "std_b165", title: "ASME B16.5 Flanges P-T Ratings", type: "flange-rating", standard: "ASME B16.5", edition: "2020", revision: "", fileName: "b16_5_data.ts", fileHash: "", uploadedBy: "system", uploadDate: "2026-04-02", reviewedBy: "system", approvedBy: "system", approvalDate: "2026-04-02", effectiveDate: "2026-04-02", supersededDate: "", status: "active", origin: "standard-derived", modulesLinked: ["flanges", "inputs", "pms"], mappingCompleteness: 100, notes: "P-T ratings fully loaded: Group 1.1 (CS), Group 2.2 (316SS), Group 2.3 (316L)" },
  { id: "std_b3610", title: "ASME B36.10M Pipe Dimensions", type: "schedule-table", standard: "ASME B36.10M", edition: "2015", revision: "", fileName: "b36_10m_data.ts", fileHash: "", uploadedBy: "system", uploadDate: "2026-04-02", reviewedBy: "system", approvedBy: "system", approvalDate: "2026-04-02", effectiveDate: "2026-04-02", supersededDate: "", status: "active", origin: "standard-derived", modulesLinked: ["schedule", "thickness", "pms"], mappingCompleteness: 100, notes: "Full pipe schedule data NPS 1/8\" to 24\", all standard schedules — fully mapped" },
  { id: "std_b3619", title: "ASME B36.19M Stainless Pipe", type: "schedule-table", standard: "ASME B36.19M", edition: "2018", revision: "", fileName: "b36_19m_data.ts", fileHash: "", uploadedBy: "system", uploadDate: "2026-04-02", reviewedBy: "system", approvedBy: "system", approvalDate: "2026-04-02", effectiveDate: "2026-04-02", supersededDate: "", status: "active", origin: "standard-derived", modulesLinked: ["schedule", "thickness", "pms"], mappingCompleteness: 100, notes: "Stainless steel pipe dimensions — Schedules 5S/10S/40S/80S, NPS 1/2\" to 24\"" },
  { id: "std_b169", title: "ASME B16.9 Factory-Made Fittings", type: "fitting-dimensions", standard: "ASME B16.9", edition: "2018", revision: "", fileName: "materialDatabase.ts", fileHash: "", uploadedBy: "system", uploadDate: "2026-04-02", reviewedBy: "system", approvedBy: "system", approvalDate: "2026-04-02", effectiveDate: "2026-04-02", supersededDate: "", status: "active", origin: "standard-derived", modulesLinked: ["flanges", "inputs", "pms"], mappingCompleteness: 100, notes: "Fitting material compatibility data fully loaded and mapped" },
  { id: "std_b1611", title: "ASME B16.11 Forged Fittings", type: "fitting-dimensions", standard: "ASME B16.11", edition: "2016", revision: "", fileName: "materialDatabase.ts", fileHash: "", uploadedBy: "system", uploadDate: "2026-04-02", reviewedBy: "system", approvedBy: "system", approvalDate: "2026-04-02", effectiveDate: "2026-04-02", supersededDate: "", status: "active", origin: "standard-derived", modulesLinked: ["flanges", "pms"], mappingCompleteness: 100, notes: "Forged fitting material data fully loaded and mapped" },
];

// Build initial tables from loaded source data
function buildDefaultTables(): SourceTable[] {
  // B36.10M pipe data → table rows
  const pipeRows = B36_10M_PIPE_DATA.map(p => ({
    nps: p.nps, od_mm: String(p.od_mm), schedule: p.schedule,
    wt_mm: String(p.wt_mm), wt_in: String(p.wt_in), id_mm: String(p.id_mm),
    weight_kg_m: String(p.weightPerMeter), standard: p.standard,
  }));

  // B16.5 flange P-T data → table rows
  const flangeRows: Record<string, string>[] = [];
  for (const rating of ALL_FLANGE_PT_RATINGS) {
    for (const r of rating.ratings) {
      flangeRows.push({
        group: rating.materialGroup, description: rating.materialDescription,
        class: String(rating.class), tempC: String(r.tempC), pressureBar: String(r.pressureBar),
      });
    }
  }

  // Sec II-D allowable stress → table rows
  const stressRows: Record<string, string>[] = [];
  for (const mat of ALLOWABLE_STRESS_DATA) {
    for (const sv of mat.stressValues) {
      stressRows.push({
        material: mat.material, spec: mat.spec, grade: mat.grade,
        tempF: String(sv.tempF), tempC: String(sv.tempC),
        stress_ksi: String(sv.stress_ksi), stress_MPa: String(sv.stress_MPa),
      });
    }
  }

  return [
    {
      id: "tbl_b3610", sourceId: "std_b3610", tableName: "B36.10M Pipe Dimensions",
      tableNumber: "Table 1", version: "1.0", status: "active" as SourceStatus,
      moduleUsage: ["schedule", "thickness"], createdDate: "2026-04-02", createdBy: "system",
      columns: [
        { key: "nps", label: "NPS", type: "text" as const },
        { key: "od_mm", label: "OD (mm)", type: "dimension" as const, unit: "mm" },
        { key: "schedule", label: "Schedule", type: "text" as const },
        { key: "wt_mm", label: "Wall Thickness (mm)", type: "dimension" as const, unit: "mm" },
        { key: "wt_in", label: "Wall Thickness (in)", type: "dimension" as const, unit: "in" },
        { key: "id_mm", label: "ID (mm)", type: "dimension" as const, unit: "mm" },
        { key: "weight_kg_m", label: "Weight (kg/m)", type: "number" as const },
        { key: "standard", label: "Standard", type: "text" as const },
      ],
      rows: pipeRows,
    },
    {
      id: "tbl_b165", sourceId: "std_b165", tableName: "B16.5 Flange P-T Ratings",
      tableNumber: "Table 2", version: "1.0", status: "active" as SourceStatus,
      moduleUsage: ["flanges", "inputs"], createdDate: "2026-04-02", createdBy: "system",
      columns: [
        { key: "group", label: "Material Group", type: "text" as const },
        { key: "description", label: "Description", type: "text" as const },
        { key: "class", label: "Class", type: "text" as const },
        { key: "tempC", label: "Temperature (°C)", type: "temperature" as const, unit: "°C" },
        { key: "pressureBar", label: "Max Pressure (bar)", type: "pressure" as const, unit: "bar" },
      ],
      rows: flangeRows,
    },
    {
      id: "tbl_sec2d", sourceId: "std_sec2d", tableName: "Section II-D Allowable Stress",
      tableNumber: "Table 1A", version: "1.0", status: "active" as SourceStatus,
      moduleUsage: ["inputs", "thickness"], createdDate: "2026-04-02", createdBy: "system",
      columns: [
        { key: "material", label: "Material", type: "text" as const },
        { key: "spec", label: "Spec", type: "text" as const },
        { key: "grade", label: "Grade", type: "text" as const },
        { key: "tempF", label: "Temp (°F)", type: "temperature" as const, unit: "°F" },
        { key: "tempC", label: "Temp (°C)", type: "temperature" as const, unit: "°C" },
        { key: "stress_ksi", label: "Stress (ksi)", type: "pressure" as const, unit: "ksi" },
        { key: "stress_MPa", label: "Stress (MPa)", type: "pressure" as const, unit: "MPa" },
      ],
      rows: stressRows,
    },
  ];
}

export function SourceRegistryProvider({ children }: { children: ReactNode }) {
  const [sources, setSources] = useState<SourceDocument[]>(DEFAULT_STANDARDS);
  const defaultTables = useMemo(() => buildDefaultTables(), []);
  const [tables, setTables] = useState<SourceTable[]>(defaultTables);
  const [mappings, setMappings] = useState<SourceMapping[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  const addSource = useCallback((src: Omit<SourceDocument, "id">) => {
    const id = genId();
    setSources(prev => [...prev, { ...src, id }]);
    return id;
  }, []);

  const updateSource = useCallback((id: string, updates: Partial<SourceDocument>) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const removeSource = useCallback((id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  }, []);

  const addTable = useCallback((table: Omit<SourceTable, "id">) => {
    const id = genId();
    setTables(prev => [...prev, { ...table, id }]);
    return id;
  }, []);

  const updateTable = useCallback((id: string, updates: Partial<SourceTable>) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const removeTable = useCallback((id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
  }, []);

  const addMapping = useCallback((mapping: Omit<SourceMapping, "id">) => {
    const id = genId();
    setMappings(prev => [...prev, { ...mapping, id }]);
  }, []);

  const addAuditEntry = useCallback((entry: Omit<AuditEntry, "id" | "timestamp">) => {
    setAuditLog(prev => [...prev, { ...entry, id: genId(), timestamp: new Date().toISOString() }]);
  }, []);

  const getSourceById = useCallback((id: string) => sources.find(s => s.id === id), [sources]);
  const getTablesBySource = useCallback((sourceId: string) => tables.filter(t => t.sourceId === sourceId), [tables]);
  const getActiveSourceForStandard = useCallback((standard: string) => sources.find(s => s.standard === standard && s.status === "active"), [sources]);
  const getTraceForField = useCallback((module: string, field: string) => mappings.find(m => m.targetModule === module && m.targetField === field), [mappings]);

  return (
    <SourceRegistryContext.Provider value={{
      sources, tables, mappings, auditLog,
      addSource, updateSource, removeSource,
      addTable, updateTable, removeTable,
      addMapping, addAuditEntry,
      getSourceById, getTablesBySource, getActiveSourceForStandard, getTraceForField,
    }}>
      {children}
    </SourceRegistryContext.Provider>
  );
}

export function useSourceRegistry() {
  const ctx = useContext(SourceRegistryContext);
  if (!ctx) throw new Error("useSourceRegistry must be used within SourceRegistryProvider");
  return ctx;
}
