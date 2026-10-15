import { cn } from 'cn';
import type { ReactElement } from 'react';

import type { SessionLink } from '../../shared/api.js';
import { linkIcon } from '../lib/tones.js';
import { StatusIcon } from './status-icon.js';

/**
 * How a linked record stands, as its application names it, with its status shape; one waiting for the viewer says what
 * for ("Needs your acceptance") in amber instead.
 */
export function StatusPill({
  status,
  compact = false,
}: {
  readonly status: NonNullable<SessionLink['status']>;
  /**
   * The status's own short name in every case, amber when it waits for the viewer, what it waits for on hover: for a
   * column of statuses beside titles, which a long "Needs your acceptance" would crowd out.
   */
  readonly compact?: boolean;
}): ReactElement {
  const waiting = status.icon ? status.needsYou : status.tone === 'attention';
  const text = compact ? status.label : (status.needsYou ?? status.label);
  return (
    <span
      title={status.needsYou ?? status.label}
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2 text-xs whitespace-nowrap',
        compact && 'max-w-28',
        waiting
          ? 'bg-amber-500/15 font-medium text-amber-800 dark:bg-amber-400/15 dark:text-amber-300'
          : 'text-muted-foreground',
      )}
    >
      {waiting && status.needsYou && !compact ? null : (
        <StatusIcon icon={linkIcon({ status })} />
      )}
      <span className='truncate'>{text}</span>
    </span>
  );
}
