import { useService } from '@nocobase/app-client';

import { authorizationSettingsToken } from '../tokens.js';
import type { AuthorizationSettings } from './extensions.js';

/** The Roles and permissions page's extension points and the application's page catalog. */
export function useAuthorizationSettings(): AuthorizationSettings {
  return useService(authorizationSettingsToken);
}
