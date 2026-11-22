import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { IdleKeys } from './idle.js';
import type { MemberKeys } from './member-keys.js';
import type { ScopedApiKeys } from './scoped-keys.js';
import type { SystemApiKeys } from './system-keys.js';

export { apiKeyScopesToken } from './scopes.js';

/** Keys with scopes for any user: what an application builds key pages and service-account keys on. */
export const scopedApiKeysToken: ServiceToken<ScopedApiKeys> =
  createServiceToken<ScopedApiKeys>(
    '@nocobase/app-plugin-api-keys/scoped-keys',
  );

/**
 * System keys: keys with an identity of their own. Another plugin creates and adjusts managed keys for a person with
 * `createManaged`, `setPermissionsManaged` and `rotateManaged`, hears of their revocation through `managers.add`, and
 * an application moving its own organization keys here lists them with `adopt`.
 */
export const systemApiKeysToken: ServiceToken<SystemApiKeys> =
  createServiceToken<SystemApiKeys>(
    '@nocobase/app-plugin-api-keys/system-keys',
  );

/** Reminding about and disabling keys nobody uses, as the rules say; the plugin runs it once a day. */
export const idleApiKeysToken: ServiceToken<IdleKeys> =
  createServiceToken<IdleKeys>('@nocobase/app-plugin-api-keys/idle-keys');

/** Members' personal keys, for System settings › API keys. */
export const memberApiKeysToken: ServiceToken<MemberKeys> =
  createServiceToken<MemberKeys>('@nocobase/app-plugin-api-keys/member-keys');
