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

export interface KeyUpgradeSources {
  sets: { id: string; key: string; grants: unknown }[];
  assignments: {
    id: string;
    subjectType: string;
    subjectId: string;
    permissionSetKey: string;
  }[];
  users: {
    id: string;
    kind: string;
    disabledAt?: unknown;
    deletedAt?: unknown;
  }[];
  rootSet: string;
  defaultSet: string;
}
export const studioKeyInventoryHash = (value: unknown) =>
  hash(JSON.stringify(value));
const decode = (value: unknown): unknown =>
  typeof value === 'string' ? JSON.parse(value) : value;

/** Frozen proof. Unknown scopes/subjects and changed account target semantics are never inferred equivalent. */
export function reviewStudioAccessKeys(
  keys: readonly { id: string; referenceId: string; permissions: unknown }[],
  sources?: KeyUpgradeSources,
) {
  return [...keys]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((key) => {
      const differences: string[] = [];
      let permissions: unknown;
      try {
        permissions = decode(key.permissions ?? null);
      } catch {
        differences.push('Malformed scope');
      }
      const ordinary = permissions === null;
      const record =
        permissions &&
        typeof permissions === 'object' &&
        !Array.isArray(permissions)
          ? (permissions as Record<string, unknown>)
          : null;
      const known = [
        'releases.apps',
        'releases.environments',
        'projects.projects',
        'projects.issues',
        'projects.settings',
        'agents.agents',
        'agents.prices',
        'agents.runners',
        'agents.services',
        'studio.members',
        'studio.reports',
        'studio.knowledge',
      ];
      if (
        !ordinary &&
        (!record ||
          JSON.stringify(record.$v) !== '["1"]' ||
          Object.keys(record).length === 1)
      )
        differences.push('Unknown scope format');
      const maximumLevels: Record<string, number> = {
        'releases.environments': 2,
        'projects.settings': 2,
        'agents.agents': 2,
        'agents.prices': 2,
        'agents.runners': 2,
        'agents.services': 1,
        'studio.reports': 1,
      };
      if (record)
        for (const [name, value] of Object.entries(record)) {
          if (name === '$v') continue;
          const group = name.replace(/@$/, '');
          const levels = ['read', 'write', 'admin'];
          if (
            !known.includes(group) ||
            !Array.isArray(value) ||
            value.some((item) => typeof item !== 'string') ||
            (!name.endsWith('@') &&
              (value.length > (maximumLevels[group] ?? 3) ||
                !levels.some(
                  (_, i) =>
                    JSON.stringify(value) ===
                    JSON.stringify(levels.slice(0, i + 1)),
                ))) ||
            (name.endsWith('@') &&
              (!record[group] ||
                !['releases.apps', 'projects.projects'].includes(group)))
          )
            differences.push(
              'Unknown scope group, level or object restriction: ' + name,
            );
        }
      const accountScope = ordinary || !!record?.['studio.members'];
      const unaffected =
        record &&
        Object.keys(record).every(
          (name) =>
            name === '$v' ||
            ['releases.apps', 'releases.environments'].includes(
              name.replace(/@$/, ''),
            ),
        );
      const subject = sources?.users.find(
        (user) => user.id === key.referenceId,
      );
      const assignments =
        sources?.assignments.filter(
          (row) =>
            (row.subjectType === 'user' && row.subjectId === key.referenceId) ||
            (row.subjectType === 'authenticated' && row.subjectId === '*'),
        ) ?? [];
      const setKeys = new Set([
        sources?.defaultSet ?? 'member',
        ...assignments.map((row) => row.permissionSetKey),
      ]);
      const sets = (sources?.sets ?? [])
        .filter((set) => setKeys.has(set.key))
        .sort((a, b) => a.key.localeCompare(b.key));
      const privateChanges: {
        roleId: string;
        roleKey: string;
        beforeGrants: string;
        afterGrants: string;
      }[] = [];
      if (sources) {
        if (!subject || !['person', 'service'].includes(subject.kind))
          differences.push('Missing or unknown key subject');
        if (
          sources.assignments.some(
            (row) => !['user', 'authenticated'].includes(row.subjectType),
          )
        )
          differences.push(
            'Additional authorization subject types require individual resolution',
          );
        if (setKeys.has(sources.rootSet))
          differences.push(
            'Unrestricted root delegation requires individual review',
          );
        if (
          [...setKeys].some(
            (key) => !sources.sets.some((set) => set.key === key),
          )
        )
          differences.push('Missing assigned permission set');
        for (const set of sets) {
          try {
            const grants = decode(set.grants) as Grant[];
            const converted = convertStudioAccessGrants(grants);
            if (grants.some((grant) => grant.resource.type === 'composite'))
              differences.push(
                'Composite definitions are not frozen by this upgrade: ' +
                  set.key,
              );
            if (
              accountScope &&
              grants.some(
                (grant) =>
                  grant.resource.type === '*' ||
                  (grant.resource.type === 'settings' &&
                    (grant.resource.id === '*' ||
                      (grant.resource.id === 'pm.members' &&
                        grant.actions.some((action) =>
                          ['*', 'read'].includes(action.action),
                        )))) ||
                  grant.resource.type === 'user',
              )
            )
              differences.push(
                'Account target or credential policy differs in ' +
                  set.key +
                  ': legacy read excludes disabled people; direct Users or sensitive grants need individual review',
              );
            if (
              accountScope &&
              subject?.kind === 'service' &&
              grants.some(
                (grant) =>
                  grant.resource.type === 'settings' &&
                  grant.resource.id === 'pm.members' &&
                  grant.actions.some((action) => action.action === 'assign'),
              )
            )
              differences.push(
                'Service actors cannot use the new explicit Studio assignment entry',
              );
            if (
              set.key.startsWith('api-key-') &&
              JSON.stringify(grants) !== JSON.stringify(converted)
            )
              privateChanges.push({
                roleId: set.id,
                roleKey: set.key,
                beforeGrants: JSON.stringify(grants),
                afterGrants: JSON.stringify(converted),
              });
          } catch {
            differences.push('Unmappable grants in ' + set.key);
          }
        }
      } else if (!unaffected)
        differences.push('Subject grants and target inventory required');
      return {
        keyId: key.id,
        subjectId: key.referenceId,
        scopeHash: hash(JSON.stringify(key.permissions ?? null)),
        subjectHash: hash(
          JSON.stringify({
            subject,
            assignments: [...assignments].sort((a, b) =>
              a.id.localeCompare(b.id),
            ),
            sets,
          }),
        ),
        targetHash: hash(
          JSON.stringify({
            permissions,
            accountScope,
            target: accountScope
              ? 'ordinary-people; protected-role-definitions'
              : 'unchanged-plugin-object-scope',
          }),
        ),
        status: differences.length
          ? ('review-required' as const)
          : unaffected && !privateChanges.length
            ? ('equivalent-unaffected' as const)
            : ('equivalent-transition' as const),
        reason: differences.length
          ? differences.join('; ')
          : 'Exact scope and object IDs retained; subject grants map only equivalent role-definition actions; no sensitive delegation or account target change.',
        privateChanges,
      };
    });
}

