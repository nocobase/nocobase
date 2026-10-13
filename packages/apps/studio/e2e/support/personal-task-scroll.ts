/** Read the actual vertical scroller around a semantic table, rail or activity region. */
import type { Browser, Locator, Page } from '@playwright/test';
import { apiAs, expect } from './fixtures.ts';

/** Isolated contributor viewers can create/edit their own fixtures but cannot delete issues. */
export async function deleteTestIssues(
  browser: Browser,
  ids: readonly string[],
) {
  const admin = await apiAs(browser, 'alex');
  try {
    for (const id of ids) await admin.api.delete(`projects/issues/${id}`);
  } finally {
    await admin.close();
  }
}

interface ScrollArea {
  x: number;
  y: number;
  width: number;
  height: number;
  scrollHeight: number;
  clientHeight: number;
}

export async function wheelTo(
  page: Page,
  content: Locator,
  item: Locator,
  overflows: boolean,
) {
  const area = await content.evaluate<ScrollArea, void>(`(element) => {
    let scroller = element;
    while (scroller && !(getComputedStyle(scroller).overflowY.match(/auto|scroll/) && scroller.clientHeight > 0 && scroller.scrollHeight > scroller.clientHeight)) scroller = scroller.parentElement;
    if (!scroller) throw new Error('No bounded vertical scroller around the content');
    const box = scroller.getBoundingClientRect();
    return {x: box.x, y: box.y, width: box.width, height: box.height, scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight};
  }`);
  if (overflows) expect(area.scrollHeight).toBeGreaterThan(area.clientHeight);
  await page.mouse.move(area.x + area.width / 2, area.y + area.height / 2);
  await expect(async () => {
    await page.mouse.wheel(0, 600);
    const box = (await item.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(area.y - 1);
    expect(box.y + box.height).toBeLessThanOrEqual(area.y + area.height + 1);
  }).toPass({ intervals: [100], timeout: 20_000 });
  await expect(item).toBeInViewport({ ratio: 1 });
}
