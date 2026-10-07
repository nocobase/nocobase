/**
 * What this plugin offers to be granted: its pages, settings items and business actions with the levels each offers.
 * The plugin registers them with the authorization plugin from here (`server/providers/authorization.ts`): its settings
 * items, and its businesses as the `pm` resource type, each level of an action its own authorization action
 * (`edit.related`, `edit.all`). The application that assembles it keeps the roles, stores the grants and tells
 * the plugin each request's `Permissions` (`server/tokens.ts`, `projectsAccessToken`). The client reads a signed-in
 * user's `Permissions` to show only what the server would allow.
 */

/** The namespace of every title below, in the plugin's locales (`shared/locales/access.*.ts`). */
export const ACCESS_NAMESPACE = '@nocobase/app-plugin-projects';

/** A title as the authorization plugin stores it: an i18n key in this plugin's namespace. */
export function accessText(key: string): {
  readonly key: string;
  readonly ns: string;
} {
  return { key: `access.${key}`, ns: ACCESS_NAMESPACE };
}

/**
 * Business actions. Each reaches every record, none, or the records related to a set of users (`Scope`); the table
 * says how a record relates to a user (`RELATIONS`). The application decides the set from the caller's roles: the
 * caller alone, or more (say, their department); this plugin only filters by it.
 *
 * | Action                     | a record related to a user                                             |
 * | -------------------------- | ---------------------------------------------------------------------- |
 * | projects view              | public projects, and private ones the user leads or joined             |
 * | projects create            | none: the action has no records, it is held or not                     |
 * | projects manage            | projects the user leads                                                |
 * | projects delete            | none: held or not                                                      |
 * | issues view / edit         | issues without a project, or in a project related for `view`          |
 * | issues create              | the same: without a project, or into such a project                    |
 * | issues comment             | the same issues: comment, reply, resolve threads                       |
 * | issues moderate-comments   | delete anyone's comment on issues the user owns or whose project they lead |
 * | issues close / change-owner | issues the user owns, or in a project they lead                       |
 * | issues delete              | none: held or not                                                      |
 * | attachments upload         | files on the issues related for `view`: upload, attach, send with a comment |
 */
export const BUSINESS_ACTIONS = {
  'pm.projects': ['view', 'create', 'manage', 'delete'],
  'pm.issues': [
    'view',
    'create',
    'edit',
    'comment',
    'moderate-comments',
    'close',
    'change-owner',
    'delete',
  ],
  'pm.attachments': ['upload'],
} as const;

export type Business = keyof typeof BUSINESS_ACTIONS;
export type BusinessAction<B extends Business = Business> =
  (typeof BUSINESS_ACTIONS)[B][number];

/** `business/action`, the key of a scope in `Permissions.scopes`. */
export type BusinessKey = {
  [B in Business]: `${B}/${BusinessAction<B>}`;
}[Business];

/**
 * How far a business action reaches for a caller: every record, none, or the records related to any of `users`
 * (`RELATIONS`). The application resolves the level a role gives to this; for its built-in `related` level the set is
 * the caller alone. An empty set reaches nothing.
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

/** The users a scope is limited to: null for `all`, none for `none`. */
export function usersOf(scope: Scope): readonly string[] | null {
  if (scope === 'all') return null;
  return scope === 'none' ? [] : scope.users;
}

/**
 * Settings items, each checked on its own endpoints. `read` opens the page and `update` changes it; on members,
 * `invite` invites without a project and manages every invitation, `assign` gives and takes roles, and `define-roles`
 * creates, edits and deletes them.
 */
export const SETTINGS_ACTIONS = {
  'pm.general': ['read', 'update'],
  'pm.labels': ['read', 'update'],
  'pm.workflows': ['read', 'update'],
  'pm.members': ['read', 'invite', 'assign', 'define-roles'],
} as const;

export type SettingsItem = keyof typeof SETTINGS_ACTIONS;
export type SettingsAction<S extends SettingsItem = SettingsItem> =
  (typeof SETTINGS_ACTIONS)[S][number];

/** `item/action`, the key of a capability in `Permissions.settings`. */
export type SettingsKey = {
  [S in SettingsItem]: `${S}/${SettingsAction<S>}`;
}[SettingsItem];

/** The app pages a role may open (`page` grants, action `access`); the client routes declare the same ids. */
export const PAGES = ['pm-my-issues', 'pm-issues', 'pm-projects'] as const;

export type Page = (typeof PAGES)[number];

/** What a signed-in user may do, decided once per request. */
export interface Permissions {
  readonly scopes: Readonly<Record<BusinessKey, Scope>>;
  readonly settings: Readonly<Record<SettingsKey, boolean>>;
}

