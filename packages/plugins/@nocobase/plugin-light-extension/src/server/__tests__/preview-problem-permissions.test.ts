/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { HandlerType } from '@nocobase/resourcer';
import { MockServer, createMockServer } from '@nocobase/test';
import { describe, expect, it, vi } from 'vitest';

import { createLightExtensionProblem } from '../../shared/problems';
import type {
  LightExtensionPreviewProblemOpenInput,
  LightExtensionPreviewProblemSessionInput,
  LightExtensionPreviewProblemSessionResult,
} from '../../shared/types';
import PluginLightExtensionServer from '../plugin';
import { createLightExtensionPreviewProblemsResource } from '../resources/lightExtensionPreviewProblems';
import type { LightExtensionPreviewProblemService } from '../services/LightExtensionPreviewProblemService';

describe('lightExtensionPreviewProblems resource permissions', () => {
  it('derives user and role identity from the request context and ignores forged transport identity', async () => {
    const open = vi.fn(async () => ({ schemaVersion: 1 }));
    const resource = createLightExtensionPreviewProblemsResource({
      open,
    } as unknown as LightExtensionPreviewProblemService);
    const action = resource.actions?.open as HandlerType;
    const ctx = {
      action: {
        params: {
          values: {
            repoId: 'repo_1',
            entryId: 'entry_1',
            ownerLocator: {
              kind: 'flowModel.pageSettings',
              modelUid: 'page_1',
              use: 'JSPageModel',
              stepPath: ['stepParams', 'jsSettings', 'runJs'],
            },
            snapshotId: 'snapshot_1',
            artifactHash: 'a'.repeat(64),
            actorUserId: 'forged-user',
            roleNames: ['forged-role'],
          },
        },
      },
      auth: { user: { id: 7 } },
      state: { currentRoles: ['member', 'auditor'] },
    };

    await action(ctx as never, async () => undefined);

    expect(open).toHaveBeenCalledWith(expect.objectContaining({ repoId: 'repo_1', entryId: 'entry_1' }), {
      actorUserId: '7',
      roleNames: ['member', 'auditor'],
    });
    expect(open.mock.calls[0][0]).not.toHaveProperty('actorUserId');
    expect(open.mock.calls[0][0]).not.toHaveProperty('roleNames');
  });

  it('normalizes cursor polling and close states while rejecting invalid close states', async () => {
    const list = vi.fn(async () => ({ schemaVersion: 1 }));
    const close = vi.fn(async () => ({ schemaVersion: 1 }));
    const resource = createLightExtensionPreviewProblemsResource({
      list,
      close,
    } as unknown as LightExtensionPreviewProblemService);
    const baseValues = {
      sessionId: 'preview:1',
      repoId: 'repo_1',
      entryId: 'entry_1',
      ownerLocator: {
        kind: 'flowModel.pageSettings',
        modelUid: 'page_1',
        use: 'JSPageModel',
        stepPath: ['stepParams', 'jsSettings', 'runJs'],
      },
      snapshotId: 'snapshot_1',
      artifactHash: 'a'.repeat(64),
      executionId: 'execution:1',
    };
    const createContext = (values: Record<string, unknown>) =>
      ({
        action: { params: { values } },
        auth: { user: { id: 'user_1' } },
        state: { currentRole: 'member' },
      }) as never;

    await (resource.actions?.list as HandlerType)(createContext({ ...baseValues, cursor: 12 }), async () => undefined);
    await (resource.actions?.close as HandlerType)(
      createContext({ ...baseValues, state: 'stale' }),
      async () => undefined,
    );

    expect(list).toHaveBeenCalledWith(expect.objectContaining({ cursor: 12 }), {
      actorUserId: 'user_1',
      roleNames: ['member'],
    });
    expect(close).toHaveBeenCalledWith(expect.objectContaining({ state: 'stale' }), {
      actorUserId: 'user_1',
      roleNames: ['member'],
    });

    const invalidContext = createContext({ ...baseValues, state: 'active' }) as {
      status?: number;
      body?: unknown;
    };
    await (resource.actions?.close as HandlerType)(invalidContext as never, async () => undefined);
    expect(invalidContext).toMatchObject({
      status: 400,
      body: { errors: [{ code: 'LIGHT_EXTENSION_INVALID_INPUT' }] },
    });
  });

  it('isolates concurrent entry sessions across real users, roles, and entry identities', async () => {
    let app: MockServer | undefined;
    try {
      app = await createMockServer({
        registerActions: true,
        acl: true,
        plugins: [
          'field-sort',
          'users',
          'auth',
          'acl',
          'data-source-manager',
          'system-settings',
          PluginLightExtensionServer,
        ],
      });

      const suffix = Date.now();
      const roleA = `previewProblemRoleA_${suffix}`;
      const roleB = `previewProblemRoleB_${suffix}`;
      await app.db.getRepository('roles').create({ values: { name: roleA } });
      await app.db.getRepository('roles').create({ values: { name: roleB } });
      const userA = await app.db.getRepository('users').create({
        values: { nickname: `Preview problem user A ${suffix}`, roles: [roleA, roleB] },
      });
      const userB = await app.db.getRepository('users').create({
        values: { nickname: `Preview problem user B ${suffix}`, roles: [roleA, roleB] },
      });

      const repo = await app.db.getRepository('lightExtensionRepos').create({
        values: {
          vscRepoId: `vscr_preview_problem_${suffix}`,
          name: `preview-problem-${suffix}`,
          normalizedName: `preview-problem-${suffix}`,
        },
      });
      const repoId = String(repo.get('id'));
      const entryA = await app.db.getRepository('lightExtensionEntries').create({
        values: {
          repoId,
          kind: 'js-block',
          entryName: 'entry-a',
          entryPath: 'src/client/js-blocks/entry-a/index.tsx',
          descriptorPath: 'src/client/js-blocks/entry-a/entry.json',
        },
      });
      const entryB = await app.db.getRepository('lightExtensionEntries').create({
        values: {
          repoId,
          kind: 'js-page',
          entryName: 'entry-b',
          entryPath: 'src/client/js-pages/entry-b/index.tsx',
          descriptorPath: 'src/client/js-pages/entry-b/entry.json',
        },
      });
      const entryAId = String(entryA.get('id'));
      const entryBId = String(entryB.get('id'));
      const openInputA = createOpenInput(repoId, entryAId, 'entry_a', 'js-block');
      const openInputB = createOpenInput(repoId, entryBId, 'entry_b', 'js-page');

      const userARoleA = (await app.agent().login(userA)).set('x-role', roleA);
      const userARoleB = (await app.agent().login(userA)).set('x-role', roleB);
      const userBRoleA = (await app.agent().login(userB)).set('x-role', roleA);
      const userBRoleB = (await app.agent().login(userB)).set('x-role', roleB);
      const [openedAResponse, openedBResponse] = await Promise.all([
        userARoleA.resource('lightExtensionPreviewProblems').open({ values: openInputA }),
        userBRoleB.resource('lightExtensionPreviewProblems').open({ values: openInputB }),
      ]);

      expect(openedAResponse.status).toBe(200);
      expect(openedBResponse.status).toBe(200);
      const sessionA = toSessionInput(openedAResponse.body.data as LightExtensionPreviewProblemSessionResult);
      const sessionB = toSessionInput(openedBResponse.body.data as LightExtensionPreviewProblemSessionResult);
      expect(sessionA).toMatchObject({ repoId, entryId: entryAId });
      expect(sessionB).toMatchObject({ repoId, entryId: entryBId });
      expect(sessionA.sessionId).not.toBe(sessionB.sessionId);

      const [appendAResponse, appendBResponse] = await Promise.all([
        userARoleA.resource('lightExtensionPreviewProblems').append({
          values: {
            ...sessionA,
            problems: [createProblem(sessionA.snapshotId, sessionA.executionId, 'problem_a')],
          },
        }),
        userBRoleB.resource('lightExtensionPreviewProblems').append({
          values: {
            ...sessionB,
            problems: [createProblem(sessionB.snapshotId, sessionB.executionId, 'problem_b')],
          },
        }),
      ]);
      expect(appendAResponse.status).toBe(200);
      expect(appendBResponse.status).toBe(200);

      const isolatedAttempts = [
        { agent: userBRoleA, session: sessionA, code: 'wrong_user' },
        { agent: userARoleB, session: sessionA, code: 'wrong_role' },
        { agent: userARoleA, session: { ...sessionA, entryId: entryBId }, code: 'wrong_entry' },
        { agent: userARoleA, session: sessionB, code: 'cross_session_a' },
        { agent: userBRoleB, session: sessionA, code: 'cross_session_b' },
      ];
      for (const attempt of isolatedAttempts) {
        const [listResponse, appendResponse] = await Promise.all([
          attempt.agent.resource('lightExtensionPreviewProblems').list({ values: attempt.session }),
          attempt.agent.resource('lightExtensionPreviewProblems').append({
            values: {
              ...attempt.session,
              problems: [createProblem(attempt.session.snapshotId, attempt.session.executionId, attempt.code)],
            },
          }),
        ]);
        expect(listResponse.status).toBe(404);
        expect(appendResponse.status).toBe(404);
      }

      const [listedAResponse, listedBResponse] = await Promise.all([
        userARoleA.resource('lightExtensionPreviewProblems').list({ values: { ...sessionA, cursor: 0 } }),
        userBRoleB.resource('lightExtensionPreviewProblems').list({ values: { ...sessionB, cursor: 0 } }),
      ]);
      expect(listedAResponse.status).toBe(200);
      expect(listedBResponse.status).toBe(200);
      expect(listedAResponse.body.data.items).toMatchObject([{ cursor: 1, problem: { code: 'problem_a' } }]);
      expect(listedBResponse.body.data.items).toMatchObject([{ cursor: 1, problem: { code: 'problem_b' } }]);
    } finally {
      await app?.destroy();
    }
  });
});

