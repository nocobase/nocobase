/**
 * What this plugin offers to be granted: its pages, settings items and business actions with the levels each offers.
 * The plugin registers its settings items and its businesses (the `rel` resource type, each level of an action its own
 * action: `deploy.related`, `deploy.all`) with the authorization plugin from here; the application that assembles it
 * keeps the roles, stores the grants and tells the plugin each caller's `ReleasesPermissions` through `releasesAccessToken`
 * (`server/tokens.ts`). The client reads the signed-in user's permissions (`GET /api/releases/me`) to show only what the
 * server would allow.
 */

/** The namespace of every title below, in the plugin's locales (`shared/locales/access.*.ts`). */
export const ACCESS_NAMESPACE = '@nocobase/app-plugin-releases';

/** A title as the authorization plugin stores it: an i18n key in this plugin's namespace. */
export function accessText(key: string): {
  readonly key: string;
  readonly ns: string;
} {
  return { key: `access.${key}`, ns: ACCESS_NAMESPACE };
}

/** The authorization workspace subsection (under administration) that lists the settings items. */
export const ACCESS_SECTION = 'releases';

/**
 * The app pages a role may open (`page` grants, action `access`); the client routes are named and authorized by the
 * same ids. `rel-apps` lists Apps and opens their deployments.
 */
export const PAGES = ['rel-apps'] as const;

export type Page = (typeof PAGES)[number];

/**
 * Settings items. `rel.environments`: `read` lists environments and their runtime status, `manage` adds, edits and
 * removes them, writes their credentials and marks them protected.
 */
export const SETTINGS_ACTIONS = {
  'rel.environments': ['read', 'manage'],
} as const;

export type SettingsItem = keyof typeof SETTINGS_ACTIONS;
export type SettingsAction<S extends SettingsItem = SettingsItem> =
  (typeof SETTINGS_ACTIONS)[S][number];

/** `item/action`, the key of a capability in `ReleasesPermissions.settings`. */
export type SettingsKey = {
  [S in SettingsItem]: `${S}/${SettingsAction<S>}`;
}[SettingsItem];

/**
 * Business actions on Apps, each reaching every App, none, or the Apps related to a set of users (`Scope`). An App is
 * related to the user who created it; the assembling application may relate more (`ReleasesAccess.isRelated`,
 * `ReleasesAccess.relatedAppIds`).
 *
 * | Action             | What it allows                                                                        |
 * | ------------------ | ------------------------------------------------------------------------------------- |
 * | `view`             | see the App, its releases and deployment history and its runtime status               |
 * | `read-logs`        | read the App's runtime logs and its deployment logs                                    |
 * | `create`           | create Apps (offers only none or all)                                                  |
 * | `configure`        | read and change the App's configuration and settings, labels and expiry                |
 * | `upload`           | upload releases, request upload tickets, promote releases into the App, label releases |
 * | `deploy`           | deploy and roll back on an unprotected environment, request a deployment anywhere      |
 * | `deploy-protected` | approve deployments to a protected environment that names no approvers; people only   |
 * | `operate`          | start, stop and restart                                                                |
 * | `delete`           | delete the App with its data                                                           |
 */
export const BUSINESS_ACTIONS = {
  'rel.apps': [
    'view',
    'read-logs',
    'create',
    'configure',
    'upload',
    'deploy',
    'deploy-protected',
    'operate',
    'delete',
  ],
} as const;

export type Business = keyof typeof BUSINESS_ACTIONS;
export type BusinessAction<B extends Business = Business> =
  (typeof BUSINESS_ACTIONS)[B][number];
export type AppAction = BusinessAction<'rel.apps'>;

/** `business/action`, the key of a scope in `ReleasesPermissions.scopes`. */
export type BusinessKey = {
  [B in Business]: `${B}/${BusinessAction<B>}`;
}[Business];

