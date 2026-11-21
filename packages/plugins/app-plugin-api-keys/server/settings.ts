/**
 * The permissions about API keys a role grants, as settings items of the authorization plugin: `personalApiKeys`
 * `create` lets a person create keys of their own; `apiKeys` `read` opens the system settings' API keys page and
 * `manage` manages system keys there. No key may hold any of them: keys never manage keys.
 */
import type { AppAuthorization } from '@nocobase/app-plugin-authorization';

import { API_KEYS_SETTINGS, PERSONAL_API_KEYS_SETTINGS } from './scoped-keys.js';

const NAMESPACE = '@nocobase/app-plugin-api-keys';
const text = (key: string) => ({ key, ns: NAMESPACE });
const humanOnly = text('permissions.humanOnly');

export function registerApiKeySettings(authz: AppAuthorization): void {
  authz.settings.add({
    id: API_KEYS_SETTINGS,
    title: text('permissions.apiKeys'),
    actions: [
      { name: 'read', title: text('permissions.read'), humanOnly },
      {
        name: 'manage',
        title: text('permissions.manage'),
        humanOnly,
        risk: 'high',
      },
    ],
  });
  authz.settings.add({
    id: PERSONAL_API_KEYS_SETTINGS,
    title: text('permissions.personalApiKeys'),
    actions: [
      { name: 'create', title: text('permissions.create'), humanOnly },
    ],
  });
}
