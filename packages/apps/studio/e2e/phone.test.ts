/**
 * The issue page on a phone: no shell header (the task detail's top row reaches the navigation), a summary that scrolls
 * away and leaves its one-line bar, the comment box folded to one line until tapped, and the last activity reachable
 * above it. CI runs this at iPhone 13 size
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
    // The issue's page draws its own row: the task detail's top row.
    await open(page, `/issues/${issue.identifier}`);
    await expect(page.getByRole('banner')).toBeHidden();
    const bar = page.getByTestId('task-detail-top');
    await expect(bar).toBeVisible();
    await expect(bar.getByRole('button', { name: '打开导航' })).toBeVisible();
    await open(page, '/inbox');
    await expect(page.getByRole('banner')).toBeVisible();
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

  test('the summary leaves its bar once scrolled away, the comment box opens on tap, and the last activity is reachable', async ({
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
    // The issue's page is the task detail: its summary scrolls with the content and leaves its one-line bar, and its
    // comment box is one line until tapped, below the last activity.
    await open(page, `/issues/${issue.identifier}`);
    await expect(page.getByTestId('issue-summary-bar')).toHaveCount(0);
    const folded = page.getByTestId('task-comment-folded');
    const last = page.locator('[data-comment-id]').filter({ hasText: oldest });
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeVisible();
    await expect(page.getByTestId('issue-summary-bar')).toBeVisible();
    const lastBox = (await last.boundingBox())!;
    const foldedBox = (await folded.boundingBox())!;
    expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(foldedBox.y + 1);
    await folded.click();
    await expect(page.getByRole('textbox', { name: '评论' })).toBeFocused();
  });
});
