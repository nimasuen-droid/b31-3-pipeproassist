import { Lightbulb, GraduationCap } from "lucide-react";
import type { ReactNode } from "react";

interface LearningMomentProps {
  title: string;
  principle: string;
  children?: ReactNode;
  reference?: string;
}

/**
 * LearningMoment — explains the underlying engineering principle
 * behind a module's calculations/selections so users build intuition.
 */
export function LearningMoment({ title, principle, children, reference }: LearningMomentProps) {
  return (
    <div className="eng-card border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-primary/5 print:hidden">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0 mt-0.5">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <GraduationCap className="h-3 w-3 text-primary absolute -bottom-1 -right-1.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
              Learning Moment
            </span>
            <span className="text-xs font-medium text-foreground">{title}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{principle}</p>
          {children && <div className="mt-2 text-[11px] text-muted-foreground leading-relaxed">{children}</div>}
          {reference && (
            <div className="text-[9px] font-mono text-primary mt-2">{reference}</div>
          )}
        </div>
      </div>
    </div>
  );
}
