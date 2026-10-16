/**
 * The issue page and My follow-ups on a phone: no shell header (the page's own row reaches the navigation and the
 * agent chat), the follow-ups lists as two bottom tabs, a summary that scrolls away and leaves its one-line bar, the
 * composer folded to a slim bar until tapped, and the last activity reachable above it. CI runs this at iPhone 13 size
 * in Chromium; `pnpm exec playwright test --project=phone-webkit` runs it in WebKit as an iPhone 13.
 */
import { devices } from '@playwright/test';

import { expect, open, test, unique } from './support/fixtures.ts';
import type { Issue } from './support/runner.ts';

const { viewport, deviceScaleFactor, isMobile, hasTouch, userAgent } =
  devices['iPhone 13'];
test.use({ viewport, deviceScaleFactor, isMobile, hasTouch, userAgent });

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
    // My follow-ups draws the phone bar; the issue's page, the task detail's top row.
    for (const [path, row] of [
      ['/follow-ups', 'phone-bar'],
      [`/issues/${issue.identifier}`, 'task-detail-top'],
    ] as const) {
      await open(page, path);
      await expect(page.getByRole('banner')).toBeHidden();
      const bar = page.getByTestId(row).first();
      await expect(bar).toBeVisible();
      await expect(bar.getByRole('button', { name: '打开导航' })).toBeVisible();
    }
    await open(page, '/inbox');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByTestId('phone-bar')).toHaveCount(0);
    // The navigation still opens from the page's own row.
    await open(page, `/issues/${issue.identifier}`);
    await page
      .getByTestId('task-detail-top')
      .getByRole('button', { name: '打开导航' })
      .click();
    await expect(
      page.getByRole('navigation', { name: '应用导航' }),
    ).toBeVisible();
  });

  test('My follow-ups shows one list per bottom tab', async ({ page, api }) => {
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
      needsYou: 'Please review the completed work.',
    });
    await api.put('followUps/following', { issueIds: [review.id] });
    await open(page, '/follow-ups');
    const tabs = page.getByTestId('follow-ups-tabs');
    await expect(tabs).toBeVisible();
    await expect(page.getByTestId('follow-ups-following')).toBeVisible();
    await expect(page.getByTestId('follow-ups-mine')).toHaveCount(0);
    await tabs.getByRole('button', { name: /^我负责的/u }).click();
    await expect(page.getByTestId('follow-ups-mine')).toBeVisible();
    await expect(page.getByTestId('follow-ups-following')).toHaveCount(0);
    await tabs.getByRole('button', { name: /^关注/u }).click();
    await page
      .getByTestId('follow-ups-following')
      .locator(`[data-issue="${review.identifier}"]`)
      .click();
    // The issue alone: its Back row, and no tabs.
    await expect(page.getByTestId('follow-ups-tabs')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: '返回列表' }).first(),
    ).toBeVisible();
  });

  test('the own tab scrolls to its last issue above the tab bar', async ({
    page,
    api,
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
        needsYou: 'Please review the completed work.',
      });
      created.push(issue);
    }
    await open(page, '/follow-ups?tab=mine');
    const mine = page.getByTestId('follow-ups-mine');
    await mine.getByRole('searchbox').fill(suffix);
    const rows = mine.locator('li[data-issue]');
    await expect(rows).toHaveCount(32);
    const last = rows.last();
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport({ ratio: 1 });
    const lastBox = (await last.boundingBox())!;
    const tabsBox = (await page.getByTestId('follow-ups-tabs').boundingBox())!;
    expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(tabsBox.y + 1);
    // So many issues would crowd other tests' lists.
    for (const issue of created)
      await api.delete(`projects/issues/${issue.id}`);
  });

  test('the summary scrolls away to its bar on My follow-ups, the composer opens on tap, and the last activity is reachable', async ({
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

    for (const path of [`/follow-ups?issue=${issue.id}`]) {
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

    // The issue's page is the task detail: its summary scrolls with the content, and its comment box is one line
    // until tapped, below the last activity.
    await open(page, `/issues/${issue.identifier}`);
    const folded = page.getByTestId('task-comment-folded');
    const last = page.locator('[data-comment-id]').filter({ hasText: oldest });
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeVisible();
    const lastBox = (await last.boundingBox())!;
    const foldedBox = (await folded.boundingBox())!;
    expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(foldedBox.y + 1);
    await folded.click();
    await expect(page.getByRole('textbox', { name: '评论' })).toBeFocused();
  });
});
