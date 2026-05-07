import { useState } from "react";
import { Upload, FileText, Trash2, Plus, BookOpen, Lock, Table2, Eye, CheckCircle2, XCircle, Clock, Edit3, Copy, ArrowUpDown, FileSpreadsheet, X, ChevronDown, ChevronUp, AlertTriangle, RotateCcw } from "lucide-react";
import { EngineeringDisclaimer } from "../EngineeringDisclaimer";
import { useSourceRegistry, type SourceDocument, type SourceTable, type SourceColumn, type SourceStatus } from "@/stores/sourceRegistry";
import { DatasetPanel } from "./DatasetPanel";

const SOURCE_TYPES = [
  "allowable-stress", "schedule-table", "flange-rating", "fitting-dimensions",
  "material-compatibility", "corrosion-allowance", "support-span", "gasket-selection",
  "bolting-table", "test-pressure-rules", "joint-factor-rules", "service-classification",
  "company-piping-class", "weld-end-connection", "special-service-exception",
];

const MODULE_OPTIONS = [
  "inputs", "thickness", "schedule", "flanges", "bolting", "support", "checks", "material",
];

const STATUS_OPTIONS: SourceStatus[] = ["draft", "parsed", "approved", "active", "superseded", "archived"];

function StatusBadge({ status }: { status: SourceStatus }) {
  const cls: Record<SourceStatus, string> = {
    draft: "status-missing",
    parsed: "status-review",
    approved: "bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 rounded text-xs font-medium",
    active: "status-pass",
    superseded: "text-muted-foreground bg-muted/50 border border-border px-2 py-0.5 rounded text-xs font-medium line-through",
    archived: "text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded text-xs font-medium",
  };
  const labels: Record<SourceStatus, string> = {
    draft: "Draft",
    parsed: "Parsed",
    approved: "Reviewed",
    active: "Active",
    superseded: "Superseded",
    archived: "Deleted",
  };
  return <span className={cls[status]}>{labels[status]}</span>;
}

function isDefaultSource(src: SourceDocument) {
  return src.origin === "standard-derived" || src.id.startsWith("std_");
}

function displayEdition(src: SourceDocument) {
  return isDefaultSource(src) ? "Default" : src.edition || "—";
}

