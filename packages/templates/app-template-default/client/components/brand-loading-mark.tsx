import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import { cn } from 'cn';

/** Keep the brand recognizable; the orbit, rather than the bricks, conveys progress. */
export function BrandLoadingMark({
  className,
  ...props
}: ComponentPropsWithoutRef<'svg'>): ReactElement {
  return (
    <svg
      aria-hidden='true'
      focusable='false'
      viewBox='0 0 64 64'
      className={cn('size-12 shrink-0 text-primary', className)}
      fill='none'
      {...props}
    >
      <circle
        cx='32'
        cy='32'
        r='28'
        stroke='currentColor'
        strokeWidth='2'
        opacity='.12'
      />
      <g className='nocobase-loading-orbit'>
        <path
          d='M32 4a28 28 0 0 1 28 28'
          stroke='currentColor'
          strokeWidth='3'
          strokeLinecap='round'
        />
      </g>
      <g
        transform='translate(11 9) scale(.66)'
        stroke='currentColor'
        strokeLinejoin='round'
        strokeWidth='1.8'
      >
        <path
          d='M7 31 27 19 57 37V50L47 56 37 50 27 56 7 44Z'
          fill='currentColor'
        />
        <path d='M17 25 37 13 47 19 27 31Z' className='fill-background' />
        <path d='M17 25 27 31V44L17 38Z' className='fill-background' />
        <path d='M27 31 47 19V32L27 44Z' className='fill-background' />
      </g>
    </svg>
  );
}
