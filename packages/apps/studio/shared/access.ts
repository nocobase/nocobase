/**
 * Studio's roles, as the server and the browser exchange them. A role is a permission set of the authorization plugin:
 * the pages it opens, the settings capabilities it holds and how far each business action reaches. What can be chosen
 * is what the assembled plugins register with the authorization plugin, read at runtime (`AccessCatalog`,
 * `GET /api/access/catalog`); Studio has one set of roles for all of them.
 */
import type { KeyScopeInput } from '@nocobase/app-plugin-api-keys/shared/scopes';

import type { Page } from './pages.js';

/**
 * How far a role lets a business action reach, from none to all. A business action whose records relate to users is
 * registered once per level (`edit.related`, `edit.all`); one without is registered as itself and offers only none or
 * all. Holding a level reaches at least what the lower ones do, so the highest one held counts. What `related` reaches
 * for a caller is the server's (`server/access/scope-levels.ts`).
 */
export const LEVELS = ['none', 'related', 'all'] as const;

export type Level = (typeof LEVELS)[number];

/** A level other than none: what a grant names. */
export type GrantedLevel = Exclude<Level, 'none'>;

/** The order of a level; an unknown one is below none. */
export function levelOrder(level: string): number {
  return (LEVELS as readonly string[]).indexOf(level);
}

/** The wider of two levels. */
export function wider(a: Level, b: Level): Level {
  return levelOrder(a) >= levelOrder(b) ? a : b;
}

/**
 * How far a business action reaches for a caller once their level is resolved: every record, none, or the records
 * related to any of a set of users. The plugins' `Scope`, which they filter by.
 */
export type Scope = 'all' | 'none' | { readonly users: readonly string[] };

/** Whether `scope` reaches a record related to any of `userIds` (null and undefined relate nothing). */
export function reaches(
  scope: Scope,
  ...userIds: readonly (string | null | undefined)[]
): boolean {
  if (scope === 'all') return true;
  if (scope === 'none') return false;
  return userIds.some((id) => !!id && scope.users.includes(id));
}

/**
 * What a signed-in user may do, decided once per request, over the whole catalog: each business action
 * (`pm.issues/edit`) with its level resolved for them, each settings capability (`pm.members/read`) on or off.
 */
export interface Permissions {
  readonly scopes: Readonly<Record<string, Scope>>;
  readonly settings: Readonly<Record<string, boolean>>;
}

/** A title as the authorization plugin stores it: plain text, or an i18n key in a namespace. */
export type CatalogText =
  string | { readonly key: string; readonly ns: string };

/** Where the permission workspace lists an item: its subsection. */
export interface CatalogSection {
  readonly name: string;
  readonly title: CatalogText;
}

/** A level of a business action and the authorization action that grants it. */
export interface CatalogLevel {
  readonly level: GrantedLevel;
  /** The authorization action: `edit.related`, `edit.all`, or `create` for an action without levels. */
  readonly action: string;
  readonly title?: CatalogText;
  /** The level's short name in a level choice: for `related`, what it reaches ("in projects I can see"). */
  readonly label?: CatalogText;
  /** For `related`, one line on the records it reaches. */
  readonly description?: CatalogText;
}

/** A business action, `pm.issues/edit`, with the levels it offers, lowest first. */
export interface CatalogBusinessAction {
  /** `business/action`: how roles, permissions, agents and routes name it. */
  readonly key: string;
  readonly name: string;
  readonly title?: CatalogText;
  readonly description?: CatalogText;
  readonly levels: readonly CatalogLevel[];
}

/** A business a plugin registered: an item of its resource type (`pm:pm.issues`). */
export interface CatalogBusiness {
  readonly type: string;
  readonly id: string;
  readonly title: CatalogText;
  readonly description?: CatalogText;
  readonly section?: CatalogSection;
  readonly actions: readonly CatalogBusinessAction[];
}

/** A settings capability, `pm.members/read`. */
export interface CatalogSettingsAction {
  readonly key: string;
  readonly name: string;
  readonly title?: CatalogText;
}

/** A settings item a plugin (or Studio) registered. */
export interface CatalogSettingsItem {
  readonly id: string;
  readonly title: CatalogText;
  readonly description?: CatalogText;
  readonly section?: CatalogSection;
  readonly actions: readonly CatalogSettingsAction[];
}

