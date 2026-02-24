"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Perfume, ScoredPerfume, ScentFamily, PriceOption, Occasion, Strength } from "@/lib/types";
import { FAMILIES } from "@/lib/constants";

function patchSession(sessionId: string, data: Record<string, unknown>) {
  fetch(`/api/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch(() => {});
}

export function useQuizState() {
  const [step, setStep] = useState(0);
  const [past, setPast] = useState<Perfume[]>([]);
  const [scents, setScents] = useState<ScentFamily[]>([]);
  const [price, setPrice] = useState<PriceOption | null>(null);
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [strength, setStrength] = useState<Strength | null>(null);
  const [results, setResults] = useState(false);
  const [recs, setRecs] = useState<ScoredPerfume[]>([]);
  const [cards, setCards] = useState(0);
  const [mix, setMix] = useState(0);
  const sessionIdRef = useRef<string | null>(null);
  const stepTimestampsRef = useRef<Record<string, string>>({});

  // Create session on mount
  useEffect(() => {
    const deviceType = window.innerWidth < 768 ? "mobile" : "desktop";
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_type: deviceType }),
    })
      .then((res) => res.json())
      .then((data) => {
        sessionIdRef.current = data.id;
      })
      .catch(() => {});
    stepTimestampsRef.current = { "0": new Date().toISOString() };
  }, []);

  // Track step changes — patch current step + answer data + timestamps
  useEffect(() => {
    if (!sessionIdRef.current) return;

    // Record timestamp for this step
    stepTimestampsRef.current[String(step)] = new Date().toISOString();

    // Build patch payload with current answers for this step
    const patch: Record<string, unknown> = {
      currentStep: step,
      stepTimestamps: { ...stepTimestampsRef.current },
    };

    // Include answers accumulated so far
    if (past.length > 0) patch.pastPerfumeNames = past.map((p) => p.name);
    if (scents.length > 0) patch.scentFamilies = scents;
    if (price) patch.priceRange = price;
    if (occasion) patch.occasion = occasion;
    if (strength) patch.strength = strength;

    patchSession(sessionIdRef.current, patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Mixing animation phases — fetch recommendations during animation
  useEffect(() => {
    if (step !== 5) return;
    setMix(0);
    const t = [
      setTimeout(() => setMix(1), 600),
      setTimeout(() => setMix(2), 1800),
      setTimeout(() => setMix(3), 3500),
    ];

    // Fetch recommendations from API
    const fetchRecs = async () => {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          past_perfume_ids: past.map((p) => p.id),
          scent_families: scents,
          price_range: price,
          occasion,
          strength,
        }),
      });
      const data: ScoredPerfume[] = await res.json();
      setRecs(data);

      // Update session with completion + recommendations
      if (sessionIdRef.current) {
        patchSession(sessionIdRef.current, {
          pastPerfumeNames: past.map((p) => p.name),
          scentFamilies: scents,
          priceRange: price,
          occasion,
          strength,
          recommendedPerfumeNames: data.map((p) => p.name),
          completed: true,
        });
      }
    };

    fetchRecs();

    const resultTimer = setTimeout(() => setResults(true), 4800);
    t.push(resultTimer);

    return () => t.forEach(clearTimeout);
  }, [step, past, scents, price, occasion, strength]);

  // Stagger card reveals
  useEffect(() => {
    if (!results) return;
    const t = setInterval(() => setCards((p) => p + 1), 300);
    return () => clearInterval(t);
  }, [results]);

  const getNotes = useCallback((): string[] => {
    const a = past.flatMap((p) => p.notes);
    const b = scents.flatMap((s) => {
      const f = FAMILIES.find((x) => x.id === s);
      return f ? f.desc.split(", ") : [];
    });
    return [...new Set([...a, ...b])].slice(0, 10);
  }, [past, scents]);

  const restart = useCallback(() => {
    setStep(0);
    setPast([]);
    setScents([]);
    setPrice(null);
    setOccasion(null);
    setStrength(null);
    setResults(false);
    setRecs([]);
    setCards(0);
    setMix(0);
    stepTimestampsRef.current = { "0": new Date().toISOString() };
    // Create a new session for the restart
    const deviceType = window.innerWidth < 768 ? "mobile" : "desktop";
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_type: deviceType }),
    })
      .then((res) => res.json())
      .then((data) => {
        sessionIdRef.current = data.id;
      })
      .catch(() => {});
  }, []);

  const addPast = useCallback((p: Perfume) => setPast((prev) => (prev.length >= 2 ? prev : [...prev, p])), []);
  const removePast = useCallback((id: string) => setPast((prev) => prev.filter((x) => x.id !== id)), []);

  const toggleScent = useCallback(
    (id: ScentFamily) => setScents((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    []
  );

  const selectPrice = useCallback((id: PriceOption) => {
    setPrice(id);
    setTimeout(() => setStep(3), 350);
  }, []);

  const selectOccasion = useCallback((id: Occasion) => {
    setOccasion(id);
    setTimeout(() => setStep(4), 350);
  }, []);

  const selectStrength = useCallback((id: Strength) => {
    setStrength(id);
    setTimeout(() => setStep(5), 350);
  }, []);

  return {
    step,
    setStep,
    past,
    addPast,
    removePast,
    scents,
    toggleScent,
    price,
    selectPrice,
    occasion,
    selectOccasion,
    strength,
    selectStrength,
    results,
    recs,
    cards,
    mix,
    getNotes,
    restart,
  };
}
