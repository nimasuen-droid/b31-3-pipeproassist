import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { DATASET_RELEASE_ATTESTATION_LINES } from "@/lib/appVersion";

// ======================== TYPES ========================

export type DatasetStatus = "staging" | "review" | "approved" | "active" | "archived" | "default";
export type DatasetType =
  | "pipe-schedule" | "material-selection" | "corrosion-allowance"
  | "flange-rating" | "bolting" | "gasket" | "support-span"
  | "test-pressure-rules" | "service-classification";

export interface DatasetColumn {
  key: string;
  label: string;
  type: "text" | "number" | "temperature" | "pressure" | "dimension";
  unit?: string;
  required?: boolean;
}

export interface DatasetVersion {
  versionNumber: string;
  createdDate: string;
  createdBy: string;
  changeLog: string;
  rowCount: number;
  rows: Record<string, string>[];
  status: DatasetStatus;
}

export interface Dataset {
  id: string;
  name: string;
  datasetType: DatasetType;
  description: string;
  source: string; // e.g. "ASME B36.10M" or URL
  sourceUrl?: string;
  extractionDate?: string;
  confidenceLevel: "high" | "medium" | "low" | "unverified";
  userNotes: string;
  columns: DatasetColumn[];
  rows: Record<string, string>[];
  status: DatasetStatus;
  isDefault: boolean;   // protected default dataset
  isBaseline: boolean;  // system baseline — cannot be deleted
  activeVersion: string;
  versions: DatasetVersion[];
  uploadedBy: string;
  uploadDate: string;
  approvedBy: string;
  approvalDate: string;
  lastModified: string;
}

export interface DatasetDiff {
  added: Record<string, string>[];
  removed: Record<string, string>[];
  modified: { rowIndex: number; old: Record<string, string>; new: Record<string, string>; changedKeys: string[] }[];
  unchanged: number;
}

export interface StagedImport {
  id: string;
  name: string;
  datasetType: DatasetType;
  sourceUrl: string;
  extractionDate: string;
  confidenceLevel: "high" | "medium" | "low" | "unverified";
  columns: DatasetColumn[];
  rows: Record<string, string>[];
  userNotes: string;
  status: "pending" | "approved" | "rejected";
}

export interface DatasetAuditEntry {
  id: string;
  timestamp: string;
  datasetId: string;
  action: "import" | "upload" | "approve" | "activate" | "archive" | "version" | "rollback" | "reset" | "edit" | "reject";
  userId: string;
  details: string;
  versionFrom?: string;
  versionTo?: string;
}

// ======================== VALIDATION ========================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function columnMatcher(columns: DatasetColumn[]) {
  const normalized = columns.map((c) => ({
    column: c,
    text: `${c.key} ${c.label} ${c.unit ?? ""}`.toLowerCase(),
  }));
  return (patterns: RegExp[]) => normalized.find(({ text }) => patterns.some((p) => p.test(text)))?.column;
}

function valueAt(row: Record<string, string>, column?: DatasetColumn): string {
  return column ? row[column.key] ?? "" : "";
}

function numericValue(row: Record<string, string>, column?: DatasetColumn): number {
  const raw = valueAt(row, column).replace(/,/g, "").trim();
  return raw ? Number(raw) : Number.NaN;
}

