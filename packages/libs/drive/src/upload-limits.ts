import type { AppDriveConfig, DriveUploadLimit } from './types.js';

/** Checks even unused disks without constructing a driver or reaching storage. */
export function driveUploadLimits(
  config: AppDriveConfig,
): Readonly<Record<string, DriveUploadLimit>> {
  return Object.fromEntries(
    Object.entries(config.disks).map(([disk, definition]) => {
      const value: unknown = definition?.maxFileSizeMb;
      const mb = value === undefined ? 20 : value;
      if (
        typeof mb !== 'number' ||
        !Number.isSafeInteger(mb) ||
        mb <= 0 ||
        !Number.isSafeInteger(mb * 1024 * 1024 + 65536)
      )
        throw new Error(
          `drive.disks.${disk}.maxFileSizeMb must be a positive integer in MiB within the safe byte range.`,
        );
      return [
        disk,
        Object.freeze({ disk, maxFileSizeMb: mb, maxBytes: mb * 1024 * 1024 }),
      ];
    }),
  );
}
