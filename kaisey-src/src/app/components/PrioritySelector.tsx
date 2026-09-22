import { useState } from "react";
import {
  GraduationCap,
  Briefcase,
  Users,
  Heart,
  Plus,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import {
  type EventCategory,
  type Priority,
  CATEGORY_META,
  EVENT_CATEGORIES,
  MAX_PRIORITIES,
  PRESET_PRIORITIES,
  PRIORITY_SUGGESTIONS,
  createCustomPriority,
} from "@/app/components/priority";

const ICON_MAP = {
  GraduationCap,
  Briefcase,
  Users,
  Heart,
} as const;

function CategoryIcon({
  category,
  className,
}: {
  category: EventCategory;
  className?: string;
}) {
  const Icon = ICON_MAP[CATEGORY_META[category].icon as keyof typeof ICON_MAP];
  return <Icon className={className} />;
}

const MAX_LABEL_LENGTH = 24;
const MAX_DESCRIPTION_LENGTH = 80;

interface PrioritySelectorProps {
  mode: "onboarding" | "inline";
  currentPriorities: Priority[];
  onSave: (priorities: Priority[]) => void;
}

/** The "add your own" form, shared by both modes. */
function CustomPriorityForm({
  onAdd,
  onCancel,
  compact = false,
}: {
  onAdd: (priority: Priority) => void;
  onCancel: () => void;
  compact?: boolean;
}) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>("academics");

  const submit = () => {
    if (!label.trim()) return;
    onAdd(createCustomPriority(label, category, description));
    setLabel("");
    setDescription("");
  };

  return (
    <div className="space-y-3 text-left">
      <div>
        <Input
          autoFocus
          value={label}
          maxLength={MAX_LABEL_LENGTH}
          placeholder="Name your priority — e.g. Thesis"
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onCancel();
          }}
        />
      </div>

      {!compact && (
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">
            Need an idea?
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRIORITY_SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  setLabel(s.label);
                  setCategory(s.category);
                  setDescription(s.description);
                }}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted/70 text-muted-foreground hover:bg-muted transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">
          What kind of thing is it?
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {EVENT_CATEGORIES.map((c) => {
            const meta = CATEGORY_META[c];
            const isActive = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border-2 transition-all ${
                  isActive
                    ? `${meta.bgColor} ${meta.textColor} ${meta.borderColor}`
                    : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                <CategoryIcon category={c} className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{meta.kindLabel}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          This tells Kaisey how to schedule it — you'll still see your own name
          for it.
        </p>
      </div>

      <Input
        value={description}
        maxLength={MAX_DESCRIPTION_LENGTH}
        placeholder="Why it matters (optional)"
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onCancel();
        }}
      />

      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={!label.trim()}>
          Add priority
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function PrioritySelector({
  mode,
  currentPriorities,
  onSave,
}: PrioritySelectorProps) {
  const [draft, setDraft] = useState<Priority[]>(currentPriorities);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  // Inline mode commits on every change; onboarding waits for Continue.
  const commit = (next: Priority[]) => {
    setDraft(next);
    if (mode === "inline") onSave(next);
  };

  const selected = mode === "inline" ? currentPriorities : draft;
  const isSelected = (id: string) => selected.some((p) => p.id === id);
  const atCap = selected.length >= MAX_PRIORITIES;

  const toggle = (priority: Priority) => {
    if (isSelected(priority.id)) {
      commit(selected.filter((p) => p.id !== priority.id));
    } else if (!atCap) {
      commit([...selected, priority]);
    }
  };

  const addCustom = (priority: Priority) => {
    commit([...selected, priority]);
    setIsAdding(false);
  };

  const startRename = (priority: Priority) => {
    setEditingId(priority.id);
    setEditingLabel(priority.label);
  };

  const saveRename = () => {
    if (!editingId) return;
    const label = editingLabel.trim();
    if (label) {
      commit(
        selected.map((p) => (p.id === editingId ? { ...p, label } : p))
      );
    }
    setEditingId(null);
  };

  // Presets the user hasn't picked, offered alongside what they have.
  const unselectedPresets = PRESET_PRIORITIES.filter((p) => !isSelected(p.id));

  // --- Inline mode: compact pill row ---
  if (mode === "inline") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {selected.map((p) => {
            const meta = CATEGORY_META[p.category];
            return (
              <button
                key={p.id}
                onClick={() => toggle(p)}
                title={`Remove ${p.label} from your priorities`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${meta.bgColor} ${meta.textColor} ${meta.borderColor} border-2 shadow-sm`}
              >
                <CategoryIcon category={p.category} className="w-3.5 h-3.5" />
                {p.label}
              </button>
            );
          })}

          {unselectedPresets.map((p) => (
            <button
              key={p.id}
              onClick={() => toggle(p)}
              disabled={atCap}
              title={
                atCap
                  ? `Remove one first — ${MAX_PRIORITIES} is the max`
                  : `Add ${p.label} to your priorities`
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all bg-muted/50 text-muted-foreground border-2 border-transparent hover:bg-muted disabled:opacity-40 disabled:hover:bg-muted/50"
            >
              <CategoryIcon category={p.category} className="w-3.5 h-3.5" />
              {p.label}
            </button>
          ))}

          {!atCap && !isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Your own
            </button>
          )}
        </div>

        {isAdding && (
          <Card className="p-3">
            <CustomPriorityForm
              onAdd={addCustom}
              onCancel={() => setIsAdding(false)}
            />
          </Card>
        )}
      </div>
    );
  }

  // --- Onboarding mode: full-screen overlay ---
  const cards = [...draft, ...unselectedPresets];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="w-full max-w-lg my-auto"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">
              What are you focusing on?
            </h2>
            <p className="text-muted-foreground">
              Pick up to {MAX_PRIORITIES}. Rename them or add your own — Kaisey
              protects time for whatever you choose. You can change this
              anytime.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {cards.map((p, i) => {
              const meta = CATEGORY_META[p.category];
              const active = isSelected(p.id);
              const isEditing = editingId === p.id;
              const disabled = !active && atCap;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.2 + i * 0.06, 0.5) }}
                >
                  <Card
                    onClick={() => {
                      if (isEditing || disabled) return;
                      toggle(p);
                    }}
                    className={`relative p-5 transition-all ${
                      disabled
                        ? "opacity-40 cursor-not-allowed border-2 border-transparent"
                        : "cursor-pointer hover:scale-[1.02]"
                    } ${
                      active
                        ? `${meta.borderColor} border-2 ${meta.bgColor} shadow-lg`
                        : "border-2 border-transparent hover:border-muted-foreground/20"
                    }`}
                  >
                    {active && (
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRename(p);
                          }}
                          title="Rename"
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <div
                          className={`w-4 h-4 rounded-full ${meta.dotColor} flex items-center justify-center`}
                        >
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                    )}

                    <div className="text-center">
                      <div
                        className={`w-11 h-11 rounded-xl ${meta.bgColor} flex items-center justify-center mx-auto mb-3`}
                      >
                        <CategoryIcon
                          category={p.category}
                          className={`w-5 h-5 ${meta.textColor}`}
                        />
                      </div>

                      {isEditing ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1"
                        >
                          <Input
                            autoFocus
                            value={editingLabel}
                            maxLength={MAX_LABEL_LENGTH}
                            className="h-7 text-xs text-center"
                            onChange={(e) => setEditingLabel(e.target.value)}
                            onBlur={saveRename}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRename();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                          />
                        </div>
                      ) : (
                        <h3 className="font-semibold text-sm break-words">
                          {p.label}
                        </h3>
                      )}

                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        {p.description ?? meta.blurb}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}

            {!atCap && !isAdding && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-full h-full min-h-[132px] rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-sm font-medium">Add your own</span>
                </button>
              </motion.div>
            )}
          </div>

          {isAdding && (
            <Card className="p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Add your own priority</h4>
                <button
                  onClick={() => setIsAdding(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <CustomPriorityForm
                onAdd={addCustom}
                onCancel={() => setIsAdding(false)}
              />
            </Card>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <p className="text-xs text-muted-foreground mb-3">
              {draft.length === 0
                ? "Pick at least one to continue"
                : `${draft.length} of ${MAX_PRIORITIES} selected`}
            </p>
            <Button
              size="lg"
              disabled={draft.length === 0}
              onClick={() => onSave(draft)}
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
