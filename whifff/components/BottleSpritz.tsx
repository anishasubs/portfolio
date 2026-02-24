"use client";

import { useEffect, useRef, useState } from "react";

// Vintage perfume bottle — retro print/illustration style
const STROKE = "#5C3D4A";
const GLASS = "#D2B5D6";
const GLASS_LIGHT = "#E4D0E8";
const GOLD = "#C9A85C";
const GOLD_LIGHT = "#DFC88A";
const PINK = "#D4838F";
const PINK_DARK = "#B86B78";
const CREAM = "#F5EDE0";

function Bottle({ bulbSquish }: { bulbSquish: number }) {
  const bulbScaleX = 1 + (0.7 - 1) * bulbSquish;
  const bulbScaleY = 1 + (1.15 - 1) * bulbSquish;

  return (
    <g transform="translate(148, 100)">
      {/* === BOTTLE BODY === */}
      <circle cx="0" cy="42" r="44" fill={GLASS} stroke={STROKE} strokeWidth="2.2" />
      <path d="M -28 20 Q -32 42 -20 64" fill="none" stroke={GLASS_LIGHT} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M -22 16 Q -28 40 -16 60" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />

      {/* Cameo floral relief */}
      <circle cx="-2" cy="38" r="9" fill={CREAM} stroke={STROKE} strokeWidth="1" opacity="0.6" />
      <circle cx="-8" cy="32" r="5.5" fill={CREAM} stroke={STROKE} strokeWidth="0.8" opacity="0.5" />
      <circle cx="5" cy="32" r="5" fill={CREAM} stroke={STROKE} strokeWidth="0.8" opacity="0.5" />
      <circle cx="-8" cy="45" r="4.5" fill={CREAM} stroke={STROKE} strokeWidth="0.8" opacity="0.45" />
      <circle cx="5" cy="44" r="4.5" fill={CREAM} stroke={STROKE} strokeWidth="0.8" opacity="0.45" />
      <path d="M -18 52 Q -22 48 -14 48" fill="none" stroke={STROKE} strokeWidth="0.8" opacity="0.35" />
      <path d="M 14 38 Q 18 34 12 36" fill="none" stroke={STROKE} strokeWidth="0.8" opacity="0.3" />
      <circle cx="12" cy="56" r="2" fill={CREAM} stroke={STROKE} strokeWidth="0.6" opacity="0.4" />
      <circle cx="16" cy="52" r="1.5" fill={CREAM} stroke={STROKE} strokeWidth="0.5" opacity="0.35" />

      {/* === GOLD COLLAR === */}
      <rect x="-20" y="-8" width="40" height="13" rx="2.5" fill={GOLD} stroke={STROKE} strokeWidth="1.8" />
      <line x1="-17" y1="-2" x2="17" y2="-2" stroke={GOLD_LIGHT} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="-16" y="-12" width="32" height="5" rx="2" fill={GOLD_LIGHT} stroke={STROKE} strokeWidth="1.5" />

      {/* === NOZZLE ARM — LEFT === */}
      <rect x="-2.5" y="-20" width="5" height="9" rx="1.5" fill={GOLD} stroke={STROKE} strokeWidth="1.3" />
      <circle cx="0" cy="-21" r="3.5" fill={GOLD_LIGHT} stroke={STROKE} strokeWidth="1.3" />
      <line x1="0" y1="-21" x2="-30" y2="-21" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
      <line x1="0" y1="-21" x2="-30" y2="-21" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="-30" cy="-21" r="2.5" fill={GOLD} stroke={STROKE} strokeWidth="1.2" />
      <rect x="-36" y="-23" width="7" height="4" rx="1.5" fill={GOLD} stroke={STROKE} strokeWidth="1.2" />

      {/* === TUBE + BULB — RIGHT, sideways === */}
      <line x1="0" y1="-21" x2="28" y2="-21" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
      <line x1="0" y1="-21" x2="28" y2="-21" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" />

      <g transform={`translate(28, -21) scale(${bulbScaleX}, ${bulbScaleY})`}>
        <ellipse cx="12" cy="0" rx="12" ry="8.5" fill={PINK} stroke={STROKE} strokeWidth="1.5" />
        <line x1="7" y1="-5" x2="7" y2="5" stroke={PINK_DARK} strokeWidth="0.8" opacity="0.5" strokeLinecap="round" />
        <line x1="12" y1="-6.5" x2="12" y2="6.5" stroke={PINK_DARK} strokeWidth="0.8" opacity="0.45" strokeLinecap="round" />
        <line x1="17" y1="-5" x2="17" y2="5" stroke={PINK_DARK} strokeWidth="0.8" opacity="0.4" strokeLinecap="round" />
        <rect x="-2" y="-3" width="4" height="6" rx="1.5" fill={GOLD} stroke={STROKE} strokeWidth="1" />
      </g>
    </g>
  );
}

