import type { FamilyOption, OccasionOption, StrengthOption, Occasion, VibeOption, Vibe } from "./types";

export const FAMILIES: FamilyOption[] = [
  { id: "floral", label: "Floral", emoji: "\u{1F338}", desc: "Rose, jasmine, peony" },
  { id: "sweet", label: "Sweet & Gourmand", emoji: "\u{1F36F}", desc: "Vanilla, caramel, praline" },
  { id: "fresh", label: "Fresh & Clean", emoji: "\u{1F33F}", desc: "Citrus, green, aquatic" },
  { id: "warm", label: "Warm & Spicy", emoji: "\u{1F56F}\uFE0F", desc: "Amber, cinnamon, oud" },
  { id: "fruity", label: "Fruity", emoji: "\u{1F351}", desc: "Berry, lychee, tropical" },
  { id: "musky", label: "Musky & Woody", emoji: "\u{1FAB5}", desc: "Sandalwood, musk, cedar" },
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

export const VIBES: VibeOption[] = [
  {
    id: "sensorial",
    label: "Unforgettable",
    emoji: "\u{1F525}",
    desc: "the person no one stops thinking about",
    territory: "Sensorial Stimulation",
    profileName: "The Main Character",
    profileDesc: "You leave an impression that lingers. People remember you — not just what you said, but how you made them feel.",
  },
  {
    id: "assertion",
    label: "Effortlessly cool",
    emoji: "\u{1F48E}",
    desc: "refined, authentic, one of a kind",
    territory: "Personal Assertion",
    profileName: "The Signature",
    profileDesc: "You don't follow trends — you set the tone. Your energy walks into the room before you do, and people remember it.",
  },
  {
    id: "social",
    label: "Magnetic",
    emoji: "\u{1F451}",
    desc: "confident, commanding, impossible to ignore",
    territory: "Social Impact",
    profileName: "The It Girl",
    profileDesc: "You light up every room you enter. Confident, captivating, and impossible to ignore — people gravitate toward your energy.",
  },
  {
    id: "wellness",
    label: "Warm & approachable",
    emoji: "\u2728",
    desc: "calm, grounded, someone people feel safe around",
    territory: "Mindful Wellness",
    profileName: "The Soft Life",
    profileDesc: "You radiate warmth. People feel at ease around you — you're the person everyone wants to sit next to.",
  },
];

export const VIBE_MAP: Record<Vibe, string[]> = {
  sensorial: ["warm spicy", "sweet", "vanilla", "gourmand", "amber", "oud"],
  assertion: ["musky", "woody", "leather", "smoky", "aromatic", "powdery"],
  social: ["floral", "sweet", "fruity", "fresh", "citrus"],
  wellness: ["fresh", "clean", "citrus", "green", "aquatic", "powdery"],
};

export const OCC_MAP: Record<Occasion, string[]> = {
  everyday: ["fresh", "musky", "floral", "citrus", "clean"],
  datenight: ["warm spicy", "sweet", "vanilla", "gourmand", "amber"],
  work: ["fresh", "powdery", "musky", "clean", "floral"],
  special: ["warm spicy", "sweet", "amber", "floral"],
};

export const MSGS = [
  "first things first \u2014 pick up to 2 scents you already love so i can learn your vibe, or skip if you're starting fresh",
  "okay now tell me \u2014 what kind of scents make you feel something? pick as many as you want",
  "how do you want to be perceived?",
  "and where are you wearing this?",
  "last one \u2014 how strong do you want it?",
  "give me a sec, putting something together for you...",
];

export const TOTAL_STEPS = 6;
