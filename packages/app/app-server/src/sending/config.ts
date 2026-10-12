import {
  defineAppConfig,
  type AppConfigFactory,
  type AppConfigDefinition,
} from '../config/index.js';
import type { SendingConfig } from '@nocobase/sending';
export function defineSendingConfig(
  definition: AppConfigDefinition<SendingConfig>,
): AppConfigFactory<SendingConfig> {
  return defineAppConfig<SendingConfig>(definition);
}
/** External legacy channels remain readable; in-app belongs exclusively to notification. */
export function resolveSendingConfig(
  current: SendingConfig | undefined,
  legacy: SendingConfig | undefined,
): SendingConfig {
  return {
    channels: {
      ...Object.fromEntries(
        Object.entries(legacy?.channels ?? {}).filter(
          ([, config]) => config.provider !== 'in-app',
        ),
      ),
      ...current?.channels,
    },
  };
}
