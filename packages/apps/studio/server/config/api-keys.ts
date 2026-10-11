import type { ApiKeysConfig } from '@nocobase/app-plugin-api-keys/server';
import {
  defineAppConfig,
  envInteger,
  type AppConfigFactory,
} from '@nocobase/app-server/config';

/**
 * API keys (`@nocobase/app-plugin-api-keys`). `maxScopedKeyDays` caps how long a key with a scope lives, an
 * organization's included; unset (the default), "never expires" stays available. Keys without a scope are not capped.
 */
const apiKeys: AppConfigFactory<ApiKeysConfig> = defineAppConfig({
  defaults: { maxScopedKeyDays: null },
  env: {
    API_KEYS_MAX_SCOPED_KEY_DAYS: envInteger('maxScopedKeyDays', {
      description:
        'The most days an API key with a scope may live; unset, such a key may never expire.',
      required: false,
    }),
  },
});

export default apiKeys;
