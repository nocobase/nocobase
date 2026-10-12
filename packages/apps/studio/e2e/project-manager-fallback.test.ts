/** Browser verification of the existing settings form and deterministic waiting states. */
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { expect, open, test, horizontalOverflow } from './support/fixtures.ts';
import { FakeRunner } from './support/runner.ts';
import type { AgentBoard } from '../shared/agent-board.js';
import type { IssueProgress } from '../shared/project-manager.js';

test.use({ user: 'admin' });
test.setTimeout(240_000);

test('edits the fallback delay and renders waiting reasons in both languages', async ({
  page,
  api,
}) => {
  const errors: string[] = [];
  const screenshots =
    process.env.TMPDIR ??
    path.resolve(import.meta.dirname, '../output/project-manager-fallback');
  mkdirSync(screenshots, { recursive: true });
  page.on('pageerror', (error) => errors.push(error.message));
  const issue = await api.post<{ id: string; identifier: string }>(
    'projects/issues',
    { title: 'Manager fallback browser validation' },
  );
  for (const locale of ['en-US', 'zh-CN']) {
    await api.patch('users/me/preferences', {
      locale,
      'theme.mode': locale === 'en-US' ? 'light' : 'dark',
    });
    await page.setViewportSize({
      width: locale === 'en-US' ? 1440 : 375,
      height: 900,
    });
    await open(page, '/agents/project-manager');
    const label =
      locale === 'en-US' ? 'Fallback delay (seconds)' : '备选等待时间（秒）';
    const field = page.getByLabel(label);
    await expect(field).toHaveValue('120');
    await page.screenshot({
      path: path.resolve(screenshots, `pm292-settings-default-${locale}.png`),
    });
    await field.fill('0');
    await expect(
      page.getByRole('button', {
        name: locale === 'en-US' ? 'Save' : '保存',
        exact: true,
      }),
    ).toBeDisabled();
    await field.fill('60');
    const delegation = page.getByLabel(
      locale === 'en-US'
        ? 'Delegated step queue timeout (seconds)'
        : '委派排队超时（秒）',
    );
    await expect(delegation).toHaveValue('600');
    await delegation.fill('0');
    await expect(
      page.getByRole('button', {
        name: locale === 'en-US' ? 'Save' : '保存',
        exact: true,
      }),
    ).toBeDisabled();
    await delegation.fill('90');
    await page.screenshot({
      path: path.resolve(screenshots, `pm292-settings-${locale}.png`),
    });
    // Exercise the real PATCH route; no model or runner is started by saving settings.
    await page
      .getByRole('button', {
        name: locale === 'en-US' ? 'Save' : '保存',
        exact: true,
      })
      .click();
    await expect
      .poll(
        async () =>
          (await api.get<{ fallbackAfterSeconds: number }>('projectManager'))
            .fallbackAfterSeconds,
      )
      .toBe(60);
    expect(
      (
        await api.get<{ delegationQueueTimeoutSeconds: number }>(
          'projectManager',
        )
      ).delegationQueueTimeoutSeconds,
    ).toBe(90);
    await api.patch('projectManager', {
      fallbackAfterSeconds: 120,
      delegationQueueTimeoutSeconds: 600,
    });
    for (const reason of ['busy', 'incompatible', 'offline'] as const) {
      const progress: IssueProgress = {
        state: 'queued',
        agent: { id: 'studio-project-manager', name: 'Project manager' },
        step: null,
        since: null,
        runner: null,
        pullRequest: null,
        question: null,
        next: null,
        handOver: false,
        managerWait: {
          queueEnteredAt: new Date().toISOString(),
          fallbackAfterSeconds: 120,
          sampledAt: new Date().toISOString(),
          entries: [
            {
              tool: 'claude',
              model: 'Opus 5.5',
              reason,
              compatibleCount: reason === 'busy' ? 1 : 0,
              runners: reason === 'busy' ? ['test-lima'] : [],
            },
            {
              tool: 'codex',
              model: 'GPT-6 Astra',
              reason: reason === 'offline' ? 'offline' : 'busy',
              compatibleCount: reason === 'offline' ? 0 : 1,
              runners: [],
            },
          ],
        },
      };
      await page.route(`**/api/issueProgress/${issue.id}`, (route) =>
        route.fulfill({ json: { data: progress } }),
      );
      await open(page, `/issues/${issue.identifier}`);
      const sentence = page.getByText(
        locale === 'en-US'
          ? /Project manager waiting for a runner:/
          : /项目经理在等执行机：/,
      );
      await expect(sentence).toBeVisible();
      await expect(sentence).toContainText('Opus 5.5');
      await expect(sentence).toContainText('GPT-6 Astra');
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: path.resolve(screenshots, `pm292-wait-${reason}-${locale}.png`),
      });
      await page.unroute(`**/api/issueProgress/${issue.id}`);
    }
    for (const reason of [
      'busy',
      'noSharedRunner',
      'toolNotInstalled',
      'toolUnavailable',
      'incompatible',
    ] as const) {
      const progress: IssueProgress = {
        state: 'queued',
        agent: { id: 'worker', name: 'Worker' },
        step: 'Implement the step',
        since: null,
        runner: null,
        pullRequest: null,
        question: null,
        next: null,
        handOver: false,
        managerWait: {
          queueEnteredAt: new Date().toISOString(),
          fallbackAfterSeconds: 0,
          sampledAt: new Date().toISOString(),
          entries: [
            {
              tool: 'claude',
              model: 'Opus 5.5',
              reason,
              compatibleCount: reason === 'busy' ? 1 : 0,
              runners: reason === 'busy' ? ['test-lima'] : [],
              runnerLoads:
                reason === 'busy'
                  ? [
                      {
                        name: 'test-lima',
                        used: 8,
                        limit: 8,
                        toolUsed: 2,
                        toolLimit: 2,
                        reportedFree: 0,
                      },
                    ]
                  : [],
            },
          ],
        },
      };
      await page.route(`**/api/issueProgress/${issue.id}`, (route) =>
        route.fulfill({ json: { data: progress } }),
      );
      await open(page, `/issues/${issue.identifier}`);
      await expect(
        page.getByText(
          locale === 'en-US'
            ? /Worker waiting for a runner:/u
            : /Worker 在等执行机：/u,
        ),
      ).toBeVisible();
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: path.resolve(screenshots, `pm292-worker-${reason}-${locale}.png`),
      });
      await page.unroute(`**/api/issueProgress/${issue.id}`);
    }
    await page.route(`**/api/issueProgress/${issue.id}`, (route) =>
      route.fulfill({
        json: {
          data: {
            state: 'waitingForContinuation',
            agent: null,
            step: null,
            since: null,
            runner: null,
            pullRequest: null,
            question: null,
            next: null,
            handOver: false,
          },
        },
      }),
    );
    await open(page, `/issues/${issue.identifier}`);
    await expect(
      page.getByText(
        locale === 'en-US'
          ? /Waiting for manual continuation:/u
          : /等待人工继续：/u,
      ),
    ).toBeVisible();
    await page.screenshot({
      path: path.resolve(screenshots, `pm292-manual-${locale}.png`),
    });
    await page.unroute(`**/api/issueProgress/${issue.id}`);
  }
  expect(errors).toEqual([]);
});

