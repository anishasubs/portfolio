"use client";

import { useState, useEffect } from "react";
import { MSGS } from "@/lib/constants";
import { useTypewriter } from "@/hooks/useTypewriter";
import { useQuizState } from "@/hooks/useQuizState";
import WhifffLogo from "@/components/WhifffLogo";
import ProgressBar from "@/components/ProgressBar";
import ChatBubble from "@/components/ChatBubble";
import PerfumeSearch from "@/components/PerfumeSearch";
import ScentFamilyGrid from "@/components/ScentFamilyGrid";
import PriceSelector from "@/components/PriceSelector";
import OccasionGrid from "@/components/OccasionGrid";
import StrengthPicker from "@/components/StrengthPicker";
import MixingAnimation from "@/components/MixingAnimation";
import ResultCard from "@/components/ResultCard";
import BottleSpritz from "@/components/BottleSpritz";

export default function Home() {
  const quiz = useQuizState();
  const [typed, done] = useTypewriter(MSGS[quiz.step] || "");
  const [loading, setLoading] = useState(true);

  // Simple timer: show splash for 3.2s (matches animation length)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 3200);
    return () => clearTimeout(t);
  }, []);

  // Loading splash — bottle spritz plays once, then reveals the quiz
  if (loading) {
    return (
      <div
        className="min-h-screen font-nunito flex flex-col items-center justify-center"
        style={{
          backgroundImage: "url('/clouds-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
          backgroundColor: "#8FC5E8",
        }}
      >
        <div className="animate-fadeUp text-center">
          <BottleSpritz size="hero" />
          <h1
            className="font-shrikhand text-[clamp(56px,14vw,80px)] text-[#D4191A] m-0 leading-none tracking-tight -mt-4"
            style={{ WebkitTextStroke: "1px black", textShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
          >
            whifff
          </h1>
          <p className="font-pacifico text-[clamp(14px,3.5vw,18px)] text-white mt-1.5 opacity-85 [text-shadow:0_2px_10px_rgba(0,40,80,0.1)]">
            your next favorite scent is one quiz away
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-nunito relative overflow-hidden"
      style={{
        backgroundImage: "url('/clouds-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center 40%",
        backgroundColor: "#8FC5E8",
      }}
    >

      {/* Logo */}
      <WhifffLogo />

      {/* Progress */}
      <ProgressBar step={quiz.step} />

      {/* Quiz content */}
      <div className="max-w-[480px] mx-auto px-5 pb-[50px]">
        {/* Chat bubble (hidden during results) */}
        {!quiz.results && <ChatBubble text={typed} cursor={!done} />}

        {/* Step 0: Past perfumes */}
        {quiz.step === 0 && done && (
          <div className="animate-fadeUp">
            <PerfumeSearch onSelect={quiz.addPast} selected={quiz.past} />

            {quiz.past.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {quiz.past.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 bg-white/90 rounded-[14px] py-2 px-3 shadow-[0_2px_10px_rgba(0,40,80,0.06)] animate-chipIn"
                  >
                    <div className="w-[26px] h-8 rounded-lg bg-[#F0F5FA] flex items-center justify-center overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.img}
                        alt=""
                        className="max-h-[85%] max-w-[75%] object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-[#1B3A5C] whitespace-nowrap overflow-hidden text-ellipsis max-w-[110px]">
                        {p.name}
                      </div>
                      <div className="text-[9px] text-[#6B8CAE]">{p.brand}</div>
                    </div>
                    <button
                      onClick={() => quiz.removePast(p.id)}
                      aria-label={`Remove ${p.name}`}
                      className="bg-transparent border-none cursor-pointer text-sm text-[#4A8EC2] px-0.5 opacity-50 transition-opacity hover:opacity-100"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              className="bp w-full p-[15px] rounded-full bg-white text-[#4A8EC2] text-sm font-extrabold tracking-wide shadow-[0_4px_16px_rgba(0,40,80,0.1)]"
              onClick={() => quiz.setStep(1)}
            >
              {quiz.past.length > 0 ? "next \u2192" : "skip for now \u2192"}
            </button>
          </div>
        )}

        {/* Step 1: Scent families */}
        {quiz.step === 1 && done && (
          <ScentFamilyGrid selected={quiz.scents} onToggle={quiz.toggleScent} onNext={() => quiz.setStep(2)} />
        )}

        {/* Step 2: Price */}
        {quiz.step === 2 && done && <PriceSelector onSelect={quiz.selectPrice} />}

        {/* Step 3: Occasion */}
        {quiz.step === 3 && done && <OccasionGrid onSelect={quiz.selectOccasion} />}

        {/* Step 4: Strength */}
        {quiz.step === 4 && done && <StrengthPicker onSelect={quiz.selectStrength} />}

        {/* Step 5: Mixing animation */}
        {quiz.step === 5 && !quiz.results && <MixingAnimation phase={quiz.mix} notes={quiz.getNotes()} />}

        {/* Results */}
        {quiz.results && (
          <div className="animate-fadeUp">
            <ChatBubble
              text={
                quiz.past.length > 0
                  ? `okay based on your love for ${quiz.past.map((p) => p.name).join(" & ")} and your vibe \u2014 here's what i'd pick for you`
                  : "here's what i put together for you \u2014 i think you're gonna love these"
              }
              cursor={false}
            />

            {quiz.recs.map((p, i) => quiz.cards > i && <ResultCard key={p.id} p={p} i={i} />)}

            {quiz.cards >= 3 && (
              <div className="text-center mt-6 animate-fadeUp">
                <button
                  className="bp py-[15px] px-10 rounded-full bg-white text-[#4A8EC2] text-sm font-extrabold tracking-wide shadow-[0_4px_16px_rgba(0,40,80,0.1)]"
                  onClick={quiz.restart}
                >
                  start over {"\u2726"}
                </button>
                <a
                  href="/ledger"
                  className="block mt-3 text-xs font-semibold text-[#4A8EC2]/70 hover:text-[#4A8EC2] transition-colors"
                >
                  see what others got recommended &rarr;
                </a>
                <p className="text-[10px] text-[#1B3A5C] mt-3.5 opacity-40 font-semibold">
                  scent data via fragrantica &middot; prices approximate
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
