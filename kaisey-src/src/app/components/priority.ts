/**
 * Priorities are the handful of things a user is choosing to protect time for.
 *
 * They sit on top of a fixed event taxonomy (`EventCategory`) rather than
 * replacing it: the calendar, the colour palette and the AI classification
 * schema all keep reasoning in the same four buckets, while the user supplies
 * their own labels for the buckets they care about. A priority is therefore a
 * *named lens* on a category — "Thesis" is academics, "Marathon training" is
 * wellness — which keeps custom labels free-form without the scheduler having
 * to learn a new taxonomy on the fly.
 *
 * Priorities are flat: there is no ranking. Everything the user picks is
 * protected equally, and everything they leave out is schedulable around it.
 */

export type EventCategory = "academics" | "recruiting" | "social" | "wellness";

/** v2 storage: the full priority list. */
export const PRIORITIES_STORAGE_KEY = "kaisey-priorities";
/** v1 storage: a single mode string, e.g. "Academics". Read once, to migrate. */
export const PRIORITY_STORAGE_KEY = "kaisey-priority";

export const MAX_PRIORITIES = 4;

export interface CategoryMeta {
  /** Name used when the user hasn't given this category a priority of their own. */
  defaultLabel: string;
  /** Plain-language name for the "what kind of thing is this?" picker. */
  kindLabel: string;
  /** One-line description shown under a preset card. */
  blurb: string;
  icon: string; // lucide icon name
  bgColor: string;
  textColor: string;
  borderColor: string;
  ringColor: string;
  dotColor: string;
  /** Scheduling guidance handed to the model when this category is a priority. */
  promptHint: string;
}

export const CATEGORY_META: Record<EventCategory, CategoryMeta> = {
  academics: {
    defaultLabel: "Academics",
    kindLabel: "Classes & studying",
    blurb: "Classes, studying & exams",
    icon: "GraduationCap",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600",
    borderColor: "border-blue-500",
    ringColor: "ring-blue-500",
    dotColor: "bg-blue-500",
    promptHint:
      "Bias task priorities toward class prep, studying, assignments, and exam review. Schedule study blocks during peak focus hours and protect them from interruptions.",
  },
  recruiting: {
    defaultLabel: "Recruiting",
    kindLabel: "Career & interviews",
    blurb: "Interviews & career prep",
    icon: "Briefcase",
    bgColor: "bg-red-500/10",
    textColor: "text-red-600",
    borderColor: "border-red-500",
    ringColor: "ring-red-500",
    dotColor: "bg-red-500",
    promptHint:
      "Bias task priorities toward interview prep, networking coffee chats, info sessions, and career development. Give these tasks the best time slots.",
  },
  social: {
    defaultLabel: "Social",
    kindLabel: "People & events",
    blurb: "Networking & connections",
    icon: "Users",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-600",
    borderColor: "border-orange-500",
    ringColor: "ring-orange-500",
    dotColor: "bg-orange-500",
    promptHint:
      "Bias task priorities toward events, group meetings, coffee chats, and time with people. Leave enough free time for spontaneous plans.",
  },
  wellness: {
    defaultLabel: "Wellness",
    kindLabel: "Health & rest",
    blurb: "Fitness, rest & recovery",
    icon: "Heart",
    bgColor: "bg-green-500/10",
    textColor: "text-green-600",
    borderColor: "border-green-500",
    ringColor: "ring-green-500",
    dotColor: "bg-green-500",
    promptHint:
      "Bias task priorities toward workouts, meditation, rest, and recovery. Schedule breaks between intense blocks and avoid overloading the day.",
  },
};

export const EVENT_CATEGORIES: EventCategory[] = [
  "academics",
  "recruiting",
  "social",
  "wellness",
];

export interface Priority {
  /** Stable key. Presets use their category name so they survive a relabel. */
  id: string;
  /** What the user calls it. Defaults to the category's own name. */
  label: string;
  /** The event bucket this priority draws its time from. */
  category: EventCategory;
  /** Optional user-written context, handed to the model verbatim. */
  description?: string;
  isCustom: boolean;
}

/** The four starting points, offered as cards during onboarding. */
export const PRESET_PRIORITIES: Priority[] = EVENT_CATEGORIES.map((category) => ({
  id: category,
  label: CATEGORY_META[category].defaultLabel,
  category,
  isCustom: false,
}));

export interface PrioritySuggestion {
  label: string;
  category: EventCategory;
  description: string;
}

/** Ideas offered when someone adds their own, so the blank field isn't cold. */
export const PRIORITY_SUGGESTIONS: PrioritySuggestion[] = [
  { label: "Thesis", category: "academics", description: "Research, writing, and advisor check-ins" },
  { label: "Grad school apps", category: "academics", description: "Essays, test prep, and deadlines" },
  { label: "Internship search", category: "recruiting", description: "Applications, referrals, and interview prep" },
  { label: "Startup", category: "recruiting", description: "Building, customer calls, and investor prep" },
  { label: "Club leadership", category: "social", description: "Running meetings and organizing events" },
  { label: "Family", category: "social", description: "Calls, visits, and protected family time" },
  { label: "Marathon training", category: "wellness", description: "Runs, cross-training, and recovery days" },
  { label: "Sleep", category: "wellness", description: "A consistent wind-down and a real bedtime" },
];

