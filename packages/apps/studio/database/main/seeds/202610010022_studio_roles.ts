import { defineSeed, type SeedDefinition } from '@nocobase/db';

// Studio's built-in roles, as permission sets of the authorization plugin (`server/access`):
//
// - `contributor`: every page, the everyday business actions on related records, and reading every settings item
//   (so the agent pages show the team's agents, skills and runtimes), changing only the agents they own and the skills
//   they created (`agents.agents` `edit` at related). For release management:
//   viewing, reading logs, configuring, uploading, deploying and operating the Apps related to them (ones they
//   created, or linked to a repository of a project they lead), but not creating or deleting Apps nor deploying to a
//   protected environment; environments are read only. For the knowledge base: reading and proposing in the
//   projects they see (and the system documents), editing and managing who may access each folder and article in the
//   projects they lead, but not the system knowledge page. Creating API keys of their own (`studio.personalApiKeys`), but not seeing the organization's API keys
//   (`studio.apiKeys`), the connections to code hosts (`studio.git`) nor the knowledge search settings
//   (`studio.knowledgeSearch`).
// - `admin` and `owner`: every page, every business action on every record, and everything in the settings, the
//   organization's API keys included.
//
// The users holding the platform's `root` set (seeded earlier, `202608240001`) become owners and contributors, so a new
// installation's initial administrator owns it. Missing sets and assignments only are added; nothing an administrator
// changes later is undone, since seeds do not run again.
//
// Each business action is granted on its plugin's resource type (the business id's prefix: `pm`, `agents`, `rel`, `kb`)
// as the action of its level: `edit.related`, `edit.all`; an action without levels (`create`) as itself.
//
// Self-contained on purpose: a seed is a fixed historical operation, so nothing is imported from server/ or shared/.
// The names below match what the projects, agents, release management and knowledge plugins register from their
// `shared/access.ts` (the knowledge plugin's `knowledge` page and `kb.knowledge` actions) and Studio's own
// `shared/access.ts` (the `reports` page, the `studio.apiKeys`, `studio.personalApiKeys`, `studio.git` and
// `studio.knowledgeSearch` settings), as Studio's `server/access` reads them.

const APP_NS = '@nocobase/i18n/application';

type Level = 'related' | 'all';

interface Action {
  readonly action: string;
}

interface Grant {
  readonly resource: { readonly type: string; readonly id: string };
  readonly actions: readonly Action[];
}

/**
 * Each business action, whether it has levels (`levels: false`: granted as itself, held or not), and what a
 * contributor gets (null: nothing); admins and owners get `all`.
 */
const BUSINESS: readonly {
  readonly business: string;
  readonly action: string;
  readonly levels?: false;
  readonly contributor: Level | null;
}[] = [
  { business: 'pm.projects', action: 'view', contributor: 'related' },
  {
    business: 'pm.projects',
    action: 'create',
    levels: false,
    contributor: 'all',
  },
  { business: 'pm.projects', action: 'manage', contributor: 'related' },
  {
    business: 'pm.projects',
    action: 'delete',
    levels: false,
    contributor: null,
  },
  { business: 'pm.issues', action: 'view', contributor: 'related' },
  { business: 'pm.issues', action: 'create', contributor: 'related' },
  { business: 'pm.issues', action: 'edit', contributor: 'related' },
  { business: 'pm.issues', action: 'comment', contributor: 'related' },
  {
    business: 'pm.issues',
    action: 'moderate-comments',
    contributor: 'related',
  },
  { business: 'pm.issues', action: 'close', contributor: 'related' },
  { business: 'pm.issues', action: 'change-owner', contributor: 'related' },
  {
    business: 'pm.issues',
    action: 'delete',
    levels: false,
    contributor: null,
  },
  { business: 'pm.attachments', action: 'upload', contributor: 'related' },
  { business: 'agents.agents', action: 'edit', contributor: 'related' },
  { business: 'rel.apps', action: 'view', contributor: 'related' },
  { business: 'rel.apps', action: 'read-logs', contributor: 'related' },
  { business: 'rel.apps', action: 'create', levels: false, contributor: null },
  { business: 'rel.apps', action: 'configure', contributor: 'related' },
  { business: 'rel.apps', action: 'upload', contributor: 'related' },
  { business: 'rel.apps', action: 'deploy', contributor: 'related' },
  { business: 'rel.apps', action: 'deploy-protected', contributor: null },
  { business: 'rel.apps', action: 'operate', contributor: 'related' },
  { business: 'rel.apps', action: 'delete', contributor: null },
  { business: 'kb.knowledge', action: 'read', contributor: 'related' },
  { business: 'kb.knowledge', action: 'propose', contributor: 'related' },
  { business: 'kb.knowledge', action: 'edit', contributor: 'related' },
  { business: 'kb.knowledge', action: 'manage', contributor: 'related' },
];

