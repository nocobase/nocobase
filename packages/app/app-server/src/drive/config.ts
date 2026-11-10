import { readMaxFileSizeMb, type AppDriveConfig } from '@nocobase/drive';
import {
  defineAppConfig,
  type AppConfigDefinition,
  type AppConfigFactory,
  type ConfigValidator,
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
        'Must be a positive integer in MiB within the safe byte range.',
      );
  }
};

export function defineDriveConfig(
  definition: AppConfigDefinition<AppDriveConfig>,
): AppConfigFactory<AppDriveConfig> {
  const extra =
    definition.validate === undefined
      ? []
      : Array.isArray(definition.validate)
        ? (definition.validate as readonly ConfigValidator<AppDriveConfig>[])
        : [definition.validate as ConfigValidator<AppDriveConfig>];
  return defineAppConfig({
    ...definition,
    validate: [validateDriveConfig, ...extra],
  });
}
