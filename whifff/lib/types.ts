export type ScentFamily = "floral" | "sweet" | "fresh" | "warm" | "fruity" | "musky";
export type PriceOption = "$" | "$$" | "$$$" | "all";
export type Occasion = "everyday" | "datenight" | "work" | "special";
export type Strength = "soft" | "moderate" | "strong";
export type Vibe = "sensorial" | "assertion" | "social" | "wellness";

export interface Perfume {
  id: string;
  name: string;
  brand: string;
  price: number;
  pr: PriceOption;
  notes: string[];
  accords: string[];
  rating: number;
  img: string;
  sillage: Strength;
}

export interface ScoredPerfume extends Perfume {
  score: number;
  reasons: string[];
}

export interface QuizAnswers {
  past: Perfume[];
  scents: ScentFamily[];
  vibe: Vibe | null;
  occasion: Occasion | null;
  strength: Strength | null;
}

export interface VibeOption {
  id: Vibe;
  label: string;
  emoji: string;
  desc: string;
  territory: string;
  profileName: string;
  profileDesc: string;
}

export interface FamilyOption {
  id: ScentFamily;
  label: string;
  emoji: string;
  desc: string;
}

export interface PriceOptionItem {
  id: PriceOption;
  label: string;
  sub: string;
}

export interface OccasionOption {
  id: Occasion;
  label: string;
  emoji: string;
}

export interface StrengthOption {
  id: Strength;
  label: string;
  emoji: string;
  desc: string;
}