/**
 * `GET /api/access/catalog`: what a Studio role can hold, as the assembled plugins registered it with the authorization
 * plugin, in the order the role editor lists it. Pages are client routes and come from the route tree.
 */
export interface AccessCatalog {
  readonly businesses: readonly CatalogBusiness[];
  readonly settings: readonly CatalogSettingsItem[];
}

/** The built-in roles: never deleted. `contributor` is the everyday role, and may be taken away like any other. */
export const ROLES = {
  owner: 'owner',
  admin: 'admin',
  contributor: 'contributor',
} as const;

export const BUILT_IN_ROLES: readonly string[] = [
  ROLES.owner,
  ROLES.admin,
  ROLES.contributor,
];

/** The namespace of the built-in roles' titles, in the application's locales. */
export const STUDIO_NAMESPACE = '@nocobase/i18n/application';

/**
 * The pages Studio itself declares (`page` grants, action `access`): `reports`, the dashboard (`/dashboard`) and the
 * acceptance metrics, whose API checks the same grant (`server/reports/routes.ts`). `pages.ts` joins them to the
 * plugins'; the system knowledge page is the knowledge plugin's `knowledge`.
 */
export const STUDIO_PAGES = ['reports'] as const;

export type StudioPage = (typeof STUDIO_PAGES)[number];

/**
 * The settings items Studio itself declares (`settings` grants):
 *
 * | Item                     | Action   | What it allows                                                              |
 * | ------------------------ | -------- | --------------------------------------------------------------------------- |
 * | `studio.apiKeys`          | `read`   | see the organization's API keys (Settings › API keys)                       |
 * |                          | `manage` | create, edit, rotate, disable and delete them; only within one's own access |
 * | `studio.personalApiKeys`  | `create` | create and rotate API keys of one's own (Account settings › API keys)      |
 * | `studio.git`              | `read`   | see the workspace's connections to code hosts (Settings › Git)              |
 * |                          | `manage` | add, change and remove them; their credentials are write-only               |
 * | `studio.knowledgeSearch`  | `read`   | see how the knowledge base is searched (Settings › Knowledge search)        |
 * |                          | `manage` | choose its embedding, rerank and context models and its thresholds          |
 *
 * Owners and admins hold them all; every built-in role holds `studio.personalApiKeys`, so an organization turns
 * personal keys off by taking it from its roles. No API key holds any (`server/access/action-policy.ts`).
 */
export const STUDIO_SETTINGS_ACTIONS = {
  'studio.apiKeys': ['read', 'manage'],
  'studio.personalApiKeys': ['create'],
  'studio.git': ['read', 'manage'],
  'studio.knowledgeSearch': ['read', 'manage'],
} as const;

/** A title as the authorization plugin stores it: plain text, or an i18n key in a namespace. */
export type RoleTitle = CatalogText;

/** A row of `GET /api/access/roles`. */
export interface Role {
  readonly key: string;
  readonly title: RoleTitle | null;
  readonly builtIn: boolean;
  /** Whether its grants may be changed (not `owner`, which holds everything). */
  readonly editable: boolean;
  readonly pages: readonly Page[];
  /** Every settings capability of the catalog, on or off. */
  readonly settings: Readonly<Record<string, boolean>>;
  /** Every business action of the catalog at its level. */
  readonly abilities: Readonly<Record<string, Level>>;
  /** Users assigned the role directly. */
  readonly holderIds: readonly string[];
  readonly holderCount: number;
}

/**
 * `POST /api/access/roles` (`title` required) and `PATCH /api/access/roles/:roleKey`. Within `pages`, `settings` and
 * `abilities`, what is left out is not granted; a field left out of a `PATCH` keeps what the role has.
 */
export interface SaveRoleRequest {
  readonly title?: string;
  readonly pages?: readonly string[];
  readonly settings?: Readonly<Record<string, boolean>>;
  readonly abilities?: Readonly<Record<string, Level>>;
}

/** A row of `GET /api/access/members`, and the answer of `PATCH /api/access/members/:userId`. */
export interface MemberWithRoles {
  readonly userId: string;
  readonly name: string;
  readonly email: string | null;
  readonly roles: readonly string[];
}

