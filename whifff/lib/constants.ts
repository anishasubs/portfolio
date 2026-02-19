import type { FamilyOption, PriceOptionItem, OccasionOption, StrengthOption, Occasion } from "./types";

export const FAMILIES: FamilyOption[] = [
  { id: "floral", label: "Floral", emoji: "\u{1F338}", desc: "Rose, jasmine, peony" },
  { id: "sweet", label: "Sweet & Gourmand", emoji: "\u{1F36F}", desc: "Vanilla, caramel, praline" },
  { id: "fresh", label: "Fresh & Clean", emoji: "\u{1F33F}", desc: "Citrus, green, aquatic" },
  { id: "warm", label: "Warm & Spicy", emoji: "\u{1F56F}\uFE0F", desc: "Amber, cinnamon, oud" },
  { id: "fruity", label: "Fruity", emoji: "\u{1F351}", desc: "Berry, lychee, tropical" },
  { id: "musky", label: "Musky & Woody", emoji: "\u{1FAB5}", desc: "Sandalwood, musk, cedar" },
];

export const PRICES: PriceOptionItem[] = [
  { id: "$", label: "Under $100", sub: "affordable favorites" },
  { id: "$$", label: "$100 \u2013 $200", sub: "the sweet spot" },
  { id: "$$$", label: "$200+", sub: "luxury & niche" },
  { id: "all", label: "Surprise me", sub: "price is no object" },
];

export const OCCASIONS: OccasionOption[] = [
  { id: "everyday", label: "Everyday", emoji: "\u2600\uFE0F" },
  { id: "datenight", label: "Date Night", emoji: "\u{1F319}" },
  { id: "work", label: "Office", emoji: "\u{1F4BC}" },
  { id: "special", label: "Going Out", emoji: "\u2728" },
];

export const STRENGTHS: StrengthOption[] = [
  { id: "soft", label: "Whisper", emoji: "\u{1F92B}", desc: "soft & close to the skin" },
  { id: "moderate", label: "Just Right", emoji: "\u{1F4AB}", desc: "noticeable but not overwhelming" },
  { id: "strong", label: "Announce Me", emoji: "\u{1F525}", desc: "i want people to smell me coming" },
];

export const OCC_MAP: Record<Occasion, string[]> = {
  everyday: ["fresh", "musky", "floral", "citrus", "clean"],
  datenight: ["warm spicy", "sweet", "vanilla", "gourmand", "amber"],
  work: ["fresh", "powdery", "musky", "clean", "floral"],
  special: ["warm spicy", "sweet", "amber", "floral"],
};

export const MSGS = [
  "first things first \u2014 do you have any scents you already love? search below or skip if you're starting fresh",
  "okay now tell me \u2014 what kind of scents make you feel something? pick as many as you want",
  "what are we working with budget-wise?",
  "and where are you wearing this?",
  "last one \u2014 how strong do you want it?",
  "give me a sec, putting something together for you...",
];

export const TOTAL_STEPS = 6;
