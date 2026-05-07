import { CornerUpLeft } from "lucide-react";
import { useDesignInputs } from "@/stores/designInputsStore";
import { normalizeNpsForPicker } from "@/lib/nps";

/**
 * Small inline action for module-local NPS pickers.
 *
 * Use inside any module that lets the user pick an NPS for a temporary
 * what-if / batch / sensitivity check. Clicking it resets the local
 * picker back to the active line NPS from the shared design inputs —
 * WITHOUT modifying the shared inputs.
 *
 * Example:
 *   const [localNps, setLocalNps] = useState(inputs.nominalPipeSize);
 *   ...
 *   <BackToLineNps onReset={(nps) => setLocalNps(nps)} currentLocal={localNps} />
 */
export function BackToLineNps({
  onReset,
  currentLocal,
  className = "",
}: {
  onReset: (lineNps: string) => void;
  currentLocal?: string;
  className?: string;
}) {
  const { inputs } = useDesignInputs();
  const lineNps = normalizeNpsForPicker(inputs.nominalPipeSize);
  if (!lineNps) return null;
  const matches = currentLocal !== undefined && normalizeNpsForPicker(currentLocal) === lineNps;
  return (
    <button
      type="button"
      onClick={() => onReset(lineNps)}
      disabled={matches}
      title={matches ? "Local size already matches the active line NPS" : `Reset to active line NPS (${lineNps}")`}
      className={`inline-flex min-h-10 items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      <CornerUpLeft className="h-3 w-3" />
      Back to Line NPS ({lineNps}")
    </button>
  );
}
