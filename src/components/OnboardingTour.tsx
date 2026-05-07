import { useEffect, useLayoutEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "onboarding_completed_v1";

type Step = {
  selector: string;
  title: string;
  description: string;
  onShow?: () => void;
};

function buildSteps(navigate?: (tab: string) => void): Step[] {
  return [
    {
      selector: "[data-onboarding='main']",
      title: "Welcome",
      description: "Welcome! This is your main workspace. Let's take a quick tour.",
      onShow: () => navigate?.("home"),
    },
    {
      selector: "[data-onboarding='design-basis']",
      title: "Enter Design Basis",
      description: "From the Home tab, start by entering your design basis here.",
      onShow: () => navigate?.("home"),
    },
    {
      selector: "[data-onboarding='main']",
      title: "Design Inputs",
      description: "In the Inputs tab, define line parameters, service conditions, materials, pressure, temperature, and design requirements.",
      onShow: () => navigate?.("inputs"),
    },
    {
      selector: "[data-onboarding='main']",
      title: "Results",
      description: "Open a results module like Material Selection to see calculated outputs, alternatives, and references.",
      onShow: () => navigate?.("material"),
    },
    {
      selector: "[data-onboarding='nav']",
      title: "Explore Other Modules",
      description: "Use this navigation to explore other modules — Thickness, Flanges, Bolting, Valves, Reports, and more.",
    },
    {
      selector: "[data-onboarding='help']",
      title: "How to Use",
      description: "Click 'How to Use' anytime to replay this guide.",
    },
  ];
}

type Rect = { top: number; left: number; width: number; height: number };

function getRect(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function OnboardingTour({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate?: (tab: string) => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const allSteps = buildSteps(onNavigate);
  // Filter steps to only those whose target exists
  const activeSteps = allSteps.filter((s) => {
    const el = document.querySelector(s.selector);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    // Skip elements that are not actually rendered (e.g. hidden via display:none on this breakpoint)
    return r.width > 0 && r.height > 0;
  });
  const step = activeSteps[stepIndex];

  // Run onShow side-effect (e.g. navigate) when step becomes active
  useEffect(() => {
    if (open && step?.onShow) step.onShow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stepIndex]);

  const selector = step?.selector;
  useLayoutEffect(() => {
    if (!open || !selector) return;
    const updateRect = () => {
      const el = document.querySelector(selector);
      if (!el) {
        setRect((prev) => (prev === null ? prev : null));
        return;
      }
      const r = el.getBoundingClientRect();
      const next = { top: r.top, left: r.left, width: r.width, height: r.height };
      setRect((prev) => {
        if (
          prev &&
          prev.top === next.top &&
          prev.left === next.left &&
          prev.width === next.width &&
          prev.height === next.height
        ) {
          return prev;
        }
        return next;
      });
    };
    // Scroll once when step changes
    const el = document.querySelector(selector);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    updateRect();
    const onResize = () => updateRect();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const t = setInterval(updateRect, 300);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      clearInterval(t);
    };
  }, [open, selector]);

  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open]);

  if (!open || !step) return null;

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    onClose();
  };

  const next = () => {
    if (stepIndex >= activeSteps.length - 1) finish();
    else setStepIndex(stepIndex + 1);
  };

  // Card placement: prefer below, fallback above
  const cardWidth = Math.min(340, window.innerWidth - 24);
  const cardHeight = 160;
  const padding = 12;
  let cardTop = 100;
  let cardLeft = 100;
  if (rect) {
    const spaceBelow = window.innerHeight - (rect.top + rect.height);
    if (spaceBelow > cardHeight + padding + 20) {
      cardTop = rect.top + rect.height + padding;
    } else {
      cardTop = Math.max(padding, rect.top - cardHeight - padding);
    }
    cardLeft = Math.min(
      Math.max(padding, rect.left + rect.width / 2 - cardWidth / 2),
      window.innerWidth - cardWidth - padding,
    );
  } else {
    cardTop = window.innerHeight / 2 - cardHeight / 2;
    cardLeft = window.innerWidth / 2 - cardWidth / 2;
  }

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={finish} />

      {/* Highlight ring (green) */}
      {rect && (
        <div
          className="absolute rounded-md transition-all duration-200 pointer-events-none"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            border: "2px solid hsl(142 70% 45%)",
            boxShadow:
              "0 0 0 4px hsl(142 70% 45% / 0.35), 0 0 18px 2px hsl(142 70% 45% / 0.55)",
          }}
        />
      )}

      {/* Card (blue) */}
      <div
        className="absolute rounded-lg shadow-xl p-4 pointer-events-auto"
        style={{
          top: cardTop,
          left: cardLeft,
          width: cardWidth,
          backgroundColor: "hsl(214 90% 22%)",
          border: "1px solid hsl(214 80% 40%)",
          color: "hsl(210 40% 98%)",
        }}
      >
        <button
          aria-label="Close"
          onClick={finish}
          className="absolute top-2 right-2 opacity-80 hover:opacity-100"
          style={{ color: "hsl(210 40% 98%)" }}
        >
          <X className="h-4 w-4" />
        </button>
        <div className="text-xs mb-1" style={{ color: "hsl(210 40% 90% / 0.85)" }}>
          Step {stepIndex + 1} of {activeSteps.length}
        </div>
        <div className="text-sm font-semibold mb-1" style={{ color: "hsl(210 40% 98%)" }}>
          {step.title}
        </div>
        <div className="text-xs mb-4" style={{ color: "hsl(210 40% 95% / 0.9)" }}>
          {step.description}
        </div>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={finish}
            className="text-xs px-3 py-1.5 rounded-md hover:bg-white/10"
            style={{ color: "hsl(210 40% 95%)" }}
          >
            Skip
          </button>
          <button
            onClick={next}
            className="text-xs font-medium px-3 py-1.5 rounded-md"
            style={{
              backgroundColor: "hsl(210 40% 98%)",
              color: "hsl(214 90% 22%)",
            }}
          >
            {stepIndex >= activeSteps.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Small delay to let layout settle
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  return {
    open,
    start: () => setOpen(true),
    close: () => setOpen(false),
    reset: () => {
      localStorage.removeItem(STORAGE_KEY);
      setOpen(true);
    },
  };
}
