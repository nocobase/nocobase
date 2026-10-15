// @vitest-environment node
/**
 * Whether a runner may take a queued run on an issue (`issueClaimRejection`, `server/agents/issue-subject.ts`): the
 * project manager works only while its issue is open, so its run queued before the issue went to backlog or finished
 * is cancelled when a runner would take it (`dormant`); an agent doing a step is always admitted; a run whose issue is
 * gone is cancelled (`subjectMissing`).
 */
import { STATUS_KEYS } from '@nocobase/app-plugin-projects/shared/statuses';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  issueClaimRejection,
  sampleIssue,
} from '../../server/agents/issue-subject.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

const MANAGER = { type: 'agent', id: PROJECT_MANAGER_ID } as const;
const DORMANT = ['backlog', 'done', 'cancelled'];

let h: BridgeHarness | undefined;
afterEach(async () => {
  await h?.close();
  h = undefined;
});

describe('issue claim admission', () => {
  const contextIn = (key: string) => ({
    ...sampleIssue('issue'),
    status: { key, name: key, category: 'started' as const },
  });

  it.each(STATUS_KEYS)(
    'admits the project manager in %s only while the issue is open',
    (status) => {
      const rejection = issueClaimRejection(contextIn(status), {
        id: PROJECT_MANAGER_ID,
      });
      if (DORMANT.includes(status))
        expect(rejection).toEqual({
          reason: 'dormant',
          detail: `SAMPLE-1 is ${status}: the project manager works only on open issues.`,
        });
      else expect(rejection).toBeNull();
    },
  );

  it.each(STATUS_KEYS)(
    'always admits an agent doing a step, in %s',
    (status) => {
      expect(
        issueClaimRejection(contextIn(status), { id: 'coder' }),
      ).toBeNull();
    },
  );
});

