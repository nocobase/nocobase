/**
 * This plugin on the authorization plugin, from `shared/access.ts`: its settings items, listed in the permission
 * workspace under a Projects subsection of administration, and its businesses as the `pm` resource type, each level of
 * a business action its own action, listed under a Projects subsection of business. The roles and how far a level
 * reaches belong to the application that assembles the plugin (`projectsAccessToken`).
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
  SETTINGS_ACTIONS,
  accessText,
  actionText,
  businessText,
  levelActionsOf,
  type Business,
} from '../../shared/access.js';

export const NAMESPACE: string = ACCESS_NAMESPACE;

/** The permission workspace subsection the settings items are listed under. */
const SECTION = 'projects';

/** Registers the settings items, each with its actions, in their subsection. */
export function registerSettings(authz: AppAuthorization): void {
  authz.ui.sections.add({
    name: SECTION,
    title: accessText('sections.projects'),
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
    authz.ui.place({ type: 'settings', id }, { section: SECTION });
  }
}

/** Registers the businesses as the `pm` resource type, each with the actions of its levels, in their subsection. */
export function registerBusinesses(authz: AppAuthorization): void {
  authz.ui.sections.add({
    name: BUSINESS_SECTION,
    title: accessText('sections.projects'),
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

/** Registers the settings items and the businesses once the authorization plugin is ready. */
export class ProjectsAuthorizationProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = `${NAMESPACE}/authorization`;

  public override boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    registerSettings(authz);
    registerBusinesses(authz);
    return Promise.resolve();
  }
}
