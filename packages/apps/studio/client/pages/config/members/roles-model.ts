import {
  ROLES,
  type AccessCatalog,
  type CatalogBusiness,
  type CatalogSettingsAction,
  type CatalogText,
  type Level,
  type Role,
  type RoleTitle,
} from '../../../../shared/access.js';
import { PAGES, type Page } from '../../../../shared/pages.js';

/**
 * Roles in the member settings: what the browser derives from `GET /api/access/roles` before it offers a change, and
 * how the role editor lays out what the plugins registered (`GET /api/access/catalog`). The server checks every rule again
 * (`server/access/service.ts`); these only keep the interface from offering what it will refuse.
 */

export const OWNER_ROLE: string = ROLES.owner;
type Translate = (key: string, options?: Record<string, unknown>) => string;

/** A role's page, `/config/roles/:roleKey`. */
export function rolePath(key: string): string {
  return `/config/roles/${encodeURIComponent(key)}`;
}

// The built-in roles carry `{ key, ns }` titles in the application's namespace (`roles.owner`, `roles.admin`,
// `roles.contributor`).
/** A title as stored: an i18n key (translated), plain text, or the fallback. */
export function accessTitle(
  t: Translate,
  title: RoleTitle | null | undefined,
  fallback: string,
): string {
  if (!title) return fallback;
  return typeof title === 'string'
    ? title
    : t(title.key, { ns: title.ns, defaultValue: fallback });
}

export function roleTitle(t: Translate, role: Role): string {
  return accessTitle(t, role.title, role.key);
}

/** The roles `userId` holds directly, in list order. */
export function rolesOf(roles: readonly Role[], userId: string): string[] {
  return roles
    .filter((role) => role.holderIds.includes(userId))
    .map((role) => role.key);
}

export interface RoleOption {
  readonly value: string;
  readonly disabled: boolean;
}

/**
 * Why a role cannot be added to or removed from `userId` here, or null: only an owner grants or revokes owner, and the
 * last owner keeps it (409 `LAST_OWNER`).
 */
export function lockOf(
  role: Role,
  userId: string,
  viewerId: string | undefined,
  roles: readonly Role[],
): 'owner' | 'lastOwner' | null {
  if (role.key !== OWNER_ROLE) return null;
  const owner = roles.find((item) => item.key === OWNER_ROLE);
  if (!viewerId || !owner?.holderIds.includes(viewerId)) return 'owner';
  if (owner.holderIds.includes(userId) && owner.holderCount <= 1)
    return 'lastOwner';
  return null;
}

/** The choices of the member's role select: every role, the locked ones disabled. */
export function roleOptions(
  roles: readonly Role[],
  userId: string,
  viewerId: string | undefined,
): RoleOption[] {
  return roles.map((role) => ({
    value: role.key,
    disabled: lockOf(role, userId, viewerId, roles) !== null,
  }));
}

/**
 * The select's next value with the locked roles put back as they were: a locked role the member holds cannot be
 * removed, one they do not hold cannot be added.
 */
export function nextRoles(
  roles: readonly Role[],
  userId: string,
  viewerId: string | undefined,
  requested: readonly string[],
): string[] {
  const current = rolesOf(roles, userId);
  const locked = new Set(
    roles
      .filter((role) => lockOf(role, userId, viewerId, roles) !== null)
      .map((role) => role.key),
  );
  const kept = requested.filter((key) => !locked.has(key));
  const restored = current.filter((key) => locked.has(key));
  return roles
    .map((role) => role.key)
    .filter((key) => kept.includes(key) || restored.includes(key));
}

export function sameRoles(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((key) => b.includes(key));
}

/** What the role editor edits: the pages a role opens, its settings capabilities and its business abilities. */
export interface RoleDraft {
  readonly pages: ReadonlySet<Page>;
  readonly settings: Readonly<Record<string, boolean>>;
  readonly abilities: Readonly<Record<string, Level>>;
}

export function draftOf(role: Role): RoleDraft {
  return {
    pages: new Set(role.pages),
    settings: role.settings,
    abilities: role.abilities,
  };
}

function sameRecord<T>(
  a: Readonly<Record<string, T>>,
  b: Readonly<Record<string, T>>,
): boolean {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].every(
    (key) => a[key] === b[key],
  );
}

export function sameDraft(a: RoleDraft, b: RoleDraft): boolean {
  return (
    PAGES.every((page) => a.pages.has(page) === b.pages.has(page)) &&
    sameRecord(a.abilities, b.abilities) &&
    sameRecord(a.settings, b.settings)
  );
}