let customIdCounter = 0;

export function createCustomPriority(
  label: string,
  category: EventCategory,
  description?: string
): Priority {
  customIdCounter += 1;
  return {
    id: `custom-${Date.now()}-${customIdCounter}`,
    label: label.trim(),
    category,
    description: description?.trim() || undefined,
    isCustom: true,
  };
}

// --- Classification --------------------------------------------------------

/**
 * Keywords per category, checked in the order of EVENT_CATEGORY_PRECEDENCE so a
 * title matching two categories resolves the same way it always has.
 */
const CATEGORY_KEYWORDS: Record<EventCategory, string[]> = {
  wellness: [
    "gym", "yoga", "meditation", "workout", "wellness", "fitness", "exercise",
    "run", "running", "marathon", "training", "sleep", "rest", "recovery",
    "health", "therapy", "nap", "walk", "swim", "lift", "hike", "pilates",
  ],
  social: [
    "coffee", "lunch", "dinner", "brunch", "follow-up", "networking",
    "happy hour", "party", "friend", "family", "social", "club", "community",
    "hangout", "roommate", "birthday", "reunion",
  ],
  recruiting: [
    "goldman", "mckinsey", "info session", "recruiting", "recruit", "interview",
    "career", "job", "internship", "intern", "resume", "cover letter", "offer",
    "startup", "founder", "consulting", "banking", "referral", "networking event",
  ],
  academics: [
    "thesis", "class", "study", "studying", "exam", "homework", "assignment",
    "research", "paper", "essay", "course", "lecture", "lab", "quiz", "midterm",
    "final", "grad school", "reading", "problem set", "dissertation", "language",
  ],
};

/** Ties resolve toward the first match in this order. */
const EVENT_CATEGORY_PRECEDENCE: EventCategory[] = [
  "wellness",
  "social",
  "recruiting",
  "academics",
];

/**
 * Best-guess category for a piece of free text — an event title, or the name
 * someone gave their own priority. Falls back to academics, which is both the
 * most common case for students and the app's long-standing default.
 */
export function inferCategory(text: string): EventCategory {
  const lower = text.toLowerCase();

  let best: EventCategory = "academics";
  let bestScore = 0;

  for (const category of EVENT_CATEGORY_PRECEDENCE) {
    const score = CATEGORY_KEYWORDS[category].filter((kw) =>
      lower.includes(kw)
    ).length;
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }

  return best;
}

// --- Persistence -----------------------------------------------------------

function isEventCategory(value: unknown): value is EventCategory {
  return typeof value === "string" && (EVENT_CATEGORIES as string[]).includes(value);
}

function sanitizePriority(raw: unknown): Priority | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<Priority>;
  if (!isEventCategory(candidate.category)) return null;
  const label =
    typeof candidate.label === "string" && candidate.label.trim()
      ? candidate.label.trim()
      : CATEGORY_META[candidate.category].defaultLabel;
  return {
    id: typeof candidate.id === "string" && candidate.id ? candidate.id : candidate.category,
    label,
    category: candidate.category,
    description:
      typeof candidate.description === "string" && candidate.description.trim()
        ? candidate.description.trim()
        : undefined,
    isCustom: Boolean(candidate.isCustom),
  };
}

/**
 * Reads the stored priorities, migrating a v1 single-mode value if that's all
 * we find. Returns null when the user has never chosen — the caller uses that
 * to decide whether onboarding is owed.
 */
export function loadPriorities(): Priority[] | null {
  try {
    const stored = localStorage.getItem(PRIORITIES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const priorities = parsed
          .map(sanitizePriority)
          .filter((p): p is Priority => p !== null)
          .slice(0, MAX_PRIORITIES);
        return priorities.length > 0 ? priorities : null;
      }
    }

    // v1 → v2: a single "Academics"-style string becomes a one-item list.
    const legacy = localStorage.getItem(PRIORITY_STORAGE_KEY);
    if (legacy) {
      const category = EVENT_CATEGORIES.find(
        (c) => CATEGORY_META[c].defaultLabel.toLowerCase() === legacy.toLowerCase()
      );
      if (category) {
        const migrated = [PRESET_PRIORITIES.find((p) => p.category === category)!];
        savePriorities(migrated);
        return migrated;
      }
    }
  } catch (error) {
    console.error("Failed to load priorities:", error);
  }
  return null;
}

