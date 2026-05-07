import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * Persistent thin banner shown when the browser reports offline.
 * The app remains fully functional offline — this is informational only.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-accent/10 border-b border-accent/30 text-accent text-xs px-3 py-1.5 flex items-center justify-center gap-2 shrink-0"
    >
      <WifiOff className="h-3.5 w-3.5" />
      <span>You are offline. All calculations and reference data still work locally.</span>
    </div>
  );
}
