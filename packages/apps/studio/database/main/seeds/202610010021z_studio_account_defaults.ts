import type { Knex } from 'knex';
import { defineSeed, type SeedDefinition } from '@nocobase/db';

// Frozen fresh-install definitions, provisioned before the historical role seed.
// Existing role history or definitions never qualify for the four new defaults.

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
  { key: 'admin', admin: true },
  { key: 'owner', admin: true },
] as const;

const seed: SeedDefinition = defineSeed({
  name: '202610010021z_studio_account_defaults',
  transaction: true,

  async run({ query, connection, config }) {
    const historyTable =
      config.get<string>('database.connections.main.seeds.tableName') ??
      '__nocobase_seeds';
    const client = await connection.client<Knex>();
    if (
      await client(historyTable)
        .where({ name: '202610010022_studio_roles' })
        .first()
    )
      return;
    if (
      await client(historyTable)
        .where('name', 'like', '%studio%')
        .where('name', '>', '202610010022_studio_roles')
        .first()
    )
      throw new Error(
        'STUDIO_INITIALIZATION_UNKNOWN: later Studio seed history exists without role initialization',
      );
    const rootSet =
      config.get<string>('authorization.permissionSets.rootSet') ?? 'root';
    const defaultSet =
      config.get<string>('authorization.permissionSets.defaultSet') ?? 'member';
    const requiredSets = [...new Set([rootSet, defaultSet])];
    const initialized = await query
      .selectFrom('authorizationPermissionSets')
      .select('key')
      .where('key', 'in', requiredSets)
      .execute();
    if (initialized.length !== requiredSets.length)
      throw new Error(
        'STUDIO_INITIALIZATION_UNKNOWN: platform permission initialization is incomplete',
      );
    if (
      (
        await query
          .selectFrom('authorizationPermissionSets')
          .select('key')
          .where('key', 'in', ['admin', 'owner', 'contributor'])
          .execute()
      ).length
    )
      throw new Error(
        'STUDIO_INITIALIZATION_UNKNOWN: existing Studio roles without trusted initialization history',
      );
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
          grants: JSON.stringify([
            ...grants(set.admin),
            ...(set.admin
              ? [
                  {
                    resource: { type: 'user', id: '*' },
                    actions: [
                      'update',
                      'disable',
                      'enable',
                      'reset-password',
                    ].map((action) => ({ action })),
                  },
                ]
              : []),
          ]),
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }
  },
});

export default seed;
