import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { BookOpen, Plus, Trash2, Download, Upload, FileText, AlertTriangle, Save, FolderOpen, HardDrive, Archive, Folder, FolderPlus, Pencil, RefreshCw, Library } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useDesignInputs, type OverrideKeys } from "@/stores/designInputsStore";
import { generatePMS, type PipingMaterialSpec } from "./pms/pmsEngine";
import { useToast } from "@/hooks/use-toast";
import {
  listSpecsByProject,
  listSpecs,
  saveSpec as saveSpecToDb,
  deleteSpec as deleteSpecFromDb,
  renameSpec as renameSpecInDb,
  migrateLegacySpecsFromLocalStorage,
  listProjects, createProject,
  type LocalSpec, type LocalProject,
} from "@/lib/localProjectStore";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { useAuth } from "@/hooks/useAuth";
import { syncAll, getSyncMeta } from "@/lib/cloudSync";

/** UI shape — same fields as LocalSpec but with required `data` for rendering */
type SavedSpec = LocalSpec & { data: PipingMaterialSpec };

interface SyncDiag {
  lastPulled?: number;
  lastPushed?: number;
  conflictCount?: number;
  lastSyncAt?: string;
  lastError?: string;
  syncing: boolean;
}

export function SpecLibraryModule() {
  const { inputs, setInputs, recommendations, activePipeMaterial, overrides, setOverrides, calculated, setCalculated, setSessionSource } = useDesignInputs();
  const { toast } = useToast();
  const { selectedProjectId, setSelectedProjectId, selectedProject } = useSelectedProject();
  const { user } = useAuth();

  const [specs, setSpecs] = useState<SavedSpec[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<SavedSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<LocalProject[]>([]);
  // (legacy inline picker state removed — replaced by save dialog)
  const [newProjectName, setNewProjectName] = useState("");
  const [diag, setDiag] = useState<SyncDiag>({ syncing: false });

  const refresh = useCallback(async () => {
    const [all, projs] = await Promise.all([
      selectedProjectId ? listSpecsByProject(selectedProjectId) : listSpecs(),
      listProjects(),
    ]);
    const filtered = all.filter((s): s is SavedSpec => !!s.data);
    setSpecs(filtered);
    setAllProjects(projs);
  }, [selectedProjectId]);

  const runSync = useCallback(async (manual = false) => {
    if (!user) {
      if (manual) toast({ title: "Sign in to sync", description: "You must be signed in to sync specs.", variant: "destructive" });
      return;
    }
    setDiag(d => ({ ...d, syncing: true }));
    try {
      const result = await syncAll(user.id);
      const meta = await getSyncMeta();
      setDiag({
        lastPulled: result.pulled,
        lastPushed: result.pushed,
        conflictCount: result.conflicts.length,
        lastSyncAt: meta.lastSyncAt,
        lastError: result.errors[0],
        syncing: false,
      });
      await refresh();
      if (manual) {
        toast({
          title: "Sync complete",
          description: `Pulled ${result.pulled}, pushed ${result.pushed}${result.conflicts.length ? `, ${result.conflicts.length} conflict(s)` : ""}.`,
        });
      }
    } catch (e) {
      setDiag(d => ({ ...d, syncing: false, lastError: String(e) }));
    }
  }, [user, refresh, toast]);

  // Initial load + one-time legacy migration + sync if signed in
  useEffect(() => {
    (async () => {
      try {
        const migrated = await migrateLegacySpecsFromLocalStorage();
        if (migrated > 0) {
          toast({ title: "Imported legacy specs", description: `${migrated} spec(s) migrated from local storage.` });
        }
        await refresh();
        if (user) await runSync(false);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Refresh after cloud sync completes (triggered by other modules / auth hook)
  useEffect(() => {
    const fn = () => { void refresh(); };
    window.addEventListener("pipepal:sync-complete", fn);
    return () => window.removeEventListener("pipepal:sync-complete", fn);
  }, [refresh]);

  const currentPms = useMemo(() => {
    if (!calculated) return null;
    return generatePMS(inputs, recommendations, activePipeMaterial, overrides);
  }, [inputs, recommendations, activePipeMaterial, overrides, calculated]);

  const [newSpecNumber, setNewSpecNumber] = useState("");
  const [newSpecName, setNewSpecName] = useState("");

  const lastPmsRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentPms && currentPms.designBasis.specNumber !== lastPmsRef.current) {
      lastPmsRef.current = currentPms.designBasis.specNumber;
      setNewSpecNumber(currentPms.designBasis.specNumber);
      setNewSpecName(currentPms.designBasis.specName);
    }
  }, [currentPms]);

  const canSave = calculated && newSpecNumber.trim().length > 0;

  const persistSpec = async (projectId: string | null) => {
    const pms = generatePMS(inputs, recommendations, activePipeMaterial, overrides, newSpecNumber.trim(), newSpecName.trim());
    const now = new Date().toISOString();
    const newEntry: SavedSpec = {
      id: crypto.randomUUID(),
      projectId: projectId ?? undefined,
      specNumber: pms.designBasis.specNumber,
      specName: pms.designBasis.specName,
      materialGroup: pms.designBasis.materialGroup,
      flangeRating: pms.designBasis.flangeRating,
      scheduleBand: pms.scheduleBand,
      serviceType: pms.designBasis.serviceType,
      createdAt: now,
      updatedAt: now,
      data: pms,
      designInputs: { ...inputs },
      overrides: { ...overrides },
    };
    await saveSpecToDb(newEntry);
    await refresh();
    setNewSpecNumber("");
    setNewSpecName("");
    if (projectId) {
      const proj = allProjects.find(p => p.id === projectId) ?? (await listProjects()).find(p => p.id === projectId);
      toast({ title: "Spec saved", description: `Spec saved to "${proj?.name ?? "project"}".` });
    } else {
      toast({ title: "Spec saved", description: "Spec saved to Spec Library." });
    }
  };

  // ----- Save dialog (project-aware) -----
  type SaveOption = "active" | "existing" | "new" | "library";
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveOption, setSaveOption] = useState<SaveOption>("active");
  const [pickedExistingId, setPickedExistingId] = useState<string>("");

  const defaultNewProjectName = useCallback(() => {
    const fromInputs = (inputs.projectName ?? "").trim();
    if (fromInputs) return fromInputs;
    const existing = new Set(allProjects.map(p => p.name));
    let n = 1;
    while (existing.has(`Untitled Project ${n}`)) n++;
    return `Untitled Project ${n}`;
  }, [inputs.projectName, allProjects]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaveOption(selectedProjectId ? "active" : (allProjects.length > 0 ? "existing" : "new"));
    setPickedExistingId(allProjects[0]?.id ?? "");
    setNewProjectName(defaultNewProjectName());
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    if (saveOption === "active") {
      if (!selectedProjectId) return;
      setSaveDialogOpen(false);
      await persistSpec(selectedProjectId);
      return;
    }
    if (saveOption === "existing") {
      if (!pickedExistingId) return;
      setSelectedProjectId(pickedExistingId);
      setSaveDialogOpen(false);
      await persistSpec(pickedExistingId);
      return;
    }
    if (saveOption === "new") {
      const name = newProjectName.trim();
      if (!name) return;
      // Reuse exact-name match to avoid duplicate project creation
      const existing = allProjects.find(p => p.name.toLowerCase() === name.toLowerCase());
      const proj = existing ?? await createProject({
        name,
        description: "",
        designInputs: inputs,
        overrides,
      });
      setSelectedProjectId(proj.id);
      setSaveDialogOpen(false);
      setNewProjectName("");
      await persistSpec(proj.id);
      return;
    }
    if (saveOption === "library") {
      setSaveDialogOpen(false);
      await persistSpec(null);
      return;
    }
  };

  const handleRenameSpec = async (spec: SavedSpec) => {
    const nextNumber = prompt("Spec number:", spec.specNumber);
    if (!nextNumber || !nextNumber.trim()) return;
    const nextName = prompt("Spec name (optional):", spec.specName ?? "");
    await renameSpecInDb(spec.id, nextNumber.trim(), nextName?.trim() ?? "");
    await refresh();
    toast({ title: "Spec renamed" });
  };

  const handleLoadIntoWorkingState = (spec: SavedSpec) => {
    if (spec.designInputs) setInputs(spec.designInputs);
    if (spec.overrides) setOverrides(spec.overrides as Record<OverrideKeys, boolean>);
    setCalculated(false);
    setNewSpecNumber(spec.specNumber);
    setNewSpecName(spec.specName);
    setSessionSource({ type: "spec", name: spec.specNumber, id: spec.id });
    toast({
      title: "Spec loaded into working state",
      description: `"${spec.specNumber}" inputs restored. Go to Inputs and click Calculate to regenerate.`,
    });
  };

  const handleDelete = async (id: string) => {
    await deleteSpecFromDb(id);
    if (selectedSpec?.id === id) setSelectedSpec(null);
    await refresh();
    toast({ title: "Spec deleted" });
  };

  const handleExportJSON = (spec: SavedSpec) => {
    const payload = {
      ...spec.data,
      _meta: { specNumber: spec.specNumber, specName: spec.specName, designInputs: spec.designInputs, overrides: spec.overrides },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${spec.specNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    const blob = new Blob([JSON.stringify(specs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pipepal-spec-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
        const existingNums = new Set(specs.map(s => s.specNumber));
        let added = 0;
        let skipped = 0;
        for (const item of items) {
          const obj = item as Record<string, unknown>;
          const specData: PipingMaterialSpec | undefined =
            (obj.designBasis ? (obj as unknown as PipingMaterialSpec) : (obj.data as PipingMaterialSpec | undefined));
          if (!specData?.designBasis) continue;
          const meta = (obj._meta ?? obj) as Record<string, unknown>;
          const specNumber = (specData.designBasis.specNumber || (meta.specNumber as string) || "IMPORTED");
          if (existingNums.has(specNumber)) { skipped++; continue; }
          const now = new Date().toISOString();
          const imported: SavedSpec = {
            id: (obj.id as string) || crypto.randomUUID(),
            projectId: selectedProjectId ?? undefined,
            specNumber,
            specName: specData.designBasis.specName || (meta.specName as string) || "",
            materialGroup: specData.designBasis.materialGroup || "",
            flangeRating: specData.designBasis.flangeRating || "",
            scheduleBand: (specData as unknown as { scheduleBand?: string }).scheduleBand || "",
            serviceType: specData.designBasis.serviceType || "",
            createdAt: (obj.createdAt as string) || now,
            updatedAt: now,
            data: specData,
            designInputs: (meta.designInputs ?? obj.designInputs) as SavedSpec["designInputs"],
            overrides: (meta.overrides ?? obj.overrides) as SavedSpec["overrides"],
          };
          await saveSpecToDb(imported);
          existingNums.add(specNumber);
          added++;
        }
        await refresh();
        toast({
          title: "Import complete",
          description: `${added} spec(s) added${skipped ? `, ${skipped} skipped (duplicate spec #)` : ""}.`,
        });
      } catch {
        toast({ title: "Import failed", description: "Could not read the JSON file.", variant: "destructive" });
      }
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Spec Library</CardTitle>
          <CardDescription className="flex items-center gap-2 flex-wrap">
            <span>Create, save, load, and manage piping material specifications</span>
            <Badge variant="outline" className="text-[10px] gap-1"><HardDrive className="h-3 w-3" /> Stored offline</Badge>
            {selectedProject ? (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Folder className="h-3 w-3" /> Project: {selectedProject.name}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" /> No project open
              </Badge>
            )}
            {selectedProject && (
              <button
                className="text-[10px] text-primary hover:underline"
                onClick={() => setSelectedProjectId(null)}
              >
                Show all
              </button>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Sync diagnostics */}
          <div className="p-3 rounded-md border border-border bg-muted/20 mb-4 text-[11px]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold flex items-center gap-1">
                <RefreshCw className={`h-3 w-3 ${diag.syncing ? "animate-spin" : ""}`} /> Cloud Sync
              </span>
              <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1" onClick={() => runSync(true)} disabled={diag.syncing || !user}>
                <RefreshCw className="h-3 w-3" /> Sync now
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-muted-foreground">
              <div>Signed in: <span className="font-mono text-foreground">{user ? "Yes" : "No"}</span></div>
              <div>Rendered: <span className="font-mono text-foreground">{specs.length}</span></div>
              <div>Last pulled: <span className="font-mono text-foreground">{diag.lastPulled ?? "—"}</span></div>
              <div>Last pushed: <span className="font-mono text-foreground">{diag.lastPushed ?? "—"}</span></div>
              <div>Conflicts: <span className="font-mono text-foreground">{diag.conflictCount ?? "—"}</span></div>
              <div className="col-span-2 md:col-span-3">Last sync: <span className="font-mono text-foreground">{diag.lastSyncAt ? new Date(diag.lastSyncAt).toLocaleString() : "—"}</span></div>
              {diag.lastError && <div className="col-span-2 md:col-span-3 text-destructive">Error: {diag.lastError}</div>}
            </div>
          </div>


          {/* Project-aware Save Dialog */}
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Save className="h-4 w-4" /> Save Spec</DialogTitle>
                <DialogDescription>
                  Choose where to file <span className="font-mono text-foreground">{newSpecNumber || "this spec"}</span>.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                {/* Active project */}
                {selectedProject && (
                  <label className={`flex items-start gap-2 p-2 rounded border cursor-pointer ${saveOption === "active" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <input type="radio" name="saveOpt" className="mt-1" checked={saveOption === "active"} onChange={() => setSaveOption("active")} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold flex items-center gap-1"><Folder className="h-3 w-3 text-primary" /> Save to active project</div>
                      <div className="text-[11px] text-muted-foreground truncate">{selectedProject.name}</div>
                    </div>
                  </label>
                )}

                {/* Existing project */}
                {allProjects.length > 0 && (
                  <label className={`flex items-start gap-2 p-2 rounded border cursor-pointer ${saveOption === "existing" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <input type="radio" name="saveOpt" className="mt-1" checked={saveOption === "existing"} onChange={() => setSaveOption("existing")} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold flex items-center gap-1"><FolderOpen className="h-3 w-3" /> Save to an existing project</div>
                      <select
                        className="mt-1 w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                        style={{ colorScheme: "dark" }}
                        value={pickedExistingId}
                        onChange={e => { setPickedExistingId(e.target.value); setSaveOption("existing"); }}
                        disabled={saveOption !== "existing"}
                      >
                        {allProjects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </label>
                )}

                {/* New project */}
                <label className={`flex items-start gap-2 p-2 rounded border cursor-pointer ${saveOption === "new" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <input type="radio" name="saveOpt" className="mt-1" checked={saveOption === "new"} onChange={() => setSaveOption("new")} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold flex items-center gap-1"><FolderPlus className="h-3 w-3" /> Create new project</div>
                    <Input
                      className="mt-1 h-8 text-xs"
                      placeholder="Project name"
                      value={newProjectName}
                      onChange={e => { setNewProjectName(e.target.value); setSaveOption("new"); }}
                      onFocus={() => setSaveOption("new")}
                    />
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Prefilled from Inputs project name when available.
                    </div>
                  </div>
                </label>

                {/* Library only */}
                <label className={`flex items-start gap-2 p-2 rounded border cursor-pointer ${saveOption === "library" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <input type="radio" name="saveOpt" className="mt-1" checked={saveOption === "library"} onChange={() => setSaveOption("library")} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold flex items-center gap-1"><Library className="h-3 w-3" /> Save to Spec Library only</div>
                    <div className="text-[11px] text-muted-foreground">Reusable spec, not tied to any project.</div>
                  </div>
                </label>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleConfirmSave}
                  disabled={
                    (saveOption === "active" && !selectedProjectId) ||
                    (saveOption === "existing" && !pickedExistingId) ||
                    (saveOption === "new" && !newProjectName.trim())
                  }
                  className="gap-1"
                >
                  <Save className="h-3 w-3" /> Save Spec
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="p-3 rounded-md border border-border bg-muted/30 mb-4">
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Plus className="h-3 w-3" /> Save Current Design as Spec</h4>
            {!calculated && (
              <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">Calculate design inputs first to save a spec.</span>
              </div>
            )}
            <div className="flex gap-2 items-end flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <label className="text-[11px] text-muted-foreground">Spec Number *</label>
                <Input className="h-8 text-xs" placeholder="e.g. A1A" value={newSpecNumber} onChange={e => setNewSpecNumber(e.target.value)} />
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="text-[11px] text-muted-foreground">Spec Name</label>
                <Input className="h-8 text-xs" placeholder="e.g. CS General HC 150#" value={newSpecName} onChange={e => setNewSpecName(e.target.value)} />
              </div>
              <Button size="sm" onClick={handleSave} disabled={!canSave} className="gap-1"><Save className="h-3 w-3" /> Save</Button>
              <Button size="sm" variant="outline" onClick={handleImportJSON} className="gap-1"><Upload className="h-3 w-3" /> Import</Button>
              <Button size="sm" variant="outline" onClick={handleExportAll} disabled={specs.length === 0} className="gap-1"><Archive className="h-3 w-3" /> Export All</Button>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-6">Loading specs…</p>
          ) : specs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              {selectedProject
                ? `No specs in "${selectedProject.name}" yet. Calculate a design and save it above.`
                : "No specs yet. Save a spec or open a project to narrow the list."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-[11px]">Spec #</TableHead>
                  <TableHead className="text-[11px]">Name</TableHead>
                  <TableHead className="text-[11px]">Material</TableHead>
                  <TableHead className="text-[11px]">Rating</TableHead>
                  <TableHead className="text-[11px]">Band</TableHead>
                  <TableHead className="text-[11px]">Status</TableHead>
                  <TableHead className="text-[11px]">Modified</TableHead>
                  <TableHead className="text-[11px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specs.map(spec => (
                  <TableRow key={spec.id} className={selectedSpec?.id === spec.id ? "bg-primary/5" : ""}>
                     <TableCell className="text-xs font-mono font-medium">
                       <div className="space-y-1">
                         <div>{spec.specNumber}</div>
                         {!selectedProjectId && spec.projectId && (
                           <div className="text-[10px] text-muted-foreground font-sans">
                             {allProjects.find(project => project.id === spec.projectId)?.name ?? "Project"}
                           </div>
                         )}
                       </div>
                     </TableCell>
                    <TableCell className="text-xs">{spec.specName}</TableCell>
                    <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{spec.materialGroup}</Badge></TableCell>
                    <TableCell className="text-xs">{spec.flangeRating}</TableCell>
                    <TableCell className="text-xs"><Badge variant="secondary" className="text-[10px]">Band {spec.scheduleBand}</Badge></TableCell>
                     <TableCell className="text-xs">
                      <div className="flex flex-col gap-1">
                         {spec.syncStatus === "synced" ? (
                           <Badge variant="outline" className="text-[10px] gap-1 w-fit text-green-600 border-green-600/30">
                             <HardDrive className="h-2.5 w-2.5" /> Synced
                           </Badge>
                         ) : spec.syncStatus === "pending" ? (
                           <Badge variant="outline" className="text-[10px] gap-1 w-fit text-amber-600 border-amber-600/30">
                             <HardDrive className="h-2.5 w-2.5" /> Pending
                           </Badge>
                         ) : spec.syncStatus === "conflict" ? (
                           <Badge variant="outline" className="text-[10px] gap-1 w-fit text-destructive border-destructive/30">
                             <AlertTriangle className="h-2.5 w-2.5" /> Conflict
                           </Badge>
                         ) : (
                           <Badge variant="outline" className="text-[10px] gap-1 w-fit">
                             <HardDrive className="h-2.5 w-2.5" /> Local
                           </Badge>
                         )}
                        {spec.legacyImported && (
                          <Badge variant="secondary" className="text-[10px] w-fit" title="Imported from legacy localStorage">Legacy</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(spec.updatedAt ?? spec.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {spec.designInputs && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleLoadIntoWorkingState(spec)} title="Load into working state">
                            <FolderOpen className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelectedSpec(spec === selectedSpec ? null : spec)} title="Preview">
                          <FileText className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleRenameSpec(spec)} title="Rename">
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleExportJSON(spec)} title="Export JSON">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive" onClick={() => handleDelete(spec.id)} title="Delete">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedSpec && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {selectedSpec.specNumber} — {selectedSpec.specName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              {Object.entries({
                "Service": selectedSpec.data.designBasis.serviceType,
                "Rating": selectedSpec.data.designBasis.flangeRating,
                "Material": selectedSpec.data.designBasis.materialGroup,
                "Design P": selectedSpec.data.designBasis.designPressure,
                "Design T": selectedSpec.data.designBasis.designTemperature,
                "CA": selectedSpec.data.designBasis.corrosionAllowance,
                "Test": selectedSpec.data.designBasis.testPressure,
                "Band": `Band ${selectedSpec.scheduleBand}`,
              }).map(([k, v]) => (
                <div key={k} className="text-xs">
                  <span className="text-muted-foreground">{k}: </span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[11px]">Component</TableHead>
                    <TableHead className="text-[11px]">Grade</TableHead>
                    <TableHead className="text-[11px]">Schedule</TableHead>
                    <TableHead className="text-[11px]">Rating</TableHead>
                    <TableHead className="text-[11px]">End Conn.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSpec.data.materialTable.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium">{row.component}</TableCell>
                      <TableCell className="text-xs font-mono">{row.grade}</TableCell>
                      <TableCell className="text-xs">{row.schedule}</TableCell>
                      <TableCell className="text-xs">{row.rating}</TableCell>
                      <TableCell className="text-xs">{row.endConnection}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
