/**
 * This plugin on the authorization plugin, from `shared/access.ts`: its settings items, listed in the permission
 * workspace under an Agent team subsection of administration, and its businesses as the `agents` resource type, each
 * level of a business action its own action, under an Agent team subsection of business. Its pages are client routes;
 * the authorization plugin lists them from the route tree.
 */
import {
  authorizationToken,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ResourceItems } from '@nocobase/authorization/core';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  ACCESS_NAMESPACE,
  ACCESS_SECTION,
  BUSINESS_ACTIONS,
  BUSINESS_KEYS,
  BUSINESS_SECTION,
  RESOURCE_TYPE,
  SETTINGS_ACTIONS,
  accessText,
  actionText,
  businessText,
  levelActionsOf,
  type Business,
} from '../../shared/access.js';

export function registerSettings(authz: AppAuthorization): void {
  authz.ui.sections.add({
    name: ACCESS_SECTION,
    title: accessText('section'),
    parent: 'administration',
  });
  for (const [id, actions] of Object.entries(SETTINGS_ACTIONS)) {
    authz.settings.add({
      id,
      title: accessText(`settings.${id}`),
      actions: actions.map((name: string) => ({
        name,
        title: accessText(`actions.${name}`),
      })),
    });
    authz.ui.place({ type: 'settings', id }, { section: ACCESS_SECTION });
  }
}

/** Registers the businesses as the `agents` resource type, each with the actions of its levels, in their subsection. */
export function registerBusinesses(authz: AppAuthorization): void {
  authz.ui.sections.add({
    name: BUSINESS_SECTION,
    title: accessText('businessSection'),
    parent: 'business',
  });
  const items = new ResourceItems();
  for (const business of Object.keys(BUSINESS_ACTIONS) as Business[])
    items.add({
      id: business,
      title: businessText(business, 'title'),
      description: businessText(business, 'description'),
      actions: BUSINESS_KEYS.filter(
        (entry) => entry.business === business,
      ).flatMap(({ key }) =>
        levelActionsOf(key).map(({ level, name }) => ({
          name,
          title: actionText(key, level),
        })),
      ),
    });
  authz.resourceTypes.add({ type: RESOURCE_TYPE, items });
  for (const business of Object.keys(BUSINESS_ACTIONS))
    authz.ui.place(
      { type: RESOURCE_TYPE, id: business },
      { section: BUSINESS_SECTION },
    );
}

export class AgentsAuthorizationProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = `${ACCESS_NAMESPACE}/authorization`;

  public override boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    registerSettings(authz);
    registerBusinesses(authz);
    return Promise.resolve();
  }
}
