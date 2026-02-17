export type PriorityMode = "Academics" | "Recruiting" | "Social" | "Wellness";

export const PRIORITY_STORAGE_KEY = "kaisey-priority";

export interface PriorityConfig {
  label: string;
  icon: string; // lucide icon name
  bgColor: string;
  textColor: string;
  borderColor: string;
  ringColor: string;
  eventTypes: Array<"class" | "meeting" | "study" | "workout" | "networking" | "recruiting">;
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
    eventTypes: ["class", "study"],
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
    eventTypes: ["recruiting", "networking"],
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
    eventTypes: ["networking", "meeting"],
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
    eventTypes: ["workout"],
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
