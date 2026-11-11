import { readMaxFileSizeMb, type AppDriveConfig } from '@nocobase/drive';
import type { AppConfig, ConfigValidator } from '../config/index.js';
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

/** Register Drive's built-in rules before application configuration is validated. */
export function registerDriveConfig(config: AppConfig): void {
  config.defineSections(
    new Map([['drive', { validators: [validateDriveConfig], public: [] }]]),
  );
}
