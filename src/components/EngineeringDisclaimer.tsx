import { AlertTriangle } from "lucide-react";
import { ENGINEERING_REVIEW_NOTICE } from "@/lib/brand";

export function EngineeringDisclaimer() {
  return (
    <div className="bg-accent/5 border border-accent/20 rounded px-3 py-2 flex items-start gap-2 text-xs text-accent">
      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span>{ENGINEERING_REVIEW_NOTICE}</span>
    </div>
  );
}
