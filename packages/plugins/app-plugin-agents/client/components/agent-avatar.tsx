/**
 * An agent's avatar, generated rather than uploaded: the first letter of its name on a tint picked from its name, so
 * the same agent looks the same on every page, and a bot icon when there is no name (an agent since deleted). A
 * rounded square, where people are round.
 */
import { BotIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { cn } from 'cn';

/**
 * Light tints with a darker text of the same hue, and their dark-theme counterparts, the family of the tags. Written as
 * arbitrary values, since a plugin cannot add theme tokens; every class is spelled in full for the Tailwind build.
 */
const TINTS: readonly string[] = [
  'bg-[oklch(0.93_0.05_250)] text-[oklch(0.45_0.15_250)] dark:bg-[oklch(0.65_0.13_250/0.25)] dark:text-[oklch(0.85_0.08_250)]',
  'bg-[oklch(0.93_0.05_295)] text-[oklch(0.45_0.17_295)] dark:bg-[oklch(0.65_0.14_295/0.25)] dark:text-[oklch(0.85_0.08_295)]',
  'bg-[oklch(0.93_0.05_155)] text-[oklch(0.42_0.11_155)] dark:bg-[oklch(0.65_0.12_155/0.25)] dark:text-[oklch(0.85_0.09_155)]',
  'bg-[oklch(0.94_0.06_80)] text-[oklch(0.47_0.11_65)] dark:bg-[oklch(0.75_0.13_75/0.25)] dark:text-[oklch(0.87_0.1_80)]',
  'bg-[oklch(0.93_0.04_200)] text-[oklch(0.43_0.08_210)] dark:bg-[oklch(0.65_0.09_205/0.25)] dark:text-[oklch(0.85_0.07_200)]',
  'bg-[oklch(0.93_0.04_350)] text-[oklch(0.47_0.16_355)] dark:bg-[oklch(0.65_0.15_355/0.25)] dark:text-[oklch(0.85_0.08_355)]',
  'bg-[oklch(0.94_0.05_45)] text-[oklch(0.5_0.14_40)] dark:bg-[oklch(0.7_0.14_45/0.25)] dark:text-[oklch(0.86_0.09_50)]',
  'bg-[oklch(0.93_0.03_270)] text-[oklch(0.43_0.1_270)] dark:bg-[oklch(0.62_0.08_270/0.25)] dark:text-[oklch(0.84_0.06_270)]',
];

const SIZES = {
  xs: 'size-4 rounded-[0.3rem] text-[0.5625rem] [&_svg]:size-2.5',
  sm: 'size-6 rounded-md text-xs [&_svg]:size-3.5',
  default: 'size-8 rounded-md text-sm [&_svg]:size-4',
  lg: 'size-10 rounded-lg text-base [&_svg]:size-5',
} as const;

export type AgentAvatarSize = keyof typeof SIZES;

/** The index into the tints for `seed`: a 32-bit FNV-1a hash, so it is the same in every browser. */
function agentTint(seed: string): number {
  let hash = 0x811c9dc5;
  for (const char of seed) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % TINTS.length;
}

/** The first letter of the name, upper-cased; empty when there is none. */
function agentInitial(name: string | null | undefined): string {
  const first = Array.from(name?.trim() ?? '')[0] ?? '';
  return first.toLocaleUpperCase();
}

export function AgentAvatar({
  name,
  size = 'default',
  className,
}: {
  /** The agent's name, which picks the tint and the letter; null for an agent that is gone. */
  readonly name: string | null | undefined;
  readonly size?: AgentAvatarSize;
  readonly className?: string;
}): ReactElement {
  const initial = agentInitial(name);
  const tint = initial ? agentTint(name?.trim() ?? '') : undefined;
  return (
    <span
      aria-hidden='true'
      data-slot='agent-avatar'
      data-tint={tint}
      className={cn(
        'inline-flex shrink-0 items-center justify-center leading-none font-semibold select-none',
        SIZES[size],
        tint === undefined ? 'bg-muted text-muted-foreground' : TINTS[tint],
        className,
      )}
    >
      {initial || <BotIcon />}
    </span>
  );
}
