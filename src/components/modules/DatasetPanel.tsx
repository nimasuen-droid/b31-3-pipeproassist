import { useState, useMemo, useRef } from "react";
import {
  Download, Upload, RotateCcw, CheckCircle2, XCircle, Eye, Clock,
  ChevronDown, ChevronUp, AlertTriangle, FileSpreadsheet, ArrowUpDown,
  Shield, Search, Globe, Trash2, Archive
} from "lucide-react";
import {
  useDatasetManager,
  type Dataset, type DatasetType, type DatasetDiff, type StagedImport,
  computeDatasetDiff, validateDatasetForType, exportDatasetAsCSV, exportDatasetAsJSON,
  parseCSVFile, parseTSVText,
} from "@/stores/datasetManager";
import { DATASET_WORKFLOW_NOTICE } from "@/lib/brand";
import { DATASET_RELEASE_ATTESTATION_LINES } from "@/lib/appVersion";

const DATASET_TYPE_LABELS: Record<DatasetType, string> = {
  "pipe-schedule": "Pipe Schedule",
  "material-selection": "Material / Stress",
  "corrosion-allowance": "Corrosion Allowance",
  "flange-rating": "Flange Rating",
  "bolting": "Bolting",
  "gasket": "Gasket",
  "support-span": "Support Span",
  "test-pressure-rules": "Test Pressure",
  "service-classification": "Service Classification",
};

function DsStatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    staging: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    review: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    approved: "bg-primary/15 text-primary border-primary/30",
    active: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
    archived: "bg-muted text-muted-foreground border-border",
    default: "bg-secondary text-foreground border-border",
  };
  const labels: Record<string, string> = {
    staging: "Staged",
    review: "In Review",
    approved: "Reviewed",
    active: "Active",
    archived: "Deleted",
    default: "Default Reference",
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${cls[status] || cls.archived}`}>{labels[status] || status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function ConfidenceBadge({ level }: { level: string }) {
  const cls: Record<string, string> = {
    high: "text-[hsl(var(--success))]",
    medium: "text-amber-500",
    low: "text-orange-500",
    unverified: "text-destructive",
  };
  return <span className={`text-[10px] font-medium ${cls[level] || ""}`}>● {level}</span>;
}

export function DatasetPanel() {
  const dm = useDatasetManager();
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedDs, setSelectedDs] = useState<string | null>(null);
  const [showUploadDiff, setShowUploadDiff] = useState(false);
  const [uploadDiff, setUploadDiff] = useState<DatasetDiff | null>(null);
  const [uploadNewRows, setUploadNewRows] = useState<Record<string, string>[]>([]);
  const [uploadChangeLog, setUploadChangeLog] = useState("");
  const [expandedVersions, setExpandedVersions] = useState(false);
  const [showStaging, setShowStaging] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importName, setImportName] = useState("");
  const [importType, setImportType] = useState<DatasetType>("pipe-schedule");
  const [importUrl, setImportUrl] = useState("");
  const [importNotes, setImportNotes] = useState("");
  const [importData, setImportData] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() =>
    filterType === "all" ? dm.datasets : dm.datasets.filter(d => d.datasetType === filterType),
    [dm.datasets, filterType]
  );

  const selected = selectedDs ? dm.getDatasetById(selectedDs) : null;
  const pendingImports = dm.stagedImports.filter(s => s.status === "pending");
  const importPreview = useMemo(() => {
    const parsed = parseTSVText(importData);
    return parsed.rows.length > 0 ? validateDatasetForType(importType, parsed.columns, parsed.rows) : null;
  }, [importData, importType]);
  const getImportValidation = (imp: StagedImport) => validateDatasetForType(imp.datasetType, imp.columns, imp.rows);
  const hasDefaultForType = (type: DatasetType) => dm.datasets.some(d => d.datasetType === type && d.isDefault);

  const handleFileReupload = (ds: Dataset, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = file.name.endsWith(".csv") ? parseCSVFile(text) : parseTSVText(text);
      if (parsed.rows.length === 0) return;
      const diff = computeDatasetDiff(ds.rows, parsed.rows, ds.columns);
      setUploadDiff(diff);
      setUploadNewRows(parsed.rows);
      setShowUploadDiff(true);
      setUploadChangeLog("");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleApplyUpload = () => {
    if (!selected || uploadNewRows.length === 0) return;
    dm.createNewVersion(selected.id, uploadNewRows, uploadChangeLog || "Re-uploaded data");
    setShowUploadDiff(false);
    setUploadDiff(null);
    setUploadNewRows([]);
  };

  const handleStagedImport = () => {
    if (!importName || !importData.trim()) return;
    const parsed = parseTSVText(importData);
    if (parsed.rows.length === 0) return;
    const validation = validateDatasetForType(importType, parsed.columns, parsed.rows);
    dm.addStagedImport({
      name: importName,
      datasetType: importType,
      sourceUrl: importUrl,
      extractionDate: new Date().toISOString().split("T")[0],
      confidenceLevel: validation.valid ? (validation.warnings.length === 0 ? "medium" : "low") : "unverified",
      columns: parsed.columns,
      rows: parsed.rows,
      userNotes: importNotes,
      status: "pending",
    });
    dm.addAudit({
      datasetId: "",
      action: "import",
      userId: "Current User",
      details: `Staged import: ${importName} (${validation.errors.length} errors, ${validation.warnings.length} warnings)`,
    });
    setShowImportForm(false);
    setImportName(""); setImportUrl(""); setImportNotes(""); setImportData("");
    setShowStaging(true);
  };

  return (
    <div className="space-y-4">
      {/* Dataset Management Header */}
      <div className="eng-card border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="eng-label flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Dataset Management
            <span className="text-[9px] text-muted-foreground font-normal ml-1">
              {dm.datasets.length} datasets • {pendingImports.length} pending import{pendingImports.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowImportForm(!showImportForm)}
              className="text-[10px] px-2 py-1 rounded bg-secondary text-secondary-foreground flex items-center gap-1 hover:opacity-90 border border-border">
              <Globe className="h-3 w-3" /> Import Data
            </button>
            <button onClick={() => setShowStaging(!showStaging)}
              className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 border ${pendingImports.length > 0 ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : "bg-secondary text-secondary-foreground border-border"}`}>
              <Eye className="h-3 w-3" /> Staging ({pendingImports.length})
            </button>
            <button onClick={() => dm.resetAllToDefaults()}
              className="text-[10px] px-2 py-1 rounded bg-secondary text-muted-foreground flex items-center gap-1 hover:text-foreground border border-border">
              <RotateCcw className="h-3 w-3" /> Reset All
            </button>
          </div>
        </div>

        {/* Safety banner */}
        <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-foreground">
          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" />
          <span>{DATASET_WORKFLOW_NOTICE} External data is staged, validated, and explicitly accepted before use in calculations.</span>
        </div>
        <div className="mt-2 rounded border border-primary/20 bg-primary/5 p-2 font-mono text-[10px] text-foreground">
          {DATASET_RELEASE_ATTESTATION_LINES.join(" | ")}
          <span className="block mt-1 font-sans text-muted-foreground">
            Attestation applies to bundled app datasets only, not project approval.
          </span>
        </div>
      </div>

      {/* Internet Import Form */}
      {showImportForm && (
        <div className="eng-card">
          <div className="eng-label mb-3 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Import External Data (Staging)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="eng-label block mb-1">Dataset Name</label>
              <input className="eng-input" placeholder="e.g. Custom Corrosion Table" value={importName} onChange={e => setImportName(e.target.value)} />
            </div>
            <div>
              <label className="eng-label block mb-1">Dataset Type</label>
              <select className="eng-select" value={importType} onChange={e => setImportType(e.target.value as DatasetType)}>
                {Object.entries(DATASET_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="eng-label block mb-1">Source URL</label>
              <input className="eng-input" placeholder="https://..." value={importUrl} onChange={e => setImportUrl(e.target.value)} />
            </div>
          </div>
          <div className="mb-3">
            <label className="eng-label block mb-1">Paste Data (tab-separated, first row = headers)</label>
            <textarea className="eng-input min-h-[100px] font-mono text-[11px]" placeholder={"NPS\tOD\tSchedule\tThickness\n6\t168.3\t40\t7.11"} value={importData} onChange={e => setImportData(e.target.value)} />
          </div>
          {importPreview && (
            <div className={`mb-3 rounded border p-2 text-[10px] ${importPreview.valid ? "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5" : "border-destructive/30 bg-destructive/5"}`}>
              <div className="font-medium mb-1">{importPreview.valid ? "Validation passed" : "Validation blocked acceptance"}</div>
              {importPreview.errors.slice(0, 4).map((err, i) => <div key={`err-${i}`} className="text-destructive">{err}</div>)}
              {importPreview.warnings.slice(0, 4).map((warn, i) => <div key={`warn-${i}`} className="text-amber-600 dark:text-amber-400">{warn}</div>)}
            </div>
          )}
          <div className="mb-3">
            <label className="eng-label block mb-1">Notes</label>
            <input className="eng-input" placeholder="Any review notes..." value={importNotes} onChange={e => setImportNotes(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleStagedImport} className="bg-primary text-primary-foreground px-3 py-2 rounded text-xs font-medium">
              Send to Staging
            </button>
            <button onClick={() => setShowImportForm(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Staging Area */}
      {showStaging && pendingImports.length > 0 && (
        <div className="eng-card border-amber-500/20">
          <div className="eng-label mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Staging Area — Review Before Use
          </div>
          {pendingImports.map(imp => {
            const validation = getImportValidation(imp);
            return (
            <div key={imp.id} className={`border rounded p-3 mb-2 ${validation.valid ? "border-border" : "border-destructive/40 bg-destructive/5"}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium">{imp.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">{DATASET_TYPE_LABELS[imp.datasetType]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ConfidenceBadge level={imp.confidenceLevel} />
                  <button onClick={() => dm.approveStagedImport(imp.id)}
                    disabled={!validation.valid}
                    title={validation.valid ? "Accept staged dataset for custom workspace use" : validation.errors[0]}
                    className={`text-[9px] px-2 py-1 rounded ${validation.valid ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/25" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                    <CheckCircle2 className="h-3 w-3 inline mr-0.5" /> Accept
                  </button>
                  <button onClick={() => dm.rejectStagedImport(imp.id)}
                    className="text-[9px] px-2 py-1 rounded bg-destructive/15 text-destructive hover:bg-destructive/25">
                    <XCircle className="h-3 w-3 inline mr-0.5" /> Reject
                  </button>
                </div>
              </div>
              {imp.sourceUrl && <div className="text-[10px] text-muted-foreground">Source: {imp.sourceUrl}</div>}
              <div className="text-[10px] text-muted-foreground">{imp.columns.length} columns • {imp.rows.length} rows • Extracted: {imp.extractionDate}</div>
              {imp.userNotes && <div className="text-[10px] italic text-muted-foreground mt-1">{imp.userNotes}</div>}
              <div className={`mt-2 rounded border p-2 text-[10px] ${validation.valid ? "border-[hsl(var(--success))]/25 bg-[hsl(var(--success))]/5" : "border-destructive/30 bg-destructive/5"}`}>
                <div className="font-medium mb-1">{validation.valid ? "Ready to accept for custom workspace use" : "Acceptance blocked"}</div>
                {validation.errors.slice(0, 5).map((err, i) => <div key={`err-${i}`} className="text-destructive">{err}</div>)}
                {validation.warnings.slice(0, 5).map((warn, i) => <div key={`warn-${i}`} className="text-amber-600 dark:text-amber-400">{warn}</div>)}
              </div>
              {/* Preview table */}
              <div className="overflow-x-auto mt-2 max-h-32 overflow-y-auto">
                <table className="eng-table text-[10px]">
                  <thead>
                    <tr>{imp.columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {imp.rows.slice(0, 5).map((row, ri) => (
                      <tr key={ri}>{imp.columns.map(c => <td key={c.key}>{row[c.key]}</td>)}</tr>
                    ))}
                    {imp.rows.length > 5 && <tr><td colSpan={imp.columns.length} className="text-center text-muted-foreground">... {imp.rows.length - 5} more rows</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-muted-foreground">Datasets:</span>
        <button onClick={() => setFilterType("all")} className={`text-[10px] px-2 py-0.5 rounded border ${filterType === "all" ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border"}`}>All</button>
        {Object.entries(DATASET_TYPE_LABELS).map(([k, v]) => (
          <button key={k} onClick={() => setFilterType(k)} className={`text-[10px] px-2 py-0.5 rounded border ${filterType === k ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border"}`}>{v}</button>
        ))}
      </div>

      {/* Dataset List */}
      <div className="eng-card overflow-x-auto">
        <table className="eng-table">
          <thead>
            <tr>
              <th>Dataset</th>
              <th>Type</th>
              <th>Source</th>
              <th>Version</th>
              <th>Rows</th>
              <th>Status</th>
              <th>Confidence</th>
              <th className="w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(ds => (
              <tr key={ds.id} className={`cursor-pointer ${selectedDs === ds.id ? "bg-primary/5" : "hover:bg-secondary/30"}`}
                onClick={() => setSelectedDs(selectedDs === ds.id ? null : ds.id)}>
                <td className="font-sans text-sm">
                  {ds.name}
                  {ds.isBaseline && <span className="text-[9px] ml-1 text-muted-foreground">(baseline)</span>}
                </td>
                <td className="text-[10px]">{DATASET_TYPE_LABELS[ds.datasetType] || ds.datasetType}</td>
                <td className="text-[10px] max-w-[120px] truncate">{ds.source}</td>
                <td className="font-mono text-[10px]">v{ds.activeVersion}</td>
                <td className="text-[10px]">{ds.rows.length}</td>
                <td><DsStatusBadge status={ds.status} /></td>
                <td><ConfidenceBadge level={ds.confidenceLevel} /></td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => exportDatasetAsCSV(ds)} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary hover:bg-secondary/80" title="Download CSV">
                      <Download className="h-3 w-3" />
                    </button>
                    {ds.status === "approved" && (
                      <button onClick={() => dm.activateDataset(ds.id)} className="text-[9px] px-1.5 py-0.5 rounded bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]" title="Activate">
                        Activate
                      </button>
                    )}
                    {hasDefaultForType(ds.datasetType) && (
                      <button
                        onClick={() => dm.resetToDefault(ds.datasetType)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground hover:text-foreground"
                        title="Revert this dataset type to the app default data"
                      >
                        Revert Default
                      </button>
                    )}
                    {!ds.isBaseline && ds.status !== "archived" && (
                      <button onClick={() => dm.archiveDataset(ds.id)} className="text-muted-foreground hover:text-destructive" title="Delete dataset record">
                        <Archive className="h-3 w-3" />
                      </button>
                    )}
                    {ds.isBaseline && ds.status !== "default" && (
                      <button onClick={() => dm.resetToDefault(ds.datasetType)} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground" title="Reset">
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Dataset Detail */}
      {selected && (
        <div className="eng-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="eng-label">{selected.name}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => exportDatasetAsCSV(selected)}
                className="text-[10px] px-2 py-1 rounded bg-secondary flex items-center gap-1 border border-border">
                <Download className="h-3 w-3" /> CSV
              </button>
              <button onClick={() => exportDatasetAsJSON(selected)}
                className="text-[10px] px-2 py-1 rounded bg-secondary flex items-center gap-1 border border-border">
                <Download className="h-3 w-3" /> JSON
              </button>
              <label className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary flex items-center gap-1 border border-primary/30 cursor-pointer">
                <Upload className="h-3 w-3" /> Re-upload
                <input ref={fileInputRef} type="file" className="hidden" accept=".csv,.tsv,.txt"
                  onChange={(e) => handleFileReupload(selected, e)} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><span className="text-muted-foreground">Source:</span> <span className="font-mono">{selected.source}</span></div>
            <div><span className="text-muted-foreground">Version:</span> <span className="font-mono">v{selected.activeVersion}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <DsStatusBadge status={selected.status} /></div>
            <div><span className="text-muted-foreground">Confidence:</span> <ConfidenceBadge level={selected.confidenceLevel} /></div>
            <div><span className="text-muted-foreground">Uploaded:</span> <span className="font-mono">{selected.uploadDate}</span></div>
            <div><span className="text-muted-foreground">Reviewed By:</span> <span className="font-mono">{selected.approvedBy || "—"}</span></div>
            <div><span className="text-muted-foreground">Rows:</span> <span className="font-mono">{selected.rows.length}</span></div>
            <div><span className="text-muted-foreground">Baseline:</span> <span className="font-mono">{selected.isBaseline ? "Yes (protected)" : "No"}</span></div>
          </div>

          {selected.status === "archived" && (
            <div className="rounded border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              Deleted. This record is kept for audit visibility. Use Revert Default to restore the bundled app dataset for this dataset type.
            </div>
          )}

          {selected.userNotes && <div className="text-[10px] italic text-muted-foreground">{selected.userNotes}</div>}

          {/* Data Preview */}
          {selected.rows.length > 0 && (
            <div>
              <div className="eng-label mb-1">Data Preview (first 10 rows)</div>
              <div className="overflow-x-auto max-h-48 overflow-y-auto">
                <table className="eng-table text-[10px]">
                  <thead>
                    <tr>{selected.columns.map(c => <th key={c.key}>{c.label}{c.unit ? ` (${c.unit})` : ""}</th>)}</tr>
                  </thead>
                  <tbody>
                    {selected.rows.slice(0, 10).map((row, ri) => (
                      <tr key={ri}>{selected.columns.map(c => <td key={c.key}>{row[c.key]}</td>)}</tr>
                    ))}
                    {selected.rows.length > 10 && <tr><td colSpan={selected.columns.length} className="text-center text-muted-foreground">... {selected.rows.length - 10} more rows</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Version History */}
          <div>
            <button onClick={() => setExpandedVersions(!expandedVersions)}
              className="eng-label flex items-center gap-1 cursor-pointer hover:text-foreground">
              {expandedVersions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Version History ({selected.versions.length})
            </button>
            {expandedVersions && (
              <div className="mt-2 space-y-1">
                {selected.versions.map(v => (
                  <div key={v.versionNumber} className={`flex items-center justify-between p-2 rounded border text-[10px] ${v.versionNumber === selected.activeVersion ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                    <div>
                      <span className="font-mono font-medium">v{v.versionNumber}</span>
                      <span className="text-muted-foreground ml-2">{v.createdDate.split("T")[0]}</span>
                      <span className="text-muted-foreground ml-2">by {v.createdBy}</span>
                      <span className="text-muted-foreground ml-2">• {v.rowCount} rows</span>
                      {v.changeLog && <span className="ml-2 italic">{v.changeLog}</span>}
                    </div>
                    {v.versionNumber !== selected.activeVersion && v.rows && v.rows.length > 0 && (
                      <button onClick={() => dm.rollbackToVersion(selected.id, v.versionNumber)}
                        className="text-[9px] px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80">
                        <RotateCcw className="h-3 w-3 inline mr-0.5" /> Rollback
                      </button>
                    )}
                    {v.versionNumber === selected.activeVersion && <span className="text-primary text-[9px]">● Current</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Diff Review */}
      {showUploadDiff && uploadDiff && selected && (
        <div className="eng-card border-primary/20">
          <div className="eng-label mb-2 flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5" /> Change Detection — {selected.name}
          </div>
          <div className="grid grid-cols-4 gap-3 mb-3 text-xs">
            <div className="text-center p-2 rounded bg-[hsl(var(--success))]/10">
              <div className="font-bold text-[hsl(var(--success))]">{uploadDiff.added.length}</div>
              <div className="text-[10px] text-muted-foreground">Added</div>
            </div>
            <div className="text-center p-2 rounded bg-destructive/10">
              <div className="font-bold text-destructive">{uploadDiff.removed.length}</div>
              <div className="text-[10px] text-muted-foreground">Removed</div>
            </div>
            <div className="text-center p-2 rounded bg-amber-500/10">
              <div className="font-bold text-amber-600">{uploadDiff.modified.length}</div>
              <div className="text-[10px] text-muted-foreground">Modified</div>
            </div>
            <div className="text-center p-2 rounded bg-secondary">
              <div className="font-bold">{uploadDiff.unchanged}</div>
              <div className="text-[10px] text-muted-foreground">Unchanged</div>
            </div>
          </div>

          {uploadDiff.modified.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-medium mb-1">Modified Rows:</div>
              <div className="overflow-x-auto max-h-32 overflow-y-auto">
                <table className="eng-table text-[10px]">
                  <thead>
                    <tr><th>Row</th><th>Field</th><th>Old</th><th>New</th></tr>
                  </thead>
                  <tbody>
                    {uploadDiff.modified.slice(0, 20).map((m, i) =>
                      m.changedKeys.map(k => (
                        <tr key={`${i}-${k}`}>
                          <td>{m.rowIndex + 1}</td>
                          <td>{k}</td>
                          <td className="text-destructive line-through">{m.old[k]}</td>
                          <td className="text-[hsl(var(--success))]">{m.new[k]}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="eng-label block mb-1">Change Log</label>
            <input className="eng-input" placeholder="Describe changes..." value={uploadChangeLog} onChange={e => setUploadChangeLog(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleApplyUpload}
              className="bg-primary text-primary-foreground px-3 py-2 rounded text-xs font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Accept & Create New Version
            </button>
            <button onClick={() => { setShowUploadDiff(false); setUploadDiff(null); }}
              className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Dataset Audit Log */}
      {dm.auditLog.length > 0 && (
        <div className="eng-card">
          <div className="eng-label mb-2">Dataset Audit Log</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {dm.auditLog.slice(-10).reverse().map(entry => (
              <div key={entry.id} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5 shrink-0" />
                <span className="font-mono">{entry.timestamp.split("T")[0]}</span>
                <span className="px-1 py-0 rounded bg-secondary text-[9px]">{entry.action}</span>
                <span>{entry.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
