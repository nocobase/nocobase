/**
 * My follow-ups on a wide screen: the three columns fill the visible area below the page heading and each scrolls on
 * its own, so the last of many owned issues, and the last followed one, can be reached.
 */
import type { Locator, Page } from '@playwright/test';

import { expect, open, test, unique } from './support/fixtures.ts';
import type { Issue } from './support/runner.ts';

/** What the test reads from a scrolling element, without the DOM library. */
interface ScrollArea {
  readonly scrollHeight: number;
  readonly clientHeight: number;
}

/**
 * Wheels over `scroller` until `item` is inside both it and the window, the way a person reaches it. `overflows` says the
 * scroller must have more than it shows.
 */
async function wheelTo(
  page: Page,
  scroller: Locator,
  item: Locator,
  overflows: boolean,
) {
  const metrics = await scroller.evaluate((element: ScrollArea) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }));
  if (overflows)
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  const area = (await scroller.boundingBox())!;
  await page.mouse.move(area.x + area.width / 2, area.y + area.height / 2);
  const viewport = page.viewportSize()!;
  await expect(async () => {
    await page.mouse.wheel(0, 600);
    const box = (await item.boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(area.y + area.height + 1);
  }).toPass({ intervals: [100], timeout: 20_000 });
  const box = (await item.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(area.y - 1);
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
        needsYou: 'Please review the completed work.',
      });
      issues.push(created);
    }
    await api.put('followUps/following', {
      issueIds: issues.slice(0, 5).map((issue) => issue.id),
    });

    for (const viewport of [
      { width: 1512, height: 800 },
      { width: 1440, height: 760 },
      { width: 1280, height: 680 },
      { width: 1728, height: 1000 },
      // 1440x760 at 90% and 110% browser zoom.
      { width: 1600, height: 844 },
      { width: 1309, height: 691 },
    ]) {
      await page.setViewportSize(viewport);
      await open(page, '/follow-ups');
      const mine = page.getByTestId('follow-ups-mine');
      await mine.getByRole('searchbox').fill(suffix);
      const rows = mine.locator('li[data-issue]');
      await expect(rows).toHaveCount(32);
      // The oldest activity is listed last.
      await wheelTo(page, mine.getByRole('list'), rows.last(), true);

      const rail = page.getByTestId('follow-ups-following');
      await wheelTo(page, rail, rail.locator('[data-issue]').last(), false);

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
