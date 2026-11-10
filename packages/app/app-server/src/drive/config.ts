import { readMaxFileSizeMb, type AppDriveConfig } from '@nocobase/drive';
import { type ConfigValidator } from '../config/index.js';
export type { AppDriveConfig, DriveUploadLimit } from '@nocobase/drive';

export const validateDriveConfig: ConfigValidator<AppDriveConfig> = (
  value,
  context,
) => {
  for (const [disk, entry] of Object.entries(value.disks ?? {})) {
    if (readMaxFileSizeMb(entry) === undefined)
      context.error(
        `disks.${disk}.maxFileSizeMb`,
        'Must be a positive integer in MiB.',
      );
  }
};
