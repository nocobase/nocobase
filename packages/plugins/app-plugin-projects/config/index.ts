import {
  defineAppConfig,
  type AppConfigFactory,
  type AppConfigDefinition,
} from '@nocobase/app-server/config';
export interface ProjectsConfig {
  readonly inboxChannel?: string;
  readonly attachments?: { readonly maxFileSizeMb?: number };
}

/** Resolve the deployment limit in MiB; invalid values must never fall back. */
export function attachmentMaxFileSizeMb(value: unknown = 20): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value <= 0 ||
    !Number.isSafeInteger(value * 1024 * 1024 + 65536)
  )
    throw new Error(
      'projects.attachments.maxFileSizeMb must be a positive integer in MiB within the safe byte range.',
    );
  return value;
}

export function defineProjectsConfig(
  definition: Partial<AppConfigDefinition<ProjectsConfig>> = {},
): AppConfigFactory<ProjectsConfig> {
  return defineAppConfig<ProjectsConfig>({
    ...definition,
    defaults: definition.defaults ?? { attachments: { maxFileSizeMb: 20 } },
    public: [...(definition.public ?? []), 'attachments.maxFileSizeMb'],
    validate: [
      (value, context) => {
        try {
          attachmentMaxFileSizeMb(value.attachments?.maxFileSizeMb);
        } catch {
          context.error(
            'attachments.maxFileSizeMb',
            'Must be a positive integer in MiB within the safe byte range.',
          );
        }
      },
      ...(typeof definition.validate === 'function'
        ? [definition.validate]
        : (definition.validate ?? [])),
    ],
  });
}
