import React from "react";

interface GladiatorLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Gladiator Pro inline SVG logo — a stylised gladiator helmet inside a shield.
 * Renders crisply at any size because it's pure vector, no external file needed.
 */
export const GladiatorLogo: React.FC<GladiatorLogoProps> = ({
  size = 30,
  className,
  style,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    width={size}
    height={size}
    fill="none"
    className={className}
    style={style}
  >
    {/* Shield body */}
    <path
      d="M32 4C16 4 8 14 8 26v10c0 14 10 22 24 26 14-4 24-12 24-26V26C56 14 48 4 32 4Z"
      fill="#F59E0B"
    />
    {/* Shield inner cutout */}
    <path
      d="M32 9C19 9 13 17 13 27v8c0 12 8 19 19 22 11-3 19-10 19-22v-8C51 17 45 9 32 9Z"
      fill="currentColor"
      opacity="0.95"
    />
    {/* Helmet dome */}
    <path
      d="M20 30c0-10 5-16 12-16s12 6 12 16v2H20Z"
      fill="#F59E0B"
    />
    {/* Eye slits */}
    <rect x="22" y="28" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.95" />
    <rect x="34" y="28" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.95" />
    {/* Nose guard */}
    <path d="M30 28h4l-1 8h-2Z" fill="#F59E0B" />
    {/* Crest */}
    <path d="M28 14l4-8 4 8Z" fill="#F59E0B" />
    <path d="M26 16l-2-6 4 4Z" fill="#F59E0B" />
    <path d="M38 16l2-6-4 4Z" fill="#F59E0B" />
    {/* Chin guard */}
    <path d="M26 32l-2 8 8 4 8-4-2-8Z" fill="#F59E0B" />
    <path d="M28 34l-2 5 6 3 6-3-2-5Z" fill="currentColor" opacity="0.95" />
  </svg>
);

export default GladiatorLogo;
