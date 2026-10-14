import type { Knex } from 'knex';
import { createHash } from 'node:crypto';
import { defineSeed } from '@nocobase/db';

const VERSION = 'pm358-v1';
type Action = { action: string; [key: string]: unknown };
type Grant = {
  resource: { type: string; id: string };
  actions: Action[];
  [key: string]: unknown;
};
const canonical = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonical)
    : value !== null && typeof value === 'object'
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([key, entry]) => [key, canonical(entry)]),
        )
      : value;
const hash = (text: string) =>
  createHash('sha256')
    .update(JSON.stringify(canonical(JSON.parse(text))))
    .digest('hex');

/** Frozen conversion: unknown or restricted legacy semantics stop the entire upgrade. */
export function convertStudioAccessGrants(input: readonly Grant[]): Grant[] {
  if (
    !Array.isArray(input) ||
    input.some(
      (grant: Grant) =>
        !grant ||
        typeof grant !== 'object' ||
        !grant.resource ||
        typeof grant.resource.type !== 'string' ||
        typeof grant.resource.id !== 'string' ||
        !Array.isArray(grant.actions) ||
        grant.actions.some(
          (entry: Action) => !entry || typeof entry.action !== 'string',
        ),
    )
  )
    throw new Error(
      'STUDIO_ACCESS_UNMAPPABLE: invalid historical grant payload',
    );
  const result: Grant[] = [];
  const add = (type: string, id: string, action: string) => {
    if (
      !result.some(
        (grant) =>
          grant.resource.type === type &&
          grant.resource.id === id &&
          Object.keys(grant).length === 2 &&
          Object.keys(grant.resource).length === 2 &&
          grant.actions.some(
            (entry) =>
              entry.action === action && Object.keys(entry).length === 1,
          ),
      )
    )
      result.push({ resource: { type, id }, actions: [{ action }] });
  };
  for (const grant of input as readonly Grant[]) {
    const legacy =
      grant.resource.type === 'settings' && grant.resource.id === 'pm.members';
    const replaced = grant.actions.filter((entry) =>
      ['read', 'assign', 'define-roles'].includes(entry.action),
    );
    if (
      grant.resource.type === 'settings' &&
      grant.resource.id === '*' &&
      (replaced.length > 0 ||
        grant.actions.some((entry) => entry.action === '*'))
    )
      throw new Error(
        'STUDIO_ACCESS_UNMAPPABLE: wildcard legacy member permissions require review',
      );
    if (legacy && grant.actions.some((entry) => entry.action === '*'))
      throw new Error(
        'STUDIO_ACCESS_UNMAPPABLE: wildcard member permissions require review',
      );
    if (!legacy || !replaced.length) {
      result.push(grant);
      continue;
    }
    if (
      Object.keys(grant).some(
        (key) => key !== 'resource' && key !== 'actions',
      ) ||
      Object.keys(grant.resource).some(
        (key) => key !== 'type' && key !== 'id',
      ) ||
      replaced.some((entry) =>
        Object.keys(entry).some((key) => key !== 'action'),
      )
    )
      throw new Error(
        'STUDIO_ACCESS_UNMAPPABLE: restricted legacy permissions require review',
      );
    const kept = grant.actions.filter((entry) => !replaced.includes(entry));
    if (kept.length) result.push({ ...grant, actions: kept });
    for (const entry of replaced) {
      if (entry.action === 'read') {
        add('user', '*', 'read');
        add('settings', 'studio.roles', 'read');
      }
      if (entry.action === 'assign') add('user', '*', 'assign-role');
      if (entry.action === 'define-roles')
        add('settings', 'studio.roles', 'manage');
    }
  }
  // Only exact target actions are deduplicated; unrelated and advanced payloads stay untouched.
  const targetAction = (grant: Grant, action: Action) =>
    Object.keys(grant).length === 2 &&
    Object.keys(grant.resource).length === 2 &&
    Object.keys(action).length === 1 &&
    ((grant.resource.type === 'user' &&
      grant.resource.id === '*' &&
      ['read', 'assign-role'].includes(action.action)) ||
      (grant.resource.type === 'settings' &&
        grant.resource.id === 'studio.roles' &&
        ['read', 'manage'].includes(action.action)));
  return result.flatMap((grant, index) => {
    const actions = grant.actions.filter(
      (action, actionIndex) =>
        !targetAction(grant, action) ||
        (!grant.actions
          .slice(0, actionIndex)
          .some(
            (prior) =>
              targetAction(grant, prior) && prior.action === action.action,
          ) &&
          !result
            .slice(0, index)
            .some(
              (prior) =>
                prior.resource.type === grant.resource.type &&
                prior.resource.id === grant.resource.id &&
                prior.actions.some(
                  (entry) =>
                    targetAction(prior, entry) &&
                    entry.action === action.action,
                ),
            )),
    );
    return actions.length ? [{ ...grant, actions }] : [];
  });
}

