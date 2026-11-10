import type { AppDriveConfig, DriveUploadLimit } from './types.js';

/** Reads a single disk's limit for configuration validation; omission means 20 MiB. */
export function readMaxFileSizeMb(entry: unknown): number | undefined {
  if (!entry || (typeof entry !== 'object' && typeof entry !== 'function'))
    return undefined;
  const configured = (entry as { maxFileSizeMb?: unknown }).maxFileSizeMb;
  const value = configured === undefined ? 20 : configured;
  return typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    Number.isSafeInteger(value * 1024 * 1024 + 65536)
    ? value
    : undefined;
}

/** Publishes numeric limits from an application configuration already validated at startup. */
export function driveUploadLimits(
  config: AppDriveConfig,
): Readonly<Record<string, DriveUploadLimit>> {
  return Object.fromEntries(
    Object.entries(config.disks).map(([disk, definition]) => {
      const maxFileSizeMb = definition.maxFileSizeMb ?? 20;
      return [
        disk,
        Object.freeze({
          disk,
          maxFileSizeMb,
          maxBytes: maxFileSizeMb * 1024 * 1024,
        }),
      ];
    }),
  );
}
