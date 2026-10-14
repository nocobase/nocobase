/**
 * What a Studio role can hold, read at runtime from what the assembled plugins registered with the authorization plugin:
 *
 * - businesses: the items of each plugin's resource type (`pm`, `agents`, `rel`, `kb`), their actions grouped by level.
 *   An action named `<action>.<level>` (`edit.related`, `edit.all`) is one level of the business action `<action>`; any
 *   other name is a business action without levels, granted at `all` or not at all;
 * - settings: the `settings` items of those plugins and Studio's own (`studio.*`), recognized by the id's prefix.
 *
 * A business action is named `business/action` (`pm.issues/edit`) wherever Studio stores or checks it: roles, the
 * permissions it resolves, agents' configured actions and the `x-cli` `action` of a route. An action's title and
 * description come from its level titles' keys (`….edit.related` → `….edit.title`, `….edit.description`), the shape
 * the plugins' `actionText` gives them. The `related` level is worded beside its title too (`….edit.relatedLabel`, its
 * short name in a level choice, and `….edit.relatedHint`, what it reaches), unless Studio words it itself because Studio
 * decides what the action's records relate to (`related-wording.ts`).
 */
import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import * as agents from '@nocobase/app-plugin-agents/shared/access';
import * as knowledge from '@nocobase/app-plugin-knowledge/shared/access';
import * as projects from '@nocobase/app-plugin-projects/shared/access';
import * as releases from '@nocobase/app-plugin-releases/shared/access';
import type {
  AuthorizationTitle,
  ResourceRef,
} from '@nocobase/authorization/core';

import {
  LEVELS,
  type AccessCatalog,
  type CatalogBusiness,
  type CatalogBusinessAction,
  type CatalogLevel,
  type CatalogSection,
  type CatalogSettingsItem,
  type CatalogText,
  type GrantedLevel,
  type Level,
} from '../../shared/access.js';
import { RELATED_WORDING } from './related-wording.js';

/** The resource types of the businesses Studio assembles, in the order the role editor lists them. */
export const BUSINESS_TYPES: readonly string[] = [
  projects.RESOURCE_TYPE,
  agents.RESOURCE_TYPE,
  releases.RESOURCE_TYPE,
  knowledge.RESOURCE_TYPE,
];

/** Whose settings items a role may hold: those of the assembled plugins and Studio's own, by the id's prefix. */
const SETTINGS_OWNERS: readonly string[] = [...BUSINESS_TYPES, 'studio'];

const GRANTED_LEVELS = LEVELS.filter(
  (level): level is GrantedLevel => level !== 'none',
);

const prefixOf = (id: string): string => id.slice(0, id.indexOf('.'));

/** The resource a business (`pm.issues`) is granted on: its plugin's type, which is the id's prefix. */
export function businessResource(business: string): ResourceRef {
  return { type: prefixOf(business), id: business };
}

/** `edit.related` → `edit` at `related`; `create` → `create` at `all`. */
function parseAction(name: string): { name: string; level: GrantedLevel } {
  for (const level of GRANTED_LEVELS)
    if (name.endsWith(`.${level}`))
      return { name: name.slice(0, -level.length - 1), level };
  return { name, level: 'all' };
}

/** A sibling of a level's title key (`….edit.related` → `….edit.title`); none for plain text. */
function sibling(
  title: AuthorizationTitle | undefined,
  part: 'title' | 'description' | 'relatedLabel' | 'relatedHint',
): CatalogText | undefined {
  if (!title || typeof title === 'string') return undefined;
  const at = title.key.lastIndexOf('.');
  if (at < 0) return undefined;
  return { key: `${title.key.slice(0, at)}.${part}`, ns: title.ns };
}

const text = (title: AuthorizationTitle): CatalogText => title;

/** The `related` level's short name and what it reaches: Studio's where it decides the relation, else the plugin's. */
function relatedWording(
  key: string,
  title: AuthorizationTitle | undefined,
): Pick<CatalogLevel, 'label' | 'description'> {
  const studio = RELATED_WORDING[key];
  if (studio) return studio;
  const label = sibling(title, 'relatedLabel');
  const description = sibling(title, 'relatedHint');
  return {
    ...(label ? { label } : {}),
    ...(description ? { description } : {}),
  };
}

