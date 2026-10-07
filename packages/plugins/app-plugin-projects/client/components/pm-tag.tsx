import type { ComponentProps, ReactElement, ReactNode } from 'react';

import { PM_TONE_CLASS, type PmTone } from './pm-tones.js';
import { cn } from 'cn';

export type { PmTone } from './pm-tones.js';

/**
 * The one tag of this plugin: a rounded pill in a light tint
 * of its hue with darker text of the same hue, 12px, tight enough that the pill hugs the glyph height instead of
 * the padding; a status adds a small leading dot. Status, priority, PR and run states, decision types and role tags
 * all use it, so they read as one family in both themes.
 */
export function PmTag({
  tone,
  dot = false,
  icon,
  children,
  className,
  ...props
}: Omit<ComponentProps<'span'>, 'children'> & {
  readonly tone: PmTone;
  /** A leading dot in the hue's saturated shade (status tags). */
  readonly dot?: boolean;
  /** A leading icon instead of the dot. */
  readonly icon?: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <span
      data-slot='pm-tag'
      data-tone={tone}
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0 text-xs leading-4 font-medium whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0',
        PM_TONE_CLASS[tone],
        className,
      )}
      {...props}
    >
      {icon ??
        (dot ? (
          <span
            aria-hidden='true'
            className='size-1.5 shrink-0 rounded-full bg-current'
          />
        ) : null)}
      {children}
    </span>
  );
}
