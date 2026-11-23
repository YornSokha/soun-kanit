import React from "react";

interface BrandLogoProps {
  size?: number;
}

/**
 * Safari-safe inline SVG lotus-and-garden emblem for Soun Kanit (សួនគណិត).
 */
export function BrandLogo({ size = 38 }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0 rounded-2xl shadow-xs"
    >
      <rect width={64} height={64} rx={16} fill="#15803d" />
      <rect x={6} y={6} width={52} height={52} rx={12} fill="#fcfaf5" />
      <ellipse
        cx={32}
        cy={45}
        rx={19}
        ry={6.5}
        fill="#4ade80"
        stroke="#15803d"
        strokeWidth={2}
      />
      <ellipse
        cx={22}
        cy={33}
        rx={6.5}
        ry={11}
        transform="rotate(-28 22 33)"
        fill="#f472b6"
        stroke="#be185d"
        strokeWidth={1.6}
      />
      <ellipse
        cx={42}
        cy={33}
        rx={6.5}
        ry={11}
        transform="rotate(28 42 33)"
        fill="#f472b6"
        stroke="#be185d"
        strokeWidth={1.6}
      />
      <ellipse
        cx={32}
        cy={30}
        rx={7}
        ry={13}
        fill="#fbcfe8"
        stroke="#be185d"
        strokeWidth={1.6}
      />
      <circle
        cx={32}
        cy={36}
        r={4}
        fill="#facc15"
        stroke="#b45309"
        strokeWidth={1.4}
      />
    </svg>
  );
}
