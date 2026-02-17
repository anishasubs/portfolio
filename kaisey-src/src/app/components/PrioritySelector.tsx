import { useState } from "react";
import { GraduationCap, Briefcase, Users, Heart } from "lucide-react";
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
            <h2 className="text-2xl font-bold mb-2">
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
                    className={`p-6 cursor-pointer transition-all hover:scale-[1.02] ${
                      isSelected
                        ? `${config.borderColor} border-2 ${config.bgColor} shadow-lg`
                        : "border-2 border-transparent hover:border-muted-foreground/20"
                    }`}
                  >
                    <div className="text-center">
                      <div
                        className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center mx-auto mb-3`}
                      >
                        <Icon className={`w-6 h-6 ${config.textColor}`} />
                      </div>
                      <h3 className="font-semibold text-sm">{config.label}</h3>
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
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8"
            >
              Continue
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
