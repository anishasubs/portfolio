"use client";

import { useEffect, useState } from "react";

const CAPSULE_COLORS = [
  { id: "sage", body: "#8AAE82", liquid: "#6A9862", deep: "#48783C", level: 0.5 },
  { id: "amber", body: "#C8B074", liquid: "#B8982C", deep: "#8C7020", level: 0.6 },
  { id: "rose", body: "#C4909A", liquid: "#B86878", deep: "#984858", level: 0.68 },
];

function PerfumeCapsule({
  x,
  y,
  id,
  bodyColor,
  liquidColor,
  liquidDeep,
  liquidLevel,
  rotation = 0,
  scale = 1,
}: {
  x: number;
  y: number;
  id: string;
  bodyColor: string;
  liquidColor: string;
  liquidDeep: string;
  liquidLevel: number;
  rotation?: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
      {/* Bottle body */}
      <path
        d="M -20 38 C -20 38 -22 42 -22 48 L -22 88 Q -22 98 -12 98 L 12 98 Q 22 98 22 88 L 22 48 C 22 42 20 38 20 38 L 8 28 L -8 28 Z"
        fill={`url(#glass-${id})`}
      />
      <path
        d="M -20 38 C -20 38 -22 42 -22 48 L -22 88 Q -22 98 -12 98 L 12 98 Q 22 98 22 88 L 22 48 C 22 42 20 38 20 38 L 8 28 L -8 28 Z"
        fill="none"
        stroke={bodyColor}
        strokeWidth="0.6"
        opacity="0.5"
      />
      {/* Liquid */}
      <clipPath id={`liq-${id}`}>
        <path d="M -20 38 C -20 38 -22 42 -22 48 L -22 88 Q -22 98 -12 98 L 12 98 Q 22 98 22 88 L 22 48 C 22 42 20 38 20 38 L 8 28 L -8 28 Z" />
      </clipPath>
      <g clipPath={`url(#liq-${id})`}>
        <rect x="-22" y={98 - 68 * liquidLevel} width="44" height={68 * liquidLevel} fill={liquidColor} opacity="0.5" />
        <ellipse cx="0" cy={98 - 68 * liquidLevel} rx="20" ry="3" fill={liquidColor} opacity="0.3" />
        <rect x="-22" y={98 - 20 * liquidLevel} width="44" height={20 * liquidLevel} fill={liquidDeep} opacity="0.18" />
      </g>
      {/* Glass reflections */}
      <path d="M -18 42 L -20 50 L -20 80 L -18 86 Z" fill="white" opacity="0.28" />
      <path d="M -17 46 L -18 52 L -18 72 L -17 76 Z" fill="white" opacity="0.18" />
      {/* Neck */}
      <rect x="-8" y="16" width="16" height="14" rx="2" fill={`url(#glass-${id})`} />
      <rect x="-6" y="18" width="3" height="10" rx="1" fill="white" opacity="0.2" />
      {/* Gold cap */}
      <rect x="-10" y="2" width="20" height="16" rx="3" fill="url(#sk-goldV)" />
      <rect x="-8" y="5" width="16" height="1.2" rx="0.6" fill="#F0DEB8" opacity="0.5" />
      <rect x="-8" y="9" width="16" height="1" rx="0.5" fill="#A88040" opacity="0.2" />
      <rect x="-8" y="13" width="16" height="1.2" rx="0.6" fill="#F0DEB8" opacity="0.4" />
      <rect x="-6" y="-2" width="12" height="5" rx="2.5" fill="#D4B87A" />
      <rect x="-11" y="16" width="22" height="3" rx="1" fill="url(#sk-goldH)" />
    </g>
  );
}

