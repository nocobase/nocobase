import { cn } from 'cn';
import type { ReactElement } from 'react';

import type { SessionLink } from '../../shared/api.js';
import { byIcon, ICON_FILL, linkIcon } from '../lib/tones.js';

/**
 * One segment per linked record, coloured by its status as its application draws it: done, closed, in review,
 * started, blocked, not started.
 */
export function LinkBar({
  links,
  className,
}: {
  readonly links: readonly SessionLink[];
  readonly className?: string;
}): ReactElement {
  return (
    <span
      className={cn(
        'bg-muted inline-flex h-2 w-[54px] shrink-0 gap-[1.5px] overflow-hidden rounded-full',
        className,
      )}
      aria-hidden
    >
      {byIcon(links).map((link) => (
        <span
          key={`${link.kind}:${link.refId}`}
          className={cn('flex-1', ICON_FILL[linkIcon(link)])}
        />
      ))}
    </span>
  );
}
