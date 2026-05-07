import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PRODUCT_SHORT_NAME } from "@/lib/brand";

const NEVER_SHOW_KEY = "pipepro-install-never-show";

/**
 * Centered modal that prompts the user to install the app for offline use.
 * It only appears after the browser confirms installability.
 */
export function InstallBanner({ enabled = true }: { enabled?: boolean }) {
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!enabled || installed || !canInstall) {
      setOpen(false);
      return;
    }

    try {
      if (localStorage.getItem(NEVER_SHOW_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    const t = setTimeout(() => setOpen(true), 2400);
    return () => clearTimeout(t);
  }, [enabled, installed, canInstall]);

  const persistChoice = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(NEVER_SHOW_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  };

  const handleInstall = async () => {
    persistChoice();
    if (canInstall) await promptInstall();
    setOpen(false);
  };

  const handleDismiss = () => {
    persistChoice();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleDismiss())}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Install for Offline Use
          </DialogTitle>
          <DialogDescription>
            Install {PRODUCT_SHORT_NAME} on this device for offline access,
            faster launch, and a dedicated app window.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="dont-show-install"
            checked={dontShowAgain}
            onCheckedChange={(v) => setDontShowAgain(v === true)}
          />
          <label
            htmlFor="dont-show-install"
            className="text-sm text-muted-foreground cursor-pointer select-none"
          >
            Don't show this again
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={handleDismiss}>
            Not now
          </Button>
          <Button onClick={handleInstall}>
            <Download className="h-4 w-4 mr-1.5" />
            Install
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
