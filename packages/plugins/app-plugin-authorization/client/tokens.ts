import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { AuthorizationClient } from './authorization-client.js';
import type { AuthorizationSettings } from './settings/extensions.js';

export const authorizationClientToken: ServiceToken<AuthorizationClient> =
  createServiceToken<AuthorizationClient>(
    '@nocobase/app-plugin-authorization/client',
  );

/** The Roles and permissions page's extension points and the application's page catalog (`AuthorizationSettings`). */
export const authorizationSettingsToken: ServiceToken<AuthorizationSettings> =
  createServiceToken<AuthorizationSettings>(
    '@nocobase/app-plugin-authorization/client/settings',
  );
