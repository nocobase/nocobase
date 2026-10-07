/**
 * This plugin on the authorization plugin, from `shared/access.ts`: its business actions as the `kb` resource type,
 * each level its own action, listed in the permission workspace under a Knowledge subsection of business. Its page is a
 * client route; the roles and how far a level reaches belong to the application that assembles the plugin
 * (`knowledgeAccessToken`). An application assembled without the authorization plugin registers nothing.
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
  BUSINESS_ACTIONS,
  BUSINESS_KEYS,
  BUSINESS_SECTION,
  RESOURCE_TYPE,
  accessText,
  actionText,
  businessText,
  levelActionsOf,
  type Business,
} from '../../shared/access.js';

/** Registers the businesses as the `kb` resource type, each with the actions of its levels, in their subsection. */
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

export class KnowledgeAuthorizationProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = `${ACCESS_NAMESPACE}/authorization`;

  public override boot(): Promise<void> {
    if (this.app.container.has(authorizationToken))
      registerBusinesses(this.app.container.resolve(authorizationToken));
    return Promise.resolve();
  }
}
