/** Browser verification of the existing settings form and deterministic waiting states. */
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { expect, open, test, horizontalOverflow } from './support/fixtures.ts';
import type { IssueProgress } from '../shared/project-manager.js';

test.use({ user: 'admin' });
test.setTimeout(120_000);

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
    await field.fill('0');
    await expect(
      page.getByRole('button', {
        name: locale === 'en-US' ? 'Save' : '保存',
        exact: true,
      }),
    ).toBeDisabled();
    await field.fill('60');
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
    await api.patch('projectManager', { fallbackAfterSeconds: 120 });
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
  }
  expect(errors).toEqual([]);
});
