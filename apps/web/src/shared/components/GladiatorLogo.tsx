import React from "react";

interface GladiatorLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Gladiator Pro inline SVG logo — classic Corinthian gladiator helmet
 * with brow line, T-visor, and rounded cheek guards.
 * Renders crisply at any size because it's pure vector.
 */
export const GladiatorLogo: React.FC<GladiatorLogoProps> = ({
  size = 30,
  className,
  style,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 120"
    width={size}
    height={size * 1.2}
    className={className}
    style={style}
  >
    {/* Crest — pointed blade shape rising from dome */}
    <path
      d="M50 0 L44 22 Q50 18 56 22 Z"
      fill="#F59E0B"
    />
    {/* Main helmet dome + face + chin — single gold silhouette */}
    <path
      d="
        M20 50
        Q20 20 50 16
        Q80 20 80 50
        L80 65
        Q80 82 70 92
        L65 100
        Q58 108 50 110
        Q42 108 35 100
        L30 92
        Q20 82 20 65
        Z
      "
      fill="#F59E0B"
    />
    {/* Brow line — dark arc across forehead */}
    <path
      d="M22 48 Q38 38 50 40 Q62 38 78 48"
      stroke="#0f172a"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* T-visor — horizontal eye slit */}
    <path
      d="M26 54 L74 54 L74 62 Q62 58 50 60 Q38 58 26 62 Z"
      fill="#0f172a"
    />
    {/* T-visor — vertical nose/mouth slot */}
    <path
      d="M44 54 L44 88 Q44 94 50 98 Q56 94 56 88 L56 54 Z"
      fill="#0f172a"
    />
    {/* Left cheek guard contour */}
    <path
      d="M24 62 Q22 76 30 90"
      stroke="#0f172a"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Right cheek guard contour */}
    <path
      d="M76 62 Q78 76 70 90"
      stroke="#0f172a"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export default GladiatorLogo;
