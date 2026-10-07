import type { ComponentProps, ReactElement, ReactNode } from 'react';

import { cn } from 'cn';

export type Tone =
  'grey' | 'blue' | 'violet' | 'amber' | 'green' | 'slate' | 'red';

/**
 * The tag colours, the same family as the application's tags so a run state reads alike on every page. Written as
 * arbitrary values, since a plugin cannot add theme tokens; every class is spelled in full for the Tailwind build.
 */
const TONE_CLASS: Readonly<Record<Tone, string>> = {
  grey: 'bg-[oklch(0.955_0.004_264)] text-[oklch(0.46_0.015_264)] dark:bg-[oklch(0.72_0.01_264/0.14)] dark:text-[oklch(0.8_0.01_264)]',
  blue: 'bg-[oklch(0.95_0.035_245)] text-[oklch(0.5_0.15_250)] dark:bg-[oklch(0.65_0.13_250/0.2)] dark:text-[oklch(0.8_0.1_250)]',
  violet:
    'bg-[oklch(0.95_0.035_295)] text-[oklch(0.5_0.17_295)] dark:bg-[oklch(0.65_0.14_295/0.2)] dark:text-[oklch(0.8_0.11_295)]',
  amber:
    'bg-[oklch(0.96_0.05_85)] text-[oklch(0.52_0.12_65)] dark:bg-[oklch(0.75_0.13_75/0.18)] dark:text-[oklch(0.84_0.12_80)]',
  green:
    'bg-[oklch(0.955_0.04_155)] text-[oklch(0.5_0.12_155)] dark:bg-[oklch(0.65_0.12_155/0.2)] dark:text-[oklch(0.8_0.12_155)]',
  slate:
    'bg-[oklch(0.935_0.008_264)] text-[oklch(0.42_0.02_264)] dark:bg-[oklch(0.6_0.02_264/0.2)] dark:text-[oklch(0.72_0.015_264)]',
  red: 'bg-[oklch(0.955_0.03_25)] text-[oklch(0.52_0.18_27)] dark:bg-[oklch(0.62_0.18_25/0.2)] dark:text-[oklch(0.78_0.13_25)]',
};

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