/** Frozen proof for the two unchanged release-only scope groups; every other credential needs review. */
export function reviewStudioAccessKeys(
  keys: readonly { id: string; referenceId: string; permissions: unknown }[],
) {
  return keys.map((key) => {
    let permissions: unknown = key.permissions;
    try {
      if (typeof permissions === 'string')
        permissions = JSON.parse(permissions);
    } catch {
      permissions = null;
    }
    const record =
      permissions &&
      typeof permissions === 'object' &&
      !Array.isArray(permissions)
        ? (permissions as Record<string, unknown>)
        : null;
    const groups = record
      ? Object.keys(record).filter(
          (name) => name !== '$v' && !name.endsWith('@'),
        )
      : [];
    const equivalent =
      record !== null &&
      JSON.stringify(record.$v) === '["1"]' &&
      groups.length > 0 &&
      Object.entries(record).every(([name, value]) => {
        if (name === '$v') return true;
        const group = name.replace(/@$/, '');
        if (!['releases.apps', 'releases.environments'].includes(group))
          return false;
        return (
          Array.isArray(value) &&
          value.every(
            (item) =>
              typeof item === 'string' &&
              (name.endsWith('@') || ['read', 'write', 'admin'].includes(item)),
          )
        );
      });
    return {
      keyId: key.id,
      subjectId: key.referenceId,
      scopeHash: hash(JSON.stringify(key.permissions ?? null)),
      status: equivalent
        ? ('equivalent-unaffected' as const)
        : ('review-required' as const),
      reason: equivalent
        ? 'Only unchanged release groups; no account or role actions before or after conversion.'
        : 'Ordinary, wildcard, member-related or unknown delegation needs an individual equivalence inventory.',
    };
  });
}

export default defineSeed({
  name: '202610250020_studio_access_v2',
  transaction: true,
  async run(context) {
    const { query, connection, config } = context;
    const rootSet =
      config.get<string>('authorization.permissionSets.rootSet') ?? 'root';
    const defaultSet =
      config.get<string>('authorization.permissionSets.defaultSet') ?? 'member';
    const rows = await context
      .repository<{ id: string; key: string; grants: Grant[] }>(
        'authorizationPermissionSets',
      )
      .findMany();
    for (const row of rows)
      if (typeof row.grants === 'string')
        row.grants = JSON.parse(row.grants) as Grant[];
    const plans = rows
      .filter(
        (row) =>
          row.key !== rootSet &&
          row.key !== defaultSet &&
          !row.key.startsWith('api-key-'),
      )
      .map((row) => ({ row, grants: convertStudioAccessGrants(row.grants) }));
    const changed = plans.filter(
      ({ row, grants }) =>
        JSON.stringify(row.grants) !== JSON.stringify(grants),
    );
    const client = await connection.client<Knex>();
    const history = await client<{ id: string | number; name: string }>(
      config.get<string>('database.connections.main.seeds.tableName') ??
        '__nocobase_seeds',
    )
      .whereIn('name', [
        '202610010021z_studio_account_defaults',
        '202610010022_studio_roles',
      ])
      .select('id', 'name');
    const first = history.find(
      (item) => item.name === '202610010021z_studio_account_defaults',
    );
    const old = history.find(
      (item) => item.name === '202610010022_studio_roles',
    );
    const initial = first && old && Number(first.id) < Number(old.id);
    if (
      !initial &&
      config.get<boolean>('studio.accessUpgrade.maintenance') !== true
    )
      throw new Error(
        'STUDIO_ACCESS_MAINTENANCE_REQUIRED: stop all old writers before applying this upgrade',
      );
    const keys = await query
      .selectFrom('apikey')
      .select(['id', 'referenceId', 'permissions'])
      .execute<{ id: string; referenceId: string; permissions: unknown }>();
    if (
      !initial &&
      reviewStudioAccessKeys(keys).some(
        (key) => key.status === 'review-required',
      )
    )
      throw new Error(
        'STUDIO_KEY_REVIEW_REQUIRED: existing key delegation needs an approved equivalence inventory',
      );
    const userKinds = await query.selectFrom('user').select('kind').execute();
    if (
      userKinds.some((row) => row.kind !== 'person' && row.kind !== 'service')
    )
      throw new Error(
        'STUDIO_ACCOUNT_KIND_UNKNOWN: review historical account kinds before switching management scope',
      );
    if (!changed.length) return;
    const assignments = await query
      .selectFrom('authorizationPermissionSetAssignments')
      .select(['id', 'subjectType', 'subjectId', 'permissionSetKey'])
      .execute();
    const defaults = await query
      .selectFrom('studioSettings')
      .select(['key', 'value'])
      .execute();
    const summary = JSON.stringify({
      assignmentHash: hash(JSON.stringify(assignments)),
      defaultRoleHash: hash(JSON.stringify(defaults)),
    });
    for (const { row, grants } of changed) {
      const before = JSON.stringify(row.grants),
        after = JSON.stringify(grants);
      await context.repository('studioAccessUpgradeChanges').createOne({
        values: {
          id: VERSION + ':' + row.id,
          version: VERSION,
          batch: VERSION,
          roleId: row.id,
          roleKey: row.key,
          beforeGrants: before,
          afterGrants: after,
          beforeHash: hash(before),
          afterHash: hash(after),
          summary,
        },
      });
      await context.repository('authorizationPermissionSets').updateOne({
        filter: { id: row.id },
        values: { grants },
      });
    }
  },
});
