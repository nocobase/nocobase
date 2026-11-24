import { readMaxFileSizeMb, type AppDriveConfig } from '@nocobase/drive';
import type {
  AppConfig,
  AppConfigAccessor,
  ConfigValidator,
} from '../config/index.js';
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

/** The Drive presented to the application and its maintenance commands. */
export function resolveAppDriveConfig(
  config: AppConfigAccessor,
): AppDriveConfig | undefined {
  const drive = config.get<AppDriveConfig>('drive');
  if (!drive) return undefined;
  const s3 = drive.disks.s3;
  if (typeof s3 === 'function' || s3?.driver !== 's3' || s3.bucket)
    return drive;
  const { s3: _s3, ...disks } = drive.disks;
  return { ...drive, disks };
}
