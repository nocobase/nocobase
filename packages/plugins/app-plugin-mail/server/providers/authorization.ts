/**
 * Registers what Mail offers to be granted (`shared/access.ts`) with the authorization plugin, so roles can be given
 * Team mail and Mail settings in the permission workspace. The Mail page is a `page` grant the client route tree lists;
 * Team mail is this plugin's `mail` resource type, with a read and a write level, listed in a Mail subsection of pages;
 * Mail settings is a settings item with `read` and `manage`, in a Mail subsection of administration.
 */
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ResourceItems } from '@nocobase/authorization/core';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  MAIL_ACCESS_NAMESPACE,
  MAIL_PAGES_SECTION,
  MAIL_RESOURCE_TYPE,
  MAIL_SETTINGS_ACTIONS,
  MAIL_SETTINGS_ITEM,
  MAIL_SETTINGS_SECTION,
  MAIL_TEAM_ACTIONS,
  MAIL_TEAM_RESOURCE,
  mailAccessText,
} from '../../shared/access.js';

export class MailAuthorizationProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = `${MAIL_ACCESS_NAMESPACE}/authorization`;

  public override boot(): Promise<void> {
    if (!this.app.container.has(authorizationToken)) return Promise.resolve();
    const authz = this.app.container.resolve(authorizationToken);

    authz.ui.sections.add({
      name: MAIL_PAGES_SECTION,
      title: mailAccessText('section'),
      parent: 'pages',
    });
    const items = new ResourceItems();
    items.add({
      id: MAIL_TEAM_RESOURCE,
      title: mailAccessText('team.title'),
      description: mailAccessText('team.description'),
      actions: MAIL_TEAM_ACTIONS.map((name) => ({
        name,
        title: mailAccessText(`team.actions.${name}`),
      })),
    });
    authz.resourceTypes.add({ type: MAIL_RESOURCE_TYPE, items });
    authz.ui.place(
      { type: MAIL_RESOURCE_TYPE, id: MAIL_TEAM_RESOURCE },
      { section: MAIL_PAGES_SECTION },
    );

    authz.ui.sections.add({
      name: MAIL_SETTINGS_SECTION,
      title: mailAccessText('section'),
      parent: 'administration',
    });
    authz.settings.add({
      id: MAIL_SETTINGS_ITEM,
      title: mailAccessText('settings.title'),
      actions: MAIL_SETTINGS_ACTIONS.map((name) => ({
        name,
        title: mailAccessText(`settings.actions.${name}`),
      })),
    });
    authz.ui.place(
      { type: 'settings', id: MAIL_SETTINGS_ITEM },
      { section: MAIL_SETTINGS_SECTION },
    );
    return Promise.resolve();
  }
}
