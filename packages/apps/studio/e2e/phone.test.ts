/**
 * The issue page and My follow-ups on a phone: no shell header (the page's own row reaches the navigation and the
 * agent chat), the personal workspace lists as reachable partitions, a summary that scrolls away and leaves its one-line bar, the
 * composer folded to a slim bar until tapped, and the last activity reachable above it. CI runs this at iPhone 13 size
 * in Chromium; `pnpm exec playwright test --project=phone-webkit` runs it in WebKit as an iPhone 13.
 */
import { devices } from '@playwright/test';

import {
  expect,
  horizontalOverflow,
  open,
  test,
  unique,
} from './support/fixtures.ts';
import type { Issue } from './support/runner.ts';
import { deleteTestIssues, wheelTo } from './support/personal-task-scroll.ts';

const { viewport, deviceScaleFactor, isMobile, hasTouch, userAgent } =
  devices['iPhone 13'];
test.use({
  viewport,
  deviceScaleFactor,
  isMobile,
  hasTouch,
  userAgent,
  user: 'leo',
});

test.describe('phone', () => {
  test('the header gives way on the issue pages and stays on others', async ({
    page,
    api,
  }) => {
    const me = await api.get<{ userId: string }>('projects/me');
    const issue = await api.post<Issue>('projects/issues', {
      title: `手机头部 ${unique()}`,
      ownerUserId: me.userId,
      start: false,
    });
    for (const path of ['/follow-ups', `/issues/${issue.identifier}`]) {
      await open(page, path);
      await expect(page.getByRole('banner')).toBeHidden();
      const bar = page.getByTestId('phone-bar').first();
      await expect(bar).toBeVisible();
      await expect(bar.getByRole('button', { name: '打开导航' })).toBeVisible();
    }
    await open(page, '/inbox');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByTestId('phone-bar')).toHaveCount(0);
    // The navigation still opens from the page's own row.
    await open(page, `/issues/${issue.identifier}`);
    await page
      .getByTestId('phone-bar')
      .first()
      .getByRole('button', { name: '打开导航' })
      .click();
    await expect(
      page.getByRole('navigation', { name: '应用导航' }),
    ).toBeVisible();
  });

  test('My tasks-α shows one list per partition with explicit following', async ({
    page,
    api,
    browser,
  }) => {
    const me = await api.get<{ userId: string }>('projects/me');
    const suffix = unique();
    const review = await api.post<Issue>('projects/issues', {
      title: `待验收 ${suffix}`,
      ownerUserId: me.userId,
      start: false,
    });
    await api.patch(`projects/issues/${review.id}`, {
      revision: review.revision,
      statusKey: 'in_review',
    });
    await api.put('followUps/following', { issueIds: [review.id] });
    await open(page, '/follow-ups?view=list&tab=following');
    const tabs = page.getByRole('navigation', { name: '个人任务分区' });
    await expect(tabs).toBeVisible();
    await expect(page.getByTestId('follow-ups-following')).toBeVisible();
    await expect(page.getByRole('textbox', { name: '搜索任务' })).toBeHidden();
    await tabs.getByRole('button', { name: '我的任务-α', exact: true }).click();
    await page.getByRole('button', { name: /^筛选/u }).click();
    await expect(page.getByRole('textbox', { name: '搜索任务' })).toBeVisible();
    await expect(page.getByTestId('follow-ups-following')).toBeHidden();
    await tabs.getByRole('button', { name: /^关注/u }).click();
    await page
      .getByTestId('follow-ups-following')
      .getByRole('button')
      .filter({ hasText: review.title })
      .click();
    // The issue alone: its Back row, and no tabs.
    await expect(tabs).toBeHidden();
    await expect(
      page.getByRole('button', { name: '返回列表' }).first(),
    ).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    await page.getByRole('button', { name: '返回列表' }).click();
    await expect(tabs).toBeVisible();
    await api.put('followUps/following', { issueIds: [] });
    await deleteTestIssues(browser, [review.id]);
  });

  test('the personal task partition scrolls to its last issue and retains its position on return', async ({
    page,
    api,
    browser,
  }) => {
    test.setTimeout(180_000);
    const me = await api.get<{ userId: string }>('projects/me');
    const suffix = unique();
    const created: Issue[] = [];
    for (let index = 0; index < 32; index += 1) {
      const issue = await api.post<Issue>('projects/issues', {
        title: `手机列表 ${suffix} ${String(index).padStart(2, '0')}`,
        ownerUserId: me.userId,
        start: false,
      });
      await api.patch(`projects/issues/${issue.id}`, {
        revision: issue.revision,
        statusKey: 'in_review',
      });
      created.push(issue);
    }
    await api.put('followUps/following', { issueIds: [created[0]!.id] });
    await open(page, `/follow-ups?view=list&tab=mine&q=${suffix}`);
    await page.getByRole('button', { name: /^筛选/u }).click();
    await expect(page.getByRole('textbox', { name: '搜索任务' })).toHaveValue(
      suffix,
    );
    const table = page.getByRole('table');
    const rows = table.getByRole('row').filter({ hasText: suffix });
    await expect(rows).toHaveCount(32);
    const last = rows.last().getByRole('link');
    await wheelTo(page, table, last, true);
    const lastBox = (await last.boundingBox())!;
    const workspaceBox = (await page
      .getByTestId('personal-task-workspace')
      .boundingBox())!;
    expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(
      workspaceBox.y + workspaceBox.height + 1,
    );
    expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(
      page.viewportSize()!.height + 1,
    );
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    const partitions = page.getByRole('navigation', { name: '个人任务分区' });
    await partitions.getByRole('button', { name: '关注', exact: true }).click();
    await expect(page.getByTestId('follow-ups-following')).toBeVisible();
    await partitions
      .getByRole('button', { name: '我的任务-α', exact: true })
      .click();
    await expect(last).toBeInViewport({ ratio: 1 });
    await api.put('followUps/following', { issueIds: [] });
    // So many issues would crowd other tests' lists.
    await deleteTestIssues(
      browser,
      created.map((issue) => issue.id),
    );
  });

  test('the summary scrolls away to its bar, the composer opens on tap, and the last activity is reachable', async ({
    page,
    api,
  }) => {
    const me = await api.get<{ userId: string }>('projects/me');
    const issue = await api.post<Issue>('projects/issues', {
      title: `手机滚动 ${unique()}`,
      description: '一段描述。',
      ownerUserId: me.userId,
      start: false,
    });
    const oldest = `最早的评论 ${unique()}`;
    await api.post(`projects/issues/${issue.id}/comments`, { content: oldest });
    for (let index = 1; index <= 8; index += 1)
      await api.post(`projects/issues/${issue.id}/comments`, {
        content: `第 ${index} 条评论：${'内容很长，'.repeat(12)}`,
      });
    await api.put('followUps/following', { issueIds: [issue.id] });

    for (const path of [
      `/follow-ups?issue=${issue.id}`,
      `/issues/${issue.identifier}`,
    ]) {
      await open(page, path);
      const summary = page.getByTestId('issue-summary');
      // A phone starts with the one-line bar; opening it shows the whole summary, which scrolls with the page.
      await expect(summary).toHaveAttribute('data-collapsed', '');
      await summary.getByRole('button', { name: '展开摘要' }).click();
      await expect(summary).not.toHaveAttribute('data-collapsed', '');
      await expect(page.getByTestId('issue-summary-bar')).toHaveCount(0);

      const composer = page.getByTestId('issue-composer');
      await expect(composer).toHaveAttribute('data-folded', '');
      const last = page
        .locator('[data-comment-id]')
        .filter({ hasText: oldest });
      await last.scrollIntoViewIfNeeded();
      await expect(last).toBeVisible();
      // Once the summary is gone, its bar stays at the top.
      await expect(page.getByTestId('issue-summary-bar')).toBeVisible();
      const lastBox = (await last.boundingBox())!;
      const composerBox = (await composer.boundingBox())!;
      expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(composerBox.y + 1);

      await composer.getByRole('button', { name: /写评论/u }).click();
      const editor = page.getByRole('textbox', { name: '评论' });
      await expect(editor).toBeFocused();
      await expect(composer).not.toHaveAttribute('data-folded', '');
      // Left empty, it folds again.
      await page
        .getByTestId('issue-summary-bar')
        .click({ position: { x: 4, y: 4 } });
      await expect(composer).toHaveAttribute('data-folded', '');
    }
  });
});
