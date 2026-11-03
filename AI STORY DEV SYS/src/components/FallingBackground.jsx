import React, { useMemo } from "react";

// What drifts through the background for every theme. "dir" is "down" (falls) or "up" (floats up).
const SETS = {
  standard: { items: ["K.Ganesh","yashwanth","Tejesh"], count: 10, size: [14, 22], dur: [16, 26], dir: "down", opacity: 0.28 },
  rgbclr: { items: ["🎮", "🕹️", "👾", "💎", "⚡", "🌈"], count: 18, size: [16, 28], dur: [8, 15], dir: "down", opacity: 0.5 },
  cyberpunk: { items: ["🤖", "🔷", "💠", "🛰️", "⚡", "🔮"], count: 16, size: [14, 26], dur: [10, 18], dir: "down", opacity: 0.45 },
  emerald: { items: ["🍃", "🌿", "🦋", "🍀", "🐞", "🌱"], count: 18, size: [16, 26], dur: [12, 22], dir: "down", opacity: 0.5 },
  sunset: { items: ["🌅", "🍂", "🍁", "🕊️", "🪁", "☀️"], count: 16, size: [16, 28], dur: [12, 20], dir: "down", opacity: 0.5 },
  party: { items: ["🎉", "🎈", "🎊", "🥳", "🎁", "🪩"], count: 20, size: [18, 30], dur: [7, 13], dir: "down", opacity: 0.6 },
  rainy: { items: ["💧", "☔", "🐸", "🌧️", "🌈", "💦"], count: 22, size: [12, 24], dur: [6, 11], dir: "down", opacity: 0.45 },
  dream: { items: ["🌸", "🫧", "✨", "🦋", "☁️", "🪷", "🌙", "⭐"], count: 16, size: [18, 34], dur: [22, 36], dir: "up", opacity: 0.55 },
};

// small deterministic random so particles do not jump around on every re-render
const rand = (seed) => {
  const x = Math.sin(seed * 9999.17) * 10000;
  return x - Math.floor(x);
};

export default function FallingBackground({ theme, dream }) {
  const key = dream ? "dream" : theme;
  const set = SETS[key] || SETS.standard;

  const particles = useMemo(
    () =>
      Array.from({ length: set.count }, (_, i) => {
        const r = (n) => rand(i * 7.31 + n * 3.7 + key.length);
        return {
          emoji: set.items[i % set.items.length],
          left: `${(i / set.count) * 100 + r(1) * (100 / set.count)}%`,
          size: set.size[0] + r(2) * (set.size[1] - set.size[0]),
          duration: set.dur[0] + r(3) * (set.dur[1] - set.dur[0]),
          delay: -r(4) * set.dur[1], // negative: already mid-air on load
          sway: 18 + r(5) * 42,
          blur: dream && r(6) > 0.6 ? 1.5 : 0,
        };
      }),
    [key, set]
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      <style>{`
        @keyframes pcFall {
          0%   { transform: translate3d(0, -12vh, 0) rotate(0deg); }
          25%  { transform: translate3d(var(--sway), 22vh, 0) rotate(70deg); }
          50%  { transform: translate3d(calc(var(--sway) * -1), 50vh, 0) rotate(150deg); }
          75%  { transform: translate3d(var(--sway), 78vh, 0) rotate(240deg); }
          100% { transform: translate3d(0, 112vh, 0) rotate(330deg); }
        }
        @keyframes pcRise {
          0%   { transform: translate3d(0, 112vh, 0) scale(0.8); }
          50%  { transform: translate3d(var(--sway), 50vh, 0) scale(1.05); }
          100% { transform: translate3d(calc(var(--sway) * -1), -14vh, 0) scale(0.9); }
        }
        .pc-particle { position: absolute; top: 0; user-select: none; will-change: transform; }
        @media (prefers-reduced-motion: reduce) { .pc-particle { animation: none !important; display: none; } }
      `}</style>
      {particles.map((p, i) => (
        <span
          key={`${key}-${i}`}
          className="pc-particle"
          style={{
            left: p.left,
            fontSize: `${p.size}px`,
            opacity: set.opacity,
            filter: p.blur ? `blur(${p.blur}px)` : undefined,
            "--sway": `${p.sway}px`,
            animation: `${set.dir === "up" ? "pcRise" : "pcFall"} ${p.duration}s linear ${p.delay}s infinite`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}