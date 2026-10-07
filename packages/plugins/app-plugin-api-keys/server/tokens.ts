import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { ScopedApiKeys } from './scoped-keys.js';

export { apiKeyScopesToken } from './scopes.js';

/** Keys with scopes for any user: what an application builds key pages and service-account keys on. */
export const scopedApiKeysToken: ServiceToken<ScopedApiKeys> =
  createServiceToken<ScopedApiKeys>(
    '@nocobase/app-plugin-api-keys/scoped-keys',
  );
