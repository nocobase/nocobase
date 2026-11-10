import {
  defineAppConfig,
  type AppConfigFactory,
  type AppConfigDefinition,
} from '@nocobase/app-server/config';
import type { AgentsConfig } from '../server/providers/agents.js';
export type { AgentsConfig };

/** Resolve the deployment limit in MiB; invalid values must never fall back. */
export function attachmentMaxFileSizeMb(value: unknown = 20): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value <= 0 ||
    !Number.isSafeInteger(value * 1024 * 1024 + 65536)
  )
    throw new Error(
      'agents.conversations.attachmentMaxFileSizeMb must be a positive integer in MiB within the safe byte range.',
    );
  return value;
}

export function defineAgentsConfig(
  definition: Partial<AppConfigDefinition<AgentsConfig>> = {},
): AppConfigFactory<AgentsConfig> {
  return defineAppConfig<AgentsConfig>({
    ...definition,
    defaults: definition.defaults ?? {
      conversations: { attachmentMaxFileSizeMb: 20 },
    },
    public: [
      ...(definition.public ?? []),
      'conversations.attachmentMaxFileSizeMb',
    ],
    validate: [
      (value, context) => {
        try {
          attachmentMaxFileSizeMb(value.conversations?.attachmentMaxFileSizeMb);
        } catch {
          context.error(
            'conversations.attachmentMaxFileSizeMb',
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
