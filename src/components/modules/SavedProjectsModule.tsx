import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDesignInputs, type OverrideKeys } from "@/stores/designInputsStore";
import {
  listProjects, listSpecsByProject, createProject, updateProject, deleteProject,
  deleteSpec, renameSpec, deleteSpecsByProject,
  migrateLegacySpecsFromLocalStorage, getSyncMeta,
  type LocalProject, type LocalSpec,
} from "@/lib/localProjectStore";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { syncAll, resolveConflict, resolveSpecConflict } from "@/lib/cloudSync";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Save, FolderOpen, Folder, Trash2, LogIn, LogOut, UserPlus, Loader2, Clock,
  FileText, BookOpen, RefreshCw, HardDrive, Cloud, CloudOff, AlertTriangle,
  CheckCircle2, ChevronLeft, Pencil, FolderPlus, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";

export function SavedProjectsModule() {
  const { user, loading: authLoading, signIn, signUp, signOut, resetPassword } = useAuth();
  const { inputs, setInputs, overrides, setOverrides, setCalculated, setSessionSource } = useDesignInputs();
  const online = useOnlineStatus();
  const { selectedProjectId, setSelectedProjectId, selectedProject, reload: reloadSelected } = useSelectedProject();

  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [specs, setSpecs] = useState<LocalSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveName, setSaveName] = useState("");
  const [saveDesc, setSaveDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | undefined>();

  // Auth form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const isSignUp = authMode === "signup";
  const isForgot = authMode === "forgot";

  const refresh = useCallback(async () => {
    const [p, s, meta] = await Promise.all([
      listProjects(),
      listSpecsByProject(selectedProjectId),
      getSyncMeta(),
    ]);
    setProjects(p);
    setSpecs(s);
    setLastSyncAt(meta.lastSyncAt);
  }, [selectedProjectId]);

  useEffect(() => {
    (async () => {
      const migrated = await migrateLegacySpecsFromLocalStorage();
      if (migrated > 0) toast.success(`Imported ${migrated} local spec${migrated > 1 ? "s" : ""} into offline storage`);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  useEffect(() => {
    const fn = () => refresh();
    window.addEventListener("focus", fn);
    window.addEventListener("pipepal:sync-complete", fn);
    return () => {
      window.removeEventListener("focus", fn);
      window.removeEventListener("pipepal:sync-complete", fn);
    };
  }, [refresh]);

  const handleCreateProject = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      const p = await createProject({
        name: saveName.trim(),
        description: saveDesc.trim(),
        designInputs: inputs,
        overrides,
      });
      toast.success(`Project "${p.name}" created`);
      setSaveName(""); setSaveDesc("");
      setSelectedProjectId(p.id);
      await refresh();
    } catch (e) {
      toast.error("Save failed: " + String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProject = async (p: LocalProject) => {
    try {
      await updateProject(p.id, { designInputs: inputs, overrides });
      toast.success(`"${p.name}" updated with current inputs`);
      await refresh();
      await reloadSelected();
    } catch (e) {
      toast.error("Update failed: " + String(e));
    }
  };

  const handleOpenProject = async (p: LocalProject) => {
    setSelectedProjectId(p.id);
    setInputs(p.designInputs);
    setOverrides(p.overrides as Record<OverrideKeys, boolean>);
    setCalculated(false);
    setSessionSource({ type: "project", name: p.name, id: p.id });
    toast.success(`Opened "${p.name}"`);
  };

  const handleRenameProject = async (p: LocalProject) => {
    const next = prompt("Rename project:", p.name);
    if (!next || !next.trim() || next.trim() === p.name) return;
    await updateProject(p.id, { name: next.trim() });
    toast.success("Project renamed");
    await refresh();
    await reloadSelected();
  };

  const handleDeleteProject = async (p: LocalProject) => {
    const childSpecs = await listSpecsByProject(p.id);
    const msg = childSpecs.length
      ? `Delete project "${p.name}" and its ${childSpecs.length} spec${childSpecs.length > 1 ? "s" : ""}? This cannot be undone.`
      : `Delete project "${p.name}"?`;
    if (!confirm(msg)) return;
    await deleteSpecsByProject(p.id);
    await deleteProject(p.id);
    if (selectedProjectId === p.id) setSelectedProjectId(null);
    toast.success("Project deleted");
    await refresh();
  };

  const handleLoadSpec = (spec: LocalSpec) => {
    if (spec.designInputs) setInputs(spec.designInputs);
    if (spec.overrides) setOverrides(spec.overrides as Record<OverrideKeys, boolean>);
    setCalculated(false);
    setSessionSource({ type: "spec", name: spec.specNumber, id: spec.id });
    toast.success(`Loaded spec "${spec.specNumber}"`);
  };

  const handleRenameSpec = async (spec: LocalSpec) => {
    const nextNumber = prompt("Spec number:", spec.specNumber);
    if (!nextNumber || !nextNumber.trim()) return;
    const nextName = prompt("Spec name (optional):", spec.specName ?? "");
    await renameSpec(spec.id, nextNumber.trim(), nextName?.trim() ?? "");
    toast.success("Spec renamed");
    await refresh();
  };

  const handleDeleteSpec = async (spec: LocalSpec) => {
    if (!confirm(`Delete spec "${spec.specNumber}"?`)) return;
    await deleteSpec(spec.id);
    toast.success("Spec deleted");
    await refresh();
  };

  const handleSync = async () => {
    if (!user) { toast.error("Sign in to sync"); return; }
    if (!online) { toast.error("You are offline"); return; }
    setSyncing(true);
    try {
      const r = await syncAll(user.id);
      const parts: string[] = [];
      if (r.pulled) parts.push(`${r.pulled} pulled`);
      if (r.pushed) parts.push(`${r.pushed} pushed`);
      if (r.conflicts.length) parts.push(`${r.conflicts.length} conflict${r.conflicts.length > 1 ? "s" : ""}`);
      if (r.errors.length) parts.push(`${r.errors.length} error${r.errors.length > 1 ? "s" : ""}`);
      toast.success("Sync complete: " + (parts.join(", ") || "nothing to sync"));
      if (r.errors.length) toast.error(r.errors[0]);
      await refresh();
    } catch (e) {
      toast.error("Sync failed: " + String(e));
    } finally {
      setSyncing(false);
    }
  };

  const handleResolve = async (p: LocalProject, choice: "local" | "cloud") => {
    if (!user) return;
    try {
      await resolveConflict(user.id, p.id, choice);
      toast.success(`Conflict resolved — kept ${choice} version`);
      await refresh();
    } catch (e) {
      toast.error("Resolve failed: " + String(e));
    }
  };

  const handleResolveSpec = async (spec: LocalSpec, choice: "local" | "cloud") => {
    if (!user) return;
    try {
      await resolveSpecConflict(user.id, spec.id, choice);
      toast.success(`Spec conflict resolved — kept ${choice} version`);
      await refresh();
    } catch (e) {
      toast.error("Resolve failed: " + String(e));
    }
  };

  const handleAuth = async () => {
    setAuthError(""); setAuthSubmitting(true);
    try {
      if (isForgot) {
        const { error } = await resetPassword(email);
        if (error) setAuthError(error.message);
        else {
          toast.success("Password reset email sent. Check your inbox.");
          setAuthMode("signin");
        }
      } else if (isSignUp) {
        if (password.length < 8) { setAuthError("Password must be at least 8 characters."); return; }
        if (password !== passwordConfirm) { setAuthError("Passwords do not match."); return; }
        const { error } = await signUp(email, password);
        if (error) setAuthError(error.message);
        else toast.success("Check your email to confirm your account");
      } else {
        const { error } = await signIn(email, password);
        if (error) setAuthError(error.message);
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const conflicts = projects.filter(p => p.syncStatus === "conflict");

  // ============ Spec-detail view (a single project is open) ============
  if (selectedProject) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button size="sm" variant="ghost" onClick={() => setSelectedProjectId(null)} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> All Projects
            </Button>
            <Folder className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate flex items-center gap-2">
                {selectedProject.name}
                <Badge variant="secondary" className="text-[10px]">{specs.length} spec{specs.length === 1 ? "" : "s"}</Badge>
              </h2>
              {selectedProject.description && (
                <p className="text-xs text-muted-foreground truncate">{selectedProject.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="outline" onClick={() => handleUpdateProject(selectedProject)} title="Save current inputs into this project">
              <Save className="h-3.5 w-3.5 mr-1" /> Save Inputs
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleRenameProject(selectedProject)} title="Rename project">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleDeleteProject(selectedProject)} title="Delete project & its specs" className="text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="eng-card">
          <div className="eng-label mb-3 flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Specs in this project ({specs.length})
          </div>
          {specs.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              <p>No specs in this project yet.</p>
              <p className="text-xs mt-1">
                Go to the <span className="font-medium text-foreground">Material Spec</span> or
                <span className="font-medium text-foreground"> Spec Library</span> tab,
                calculate a design, then save — it will be filed into this project automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {specs.map(spec => (
                <div key={spec.id} className="border border-border rounded-md p-2 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-medium font-mono truncate">{spec.specNumber}</span>
                        {spec.specName && <span className="text-xs text-muted-foreground truncate">— {spec.specName}</span>}
                        <Badge variant="secondary" className="text-[9px] shrink-0">Spec</Badge>
                        {user && (
                          spec.syncStatus === "synced" ? <Badge variant="outline" className="text-[9px] text-green-600 border-green-600/30"><CheckCircle2 className="h-2.5 w-2.5 mr-1" />Synced</Badge>
                          : spec.syncStatus === "pending" ? <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-600/30"><Cloud className="h-2.5 w-2.5 mr-1" />Pending</Badge>
                          : spec.syncStatus === "conflict" ? <Badge variant="outline" className="text-[9px] text-destructive border-destructive/30"><AlertTriangle className="h-2.5 w-2.5 mr-1" />Conflict</Badge>
                          : <Badge variant="outline" className="text-[9px] text-muted-foreground"><HardDrive className="h-2.5 w-2.5 mr-1" />Local</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 ml-6 mt-0.5 flex-wrap">
                        {spec.materialGroup && <span className="text-[10px] text-muted-foreground">{spec.materialGroup}</span>}
                        {spec.flangeRating && <span className="text-[10px] text-muted-foreground">{spec.flangeRating}</span>}
                        {spec.scheduleBand && <span className="text-[10px] text-muted-foreground">Band {spec.scheduleBand}</span>}
                      </div>
                      <div className="flex items-center gap-1 ml-6 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{new Date(spec.updatedAt ?? spec.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {spec.designInputs && (
                        <Button size="sm" variant="outline" onClick={() => handleLoadSpec(spec)} title="Load into working state">
                          <FolderOpen className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleRenameSpec(spec)} title="Rename spec">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteSpec(spec)} title="Delete spec" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {spec.syncStatus === "conflict" && user && (
                    <div className="mt-2 ml-6 p-2 rounded bg-destructive/10 border border-destructive/30 text-xs">
                      <div className="flex items-center gap-1 mb-1 text-destructive font-medium">
                        <AlertTriangle className="h-3 w-3" /> Conflict: local and cloud versions both changed.
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleResolveSpec(spec, "local")} className="text-[11px] h-6">Keep Local</Button>
                        <Button size="sm" variant="outline" onClick={() => handleResolveSpec(spec, "cloud")} className="text-[11px] h-6">Use Cloud</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ Folder view (all projects) ============
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Projects
            <Badge variant="secondary" className="text-[10px]">
              <HardDrive className="h-3 w-3 mr-1" /> Local-First
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground">
            Each project is a folder. Open one to see its specs. {user ? `Signed in as ${user.email}.` : "Sign in to sync to cloud."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing || !online} title={online ? "Sync local ↔ cloud" : "Offline — sync unavailable"}>
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : online ? <RefreshCw className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
              <span className="ml-1 text-xs">Sync</span>
            </Button>
          )}
          {user ? (
            <Button size="sm" variant="ghost" onClick={signOut}><LogOut className="h-4 w-4 mr-1" /> Sign Out</Button>
          ) : null}
        </div>
      </div>

      {/* Sync status strip */}
      {user && (
        <div className="text-[11px] text-muted-foreground flex items-center gap-3 px-1">
          {online ? <Cloud className="h-3 w-3 text-green-600" /> : <CloudOff className="h-3 w-3 text-amber-600" />}
          <span>{online ? "Online" : "Offline"}</span>
          <span>·</span>
          <span>Last sync: {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : "never"}</span>
          {conflicts.length > 0 && (
            <>
              <span>·</span>
              <span className="text-amber-600 inline-flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {conflicts.length} conflict{conflicts.length > 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      )}

      {/* Auth */}
      {!user && showAuthForm && (
        <div className="eng-card max-w-sm space-y-3">
          <div className="text-sm font-medium">
            {isForgot ? "Reset Password" : isSignUp ? "Create Account" : "Sign In"}
          </div>
          <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && isForgot && handleAuth()} />
          {!isForgot && (
            <div className="relative">
              <Input placeholder="Password" type={showPassword ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !isSignUp && handleAuth()}
                className="pr-9" />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}
          {isSignUp && (
            <div className="relative">
              <Input placeholder="Confirm password" type={showPasswordConfirm ? "text" : "password"} value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAuth()}
                className="pr-9" />
              <button type="button" onClick={() => setShowPasswordConfirm(s => !s)}
                aria-label={showPasswordConfirm ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground hover:text-foreground">
                {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}
          {authError && <p className="text-xs text-destructive">{authError}</p>}
          <Button size="sm" onClick={handleAuth}
            disabled={authSubmitting || !email || (!isForgot && !password) || (isSignUp && !passwordConfirm)}
            className="w-full">
            {authSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            <span className="ml-1">{isForgot ? "Send Reset Link" : isSignUp ? "Create Account" : "Sign In"}</span>
          </Button>
          <div className="flex flex-col gap-1">
            {!isForgot && (
              <button className="text-xs text-primary hover:underline text-left"
                onClick={() => { setAuthMode(isSignUp ? "signin" : "signup"); setAuthError(""); }}>
                {isSignUp ? "Already have an account? Sign in" : "No account? Create one"}
              </button>
            )}
            {!isSignUp && (
              <button className="text-xs text-primary hover:underline text-left"
                onClick={() => { setAuthMode(isForgot ? "signin" : "forgot"); setAuthError(""); }}>
                {isForgot ? "Back to sign in" : "Forgot password?"}
              </button>
            )}
          </div>
        </div>
      )}
      {!user && !showAuthForm && (
        <div className="eng-card flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Optional: sign in to sync your local projects to the cloud across devices.</span>
          <Button size="sm" variant="ghost" onClick={() => setShowAuthForm(true)} className="text-xs">
            <LogIn className="h-3 w-3 mr-1" /> Sign In
          </Button>
        </div>
      )}

      {/* Create new project */}
      <div className="eng-card space-y-2">
        <div className="eng-label flex items-center gap-1"><FolderPlus className="h-3 w-3" /> New Project</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder="Project name" value={saveName} onChange={e => setSaveName(e.target.value)} className="min-h-10 flex-1" />
          <Input placeholder="Description (optional)" value={saveDesc} onChange={e => setSaveDesc(e.target.value)} className="min-h-10 flex-1" />
          <Button size="sm" onClick={handleCreateProject} disabled={saving || !saveName.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
            <span className="ml-1">Create</span>
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          The project starts with your current design inputs. You can add specs to it later.
        </p>
      </div>

      {/* Projects list (folders) */}
      <div className="eng-card">
        <div className="eng-label mb-3 flex items-center gap-2">
          <Folder className="h-3.5 w-3.5 text-primary" />
          Projects ({projects.length})
        </div>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No projects yet. Create one above to start grouping specs.</p>
        ) : (
          <div className="space-y-2">
            {projects.map(p => {
              const statusBadge =
                p.syncStatus === "synced" ? <Badge variant="outline" className="text-[9px] text-green-600 border-green-600/30"><CheckCircle2 className="h-2.5 w-2.5 mr-1" />Synced</Badge>
                : p.syncStatus === "pending" ? <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-600/30"><Cloud className="h-2.5 w-2.5 mr-1" />Pending</Badge>
                : p.syncStatus === "conflict" ? <Badge variant="outline" className="text-[9px] text-destructive border-destructive/30"><AlertTriangle className="h-2.5 w-2.5 mr-1" />Conflict</Badge>
                : <Badge variant="secondary" className="text-[9px]"><HardDrive className="h-2.5 w-2.5 mr-1" />Local</Badge>;
              return (
                <div key={p.id} className="border border-border rounded-md p-2 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      className="flex-1 min-w-0 text-left"
                      onClick={() => handleOpenProject(p)}
                      title="Open project"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <Folder className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-medium truncate">{p.name}</span>
                        {statusBadge}
                      </div>
                      {p.description && <p className="text-[11px] text-muted-foreground ml-6 truncate">{p.description}</p>}
                      <div className="flex items-center gap-1 ml-6 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">Modified {new Date(p.updatedAt).toLocaleString()}</span>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleOpenProject(p)} title="Open">
                        <FolderOpen className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRenameProject(p)} title="Rename">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteProject(p)} title="Delete" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {p.syncStatus === "conflict" && user && (
                    <div className="mt-2 ml-6 p-2 rounded bg-destructive/10 border border-destructive/30 text-xs">
                      <div className="flex items-center gap-1 mb-1 text-destructive font-medium">
                        <AlertTriangle className="h-3 w-3" /> Conflict: local and cloud versions both changed.
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleResolve(p, "local")} className="text-[11px] h-6">
                          Keep Local
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleResolve(p, "cloud")} className="text-[11px] h-6">
                          Use Cloud
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
