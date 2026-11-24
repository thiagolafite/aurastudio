"use client";

import React, { useId } from "react";

interface AuraLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export function AuraLogo({ size = "md", className = "" }: AuraLogoProps) {
  const uid = useId().replace(/:/g, "");
  const bgId = `aura-social-bg-${uid}`;
  const auraRingId = `aura-social-ring-${uid}`;
  const frameId = `aura-social-frame-${uid}`;
  const playId = `aura-social-play-${uid}`;
  const glowId = `aura-social-glow-${uid}`;

  return (
    <div
      data-preserve-theme="true"
      className={`relative inline-flex shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-pink-500/20 ${SIZE_MAP[size]} ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        aria-label="AuraStudio Logo"
      >
        <defs>
          {/* Deep dark studio canvas */}
          <linearGradient id={bgId} x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="52%" stopColor="#1E1038" />
            <stop offset="100%" stopColor="#09090B" />
          </linearGradient>

          {/* Multi-platform Social Aura gradient (TikTok Cyan -> FB Blue -> IG Pink -> Amber) */}
          <linearGradient id={auraRingId} x1="6" y1="58" x2="58" y2="6" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="32%" stopColor="#3B82F6" />
            <stop offset="68%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Soft ambient aura glow */}
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0.35" />
            <stop offset="55%" stopColor="#6366F1" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#09090B" stopOpacity="0" />
          </radialGradient>

          {/* Inner social feed / stories frame */}
          <linearGradient id={frameId} x1="14" y1="14" x2="50" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#FB7185" />
          </linearGradient>

          {/* Crisp play / reels icon */}
          <linearGradient id={playId} x1="26" y1="22" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E0E7FF" />
          </linearGradient>
        </defs>

        {/* Outer squircle */}
        <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${bgId})`} />
        <rect
          x="2.75"
          y="2.75"
          width="58.5"
          height="58.5"
          rx="15.25"
          stroke={`url(#${auraRingId})`}
          strokeOpacity="0.65"
          strokeWidth="1.6"
        />

        {/* Ambient radial glow */}
        <circle cx="32" cy="32" r="24" fill={`url(#${glowId})`} />

        {/* Stories / Social Post rounded frame */}
        <rect
          x="13"
          y="13"
          width="38"
          height="38"
          rx="12"
          fill="#09090B"
          fillOpacity="0.55"
          stroke={`url(#${frameId})`}
          strokeWidth="2.8"
        />

        {/* Top-left subtle Stories progress pill */}
        <rect x="20" y="18.5" width="10" height="2.2" rx="1.1" fill="#22D3EE" fillOpacity="0.9" />
        <rect x="32" y="18.5" width="6" height="2.2" rx="1.1" fill="#FFFFFF" fillOpacity="0.35" />

        {/* Center Reels / TikTok Play symbol */}
        <path
          d="M 27 25.5 C 27 24.1 28.5 23.2 29.7 23.9 L 40.3 30.4 C 41.5 31.1 41.5 32.9 40.3 33.6 L 29.7 40.1 C 28.5 40.8 27 39.9 27 38.5 Z"
          fill={`url(#${playId})`}
        />

        {/* Top-right AI Sparkle (Creative Studio / IA) */}
        <path
          d="M 48.5 9.5 L 50 13.5 L 54 15 L 50 16.5 L 48.5 20.5 L 47 16.5 L 43 15 L 47 13.5 Z"
          fill="#FDE047"
        />

        {/* Bottom-right Social Like / Heart Notification Badge */}
        <circle cx="48.5" cy="48.5" r="7.5" fill="#EC4899" stroke="#0F172A" strokeWidth="2.2" />
        <path
          d="M 48.5 52.2 C 48.5 52.2 44.6 49.7 44.6 47.2 C 44.6 46 45.5 45.2 46.6 45.2 C 47.4 45.2 48.1 45.7 48.5 46.3 C 48.9 45.7 49.6 45.2 50.4 45.2 C 51.5 45.2 52.4 46 52.4 47.2 C 52.4 49.7 48.5 52.2 48.5 52.2 Z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
}
