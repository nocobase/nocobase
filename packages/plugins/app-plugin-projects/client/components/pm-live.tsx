import type { ReactElement } from 'react';

import { cn } from 'cn';

/**
 * A progress ring: the done share as a primary arc on a muted track, the percentage
 * inside when there is room. Decorative when a label beside it says the same.
 */
export function PmProgressRing({
  percent,
  size = 40,
  label,
  showValue = true,
  className,
}: {
  readonly percent: number;
  /** Pixel size; a fixed size on purpose, like an icon. */
  readonly size?: number;
  readonly label?: string;
  readonly showValue?: boolean;
  readonly className?: string;
}): ReactElement {
  const value = Math.min(100, Math.max(0, Math.round(percent)));
  const stroke = size >= 32 ? 3.5 : 2.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center',
        className,
      )}
      style={{ width: size, height: size }}
      {...(label
        ? {
            role: 'img',
            'aria-label': label,
          }
        : { 'aria-hidden': true })}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          strokeWidth={stroke}
          className='stroke-muted'
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          strokeWidth={stroke}
          strokeLinecap='round'
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={cn(
            'transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none',
            value >= 100 ? 'stroke-success' : 'stroke-primary',
          )}
        />
      </svg>
      {showValue && size >= 32 ? (
        // The number alone: "100%" does not fit a 48px ring at 12px; the label says it is a percentage.
        <span className='absolute text-xs font-medium tracking-tight tabular-nums'>
          {value}
        </span>
      ) : null}
    </span>
  );
}
