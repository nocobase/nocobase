import type { RunDetail } from '@nocobase/app-plugin-agents/shared/runs';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';

import { expect, open, test, unique } from './support/fixtures.ts';
import { FakeRunner, type Issue } from './support/runner.ts';
import { STUDIO_ISSUE_RUNS_TOPIC } from '../shared/issue-runs.ts';

test.use({
  user: 'admin',
  locale: 'en-US',
  trace: 'off',
  isolatedStudio: true,
});

for (const replies of [false, true]) {
  test(`owner delegation completes its manager continuation after a worker ${replies ? 'replies' : 'does not reply'}`, async ({
    page,
    api,
    studio,
  }) => {
    test.setTimeout(180_000);
    await api.patch('users/me/preferences', { locale: 'en-US' });
    const owner = await api.get<{ userId: string }>('projects/me');
    const settings = await api.get<{
      name: string;
      firstChoiceAgentId: string | null;
      fallbackAgentId: string | null;
      commentRunLimit: number;
    }>('projectManager');
    const manager = new FakeRunner(api, `step-manager-${unique()}`, true);
    const worker = new FakeRunner(api, `step-worker-${unique()}`, true);
    let issue: Issue | undefined;
    try {
      const workerAgent = await worker.agent();
      await api.patch('projectManager', {
        name: 'Project manager',
        firstChoiceAgentId: await manager.agent(),
        fallbackAgentId: null,
        commentRunLimit: 20,
      });
      issue = await api.post<Issue>('projects/issues', {
        title: `Delegated step continuation ${unique()}`,
        ownerUserId: owner.userId,
        statusKey: 'in_progress',
        start: false,
      });
      const commentsPath = `projects/issues/${issue.id}/comments`;
      const source = await api.post<{ comment: { id: string } }>(commentsPath, {
        content: 'Please delegate my isolated delivery to the worker.',
      });
      const managerTurn = await manager.start(issue.identifier);
      const delegation = await api.post<{ comment: { id: string } }>(
        commentsPath,
        {
          content: `[@Worker](mention://agent/${workerAgent}) implement the next step.`,
          parentId: source.comment.id,
        },
        { 'x-nocobase-run-token': managerTurn.token },
      );
      await manager.complete(managerTurn.runId, 'Done.');
      const workerTurn = await worker.start(issue.identifier);
      const ownStep = await api.get<RunDetail>(
        `agents/runs/${workerTurn.runId}`,
      );
      expect(ownStep.actorUserId).toBe(owner.userId);
      expect(ownStep.requestedByUserId).toBe(owner.userId);
      expect(ownStep.confirmedByUserId).toBeNull();
      let waitingFinishedAt: string | null = null;
      if (replies) {
        await api.post(
          commentsPath,
          {
            content: 'The implementation is ready.',
            parentId: delegation.comment.id,
          },
          { 'x-nocobase-run-token': workerTurn.token },
        );
        const waiting = await manager.start(issue.identifier);
        expect(
          (await api.get<RunDetail>(`agents/runs/${workerTurn.runId}`)).status,
        ).toBe('running');
        await manager.complete(
          waiting.runId,
          'Waiting for the worker run to end.',
        );
        waitingFinishedAt = (
          await api.get<RunDetail>(`agents/runs/${waiting.runId}`)
        ).finishedAt;
      }
      let runTopicSubscribed = false;
      const pushEvents: { receivedAt: string }[] = [];
      page.on('websocket', (socket) => {
        socket.on('framereceived', ({ payload }) => {
          const frame =
            typeof payload === 'string' ? payload : payload.toString();
          const message = JSON.parse(frame) as {
            type?: string;
            topic?: string;
          };
          if (
            message.type === 'subscribed' &&
            message.topic === STUDIO_ISSUE_RUNS_TOPIC
          )
            runTopicSubscribed = true;
          if (frame.includes('studio.issue.runs') && frame.includes(issue!.id))
            pushEvents.push({ receivedAt: new Date().toISOString() });
        });
      });
      await open(page, `/issues/${issue.identifier}`);
      await expect(
        page.getByRole('heading', { name: issue.title }),
      ).toBeVisible();
      await expect.poll(() => runTopicSubscribed).toBe(true);
      const navigations: string[] = [];
      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) navigations.push(frame.url());
      });
      const pushCountBeforeComplete = pushEvents.length;
      await worker.complete(workerTurn.runId, 'Done.');
      await expect
        .poll(() => pushEvents.length)
        .toBeGreaterThan(pushCountBeforeComplete);

      // Finish the legitimate continuation before asserting that this runner has no more work.
      const endedWorker = await api.get<RunDetail>(
        `agents/runs/${workerTurn.runId}`,
      );
      const continuation = await manager.start(issue.identifier);
      const detail = await api.get<RunDetail>(
        `agents/runs/${continuation.runId}`,
      );
      expect(detail.subject).toEqual({ kind: 'issue', id: issue.id });
      expect(detail.agentId).toBe('studio-project-manager');
      expect(detail.actorUserId).toBe(owner.userId);
      expect(detail.inputs).toHaveLength(1);
      expect(detail.inputs[0]).toMatchObject({
        type: 'signal',
        payload: {
          trigger: 'stepEnded',
          runId: workerTurn.runId,
          status: 'completed',
          eventKey: `step-ended:${workerTurn.runId}`,
        },
      });
      const threads = await api.get<IssueDetail['threads']>(commentsPath);
      const workerReplies = threads
        .flatMap((thread) => [thread.root, ...thread.replies])
        .filter((comment) => comment.authorId === workerAgent);
      expect(workerReplies).toHaveLength(1);
      expect(workerReplies[0]).toMatchObject({
        parentId: delegation.comment.id,
        rootId: source.comment.id,
        content: replies
          ? 'The implementation is ready.'
          : `The step ended: completed (run ${workerTurn.runId}).`,
      });
      // Keep the issue page mounted: terminal results and the next manager run arrive without reloading.
      await expect(
        page.getByText(workerReplies[0]!.content, { exact: true }).first(),
      ).toBeVisible();
      // The execution log is the Runs tab.
      await page.getByTestId('task-tab-runs').click();
      await expect(
        page
          .getByRole('link', {
            name: new RegExp(`Turn ended.*${workerTurn.runId}$`),
          })
          .first(),
      ).toBeVisible();
      await expect(
        page
          .getByRole('link', {
            name: new RegExp(`Running.*${continuation.runId}$`),
          })
          .first(),
      ).toBeVisible();
      expect(navigations).toEqual([]);
      await open(
        page,
        `/issues/${issue.identifier}/runs/${continuation.runId}`,
      );
      await expect(
        page.getByText('Running as Super Admin', { exact: false }).first(),
      ).toBeVisible();
      await manager.complete(
        continuation.runId,
        'The delegated step is accounted for.',
      );
      expect(await manager.probe()).toEqual([]);
      expect(await worker.probe()).toEqual([]);
      await test.info().attach('step-ended-evidence.json', {
        body: JSON.stringify(
          {
            source: 'built Studio with Playwright and controlled runner',
            origin: studio.origin,
            replies,
            refresh: {
              pushEvents,
              pushCountBeforeComplete,
              navigations,
              manualReloads: 0,
            },
            waitingFinishedAt,
            workerFinishedAt: endedWorker.finishedAt,
            managerStartedAt: detail.startedAt,
            issueId: issue.id,
            workerRunId: workerTurn.runId,
            managerRunId: continuation.runId,
            actorUserId: detail.actorUserId,
            inputs: detail.inputs.map(({ id, createdAt, payload }) => ({
              id,
              createdAt,
              payload,
            })),
            comments: workerReplies.map(
              ({ id, parentId, rootId, content }) => ({
                id,
                parentId,
                rootId,
                content,
              }),
            ),
          },
          null,
          2,
        ),
        contentType: 'application/json',
      });
    } finally {
      await api.patch('projectManager', {
        name: settings.name,
        firstChoiceAgentId: settings.firstChoiceAgentId,
        fallbackAgentId: settings.fallbackAgentId,
        commentRunLimit: settings.commentRunLimit,
      });
      if (issue)
        await api.delete(`projects/issues/${issue.id}`).catch(() => undefined);
    }
  });
}
