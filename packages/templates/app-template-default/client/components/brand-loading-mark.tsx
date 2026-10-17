import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import { cn } from 'cn';

import { BRAND_MARK_PATH, BRAND_MARK_TRANSLATE } from './brand-mark-geometry';

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
        transform='translate(15 17.176475219726562) scale(.34)'
        fill='currentColor'
      >
        <g transform={BRAND_MARK_TRANSLATE}>
          <path d={BRAND_MARK_PATH} />
        </g>
      </g>
    </svg>
  );
}