/**
 * How far a business action reaches for a caller: every App, none, or the Apps related to any of `users`
 * (`RELATIONS`). The application resolves the level a role gives to this; an empty set reaches nothing.
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
 * How an App relates to a user, as the application words it: they created it, or the application relates it to them.
 */
export type Relation = 'owned';

/** Each business action's relation; null where the action has no records to relate, so it is held or not. */
export const RELATIONS: Readonly<Record<BusinessKey, Relation | null>> = {
  'rel.apps/view': 'owned',
  'rel.apps/read-logs': 'owned',
  'rel.apps/create': null,
  'rel.apps/configure': 'owned',
  'rel.apps/upload': 'owned',
  'rel.apps/deploy': 'owned',
  'rel.apps/deploy-protected': 'owned',
  'rel.apps/operate': 'owned',
  'rel.apps/delete': 'owned',
};

/** The authorization resource type the businesses are registered under; every business id starts with it. */
export const RESOURCE_TYPE = 'rel';

/** The permission workspace subsection (under business) that lists the businesses. */
export const BUSINESS_SECTION = 'rel';

/**
 * The levels an action whose Apps relate to users (`RELATIONS`) is registered at, lowest first, each its own
 * authorization action: `deploy.related` reaches the related Apps, `deploy.all` every one. An action without related
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

/** The resource a business's actions are granted on. */
export function businessResource(business: Business): {
  readonly type: string;
  readonly id: string;
} {
  return { type: RESOURCE_TYPE, id: business };
}

const camel = (name: string): string =>
  name.replace(/-([a-z])/gu, (_, letter: string) => letter.toUpperCase());

const localName = (business: string): string =>
  business.slice(business.indexOf('.') + 1);

/** A business's title or its one-line description (`access.businesses.apps.title`). */
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

/**
 * Actions an agent or a key may never perform, whatever its grants: the assembling application marks a caller as an
 * agent (`ReleasesAccess.actorKindOf`), a request made with a scoped credential is a key, and the plugin refuses these
 * for both.
 */
export const HUMAN_ONLY_ACTIONS: readonly AppAction[] = [
  'deploy-protected',
  'delete',
  'configure',
];

