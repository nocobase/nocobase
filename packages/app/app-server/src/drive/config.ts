import { driveUploadLimits, type AppDriveConfig } from '@nocobase/drive';
import {
  defineAppConfig,
  type AppConfigDefinition,
  type AppConfigFactory,
} from '../config/index.js';
export type { AppDriveConfig, DriveUploadLimit } from '@nocobase/drive';

export function defineDriveConfig(
  definition: AppConfigDefinition<AppDriveConfig>,
): AppConfigFactory<AppDriveConfig> {
  return defineAppConfig({
    ...definition,
    validate: [
      (value, context) => {
        for (const [disk, entry] of Object.entries(value.disks ?? {})) {
          try {
            driveUploadLimits({ default: disk, disks: { [disk]: entry } });
          } catch {
            context.error(
              `disks.${disk}.maxFileSizeMb`,
              'Must be a positive integer in MiB within the safe byte range.',
            );
          }
        }
      },
      ...(typeof definition.validate === 'function'
        ? [definition.validate]
        : (definition.validate ?? [])),
    ],
  });
}