/** `GET /api/access/members`'s `meta`: how many are listed, and how many system administrators are not. */
export interface MembersListMeta {
  readonly total: number;
  readonly systemAdministratorCount: number;
  readonly message?: string;
}

/** A concise CLI note explaining system administrators omitted from the member rows. */
export function membersListMessage(
  systemAdministratorCount: number,
): string | undefined {
  if (systemAdministratorCount === 0) return undefined;
  return systemAdministratorCount === 1
    ? '1 system administrator holds every permission and is not listed.'
    : `${systemAdministratorCount} system administrators hold every permission and are not listed.`;
}

/** `PATCH /api/access/members/:userId`: the user's complete set of roles. */
export interface ReplaceMemberRolesRequest {
  readonly roles: readonly string[];
}

/** `GET` and `PUT /api/access/settings`. */
export interface AccessSettings {
  /** The role a new member is given once, or null for none. */
  readonly defaultRole: string | null;
}

/** `GET /api/access/me`: the caller's roles; a system administrator holds none and may do everything. */
export interface AccessMe {
  readonly roles: readonly string[];
  readonly superuser: boolean;
}

/**
 * An organization's API key (Settings › API keys): a key that belongs to no person. Behind it is a hidden identity of
 * its own (a `service` user) holding exactly the permissions chosen for the key, so what it does is shown under its
 * name with an "API key" tag. A row of `GET /api/organizationKeys`; `id` is that identity's, and stays through a
 * rotation, as does `keyId`.
 */
export interface OrgApiKey {
  readonly id: string;
  readonly keyId: string | null;
  readonly name: string;
  readonly description: string | null;
  /** The permissions chosen: groups at a level, some limited to records. */
  readonly scope: KeyScopeInput | null;
  /** The first characters of the secret, to recognize it. */
  readonly start: string | null;
  readonly createdBy: { readonly id: string; readonly name: string } | null;
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly lastUsedAt: string | null;
  /** `expired` when the expiry has passed; `disabled` when someone disabled it. */
  readonly status: 'active' | 'disabled' | 'expired';
  /**
   * The repository whose CI Studio set up with this key, which Studio rotates and keeps in step with the Apps the
   * repository builds; null for a key someone made. It can still be disabled or deleted, which hands the CI back to
   * the manual setup.
   */
  readonly managedBy: OrgApiKeyManager | null;
}

/** The repository a key belongs to when Studio manages it (`OrgApiKey.managedBy`). */
export interface OrgApiKeyManager {
  /** The working directory (`GET /api/repositoryDeployments/{resourceId}/ci`). */
  readonly resourceId: string;
  readonly projectId: string;
  readonly projectName: string;
  /** `owner/name` on its host. */
  readonly repo: string | null;
}

/** `POST /api/organizationKeys`: one form, one key. */
export interface CreateOrgApiKeyRequest {
  readonly name: string;
  readonly description?: string | null;
  readonly expiresInDays: number | null;
  readonly scope: KeyScopeInput;
}

/** `POST /api/organizationKeys` and `POST …/:keyId/rotate`: the key and its secret, shown once. */
export interface CreatedOrgApiKey {
  readonly key: OrgApiKey;
  readonly secret: string;
}

/** `PATCH /api/organizationKeys/:keyId`: a name or description left out stays. */
export interface UpdateOrgApiKeyRequest {
  readonly name?: string;
  readonly description?: string | null;
}

/** What happened to an organization's key, newest first (`GET /api/organizationKeys/:keyId/events`). */
export interface OrgApiKeyEvent {
  readonly id: string;
  readonly action:
    | 'created'
    | 'updated'
    | 'permissions-changed'
    | 'rotated'
    | 'disabled'
    | 'enabled'
    | 'deleted';
  readonly actor: { readonly id: string; readonly name: string } | null;
  /** For `permissions-changed`, the scope before and after; for `updated`, the fields changed. */
  readonly details: Readonly<Record<string, unknown>> | null;
  readonly createdAt: string;
}

/** Someone who acted through an organization's API key, by its hidden identity's id: named with an "API key" tag. */
export interface ApiKeyActor {
  readonly id: string;
  readonly name: string;
}
