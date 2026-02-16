import type { Perfume, ScoredPerfume, ScentFamily, PriceOption, Occasion, Strength } from "./types";
import { FAMILIES, OCC_MAP } from "./constants";

interface RecommendInput {
  db: Perfume[];
  past: Perfume[];
  scents: ScentFamily[];
  price: PriceOption | null;
  occasion: Occasion | null;
  strength: Strength | null;
}

export function scoreAndRank({ db, past, scents, price, occasion, strength }: RecommendInput): ScoredPerfume[] {
  let scored = db
    .filter((p) => !past.some((pp) => pp.id === p.id))
    .map((p) => {
      let s = 0;

      // Match against past perfume notes/accords
      if (past.length > 0) {
        const userNotes = past.flatMap((pp) => pp.notes);
        const userAccords = past.flatMap((pp) => pp.accords);
        p.notes.forEach((n) => {
          if (userNotes.some((x) => x.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(x.toLowerCase()))) s += 3;
        });
        p.accords.forEach((a) => {
          if (userAccords.some((x) => x.toLowerCase().includes(a.toLowerCase()))) s += 4;
        });
      }

      // Match against selected scent families
      scents.forEach((sc) => {
        if (p.accords.some((a) => a.toLowerCase().includes(sc))) s += 3;
        const f = FAMILIES.find((x) => x.id === sc);
        if (f) {
          f.desc.split(", ").forEach((n) => {
            if (p.notes.some((pn) => pn.toLowerCase().includes(n.toLowerCase()))) s += 2;
          });
        }
      });

      // Occasion accord match
      if (occasion && OCC_MAP[occasion]) {
        OCC_MAP[occasion].forEach((a) => {
          if (p.accords.some((pa) => pa.toLowerCase().includes(a))) s += 1;
        });
      }

      // Price range match
      if (price && price !== "all" && p.pr === price) s += 2;

      // Sillage match
      if (strength && p.sillage === strength) s += 3;
      else if (strength && (strength === "moderate" || p.sillage === "moderate")) s += 1;

      // Rating boost
      s += p.rating * 0.5;

      return { ...p, score: s } as ScoredPerfume;
    });

  scored.sort((a, b) => b.score - a.score);

  // If price filter set and enough matches, filter to that range
  if (price && price !== "all") {
    const filtered = scored.filter((p) => p.pr === price);
    if (filtered.length >= 3) scored = filtered;
  }

  return scored.slice(0, 3);
}
