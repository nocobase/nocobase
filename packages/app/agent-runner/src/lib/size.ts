// Disk sizes as people write them (`40G`, `512M`, `1.5T`) and as the runner prints them. Units are binary: `1G` is
// 1024³ bytes, as `du -h` counts.
import { UsageError } from './command.ts';

const UNITS = ['B', 'K', 'M', 'G', 'T'] as const;

/** `40G`, `40GB`, `40GiB`, `512m`, `1.5T` or a plain number of bytes; `off` or `none` for no limit (undefined). */
export function parseSize(text: string, what: string): number | undefined {
  const value = text.trim();
  if (/^(off|none|0)$/iu.test(value)) return undefined;
  const match = /^(\d+(?:\.\d+)?)\s*([bkmgt])?(?:i?b)?$/iu.exec(value);
  const unit = (match?.[2] ?? 'B').toUpperCase();
  const bytes =
    match === null
      ? Number.NaN
      : Math.round(
          Number(match[1]) *
            1024 ** UNITS.indexOf(unit as (typeof UNITS)[number]),
        );
  if (!Number.isSafeInteger(bytes) || bytes <= 0)
    throw new UsageError(
      `${what} must be a size such as 40G, 512M or 1.5T, or off; got ${text || 'nothing'}.`,
    );
  return bytes;
}

/** `64.2 GB`, `512 MB`, `0 B`. */
export function formatSize(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toFixed(digits)} ${UNITS[unit] === 'B' ? 'B' : `${UNITS[unit]}B`}`;
}

/** `14d`, `12h`, `30m` as milliseconds. */
export function parseAge(text: string, what: string): number {
  const match = /^(\d+)\s*([dhm])$/iu.exec(text.trim());
  if (match === null)
    throw new UsageError(
      `${what} must be an age such as 14d, 12h or 30m; got ${text || 'nothing'}.`,
    );
  const unit = { d: 86_400_000, h: 3_600_000, m: 60_000 }[
    match[2].toLowerCase() as 'd' | 'h' | 'm'
  ];
  return Number(match[1]) * unit;
}
