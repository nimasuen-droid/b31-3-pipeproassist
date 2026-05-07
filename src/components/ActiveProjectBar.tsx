import { useState } from "react";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { useDesignInputs } from "@/stores/designInputsStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChangeProjectDialog } from "@/components/ChangeProjectDialog";
import { createProject, updateProject, type LocalProject } from "@/lib/localProjectStore";
import { Folder, FolderPlus, FolderX, Replace, Save, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/** Banner shown at the top of the Inputs module that surfaces the active project
 *  and lets the user save / change / clear it. Mirrors the chip in the header. */
export function ActiveProjectBar() {
  const { selectedProject, selectedProjectId, setSelectedProjectId, reload } = useSelectedProject();
  const { inputs, overrides, setSessionSource } = useDesignInputs();
  const [changeOpen, setChangeOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const handleSelect = async (p: LocalProject) => {
    setSelectedProjectId(p.id);
    setSessionSource({ type: "project", name: p.name, id: p.id });
    toast.success(`Active project: ${p.name}`);
  };

  const handleClear = () => {
    setSelectedProjectId(null);
    setSessionSource({ type: "unsaved", name: "New Session" });
    toast.success("Active project cleared (project not deleted)");
  };

  const handleSaveActive = async () => {
    if (!selectedProject) return;
    try {
      await updateProject(selectedProject.id, {
        designInputs: inputs,
        overrides,
        name: inputs.projectName?.trim() || selectedProject.name,
      });
      await reload();
      window.dispatchEvent(new Event("pipepal:projects-changed"));
      toast.success(`Saved to "${selectedProject.name}"`);
    } catch (e) {
      toast.error("Save failed: " + String(e));
    }
  };

  const openCreate = () => {
    setNewName(inputs.projectName?.trim() || "");
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Project name is required");
      return;
    }
    const p = await createProject({
      name,
      description: "",
      designInputs: inputs,
      overrides,
    });
    setSelectedProjectId(p.id);
    setSessionSource({ type: "project", name: p.name, id: p.id });
    setCreateOpen(false);
    setNewName("");
    window.dispatchEvent(new Event("pipepal:projects-changed"));
    toast.success(`Created project "${p.name}"`);
  };

  return (
    <>
      <div className={`flex flex-wrap items-center gap-2 p-3 rounded-lg border ${
        selectedProject
          ? "border-primary/30 bg-primary/5"
          : "border-amber-500/30 bg-amber-500/5"
      }`}>
        {selectedProject ? (
          <>
            <Folder className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">Current Project:</span>
            <span className="text-sm font-semibold truncate">{selectedProject.name}</span>
            <Badge variant="outline" className="text-[10px]">Active</Badge>
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              <Button size="sm" variant="default" onClick={handleSaveActive} className="h-7 gap-1 text-xs">
                <Save className="h-3 w-3" /> Save to Active
              </Button>
              <Button size="sm" variant="outline" onClick={() => setChangeOpen(true)} className="h-7 gap-1 text-xs">
                <Replace className="h-3 w-3" /> Change
              </Button>
              <Button size="sm" variant="ghost" onClick={handleClear} className="h-7 gap-1 text-xs text-muted-foreground">
                <FolderX className="h-3 w-3" /> Clear
              </Button>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-sm font-medium">No active project selected</span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Saved inputs/specs will not be filed under any project until you create or pick one.
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <Button size="sm" variant="default" onClick={openCreate} className="h-7 gap-1 text-xs">
                <FolderPlus className="h-3 w-3" /> Create Project
              </Button>
              <Button size="sm" variant="outline" onClick={() => setChangeOpen(true)} className="h-7 gap-1 text-xs">
                <Folder className="h-3 w-3" /> Select Existing
              </Button>
            </div>
          </>
        )}
      </div>

      <ChangeProjectDialog
        open={changeOpen}
        onOpenChange={setChangeOpen}
        currentId={selectedProjectId}
        onSelect={handleSelect}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              The current Design Inputs will be saved as the new project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-project-name">Project name</Label>
            <Input
              id="new-project-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. North Sea Crude Header"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
