'use client';

import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

// NFL: Field Goal Post
export const GoalPostIcon = ({ size = 20, className = "" }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 10h16" /> {/* Crossbar */}
    <path d="M4 10V2" />  {/* Left Upright */}
    <path d="M20 10V2" /> {/* Right Upright */}
    <path d="M12 22V10" /> {/* Support Post */}
  </svg>
);

// NCAAM: Basketball (Clean Lines)
export const BasketballIcon = ({ size = 20, className = "" }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 22V2" />
    <path d="M2 12h20" />
    <path d="M22 2c-5 8-15 8-20 0" opacity="0.5" /> {/* Optional Texture Line */}
    <path d="M22 22c-5-8-15-8-20 0" opacity="0.5" /> {/* Optional Texture Line */}
  </svg>
);

// World Cup: Soccer Ball (Classic Hex)
export const SoccerIcon = ({ size = 20, className = "" }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 17l-5-3 2-6h6l2 6z" />
    <path d="M12 17v5" />
    <path d="M7 14l-4 2" />
    <path d="M17 14l4 2" />
    <path d="M9 8l-3-5" />
    <path d="M15 8l3-5" />
  </svg>
);

// Masters: Golf Flag Pin
export const GolfFlagIcon = ({ size = 20, className = "" }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22V2" />      {/* Pole */}
    <path d="M12 2l7 5-7 5" /> {/* Flag */}
    <path d="M8 22h8" />       {/* Ground/Hole */}
  </svg>
);