export function SourceLibraryModule() {
  const registry = useSourceRegistry();
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showTableCreator, setShowTableCreator] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  // Manual entry form
  const [formTitle, setFormTitle] = useState("");
  const [formStandard, setFormStandard] = useState("");
  const [formEdition, setFormEdition] = useState("");
  const [formType, setFormType] = useState(SOURCE_TYPES[0]);
  const [formModules, setFormModules] = useState<string[]>([]);
  const [formEffDate, setFormEffDate] = useState("");

  // Table creator
  const [tableSourceId, setTableSourceId] = useState("");
  const [tableName, setTableName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [tableVersion, setTableVersion] = useState("1.0");
  const [tableCols, setTableCols] = useState<SourceColumn[]>([
    { key: "col1", label: "Column 1", type: "text" },
    { key: "col2", label: "Column 2", type: "number" },
  ]);
  const [tableRows, setTableRows] = useState<Record<string, string>[]>([{}]);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const handleRegisterSource = () => {
    if (!formTitle || !formStandard) return;
    const id = registry.addSource({
      title: formTitle, type: formType, standard: formStandard, edition: formEdition,
      revision: "", fileName: "", fileHash: "", uploadedBy: "Current User",
      uploadDate: new Date().toISOString().split("T")[0], reviewedBy: "", approvedBy: "",
      approvalDate: "", effectiveDate: formEffDate, supersededDate: "",
      status: "draft", origin: "user-uploaded", modulesLinked: formModules,
      mappingCompleteness: 0, notes: "",
    });
    registry.addAuditEntry({ action: "upload", sourceId: id, userId: "Current User", details: `Registered source: ${formTitle}` });
    setFormTitle(""); setFormStandard(""); setFormEdition(""); setFormEffDate(""); setFormModules([]);
    setShowManualEntry(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = registry.addSource({
      title: file.name.replace(/\.[^/.]+$/, ""), type: "allowable-stress",
      standard: "", edition: "", revision: "", fileName: file.name,
      fileHash: `${file.size}-${file.lastModified}`, uploadedBy: "Current User",
      uploadDate: new Date().toISOString().split("T")[0], reviewedBy: "", approvedBy: "",
      approvalDate: "", effectiveDate: "", supersededDate: "", status: "draft",
      origin: "user-uploaded", modulesLinked: [], mappingCompleteness: 0, notes: "Uploaded file — requires parsing and mapping",
    });
    registry.addAuditEntry({ action: "upload", sourceId: id, userId: "Current User", details: `Uploaded file: ${file.name}` });
    e.target.value = "";
  };

  const handleApprove = (id: string) => {
    registry.updateSource(id, { status: "approved", approvedBy: "Current User", approvalDate: new Date().toISOString().split("T")[0] });
    registry.addAuditEntry({ action: "approve", sourceId: id, userId: "Current User", details: "Source reviewed and accepted" });
  };

  const handleActivate = (id: string) => {
    const src = registry.getSourceById(id);
    if (!src) return;
    // Supersede other active sources of the same standard
    registry.sources.filter(s => s.standard === src.standard && s.id !== id && s.status === "active").forEach(s => {
      registry.updateSource(s.id, { status: "superseded", supersededDate: new Date().toISOString().split("T")[0] });
      registry.addAuditEntry({ action: "supersede", sourceId: s.id, userId: "Current User", details: `Superseded by ${src.title}` });
    });
    registry.updateSource(id, { status: "active" });
    registry.addAuditEntry({ action: "activate", sourceId: id, userId: "Current User", details: "Source activated" });
  };

  const handleRevertSourceToDefault = (src: SourceDocument) => {
    const defaultSources = registry.sources.filter(s => isDefaultSource(s) && s.type === src.type);
    if (defaultSources.length === 0) return;

    registry.sources
      .filter(s => s.type === src.type && !isDefaultSource(s) && s.status === "active")
      .forEach(s => registry.updateSource(s.id, { status: "archived" }));

    defaultSources.forEach(s => registry.updateSource(s.id, { status: "active", supersededDate: "" }));
    registry.addAuditEntry({
      action: "activate",
      sourceId: defaultSources.map(s => s.id).join(","),
      userId: "Current User",
      details: `Reverted ${src.type.replace(/-/g, " ")} source data to app default`,
    });
  };

  const handleCreateTable = () => {
    if (!tableName || !tableSourceId) return;
    registry.addTable({
      sourceId: tableSourceId, tableName, tableNumber, columns: tableCols,
      rows: tableRows, version: tableVersion, status: "draft",
      moduleUsage: [], createdDate: new Date().toISOString().split("T")[0], createdBy: "Current User",
    });
    setShowTableCreator(false);
    setTableName(""); setTableNumber(""); setTableRows([{}]);
  };

  const handlePasteFromExcel = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.trim().split("\n");
    if (lines.length < 2) return;
    const headers = lines[0].split("\t");
    const cols: SourceColumn[] = headers.map((h, i) => ({ key: `col_${i}`, label: h.trim(), type: "text" as const }));
    const rows = lines.slice(1).map(line => {
      const vals = line.split("\t");
      const row: Record<string, string> = {};
      cols.forEach((c, i) => { row[c.key] = vals[i]?.trim() || ""; });
      return row;
    });
    setTableCols(cols);
    setTableRows(rows);
    setPasteMode(false);
    setPasteText("");
  };

  const filteredSources = filterType === "all" ? registry.sources : registry.sources.filter(s => s.type === filterType);
  const selectedSrc = selectedSource ? registry.getSourceById(selectedSource) : null;
  const selectedTables = selectedSource ? registry.getTablesBySource(selectedSource) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Source & Reference Library</h2>
          <p className="text-sm text-muted-foreground">Manage source-referenced engineering datasets • {registry.sources.length} sources registered</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTableCreator(!showTableCreator)}
            className="bg-secondary text-secondary-foreground px-3 py-2 rounded text-xs font-medium flex items-center gap-1 hover:opacity-90">
            <Table2 className="h-3 w-3" /> Create Table
          </button>
          <button onClick={() => setShowManualEntry(!showManualEntry)}
            className="bg-secondary text-secondary-foreground px-3 py-2 rounded text-xs font-medium flex items-center gap-1 hover:opacity-90">
            <Plus className="h-3 w-3" /> Manual Entry
          </button>
          <label className="bg-primary text-primary-foreground px-3 py-2 rounded text-xs font-medium flex items-center gap-1 hover:opacity-90 cursor-pointer">
            <Upload className="h-3 w-3" /> Upload Source
            <input type="file" className="hidden" accept=".csv,.xlsx,.json,.pdf" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {/* Info card */}
      <div className="eng-card border-primary/30 bg-primary/5">
        <div className="flex items-start gap-2">
          <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Source Data Requirements</p>
            <p>Upload structured tables from licensed standards, client specifications, or company datasets. The app indexes source references for decision-support use; it does not certify the data.</p>
            <ul className="mt-2 space-y-1">
              <li>• <span className="text-foreground">Allowable stress tables</span> — ASME Section II Part D or equivalent</li>
              <li>• <span className="text-foreground">Pipe dimensional tables</span> — ASME B36.10M, B36.19M</li>
              <li>• <span className="text-foreground">Flange pressure-temperature ratings</span> — ASME B16.5, B16.47</li>
              <li>• <span className="text-foreground">Material specifications</span> — ASTM pipe, fittings, flanges, bolts</li>
              <li>• <span className="text-foreground">Company PMS/material class sheets</span></li>
              <li>• <span className="text-foreground">Support span tables</span></li>
              <li>• <span className="text-foreground">Compatibility/service suitability tables</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Manual Entry Form */}
      {showManualEntry && (
        <div className="eng-card">
          <div className="eng-label mb-3">Manual Source Registration</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="eng-label block mb-1">Document Title</label>
              <input className="eng-input" placeholder="e.g. Allowable Stress Table" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
            </div>
            <div>
              <label className="eng-label block mb-1">Standard</label>
              <input className="eng-input" placeholder="e.g. ASME Sec II-D" value={formStandard} onChange={e => setFormStandard(e.target.value)} />
            </div>
            <div>
              <label className="eng-label block mb-1">Edition / Revision</label>
              <input className="eng-input" placeholder="e.g. 2023 Edition" value={formEdition} onChange={e => setFormEdition(e.target.value)} />
            </div>
            <div>
              <label className="eng-label block mb-1">Source Type</label>
              <select className="eng-select" value={formType} onChange={e => setFormType(e.target.value)}>
                {SOURCE_TYPES.map(t => <option key={t} value={t}>{t.replace(/-/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="eng-label block mb-1">Effective Date</label>
              <input type="date" className="eng-input" value={formEffDate} onChange={e => setFormEffDate(e.target.value)} />
            </div>
            <div>
              <label className="eng-label block mb-1">Linked Modules</label>
              <div className="flex flex-wrap gap-1">
                {MODULE_OPTIONS.map(m => (
                  <button key={m} onClick={() => setFormModules(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${formModules.includes(m) ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border"}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleRegisterSource} className="bg-primary text-primary-foreground px-3 py-2 rounded text-xs font-medium mt-3">
            Register Source
          </button>
        </div>
      )}

      {/* Table Creator */}
      {showTableCreator && (
        <div className="eng-card">
          <div className="flex items-center justify-between mb-3">
            <div className="eng-label">Create New Table</div>
            <button onClick={() => setPasteMode(!pasteMode)} className="text-[10px] px-2 py-1 rounded bg-secondary text-secondary-foreground flex items-center gap-1">
              <FileSpreadsheet className="h-3 w-3" /> {pasteMode ? "Manual Entry" : "Paste from Excel"}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="eng-label block mb-1">Link to Source</label>
              <select className="eng-select" value={tableSourceId} onChange={e => setTableSourceId(e.target.value)}>
                <option value="">Select source...</option>
                {registry.sources.map(s => <option key={s.id} value={s.id}>{s.title} ({s.standard})</option>)}
              </select>
            </div>
            <div>
              <label className="eng-label block mb-1">Table Name</label>
              <input className="eng-input" placeholder="e.g. Table 1A" value={tableName} onChange={e => setTableName(e.target.value)} />
            </div>
            <div>
              <label className="eng-label block mb-1">Table Number</label>
              <input className="eng-input" placeholder="e.g. 1A" value={tableNumber} onChange={e => setTableNumber(e.target.value)} />
            </div>
            <div>
              <label className="eng-label block mb-1">Version</label>
              <input className="eng-input" value={tableVersion} onChange={e => setTableVersion(e.target.value)} />
            </div>
          </div>

          {pasteMode ? (
            <div className="space-y-2">
              <label className="eng-label block">Paste tab-separated data (first row = headers)</label>
              <textarea className="eng-input min-h-[120px] font-mono text-[11px]" placeholder="Header1\tHeader2\tHeader3\nValue1\tValue2\tValue3" value={pasteText} onChange={e => setPasteText(e.target.value)} />
              <button onClick={handlePasteFromExcel} className="bg-primary text-primary-foreground px-3 py-2 rounded text-xs font-medium">
                Parse & Load
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Column editor */}
              <div className="eng-label">Columns</div>
              <div className="space-y-1">
                {tableCols.map((col, ci) => (
                  <div key={ci} className="flex items-center gap-2">
                    <input className="eng-input flex-1" placeholder="Column label" value={col.label}
                      onChange={e => { const c = [...tableCols]; c[ci] = { ...c[ci], label: e.target.value, key: `col_${ci}` }; setTableCols(c); }} />
                    <select className="eng-select w-28" value={col.type}
                      onChange={e => { const c = [...tableCols]; c[ci] = { ...c[ci], type: e.target.value as SourceColumn["type"] }; setTableCols(c); }}>
                      <option value="text">Text</option><option value="number">Number</option>
                      <option value="temperature">Temp</option><option value="pressure">Pressure</option>
                      <option value="dimension">Dimension</option>
                    </select>
                    <input className="eng-input w-16" placeholder="Unit" value={col.unit || ""}
                      onChange={e => { const c = [...tableCols]; c[ci] = { ...c[ci], unit: e.target.value }; setTableCols(c); }} />
                    <button
                      onClick={() => setTableCols(tableCols.filter((_, i) => i !== ci))}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove column ${ci + 1}`}
                      title={`Remove column ${ci + 1}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button onClick={() => setTableCols([...tableCols, { key: `col_${tableCols.length}`, label: "", type: "text" }])}
                  className="text-[10px] text-primary hover:underline">+ Add Column</button>
              </div>

              {/* Row editor */}
              <div className="eng-label mt-2">Data Rows</div>
              <div className="overflow-x-auto">
                <table className="eng-table text-[11px]">
                  <thead>
                    <tr>
                      <th className="w-8">#</th>
                      {tableCols.map((c, i) => <th key={i}>{c.label || `Col ${i + 1}`}</th>)}
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, ri) => (
                      <tr key={ri}>
                        <td className="text-muted-foreground">{ri + 1}</td>
                        {tableCols.map((c, ci) => (
                          <td key={ci}>
                            <input className="eng-input py-0.5 text-[11px]" value={row[c.key] || ""}
                              onChange={e => { const r = [...tableRows]; r[ri] = { ...r[ri], [c.key]: e.target.value }; setTableRows(r); }} />
                          </td>
                        ))}
                        <td>
                          <button
                            onClick={() => setTableRows(tableRows.filter((_, i) => i !== ri))}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Remove row ${ri + 1}`}
                            title={`Remove row ${ri + 1}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setTableRows([...tableRows, {}])} className="text-[10px] text-primary hover:underline">+ Add Row</button>
            </div>
          )}

          <button onClick={handleCreateTable} className="bg-primary text-primary-foreground px-3 py-2 rounded text-xs font-medium mt-3 w-full">
            Save Table
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-muted-foreground">Filter:</span>
        <button onClick={() => setFilterType("all")} className={`text-[10px] px-2 py-0.5 rounded border ${filterType === "all" ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border"}`}>All</button>
        {SOURCE_TYPES.slice(0, 8).map(t => (
          <button key={t} onClick={() => setFilterType(t)} className={`text-[10px] px-2 py-0.5 rounded border ${filterType === t ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border"}`}>
            {t.replace(/-/g, " ")}
          </button>
        ))}
      </div>

      {/* Sources Table */}
      {filteredSources.length === 0 ? (
        <div className="eng-card text-center py-12">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No source documents loaded</p>
          <p className="text-xs text-muted-foreground mt-1">Upload source-referenced engineering tables to enable calculations</p>
        </div>
      ) : (
        <div className="eng-card overflow-x-auto">
          <table className="eng-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Standard</th>
                <th>Edition</th>
                <th>Type</th>
                <th>Status</th>
                <th>Completeness</th>
                <th className="w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSources.map((src) => (
                <tr key={src.id} className={`cursor-pointer ${selectedSource === src.id ? "bg-primary/5" : "hover:bg-secondary/30"}`}
                  onClick={() => setSelectedSource(selectedSource === src.id ? null : src.id)}>
                  <td className="font-sans text-sm">{src.title}</td>
                  <td>{src.standard}</td>
                  <td>{displayEdition(src)}</td>
                  <td className="text-[10px]">{src.type.replace(/-/g, " ")}</td>
                  <td><StatusBadge status={src.status} /></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${src.mappingCompleteness}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{src.mappingCompleteness}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {src.status === "draft" && (
                        <button onClick={() => handleApprove(src.id)} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary hover:bg-primary/25" title="Mark reviewed">
                          Reviewed
                        </button>
                      )}
                      {(src.status === "approved" || src.status === "parsed") && (
                        <button onClick={() => handleActivate(src.id)} className="text-[9px] px-1.5 py-0.5 rounded bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/25" title="Activate">
                          Activate
                        </button>
                      )}
                      {!isDefaultSource(src) && registry.sources.some(s => isDefaultSource(s) && s.type === src.type) && (
                        <button
                          onClick={() => handleRevertSourceToDefault(src)}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground hover:text-foreground"
                          title="Revert this source type to the app default data"
                        >
                          <RotateCcw className="h-3 w-3 inline mr-0.5" /> Default
                        </button>
                      )}
                      {isDefaultSource(src) && src.status === "archived" && (
                        <button
                          onClick={() => handleRevertSourceToDefault(src)}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground hover:text-foreground"
                          title="Restore app default source data"
                        >
                          <RotateCcw className="h-3 w-3 inline mr-0.5" /> Restore
                        </button>
                      )}
                      {src.status !== "archived" && (
                        <button
                          onClick={() => { registry.updateSource(src.id, { status: "archived" }); registry.addAuditEntry({ action: "archive", sourceId: src.id, userId: "Current User", details: "Source archived" }); }}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Delete source record for ${src.title}`}
                          title={`Delete source record for ${src.title}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Source Detail Panel */}
      {selectedSrc && (
        <div className="eng-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="eng-label">Source Details: {selectedSrc.title}</div>
            <button
              onClick={() => setSelectedSource(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close source details"
              title="Close source details"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><span className="text-muted-foreground">Standard:</span> <span className="font-mono">{selectedSrc.standard}</span></div>
            <div><span className="text-muted-foreground">Edition:</span> <span className="font-mono">{displayEdition(selectedSrc)}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={selectedSrc.status} /></div>
            <div><span className="text-muted-foreground">Origin:</span> <span className="font-mono">{selectedSrc.origin}</span></div>
            <div><span className="text-muted-foreground">Uploaded:</span> <span className="font-mono">{selectedSrc.uploadDate || "—"}</span></div>
            <div><span className="text-muted-foreground">Uploaded By:</span> <span className="font-mono">{selectedSrc.uploadedBy || "—"}</span></div>
            <div><span className="text-muted-foreground">Reviewed By:</span> <span className="font-mono">{selectedSrc.approvedBy || "—"}</span></div>
            <div><span className="text-muted-foreground">File:</span> <span className="font-mono">{selectedSrc.fileName || "—"}</span></div>
          </div>
          {selectedSrc.status === "archived" && (
            <div className="rounded border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              Deleted. This source box is retained for audit visibility. Use Restore or Default to reactivate the bundled app source data.
            </div>
          )}
          <div><span className="text-xs text-muted-foreground">Linked Modules: </span>
            {selectedSrc.modulesLinked.length > 0 ? selectedSrc.modulesLinked.map(m => (
              <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 mr-1">{m}</span>
            )) : <span className="text-[10px] text-muted-foreground italic">None</span>}
          </div>

          {/* Tables for this source */}
          {selectedTables.length > 0 && (
            <div>
              <div className="eng-label mb-1">Mapped Tables ({selectedTables.length})</div>
              {selectedTables.map(t => (
                <div key={t.id} className="bg-secondary/30 rounded p-2 mb-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{t.tableName} {t.tableNumber && `(${t.tableNumber})`}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="text-[10px] text-muted-foreground">{t.columns.length} columns • {t.rows.length} rows • v{t.version}</div>
                </div>
              ))}
            </div>
          )}

          {selectedSrc.notes && (
            <div className="text-xs text-muted-foreground italic">{selectedSrc.notes}</div>
          )}
        </div>
      )}

      {/* Audit Log */}
      {registry.auditLog.length > 0 && (
        <div className="eng-card">
          <div className="eng-label mb-2">Recent Audit Activity</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {registry.auditLog.slice(-10).reverse().map(entry => (
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

      <div className="eng-card">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <div className="eng-label">Access Control</div>
        </div>
        <p className="text-xs text-muted-foreground">
          Source data editing and approval requires Admin or Lead Piping Engineer role.
          Engineers can view and use reviewed/active sources. Viewers have read-only access.
        </p>
      </div>

      {/* Dataset Management System */}
      <DatasetPanel />

      <EngineeringDisclaimer />
    </div>
  );
}