const PAGES = [
  'pm-my-issues',
  'pm-issues',
  'pm-projects',
  'agents',
  'runtimes',
  'skills',
  'usage',
  'rel-apps',
  'reports',
];

/** Pages only administrators and owners open: the system knowledge page. */
const ADMIN_PAGES = ['knowledge'];

const SETTINGS: Readonly<Record<string, readonly string[]>> = {
  'pm.general': ['read', 'update'],
  'pm.labels': ['read', 'update'],
  'pm.workflows': ['read', 'update'],
  'pm.members': ['read', 'invite', 'assign', 'define-roles'],
  'agents.agents': ['read', 'manage'],
  'agents.prices': ['read', 'manage'],
  'agents.services': ['read', 'manage'],
  'agents.runners': ['read', 'manage'],
  'rel.environments': ['read', 'manage'],
  'studio.apiKeys': ['read', 'manage'],
  'studio.personalApiKeys': ['create'],
  'studio.git': ['read', 'manage'],
  'studio.knowledgeSearch': ['read', 'manage'],
};

/** What a contributor holds of a settings item, where it is not `read` alone. */
const CONTRIBUTOR_SETTINGS: Readonly<Record<string, readonly string[]>> = {
  'studio.apiKeys': [],
  'studio.personalApiKeys': ['create'],
  'studio.git': [],
  'studio.knowledgeSearch': [],
};

function grants(admin: boolean): Grant[] {
  const business = new Map<string, Action[]>();
  for (const entry of BUSINESS) {
    const level = admin ? 'all' : entry.contributor;
    if (level === null) continue;
    const actions = business.get(entry.business) ?? [];
    actions.push({
      action:
        entry.levels === false ? entry.action : `${entry.action}.${level}`,
    });
    business.set(entry.business, actions);
  }
  return [
    ...[...PAGES, ...(admin ? ADMIN_PAGES : [])].map((id) => ({
      resource: { type: 'page', id },
      actions: [{ action: 'access' }],
    })),
    ...Object.entries(SETTINGS)
      .map(([id, actions]) => ({
        resource: { type: 'settings', id },
        actions: (admin ? actions : (CONTRIBUTOR_SETTINGS[id] ?? ['read'])).map(
          (action) => ({ action }),
        ),
      }))
      .filter((grant) => grant.actions.length > 0),
    ...[...business].map(([id, actions]) => ({
      resource: { type: id.slice(0, id.indexOf('.')), id },
      actions,
    })),
  ];
}

const SETS = [
  { key: 'contributor', admin: false },
  { key: 'admin', admin: true },
  { key: 'owner', admin: true },
] as const;

const seed: SeedDefinition = defineSeed({
  name: '202610010022_studio_roles',
  transaction: true,

  async run({ query }) {
    const now = new Date();
    for (const set of SETS) {
      const existing = await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', set.key)
        .executeTakeFirst();
      if (existing) continue;
      await query
        .insertInto('authorizationPermissionSets')
        .values({
          id: crypto.randomUUID(),
          key: set.key,
          title: JSON.stringify({ key: `roles.${set.key}`, ns: APP_NS }),
          grants: JSON.stringify(grants(set.admin)),
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }

    const roots = await query
      .selectFrom('authorizationPermissionSetAssignments')
      .select('subjectId')
      .where('permissionSetKey', '=', 'root')
      .where('subjectType', '=', 'user')
      .execute();
    for (const root of roots) {
      const userId = String(root.subjectId);
      for (const key of ['owner', 'contributor']) {
        const id = `user:${userId}:${key}`;
        const existing = await query
          .selectFrom('authorizationPermissionSetAssignments')
          .select('id')
          .where('id', '=', id)
          .executeTakeFirst();
        if (existing) continue;
        await query
          .insertInto('authorizationPermissionSetAssignments')
          .values({
            id,
            subjectType: 'user',
            subjectId: userId,
            permissionSetKey: key,
            createdAt: now,
            updatedAt: now,
          })
          .execute();
      }
    }
  },
});

export default seed;