export function validateDataset(columns: DatasetColumn[], rows: Record<string, string>[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (columns.length === 0) errors.push("No columns defined");
  if (rows.length === 0) errors.push("No data rows");

  const requiredCols = columns.filter(c => c.required);
  rows.forEach((row, ri) => {
    requiredCols.forEach(c => {
      if (!row[c.key]?.trim()) errors.push(`Row ${ri + 1}: missing required column "${c.label}"`);
    });
    columns.forEach(c => {
      if (c.type === "number" || c.type === "temperature" || c.type === "pressure" || c.type === "dimension") {
        const val = row[c.key]?.trim();
        if (val && isNaN(parseFloat(val))) warnings.push(`Row ${ri + 1}, "${c.label}": "${val}" is not numeric`);
      }
    });
  });

  // Flag unrealistic values
  rows.forEach((row, ri) => {
    columns.forEach(c => {
      if (c.type === "temperature") {
        const v = parseFloat(row[c.key]);
        if (!isNaN(v) && (v < -273 || v > 2000)) warnings.push(`Row ${ri + 1}, "${c.label}": temperature ${v} seems unrealistic`);
      }
      if (c.type === "pressure") {
        const v = parseFloat(row[c.key]);
        if (!isNaN(v) && v < 0) warnings.push(`Row ${ri + 1}, "${c.label}": negative pressure ${v}`);
      }
    });
  });

  return { valid: errors.length === 0, errors, warnings };
}

/** Type-specific validation used before an imported dataset can be made active.
 * This checks structure and engineering sanity, not legal certification of the
 * source values. The app records source references but does not require checker sign-off. */
export function validateDatasetForType(
  datasetType: DatasetType,
  columns: DatasetColumn[],
  rows: Record<string, string>[]
): ValidationResult {
  const result = validateDataset(columns, rows);
  const { errors, warnings } = result;
  const findColumn = columnMatcher(columns);

  const requireColumn = (label: string, patterns: RegExp[]) => {
    const column = findColumn(patterns);
    if (!column) errors.push(`${label} column is required for ${datasetType} datasets`);
    return column;
  };

  if (datasetType === "pipe-schedule") {
    const npsCol = requireColumn("NPS", [/\bnps\b/, /nominal.*pipe.*size/]);
    const scheduleCol = requireColumn("Schedule", [/\bsch(edule)?\b/]);
    const odCol = requireColumn("Outside diameter", [/\bod\b/, /outside.*diam/]);
    const wtCol = requireColumn("Wall thickness", [/\bwt\b/, /wall.*thick/, /\bthickness\b/]);
    const seen = new Set<string>();

    rows.forEach((row, index) => {
      const nps = valueAt(row, npsCol).replace(/["']/g, "").trim();
      const schedule = valueAt(row, scheduleCol).trim();
      if (nps === "2.5" || nps === "2-1/2" || nps === "3.5" || nps === "3-1/2") {
        warnings.push(`Row ${index + 1}: NPS ${nps} is non-preferred for EPC specs`);
      }
      const key = `${nps}:${schedule}`;
      if (nps && schedule) {
        if (seen.has(key)) errors.push(`Row ${index + 1}: duplicate NPS/schedule combination ${key}`);
        seen.add(key);
      }
      const od = numericValue(row, odCol);
      const wt = numericValue(row, wtCol);
      if (!Number.isNaN(od) && od <= 0) errors.push(`Row ${index + 1}: OD must be positive`);
      if (!Number.isNaN(wt) && wt <= 0) errors.push(`Row ${index + 1}: wall thickness must be positive`);
      if (!Number.isNaN(od) && !Number.isNaN(wt) && wt * 2 >= od) {
        errors.push(`Row ${index + 1}: wall thickness is too large for OD`);
      }
    });
  }

  if (datasetType === "flange-rating") {
    const classCol = requireColumn("Flange class", [/\bclass\b/, /rating/]);
    const tempCol = requireColumn("Temperature", [/temp/]);
    const pressureCol = requireColumn("Pressure", [/pressure/, /\bbar\b/, /\bpsi\b/]);
    const allowedClasses = new Set([150, 300, 600, 900, 1500, 2500]);
    const curves = new Map<string, { temp: number; pressure: number; row: number }[]>();

    rows.forEach((row, index) => {
      const flangeClass = numericValue(row, classCol);
      const temp = numericValue(row, tempCol);
      const pressure = numericValue(row, pressureCol);
      if (!Number.isNaN(flangeClass) && !allowedClasses.has(flangeClass)) {
        errors.push(`Row ${index + 1}: flange class ${flangeClass} is not in the supported class set`);
      }
      if (!Number.isNaN(pressure) && pressure <= 0) errors.push(`Row ${index + 1}: pressure rating must be positive`);
      if (!Number.isNaN(flangeClass) && !Number.isNaN(temp) && !Number.isNaN(pressure)) {
        const key = String(flangeClass);
        curves.set(key, [...(curves.get(key) ?? []), { temp, pressure, row: index + 1 }]);
      }
    });

    for (const [flangeClass, curve] of curves) {
      const sorted = [...curve].sort((a, b) => a.temp - b.temp);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].pressure > sorted[i - 1].pressure) {
          warnings.push(`Class ${flangeClass}: pressure increases between rows ${sorted[i - 1].row} and ${sorted[i].row}`);
        }
      }
    }
  }

  if (datasetType === "material-selection") {
    requireColumn("Material", [/material/, /designation/, /grade/]);
    const stressCol = findColumn([/stress/, /\bs\b/, /\bksi\b/, /\bmpa\b/]);
    const tempCol = findColumn([/temp/]);
    if (!stressCol) warnings.push("No allowable stress column detected; reviewer must confirm this is not a stress table");
    rows.forEach((row, index) => {
      const stress = numericValue(row, stressCol);
      const temp = numericValue(row, tempCol);
      if (stressCol && !Number.isNaN(stress) && stress <= 0) errors.push(`Row ${index + 1}: stress must be positive`);
      if (tempCol && !Number.isNaN(temp) && (temp < -273 || temp > 2000)) warnings.push(`Row ${index + 1}: temperature looks unrealistic`);
    });
  }

  if (datasetType === "corrosion-allowance") {
    requireColumn("Service", [/service/, /fluid/]);
    const caCol = requireColumn("Corrosion allowance", [/corrosion/, /\bca\b/, /allowance/]);
    rows.forEach((row, index) => {
      const ca = numericValue(row, caCol);
      if (!Number.isNaN(ca) && ca < 0) errors.push(`Row ${index + 1}: corrosion allowance cannot be negative`);
      if (!Number.isNaN(ca) && ca > 12) warnings.push(`Row ${index + 1}: corrosion allowance is unusually high`);
    });
  }

  if (datasetType === "test-pressure-rules") {
    requireColumn("Test type", [/test.*type/, /test/]);
    const factorCol = requireColumn("Test factor", [/factor/, /multiplier/]);
    rows.forEach((row, index) => {
      const factor = numericValue(row, factorCol);
      if (!Number.isNaN(factor) && factor <= 0) errors.push(`Row ${index + 1}: test factor must be positive`);
      if (!Number.isNaN(factor) && factor > 2) warnings.push(`Row ${index + 1}: test factor is unusually high`);
    });
  }

  if (datasetType === "service-classification") {
    requireColumn("Service type", [/service/]);
    requireColumn("Classification", [/classification/, /category/]);
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ======================== DIFF ENGINE ========================

export function computeDatasetDiff(
  oldRows: Record<string, string>[],
  newRows: Record<string, string>[],
  columns: DatasetColumn[]
): DatasetDiff {
  const keys = columns.map(c => c.key);
  const added: Record<string, string>[] = [];
  const removed: Record<string, string>[] = [];
  const modified: DatasetDiff["modified"] = [];
  let unchanged = 0;

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

// ======================== EXCEL EXPORT (CSV-based) ========================

export function exportDatasetAsCSV(dataset: Dataset, filter?: { indices?: number[] }): void {
  const rows = filter?.indices ? filter.indices.map(i => dataset.rows[i]).filter(Boolean) : dataset.rows;
  const headers = dataset.columns.map(c => c.label + (c.unit ? ` (${c.unit})` : ""));
  const csvRows = [headers.join(",")];
  for (const row of rows) {
    csvRows.push(dataset.columns.map(c => `"${(row[c.key] || "").replace(/"/g, '""')}"`).join(","));
  }
  // Add metadata sheet as comments at top
  const metaLines = [
    `# Dataset: ${dataset.name}`,
    `# Source: ${dataset.source}`,
    `# Version: ${dataset.activeVersion}`,
    `# Type: ${dataset.datasetType}`,
    `# Uploaded: ${dataset.uploadDate}`,
    `# Reviewed by: ${dataset.approvedBy || "Not reviewed"}`,
    `# Status: ${dataset.status}`,
    ...DATASET_RELEASE_ATTESTATION_LINES.map((line) => `# ${line}`),
    `# Attestation scope: bundled application dataset package only; not project approval or checker sign-off`,
    `# Rows: ${rows.length}`,
    `# Export date: ${new Date().toISOString()}`,
    "",
  ];
  const blob = new Blob([metaLines.join("\n") + csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${dataset.name.replace(/\s/g, "_")}_v${dataset.activeVersion}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDatasetAsJSON(dataset: Dataset): void {
  const exportData = {
    metadata: {
      name: dataset.name,
      type: dataset.datasetType,
      source: dataset.source,
      version: dataset.activeVersion,
      uploadDate: dataset.uploadDate,
      approvedBy: dataset.approvedBy,
      status: dataset.status,
      releaseAttestation: {
        lines: [...DATASET_RELEASE_ATTESTATION_LINES],
        scope: "Bundled application dataset package only; not project approval or checker sign-off",
      },
      exportDate: new Date().toISOString(),
      rowCount: dataset.rows.length,
    },
    columns: dataset.columns,
    rows: dataset.rows,
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${dataset.name.replace(/\s/g, "_")}_v${dataset.activeVersion}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ======================== FILE PARSING ========================

export function parseCSVFile(text: string): { columns: DatasetColumn[]; rows: Record<string, string>[] } {
  // Strip metadata comment lines
  const lines = text.split("\n").filter(l => !l.startsWith("#") && l.trim());
  if (lines.length < 2) return { columns: [], rows: [] };
  const headerLine = lines[0];
  const headers = headerLine.split(",").map(h => h.replace(/^"|"$/g, "").trim());
  const columns: DatasetColumn[] = headers.map((h, i) => {
    const unitMatch = h.match(/\(([^)]+)\)$/);
    const label = unitMatch ? h.replace(unitMatch[0], "").trim() : h;
    return { key: `col_${i}`, label, type: "text" as const, unit: unitMatch?.[1] };
  });
  const rows = lines.slice(1).map(line => {
    const vals = line.match(/("([^"]*("")*[^"]*)*"|[^,]*)/g) || [];
    const row: Record<string, string> = {};
    columns.forEach((c, i) => {
      row[c.key] = (vals[i] || "").replace(/^"|"$/g, "").trim();
    });
    return row;
  });
  return { columns, rows };
}

export function parseTSVText(text: string): { columns: DatasetColumn[]; rows: Record<string, string>[] } {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return { columns: [], rows: [] };
  const headers = lines[0].split("\t");
  const columns: DatasetColumn[] = headers.map((h, i) => ({ key: `col_${i}`, label: h.trim(), type: "text" as const }));
  const rows = lines.slice(1).map(line => {
    const vals = line.split("\t");
    const row: Record<string, string> = {};
    columns.forEach((c, i) => { row[c.key] = vals[i]?.trim() || ""; });
    return row;
  });
  return { columns, rows };
}

// ======================== BASELINE DEFAULTS ========================

const BASELINE_DATASETS: Dataset[] = [
  {
    id: "default_pipe_schedule",
    name: "Pipe Schedule (B36.10M)",
    datasetType: "pipe-schedule",
    description: "Standard pipe dimensions per ASME B36.10M, NPS 1/8\" to 24\"",
    source: "ASME B36.10M-2015",
    confidenceLevel: "high",
    userNotes: "System default — sourced from ASME B36.10M standard tables",
    columns: [
      { key: "nps", label: "NPS", type: "text", required: true },
      { key: "od", label: "OD", type: "dimension", unit: "mm", required: true },
      { key: "schedule", label: "Schedule", type: "text", required: true },
      { key: "thickness", label: "Wall Thickness", type: "dimension", unit: "mm", required: true },
    ],
    rows: [], // Linked to b36_10m_data.ts
    status: "default",
    isDefault: true,
    isBaseline: true,
    activeVersion: "1.0",
    versions: [{ versionNumber: "1.0", createdDate: "2026-04-02", createdBy: "system", changeLog: "Initial baseline load", rowCount: 0, rows: [], status: "default" }],
    uploadedBy: "system",
    uploadDate: "2026-04-02",
    approvedBy: "system",
    approvalDate: "2026-04-02",
    lastModified: "2026-04-02",
  },
  {
    id: "default_flange_rating",
    name: "Flange P-T Ratings (B16.5)",
    datasetType: "flange-rating",
    description: "Pressure-temperature ratings per ASME B16.5 for Groups 1.1, 2.2, 2.3",
    source: "ASME B16.5-2020",
    confidenceLevel: "high",
    userNotes: "System default — P-T rating curves for CS, 316SS, 316L",
    columns: [
      { key: "group", label: "Material Group", type: "text", required: true },
      { key: "class", label: "Class", type: "text", required: true },
      { key: "tempC", label: "Temperature", type: "temperature", unit: "°C", required: true },
      { key: "pressureBar", label: "Max Pressure", type: "pressure", unit: "bar", required: true },
    ],
    rows: [],
    status: "default",
    isDefault: true,
    isBaseline: true,
    activeVersion: "1.0",
    versions: [{ versionNumber: "1.0", createdDate: "2026-04-02", createdBy: "system", changeLog: "Initial baseline load", rowCount: 0, rows: [], status: "default" }],
    uploadedBy: "system",
    uploadDate: "2026-04-02",
    approvedBy: "system",
    approvalDate: "2026-04-02",
    lastModified: "2026-04-02",
  },
  {
    id: "default_allowable_stress",
    name: "Allowable Stress (Sec II-D Table 1A)",
    datasetType: "material-selection",
    description: "Allowable stress values from ASME Section II Part D for common pipe materials",
    source: "ASME Sec II-D 2021",
    confidenceLevel: "high",
    userNotes: "System default — A106, A335, A312, A333 materials",
    columns: [
      { key: "material", label: "Material", type: "text", required: true },
      { key: "tempC", label: "Temperature", type: "temperature", unit: "°C", required: true },
      { key: "stress", label: "Allowable Stress", type: "pressure", unit: "MPa", required: true },
    ],
    rows: [],
    status: "default",
    isDefault: true,
    isBaseline: true,
    activeVersion: "1.0",
    versions: [{ versionNumber: "1.0", createdDate: "2026-04-02", createdBy: "system", changeLog: "Initial baseline load", rowCount: 0, rows: [], status: "default" }],
    uploadedBy: "system",
    uploadDate: "2026-04-02",
    approvedBy: "system",
    approvalDate: "2026-04-02",
    lastModified: "2026-04-02",
  },
  {
    id: "default_corrosion_allowance",
    name: "Corrosion Allowance Guidelines",
    datasetType: "corrosion-allowance",
    description: "Standard corrosion allowance by service type",
    source: "Company Standard / Industry Practice",
    confidenceLevel: "medium",
    userNotes: "System default — typical CA values by service severity",
    columns: [
      { key: "service", label: "Service Type", type: "text", required: true },
      { key: "severity", label: "Severity", type: "text", required: true },
      { key: "ca_mm", label: "CA", type: "dimension", unit: "mm", required: true },
      { key: "notes", label: "Notes", type: "text" },
    ],
    rows: [
      { service: "General Hydrocarbon", severity: "Low", ca_mm: "1.0", notes: "Non-corrosive service" },
      { service: "General Hydrocarbon", severity: "Moderate", ca_mm: "1.5", notes: "Standard process service" },
      { service: "Corrosive / Sour Service", severity: "Severe", ca_mm: "3.0", notes: "Per corrosion study" },
      { service: "Cooling Water", severity: "Moderate", ca_mm: "1.5", notes: "Open-loop: increase to 3mm" },
      { service: "High Pressure Steam", severity: "Low", ca_mm: "1.0", notes: "Treated boiler water" },
      { service: "Low Pressure Steam", severity: "Low", ca_mm: "1.0", notes: "Condensate return: 1.5mm" },
      { service: "Instrument Air", severity: "Low", ca_mm: "0.5", notes: "Clean/dry service" },
      { service: "Hydrogen Service", severity: "Low", ca_mm: "1.0", notes: "Per API 941 evaluation" },
      { service: "Oxygen Service", severity: "Low", ca_mm: "0.5", notes: "Clean service" },
      { service: "Cryogenic Service", severity: "Low", ca_mm: "1.0", notes: "Minimal corrosion" },
      { service: "High Temperature (>425°C)", severity: "Moderate", ca_mm: "1.5", notes: "Oxidation/scaling" },
      { service: "Chloride / Caustic", severity: "Severe", ca_mm: "3.0", notes: "SCC risk — confirm with specialist" },
    ],
    status: "default",
    isDefault: true,
    isBaseline: true,
    activeVersion: "1.0",
    versions: [{ versionNumber: "1.0", createdDate: "2026-04-02", createdBy: "system", changeLog: "Initial baseline load", rowCount: 12, rows: [], status: "default" }],
    uploadedBy: "system",
    uploadDate: "2026-04-02",
    approvedBy: "system",
    approvalDate: "2026-04-02",
    lastModified: "2026-04-02",
  },
  {
    id: "default_bolting",
    name: "Bolting Material Selection",
    datasetType: "bolting",
    description: "Standard bolt/nut combinations by service temperature",
    source: "ASME B16.5 Table 6, ASTM A193/A194",
    confidenceLevel: "high",
    userNotes: "System default — common stud bolt/nut material sets",
    columns: [
      { key: "designation", label: "Designation", type: "text", required: true },
      { key: "minTempC", label: "Min Temp", type: "temperature", unit: "°C" },
      { key: "maxTempC", label: "Max Temp", type: "temperature", unit: "°C" },
      { key: "description", label: "Description", type: "text" },
    ],
    rows: [
      { designation: "A193 B7 / A194 2H", minTempC: "-29", maxTempC: "427", description: "Standard chromium-molybdenum alloy steel" },
      { designation: "A193 B7M / A194 2HM", minTempC: "-29", maxTempC: "427", description: "Low-hardness for sour service (NACE MR0175)" },
      { designation: "A193 B8M Cl.1 / A194 8M", minTempC: "-196", maxTempC: "538", description: "316 SS — cryogenic to high temp" },
      { designation: "A193 B16 / A194 4", minTempC: "-29", maxTempC: "538", description: "High-temp CrMoV alloy steel" },
      { designation: "A320 L7 / A194 4", minTempC: "-101", maxTempC: "427", description: "Low-temp alloy for cryogenic" },
    ],
    status: "default",
    isDefault: true,
    isBaseline: true,
    activeVersion: "1.0",
    versions: [{ versionNumber: "1.0", createdDate: "2026-04-02", createdBy: "system", changeLog: "Initial baseline load", rowCount: 5, rows: [], status: "default" }],
    uploadedBy: "system",
    uploadDate: "2026-04-02",
    approvedBy: "system",
    approvalDate: "2026-04-02",
    lastModified: "2026-04-02",
  },
  {
    id: "default_gasket",
    name: "Gasket Selection Matrix",
    datasetType: "gasket",
    description: "Gasket types by service conditions",
    source: "ASME B16.20, Industry Practice",
    confidenceLevel: "high",
    userNotes: "System default — common gasket material combinations",
    columns: [
      { key: "designation", label: "Designation", type: "text", required: true },
      { key: "minTempC", label: "Min Temp", type: "temperature", unit: "°C" },
      { key: "maxTempC", label: "Max Temp", type: "temperature", unit: "°C" },
      { key: "maxPressureBar", label: "Max Pressure", type: "pressure", unit: "bar" },
      { key: "description", label: "Description", type: "text" },
    ],
    rows: [
      { designation: "Spiral Wound, CS/Flex.Graphite", minTempC: "-100", maxTempC: "538", maxPressureBar: "250", description: "Standard for CS flanges" },
      { designation: "Spiral Wound, SS316/Flex.Graphite", minTempC: "-200", maxTempC: "538", maxPressureBar: "250", description: "Standard for SS flanges" },
      { designation: "Spiral Wound, SS316/PTFE", minTempC: "-200", maxTempC: "260", maxPressureBar: "150", description: "Chemical/corrosive service" },
      { designation: "Ring Type Joint (RTJ)", minTempC: "-29", maxTempC: "538", maxPressureBar: "700", description: "High pressure Class 900+" },
      { designation: "PTFE Envelope", minTempC: "-200", maxTempC: "230", maxPressureBar: "40", description: "Chemical service, low pressure" },
    ],
    status: "default",
    isDefault: true,
    isBaseline: true,
    activeVersion: "1.0",
    versions: [{ versionNumber: "1.0", createdDate: "2026-04-02", createdBy: "system", changeLog: "Initial baseline load", rowCount: 5, rows: [], status: "default" }],
    uploadedBy: "system",
    uploadDate: "2026-04-02",
    approvedBy: "system",
    approvalDate: "2026-04-02",
    lastModified: "2026-04-02",
  },
  {
    id: "default_support_span",
    name: "Support Span Guidelines",
    datasetType: "support-span",
    description: "Recommended pipe support spacing by NPS",
    source: "MSS SP-69, Company Standard",
    confidenceLevel: "medium",
    userNotes: "System default — typical support spans for carbon steel pipe",
    columns: [
      { key: "nps", label: "NPS", type: "text", required: true },
      { key: "emptySpan_m", label: "Empty Span", type: "dimension", unit: "m" },
      { key: "waterSpan_m", label: "Water-filled Span", type: "dimension", unit: "m" },
    ],
    rows: [
      { nps: '1"', emptySpan_m: "2.1", waterSpan_m: "2.1" },
      { nps: '2"', emptySpan_m: "3.0", waterSpan_m: "3.0" },
      { nps: '3"', emptySpan_m: "3.7", waterSpan_m: "3.4" },
      { nps: '4"', emptySpan_m: "4.3", waterSpan_m: "3.7" },
      { nps: '6"', emptySpan_m: "5.2", waterSpan_m: "4.3" },
      { nps: '8"', emptySpan_m: "5.8", waterSpan_m: "4.6" },
      { nps: '10"', emptySpan_m: "6.1", waterSpan_m: "4.9" },
      { nps: '12"', emptySpan_m: "6.7", waterSpan_m: "5.2" },
      { nps: '16"', emptySpan_m: "7.6", waterSpan_m: "5.8" },
      { nps: '20"', emptySpan_m: "8.5", waterSpan_m: "6.4" },
      { nps: '24"', emptySpan_m: "9.1", waterSpan_m: "6.7" },
    ],
    status: "default",
    isDefault: true,
    isBaseline: true,
    activeVersion: "1.0",
    versions: [{ versionNumber: "1.0", createdDate: "2026-04-02", createdBy: "system", changeLog: "Initial baseline load", rowCount: 11, rows: [], status: "default" }],
    uploadedBy: "system",
    uploadDate: "2026-04-02",
    approvedBy: "system",
    approvalDate: "2026-04-02",
    lastModified: "2026-04-02",
  },
  {
    id: "default_test_pressure",
    name: "Test Pressure Rules",
    datasetType: "test-pressure-rules",
    description: "Hydrostatic and pneumatic test pressure rules per B31.3",
    source: "ASME B31.3 §345",
    confidenceLevel: "high",
    userNotes: "System default — test pressure calculation rules",
    columns: [
      { key: "testType", label: "Test Type", type: "text", required: true },
      { key: "factor", label: "Factor", type: "number", required: true },
      { key: "reference", label: "Reference", type: "text" },
      { key: "notes", label: "Notes", type: "text" },
    ],
    rows: [
      { testType: "Hydrostatic", factor: "1.5", reference: "§345.4.2(a)", notes: "Standard test = 1.5 × Design Pressure" },
      { testType: "Pneumatic", factor: "1.1", reference: "§345.5.4", notes: "Pneumatic test = 1.1 × Design Pressure" },
      { testType: "Category M - Hydro", factor: "1.5", reference: "§345.4", notes: "Required for Category M" },
      { testType: "Initial Service", factor: "1.0", reference: "§345.7", notes: "Limited to certain conditions" },
    ],
    status: "default",
    isDefault: true,
    isBaseline: true,
    activeVersion: "1.0",
    versions: [{ versionNumber: "1.0", createdDate: "2026-04-02", createdBy: "system", changeLog: "Initial baseline load", rowCount: 4, rows: [], status: "default" }],
    uploadedBy: "system",
    uploadDate: "2026-04-02",
    approvedBy: "system",
    approvalDate: "2026-04-02",
    lastModified: "2026-04-02",
  },
  {
    id: "default_service_classification",
    name: "Service Classification Rules",
    datasetType: "service-classification",
    description: "Service type to classification mapping with material drivers",
    source: "ASME B31.3, API 941, NACE MR0175",
    confidenceLevel: "high",
    userNotes: "System default — service type classification logic",
    columns: [
      { key: "serviceType", label: "Service Type", type: "text", required: true },
      { key: "classification", label: "Classification", type: "text" },
      { key: "corrosionSeverity", label: "Default Corrosion Severity", type: "text" },
      { key: "specialReqs", label: "Special Requirements", type: "text" },
    ],
    rows: [
      { serviceType: "General Hydrocarbon", classification: "Normal Fluid Service", corrosionSeverity: "Low", specialReqs: "None" },
      { serviceType: "Corrosive / Sour Service", classification: "Category M (if lethal)", corrosionSeverity: "Severe", specialReqs: "NACE MR0175, HIC testing" },
      { serviceType: "High Pressure Steam", classification: "Normal / HP", corrosionSeverity: "Low", specialReqs: "Creep range above 425°C" },
      { serviceType: "Low Pressure Steam", classification: "Normal Fluid Service", corrosionSeverity: "Low", specialReqs: "Condensate return may need higher CA" },
      { serviceType: "Cooling Water", classification: "Category D", corrosionSeverity: "Moderate", specialReqs: "Internal coating for open-loop" },
      { serviceType: "Instrument Air", classification: "Category D", corrosionSeverity: "Low", specialReqs: "Dry/oil-free" },
      { serviceType: "Hydrogen Service", classification: "Normal / HP", corrosionSeverity: "Low", specialReqs: "API 941, Nelson Curves, PWHT" },
      { serviceType: "Oxygen Service", classification: "Normal Fluid Service", corrosionSeverity: "Low", specialReqs: "CGA G-4.1 cleaning" },
      { serviceType: "Cryogenic Service", classification: "Normal Fluid Service", corrosionSeverity: "Low", specialReqs: "Impact testing per §323.3" },
      { serviceType: "High Temperature (>425°C)", classification: "Elevated Temperature", corrosionSeverity: "Moderate", specialReqs: "Creep rupture, CrMo alloys" },
      { serviceType: "Chloride / Caustic", classification: "Category M (if lethal)", corrosionSeverity: "Severe", specialReqs: "SCC risk, PWHT for caustic" },
    ],
    status: "default",
    isDefault: true,
    isBaseline: true,
    activeVersion: "1.0",
    versions: [{ versionNumber: "1.0", createdDate: "2026-04-02", createdBy: "system", changeLog: "Initial baseline load", rowCount: 11, rows: [], status: "default" }],
    uploadedBy: "system",
    uploadDate: "2026-04-02",
    approvedBy: "system",
    approvalDate: "2026-04-02",
    lastModified: "2026-04-02",
  },
];

// ======================== CONTEXT ========================

interface DatasetManagerState {
  datasets: Dataset[];
  stagedImports: StagedImport[];
  auditLog: DatasetAuditEntry[];
  // CRUD
  addDataset: (ds: Omit<Dataset, "id">) => string;
  updateDataset: (id: string, updates: Partial<Dataset>) => void;
  removeDataset: (id: string) => boolean; // returns false if baseline
  getDatasetById: (id: string) => Dataset | undefined;
  getActiveDataset: (type: DatasetType) => Dataset | undefined;
  getDatasetsByType: (type: DatasetType) => Dataset[];
  // Staging
  addStagedImport: (imp: Omit<StagedImport, "id">) => string;
  approveStagedImport: (id: string) => boolean;
  rejectStagedImport: (id: string) => void;
  // Versioning
  createNewVersion: (id: string, newRows: Record<string, string>[], changeLog: string) => void;
  rollbackToVersion: (id: string, versionNumber: string) => void;
  activateDataset: (id: string) => void;
  archiveDataset: (id: string) => void;
  // Defaults
  resetToDefault: (type: DatasetType) => void;
  resetAllToDefaults: () => void;
  // Audit
  addAudit: (entry: Omit<DatasetAuditEntry, "id" | "timestamp">) => void;
}

const DatasetManagerContext = createContext<DatasetManagerState | null>(null);

let _dsId = 1;
const dsGenId = () => `ds_${Date.now()}_${_dsId++}`;

export function DatasetManagerProvider({ children }: { children: ReactNode }) {
  const [datasets, setDatasets] = useState<Dataset[]>(BASELINE_DATASETS);
  const [stagedImports, setStagedImports] = useState<StagedImport[]>([]);
  const [auditLog, setAuditLog] = useState<DatasetAuditEntry[]>([]);

  const addAudit = useCallback((entry: Omit<DatasetAuditEntry, "id" | "timestamp">) => {
    setAuditLog(prev => [...prev, { ...entry, id: dsGenId(), timestamp: new Date().toISOString() }]);
  }, []);

  const addDataset = useCallback((ds: Omit<Dataset, "id">) => {
    const id = dsGenId();
    setDatasets(prev => [...prev, { ...ds, id }]);
    return id;
  }, []);

  const updateDataset = useCallback((id: string, updates: Partial<Dataset>) => {
    setDatasets(prev => prev.map(d => d.id === id ? { ...d, ...updates, lastModified: new Date().toISOString() } : d));
  }, []);

  const removeDataset = useCallback((id: string) => {
    const ds = datasets.find(d => d.id === id);
    if (ds?.isBaseline) return false;
    setDatasets(prev => prev.filter(d => d.id !== id));
    return true;
  }, [datasets]);

  const getDatasetById = useCallback((id: string) => datasets.find(d => d.id === id), [datasets]);

  const getActiveDataset = useCallback((type: DatasetType) => {
    // Priority: user active > default
    const userActive = datasets.find(d => d.datasetType === type && d.status === "active" && !d.isBaseline);
    if (userActive) return userActive;
    return datasets.find(d => d.datasetType === type && d.isDefault);
  }, [datasets]);

  const getDatasetsByType = useCallback((type: DatasetType) => datasets.filter(d => d.datasetType === type), [datasets]);

  const addStagedImport = useCallback((imp: Omit<StagedImport, "id">) => {
    const id = dsGenId();
    setStagedImports(prev => [...prev, { ...imp, id }]);
    return id;
  }, []);

  const approveStagedImport = useCallback((id: string) => {
    const imp = stagedImports.find(s => s.id === id);
    if (!imp) return false;
    const validation = validateDatasetForType(imp.datasetType, imp.columns, imp.rows);
    if (!validation.valid) {
      addAudit({
        datasetId: id,
        action: "reject",
        userId: "Current User",
        details: `Approval blocked for ${imp.name}: ${validation.errors[0]}`,
      });
      return false;
    }
    const dsId = dsGenId();
    const newDs: Dataset = {
      id: dsId,
      name: imp.name,
      datasetType: imp.datasetType,
      description: `Imported from ${imp.sourceUrl}`,
      source: imp.sourceUrl,
      sourceUrl: imp.sourceUrl,
      extractionDate: imp.extractionDate,
      confidenceLevel: imp.confidenceLevel,
      userNotes: imp.userNotes,
      columns: imp.columns,
      rows: imp.rows,
      status: "approved",
      isDefault: false,
      isBaseline: false,
      activeVersion: "1.0",
      versions: [{ versionNumber: "1.0", createdDate: new Date().toISOString(), createdBy: "Current User", changeLog: "Initial import from internet source", rowCount: imp.rows.length, rows: [...imp.rows], status: "approved" }],
      uploadedBy: "Current User",
      uploadDate: new Date().toISOString().split("T")[0],
      approvedBy: "Current User",
      approvalDate: new Date().toISOString().split("T")[0],
      lastModified: new Date().toISOString(),
    };
    setDatasets(prev => [...prev, newDs]);
    setStagedImports(prev => prev.map(s => s.id === id ? { ...s, status: "approved" } : s));
    addAudit({ datasetId: dsId, action: "approve", userId: "Current User", details: `Approved staged import: ${imp.name}` });
    return true;
  }, [stagedImports, addAudit]);

  const rejectStagedImport = useCallback((id: string) => {
    setStagedImports(prev => prev.map(s => s.id === id ? { ...s, status: "rejected" } : s));
    addAudit({ datasetId: id, action: "reject", userId: "Current User", details: "Staged import rejected" });
  }, [addAudit]);

  const createNewVersion = useCallback((id: string, newRows: Record<string, string>[], changeLog: string) => {
    setDatasets(prev => prev.map(d => {
      if (d.id !== id) return d;
      const vNum = (parseFloat(d.activeVersion) + 0.1).toFixed(1);
      const newVersion: DatasetVersion = {
        versionNumber: vNum,
        createdDate: new Date().toISOString(),
        createdBy: "Current User",
        changeLog,
        rowCount: newRows.length,
        rows: [...newRows],
        status: "approved",
      };
      // Archive current rows into history
      const currentSnapshot: DatasetVersion = {
        versionNumber: d.activeVersion,
        createdDate: d.lastModified,
        createdBy: d.uploadedBy,
        changeLog: "Previous version",
        rowCount: d.rows.length,
        rows: [...d.rows],
        status: "archived",
      };
      const existingVersions = d.versions.find(v => v.versionNumber === d.activeVersion) ? d.versions : [...d.versions, currentSnapshot];
      return {
        ...d,
        rows: newRows,
        activeVersion: vNum,
        versions: [...existingVersions, newVersion],
        lastModified: new Date().toISOString(),
      };
    }));
    addAudit({ datasetId: id, action: "version", userId: "Current User", details: changeLog });
  }, [addAudit]);

  const rollbackToVersion = useCallback((id: string, versionNumber: string) => {
    setDatasets(prev => prev.map(d => {
      if (d.id !== id) return d;
      const targetVersion = d.versions.find(v => v.versionNumber === versionNumber);
      if (!targetVersion || !targetVersion.rows) return d;
      return {
        ...d,
        rows: [...targetVersion.rows],
        activeVersion: versionNumber,
        lastModified: new Date().toISOString(),
      };
    }));
    addAudit({ datasetId: id, action: "rollback", userId: "Current User", details: `Rolled back to v${versionNumber}` });
  }, [addAudit]);

  const activateDataset = useCallback((id: string) => {
    const ds = datasets.find(d => d.id === id);
    if (!ds) return;
    // Deactivate other datasets of same type
    setDatasets(prev => prev.map(d => {
      if (d.datasetType === ds.datasetType && d.id !== id && d.status === "active") {
        return { ...d, status: "archived" as DatasetStatus };
      }
      if (d.id === id) return { ...d, status: "active" as DatasetStatus };
      return d;
    }));
    addAudit({ datasetId: id, action: "activate", userId: "Current User", details: `Activated dataset: ${ds.name}` });
  }, [datasets, addAudit]);

  const archiveDataset = useCallback((id: string) => {
    updateDataset(id, { status: "archived" });
    addAudit({ datasetId: id, action: "archive", userId: "Current User", details: "Dataset archived" });
  }, [updateDataset, addAudit]);

  const resetToDefault = useCallback((type: DatasetType) => {
    setDatasets(prev => prev.map(d => {
      if (d.datasetType !== type) return d;
      if (d.isBaseline) return { ...d, status: "default" as DatasetStatus };
      if (d.status === "active") return { ...d, status: "archived" as DatasetStatus };
      return d;
    }));
    addAudit({ datasetId: type, action: "reset", userId: "Current User", details: `Reset ${type} to default baseline` });
  }, [addAudit]);

  const resetAllToDefaults = useCallback(() => {
    setDatasets(prev => prev.map(d => {
      if (d.isBaseline) return { ...d, status: "default" as DatasetStatus };
      if (d.status === "active") return { ...d, status: "archived" as DatasetStatus };
      return d;
    }));
    addAudit({ datasetId: "all", action: "reset", userId: "Current User", details: "Reset all datasets to defaults" });
  }, [addAudit]);

  return (
    <DatasetManagerContext.Provider value={{
      datasets, stagedImports, auditLog,
      addDataset, updateDataset, removeDataset,
      getDatasetById, getActiveDataset, getDatasetsByType,
      addStagedImport, approveStagedImport, rejectStagedImport,
      createNewVersion, rollbackToVersion, activateDataset, archiveDataset,
      resetToDefault, resetAllToDefaults, addAudit,
    }}>
      {children}
    </DatasetManagerContext.Provider>
  );
}

export function useDatasetManager() {
  const ctx = useContext(DatasetManagerContext);
  if (!ctx) throw new Error("useDatasetManager must be used within DatasetManagerProvider");
  return ctx;
}
