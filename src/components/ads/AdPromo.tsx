import { motion } from 'motion/react';
import { Megaphone, Zap } from 'lucide-react';

export type AdSize = 'banner' | 'leaderboard' | 'rectangle' | 'vertical' | 'skyscraper' | 'mobile-banner';

interface AdPromoProps {
  /** Unique identifier for this ad slot */
  id?: string;
  /** Size variant */
  size?: AdSize;
  /** Optional label text */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Optional dark variant for dark backgrounds */
  variant?: 'light' | 'dark';
  /** Whether to show animated pulse effect */
  animated?: boolean;
}

const SIZE_MAP: Record<AdSize, { width: string; height: string; aspect: string }> = {
  banner:       { width: 'w-full',   height: 'h-[90px]',  aspect: 'aspect-[728/90]' },
  leaderboard:  { width: 'w-full',   height: 'h-[120px]', aspect: 'aspect-[970/120]' },
  rectangle:    { width: 'w-full',   height: 'h-[250px]', aspect: 'aspect-[300/250]' },
  vertical:     { width: 'w-full',   height: 'h-[400px]', aspect: 'aspect-[160/400]' },
  skyscraper:   { width: 'w-full',   height: 'h-[600px]', aspect: 'aspect-[120/600]' },
  'mobile-banner': { width: 'w-full', height: 'h-[50px]', aspect: 'aspect-[320/50]' },
};

const SIZE_LABELS: Record<AdSize, string> = {
  banner:        '728×90 Banner',
  leaderboard:   '970×120 Leaderboard',
  rectangle:     '300×250 Rectangle',
  vertical:      '160×400 Vertical',
  skyscraper:    '120×600 Skyscraper',
  'mobile-banner': '320×50 Mobile Banner',
};

/**
 * AdPromo — A placeholder ad component for Sportivo.
 *
 * This component renders a styled placeholder for future ad integration.
 * When you're ready to connect real ads:
 * 1. Update the `renderAd` prop or replace the inner content
 * 2. Configure ad networks (AdSense, Carbon, etc.) through the admin panel
 * 3. Pass real ad data via the `adData` prop
 *
 * @example
 * // Banner ad between content sections
 * <AdPromo size="banner" id="home-banner-1" />
 *
 * // Sidebar rectangle
 * <AdPromo size="rectangle" id="sidebar-rect-1" variant="dark" />
 */
export default function AdPromo({
  id,
  size = 'banner',
  label,
  className = '',
  variant = 'light',
  animated = true,
}: AdPromoProps) {
  const sizes = SIZE_MAP[size];
  const sizeLabel = SIZE_LABELS[size];

  const isLight = variant === 'light';

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative ${sizes.width} ${className}`}
    >
      {/* Ad container */}
      <div
        className={`
          relative overflow-hidden
          flex items-center justify-center
          ${sizes.height} ${sizes.aspect} w-full
          border-2 border-dashed
          transition-all duration-300
          ${isLight
            ? 'bg-gray-50/80 border-gray-200 hover:border-accent/40 hover:bg-gray-100/80'
            : 'bg-gray-800/30 border-gray-700/50 hover:border-accent/40 hover:bg-gray-800/50'
          }
        `}
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden opacity-[0.03]">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full bg-current transform rotate-12" />
          <div className="absolute -bottom-1/2 -left-1/2 w-3/4 h-3/4 rounded-full bg-current" />
        </div>

        {/* Shimmer line animation */}
        {animated && (
          <div
            className={`
              absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
              -translate-x-full group-hover:translate-x-full
              transition-transform duration-1000 ease-in-out
            `}
          />
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-2 px-4 py-3">
          {/* Ad icon + label */}
          <div className="flex items-center gap-2">
            <Megaphone
              className={`w-4 h-4 ${isLight ? 'text-gray-300' : 'text-gray-600'}`}
            />
            <span
              className={`
                text-[9px] font-black uppercase tracking-[0.25em]
                ${isLight ? 'text-gray-300' : 'text-gray-600'}
              `}
            >
              {label || 'Advertisement'}
            </span>
            <Zap
              className={`w-3 h-3 ${isLight ? 'text-gray-200' : 'text-gray-600'}`}
            />
          </div>

          {/* Size label */}
          <span
            className={`
              text-[10px] font-mono font-medium
              ${isLight ? 'text-gray-300' : 'text-gray-500'}
              group-hover:opacity-100 transition-opacity
              ${size !== 'mobile-banner' ? '' : 'hidden'}
            `}
          >
            {sizeLabel}
          </span>

          {/* "Ad Promo" badge */}
          <span
            className={`
              inline-flex items-center gap-1 px-2 py-0.5
              text-[8px] font-bold uppercase tracking-wider
              rounded-sm transition-colors
              ${isLight
                ? 'bg-gray-200/60 text-gray-400 group-hover:bg-accent/10 group-hover:text-accent'
                : 'bg-gray-700/40 text-gray-500 group-hover:bg-accent/20 group-hover:text-accent-light'
              }
            `}
          >
            <Zap className="w-2.5 h-2.5" />
            Ad Promo
          </span>

          {/* Future ad integration note */}
          <span
            className={`
              text-[7px] font-medium tracking-wider
              ${isLight ? 'text-gray-200' : 'text-gray-600'}
              ${size === 'mobile-banner' ? 'hidden' : ''}
            `}
          >
            Connect real ads in admin panel
          </span>
        </div>
      </div>
    </motion.div>
  );
}