export function savePriorities(priorities: Priority[]): void {
  try {
    localStorage.setItem(PRIORITIES_STORAGE_KEY, JSON.stringify(priorities));
    localStorage.removeItem(PRIORITY_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to save priorities:", error);
  }
}

export function clearPriorities(): void {
  try {
    localStorage.removeItem(PRIORITIES_STORAGE_KEY);
    localStorage.removeItem(PRIORITY_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear priorities:", error);
  }
}

// --- Derived helpers -------------------------------------------------------

export function priorityCategories(priorities: Priority[]): Set<EventCategory> {
  return new Set(priorities.map((p) => p.category));
}

/**
 * What to call a category in the UI. A category the user has named exactly
 * once takes that name; anything else falls back to the built-in label so two
 * priorities sharing a bucket can't produce a confusing mash-up.
 */
export function categoryDisplayLabel(
  category: EventCategory,
  priorities: Priority[]
): string {
  const matching = priorities.filter((p) => p.category === category);
  return matching.length === 1 ? matching[0].label : CATEGORY_META[category].defaultLabel;
}

export function isPriorityCategory(
  category: EventCategory,
  priorities: Priority[]
): boolean {
  return priorities.some((p) => p.category === category);
}

/** The priority a given event belongs to, if any. */
export function priorityForCategory(
  category: EventCategory,
  priorities: Priority[]
): Priority | null {
  return priorities.find((p) => p.category === category) ?? null;
}

/** Assembles the scheduling guidance handed to the model. */
export function buildPriorityPromptHint(priorities: Priority[]): string {
  if (priorities.length === 0) return "";

  const covered = priorityCategories(priorities);
  const uncovered = EVENT_CATEGORIES.filter((c) => !covered.has(c));

  const lines = priorities.map((p) => {
    const meta = CATEGORY_META[p.category];
    const naming = p.isCustom ? ` (they track this as ${p.category} time)` : "";
    const context = p.description ? ` The user describes it as: "${p.description}".` : "";
    return `- "${p.label}"${naming}: ${meta.promptHint}${context}`;
  });

  const trailing =
    uncovered.length > 0
      ? `\nThe user did NOT pick ${uncovered
          .map((c) => CATEGORY_META[c].defaultLabel.toLowerCase())
          .join(", ")} as a priority — schedule those around the priorities above, and give up their slots first when something has to move.`
      : "\nThe user picked every category as a priority, so protect all of them and lean on unscheduled time when something has to move.";

  return `The user's priorities this term (${priorities.length} of ${MAX_PRIORITIES}, all weighted equally — there is no ranking between them):
${lines.join("\n")}
Refer to these by the user's own names.${trailing}`;
}

interface CalendarEventLike {
  type: string;
  duration: number;
  date: string;
}

/** Hours spent per event category for a given week's events. */
export function computeWeeklyBalance(
  events: CalendarEventLike[]
): Record<EventCategory, number> {
  const balance: Record<EventCategory, number> = {
    academics: 0,
    recruiting: 0,
    social: 0,
    wellness: 0,
  };

  for (const event of events) {
    if (isEventCategory(event.type)) {
      balance[event.type] += event.duration / 60; // minutes to hours
    }
  }

  return balance;
}

const MAX_CALLOUTS = 3;

/** Human-readable callouts about where the week drifts from the priorities. */
export function computeImbalanceCallouts(
  balance: Record<EventCategory, number>,
  priorities: Priority[]
): string[] {
  if (priorities.length === 0) return [];

  const callouts: string[] = [];
  const totalHours = EVENT_CATEGORIES.reduce((sum, c) => sum + balance[c], 0);
  if (totalHours === 0) return [];

  const covered = priorityCategories(priorities);
  const priorityHours = (p: Priority) => balance[p.category];
  const topPriorityHours = Math.max(...priorities.map(priorityHours));

  // Priorities with no time at all, then priorities that are only getting scraps.
  for (const p of priorities) {
    if (priorityHours(p) === 0) {
      callouts.push(`No ${p.label} time this week — consider adding some.`);
    }
  }
  for (const p of priorities) {
    const hours = priorityHours(p);
    const pct = (hours / totalHours) * 100;
    if (hours > 0 && pct < 15) {
      callouts.push(
        `Only ${hours.toFixed(1)}h of ${p.label} this week (${Math.round(pct)}% of your time).`
      );
    }
  }

  // Anything the user didn't pick that's crowding out everything they did.
  for (const category of EVENT_CATEGORIES) {
    if (covered.has(category)) continue;
    const hours = balance[category];
    const pct = (hours / totalHours) * 100;
    if (pct > 50 && hours > topPriorityHours * 2) {
      callouts.push(
        `${CATEGORY_META[category].defaultLabel} is taking ${hours.toFixed(1)}h (${Math.round(pct)}%) — more than any of your priorities.`
      );
    }
  }

  if (!covered.has("wellness") && balance.wellness === 0) {
    callouts.push("No wellness time scheduled this week.");
  }

  return callouts.slice(0, MAX_CALLOUTS);
}
