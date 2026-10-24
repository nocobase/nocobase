import type {
  FoundationPart,
  FoundationText,
} from '../../shared/foundation.js';
import {
  fact,
  metric,
  NO_DATABASE,
  type CapabilityCollector,
} from './types.js';

export const usersAndOrganizations: CapabilityCollector = {
  key: 'usersAndOrganizations',
  packages: [
    '@nocobase/app-plugin-authentication',
    '@nocobase/app-plugin-users',
    '@nocobase/app-plugin-user-management',
  ],
  async collect({ probe }) {
    if (!probe) return NO_DATABASE;
    if (!probe.has('user')) return { status: 'unused', reason: 'noAccounts' };
    // Deleted accounts stay as records for what they did; they are not accounts any more.
    const accounts = await probe.count('user', (filter) =>
      filter.date('deletedAt').empty(),
    );
    const disabled = await probe.count('user', (filter) =>
      filter.and([
        filter.date('deletedAt').empty(),
        filter.date('disabledAt').notEmpty(),
      ]),
    );
    const invitations = probe.has('userInvitations')
      ? await probe.count('userInvitations')
      : undefined;
    return {
      status: 'active',
      facts: accounts === null ? [] : [fact('accounts', { count: accounts })],
      metrics: [
        metric('accounts', accounts),
        metric('disabledAccounts', disabled),
        ...(invitations === undefined
          ? []
          : [metric('invitations', invitations)]),
      ],
      // NocoBase Core has no organization model of its own yet: departments and teams are the application's.
      parts: [
        { key: 'accounts', status: 'active' },
        { key: 'organizations', status: 'unused', reason: 'notProvided' },
      ],
    };
  },
};

const RULE_COLLECTIONS = [
  { part: 'sharingRules', collection: 'authorizationSharingRules' },
  { part: 'restrictionRules', collection: 'authorizationRestrictionRules' },
  { part: 'defaultAccess', collection: 'authorizationDefaultAccessRules' },
] as const;

export const permissions: CapabilityCollector = {
  key: 'permissions',
  packages: [
    '@nocobase/app-plugin-authorization',
    '@nocobase/authorization',
    '@nocobase/app-plugin-authz-default-access',
    '@nocobase/app-plugin-authz-sharing-rules',
    '@nocobase/app-plugin-authz-restriction-rules',
  ],
  async collect({ probe, config }) {
    if (!probe) return NO_DATABASE;
    if (!probe.has('authorizationPermissionSets'))
      return { status: 'unused', reason: 'notRegistered' };
    const rootSet =
      config.get<{ permissionSets?: { rootSet?: string } }>('authorization')
        ?.permissionSets?.rootSet ?? 'root';
    const sets = await probe.records('authorizationPermissionSets');
    const assignments = probe.has('authorizationPermissionSetAssignments')
      ? await probe.groupCount(
          'authorizationPermissionSetAssignments',
          'permissionSetKey',
        )
      : new Map<string, number>();
    // Holding the root set grants everything without a grant, so its own grants say nothing about the application.
    const grantedSets = sets?.filter((set) => set.key !== rootSet);
    const grants =
      grantedSets?.reduce((sum, set) => sum + grantCount(set.grants), 0) ??
      null;
    const assigned =
      assignments === null
        ? null
        : [...assignments.entries()]
            .filter(([key]) => key !== rootSet)
            .reduce((sum, [, count]) => sum + count, 0);
    const rules = await Promise.all(
      RULE_COLLECTIONS.map(async ({ part, collection }) => ({
        part,
        count: probe.has(collection)
          ? await probe.count(collection)
          : undefined,
      })),
    );
    const parts: FoundationPart[] = [
      {
        key: 'permissionSets',
        status: grants === null ? null : grants > 0 ? 'active' : 'needsSetup',
      },
      ...rules.map(({ part, count }): FoundationPart =>
        count === undefined
          ? { key: part, status: 'unused', reason: 'notRegistered' }
          : count === null
            ? { key: part, status: null }
            : count > 0
              ? { key: part, status: 'active' }
              : { key: part, status: 'unused' },
      ),
    ];
    const ruleCount = rules.reduce((sum, rule) => sum + (rule.count ?? 0), 0);
    const active = (grants ?? 0) > 0 || ruleCount > 0;
    const unknown =
      grants === null || rules.some((rule) => rule.count === null);
    return {
      status: active ? 'active' : unknown ? null : 'needsSetup',
      ...(active || unknown ? {} : { reason: 'onlyUnrestrictedAccess' }),
      facts: [
        ...(grantedSets === undefined
          ? []
          : [
              fact('permissionSets', {
                count: grantedSets.length,
                names: grantedSets.map((set) => text(set.title, set.key)),
              }),
            ]),
        ...(ruleCount > 0 && !rules.some((rule) => rule.count === null)
          ? [fact('accessRules', { count: ruleCount })]
          : []),
      ],
      metrics: [
        metric('grants', grants),
        metric('permissionSets', grantedSets?.length ?? null),
        metric('assignments', assigned),
        ...rules
          .filter((rule) => rule.count !== undefined)
          .map((rule) => metric(rule.part, rule.count ?? null)),
      ],
      parts,
    };
  },
};

function grantCount(value: unknown): number {
  let grants = value;
  if (typeof grants === 'string') {
    try {
      grants = JSON.parse(grants) as unknown;
    } catch {
      return 0;
    }
  }
  return Array.isArray(grants) ? grants.length : 0;
}

/**
 * A stored title, falling back to the record's key. A built-in record stores a translation key as JSON in its text
 * column, which the page translates; anything else is plain text.
 */
function text(title: unknown, fallback: unknown): FoundationText {
  if (typeof title === 'string' && title.startsWith('{')) {
    try {
      const { key, ns } = JSON.parse(title) as Record<string, unknown>;
      if (typeof key === 'string' && typeof ns === 'string') return { key, ns };
    } catch {
      // Not a translation key after all: shown as written.
    }
  }
  if (typeof title === 'string' && title) return title;
  return typeof fallback === 'string' ? fallback : '';
}