function ScentKeyAtomizer({ scale = 1 }: { scale?: number }) {
  return (
    <g transform={`translate(0, 0) scale(${scale})`}>
      {/* Keychain ring */}
      <circle cx="0" cy="-14" r="18" fill="none" stroke="url(#sk-goldV)" strokeWidth="5" />
      <circle cx="0" cy="-14" r="15" fill="none" stroke="#A88040" strokeWidth="0.8" opacity="0.2" />
      <path d="M -12 -26 A 18 18 0 0 1 10 -30" fill="none" stroke="#F4E4C0" strokeWidth="2" opacity="0.5" />
      {/* Connector */}
      <rect x="-5" y="2" width="10" height="14" rx="3" fill="url(#sk-goldV)" />
      {/* Cap */}
      <rect x="-22" y="14" width="44" height="40" rx="5" fill="url(#sk-goldV)" />
      <rect x="-20" y="18" width="40" height="1.8" rx="0.6" fill="#F4E4C0" opacity="0.45" />
      <rect x="-20" y="28" width="40" height="1.2" rx="0.6" fill="#A88040" opacity="0.18" />
      <rect x="-20" y="38" width="40" height="1.8" rx="0.6" fill="#F4E4C0" opacity="0.4" />
      <ellipse cx="0" cy="15" rx="15" ry="3" fill="#D4B87A" />
      <rect x="-24" y="52" width="48" height="6" rx="2.5" fill="#C8A060" />
      <rect x="-23" y="52" width="46" height="2" rx="1" fill="#F0DEB8" opacity="0.3" />
      {/* Glass body */}
      <path
        d="M -24 64 C -24 64 -28 70 -28 78 L -28 192 Q -28 210 -10 210 L 10 210 Q 28 210 28 192 L 28 78 C 28 70 24 64 24 64 L 14 58 L -14 58 Z"
        fill="url(#sk-frostLg)"
      />
      <path
        d="M -24 64 C -24 64 -28 70 -28 78 L -28 192 Q -28 210 -10 210 L 10 210 Q 28 210 28 192 L 28 78 C 28 70 24 64 24 64 L 14 58 L -14 58 Z"
        fill="none"
        stroke="rgba(140,175,195,0.4)"
        strokeWidth="0.8"
      />
      {/* Capsule silhouette inside */}
      <clipPath id="sk-atm-clip">
        <path d="M -24 64 C -24 64 -28 70 -28 78 L -28 192 Q -28 210 -10 210 L 10 210 Q 28 210 28 192 L 28 78 C 28 70 24 64 24 64 L 14 58 L -14 58 Z" />
      </clipPath>
      <g clipPath="url(#sk-atm-clip)" opacity="0.5">
        <path
          d="M -14 90 C -14 90 -16 94 -16 100 L -16 175 Q -16 188 -6 188 L 6 188 Q 16 188 16 175 L 16 100 C 16 94 14 90 14 90 L 6 84 L -6 84 Z"
          fill="url(#sk-capsInside)"
        />
        <rect x="-16" y="145" width="32" height="43" fill="#D4858A" opacity="0.25" />
        <ellipse cx="0" cy="145" rx="14" ry="3" fill="#D4858A" opacity="0.15" />
        <rect x="-8" y="80" width="16" height="8" rx="2" fill="#D4B87A" opacity="0.35" />
      </g>
      {/* Glass reflections */}
      <path d="M -22 70 L -25 80 L -25 175 L -22 185 Z" fill="white" opacity="0.26" />
      <path d="M -20 76 L -22 84 L -22 160 L -20 168 Z" fill="white" opacity="0.16" />
      <ellipse cx="-5" cy="120" rx="12" ry="40" fill="white" opacity="0.06" transform="rotate(-2 -5 120)" />
      {/* Measurement marks */}
      <line x1="25" y1="100" x2="20" y2="100" stroke="#A0B8C8" strokeWidth="0.5" opacity="0.2" />
      <line x1="25" y1="140" x2="20" y2="140" stroke="#A0B8C8" strokeWidth="0.5" opacity="0.2" />
      <line x1="25" y1="180" x2="20" y2="180" stroke="#A0B8C8" strokeWidth="0.5" opacity="0.2" />
      {/* Branding */}
      <text x="0" y="200" textAnchor="middle" fontFamily="Shrikhand, cursive" fontSize="7" fill="#B0A068" opacity="0.28" letterSpacing="0.8">
        WHIFFF
      </text>
    </g>
  );
}

