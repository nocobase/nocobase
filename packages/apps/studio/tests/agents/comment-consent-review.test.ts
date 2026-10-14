// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { PROJECT_MANAGER_ID as PM } from '../../shared/project-manager.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  await h.addUser('bob');
  h.roles.set('bob', 'admin');
  await h.createAgent();
});
afterEach(async () => h.close());
const runs = (id: string) =>
  h.agents.runs.list({ subjectKind: 'issue', subjectId: id });
const issue = () =>
  h.projects.issues.create(h.viewer('alice'), {
    title: 'Comment delegation',
    statusKey: 'in_progress',
    start: false,
  });
const personal = () =>
  h.database
    .connection()
    .repository('agRunners')
    .updateMany({
      filter: { trust: 'team' },
      values: { trust: 'ownerOnly', ownerUserId: 'alice' },
    });

describe('comment delegation and identity switching', () => {
  it.each(['alice', 'bob'])(
    'keeps the verified %s source through a manager comment and personal claim',
    async (author) => {
      const task = await issue();
      const source = await h.projects.comments.create(
        h.viewer(author),
        task.id,
        { content: 'Please implement my request.' },
      );
      const [root] = await runs(task.id);
      const claimed = await h.claimOne();
      await personal();
      const worker = await h.createAgent({ name: 'Delegated worker' });
      const delegated = await h.request(
        'POST',
        `/projects/issues/${task.id}/comments`,
        {
          runToken: claimed.cli.credential.content.token,
          body: {
            content: `[@Worker](mention://agent/${worker}) implement the next step`,
            parentId: source.comment.id,
          },
        },
      );
      expect(delegated.status).toBe(201);
      expect(delegated.body.data.comment.source.runId).toBe(root.id);
      const child = (await runs(task.id)).find(
        (run) => run.agentId === worker,
      )!;
      expect(child.requestedByUserId).toBe(author);
      expect(
        (await h.agents.runs.detail(child.id)).inputs.some(
          (input) =>
            (input.payload as { causedByRunId?: string } | null)
              ?.causedByRunId === root.id,
        ),
      ).toBe(true);
      const pending = await h.agents.runs.requests.list({
        userId: 'alice',
        status: 'pending',
      });
      if (author === 'alice') {
        expect(
          pending.filter((request) => request.purpose === 'personalRunner'),
        ).toEqual([]);
        expect((await h.claimOne()).run.id).toBe(child.id);
      } else {
        expect(pending).toHaveLength(1);
        expect(pending[0]).toMatchObject({
          requestedByUserId: 'bob',
          responsibleUserId: 'alice',
        });
        expect(await h.claimOne()).toBeUndefined();
      }
    },
  );

  it.each(['pending', 'rejected'])(
    'preserves worker and manager through the real comment entry and %s Run as me',
    async (state) => {
      await h.claimOne();
      await personal();
      const worker = await h.createAgent({ name: 'Mentioned worker' });
      const task = await issue();
      await h.projects.comments.create(h.viewer('bob'), task.id, {
        content: `[@Worker](mention://agent/${worker}) work with the manager`,
      });
      const before = await runs(task.id);
      expect(before.map((run) => run.agentId).sort()).toEqual(
        [worker, PM].sort(),
      );
      const [request] = await h.agents.runs.requests.list({
        userId: 'alice',
        status: 'pending',
      });
      if (state === 'rejected')
        await h.agents.runs.requests.reject(request.id, 'alice');
      await h.database
        .connection()
        .repository('agRunners')
        .updateMany({
          filter: { ownerUserId: 'alice' },
          values: { trust: 'team' },
        });
      await h.agents.runs.requests.runAsRequester(request.id, 'bob');
      const after = await runs(task.id);
      const queued = after.filter((run) => run.status === 'queued');
      expect(queued.map((run) => run.agentId).sort()).toEqual(
        [worker, PM].sort(),
      );
      expect(
        queued.every(
          (run) =>
            run.actorUserId === 'bob' && run.commentExecution === 'requester',
        ),
      ).toBe(true);
      expect(new Set(queued.map((run) => run.commentRootRunId)).size).toBe(1);
      expect(
        after
          .filter((run) => before.some((old) => old.id === run.id))
          .every((run) => run.status === 'cancelled'),
      ).toBe(true);
      await expect(
        h.agents.runs.requests.runAsRequester(request.id, 'bob'),
      ).rejects.toMatchObject({ code: 'RUN_REQUEST_SETTLED' });
      for (let n = 0; n < 2; n++) {
        const taken = await h.claimOne();
        expect(queued.map((run) => run.id)).toContain(taken.run.id);
        expect((await h.agents.runs.get(taken.run.id)).actorUserId).toBe('bob');
      }
    },
  );
});
