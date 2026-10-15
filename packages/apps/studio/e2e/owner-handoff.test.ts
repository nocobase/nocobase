import {
  apiAs,
  expect,
  open,
  signIn,
  test,
  unique,
  horizontalOverflow,
} from './support/fixtures.ts';
import { FakeRunner, type Issue } from './support/runner.ts';

// Manager settings, queued runs and account preferences belong to this test alone.
test.use({ isolatedStudio: true });

test('owner handoff controls in the issue and inbox, in Chinese and English', async ({
  page,
  api,
  browser,
  context,
  studio,
}) => {
  test.setTimeout(120_000);
  const admin = await apiAs(browser, 'admin', studio);
  const lisa = await apiAs(browser, 'lisa', studio);
  const me = await api.get<{ userId: string }>('projects/me');
  const next = await lisa.api.get<{ userId: string }>('projects/me');
  const settings = await admin.api.get<{
    firstChoiceAgentId: string | null;
    fallbackAgentId: string | null;
  }>('projectManager');
  try {
    const runner = new FakeRunner(admin.api, `handoff-${unique()}`);
    const agent = await runner.agent();
    await admin.api.patch('projectManager', {
      firstChoiceAgentId: agent,
      fallbackAgentId: null,
    });
    const issue = await api.post<Issue>('projects/issues', {
      title: `负责人接手 ${unique()}`,
      ownerUserId: me.userId,
      statusKey: 'in_progress',
      start: false,
    });
    await api.post(`projectManager/issues/${issue.id}/start`);
    const before = await api.get<Issue>(`projects/issues/${issue.id}`);
    await api.patch(`projects/issues/${issue.id}`, {
      revision: before.revision,
      ownerUserId: next.userId,
    });
    await open(page, `/issues/${issue.identifier}`);
    await expect(
      page.getByText('等待 Lisa Nguyen 接手', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: '接手', exact: true }),
    ).toHaveCount(0);
    await signIn(context, 'lisa', studio);
    await open(page, `/issues/${issue.identifier}`);
    await expect(
      page.getByRole('button', { name: '接手', exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: test.info().outputPath('owner-handoff-zh.png'),
    });
    await open(page, '/inbox');
    await page
      .getByRole('button', { name: new RegExp(issue.identifier) })
      .first()
      .click();
    const card = page
      .getByRole('article')
      .filter({ hasText: issue.title })
      .first();
    await expect(
      card.getByRole('button', { name: '接手', exact: true }),
    ).toBeVisible();
    await expect(
      card.getByRole('button', { name: '拒绝', exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: test.info().outputPath('owner-handoff-inbox-zh.png'),
    });
    await lisa.api.patch('users/me/preferences', { locale: 'en-US' });
    await page.evaluate(() => localStorage.setItem('nocobase.locale', 'en-US'));
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page, `/issues/${issue.identifier}`);
    await expect(
      page.getByText('Waiting for Lisa Nguyen to take over', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Take over', exact: true }),
    ).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
    await page.screenshot({
      path: test.info().outputPath('owner-handoff-en-mobile.png'),
    });
    await page.getByRole('button', { name: 'Take over', exact: true }).click();
    await expect(
      page.getByText('Waiting for Lisa Nguyen to take over', { exact: true }),
    ).toHaveCount(0);
    const current = await lisa.api.get<{ handoff: { waiting: boolean } }>(
      `issueOwnerHandoffs/${issue.id}`,
    );
    expect(current.handoff.waiting).toBe(false);
  } finally {
    await lisa.api.patch('users/me/preferences', { locale: 'zh-CN' });
    await admin.api.patch('projectManager', {
      firstChoiceAgentId: settings.firstChoiceAgentId,
      fallbackAgentId: settings.fallbackAgentId,
    });
    await lisa.close();
    await admin.close();
  }
});
