import type { ComponentProps, ReactElement, ReactNode } from 'react';

import { cn } from 'cn';

import { TONE_CLASS, type Tone } from './ag-tag-tones.js';

export type { Tone } from './ag-tag-tones.js';

/** A rounded pill in a light tint of its hue; a status adds a leading dot. */
export function AgTag({
  tone,
  dot = false,
  children,
  className,
  ...props
}: Omit<ComponentProps<'span'>, 'children'> & {
  readonly tone: Tone;
  readonly dot?: boolean;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <span
      data-tone={tone}
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0 text-xs leading-4 font-medium whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0',
        TONE_CLASS[tone],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden='true'
          className='size-1.5 shrink-0 rounded-full bg-current'
        />
      ) : null}
      {children}
    </span>
  );
}
