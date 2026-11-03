import React from "react";

// PlotCraft mark: an open book with a spark rising from it.
export default function PlotCraftLogo({ size = 40, className = "" }) {
  const id = `pc-grad-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="PlotCraft logo"
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="0.55" stopColor="#ec4899" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="14" fill={`url(#${id})`} />
      <path d="M10 18.5c4-1.6 9-1.2 14 2v14c-5-3.2-10-3.6-14-2z" fill="#fff" fillOpacity="0.95" />
      <path d="M38 18.5c-4-1.6-9-1.2-14 2v14c5-3.2 10-3.6 14-2z" fill="#fff" fillOpacity="0.75" />
      <path d="M24 5.5l1.9 5.1 5.1 1.9-5.1 1.9L24 19.5l-1.9-5.1L17 12.5l5.1-1.9z" fill="#fff" />
    </svg>
  );
}