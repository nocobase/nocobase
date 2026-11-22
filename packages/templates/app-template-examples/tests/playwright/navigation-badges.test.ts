/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test';

const applicationUrl = process.env.APP_URL;
test.skip(!applicationUrl, 'Set APP_URL to the running application entry.');
const fixture = `${applicationUrl?.replace(/\/$/, '')}/tests/fixtures/navigation-badges.html`;

/** Each row's label, count and expand button edges, and whether the label is cut short. */
async function rows(page: Page) {
  return page.locator('[data-sidebar="menu-item"]').evaluateAll((items) =>
    items.map((item) => {
      const button = item.querySelector(
        ':scope > [data-slot="sidebar-menu-button"]',
      )!;
      const label = button.querySelector(':scope > span:last-child')!;
      const badge = item.querySelector(
        ':scope > [data-slot="sidebar-menu-badge"]',
      );
      const action = item.querySelector(
        ':scope > [data-slot="sidebar-menu-action"]',
      );
      const edges = (element: Element | null) => {
        if (!element) return null;
        const { left, right } = element.getBoundingClientRect();
        return { left, right };
      };
      return {
        name: button.getAttribute('aria-label') ?? label.textContent,
        label: edges(label)!,
        badge: edges(badge),
        action: edges(action),
        truncated: label.scrollWidth > label.clientWidth,
      };
    }),
  );
}

test('keeps a long label clear of the count and the expand button', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(fixture);
  await expect(
    page.getByRole('link', { name: /· 99\+|· 120/ }).first(),
  ).toBeVisible();
  let previous = '';
  await expect
    .poll(async () => {
      const current = JSON.stringify(await rows(page));
      const stable = current === previous;
      previous = current;
      return stable;
    })
    .toBe(true);
  const result = await rows(page);
  expect(result).toHaveLength(3);
  for (const row of result) {
    expect(row.truncated, row.name ?? '').toBe(true);
    if (row.badge) expect(row.label.right).toBeLessThanOrEqual(row.badge.left);
    if (row.action) {
      expect(row.label.right).toBeLessThanOrEqual(row.action.left);
      if (row.badge)
        expect(row.badge.right).toBeLessThanOrEqual(row.action.left);
    }
  }
  expect(result.filter((row) => row.badge && row.action)).toHaveLength(1);
  expect(result.filter((row) => !row.badge && row.action)).toHaveLength(1);
});
