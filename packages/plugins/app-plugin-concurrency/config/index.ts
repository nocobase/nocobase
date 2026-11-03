import {
  defineAppConfig,
  envString,
  type AppConfigFactory,
  type AppConfigDefinition,
} from '@nocobase/app-server/config';
import type { AppConcurrencyConfig } from '../shared/types.js';
import { validateConcurrencyConfig } from './resolve.js';

export { validateConcurrencyConfig } from './resolve.js';
export type {
  AppConcurrencyConfig,
  ConcurrencyConfigCommon,
  ConcurrencyConfigEntry,
  ConcurrencyAdapterConnections,
  ResolvedConcurrencyConfig,
} from '../shared/types.js';

/** Application registration and configuration are separate, explicit composition steps. */
export function defineConcurrencyConfig(
  definition: Partial<
    Omit<AppConfigDefinition<AppConcurrencyConfig>, 'public'>
  > = {},
): AppConfigFactory<AppConcurrencyConfig> {
  return defineAppConfig<AppConcurrencyConfig>({
    ...definition,
    defaults: definition.defaults ?? {
      default: 'memory',
      memory: { adapter: 'mutex' },
    },
    env: { CONCURRENCY_DEFAULT: envString('default'), ...definition.env },
    validate: [
      validateConcurrencyConfig,
      ...(typeof definition.validate === 'function'
        ? [definition.validate]
        : (definition.validate ?? [])),
    ],
    public: [],
  });
}
