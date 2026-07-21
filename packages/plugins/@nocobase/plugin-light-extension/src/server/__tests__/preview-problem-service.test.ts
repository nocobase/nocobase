/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { createLightExtensionProblem } from '../../shared/problems';
import type {
  LightExtensionPreviewProblemSessionInput,
  LightExtensionProblem,
  LightExtensionReferenceOwnerLocator,
} from '../../shared/types';
import {
  LightExtensionPreviewProblemService,
  MemoryLightExtensionPreviewProblemStorage,
} from '../services/LightExtensionPreviewProblemService';

const ownerLocator: LightExtensionReferenceOwnerLocator = {
  kind: 'flowModel.pageSettings',
  modelUid: 'page_1',
  use: 'JSPageModel',
  stepPath: ['stepParams', 'jsSettings', 'runJs'],
};

describe('LightExtensionPreviewProblemService', () => {
  it('opens, appends, and polls with a monotonic cursor before completing the session', async () => {
    const harness = createHarness();
    const opened = await harness.open();
    const session = toSessionInput(opened);
    const firstProblem = createProblem(opened.snapshotId, opened.executionId, 'first');
    const secondProblem = createProblem(opened.snapshotId, opened.executionId, 'second');

    const appended = await harness.service.append({ ...session, problems: [firstProblem, secondProblem] }, harness.ctx);

    expect(appended.items.map((item) => item.cursor)).toEqual([1, 2]);
    expect(appended.nextCursor).toBe(2);
    expect((await harness.service.list({ ...session, cursor: 0 }, harness.ctx)).items).toHaveLength(2);
    expect((await harness.service.watch({ ...session, cursor: 1 }, harness.ctx)).items).toMatchObject([
      { cursor: 2, problem: { code: 'second' } },
    ]);
    expect((await harness.service.list({ ...session, cursor: 2 }, harness.ctx)).items).toEqual([]);

    const closed = await harness.service.close({ ...session, state: 'completed' }, harness.ctx);
    expect(closed.state).toBe('completed');
    await expect(harness.service.append({ ...session, problems: [firstProblem] }, harness.ctx)).rejects.toMatchObject({
      status: 409,
    });
  });

  it('isolates app, user, role, repo, entry, owner, snapshot, artifact, execution, and session identity', async () => {
    const harness = createHarness();
    const opened = await harness.open();
    const session = toSessionInput(opened);
    const variants: Array<{
      service?: LightExtensionPreviewProblemService;
      ctx?: typeof harness.ctx;
      input?: LightExtensionPreviewProblemSessionInput;
    }> = [
      { service: new LightExtensionPreviewProblemService('other', harness.storage) },
      { ctx: { actorUserId: 'user_2', roleNames: ['member'] } },
      { ctx: { actorUserId: 'user_1', roleNames: ['admin'] } },
      { input: { ...session, repoId: 'repo_2' } },
      { input: { ...session, entryId: 'entry_2' } },
      { input: { ...session, ownerLocator: { ...ownerLocator, modelUid: 'page_2' } } },
      { input: { ...session, snapshotId: 'snapshot_2' } },
      { input: { ...session, artifactHash: 'b'.repeat(64) } },
      { input: { ...session, executionId: 'execution:other' } },
      { input: { ...session, sessionId: 'preview:other' } },
    ];

    for (const variant of variants) {
      await expect(
        (variant.service || harness.service).list(variant.input || session, variant.ctx || harness.ctx),
      ).rejects.toMatchObject({ status: 404 });
    }

    expect(
      (await harness.service.list(session, { actorUserId: 'user_1', roleNames: ['member', 'member'] })).state,
    ).toBe('active');
  });

  it('re-sanitizes problems, recomputes fingerprints, and emits one bounded overflow summary', async () => {
    const harness = createHarness();
    const opened = await harness.open();
    const session = toSessionInput(opened);
    const unsafeProblem = {
      ...createProblem('forged-snapshot', 'forged-request', 'unsafe'),
      fingerprint: 'forged',
      stack: 'Authorization: Bearer secret-token\n/root/private/file.ts:1:1',
      details: {
        token: 'secret-token',
        responseBody: { secret: true },
      },
    };
    const storm = Array.from({ length: 140 }, (_, index) => ({
      ...unsafeProblem,
      code: `storm_${index}`,
      message: `storm ${index}`,
    }));

    const result = await harness.service.append({ ...session, problems: storm }, harness.ctx);

    expect(result.items.length).toBeLessThanOrEqual(100);
    expect(result.droppedCount).toBeGreaterThan(0);
    expect(
      result.items.filter((item) => item.problem.code === 'LIGHT_EXTENSION_PREVIEW_PROBLEM_OVERFLOW'),
    ).toHaveLength(1);
    expect(
      result.items.find((item) => item.problem.code === 'LIGHT_EXTENSION_PREVIEW_PROBLEM_OVERFLOW')?.problem.details,
    ).toMatchObject({ droppedCount: result.droppedCount });
    const sanitized = result.items[0].problem;
    expect(sanitized.snapshotId).toBe(opened.snapshotId);
    expect(sanitized.fingerprint).not.toBe('forged');
    expect(JSON.stringify(sanitized)).not.toContain('secret-token');
    expect(JSON.stringify(sanitized)).not.toContain('/root/private');
  });

  it('returns expired during bounded retention and eventually evicts the cache record', async () => {
    const harness = createHarness();
    const opened = await harness.open(10_000);
    const session = toSessionInput(opened);

    harness.advance(10_000);
    expect((await harness.service.list(session, harness.ctx)).state).toBe('expired');
    await expect(
      harness.service.append(
        { ...session, problems: [createProblem(opened.snapshotId, opened.executionId, 'late')] },
        harness.ctx,
      ),
    ).rejects.toMatchObject({ status: 409 });

    harness.advance(60_001);
    await expect(harness.service.list(session, harness.ctx)).rejects.toMatchObject({ status: 404 });
  });

  it('requires both a logged-in user and an active role', async () => {
    const harness = createHarness();
    await expect(harness.open(undefined, { actorUserId: null, roleNames: ['member'] })).rejects.toMatchObject({
      status: 403,
    });
    await expect(harness.open(undefined, { actorUserId: 'user_1', roleNames: [] })).rejects.toMatchObject({
      status: 403,
    });
  });
});

function createHarness() {
  let now = Date.UTC(2026, 6, 21, 0, 0, 0);
  let sequence = 0;
  const getNow = () => now;
  const storage = new MemoryLightExtensionPreviewProblemStorage(getNow);
  const service = new LightExtensionPreviewProblemService('main', storage, getNow, () => String(++sequence));
  const ctx = { actorUserId: 'user_1', roleNames: ['member'] };
  return {
    service,
    storage,
    ctx,
    advance(ms: number) {
      now += ms;
    },
    open(ttlMs?: number, currentCtx = ctx) {
      return service.open(
        {
          repoId: 'repo_1',
          entryId: 'entry_1',
          ownerLocator,
          snapshotId: 'snapshot_1',
          artifactHash: 'a'.repeat(64),
          ...(ttlMs ? { ttlMs } : {}),
        },
        currentCtx,
      );
    },
  };
}

function toSessionInput(result: {
  sessionId: string;
  repoId: string;
  entryId: string;
  ownerLocator: LightExtensionReferenceOwnerLocator;
  snapshotId: string;
  artifactHash: string;
  executionId: string;
}): LightExtensionPreviewProblemSessionInput {
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

function createProblem(snapshotId: string, requestId: string, code: string): LightExtensionProblem {
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
