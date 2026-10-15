import path from 'node:path';
import { BRIDGE_PROTOCOL_VERSION } from '../../../libs/acp-bridge/src/protocol.js';
import { expect, open, test, unique } from './support/fixtures.ts';
import { FakeRunner } from './support/runner.ts';

interface TaskListNode {
  scrollTop: number;
  setAttribute(name: string, value: string): void;
}

test.use({ user: 'admin', locale: 'en-US', isolatedStudio: true });

const screenshot = (name: string) =>
  path.join(process.env.TMPDIR ?? 'output', `pm409-${name}.png`);

for (const phone of [false, true]) {
  test(`embedded task run transcripts stay on My Agent${phone ? ' on a phone' : ''}`, async ({
    page,
    api,
  }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    await api.patch('users/me/preferences', {
      locale: 'en-US',
      'theme.mode': 'light',
    });
    await api.patch('projectManager', { name: 'Project manager' });
    const me = await api.get<{ userId: string }>('projects/me');
    if (!phone) {
      const held = await api.post<{
        id: string;
        title: string;
        revision: number;
      }>('projects/issues', {
        title: 'Review the merged task list',
        statusKey: 'backlog',
        executor: null,
        start: false,
      });
      await api.patch(`projects/issues/${held.id}`, {
        revision: held.revision,
        statusKey: 'in_review',
      });
      await api.post(`followUps/issues/${held.id}/follow`);
      await open(page, `/my-issues?view=split&issue=${held.id}`);
      const taskList = page.getByRole('listbox', {
        name: 'Tasks',
        exact: true,
      });
      const selected = taskList
        .getByRole('region', { name: 'Following', exact: true })
        .getByRole('option')
        .filter({ hasText: held.title });
      await expect(selected).toHaveAttribute('aria-selected', 'true');
      await taskList.evaluate((node) => {
        (node as unknown as TaskListNode).scrollTop = 60;
        (node as unknown as TaskListNode).setAttribute(
          'data-placement-check',
          'original',
        );
      });
      const scroll = await taskList.evaluate(
        (node) => (node as unknown as TaskListNode).scrollTop,
      );
      const refreshed = page.waitForResponse(
        (response) =>
          response.url().includes('/api/taskGroups?') &&
          response.request().method() === 'GET' &&
          response.ok(),
      );
      await page.getByTestId('task-status-menu').click();
      await page
        .getByRole('menuitemradio', { name: 'Done', exact: true })
        .click();
      await refreshed;
      await expect(selected.locator('[data-status-shape=done]')).toHaveCount(1);
      await expect(page.getByTestId('task-status-menu')).toContainText('Done');
      await expect(selected).toHaveAttribute('aria-selected', 'true');
      await expect(taskList).toHaveAttribute(
        'data-placement-check',
        'original',
      );
      expect(
        await taskList.evaluate(
          (node) => (node as unknown as TaskListNode).scrollTop,
        ),
      ).toBe(scroll);
      await taskList.evaluate((node) => {
        (node as unknown as TaskListNode).scrollTop = 0;
      });
      await page.screenshot({
        path: screenshot('followed-task-after-status'),
        fullPage: true,
      });
      await api.post(`followUps/issues/${held.id}/unfollow`);
    }
    const runner = new FakeRunner(api, `task-panels-${unique()}`);
    const run = await runner.issueWithTranscript(
      'Improve task navigation',
      me.userId,
    );
    const currentIssue = await api.get<{ revision: number }>(
      `projects/issues/${run.issue.id}`,
    );
    await api.patch(`projects/issues/${run.issue.id}`, {
      revision: currentIssue.revision,
      executor: { type: 'agent', id: 'studio-project-manager' },
      start: false,
    });
    await run.append([
      {
        seq: run.firstSeq,
        at: new Date().toISOString(),
        type: 'text',
        content: 'Checking task navigation in the current workspace.',
      },
    ]);

    // The split and phone lists share the same working mark and embedded task pane.
    const splitPath = `/my-issues?view=split&q=Improve%20task%20navigation${phone ? '' : `&issue=${run.issue.id}`}`;
    await open(page, splitPath);
    const list = page.getByRole('listbox', { name: 'Tasks', exact: true });
    await expect(
      list.getByRole('status', { name: /is working on this issue/ }),
    ).toBeVisible();
    await expect(
      list.getByRole('status', { name: /is working on this issue/ }),
    ).toHaveText('Agent working');
    await page.screenshot({
      path: screenshot(phone ? 'phone-list' : 'merged-list-and-working-mark'),
      fullPage: true,
    });
    if (phone)
      await list
        .getByRole('option')
        .filter({ hasText: run.issue.title })
        .click();
    const detail = page.getByTestId('task-detail');
    await expect(detail).toBeVisible();
    await detail.getByRole('tab', { name: /^Runs/ }).click();
    await detail
      .getByRole('link', { name: /View transcript/ })
      .first()
      .click();
    await expect(page.getByTestId('run-transcript')).toBeVisible();
    expect(new URL(page.url()).pathname).toMatch(/\/my-issues$/u);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Close', exact: true })
      .click();
    await expect(detail).toBeVisible();

    // A real session with a mentioned task uses the application's link panel, including its phone sheet.
    const computer = await api.post<{ computerId: string }>(
      'agentSessions/bridge/register',
      {
        protocol: BRIDGE_PROTOCOL_VERSION,
        computerId: null,
        bridgeStartedAt: `task-panels-${unique()}`,
        computer: {
          name: 'Test workstation',
          platform: 'linux',
          arch: 'x64',
          host: 'nb-studio test bridge',
          home: '/workspace',
          roots: ['/workspace'],
          agents: [{ id: 'codex', name: 'Codex', version: 'test' }],
        },
      },
    );
    const session = await api.post<{ id: string }>('agentSessions/sessions', {
      computerId: computer.computerId,
      agentId: 'codex',
      cwd: '/workspace',
      content: [{ type: 'text', text: 'Review the navigation for this task.' }],
      mentions: [{ kind: 'issue', refId: run.issue.id }],
    });
    await open(page, `/agent-sessions/${session.id}?issue=${run.issue.id}`);
    await expect(detail).toBeVisible();
    const address = page.url();
    await detail.getByRole('tab', { name: /^Runs/ }).click();
    await detail
      .getByRole('link', { name: /View transcript/ })
      .first()
      .click();
    await expect(page.getByTestId('run-transcript')).toBeVisible();
    expect(page.url()).toBe(address);
    await page.screenshot({
      path: screenshot(
        phone ? 'my-agent-phone-transcript' : 'my-agent-transcript',
      ),
      fullPage: true,
    });
    await page
      .getByRole('dialog')
      .last()
      .getByRole('button', { name: 'Close', exact: true })
      .click();
    await expect(detail).toBeVisible();
    expect(page.url()).toBe(address);
    await runner.complete(run.runId, 'Navigation verified.');

    // The task page still uses its existing addressable run route.
    await open(page, `/issues/${run.issue.identifier}/runs/${run.runId}`);
    await expect(page.getByTestId('run-transcript')).toBeVisible();
    await expect(page).toHaveURL(
      new RegExp(`/issues/${run.issue.identifier}/runs/${run.runId}$`),
    );
  });
}
