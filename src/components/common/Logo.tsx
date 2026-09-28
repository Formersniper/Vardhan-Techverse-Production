'use client';

import React from 'react';
import { useActiveLogo } from '@/hooks/useActiveLogo';
import { MASTER_DEFAULT_LOGO_URL } from '@/lib/brand';

export interface LogoProps {
  className?: string;
  variant?: 'full' | 'mark-only';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  customSrc?: string;
}

/**
 * Authoritative Corporate Logo Component for Vardhan Techverse Private Limited.
 *
 * Resolves the active corporate logo (custom uploaded logo or master default JPG).
 * Preserves aspect ratio using object-contain.
 * Fallback to /brand/vardhan-techverse-logo.jpg if any network/storage issue occurs.
 */
export const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'full',
  size = 'md',
  customSrc,
}) => {
  const resolvedLogoUrl = useActiveLogo();
  const activeSrc = customSrc || resolvedLogoUrl || MASTER_DEFAULT_LOGO_URL;

  const heightMap = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-12',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24',
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (e.currentTarget.src !== MASTER_DEFAULT_LOGO_URL) {
      e.currentTarget.src = MASTER_DEFAULT_LOGO_URL;
    }
  };

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={activeSrc}
        alt="Vardhan Techverse Private Limited"
        className={`${heightMap[size]} w-auto object-contain ${
          variant === 'mark-only' ? 'rounded-md' : ''
        }`}
        loading="eager"
        onError={handleImageError}
      />
    </div>
  );
};
