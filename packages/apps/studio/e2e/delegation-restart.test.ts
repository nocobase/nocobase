/** Destructive recovery checks use their own server, database and port. */
import path from 'node:path';
import { mkdirSync, rmSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { Api, signIn } from './support/fixtures.ts';
import {
  startStudio,
  stopStudio,
  restartOwnedStudio,
  readState,
} from './support/server.ts';
import { FakeRunner } from './support/runner.ts';

test.setTimeout(300_000);

test('recovers an expired delegation after SIGKILL and does not report it twice after another restart', async ({
  browser,
}) => {
  const screenshots =
    process.env.TMPDIR ??
    path.resolve(import.meta.dirname, '../output/project-manager-fallback');
  mkdirSync(screenshots, { recursive: true });
  let state = await startStudio({ isolated: true });
  const context = await browser.newContext();
  try {
    await signIn(context, 'admin', state);
    const page = await context.newPage();
    const api = new Api(context.request, state);
    const shared = readState();
    expect(state.origin).not.toBe(shared.origin);
    expect(state.directory).not.toBe(shared.directory);
    const sharedPid = shared.pid;
    const worker = new FakeRunner(api, `pm292-crash-worker-${Date.now()}`);
    const workerAgent = await worker.discovered();
    const manager = new FakeRunner(
      api,
      `pm292-crash-manager-${Date.now()}`,
      true,
    );
    const managerChoice = await manager.agent();
    await api.patch('projectManager', {
      firstChoiceAgentId: managerChoice,
      fallbackAgentId: null,
      delegationQueueTimeoutSeconds: 20,
    });
    const issue = await api.post<{ id: string; identifier: string }>(
      'projects/issues',
      {
        title: 'PM-292 restart recovery',
        statusKey: 'in_progress',
        executor: { type: 'agent', id: 'studio-project-manager' },
      },
    );
    const turn = await manager.start(issue.identifier);
    await api.post<{ comment: { id: string } }>(
      `projects/issues/${issue.id}/comments`,
      {
        content: `[@${workerAgent.name}](mention://agent/${workerAgent.id}) implement the restart recovery step`,
      },
      { 'x-nocobase-run-token': turn.token },
    );
    await manager.complete(turn.runId, 'Done.');
    const beforeCrash = await api.get<{ agentId: string; status: string }[]>(
      `agents/runs?subjectKind=issue&subjectId=${issue.id}`,
    );
    expect(
      beforeCrash.find((run) => run.agentId === workerAgent.id)?.status,
    ).toBe('queued');
    state = await restartOwnedStudio(state);
    expect(readState().pid).toBe(sharedPid);
    expect((await fetch(`${shared.baseURL}/login`)).ok).toBe(true);
    const comments = () =>
      api.get<
        {
          root: { id: string; authorId: string; content: string };
          replies: { id: string; authorId: string; content: string }[];
        }[]
      >(`projects/issues/${issue.id}/comments`);
    const replies = async () =>
      (await comments())
        .flatMap((thread) => [thread.root, ...thread.replies])
        .filter((comment) => comment.authorId === workerAgent.id);
    await expect
      .poll(async () => await replies(), { timeout: 60_000, intervals: [1000] })
      .toHaveLength(1);
    const reply = (await replies())[0]!;
    expect(reply.content).toContain('withdrawn');
    expect(reply.content).not.toContain('mention://');
    const runList = await api.get<
      { id: string; agentId: string; status: string; failureReason: string }[]
    >(`agents/runs?subjectKind=issue&subjectId=${issue.id}`);
    expect(runList.find((run) => run.agentId === workerAgent.id)).toMatchObject(
      {
        status: 'cancelled',
        failureReason: 'delegatedQueueTimeout',
      },
    );
    const managerRuns = runList.filter(
      (run) => run.agentId === 'studio-project-manager',
    );
    expect(managerRuns).toHaveLength(2);
    state = await restartOwnedStudio(state);
    expect(readState().pid).toBe(sharedPid);
    expect((await fetch(`${shared.baseURL}/login`)).ok).toBe(true);
    expect(await replies()).toHaveLength(1);
    const afterRestart = await api.get<{ agentId: string }[]>(
      `agents/runs?subjectKind=issue&subjectId=${issue.id}`,
    );
    expect(
      afterRestart.filter((run) => run.agentId === 'studio-project-manager'),
    ).toHaveLength(2);
    await api.patch('users/me/preferences', { locale: 'en-US' });
    await page.goto(`${state.baseURL}/issues/${issue.identifier}`);
    await page.waitForLoadState('networkidle');
    const timeoutReply = page
      .getByText(reply.content, { exact: false })
      .first();
    await expect(timeoutReply).toBeVisible();
    await expect(timeoutReply).toBeInViewport();
    await page.screenshot({
      path: path.resolve(screenshots, 'pm292-restart-timeout-reply-en-US.png'),
    });
  } finally {
    await context.close();
    await stopStudio(state);
    rmSync(state.directory, { recursive: true, force: true });
  }
});
