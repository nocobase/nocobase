import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { OrgApiKeyService } from './api-keys.js';
import type { StudioAccess } from './service.js';

/** Studio's roles, bound by `StudioAccessProvider`. */
export const studioAccessToken: ServiceToken<StudioAccess> =
  createServiceToken<StudioAccess>('studio/access');

/** An organization's API keys (`api-keys.ts`), bound by `StudioAccessProvider`. */
export const studioApiKeysToken: ServiceToken<OrgApiKeyService> =
  createServiceToken<OrgApiKeyService>('studio/api-keys');
