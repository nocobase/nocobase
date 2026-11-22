/**
 * This plugin on the authorization plugin, from `shared/access.ts`: its settings items, listed in the permission
 * workspace under a Releases subsection of administration, and its businesses as the `rel` resource type, each level of
 * a business action its own action, under a Releases subsection of business. Its pages are client routes; the roles and
 * how far a level reaches belong to the application that assembles the plugin (`releasesAccessToken`).
 */
import {
  authorizationToken,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ResourceItems } from '@nocobase/authorization/core';
import { ServiceProvider } from '@nocobase/service-provider';

import { APPS_BUSINESS } from '../access/caller.js';
import {
  releasesKeyScopeObjects,
  type ReleasesKeyScopeObjects,
} from '../access/key-scope-objects.js';
import { releasesToken } from '../tokens.js';

import {
  ACCESS_NAMESPACE,
  ACCESS_SECTION,
  BUSINESS_ACTIONS,
  BUSINESS_KEYS,
  BUSINESS_SECTION,
  HUMAN_ONLY_ACTIONS,
  HUMAN_ONLY_REASONS,
  KEY_TEMPLATES,
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

/** Registers the businesses as the `rel` resource type, each with the actions of its levels, in their subsection. */
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
        levelActionsOf(key).map(({ level, name }) => {
          const action = key.slice(key.indexOf('/') + 1);
          const humanOnly = (HUMAN_ONLY_ACTIONS as readonly string[]).includes(
            action,
          )
            ? HUMAN_ONLY_REASONS[action as keyof typeof HUMAN_ONLY_REASONS]
            : undefined;
          return {
            name,
            title: actionText(key, level),
            ...(humanOnly ? { humanOnly } : {}),
          };
        }),
      ),
    });
  authz.resourceTypes.add({ type: RESOURCE_TYPE, items });
  for (const business of Object.keys(BUSINESS_ACTIONS))
    authz.ui.place(
      { type: RESOURCE_TYPE, id: business },
      { section: BUSINESS_SECTION },
    );
}

/**
 * What API keys are offered of this plugin: the CI templates, and the Apps a key may be limited to, listed by
 * `objects` (the Apps the key's maker may see). Returns what removes them.
 */
export function registerCredentials(
  authz: AppAuthorization,
  objects?: ReleasesKeyScopeObjects,
): () => void {
  const removals = KEY_TEMPLATES.map((template) =>
    authz.credentials.templates.add(template),
  );
  if (objects)
    removals.push(authz.credentials.objectSources.add(APPS_BUSINESS, objects));
  return () => {
    for (const remove of removals) remove();
  };
}

export class ReleasesAuthorizationProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = `${ACCESS_NAMESPACE}/authorization`;

  public override boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    registerSettings(authz);
    registerBusinesses(authz);
    const { container } = this.app;
    registerCredentials(
      authz,
      container.has(releasesToken)
        ? releasesKeyScopeObjects(() => container.resolve(releasesToken))
        : undefined,
    );
    return Promise.resolve();
  }
}
