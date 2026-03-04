import type { Perfume, ScoredPerfume, ScentFamily, Occasion, Strength, Vibe } from "./types";
import { FAMILIES, OCC_MAP, VIBE_MAP } from "./constants";

// L'Oréal Luxe portfolio — only recommend fragrances from these brands
const LOREAL_BRANDS = new Set([
  "yves saint laurent",
  "lancôme",
  "lancome",
  "giorgio armani",
  "valentino",
  "prada",
  "mugler",
  "thierry mugler",
  "ralph lauren",
  "viktor & rolf",
  "viktor&rolf",
  "cacharel",
  "diesel",
  "maison margiela",
  "maison martin margiela",
  "atelier cologne",
  "azzaro",
]);

interface RecommendInput {
  db: Perfume[];
  past: Perfume[];
  scents: ScentFamily[];
  vibe: Vibe | null;
  occasion: Occasion | null;
  strength: Strength | null;
}

export function scoreAndRank({ db, past, scents, vibe, occasion, strength }: RecommendInput): ScoredPerfume[] {
  let scored = db
    .filter((p) => !past.some((pp) => pp.id === p.id))
    .filter((p) => LOREAL_BRANDS.has(p.brand.toLowerCase()))
    .map((p) => {
      let s = 0;
      let pastReason = "";
      let familyReason = "";

      // Match against past perfume notes/accords
      if (past.length > 0) {
        const userNotes = past.flatMap((pp) => pp.notes);
        const userAccords = past.flatMap((pp) => pp.accords);
        const matchedNotes: string[] = [];
        const matchedAccords: string[] = [];
        p.notes.forEach((n) => {
          if (userNotes.some((x) => x.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(x.toLowerCase()))) {
            s += 3;
            matchedNotes.push(n.toLowerCase());
          }
        });
        p.accords.forEach((a) => {
          if (userAccords.some((x) => x.toLowerCase().includes(a.toLowerCase()))) {
            s += 4;
            matchedAccords.push(a.toLowerCase());
          }
        });
        const sharedTerms = [...matchedNotes, ...matchedAccords].slice(0, 3);
        if (sharedTerms.length > 0) {
          const source = past.length === 1 ? past[0].name : "your favorites";
          pastReason = `shares ${sharedTerms.join(", ")} with ${source}`;
        }
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
      if (scents.length > 0) {
        const matchedFamilies = scents.filter((sc) =>
          p.accords.some((a) => a.toLowerCase().includes(sc))
        );
        if (matchedFamilies.length > 0) {
          const label = FAMILIES.find((f) => f.id === matchedFamilies[0])?.label ?? matchedFamilies[0];
          familyReason = `matches your ${label.toLowerCase()} vibe`;
        }
      }

      // Combine past perfume + family reasons into one cohesive sentence
      const reasons: string[] = [];
      if (pastReason && familyReason) {
        reasons.push(`${pastReason} and ${familyReason}`);
      } else if (pastReason) {
        reasons.push(pastReason);
      } else if (familyReason) {
        reasons.push(familyReason);
      }

      // Vibe/territory accord match
      if (vibe && VIBE_MAP[vibe]) {
        VIBE_MAP[vibe].forEach((a) => {
          if (p.accords.some((pa) => pa.toLowerCase().includes(a))) s += 2;
        });
      }

      // Occasion accord match
      if (occasion && OCC_MAP[occasion]) {
        OCC_MAP[occasion].forEach((a) => {
          if (p.accords.some((pa) => pa.toLowerCase().includes(a))) s += 1;
        });
      }

      // Sillage match
      if (strength && p.sillage === strength) {
        s += 3;
        const labels: Record<string, string> = { soft: "soft", moderate: "balanced", strong: "bold" };
        reasons.push(`has the ${labels[strength]} projection you wanted`);
      } else if (strength && (strength === "moderate" || p.sillage === "moderate")) {
        s += 1;
      }

      // Rating boost
      s += p.rating * 0.5;
      if (p.rating >= 4.3 && reasons.length < 2) {
        reasons.push(`highly rated at ${p.rating}`);
      }

      // Cap at 3 reasons, prioritizing order (past perfume > family > sillage/price > rating)
      return { ...p, score: s, reasons: reasons.slice(0, 3) } as ScoredPerfume;
    });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 3);
}
