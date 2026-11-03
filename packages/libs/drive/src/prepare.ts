import { mkdir } from 'node:fs/promises';

import type { AppDriveConfig } from './types.js';

export interface PrepareDriveStorageResult {
  directories: string[];
}

export async function prepareDriveStorage(
  config: AppDriveConfig,
): Promise<PrepareDriveStorageResult> {
  const directories = Array.from(
    new Set(
      Object.values(config.disks)
        .filter((disk) => typeof disk !== 'function' && disk.driver === 'fs')
        .map((disk) => disk.location),
    ),
  );

  for (const directory of directories) {
    await mkdir(directory, { recursive: true });
  }

  return { directories };
}
