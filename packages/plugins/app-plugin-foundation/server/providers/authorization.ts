/**
 * Registers the «Plugins · View» settings item from `shared/access.ts` with the authorization plugin and lists it in
 * the permission workspace's System subsection of administration, which other plugins may extend as well.
 */
import {
  authorizationToken,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  FOUNDATION_PACKAGE,
  PLUGINS_ACCESS,
  PLUGINS_SETTINGS_ID,
  SYSTEM_SECTION,
  accessText,
} from '../../shared/access.js';

export function registerPluginsAccess(authz: AppAuthorization): void {
  authz.ui.sections.add({
    name: SYSTEM_SECTION,
    title: accessText('section'),
    parent: 'administration',
    extend: true,
  });
  authz.settings.add({
    id: PLUGINS_SETTINGS_ID,
    title: accessText('settings.plugins'),
    actions: [
      { name: PLUGINS_ACCESS.action, title: accessText('actions.read') },
    ],
  });
  authz.ui.place(
    { type: 'settings', id: PLUGINS_SETTINGS_ID },
    { section: SYSTEM_SECTION },
  );
}

export class FoundationAuthorizationProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = `${FOUNDATION_PACKAGE}/authorization`;

  public override boot(): Promise<void> {
    registerPluginsAccess(this.app.container.resolve(authorizationToken));
    return Promise.resolve();
  }
}
