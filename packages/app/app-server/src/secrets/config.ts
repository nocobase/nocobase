import {
  parseSecretKeysEnv,
  validateSecretKeys,
  type SecretKeyEntry,
} from '@nocobase/secrets';
import type {
  EnvironmentMapping,
  EnvironmentMetadata,
} from '@nocobase/config/providers/env';

import {
  defineAppConfig,
  type AppConfigDefinition,
  type AppConfigFactory,
  type ConfigValidator,
} from '../config/define-app-config.js';
import { isPlaceholderSecret } from '../config/placeholder-secret.js';

export type { SecretKeyEntry } from '@nocobase/secrets';

/** The `secrets` section: the master keys stored secrets are encrypted with, the current one first. */
export interface SecretsConfig {
  readonly keys?: readonly SecretKeyEntry[];
}

/** `SECRETS_KEYS=2:<key>,1:<key>`, the current key first. */
export function envSecretKeys(
  path: string,
  metadata: EnvironmentMetadata = {},
): EnvironmentMapping {
  return {
    ...metadata,
    path,
    type: 'secretKeys',
    parse: (value: string) =>
      parseSecretKeysEnv(value).map((entry) => ({ ...entry })),
  };
}

const SECRETS_ENVIRONMENT: Readonly<Record<string, EnvironmentMapping>> = {
  SECRETS_KEYS: envSecretKeys('keys', {
    description:
      'The master keys stored secrets are encrypted with, as version:key pairs, the current one first.',
    secret: true,
    generate: 'secretKeys',
  }),
};

const KEY_FIX =
  'Generate a key with: openssl rand -hex 32, and put it first in secrets.keys with a version above every other.';

/** Rejects weak, placeholder and duplicate keys. A missing list is reported by `config check`, not here. */
export const validateSecretsConfig: ConfigValidator<SecretsConfig> = (
  secrets,
  context,
) => {
  for (const issue of validateSecretKeys(secrets.keys, {
    isPlaceholder: isPlaceholderSecret,
  })) {
    context.error(
      issue.index === undefined ? 'keys' : `keys.${issue.index}`,
      issue.message,
      { fix: KEY_FIX },
    );
  }
};

/** Declares the `secrets` section with its validation and the `SECRETS_KEYS` variable. */
export function defineSecretsConfig(
  definition: Partial<AppConfigDefinition<SecretsConfig>> = {},
): AppConfigFactory<SecretsConfig> {
  const extra =
    definition.validate === undefined
      ? []
      : Array.isArray(definition.validate)
        ? (definition.validate as readonly ConfigValidator<SecretsConfig>[])
        : [definition.validate as ConfigValidator<SecretsConfig>];
  return defineAppConfig<SecretsConfig>({
    defaults: definition.defaults ?? { keys: [] },
    validate: [validateSecretsConfig, ...extra],
    public: definition.public ?? [],
    env: { ...SECRETS_ENVIRONMENT, ...definition.env },
  });
}
