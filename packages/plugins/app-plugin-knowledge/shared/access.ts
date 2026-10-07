/**
 * What this plugin offers to be granted: its page and the business actions of its spaces, with the levels each offers.
 * The plugin registers the actions with the authorization plugin from here (the `kb` resource type, each level its own
 * action: `read.related`, `read.all`; `server/providers/authorization.ts`). The application that assembles it keeps
 * the roles and stores the grants; the plugin never decides who may do what on its own: it asks the application's
 * access resolver (`knowledgeAccessToken`, `server/tokens.ts`) what a reader may do in each space, and an application
 * builds that answer from these actions.
 */

/** The namespace of the plugin's wording, in its locales (`client/locales`). */
export const ACCESS_NAMESPACE = '@nocobase/app-plugin-knowledge';

/** The app page a role may open (`page` grant, action `access`): the knowledge page (`client/routes.ts`). */
export const PAGES = ['knowledge'] as const;

export type Page = (typeof PAGES)[number];

/** The plugin has no settings items. */
export const SETTINGS_ACTIONS = {} as const;

/**
 * Business actions on the documents of a space, each reaching every space, none, or the spaces the application relates
 * to a set of users (`Scope`). What "related" means is the application's: the assembling application relates the system space to everyone
 * and a project's space to the people who see the project (`read`, `propose`) or lead it (`edit`).
 *
 * | Action    | What it allows                                                                       |
 * | --------- | ------------------------------------------------------------------------------------ |
 * | `read`    | read a space's documents, their versions and search them                             |
 * | `propose` | propose a change, a new document or a verification for someone who may edit         |
 * | `edit`    | edit, create, move, archive, restore and mark verified; decide proposals             |
 * | `manage`  | `edit`, and change who may do what on each folder and article; never locked out      |
 *
 * Folders and articles may narrow or widen a space's access with entries of their own (`docs/permissions.md`); whoever
 * may `manage` a space keeps managing every node in it. An actor that is not a person (an agent acting for someone)
 * holds at most `read` and `propose`: it never edits.
 */
export const BUSINESS_ACTIONS = {
  'kb.knowledge': ['read', 'propose', 'edit', 'manage'],
} as const;

export type Business = keyof typeof BUSINESS_ACTIONS;
export type BusinessAction<B extends Business = Business> =
  (typeof BUSINESS_ACTIONS)[B][number];
export type KnowledgeAction = BusinessAction<'kb.knowledge'>;

/** `business/action`, the key of a scope in a caller's permissions. */
export type BusinessKey = {
  [B in Business]: `${B}/${BusinessAction<B>}`;
}[Business];

/**
 * How far a business action reaches for a caller: every space, none, or the spaces related to any of `users`. The
 * application resolves the level a role gives to this; an empty set reaches nothing.
 */
export type Scope = 'all' | 'none' | { readonly users: readonly string[] };

/** Whether `scope` reaches a space related to any of `userIds` (null and undefined relate nothing). */
export function reaches(
  scope: Scope,
  ...userIds: readonly (string | null | undefined)[]
): boolean {
  if (scope === 'all') return true;
  if (scope === 'none') return false;
  return userIds.some((id) => !!id && scope.users.includes(id));
}

/** How a space relates to a user, as the application words it. */
export type Relation = 'related';

/** Each business action's relation: every one reaches the spaces the application relates to the user. */
export const RELATIONS: Readonly<Record<BusinessKey, Relation | null>> = {
  'kb.knowledge/read': 'related',
  'kb.knowledge/propose': 'related',
  'kb.knowledge/edit': 'related',
  'kb.knowledge/manage': 'related',
};

/** The actions an actor that is not a person may hold at most. */
export const ACTOR_ACTIONS: readonly BusinessKey[] = [
  'kb.knowledge/read',
  'kb.knowledge/propose',
];

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

/** A title as the authorization plugin stores it: an i18n key in this plugin's namespace. */
export function accessText(key: string): {
  readonly key: string;
  readonly ns: string;
} {
  return { key: `access.${key}`, ns: ACCESS_NAMESPACE };
}

/** The authorization resource type the businesses are registered under; every business id starts with it. */
export const RESOURCE_TYPE = 'kb';

/** The permission workspace subsection (under business) that lists the businesses. */
export const BUSINESS_SECTION = 'kb';

/**
 * The levels an action whose spaces relate to users (`RELATIONS`) is registered at, lowest first, each its own
 * authorization action: `read.related` reaches the related spaces, `read.all` every one. Holding a level reaches at
 * least what the lower ones do, so the application takes the highest one held.
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

/** A business's title or its one-line description (`access.businesses.knowledge.title`). */
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
