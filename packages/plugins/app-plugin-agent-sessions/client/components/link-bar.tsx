import { cn } from 'cn';
import type { ReactElement } from 'react';

import type { SessionLink } from '../../shared/api.js';
import { TONE_CLASS, TONE_ORDER } from '../lib/tones.js';

/** One segment per linked record, colored by how it stands: finished, going on, waiting for the viewer, not started. */
export function LinkBar({
  links,
  className,
}: {
  readonly links: readonly SessionLink[];
  readonly className?: string;
}): ReactElement {
  const sorted = [...links].sort(
    (a, b) =>
      TONE_ORDER.indexOf(a.status?.tone ?? 'idle') -
      TONE_ORDER.indexOf(b.status?.tone ?? 'idle'),
  );
  return (
    <span
      className={cn(
        'bg-muted inline-flex h-2 w-[54px] shrink-0 gap-[1.5px] overflow-hidden rounded-full',
        className,
      )}
      aria-hidden
    >
      {sorted.map((link) => (
        <span
          key={`${link.kind}:${link.refId}`}
          className={cn('flex-1', TONE_CLASS[link.status?.tone ?? 'idle'])}
        />
      ))}
    </span>
  );
}
