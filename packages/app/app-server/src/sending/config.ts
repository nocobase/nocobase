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
  ownsProvider: (type: string) => boolean,
): SendingConfig {
  return {
    channels: {
      ...Object.fromEntries(
        Object.entries(legacy?.channels ?? {}).filter(([, config]) =>
          ownsProvider(config.provider),
        ),
      ),
      ...current?.channels,
    },
  };
}
