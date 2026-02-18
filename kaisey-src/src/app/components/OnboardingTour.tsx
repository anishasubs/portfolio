import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";

const TOUR_STORAGE_KEY = "kaisey-tour-seen";

interface TourStep {
  targetId: string;
  title: string;
  description: string;
}

const STEPS: TourStep[] = [
  {
    targetId: "command-center",
    title: "Your Day at a Glance",
    description:
      "See your next event, weekly balance across priorities, and switch your focus mode. Kaisey highlights what matters most based on your priority.",
  },
  {
    targetId: "brain-dump",
    title: "Brain Dump Planner",
    description:
      "Dump everything on your mind — Kaisey extracts tasks, asks clarifying questions, and builds an optimized schedule around your existing calendar.",
  },
  {
    targetId: "kaisey-chat",
    title: "Chat with Kaisey",
    description:
      'Talk to Kaisey to add, move, or remove events. Try "Add a meeting with John on Thursday at 3pm" — it works for any day, not just today.',
  },
  {
    targetId: "calendar-view",
    title: "Your Calendar",
    description:
      "View your schedule by day, week, or month. Events matching your priority are highlighted; others are muted so you can focus on what counts.",
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = STEPS[currentStep];

  const updateRect = useCallback(() => {
    const el = document.querySelector(`[data-tour-id="${step.targetId}"]`);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
    }
  }, [step.targetId]);

  useEffect(() => {
    // Small delay to let layout settle
    const timer = setTimeout(updateRect, 300);
    window.addEventListener("resize", updateRect);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
    };
  }, [updateRect]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    onComplete();
  };

  // Spotlight cutout dimensions (with padding)
  const pad = 12;
  const spotX = targetRect ? targetRect.left - pad : 0;
  const spotY = targetRect ? targetRect.top - pad : 0;
  const spotW = targetRect ? targetRect.width + pad * 2 : 0;
  const spotH = targetRect ? targetRect.height + pad * 2 : 0;

  // Tooltip positioning: below the spotlight if space, otherwise above
  const tooltipTop = targetRect
    ? targetRect.bottom + pad + 16 < window.innerHeight - 120
      ? targetRect.bottom + pad + 16
      : targetRect.top - pad - 180
    : window.innerHeight / 2;
  const tooltipLeft = targetRect
    ? Math.min(Math.max(targetRect.left, 16), window.innerWidth - 380)
    : 16;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay with cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={spotX}
                y={spotY}
                width={spotW}
                height={spotH}
                rx={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Click barrier (blocks clicks outside spotlight) */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute bg-card border-2 border-blue-500/30 rounded-xl shadow-2xl p-5 w-[360px]"
          style={{ top: tooltipTop, left: tooltipLeft, zIndex: 10000 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <button
              onClick={handleFinish}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h3 className="font-bold text-base mb-1">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentStep
                      ? "bg-blue-500"
                      : i < currentStep
                        ? "bg-blue-500/40"
                        : "bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button size="sm" variant="outline" onClick={handlePrev} className="h-8 gap-1">
                  <ChevronLeft className="w-3 h-3" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                className="h-8 gap-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {currentStep === STEPS.length - 1 ? "Get Started" : "Next"}
                {currentStep < STEPS.length - 1 && <ChevronRight className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Check if tour has been completed */
export function isTourComplete(): boolean {
  return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
}