/** What Studio reads of the catalog, with lookups by key and by grant. */
export interface Catalog extends AccessCatalog {
  /** Every business action key, in catalog order. */
  readonly businessKeys: readonly string[];
  /** Every settings capability key (`pm.members/read`), in catalog order. */
  readonly settingsKeys: readonly string[];
  /** The business action of a key. */
  action(key: string): CatalogBusinessAction | undefined;
  /** The levels a role may give a business action, none first. */
  levelsOf(key: string): readonly Level[];
  /** The business action and level a granted action stands for. */
  grantOf(
    resource: ResourceRef,
    action: string,
  ): { readonly key: string; readonly level: GrantedLevel } | undefined;
  isBusinessType(type: string): boolean;
}

function sectionOf(
  authz: AppAuthorization,
  resource: ResourceRef,
): CatalogSection | undefined {
  const placement = authz.ui.placementOf(resource);
  const section = placement && authz.ui.sections.get(placement.section);
  return section
    ? { name: section.name, title: text(section.title) }
    : undefined;
}

/** The catalog as the authorization plugin holds it now. */
export function readCatalog(authz: AppAuthorization): Catalog {
  const businesses: CatalogBusiness[] = [];
  for (const type of BUSINESS_TYPES) {
    if (!authz.resourceTypes.has(type)) continue;
    for (const item of authz.resourceTypes.get(type).items?.list() ?? []) {
      const actions = new Map<
        string,
        { levels: CatalogLevel[]; first?: AuthorizationTitle }
      >();
      for (const registered of item.actions) {
        const { name, level } = parseAction(registered.name);
        const entry = actions.get(name) ?? { levels: [] };
        const wording =
          level === 'related'
            ? relatedWording(`${item.id}/${name}`, registered.title)
            : undefined;
        entry.levels.push({
          level,
          action: registered.name,
          ...(registered.title ? { title: text(registered.title) } : {}),
          ...wording,
        });
        entry.first ??= registered.title;
        actions.set(name, entry);
      }
      const section = sectionOf(authz, { type, id: item.id });
      businesses.push({
        type,
        id: item.id,
        title: text(item.title),
        ...(item.description ? { description: text(item.description) } : {}),
        ...(section ? { section } : {}),
        actions: [...actions].map(([name, { levels, first }]) => {
          const title = sibling(first, 'title');
          const description = sibling(first, 'description');
          return {
            key: `${item.id}/${name}`,
            name,
            ...(title ? { title } : {}),
            ...(description ? { description } : {}),
            levels: [...levels].sort(
              (a, b) =>
                GRANTED_LEVELS.indexOf(a.level) -
                GRANTED_LEVELS.indexOf(b.level),
            ),
          };
        }),
      });
    }
  }
  const settings: CatalogSettingsItem[] = (
    authz.resourceTypes.has('settings')
      ? (authz.resourceTypes.get('settings').items?.list() ?? [])
      : []
  )
    .filter((item) => SETTINGS_OWNERS.includes(prefixOf(item.id)))
    .map((item) => {
      const section = sectionOf(authz, { type: 'settings', id: item.id });
      return {
        id: item.id,
        title: text(item.title),
        ...(item.description ? { description: text(item.description) } : {}),
        ...(section ? { section } : {}),
        actions: item.actions.map((action) => ({
          key: `${item.id}/${action.name}`,
          name: action.name,
          ...(action.title ? { title: text(action.title) } : {}),
        })),
      };
    });
  return catalogOf({ businesses, settings });
}

/** Lookups over catalog data (`readCatalog`, or a fixed one in a test). */
export function catalogOf(data: AccessCatalog): Catalog {
  const actions = new Map<string, CatalogBusinessAction>();
  const grants = new Map<string, { key: string; level: GrantedLevel }>();
  const types = new Set<string>();
  for (const business of data.businesses) {
    types.add(business.type);
    for (const action of business.actions) {
      actions.set(action.key, action);
      for (const { level, action: name } of action.levels)
        grants.set(`${business.type}:${business.id}/${name}`, {
          key: action.key,
          level,
        });
    }
  }
  return {
    businesses: data.businesses,
    settings: data.settings,
    businessKeys: [...actions.keys()],
    settingsKeys: data.settings.flatMap((item) =>
      item.actions.map((action) => action.key),
    ),
    action: (key) => actions.get(key),
    levelsOf(key) {
      const action = actions.get(key);
      return action
        ? ['none', ...action.levels.map(({ level }) => level)]
        : ['none'];
    },
    grantOf: (resource, action) =>
      grants.get(`${resource.type}:${resource.id}/${action}`),
    isBusinessType: (type) => types.has(type),
  };
}
