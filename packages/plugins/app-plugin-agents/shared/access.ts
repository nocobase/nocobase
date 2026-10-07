/**
 * What this plugin offers to be granted: its pages and its settings items. The application that assembles the plugin
 * keeps the roles, and composes these declarations with its other plugins' into one role catalog.
 *
 * - The pages (`page` grants, action `access`) are the Agent team section: agents, runtimes (with "Add runtime"),
 *   skills and usage. A page grant only opens the page; what the page shows and changes is governed by the settings
 *   items below. The usage page's API (`GET agents/usage`) checks
 *   its grant too, and counts every run for a reader of agents.
 * - `agents.agents` covers agents, skills and every run; reading lets someone see them (and every runner, to pick
 *   where an agent runs), managing lets them change agents and skills and cancel or retry any run. Without it, a
 *   person still sees and cancels the runs they started.
 * - `agents.runners` covers every runner and every job: reading lets someone see them, managing lets them change,
 *   revoke and delete any runner and add one shared with the team. Without it, a person still adds personal runners
 *   and manages the ones they added; reading agents also shows every runner (to pick where an agent runs).
 * - `agents.prices` covers the model prices costs are estimated from: reading shows them, managing changes them.
 * - `agents.services` covers the model services online agents call: reading lists them (never their keys), managing
 *   adds, edits, tests and deletes them, fetches a provider's models and sets their keys. Picking a service and a model
 *   for an agent needs neither: the catalog names what is offered.
 * - The `agents.agents` business action `edit` reaches further than none or every agent: for a set of users it reaches
 *   the agents they own and the skills they created, without managing agents (see `BUSINESS_ACTIONS`). The plugin
 *   registers it as the `agents` resource type, each level its own action (`edit.related`, `edit.all`).
 */

/** The namespace of every title below, in the plugin's locales. */
export const ACCESS_NAMESPACE = '@nocobase/app-plugin-agents';

export function accessText(key: string): {
  readonly key: string;
  readonly ns: string;
} {
  return { key: `access.${key}`, ns: ACCESS_NAMESPACE };
}

/** The app pages a role may open; the client routes (`client/routes.ts`) are named and authorized by the same ids. */
export const PAGES = ['agents', 'runtimes', 'skills', 'usage'] as const;

export type Page = (typeof PAGES)[number];

export const SETTINGS_ACTIONS = {
  'agents.agents': ['read', 'manage'],
  'agents.runners': ['read', 'manage'],
  'agents.prices': ['read', 'manage'],
  'agents.services': ['read', 'manage'],
} as const;

export type SettingsItem = keyof typeof SETTINGS_ACTIONS;

export type SettingsAction = 'read' | 'manage';

/**
 * Business actions, each reaching every record, none, or the records related to a set of users (`Scope`). The
 * application that keeps the roles tells the plugin a caller's scope (`agentsAccessToken`); managing agents
 * (`agents.agents` `manage` above) reaches every record whatever the scope.
 *
 * | Action               | What it allows                                                                              |
 * | -------------------- | ------------------------------------------------------------------------------------------- |
 * | `agents.agents/edit` | change an agent (its settings, skills and variables; archive, restore and delete it) and   |
 * |                      | edit a skill (save it, restore a version). Related to a user: the agents they own, the      |
 * |                      | skills they created. Creating agents and skills, and deleting skills, still needs `manage`. |
 *
 * An agent edited this way is still given only what its editor may grant: someone who does not manage agents adds to
 * an agent only the business actions they hold themselves, and does not hand the agent to another owner.
 */
export const BUSINESS_ACTIONS = {
  'agents.agents': ['edit'],
} as const;

export type Business = keyof typeof BUSINESS_ACTIONS;
export type BusinessAction<B extends Business = Business> =
  (typeof BUSINESS_ACTIONS)[B][number];

/** `business/action`, the key of a level. */
export type BusinessKey = {
  [B in Business]: `${B}/${BusinessAction<B>}`;
}[Business];

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

/**
 * How far a business action reaches for a caller: every record, none, or the records related to any of `users`
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

/** How a record relates to a user, as the application words it: the agents they own and the skills they created. */
export type Relation = 'own';

/** Each business action's relation; null where the action has no records to relate, so it is held or not. */
export const RELATIONS: Readonly<Record<BusinessKey, Relation | null>> = {
  'agents.agents/edit': 'own',
};

/** The authorization resource type the businesses are registered under; every business id starts with it. */
export const RESOURCE_TYPE = 'agents';

/** The permission workspace subsection (under business) that lists the businesses. */
export const BUSINESS_SECTION = 'agents.business';

/**
 * The levels an action whose records relate to users (`RELATIONS`) is registered at, lowest first, each its own
 * authorization action: `edit.related` reaches the related records, `edit.all` every one. An action without related
 * records is registered as itself, held or not. Holding a level reaches at least what the lower ones do, so the
 * application takes the highest one held.
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

const localName = (business: string): string =>
  business.slice(business.indexOf('.') + 1);

/** A business's title or its one-line description (`access.businesses.agents.title`). */
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
    `businesses.${localName(business)}.actions.${action}.${part}`,
  );
}

/** The authorization workspace subsection (under administration) that lists the settings items. */
export const ACCESS_SECTION = 'agents';

/**
 * One permission a key-scope level covers: a page, a settings action or a business action. The same shape as the API
 * keys plugin's `AccessRef`, written here so this plugin does not depend on it; the application assembles the groups.
 */
export type KeyScopeAccess =
  | { readonly kind: 'page'; readonly id: Page }
  | {
      readonly kind: 'settings';
      readonly id: SettingsItem;
      readonly action: SettingsAction;
    }
  | {
      readonly kind: 'business';
      readonly id: Business;
      readonly action: BusinessAction;
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
  };
}

const setting = (id: SettingsItem, action: SettingsAction): KeyScopeAccess => ({
  kind: 'settings',
  id,
  action,
});

/**
 * What a scoped key may be given here. None of them limits to some records: agents and prices have no record-level
 * checks to enforce a selection. Writing agents covers editing them at whatever level the key's user
 * holds.
 */
export const KEY_SCOPE_GROUPS: readonly KeyScopeGroup[] = [
  {
    id: 'agents.agents',
    category: 'business',
    title: accessText('keyScopes.agents.title'),
    description: accessText('keyScopes.agents.description'),
    levels: {
      read: [
        { kind: 'page', id: 'agents' },
        { kind: 'page', id: 'skills' },
        setting('agents.agents', 'read'),
      ],
      write: [
        setting('agents.agents', 'manage'),
        { kind: 'business', id: 'agents.agents', action: 'edit' },
      ],
    },
  },
  {
    id: 'agents.prices',
    category: 'administration',
    title: accessText('keyScopes.prices.title'),
    description: accessText('keyScopes.prices.description'),
    levels: {
      read: [setting('agents.prices', 'read')],
      write: [setting('agents.prices', 'manage')],
    },
  },
  {
    id: 'agents.runners',
    category: 'administration',
    title: accessText('keyScopes.runners.title'),
    description: accessText('keyScopes.runners.description'),
    levels: {
      read: [
        { kind: 'page', id: 'runtimes' },
        setting('agents.runners', 'read'),
      ],
      write: [setting('agents.runners', 'manage')],
    },
  },
  {
    // Reading only: managing sets provider keys, which a person does (the application lists `agents.services/manage`
    // among what no key holds).
    id: 'agents.services',
    category: 'administration',
    title: accessText('keyScopes.services.title'),
    description: accessText('keyScopes.services.description'),
    levels: { read: [setting('agents.services', 'read')] },
  },
];
