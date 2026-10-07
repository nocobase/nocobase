/**
 * The tag of this plugin's pages: a `Badge` pill in a light tint of its hue with darker text of the same hue; a state
 * adds a small leading dot. The hues are the application's own (the projects plugin's `PmTag`), spelled in full so the
 * application's Tailwind build finds them: a plugin cannot add theme tokens.
 */
import type { ReactElement, ReactNode } from 'react';

import { cn } from 'cn';
import { Badge } from './ui/badge.js';

export type Tone = 'grey' | 'blue' | 'amber' | 'green' | 'red' | 'violet';

const TONE_CLASS: Readonly<Record<Tone, string>> = {
  grey: 'bg-[oklch(0.955_0.004_264)] text-[oklch(0.46_0.015_264)] dark:bg-[oklch(0.72_0.01_264/0.14)] dark:text-[oklch(0.8_0.01_264)]',
  blue: 'bg-[oklch(0.95_0.035_245)] text-[oklch(0.5_0.15_250)] dark:bg-[oklch(0.65_0.13_250/0.2)] dark:text-[oklch(0.8_0.1_250)]',
  amber:
    'bg-[oklch(0.96_0.05_85)] text-[oklch(0.52_0.12_65)] dark:bg-[oklch(0.75_0.13_75/0.18)] dark:text-[oklch(0.84_0.12_80)]',
  green:
    'bg-[oklch(0.955_0.04_155)] text-[oklch(0.5_0.12_155)] dark:bg-[oklch(0.65_0.12_155/0.2)] dark:text-[oklch(0.8_0.12_155)]',
  red: 'bg-[oklch(0.955_0.03_25)] text-[oklch(0.52_0.18_27)] dark:bg-[oklch(0.62_0.18_25/0.2)] dark:text-[oklch(0.78_0.13_25)]',
  violet:
    'bg-[oklch(0.95_0.035_295)] text-[oklch(0.5_0.17_295)] dark:bg-[oklch(0.65_0.14_295/0.2)] dark:text-[oklch(0.8_0.11_295)]',
};

export function Tag({
  tone,
  dot = false,
  title,
  children,
  className,
}: {
  readonly tone: Tone;
  readonly dot?: boolean;
  readonly title?: string;
  readonly children: ReactNode;
  readonly className?: string;
}): ReactElement {
  return (
    <Badge
      variant='secondary'
      title={title}
      className={cn('h-auto leading-4', TONE_CLASS[tone], className)}
    >
      {dot ? (
        <span
          aria-hidden='true'
          className='size-1.5 shrink-0 rounded-full bg-current'
        />
      ) : null}
      {children}
    </Badge>
  );
}
