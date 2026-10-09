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

/** How much of the disk holding the working directories to keep free: a number of bytes, or a share of the disk. */
export type FreeSpace =
  { readonly bytes: number } | { readonly percent: number };

/** Kept free unless the owner says otherwise (`config set min-free-disk`). */
export const DEFAULT_MIN_FREE_DISK: FreeSpace = { percent: 10 };

/** `20G`, `512M` or `10%`; `off` or `none` for no threshold (null). */
export function parseFreeSpace(text: string, what: string): FreeSpace | null {
  const value = text.trim();
  const percent = /^(\d+(?:\.\d+)?)\s*%$/u.exec(value);
  if (percent !== null) {
    const share = Number(percent[1]);
    if (!(share > 0 && share < 100))
      throw new UsageError(
        `${what} must be a share of the disk between 0% and 100%, such as 10%; got ${text}.`,
      );
    return { percent: share };
  }
  if (value.includes('%'))
    throw new UsageError(
      `${what} must be a size such as 20G, a share of the disk such as 10%, or off; got ${text}.`,
    );
  try {
    const bytes = parseSize(value, what);
    return bytes === undefined ? null : { bytes };
  } catch {
    throw new UsageError(
      `${what} must be a size such as 20G, a share of the disk such as 10%, or off; got ${text || 'nothing'}.`,
    );
  }
}

/** The bytes `threshold` keeps free on a disk of `totalBytes`. */
export function minFreeBytes(threshold: FreeSpace, totalBytes: number): number {
  return 'bytes' in threshold
    ? threshold.bytes
    : Math.ceil((totalBytes * threshold.percent) / 100);
}

/** `20 GB`, `10%`. */
export function formatFreeSpace(threshold: FreeSpace): string {
  return 'bytes' in threshold
    ? formatSize(threshold.bytes)
    : `${threshold.percent}%`;
}