export function businessKey<B extends Business>(
  business: B,
  action: BusinessAction<B>,
): BusinessKey {
  return `${business}/${action}` as BusinessKey;
}

export function settingsKey<S extends SettingsItem>(
  item: S,
  action: SettingsAction<S>,
): SettingsKey {
  return `${item}/${action}` as SettingsKey;
}

/** Every business action, in declaration order. */
export const BUSINESS_KEYS: readonly {
  readonly business: Business;
  readonly action: BusinessAction;
  readonly key: BusinessKey;
}[] = Object.entries(BUSINESS_ACTIONS).flatMap(([business, actions]) =>
  actions.map((action: string) => ({
    business: business as Business,
    action: action as BusinessAction,
    key: `${business}/${action}` as BusinessKey,
  })),
);

/** Every settings capability, in declaration order. */
export const SETTINGS_KEYS: readonly {
  readonly item: SettingsItem;
  readonly action: SettingsAction;
  readonly key: SettingsKey;
}[] = Object.entries(SETTINGS_ACTIONS).flatMap(([item, actions]) =>
  actions.map((action: string) => ({
    item: item as SettingsItem,
    action: action as SettingsAction,
    key: `${item}/${action}` as SettingsKey,
  })),
);

/**
 * How a record relates to a user, as the application words it: the records the user can see (public projects, the
 * private ones they lead or joined, and their issues), or the ones they lead or own.
 */
export type Relation = 'visible' | 'managed';

/** Each business action's relation; null where the action has no records to relate, so it is held or not. */
export const RELATIONS: Readonly<Record<BusinessKey, Relation | null>> = {
  'pm.projects/view': 'visible',
  'pm.projects/create': null,
  'pm.projects/manage': 'managed',
  'pm.projects/delete': null,
  'pm.issues/view': 'visible',
  'pm.issues/create': 'visible',
  'pm.issues/edit': 'visible',
  'pm.issues/comment': 'visible',
  'pm.issues/moderate-comments': 'managed',
  'pm.issues/close': 'managed',
  'pm.issues/change-owner': 'managed',
  'pm.issues/delete': null,
  'pm.attachments/upload': 'visible',
};

/** The authorization resource type the businesses are registered under; every business id starts with it. */
export const RESOURCE_TYPE = 'pm';

/** The permission workspace subsection (under business) that lists the businesses. */
export const BUSINESS_SECTION = 'pm';

/**
 * The levels an action whose records relate to users (`RELATIONS`) is registered at, lowest first, each its own
 * authorization action: `edit.related` reaches the related records, `edit.all` every one. An action without related
 * records is registered as itself (`create`), held or not. Holding a level reaches at least what the lower ones do, so
 * the application takes the highest one held.
 */
export const ACTION_LEVELS = ['related', 'all'] as const;

export type ActionLevel = (typeof ACTION_LEVELS)[number];

/** The authorization actions a business action is registered as, lowest level first. */
export function levelActionsOf(
  key: BusinessKey,
): readonly { readonly level: ActionLevel; readonly name: string }[] {
  const action = key.slice(key.indexOf('/') + 1);
  return RELATIONS[key]
    ? ACTION_LEVELS.map((level) => ({ level, name: `${action}.${level}` }))
    : [{ level: 'all', name: action }];
}

const camel = (name: string): string =>
  name.replace(/-([a-z])/gu, (_, letter: string) => letter.toUpperCase());

/** `pm.issues` → `issues`: a business's key in the locales. */
const localName = (business: string): string =>
  business.slice(business.indexOf('.') + 1);

/** A business's title or its one-line description (`access.businesses.issues.title`). */
export function businessText(
  business: Business,
  part: 'title' | 'description',
): { readonly key: string; readonly ns: string } {
  return accessText(`businesses.${localName(business)}.${part}`);
}

/**
 * A business action's title, its one-line description, the title of one of its levels, or the wording of its `related`
 * level: `relatedLabel`, its short name in a level choice ("in projects I can see"), and `relatedHint`, one line on what
 * it reaches. An application reads the last two beside the `related` level's registered title.
 */
export function actionText(
  key: BusinessKey,
  part: 'title' | 'description' | ActionLevel | 'relatedLabel' | 'relatedHint',
): { readonly key: string; readonly ns: string } {
  const [business = '', action = ''] = key.split('/');
  return accessText(
    `businesses.${localName(business)}.actions.${camel(action)}.${part}`,
  );
}

