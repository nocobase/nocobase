/**
 * My follow-ups on a wide screen: the three columns fill the visible area below the page heading and each scrolls on
 * its own, so the last of many owned issues, and the last followed one, can be reached.
 */
import type { Locator, Page } from '@playwright/test';

import { expect, open, test, unique } from './support/fixtures.ts';
import type { Issue } from './support/runner.ts';

/** The element sits inside the visible part of its column and of the window. */
async function expectReachable(page: Page, column: Locator, item: Locator) {
  await item.scrollIntoViewIfNeeded();
  const area = (await column.boundingBox())!;
  const box = (await item.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.y).toBeGreaterThanOrEqual(area.y - 1);
  expect(box.y + box.height).toBeLessThanOrEqual(area.y + area.height + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}

test.describe('My follow-ups columns', () => {
  test('each column scrolls to its last item at common desktop sizes', async ({
    page,
    api,
  }) => {
    test.setTimeout(180_000);
    const me = await api.get<{ userId: string }>('projects/me');
    const suffix = unique();
    const issues: Issue[] = [];
    for (let index = 0; index < 32; index += 1) {
      const created = await api.post<Issue>('projects/issues', {
        title: `验收列表 ${suffix} ${String(index).padStart(2, '0')}`,
        ownerUserId: me.userId,
        executor: null,
        start: false,
      });
      // In review, the status My follow-ups lists when it opens.
      await api.patch(`projects/issues/${created.id}`, {
        revision: created.revision,
        statusKey: 'in_review',
      });
      issues.push(created);
    }
    await api.put('followUps/following', {
      issueIds: issues.slice(0, 5).map((issue) => issue.id),
    });

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1280, height: 720 },
    ]) {
      await page.setViewportSize(viewport);
      await open(page, '/follow-ups');
      const mine = page.getByTestId('follow-ups-mine');
      await mine.getByRole('searchbox').fill(suffix);
      const rows = mine.locator('li[data-issue]');
      await expect(rows).toHaveCount(32);
      // The oldest activity is listed last.
      await expectReachable(page, mine, rows.last());

      const rail = page.getByTestId('follow-ups-following');
      await expectReachable(page, rail, rail.locator('[data-issue]').last());

      // The window itself does not need to scroll to reach them.
      const columns = page.getByTestId('follow-ups-columns');
      const box = (await columns.boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
    }
    // So many issues would crowd other tests' lists.
    await api.put('followUps/following', { issueIds: [] });
    for (const issue of issues) await api.delete(`projects/issues/${issue.id}`);
  });
});