describe('claiming queued issue work', () => {
  async function setUp(): Promise<BridgeHarness> {
    const harness = await createBridgeHarness();
    h = harness;
    await harness.addUser('alice');
    return harness;
  }

  async function move(
    harness: BridgeHarness,
    issueId: string,
    statusKey: string,
  ): Promise<void> {
    const current = await harness.projects.issueQueries.detail(
      harness.viewer('alice'),
      issueId,
    );
    await harness.projects.issues.update(harness.viewer('alice'), issueId, {
      revision: current.revision,
      statusKey,
      ...(statusKey === 'blocked' || statusKey === 'in_review'
        ? { needsYou: 'Please review the requested work.' }
        : {}),
    });
  }

  const runsOf = (harness: BridgeHarness, issueId: string) =>
    harness.agents.runs.list({ subjectKind: 'issue', subjectId: issueId });

  it("cancels the project manager's run once its issue went back to backlog, and runs it again once started", async () => {
    const harness = await setUp();
    await harness.createAgent();
    const issue = await harness.projects.issues.create(
      harness.viewer('alice'),
      { title: 'Paused', statusKey: 'in_progress', executor: MANAGER },
    );
    await harness.projects.comments.create(harness.viewer('alice'), issue.id, {
      content: 'Keep this requirement in the issue context.',
    });
    const [queued] = await runsOf(harness, issue.id);
    await move(harness, issue.id, 'backlog');
    expect(await harness.claimOne()).toBeUndefined();
    expect(await harness.agents.runs.get(queued!.id)).toMatchObject({
      status: 'cancelled',
      attempt: 1,
      failureDetail: expect.stringContaining('dormant'),
    });

    await move(harness, issue.id, 'in_progress');
    const payload = await harness.claimOne();
    expect(payload.run.id).not.toBe(queued!.id);
    expect(payload.prompt.system).toContain(
      'Keep this requirement in the issue context.',
    );
  });

  it('admits the project manager in every open status', async () => {
    const harness = await setUp();
    await harness.createAgent();
    const issue = await harness.projects.issues.create(
      harness.viewer('alice'),
      { title: 'Review', statusKey: 'in_progress', executor: MANAGER },
    );
    await move(harness, issue.id, 'in_review');
    const payload = await harness.claimOne();
    expect((await runsOf(harness, issue.id))[0]).toMatchObject({
      id: payload.run.id,
      status: 'dispatched',
    });
  });

  it('does not wake any mentioned agent on a backlog issue', async () => {
    const harness = await setUp();
    const coder = await harness.createAgent({ name: 'Coder' });
    const issue = await harness.projects.issues.create(
      harness.viewer('alice'),
      { title: 'Someday', executor: MANAGER },
    );
    await harness.projects.comments.create(harness.viewer('alice'), issue.id, {
      content: `Have a look [@Coder](mention://agent/${coder})`,
    });
    const claimed = [await harness.claimOne(), await harness.claimOne()].filter(
      Boolean,
    );
    expect(claimed).toHaveLength(0);
    const runs = await runsOf(harness, issue.id);
    expect(runs).toEqual([]);
  });

  it('cancels a run whose issue is gone', async () => {
    const harness = await setUp();
    await harness.createAgent();
    const issue = await harness.projects.issues.create(
      harness.viewer('alice'),
      { title: 'Gone', statusKey: 'in_progress', executor: MANAGER },
    );
    const [queued] = await runsOf(harness, issue.id);
    await harness.database
      .connection()
      .repository('pmIssues')
      .updateMany({
        filter: { id: issue.id },
        values: { deletedAt: new Date().toISOString() },
      });
    expect(await harness.claimOne()).toBeUndefined();
    expect(await harness.agents.runs.get(queued!.id)).toMatchObject({
      status: 'cancelled',
      failureDetail: expect.stringContaining('subjectMissing'),
    });
  });

  it('reads a status change committed after candidate selection and before the claim transaction', async () => {
    const harness = await setUp();
    await harness.createAgent();
    const issue = await harness.projects.issues.create(
      harness.viewer('alice'),
      {
        title: 'Switch before admission',
        statusKey: 'in_progress',
        executor: MANAGER,
      },
    );
    const barrier = Promise.withResolvers<void>();
    const ready = Promise.withResolvers<void>();
    const stop = harness.agents.briefs.sections.register({
      key: 'hold-claim',
      prepare: async (run) => {
        if (run.subject.id === issue.id) {
          ready.resolve();
          await barrier.promise;
        }
      },
      section: async () => null,
    });
    const claiming = harness.claimOne();
    await ready.promise;
    try {
      await move(harness, issue.id, 'backlog');
    } finally {
      barrier.resolve();
    }
    expect(await claiming).toBeUndefined();
    stop();
    expect(
      (await runsOf(harness, issue.id)).every(
        (run) => run.status === 'cancelled',
      ),
    ).toBe(true);
  });

  it('rolls back the cancellation when the claim transaction fails', async () => {
    const harness = await setUp();
    await harness.createAgent();
    const issue = await harness.projects.issues.create(
      harness.viewer('alice'),
      {
        title: 'Atomic rejection',
        statusKey: 'in_progress',
        executor: MANAGER,
      },
    );
    await move(harness, issue.id, 'backlog');
    const sink = harness.agents.subjects.get('issue')!.sink!;
    const finish = sink.onRunFinished!;
    const spy = vi
      .spyOn(sink, 'onRunFinished')
      .mockImplementationOnce(async (tx, run) => {
        await finish(tx, run);
        throw new Error('Abort cancellation transaction');
      });
    try {
      await harness.claimOne();
    } catch {
      /* The claim endpoint may return the transaction failure. */
    }
    expect((await runsOf(harness, issue.id))[0]?.status).toBe('queued');
    spy.mockRestore();
    expect(await harness.claimOne()).toBeUndefined();
    expect((await runsOf(harness, issue.id))[0]).toMatchObject({
      status: 'cancelled',
      failureDetail: expect.stringContaining('dormant'),
    });
  });
});
