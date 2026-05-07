import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { listProjects, type LocalProject } from "@/lib/localProjectStore";
import { Folder, Check } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentId: string | null;
  onSelect: (project: LocalProject) => void;
}

/** Lightweight picker dialog for switching the active project. */
export function ChangeProjectDialog({ open, onOpenChange, currentId, onSelect }: Props) {
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listProjects().then((p) => {
      setProjects(p);
      setLoading(false);
    });
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Active Project</DialogTitle>
          <DialogDescription>
            Pick an existing project to make it active. Saved Inputs and Specs will be filed under it.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto -mx-2 px-2">
          {loading ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Loading…</p>
          ) : projects.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No saved projects yet. Create one from the Inputs page or the Saved Projects module.
            </p>
          ) : (
            <ul className="space-y-1">
              {projects.map((p) => {
                const active = p.id === currentId;
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => { onSelect(p); onOpenChange(false); }}
                      className={`w-full text-left px-3 py-2 rounded-md border flex items-center gap-2 transition-colors ${
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-secondary/50"
                      }`}
                    >
                      <Folder className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        {p.description && (
                          <div className="text-[11px] text-muted-foreground truncate">{p.description}</div>
                        )}
                      </div>
                      {active && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
