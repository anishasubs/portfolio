export type PriorityMode = "Academics" | "Recruiting" | "Social" | "Wellness";

export type EventCategory = "academics" | "recruiting" | "social" | "wellness";

export const PRIORITY_STORAGE_KEY = "kaisey-priority";

export interface PriorityConfig {
  label: string;
  icon: string; // lucide icon name
  bgColor: string;
  textColor: string;
  borderColor: string;
  ringColor: string;
  eventTypes: EventCategory[];
  promptHint: string;
}

export const PRIORITY_CONFIG: Record<PriorityMode, PriorityConfig> = {
  Academics: {
    label: "Academics",
    icon: "GraduationCap",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600",
    borderColor: "border-blue-500",
    ringColor: "ring-blue-500",
    eventTypes: ["academics"],
    promptHint:
      "The user's top priority is ACADEMICS. Bias task priorities toward class prep, studying, assignments, and exam review. Schedule study blocks during peak focus hours and protect them from interruptions.",
  },
  Recruiting: {
    label: "Recruiting",
    icon: "Briefcase",
    bgColor: "bg-red-500/10",
    textColor: "text-red-600",
    borderColor: "border-red-500",
    ringColor: "ring-red-500",
    eventTypes: ["recruiting"],
    promptHint:
      "The user's top priority is RECRUITING. Bias task priorities toward interview prep, networking coffee chats, info sessions, and career development. Give recruiting-related tasks the best time slots.",
  },
  Social: {
    label: "Social",
    icon: "Users",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-600",
    borderColor: "border-orange-500",
    ringColor: "ring-orange-500",
    eventTypes: ["social"],
    promptHint:
      "The user's top priority is SOCIAL. Bias task priorities toward networking events, group meetings, coffee chats, and social gatherings. Ensure enough free time for spontaneous social opportunities.",
  },
  Wellness: {
    label: "Wellness",
    icon: "Heart",
    bgColor: "bg-green-500/10",
    textColor: "text-green-600",
    borderColor: "border-green-500",
    ringColor: "ring-green-500",
    eventTypes: ["wellness"],
    promptHint:
      "The user's top priority is WELLNESS. Bias task priorities toward workouts, meditation, rest, and recovery. Schedule breaks between intense blocks and avoid overloading the day.",
  },
};

export const PRIORITY_MODES: PriorityMode[] = [
  "Academics",
  "Recruiting",
  "Social",
  "Wellness",
];

// Map event types to their primary priority category
export const EVENT_TYPE_TO_PRIORITY: Record<EventCategory, PriorityMode> = {
  academics: "Academics",
  recruiting: "Recruiting",
  social: "Social",
  wellness: "Wellness",
};

interface CalendarEventLike {
  type: string;
  duration: number;
  date: string;
}

/** Compute hours spent per priority category for a given week's events */
export function computeWeeklyBalance(
  events: CalendarEventLike[]
): Record<PriorityMode, number> {
  const balance: Record<PriorityMode, number> = {
    Academics: 0,
    Recruiting: 0,
    Social: 0,
    Wellness: 0,
  };

  for (const event of events) {
    const category = EVENT_TYPE_TO_PRIORITY[event.type];
    if (category) {
      balance[category] += event.duration / 60; // convert minutes to hours
    }
  }

  return balance;
}

/** Generate human-readable callouts about schedule imbalances */
export function computeImbalanceCallouts(
  balance: Record<PriorityMode, number>,
  priority: PriorityMode
): string[] {
  const callouts: string[] = [];
  const totalHours = Object.values(balance).reduce((a, b) => a + b, 0);

  if (totalHours === 0) return [];

  const priorityHours = balance[priority];
  const priorityPct = (priorityHours / totalHours) * 100;

  // Check if priority category is underrepresented
  if (priorityHours === 0) {
    callouts.push(`No ${priority.toLowerCase()} events this week — consider adding some.`);
  } else if (priorityPct < 15) {
    callouts.push(
      `Only ${priorityHours.toFixed(1)}h of ${priority.toLowerCase()} this week (${Math.round(priorityPct)}% of your time).`
    );
  }

  // Check for overloaded categories
  for (const mode of PRIORITY_MODES) {
    if (mode === priority) continue;
    const modeHours = balance[mode];
    const modePct = (modeHours / totalHours) * 100;
    if (modePct > 50 && modeHours > priorityHours * 2) {
      callouts.push(
        `${mode} is taking ${modeHours.toFixed(1)}h (${Math.round(modePct)}%) — more than your ${priority.toLowerCase()} priority.`
      );
    }
  }

  // Wellness check
  if (priority !== "Wellness" && balance.Wellness === 0) {
    callouts.push("No wellness time scheduled this week.");
  }

  return callouts;
}
