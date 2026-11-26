import { AUTHENTICATION_SETTINGS_ID } from '@nocobase/app-plugin-authentication';
import type { Authorization } from '@nocobase/authorization/core';
import type { PermissionSetsAuthorizationApi } from '@nocobase/authorization/permission-sets';
import { AUTHORIZATION_NAMESPACE } from '../../shared.js';
import type { AuthorizationExtensionHost } from '../host.js';
import type { SettingsAuthorizationApi } from '../settings.js';
import { AUTHORIZATION_SETTINGS_SECTION } from '../ui.js';
import { createInspectorHandler } from './inspector.js';
import {
  createPermissionSetHandler,
  PERMISSION_SETS_SETTINGS,
} from './permission-sets.js';

const text = (key: string) => ({ key, ns: AUTHORIZATION_NAMESPACE });
const action = (name: string) => ({
  name,
  title: text(`options.actions.${name}`),
});

/**
 * The Permission Set and Authentication settings items, and the Permission Set and inspector routes. The inspector is not a settings item:
 * it is never offered as a grantable permission, and its routes admit only an unrestricted identity.
 */
export function installAuthorizationAdministration(
  authz: Authorization &
    AuthorizationExtensionHost &
    SettingsAuthorizationApi &
    PermissionSetsAuthorizationApi,
): void {
  authz.settings.add({
    id: PERMISSION_SETS_SETTINGS,
    title: text('options.settings.permission-sets'),
    actions: ['read', 'create', 'update', 'delete', 'assign'].map(action),
  });
  // Permission sets lead the section; rule plugins follow.
  authz.ui.place(
    { type: 'settings', id: PERMISSION_SETS_SETTINGS },
    { section: AUTHORIZATION_SETTINGS_SECTION, order: 0 },
  );
  // Reading the Authentication settings. The authentication plugin owns the page and the route; it cannot
  // depend on this plugin, so the item is declared here and the provider binds its check.
  authz.settings.add({
    id: AUTHENTICATION_SETTINGS_ID,
    title: text('options.settings.authentication-settings'),
    actions: [action('read')],
  });
  authz.ui.place(
    { type: 'settings', id: AUTHENTICATION_SETTINGS_ID },
    { section: AUTHORIZATION_SETTINGS_SECTION, order: 10 },
  );
  authz.routes.add(
    '/permissionSets',
    createPermissionSetHandler(authz, authz.permissionSets),
  );
  authz.routes.add(
    '/inspector',
    createInspectorHandler(authz, authz.permissionSets),
  );
}