function PerfumeCloud({ progress }: { progress: number }) {
  if (progress <= 0) return null;

  const mainOpacity =
    progress < 0.1 ? progress / 0.1 * 0.85 :
    progress < 0.55 ? 0.85 :
    0.85 * Math.max(0, 1 - (progress - 0.55) / 0.45);

  const spreadX = -55 * Math.min(progress / 0.7, 1);
  const spreadY = -16 * Math.min(progress / 0.6, 1);
  const cloudScale = 0.5 + progress * 0.7;

  return (
    <g
      transform={`translate(${112 + spreadX}, ${79 + spreadY}) scale(${cloudScale})`}
      opacity={Math.max(0, mainOpacity)}
    >
      <circle cx="0" cy="0" r="20" fill="white" stroke={STROKE} strokeWidth="0.8" opacity="0.7" />
      <circle cx="-18" cy="-5" r="16" fill="white" stroke={STROKE} strokeWidth="0.7" opacity="0.6" />
      <circle cx="-10" cy="10" r="14" fill="white" stroke={STROKE} strokeWidth="0.6" opacity="0.55" />
      <circle cx="-34" cy="-2" r="13" fill="white" stroke={STROKE} strokeWidth="0.6" opacity="0.45" />
      <circle cx="-26" cy="-14" r="11" fill="white" stroke={STROKE} strokeWidth="0.5" opacity="0.4" />
      <circle cx="-44" cy="-4" r="9" fill="white" stroke={STROKE} strokeWidth="0.5" opacity="0.3" />
      <circle cx="-50" cy="2" r="5" fill="white" opacity="0.2" />
      <circle cx="-38" cy="-16" r="4" fill="white" opacity="0.18" />
      {/* Sparkle crosses */}
      <g opacity="0.8">
        <line x1="-8" y1="-8" x2="-8" y2="-4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="-10" y1="-6" x2="-6" y2="-6" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      <g opacity="0.6">
        <line x1="-28" y1="2" x2="-28" y2="5" stroke="white" strokeWidth="1" strokeLinecap="round" />
        <line x1="-29.5" y1="3.5" x2="-26.5" y2="3.5" stroke="white" strokeWidth="1" strokeLinecap="round" />
      </g>
      <g opacity="0.5">
        <line x1="-18" y1="-18" x2="-18" y2="-15.5" stroke="white" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="-19.2" y1="-16.8" x2="-16.8" y2="-16.8" stroke="white" strokeWidth="0.8" strokeLinecap="round" />
      </g>
    </g>
  );
}

interface BottleSpritzProps {
  size?: "splash" | "hero" | "loading";
  loop?: boolean;
  onAnimationEnd?: () => void;
}

export default function BottleSpritz({ size = "hero", loop = false, onAnimationEnd }: BottleSpritzProps) {
  const [frame, setFrame] = useState(0);
  const callbackRef = useRef(onAnimationEnd);
  callbackRef.current = onAnimationEnd;

  useEffect(() => {
    let f = 0;
    const maxFrame = 90;
    const interval = setInterval(() => {
      f++;
      if (f >= maxFrame) {
        if (loop) {
          f = 0;
        } else {
          clearInterval(interval);
          callbackRef.current?.();
          return;
        }
      }
      setFrame(f);
    }, 1000 / 30);
    return () => clearInterval(interval);
  }, [loop]);

  const bottleOpacity = Math.min(frame / 10, 1);

  const bulbSquish =
    frame < 8 ? 0 :
    frame < 18 ? (frame - 8) / 10 :
    frame < 28 ? 1 - (frame - 18) / 10 * 0.4 :
    frame < 40 ? 0.6 - (frame - 28) / 12 * 0.6 :
    0;

  const cloudProgress =
    frame < 16 ? 0 :
    frame < 78 ? (frame - 16) / 62 :
    1;

  const floatY = Math.sin(frame * 0.06) * 2.5;

  const dims = size === "splash"
    ? { w: 340, h: 240, className: "mx-auto w-[340px] h-[240px]" }
    : size === "hero"
    ? { w: 280, h: 200, className: "mx-auto w-[280px] h-[200px]" }
    : { w: 160, h: 120, className: "mx-auto w-[160px] h-[120px]" };

  return (
    <div className={dims.className} style={{ filter: "drop-shadow(0 4px 16px rgba(92,61,74,0.2))" }}>
      <svg
        width={dims.w}
        height={dims.h}
        viewBox="-40 0 380 280"
        style={{
          transform: `translateY(${floatY}px)`,
          opacity: bottleOpacity,
        }}
      >
        <PerfumeCloud progress={cloudProgress} />
        <Bottle bulbSquish={bulbSquish} />
      </svg>
    </div>
  );
}
