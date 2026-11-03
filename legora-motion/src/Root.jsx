import React from 'react';
import {Composition, useCurrentFrame, interpolate, spring, useVideoConfig, Easing} from 'remotion';

const TEAL = '#0E6A5E';
const SIZE = 192;
const Svg = ({bg = '#FAFAF8', children}) => (
  <div style={{width: SIZE, height: SIZE, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <svg width={SIZE * 0.78} height={SIZE * 0.78} viewBox="0 0 24 24" fill="none" stroke={TEAL}
      strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{overflow: 'visible'}}>
      {children}
    </svg>
  </div>
);
const loop = (f, n) => (f % n) / n;

// Slide 1 — Why Legora: the scales of justice, gently weighing
const Scale = () => {
  const f = useCurrentFrame();
  const a = Math.sin(loop(f, 90) * Math.PI * 2);
  return (
    <Svg>
      <path d="M12 3v18" /><path d="M7 21h10" />
      <g transform={`rotate(${a * 7} 12 5.5)`}><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1" /></g>
      <g transform={`translate(0 ${-a * 1.1})`}><path d="m5 8 3 8a5 5 0 0 1-6 0zV7" /></g>
      <g transform={`translate(0 ${a * 1.1})`}><path d="m19 8 3 8a5 5 0 0 1-6 0zV7" /></g>
    </Svg>
  );
};

// Slide 1 — What I bring: "I build things"
const Hammer = () => {
  const f = useCurrentFrame() % 45;
  const up = interpolate(f, [0, 22, 30, 32, 45], [0, -28, -28, 6, 0], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const spark = interpolate(f, [31, 34, 42], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Svg>
      <g transform={`rotate(${up} 4 20)`}>
        <path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9" />
        <path d="m18 15 4-4" />
        <path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" />
      </g>
      <g opacity={spark}>
        <path d="M22.5 16.5l1.5 1" /><path d="M20.5 18l.6 1.8" /><path d="M23.5 13.5l1.6-.2" />
      </g>
    </Svg>
  );
};

// Slide 2 / 01 — a feature gets copied
const Copy = () => {
  const f = useCurrentFrame() % 75;
  const t = interpolate(f, [8, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const fade = interpolate(f, [58, 72], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Svg>
      <rect width="14" height="14" x="2" y="2" rx="2" />
      <g transform={`translate(${t * 6} ${t * 6})`} opacity={Math.min(t * 2, 1) * fade}>
        <rect width="14" height="14" x="2" y="2" rx="2" fill="#FAFAF8" />
        <path d="M6 7h6M6 10h4" />
      </g>
      <path d="M6 7h6M6 10h4" opacity={1 - Math.min(t * 2, 1) * fade} />
    </Svg>
  );
};

// Slide 2 / 02 — the price war: tag swings, arrow keeps falling
const Tag = () => {
  const f = useCurrentFrame();
  const a = Math.sin(loop(f, 60) * Math.PI * 2) * 9;
  const d = loop(f, 60);
  const y = interpolate(d, [0, 1], [-1.5, 3]);
  const o = interpolate(d, [0, 0.2, 0.75, 1], [0, 1, 1, 0]);
  return (
    <Svg>
      <g transform={`translate(-2 -2) rotate(${a} 7.5 7.5)`}>
        <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
        <circle cx="7.5" cy="7.5" r=".6" fill={TEAL} />
      </g>
      <g transform={`translate(0 ${y})`} opacity={o}>
        <path d="M21 15v6" /><path d="m18.5 18.5 2.5 2.5 2.5-2.5" />
      </g>
    </Svg>
  );
};

// Slide 2 / 03 — what compounds
const Compound = () => {
  const f = useCurrentFrame() % 90;
  const {fps} = useVideoConfig();
  const hs = [3, 6, 10.5, 17];
  const fade = interpolate(f, [76, 88], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Svg>
      <path d="M2 21.5h20" />
      {hs.map((h, i) => {
        const s = spring({frame: f - 6 - i * 9, fps, config: {damping: 14, stiffness: 120}});
        const hh = h * s;
        return <rect key={i} x={3 + i * 4.8} y={20 - hh} width={3.2} height={Math.max(hh, 0.01)} rx={0.8}
          fill={i === 3 ? TEAL : 'none'} opacity={hh < 0.4 ? 0 : fade} />;
      })}
    </Svg>
  );
};

// Slide 2 callout — make leaving expensive: the lock clicks shut
const Lock = () => {
  const f = useCurrentFrame() % 75;
  const {fps} = useVideoConfig();
  const close = spring({frame: f - 10, fps, config: {damping: 9, stiffness: 160}});
  const open = interpolate(f, [62, 74], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const y = -3.5 * (1 - close) - 3.5 * open * close;
  const ring = interpolate(f, [16, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Svg bg="#F0F0EC">
      <rect x="1" y="9" width="22" height="15" rx="4" opacity={(1 - ring) * 0.6 * (f > 16 ? 1 : 0)}
        transform={`translate(12 16.5) scale(${0.8 + ring * 0.35}) translate(-12 -16.5)`} strokeWidth={1} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" transform={`translate(0 ${y})`} />
      <rect width="18" height="11" x="3" y="11" rx="2" fill="#F0F0EC" />
      <circle cx="12" cy="16" r="1" fill={TEAL} stroke="none" /><path d="M12 17v1.5" />
    </Svg>
  );
};

// Slide 3 — law firms: pillars rise
const Landmark = () => {
  const f = useCurrentFrame() % 90;
  const {fps} = useVideoConfig();
  const fade = interpolate(f, [78, 89], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const roof = spring({frame: f - 34, fps, config: {damping: 12}});
  return (
    <Svg>
      <g opacity={fade}>
        <path d="M3 22h18" />
        {[6, 10, 14, 18].map((x, i) => {
          const s = spring({frame: f - 4 - i * 6, fps, config: {damping: 14}});
          return <path key={x} d={`M${x} 18v${-7 * s}`} opacity={s < 0.06 ? 0 : 1} />;
        })}
        <g transform={`translate(0 ${-4 * (1 - roof)})`} opacity={roof}>
          <path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z" />
        </g>
      </g>
    </Svg>
  );
};

// Slide 3 — in-house: lights come on floor by floor
const Building = () => {
  const f = useCurrentFrame() % 90;
  const fade = interpolate(f, [78, 89], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lit = (start) => interpolate(f, [start, start + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * fade;
  return (
    <Svg>
      <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
      <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
      <path d="M10 12h4" opacity={0.25 + 0.75 * lit(18)} />
      <path d="M10 8h4" opacity={0.25 + 0.75 * lit(30)} />
      <path d="M4 13h.01M4 16.5h.01M20 11h.01M20 14.5h.01" strokeWidth={2.2} opacity={lit(42)} />
    </Svg>
  );
};

// Slide 2 — it's about the relationship: a second person steps in beside the first, value keeps rising
const Relationship = () => {
  const f = useCurrentFrame() % 90;
  const {fps} = useVideoConfig();
  const out = interpolate(f, [80, 89], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const join = spring({frame: f - 4, fps, config: {damping: 13}}) * (1 - out);
  const plus = (start) => {
    const t = interpolate(f, [start, start + 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return {y: 6 - t * 5, o: f < start ? 0 : interpolate(t, [0, 0.15, 0.7, 1], [0, 1, 1, 0])};
  };
  const ps = [plus(30), plus(52)];
  return (
    <Svg>
      <g>
        <circle cx="9" cy="7" r="4" />
        <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
      </g>
      <g transform={`translate(${5 * (1 - join)} 0)`} opacity={join}>
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      </g>
      {ps.map((p, i) => (
        <g key={i} opacity={p.o} transform={`translate(21.5 ${p.y})`}>
          <path d="M0 -1.3v2.6M-1.3 0h2.6" strokeWidth={1.4} />
        </g>
      ))}
    </Svg>
  );
};

// Slide 3 — law firms: an open law book, lines written in, a section mark appears
const LawBook = () => {
  const f = useCurrentFrame() % 90;
  const {fps} = useVideoConfig();
  const fade = interpolate(f, [78, 89], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const line = (s) => interpolate(f, [s, s + 10], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sec = spring({frame: f - 40, fps, config: {damping: 11, stiffness: 140}});
  return (
    <Svg>
      <path d="M2 5h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
      <path d="M22 5h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
      <g opacity={fade}>
        {[9, 12, 15].map((y, i) => (
          <path key={y} d={`M4.5 ${y}h4.5`} pathLength={1} strokeDasharray={1} strokeDashoffset={line(8 + i * 8)} strokeWidth={1.2} />
        ))}
        <text x="17" y="15.2" textAnchor="middle" fontSize="8" fontFamily="DejaVu Serif, Georgia, serif" fill={TEAL} stroke="none"
          opacity={sec} transform={`translate(17 12.5) scale(${0.6 + 0.4 * sec}) translate(-17 -12.5)`}>§</text>
      </g>
    </Svg>
  );
};

const comps = {Scale: [Scale, 90], Hammer: [Hammer, 45], Copy: [Copy, 75], Tag: [Tag, 60], Compound: [Compound, 90], Lock: [Lock, 75], Landmark: [Landmark, 90], Building: [Building, 90], Relationship: [Relationship, 90], LawBook: [LawBook, 90]};
export const Root = () => (
  <>
    {Object.entries(comps).map(([id, [C, d]]) => (
      <Composition key={id} id={id} component={C} durationInFrames={d} fps={30} width={SIZE} height={SIZE} />
    ))}
  </>
);
