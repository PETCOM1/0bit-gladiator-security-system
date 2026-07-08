import React from "react";

interface GladiatorLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Gladiator Pro inline SVG logo — a classic Spartan/gladiator helmet.
 * Renders crisply at any size because it's pure vector.
 */
export const GladiatorLogo: React.FC<GladiatorLogoProps> = ({
  size = 30,
  className,
  style,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 80"
    width={size}
    height={size * (80 / 64)}
    fill="none"
    className={className}
    style={style}
  >
    {/* Crest / plume */}
    <path
      d="M32 0 L27 16 Q32 13 37 16 Z"
      fill="#F59E0B"
    />
    {/* Helmet dome */}
    <path
      d="M12 36 Q12 14 32 12 Q52 14 52 36 L52 48 Q52 62 44 68 L42 70 Q38 74 32 76 Q26 74 22 70 L20 68 Q12 62 12 48 Z"
      fill="#F59E0B"
    />
    {/* T-visor cutout — horizontal eye slit */}
    <rect x="18" y="36" width="28" height="5" rx="1" fill="#0f172a" />
    {/* T-visor cutout — vertical nose guard */}
    <path
      d="M29 36 L29 58 Q29 60 32 62 Q35 60 35 58 L35 36 Z"
      fill="#0f172a"
    />
    {/* Left cheek guard detail */}
    <path
      d="M14 44 Q13 54 20 64"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Right cheek guard detail */}
    <path
      d="M50 44 Q51 54 44 64"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Brow line detail */}
    <path
      d="M16 33 Q32 28 48 33"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export default GladiatorLogo;
