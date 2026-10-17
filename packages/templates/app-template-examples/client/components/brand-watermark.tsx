import type { ReactElement } from 'react';
import { cn } from 'cn';

import {
  BRAND_MARK_PATH,
  BRAND_MARK_TRANSLATE,
  BRAND_MARK_VIEW_BOX,
} from './brand-mark-geometry';

/** Decorative brand geometry; kept outside page content and hidden from assistive technology. */
export function BrandWatermark({
  className,
}: {
  readonly className?: string;
}): ReactElement {
  return (
    <svg
      aria-hidden='true'
      focusable='false'
      viewBox={BRAND_MARK_VIEW_BOX}
      className={cn(
        'pointer-events-none absolute top-0 right-4 w-48 text-primary opacity-[0.045] sm:right-8 sm:w-64',
        className,
      )}
      fill='currentColor'
    >
      <g transform={BRAND_MARK_TRANSLATE}>
        <path d={BRAND_MARK_PATH} />
      </g>
    </svg>
  );
}