/** The draft as the server takes it. */
export function requestOf(draft: RoleDraft): {
  readonly pages: Page[];
  readonly settings: Record<string, boolean>;
  readonly abilities: Record<string, Level>;
} {
  return {
    pages: PAGES.filter((page) => draft.pages.has(page)),
    settings: { ...draft.settings },
    abilities: { ...draft.abilities },
  };
}

/** The title of each page a role may open: its sidebar title (`client/routes.ts`). */
const PAGE_TITLES: Readonly<Record<Page, string>> = {
  'pm-my-issues': 'navigation.myIssues',
  'pm-issues': 'navigation.issues',
  'pm-projects': 'navigation.projects',
  agents: 'navigation.agents',
  runtimes: 'navigation.runtimes',
  skills: 'navigation.skills',
  usage: 'navigation.usage',
  'rel-apps': 'navigation.releaseApps',
  reports: 'navigation.dashboard',
  knowledge: 'navigation.knowledge',
};

/** The locale key of a page a role may open: its navigation title. */
export function pageText(page: Page): string {
  return PAGE_TITLES[page];
}

/** A catalog title: a key in its plugin's namespace (translated), plain text, or the fallback. */
export function catalogText(
  t: Translate,
  text: CatalogText | undefined,
  fallback: string,
): string {
  return accessTitle(t, text, fallback);
}

// i18n: roles.levels.none, roles.levels.related, roles.levels.all
/** The locale key of a level: not allowed, related to them, or all. */
export function levelText(level: Level): string {
  return `roles.levels.${level}`;
}

/** The businesses, each with its actions, as the catalog lists them. */
export function businessGroups(
  catalog: AccessCatalog,
): readonly CatalogBusiness[] {
  return catalog.businesses;
}

/**
 * The settings items, each with its capabilities. A `tiered` item's capabilities are levels, `read` below the other
 * (`read` < `manage`): the editor shows it as one switch and a level. The others' capabilities stand apart, a switch each.
 */
export function settingsGroups(catalog: AccessCatalog): readonly {
  readonly item: string;
  readonly title: CatalogText;
  readonly actions: readonly CatalogSettingsAction[];
  readonly keys: readonly string[];
  readonly tiered: boolean;
}[] {
  return catalog.settings.map((item) => ({
    item: item.id,
    title: item.title,
    actions: item.actions,
    keys: item.actions.map((action) => action.key),
    tiered: item.actions.length === 2 && item.actions[0]?.name === 'read',
  }));
}

/** The level a tiered item holds: its highest capability, or null when it holds none. */
export function settingsLevelOf(
  settings: RoleDraft['settings'],
  keys: readonly string[],
): string | null {
  return keys.findLast((key) => settings[key]) ?? null;
}

/** `settings` with a tiered item at `level`: that capability and every one below it, or none when null. */
export function withSettingsLevel(
  settings: RoleDraft['settings'],
  keys: readonly string[],
  level: string | null,
): RoleDraft['settings'] {
  const reach = level === null ? -1 : keys.indexOf(level);
  const next = { ...settings };
  keys.forEach((key, index) => {
    next[key] = index <= reach;
  });
  return next;
}

// i18n: roles.errors.lastOwner, roles.errors.inUse, roles.errors.isDefault
// i18n: roles.errors.builtIn, roles.errors.notEditable, roles.errors.notOffered, roles.errors.userDisabled
// i18n: roles.errors.invalidTitle, roles.errors.systemAdmin
/** The locale key for a failed role write, by the server's error reason. */
export function roleErrorKey(
  reason: string | undefined,
  status: number,
): string {
  switch (reason) {
    case 'LAST_OWNER':
      return 'roles.errors.lastOwner';
    case 'ROLE_IN_USE':
      return 'roles.errors.inUse';
    case 'ROLE_IS_DEFAULT':
      return 'roles.errors.isDefault';
    case 'ROLE_BUILT_IN':
      return 'roles.errors.builtIn';
    case 'ROLE_NOT_EDITABLE':
      return 'roles.errors.notEditable';
    case 'ABILITY_NOT_OFFERED':
    case 'INVALID_ABILITIES':
    case 'INVALID_PAGES':
      return 'roles.errors.notOffered';
    case 'SYSTEM_ADMIN':
      return 'roles.errors.systemAdmin';
    case 'USER_DISABLED':
      return 'roles.errors.userDisabled';
    case 'INVALID_TITLE':
      return 'roles.errors.invalidTitle';
    default:
      return status === 403 ? 'common.forbidden' : 'common.requestFailed';
  }
}
