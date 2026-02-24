"use client";

import { useState, useRef, useEffect } from "react";
import type { Perfume } from "@/lib/types";

interface PerfumeSearchProps {
  onSelect: (p: Perfume) => void;
  selected: Perfume[];
}

export default function PerfumeSearch({ onSelect, selected }: PerfumeSearchProps) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<Perfume[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/perfumes/search?q=${encodeURIComponent(q)}&limit=5`, {
          signal: controller.signal,
        });
        const data: Perfume[] = await res.json();
        setResults(data.filter((p) => !selected.some((s) => s.id === p.id)));
      } catch {
        // aborted — ignore
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, selected]);

  return (
    <div className="relative mb-3.5">
      <div
        className="flex items-center gap-2 bg-white/90 rounded-2xl py-[13px] px-[18px] shadow-[0_2px_12px_rgba(0,40,80,0.06)] transition-[border] duration-200"
        style={{ border: focused ? "2px solid #4A8EC2" : "2px solid rgba(255,255,255,0.5)" }}
      >
        <span className="text-base opacity-40">{"\u{1F50D}"}</span>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="type a perfume name..."
          aria-label="Search perfumes"
          className="flex-1 border-none outline-none text-sm text-[#1B3A5C] bg-transparent font-nunito font-medium placeholder:text-[#8BACC8]"
        />
      </div>

      {results.length > 0 && focused && (
        <div className="absolute top-full left-0 right-0 bg-white rounded-2xl mt-1.5 shadow-[0_12px_40px_rgba(0,40,80,0.15)] overflow-hidden z-10 animate-fadeUp">
          {results.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                onSelect(p);
                setQ("");
                inputRef.current?.focus();
              }}
              className="flex items-center gap-3 py-2.5 px-4 cursor-pointer border-b border-[#F0F4F8] transition-colors duration-150 hover:bg-[#F5F9FD]"
            >
              <div className="w-[34px] h-[42px] rounded-[10px] bg-[#F0F5FA] flex items-center justify-center overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.img}
                  alt=""
                  className="max-h-[88%] max-w-[78%] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div>
                <div className="text-[13px] font-bold text-[#1B3A5C]">{p.name}</div>
                <div className="text-[11px] text-[#6B8CAE]">{p.brand}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {q.length >= 3 && results.length === 0 && focused && (
        <div className="absolute top-full left-0 right-0 bg-white rounded-2xl mt-1.5 py-3.5 px-4 shadow-[0_12px_40px_rgba(0,40,80,0.15)] z-10">
          <p className="text-xs text-[#6B8CAE] m-0 text-center">hmm, don&apos;t have that one yet &mdash; try another!</p>
        </div>
      )}
    </div>
  );
}
