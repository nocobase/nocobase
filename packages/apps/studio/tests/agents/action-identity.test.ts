import { describe, expect, it } from 'vitest';
import type { CallerIdentity } from '@nocobase/app-plugin-agents/server/tokens';
import {
  noAbilities,
  noSettings,
  type Permissions,
} from '@nocobase/app-plugin-projects/shared/access';
import {
  allPermissions,
  noPermissions,
} from '@nocobase/app-plugin-releases/shared/access';
import {
  createActionGate,
  createPermissionSource,
} from '../../server/agents/commands/permissions.js';
import {
  callerOfIdentity,
  releaseActionsOf,
} from '../../server/releases/caller.js';
import { knowledgeActionsOf } from '../../server/knowledge/actions.js';
import { reportActionsOf } from '../../server/reports/text.js';

describe('run identity permissions without agent action intersection', () => {
  const run: CallerIdentity = {
    kind: 'run',
    userId: 'owner',
    displayName: 'Owner',
    agent: { actions: [] } as never,
  };
  it('allows missing legacy actions, retains scopes, and responds to revocation', async () => {
    let permissions: Permissions = {
      scopes: {
        ...noAbilities(),
        'pm.issues/view': { users: ['owner'] },
        'pm.issues/edit': { users: ['owner'] },
      },
      settings: noSettings(),
    };
    const source = createPermissionSource(() => ({
      permissionsOfUser: async (userId) => {
        expect(userId).toBe('owner');
        return permissions;
      },
    }));
    const gate = createActionGate(source);
    expect((await gate.allowed(run)).has('studio.git/open-pr')).toBe(true);
    expect((await source.permissionsOf(run)).scopes['pm.issues/edit']).toEqual({
      users: ['owner'],
    });
    expect((await gate.allowed(run)).has('pm.issues/delete')).toBe(false);
    permissions = { scopes: noAbilities(), settings: noSettings() };
    expect((await gate.allowed(run)).has('studio.git/open-pr')).toBe(false);
  });
  it('lets reports and knowledge depend on current identity grants', async () => {
    let reports = true;
    const actions = reportActionsOf(async (identity) => {
      expect(identity.userId).toBe('owner');
      return { reports, allRuns: false };
    });
    expect(await actions(run)).toEqual(new Set(['studio.reports/read']));
    reports = false;
    expect(await actions(run)).toEqual(new Set());
    const knowledge = knowledgeActionsOf(async () => ({
      read: 'all',
      propose: 'all',
      edit: 'none',
      manage: 'none',
    }));
    expect(await knowledge(run)).toEqual(
      new Set(['kb.knowledge/read', 'kb.knowledge/propose']),
    );
  });
  it('keeps release callers agents and preserves human-only restrictions and revocation', async () => {
    let permissions = allPermissions();
    const deps = { permissionsOfUser: async () => permissions };
    expect((await callerOfIdentity(deps, run)).kind).toBe('agent');
    const actions = await releaseActionsOf(deps, run);
    expect(actions.has('rel.apps/deploy')).toBe(true);
    expect(actions.has('rel.apps/deploy-protected')).toBe(false);
    expect(actions.has('rel.apps/delete')).toBe(false);
    permissions = noPermissions();
    expect((await releaseActionsOf(deps, run)).has('rel.apps/deploy')).toBe(
      false,
    );
  });
});
