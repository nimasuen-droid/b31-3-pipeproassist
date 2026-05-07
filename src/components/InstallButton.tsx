import { Download, Check } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Button } from "@/components/ui/button";

interface HomeInstallButtonProps {
  variant?: "header" | "home";
}

/**
 * Install button used in the header (compact) and on the home screen (full width).
 * Only renders after the browser confirms installability via beforeinstallprompt.
 */
export function InstallButton({ variant = "header" }: HomeInstallButtonProps) {
  const { canInstall, installed, promptInstall } = useInstallPrompt();

  const handleClick = async () => {
    if (!canInstall) return;
    await promptInstall();
  };

  if (variant === "home") {
    if (installed) {
      return (
        <Button disabled variant="outline" className="gap-2">
          <Check className="h-4 w-4 text-green-600" />
          Installed for Offline Use
        </Button>
      );
    }

    if (!canInstall) return null;

    return (
      <Button onClick={handleClick} className="gap-2">
        <Download className="h-4 w-4" />
        Install for Offline Use
      </Button>
    );
  }

  if (installed) {
    return (
      <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-green-600">
        <Check className="h-3 w-3" /> Installed
      </span>
    );
  }

  if (!canInstall) return null;

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 min-h-[32px] rounded-md border border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary"
      title="Install as app"
    >
      <Download className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Install</span>
    </button>
  );
}