/** Selects only non-secret fields, before any writes. */
export async function readStudioKeyInventory(
  connection: Pick<import('@nocobase/db').SeedContext, 'query' | 'repository'>,
  rootSet = 'root',
  defaultSet = 'member',
) {
  const keys = await connection.query
    .selectFrom('apikey')
    .select(['id', 'referenceId', 'permissions'])
    .execute<{ id: string; referenceId: string; permissions: unknown }>();
  const sets = await connection
    .repository<{ id: string; key: string; grants: unknown }>(
      'authorizationPermissionSets',
    )
    .findMany({ select: (s) => s.fields('id', 'key', 'grants') });
  const assignments = await connection.query
    .selectFrom('authorizationPermissionSetAssignments')
    .select(['id', 'subjectType', 'subjectId', 'permissionSetKey'])
    .execute<KeyUpgradeSources['assignments'][number]>();
  const users = await connection.query
    .selectFrom('user')
    .select(['id', 'kind', 'disabledAt', 'deletedAt'])
    .execute<{ id: string; kind: string }>();
  return reviewStudioAccessKeys(keys, {
    sets,
    assignments,
    users,
    rootSet,
    defaultSet,
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
    const keyInventory = await readStudioKeyInventory(
      context,
      rootSet,
      defaultSet,
    );
    if (
      !initial &&
      keyInventory.some((key) => key.status === 'review-required')
    )
      throw new Error(
        'STUDIO_KEY_REVIEW_REQUIRED: ' +
          keyInventory
            .filter((key) => key.status === 'review-required')
            .map((key) => key.keyId + ': ' + key.reason)
            .join('; '),
      );
    if (
      !initial &&
      keyInventory.some((key) => key.status === 'equivalent-transition') &&
      config.get<string>('studio.accessUpgrade.expectedKeyInventoryHash') !==
        studioKeyInventoryHash(keyInventory)
    )
      throw new Error(
        'STUDIO_KEY_INVENTORY_CONFLICT: prepare and apply an exact current equivalence inventory in maintenance',
      );
    const privatePlans = new Map(
      keyInventory
        .flatMap((key) => key.privateChanges)
        .map((change) => [change.roleId, change]),
    );
    for (const change of privatePlans.values()) {
      const row = rows.find((row) => row.id === change.roleId)!;
      changed.push({ row, grants: JSON.parse(change.afterGrants) as Grant[] });
    }
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