test('shows the shared diagnostics in the Agent queue', async ({
  page,
  api,
}) => {
  const screenshots =
    process.env.TMPDIR ??
    path.resolve(import.meta.dirname, '../output/project-manager-fallback');
  mkdirSync(screenshots, { recursive: true });
  const runner = new FakeRunner(api, `pm292-queue-${Date.now()}`);
  const agentId = await runner.agent();
  const issue = await api.post<{
    id: string;
    identifier: string;
    title: string;
  }>('projects/issues', {
    title: 'PM-292 queue diagnostics',
    statusKey: 'in_progress',
    start: false,
  });
  await runner.wake(issue);
  const board = await api.get<AgentBoard>('agentBoard');
  const original = board.rows.find((row) => row.issue.id === issue.id)!;
  const workerEntry =
    original.agentId === agentId
      ? original
      : original.others.find((entry) => entry.agentId === agentId)!;
  expect(workerEntry.queue).toBeTruthy();
  for (const locale of ['en-US', 'zh-CN']) {
    await api.patch('users/me/preferences', { locale });
    await page.setViewportSize({
      width: locale === 'en-US' ? 1440 : 375,
      height: 900,
    });
    for (const reason of [
      'runnersBusy',
      'concurrencyFull',
      'noSharedRunner',
      'toolNotInstalled',
      'toolUnavailable',
      'incompatible',
    ] as const) {
      const fixture = {
        ...board,
        rows: [
          {
            ...original,
            ...workerEntry,
            others: [],
            queue: {
              ...workerEntry.queue!,
              reason,
              params: {
                tool: 'claude',
                used: 8,
                limit: reason === 'concurrencyFull' ? 1 : 8,
                active: 1,
                detail: 'claude 2/2',
              },
            },
          },
        ],
        agents: {
          [agentId]: {
            ...board.agents[agentId]!,
            ...(reason === 'concurrencyFull'
              ? { active: 1, maxConcurrentRuns: 1 }
              : {}),
          },
        },
      };
      await page.route('**/api/agentBoard*', (route) =>
        route.fulfill({ json: { data: fixture } }),
      );
      await open(page, '/issues?view=agent');
      const lane = page.locator(`[data-agent="${agentId}"]`);
      await expect(
        lane.getByRole('link').filter({ hasText: issue.title }),
      ).toBeVisible();
      const text =
        reason === 'concurrencyFull'
          ? '1/1'
          : reason === 'runnersBusy'
            ? locale === 'en-US'
              ? 'Compatible runners are full'
              : '可承接的执行机满载'
            : reason === 'noSharedRunner'
              ? locale === 'en-US'
                ? 'personal'
                : '个人'
              : reason === 'toolNotInstalled'
                ? locale === 'en-US'
                  ? 'installed'
                  : '未安装'
                : reason === 'toolUnavailable'
                  ? locale === 'en-US'
                    ? 'signed in'
                    : '登录'
                  : locale === 'en-US'
                    ? 'upgrade'
                    : '升级';
      await expect(lane).toContainText(text);
      await page.screenshot({
        path: path.resolve(screenshots, `pm292-queue-${reason}-${locale}.png`),
      });
      await page.unroute('**/api/agentBoard*');
    }
  }
});
