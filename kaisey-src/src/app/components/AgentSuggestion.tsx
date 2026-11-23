import { Clock, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { motion } from "motion/react";

interface AgentSuggestionProps {
  type: "conflict" | "optimization" | "alert" | "success";
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismiss?: () => void;
}

export function AgentSuggestion({ type, title, description, action, dismiss }: AgentSuggestionProps) {
  const icons = {
    conflict: AlertCircle,
    optimization: TrendingUp,
    alert: Clock,
    success: CheckCircle,
  };

  // Brand: white card; the type reads from a small marker and a mono kicker.
  const kinds = {
    conflict: { label: "Schedule · conflict", marker: "bg-red-500" },
    optimization: { label: "Kaisey recommends", marker: "bg-brand" },
    alert: { label: "Schedule · heads up", marker: "bg-muted-foreground" },
    success: { label: "Done", marker: "bg-green-500" },
  };

  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border bg-card p-4 mb-3 gap-0">
        <div className="flex gap-3">
          <div className="mt-0.5 text-muted-foreground">
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              <span className={`w-2 h-2 rounded-[2px] ${kinds[type].marker}`} />
              {kinds[type].label}
            </div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold mb-1 text-[15px]" style={{ letterSpacing: "-0.02em" }}>{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            {action && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={action.onClick}>
                  {action.label}
                </Button>
                {dismiss && (
                  <Button size="sm" variant="outline" onClick={dismiss}>
                    Dismiss
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}