import { cn } from 'cn';
import type { ReactElement } from 'react';

import type { SessionLink } from '../../shared/api.js';
import { TONE_CLASS } from '../lib/tones.js';

/** How a linked record stands, as its application names it; one waiting for the viewer stands out. */
export function StatusPill({
  status,
}: {
  readonly status: NonNullable<SessionLink['status']>;
}): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2 text-[11px] whitespace-nowrap',
        status.tone === 'attention' &&
          'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
      )}
    >
      <span
        className={cn('size-2 shrink-0 rounded-full', TONE_CLASS[status.tone])}
      />
      {status.label}
    </span>
  );
}
