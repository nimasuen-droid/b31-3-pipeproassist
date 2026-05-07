import { useEffect, useState } from "react";
import { EulaContent } from "@/components/EulaContent";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { clearEulaAcceptance, getEulaAcceptance } from "@/lib/eula";

export function EulaModule() {
  const [acceptance, setAcceptance] = useState(() => getEulaAcceptance());

  useEffect(() => {
    setAcceptance(getEulaAcceptance());
  }, []);

  const formatted = acceptance
    ? new Date(acceptance.acceptedAt).toLocaleString()
    : null;

  const revoke = () => {
    if (!confirm("Revoke EULA acceptance? You will be required to accept again before continuing to use the app.")) return;
    clearEulaAcceptance();
    window.location.reload();
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold">End User License Agreement</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Legal terms governing your use of this application.
        </p>
      </div>

      {acceptance && (
        <div className="eng-card flex items-start gap-2 bg-primary/5 border-primary/20">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-medium text-foreground">EULA accepted</div>
            <div className="text-[11px] text-muted-foreground font-mono">
              Version {acceptance.version} · Accepted {formatted}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={revoke} className="shrink-0">
            <RefreshCw className="h-3 w-3 mr-1" /> Revoke
          </Button>
        </div>
      )}

      <section className="eng-card">
        <EulaContent />
      </section>
    </div>
  );
}