function createOpenInput(
  repoId: string,
  entryId: string,
  identity: string,
  kind: 'js-block' | 'js-page',
): LightExtensionPreviewProblemOpenInput {
  return {
    repoId,
    entryId,
    ownerLocator:
      kind === 'js-block'
        ? {
            kind: 'flowModel.step',
            modelUid: `block_${identity}`,
            use: 'JSBlockModel',
            stepPath: ['stepParams', 'jsSettings'],
          }
        : {
            kind: 'flowModel.pageSettings',
            modelUid: `page_${identity}`,
            use: 'JSPageModel',
            stepPath: ['stepParams', 'jsSettings', 'runJs'],
          },
    snapshotId: `snapshot_${identity}`,
    artifactHash: identity === 'entry_a' ? 'a'.repeat(64) : 'b'.repeat(64),
  };
}

function toSessionInput(result: LightExtensionPreviewProblemSessionResult): LightExtensionPreviewProblemSessionInput {
  return {
    sessionId: result.sessionId,
    repoId: result.repoId,
    entryId: result.entryId,
    ownerLocator: result.ownerLocator,
    snapshotId: result.snapshotId,
    artifactHash: result.artifactHash,
    executionId: result.executionId,
  };
}

function createProblem(snapshotId: string, requestId: string, code: string) {
  return createLightExtensionProblem({
    phase: 'runtime',
    source: 'host-runtime',
    severity: 'error',
    code,
    message: code,
    snapshotId,
    requestId,
  });
}
