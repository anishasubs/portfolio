import { useState } from "react";
import { GraduationCap, Briefcase, Users, Heart } from "lucide-react";

// Brand category blocks for the focus picker.
const CATEGORY_BLOCK: Record<string, string> = {
  Academics: "bg-blue-500",
  Recruiting: "bg-red-500",
  Social: "bg-orange-500",
  Wellness: "bg-green-500",
};
const CATEGORY_TIME: Record<string, string> = {
  Academics: "09:00",
  Recruiting: "14:00",
  Social: "12:00",
  Wellness: "17:00",
};
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { motion, AnimatePresence } from "motion/react";
import {
  type PriorityMode,
  PRIORITY_CONFIG,
  PRIORITY_MODES,
} from "@/app/components/priority";

const ICON_MAP = {
  GraduationCap,
  Briefcase,
  Users,
  Heart,
} as const;

interface PrioritySelectorProps {
  mode: "onboarding" | "inline";
  currentPriority: PriorityMode | null;
  onSelect: (priority: PriorityMode) => void;
}

export function PrioritySelector({
  mode,
  currentPriority,
  onSelect,
}: PrioritySelectorProps) {
  const [selected, setSelected] = useState<PriorityMode | null>(
    currentPriority
  );

  // --- Inline mode: compact pill row ---
  if (mode === "inline") {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {PRIORITY_MODES.map((p) => {
          const config = PRIORITY_CONFIG[p];
          const Icon = ICON_MAP[config.icon as keyof typeof ICON_MAP];
          const isActive = currentPriority === p;

          return (
            <button
              key={p}
              onClick={() => onSelect(p)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? `${config.bgColor} ${config.textColor} ${config.borderColor} border-2 shadow-sm`
                  : "bg-muted/50 text-muted-foreground border-2 border-transparent hover:bg-muted"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {config.label}
            </button>
          );
        })}
      </div>
    );
  }

  // --- Onboarding mode: full-screen overlay ---
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold mb-2" style={{ letterSpacing: "-0.04em" }}>
              What's your focus today?
            </h2>
            <p className="text-muted-foreground">
              This helps Kaisey prioritize your schedule and recommendations.
              You can change it anytime.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {PRIORITY_MODES.map((p, i) => {
              const config = PRIORITY_CONFIG[p];
              const Icon = ICON_MAP[config.icon as keyof typeof ICON_MAP];
              const isSelected = selected === p;

              return (
                <motion.div
                  key={p}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                >
                  <Card
                    onClick={() => setSelected(p)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(p); } }}
                    className={`p-5 gap-0 cursor-pointer transition-all bg-card ${
                      isSelected
                        ? "border-2 border-primary shadow-lg"
                        : "border-2 border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="text-left">
                      {/* A calendar block in the category colour, the brand pattern */}
                      <div className={`w-20 h-12 rounded-lg ${CATEGORY_BLOCK[p]} p-2 mb-4 flex flex-col justify-between`} aria-hidden="true">
                        <span className="block w-3/5 h-1.5 rounded-full bg-white/75" />
                        <span className="font-mono text-[9px] text-white/90">{CATEGORY_TIME[p]}</span>
                      </div>
                      <h3 className="font-semibold text-base" style={{ letterSpacing: "-0.02em" }}>{config.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {p === "Academics" && "Classes, studying & exams"}
                        {p === "Recruiting" && "Interviews & career prep"}
                        {p === "Social" && "Networking & connections"}
                        {p === "Wellness" && "Fitness, rest & recovery"}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <Button
              size="lg"
              disabled={!selected}
              onClick={() => selected && onSelect(selected)}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-8"
            >
              Continue
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
