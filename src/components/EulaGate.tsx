import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldAlert } from "lucide-react";
import { EulaContent } from "@/components/EulaContent";
import { getEulaAcceptance, setEulaAccepted } from "@/lib/eula";

interface EulaGateProps {
  children: React.ReactNode;
}

export function EulaGate({ children }: EulaGateProps) {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAccepted(!!getEulaAcceptance());
  }, []);

  if (accepted === null) return null; // brief flash guard
  if (accepted) return <>{children}</>;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 24) {
      setScrolledToEnd(true);
    }
  };

  const canAccept = acknowledged && scrolledToEnd;

  const accept = () => {
    setEulaAccepted();
    setAccepted(true);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
          <ShieldAlert className="h-4 w-4 text-accent" />
          <div>
            <div className="text-sm font-semibold">Before you continue</div>
            <div className="text-[11px] text-muted-foreground">
              Please review and accept the End User License Agreement to use this application.
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-3"
        >
          <EulaContent />
        </div>

        <div className="border-t border-border px-4 py-3 shrink-0 space-y-3">
          {!scrolledToEnd && (
            <p className="text-[11px] text-accent">
              Please scroll to the end of the agreement to enable acceptance.
            </p>
          )}
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox
              checked={acknowledged}
              onCheckedChange={(v) => setAcknowledged(v === true)}
              className="mt-0.5"
            />
            <span className="text-xs text-foreground leading-relaxed">
              I understand this app does not replace professional engineering judgment, and I agree to the
              terms of the End User License Agreement.
            </span>
          </label>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = "about:blank";
              }}
            >
              Decline & Exit
            </Button>
            <Button size="sm" disabled={!canAccept} onClick={accept}>
              I Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