/** What a caller may do, decided once per request by the assembling application. */
export interface ReleasesPermissions {
  readonly scopes: Readonly<Record<BusinessKey, Scope>>;
  readonly settings: Readonly<Record<SettingsKey, boolean>>;
  readonly pages: Readonly<Record<Page, boolean>>;
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

/** Nothing allowed: the start of a new role, and what an unknown caller holds. */
export function noPermissions(): ReleasesPermissions {
  return {
    scopes: Object.fromEntries(
      BUSINESS_KEYS.map(({ key }) => [key, 'none']),
    ) as Record<BusinessKey, Scope>,
    settings: Object.fromEntries(
      SETTINGS_KEYS.map(({ key }) => [key, false]),
    ) as Record<SettingsKey, boolean>,
    pages: Object.fromEntries(PAGES.map((page) => [page, false])) as Record<
      Page,
      boolean
    >,
  };
}

/** Everything allowed, at `all`: what the plugin's own background work acts with. */
export function allPermissions(): ReleasesPermissions {
  return {
    scopes: Object.fromEntries(
      BUSINESS_KEYS.map(({ key }) => [key, 'all']),
    ) as Record<BusinessKey, Scope>,
    settings: Object.fromEntries(
      SETTINGS_KEYS.map(({ key }) => [key, true]),
    ) as Record<SettingsKey, boolean>,
    pages: Object.fromEntries(PAGES.map((page) => [page, true])) as Record<
      Page,
      boolean
    >,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// API key scopes
// ---------------------------------------------------------------------------------------------------------------------

/** A permission an API key's scope may cover: a page, a settings action or a business action of this plugin. */
type KeyScopeAccess =
  | { readonly kind: 'page'; readonly id: Page }
  | {
      readonly kind: 'settings';
      readonly id: SettingsItem;
      readonly action: string;
    }
  | {
      readonly kind: 'business';
      readonly id: Business;
      readonly action: AppAction;
    };

/**
 * The permission groups this plugin offers to API keys with a scope, as data the application hands to the API keys
 * plugin (the shape of its `KeyScopeGroupDeclaration`; nothing here imports it). Each level includes the ones before.
 *
 * - `releases.apps`: read sees Apps, their releases, deployments and logs; write also uploads, deploys and starts or
 *   stops them — what CI needs. It may be limited to some Apps (`objects`), which the guard enforces. Configuring,
 *   creating and deleting Apps are not offered: a key may never configure or delete one (`HUMAN_ONLY_ACTIONS`), and
 *   CI has no need to create them.
 * - `releases.environments`: read lists the environments, write manages them.
 *
 * Whatever its scope, a key never deploys directly to a protected environment, and nobody else does either; it may ask
 * for a deployment there (a deployment request) when it may deploy the App.
 */
export const KEY_SCOPE_GROUPS: readonly {
  readonly id: string;
  readonly category: 'business' | 'administration' | 'account';
  readonly title: { readonly key: string; readonly ns: string };
  readonly description?: { readonly key: string; readonly ns: string };
  readonly levels: Readonly<
    Partial<Record<'read' | 'write' | 'admin', readonly KeyScopeAccess[]>>
  >;
  readonly objects?: {
    readonly business: Business;
    readonly title: { readonly key: string; readonly ns: string };
  };
}[] = [
  {
    id: 'releases.apps',
    category: 'business',
    title: accessText('keyScopes.apps.title'),
    description: accessText('keyScopes.apps.description'),
    levels: {
      read: [
        { kind: 'page', id: 'rel-apps' },
        { kind: 'business', id: 'rel.apps', action: 'view' },
        { kind: 'business', id: 'rel.apps', action: 'read-logs' },
      ],
      // Uploading is apart from deploying: a CI that only builds holds `write`, one that also ships holds `admin`.
      write: [{ kind: 'business', id: 'rel.apps', action: 'upload' }],
      admin: [
        { kind: 'business', id: 'rel.apps', action: 'deploy' },
        { kind: 'business', id: 'rel.apps', action: 'operate' },
      ],
    },
    objects: {
      business: 'rel.apps',
      title: accessText('keyScopes.apps.objects'),
    },
  },
  {
    id: 'releases.environments',
    category: 'administration',
    title: accessText('keyScopes.environments.title'),
    description: accessText('keyScopes.environments.description'),
    levels: {
      read: [{ kind: 'settings', id: 'rel.environments', action: 'read' }],
      write: [{ kind: 'settings', id: 'rel.environments', action: 'manage' }],
    },
  },
];

/**
 * Presets for a key's scope, for the Apps chosen and 90 days: "CI deploy" uploads and deploys (`acme release upload`
 * then `acme deploy`), "CI upload" only uploads.
 */
export const KEY_SCOPE_PRESETS: readonly {
  readonly id: string;
  readonly title: { readonly key: string; readonly ns: string };
  readonly description?: { readonly key: string; readonly ns: string };
  readonly groups: Readonly<
    Record<
      string,
      {
        readonly level: 'read' | 'write' | 'admin';
        readonly objects?: 'all' | 'pick';
      }
    >
  >;
  readonly expiresInDays?: number | null;
}[] = [
  {
    id: 'ci-deploy',
    title: accessText('keyScopes.presets.ciDeploy.title'),
    description: accessText('keyScopes.presets.ciDeploy.description'),
    groups: { 'releases.apps': { level: 'admin', objects: 'pick' } },
    expiresInDays: 90,
  },
  {
    id: 'ci-upload',
    title: accessText('keyScopes.presets.ciUpload.title'),
    description: accessText('keyScopes.presets.ciUpload.description'),
    groups: { 'releases.apps': { level: 'write', objects: 'pick' } },
    expiresInDays: 90,
  },
];
