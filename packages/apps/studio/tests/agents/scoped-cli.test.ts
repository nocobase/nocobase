// @vitest-environment node
/**
 * The CLI gateway knows a caller only by user id (`CallerIdentity`), so it derives permissions itself rather than
 * through `authz.can`: a key's scope must narrow them there too, or a scoped key would reach every command its owner
 * may run. Projects and release management both.
 */
import { createApiKeyScopes } from '@nocobase/app-plugin-api-keys/server';
import type { CallerIdentity } from '@nocobase/app-plugin-agents/server/tokens';
import { allPermissions as allReleasePermissions } from '@nocobase/app-plugin-releases/shared/access';
import {
  BUSINESS_KEYS,
  noSettings,
  type BusinessKey,
  type Permissions,
  type Scope,
} from '@nocobase/app-plugin-projects/shared/access';
import { describe, expect, it } from 'vitest';

import { registerStudioKeyScopes } from '../../server/access/key-scopes.js';
import { testCatalog } from '../access/registry.js';
import {
  createActionGate,
  createPermissionSource,
} from '../../server/agents/commands/permissions.js';
import {
  callerOfIdentity,
  releaseActionsOf,
} from '../../server/releases/caller.js';

/** An owner who may do everything in projects. */
const everything: Permissions = {
  scopes: Object.fromEntries(
    BUSINESS_KEYS.map(({ key }) => [key, 'all']),
  ) as Record<BusinessKey, Scope>,
  settings: Object.fromEntries(
    Object.keys(noSettings()).map((key) => [key, true]),
  ) as Permissions['settings'],
};

function scoped(
  groups: Record<
    string,
    { level: 'read' | 'write' | 'admin'; objects?: string[] }
  >,
): CallerIdentity {
  const scopes = createApiKeyScopes();
  registerStudioKeyScopes(scopes, {}, testCatalog);
  return {
    kind: 'user',
    userId: 'alice',
    displayName: 'Alice',
    keyScope: scopes.compile('key-1', scopes.validate({ groups })),
  };
}

describe('the CLI gateway with a scoped API key', () => {
  const source = createPermissionSource(() => ({
    permissionsOfUser: () => Promise.resolve(everything),
  }));
  const releases = {
    permissionsOfUser: () => Promise.resolve(allReleasePermissions()),
  };

  it('offers only the commands the scope covers, though the owner may run every one', async () => {
    const identity = scoped({ 'projects.issues': { level: 'read' } });
    const gate = createActionGate(source, [
      (id) => releaseActionsOf(releases, id),
    ]);
    const allowed = await gate.allowed(identity);
    // Beside the scope's actions, only what every caller holds: its own inbox and plans.
    expect([...allowed].sort()).toEqual([
      'pm.issues/view',
      'pm.plans/use',
      'studio.inbox/read',
    ]);

    const full = await gate.allowed({ ...identity, keyScope: undefined });
    expect(full.has('pm.issues/delete')).toBe(true);
    expect(full.has('rel.apps/deploy')).toBe(true);
  });

  it('runs a release command as a key, within the scope and its Apps', async () => {
    const identity = scoped({
      'releases.apps': { level: 'admin', objects: ['shop'] },
    });
    const caller = await callerOfIdentity(releases, identity);
    expect(caller.kind).toBe('key');
    expect(caller.keyScope?.objects('rel.apps')).toEqual(['shop']);
    expect(caller.permissions.scopes['rel.apps/deploy']).toBe('all');
    expect(caller.permissions.scopes['rel.apps/configure']).toBe('none');
    expect(caller.permissions.settings['rel.environments/manage']).toBe(false);
    const actions = await releaseActionsOf(releases, identity);
    expect(actions.has('rel.apps/upload')).toBe(true);
    expect(actions.has('rel.apps/delete')).toBe(false);
    expect(actions.has('rel.environments/read')).toBe(false);
  });

  it('keeps a person without a key a person', async () => {
    const caller = await callerOfIdentity(releases, {
      kind: 'user',
      userId: 'alice',
      displayName: 'Alice',
    });
    expect(caller.kind).toBe('human');
    expect(caller.permissions.scopes['rel.apps/delete']).toBe('all');
  });
});
