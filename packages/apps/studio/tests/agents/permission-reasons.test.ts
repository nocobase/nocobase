// @vitest-environment node
import type { CallerIdentity } from '@nocobase/app-plugin-agents/server/tokens';
import { createCallerGate } from '@nocobase/app-plugin-agents/testing';
import { allPermissions } from '@nocobase/app-plugin-releases/shared/access';
import {
  noAbilities,
  noSettings,
} from '@nocobase/app-plugin-projects/shared/access';
import { describe, expect, it } from 'vitest';

import {
  createActionGate,
  createPermissionSource,
} from '../../server/agents/commands/permissions.js';
import { reportActionsOf } from '../../server/reports/text.js';
import { releaseActionsOf } from '../../server/releases/caller.js';

function setup(actions: string[] = ['pm.issues/edit'], edit = true) {
  const identity = {
    kind: 'run',
    userId: 'limited',
    displayName: 'Worker',
    agent: { actions },
    run: { run: { subjectKind: 'issue' } },
  } as CallerIdentity;
  const source = createPermissionSource(() => ({
    permissionsOfUser: async () => ({
      scopes: { ...noAbilities(), 'pm.issues/edit': edit ? 'all' : 'none' },
      settings: noSettings(),
    }),
  }));
  const gate = createActionGate(source, [
    reportActionsOf(async () => ({ reports: true, allRuns: false })),
    (id) =>
      releaseActionsOf({ permissionsOfUser: async () => allPermissions() }, id),
  ]);
  return { identity, gate };
}

describe('reasons use actual authorization', () => {
  it('does not diagnose a missing permission source as a missing user grant', async () => {
    const { identity } = setup();
    const gate = createActionGate(createPermissionSource(() => undefined));
    expect(
      (await gate.explain!(identity, 'pm.issues/edit')).permissionReason,
    ).toBe('UNKNOWN');
  });
  it('names the missing base action without changing authorization', async () => {
    const { identity, gate } = setup(
      ['pm.issues/edit', 'studio.git/open-pr'],
      false,
    );
    const before = await gate.allowed(identity);
    expect(await gate.explain!(identity, 'studio.git/open-pr')).toEqual({
      permissionReason: 'ACTOR_LACKS_ACTION',
      requiredAction: 'pm.issues/edit',
    });
    expect(await gate.allowed(identity)).toEqual(before);
    expect(before.has('studio.git/open-pr')).toBe(false);
  });
  it.each([
    ['studio.reports/read', 'AGENT_NOT_GIVEN'],
    ['pm.issues/delete', 'ACTOR_LACKS_ACTION'],
    ['agents.agents/manage', 'NOT_FOR_AGENTS'],
    ['', 'NO_ACTION_DECLARED'],
    ['opaque/action', 'UNKNOWN'],
    ['pm.issues/edit', 'UNKNOWN'],
  ])('explains %s as %s', async (action, reason) => {
    const { identity, gate } = setup();
    expect((await gate.explain!(identity, action)).permissionReason).toBe(
      reason,
    );
  });
  it('honors consultation and intake restrictions before identity permission diagnosis', async () => {
    const { identity, gate } = setup([], false);
    const caller = createCallerGate();
    caller.set(gate);
    for (const run of [
      {
        ...identity,
        run: { run: { subjectKind: 'issue', parentRunId: 'parent' } },
      },
      { ...identity, run: { run: { subjectKind: 'intake' } } },
    ] as CallerIdentity[]) {
      expect(
        (await caller.explain!(run, 'pm.issues/edit')).permissionReason,
      ).toBe('READ_ONLY_RUN');
      expect((await caller.allowed(run)).has('pm.issues/edit')).toBe(false);
    }
  });
  it('does not claim an allowed environment read is forbidden to agents', async () => {
    const { identity, gate } = setup([]);
    expect((await gate.allowed(identity)).has('rel.environments/read')).toBe(
      true,
    );
    expect(
      (await gate.explain!(identity, 'rel.environments/read')).permissionReason,
    ).toBe('UNKNOWN');
  });
  it('falls back to UNKNOWN for a gate that supplies no evidence', async () => {
    const { identity } = setup();
    const gate = createCallerGate();
    gate.set({ allowed: async () => new Set() });
    expect(await gate.explain!(identity, 'pm.issues/edit')).toEqual({
      permissionReason: 'UNKNOWN',
      requiredAction: 'pm.issues/edit',
    });
  });
});
