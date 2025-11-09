import React from "react";
import Image from "next/image";

export default function VinFastLogo({ 
  className = "", 
  showText = true,
  useImage = false,
  logoPath = "/vinfast-logo.png"
}: { 
  className?: string; 
  showText?: boolean;
  useImage?: boolean;
  logoPath?: string;
}) {
  // If using actual logo image file
  if (useImage) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Image
          src={logoPath}
          alt="VinFast Logo"
          width={120}
          height={40}
          className="h-8 w-auto"
          priority
        />
      </div>
    );
  }

  // SVG version (current)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* VinFast V Emblem - Metallic silver/grey 3D V */}
      <div className="relative flex-shrink-0">
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: "rotate(180deg)" }}  // Flip the logo upright
        >
          <defs>
            {/* Metallic silver gradient */}
            <linearGradient id="metallicBase" x1="20" y1="2" x2="20" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#9ca3af" />
              <stop offset="30%" stopColor="#6b7280" />
              <stop offset="60%" stopColor="#4b5563" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>
            {/* Highlight gradient for 3D effect */}
            <linearGradient id="metallicHighlight" x1="20" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#e5e7eb" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#d1d5db" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#9ca3af" stopOpacity="0.3" />
            </linearGradient>
            {/* Shadow/depth gradient */}
            <linearGradient id="metallicShadow" x1="20" y1="20" x2="20" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6b7280" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#1f2937" stopOpacity="0.8" />
            </linearGradient>
            {/* Inner reflective layer */}
            <linearGradient id="innerReflection" x1="20" y1="6" x2="20" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f3f4f6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#9ca3af" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          
          {/* Outer V - Dark frame */}
          <path
            d="M20 2L6 38L11 38L20 18L29 38L34 38L20 2Z"
            fill="url(#metallicBase)"
          />
          
          {/* Middle V - Main body */}
          <path
            d="M20 4L9 36L13 36L20 16L27 36L31 36L20 4Z"
            fill="url(#metallicHighlight)"
          />
          
          {/* Inner V - Reflective highlight */}
          <path
            d="M20 6L12 34L15 34L20 14L25 34L28 34L20 6Z"
            fill="url(#innerReflection)"
          />
          
          {/* Bottom shadow for depth */}
          <path
            d="M20 20L27 36L24 36L20 22L16 36L13 36L20 20Z"
            fill="url(#metallicShadow)"
          />
          
          {/* Sharp edge highlight lines */}
          <path
            d="M20 2L29 38L27 38L20 14L13 38L11 38L20 2Z"
            fill="white"
            fillOpacity="0.15"
          />
        </svg>
      </div>
      {/* VinFast Text - Bold, clean sans-serif */}
      {showText && (
        <span className="text-xl font-bold tracking-[0.1em] text-gray-900">VINFAST</span>
      )}
    </div>
  );
}