/** Every business action at `none`, the start of a new role. */
export function noAbilities(): Record<BusinessKey, Scope> {
  return Object.fromEntries(
    BUSINESS_KEYS.map(({ key }) => [key, 'none']),
  ) as Record<BusinessKey, Scope>;
}

/** Every settings capability off. */
export function noSettings(): Record<SettingsKey, boolean> {
  return Object.fromEntries(
    SETTINGS_KEYS.map(({ key }) => [key, false]),
  ) as Record<SettingsKey, boolean>;
}

// ---------------------------------------------------------------------------------------------------------------------
// Permission groups for scoped API keys
// ---------------------------------------------------------------------------------------------------------------------

/**
 * One permission a key-scope level covers: a page, a settings action or a business action. The same shape as the API
 * keys plugin's `AccessRef`, written here so this plugin does not depend on it; the application assembles the groups.
 */
export type KeyScopeAccess =
  | { readonly kind: 'page'; readonly id: Page }
  | {
      readonly kind: 'settings';
      readonly id: SettingsItem;
      readonly action: string;
    }
  | {
      readonly kind: 'business';
      readonly id: Business;
      readonly action: string;
    };

/** A permission group a scoped API key may hold, structurally the API keys plugin's `KeyScopeGroupDeclaration`. */
export interface KeyScopeGroup {
  readonly id: string;
  readonly category: 'business' | 'administration' | 'account';
  readonly title: { readonly key: string; readonly ns: string };
  readonly description?: { readonly key: string; readonly ns: string };
  readonly levels: {
    readonly read?: readonly KeyScopeAccess[];
    readonly write?: readonly KeyScopeAccess[];
    readonly admin?: readonly KeyScopeAccess[];
  };
  readonly objects?: {
    readonly business: Business;
    readonly title: { readonly key: string; readonly ns: string };
    readonly allowsUnscoped?: readonly KeyScopeAccess[];
  };
}

const projectsAction = (
  action: BusinessAction<'pm.projects'>,
): KeyScopeAccess => ({ kind: 'business', id: 'pm.projects', action });
const issuesAction = (action: BusinessAction<'pm.issues'>): KeyScopeAccess => ({
  kind: 'business',
  id: 'pm.issues',
  action,
});
const setting = (
  item: 'pm.general' | 'pm.labels' | 'pm.workflows',
  action: 'read' | 'update',
): KeyScopeAccess => ({ kind: 'settings', id: item, action });

/**
 * What a scoped key may be given here. Levels include the ones below them. A key limited to some projects
 * (`objects('pm.projects')`) sees only those projects and their issues; issues follow the projects group's selection
 * and have none of their own. Members and roles are the application's group, not this plugin's.
 */
export const KEY_SCOPE_GROUPS: readonly KeyScopeGroup[] = [
  {
    id: 'projects.projects',
    category: 'business',
    title: accessText('keyScopes.projects.title'),
    description: accessText('keyScopes.projects.description'),
    levels: {
      read: [{ kind: 'page', id: 'pm-projects' }, projectsAction('view')],
      write: [projectsAction('manage')],
      admin: [projectsAction('create'), projectsAction('delete')],
    },
    objects: {
      business: 'pm.projects',
      title: accessText('keyScopes.projects.objects'),
      allowsUnscoped: [projectsAction('create'), projectsAction('delete')],
    },
  },
  {
    id: 'projects.issues',
    category: 'business',
    title: accessText('keyScopes.issues.title'),
    description: accessText('keyScopes.issues.description'),
    levels: {
      read: [
        { kind: 'page', id: 'pm-issues' },
        { kind: 'page', id: 'pm-my-issues' },
        issuesAction('view'),
      ],
      write: [
        issuesAction('create'),
        issuesAction('edit'),
        issuesAction('comment'),
        issuesAction('close'),
        issuesAction('change-owner'),
        { kind: 'business', id: 'pm.attachments', action: 'upload' },
      ],
      admin: [issuesAction('moderate-comments'), issuesAction('delete')],
    },
  },
  {
    id: 'projects.settings',
    category: 'administration',
    title: accessText('keyScopes.settings.title'),
    description: accessText('keyScopes.settings.description'),
    levels: {
      read: [
        setting('pm.general', 'read'),
        setting('pm.labels', 'read'),
        setting('pm.workflows', 'read'),
      ],
      write: [
        setting('pm.general', 'update'),
        setting('pm.labels', 'update'),
        setting('pm.workflows', 'update'),
      ],
    },
  },
];

/** Presets this plugin suggests for a scoped key; none yet. */
export const KEY_SCOPE_PRESETS: readonly never[] = [];