function ScentKeyDefs() {
  return (
    <defs>
      <radialGradient id="sk-frostLg" cx="28%" cy="20%" r="75%">
        <stop offset="0%" stopColor="#EDF4F8" stopOpacity="0.94" />
        <stop offset="20%" stopColor="#DCE9F0" stopOpacity="0.84" />
        <stop offset="45%" stopColor="#C6DCE6" stopOpacity="0.7" />
        <stop offset="70%" stopColor="#AECEDA" stopOpacity="0.54" />
        <stop offset="100%" stopColor="#96C2D2" stopOpacity="0.36" />
      </radialGradient>
      <radialGradient id="sk-capsInside" cx="32%" cy="25%">
        <stop offset="0%" stopColor="#FAE8EA" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#E4B8C0" stopOpacity="0.3" />
      </radialGradient>
      <radialGradient id="glass-sage" cx="26%" cy="20%" r="72%">
        <stop offset="0%" stopColor="#F0F8EE" stopOpacity="0.94" />
        <stop offset="25%" stopColor="#DEECD8" stopOpacity="0.82" />
        <stop offset="55%" stopColor="#C6DCC0" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#A8C89E" stopOpacity="0.4" />
      </radialGradient>
      <radialGradient id="glass-amber" cx="26%" cy="20%" r="72%">
        <stop offset="0%" stopColor="#FEF8EC" stopOpacity="0.94" />
        <stop offset="25%" stopColor="#F6EBCE" stopOpacity="0.82" />
        <stop offset="55%" stopColor="#EADCAE" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#D8C890" stopOpacity="0.4" />
      </radialGradient>
      <radialGradient id="glass-rose" cx="26%" cy="20%" r="72%">
        <stop offset="0%" stopColor="#FEF2F3" stopOpacity="0.94" />
        <stop offset="25%" stopColor="#F6E0E3" stopOpacity="0.82" />
        <stop offset="55%" stopColor="#EACCD0" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#D8B0B8" stopOpacity="0.4" />
      </radialGradient>
      <linearGradient id="sk-goldV" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F4E4C0" />
        <stop offset="15%" stopColor="#E4CC98" />
        <stop offset="40%" stopColor="#D4B87A" />
        <stop offset="70%" stopColor="#C8A060" />
        <stop offset="100%" stopColor="#B89050" />
      </linearGradient>
      <linearGradient id="sk-goldH" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#B89050" />
        <stop offset="30%" stopColor="#D4B87A" />
        <stop offset="70%" stopColor="#E4CC98" />
        <stop offset="100%" stopColor="#B89050" />
      </linearGradient>
      <filter id="sk-dropSh" x="-25%" y="-8%" width="150%" height="130%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="7" />
        <feOffset dx="2" dy="5" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.12" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

interface ScentKeyAnimProps {
  size?: number;
  loop?: boolean;
}

export default function ScentKeyAnim({ size = 200, loop = true }: ScentKeyAnimProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    let f = 0;
    const maxFrame = loop ? 180 : 120;
    const interval = setInterval(() => {
      f++;
      if (f >= maxFrame) {
        if (loop) f = 0;
        else {
          clearInterval(interval);
          return;
        }
      }
      setFrame(f);
    }, 33);
    return () => clearInterval(interval);
  }, [loop]);

  // Animation phases:
  // 0-30: capsules slide in from below with stagger
  // 30-60: Scent Key fades in
  // 60-90: idle float
  // 90-180: gentle float loop

  const capsuleProgress = Math.min(frame / 30, 1);
  const keyProgress = Math.min(Math.max((frame - 30) / 30, 0), 1);
  const floatY = frame > 60 ? Math.sin((frame - 60) * 0.04) * 4 : 0;

  const viewW = 280;
  const viewH = 240;
  const scale = size / viewW;

  return (
    <div style={{ width: size, height: size * (viewH / viewW), margin: "0 auto" }}>
      <svg width={size} height={size * (viewH / viewW)} viewBox={`0 0 ${viewW} ${viewH}`}>
        <ScentKeyDefs />
        <g transform={`translate(0, ${floatY})`}>
          {/* 3 capsules sliding in */}
          {CAPSULE_COLORS.map((c, i) => {
            const delay = i * 8;
            const p = Math.min(Math.max((frame - delay) / 22, 0), 1);
            const ease = 1 - Math.pow(1 - p, 3);
            const slideY = (1 - ease) * 60;
            const opacity = ease;
            return (
              <g key={c.id} filter="url(#sk-dropSh)" opacity={opacity}>
                <PerfumeCapsule
                  x={50 + i * 50}
                  y={100 + slideY}
                  id={c.id}
                  bodyColor={c.body}
                  liquidColor={c.liquid}
                  liquidDeep={c.deep}
                  liquidLevel={c.level}
                  rotation={i === 0 ? -5 : i === 2 ? 4 : 0}
                  scale={0.55}
                />
              </g>
            );
          })}

          {/* Scent Key atomizer */}
          <g filter="url(#sk-dropSh)" opacity={keyProgress} transform={`translate(220, 22) scale(0.5)`}>
            <ScentKeyAtomizer />
          </g>
        </g>
      </svg>
    </div>
  );
}

// Smaller version for CTA card
export function ScentKeyMini() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    let f = 0;
    const interval = setInterval(() => {
      f = (f + 1) % 120;
      setFrame(f);
    }, 33);
    return () => clearInterval(interval);
  }, []);

  const floatY = Math.sin(frame * 0.05) * 3;

  return (
    <div className="w-[120px] h-[110px] mx-auto">
      <svg width="120" height="110" viewBox="0 0 280 240">
        <ScentKeyDefs />
        <g transform={`translate(0, ${floatY})`}>
          {CAPSULE_COLORS.map((c, i) => (
            <g key={c.id} filter="url(#sk-dropSh)">
              <PerfumeCapsule
                x={50 + i * 50}
                y={100}
                id={c.id}
                bodyColor={c.body}
                liquidColor={c.liquid}
                liquidDeep={c.deep}
                liquidLevel={c.level}
                rotation={i === 0 ? -5 : i === 2 ? 4 : 0}
                scale={0.55}
              />
            </g>
          ))}
          <g filter="url(#sk-dropSh)" transform="translate(220, 22) scale(0.5)">
            <ScentKeyAtomizer />
          </g>
        </g>
      </svg>
    </div>
  );
}
