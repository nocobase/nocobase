import type { Page } from '@playwright/test';

import { expect, horizontalOverflow, open, test } from './support/fixtures.ts';

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

/** Key pages at phone width, and what shows that each one rendered. */
const PAGES: readonly { path: string; heading: string | null }[] = [
  { path: '/', heading: '今天要做什么？' },
  { path: '/dashboard', heading: '仪表盘' },
  { path: '/inbox', heading: '收件箱' },
  { path: '/my-issues', heading: '我的任务' },
  { path: '/issues?view=list', heading: '任务' },
  { path: '/issues?view=board', heading: '任务' },
  { path: '/issues?view=agent', heading: '任务' },
  {
    path: '/issues/PM-1',
    heading:
      'Drag to reorder issues on the board and move them between columns',
  },
  { path: '/issues/new', heading: null },
  { path: '/projects', heading: '项目' },
  { path: '/knowledge', heading: '系统知识' },
  { path: '/config/members', heading: '成员' },
  { path: '/config/workflows', heading: '流程模板' },
  { path: '/config/api-keys', heading: 'API 密钥' },
  { path: '/environments', heading: '部署环境' },
];

test.describe('phone width', () => {
  for (const { path, heading } of PAGES) {
    test(`${path} has no horizontal overflow`, async ({ page }) => {
      await open(page, path);
      if (heading)
        await expect(
          page.getByRole('heading', { name: heading, level: 1 }).last(),
        ).toBeVisible();
      else
        await expect(
          page.getByRole('dialog', { name: '新建任务', exact: true }),
        ).toBeVisible();
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }

  test('the account settings dialog fits a phone', async ({ page }) => {
    await open(page, '/account/preferences');
    const dialog = page.getByRole('dialog', { name: '个人设置' });
    await expect(
      dialog.getByRole('region', { name: '偏好设置' }),
    ).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test('the navigation opens from the header on a phone', async ({ page }) => {
    await open(page, '/inbox');
    const nav = page.getByRole('navigation', { name: '应用导航' });
    await expect(nav).toBeHidden();
    await page
      .getByRole('banner')
      .getByRole('button', { name: /导航/ })
      .click();
    await expect(nav).toBeVisible();
    await nav.getByRole('link', { name: '任务', exact: true }).click();
    await expect(page).toHaveURL(/\/issues/);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});

/**
 * The controls pinned to the screen (inside a sticky or fixed bar) that the floating chat button covers, by their
 * accessible name or text. Content that scrolls under the button is not counted: it can be scrolled clear.
 */
function pinnedControlsUnderChatButton(page: Page): Promise<string[]> {
  // The tooling tsconfig has no DOM library; the function runs in the browser.
  return page.evaluate<string[]>(`(() => {
    const button = document.querySelector('[data-testid="chat-floating-button"]');
    if (!button) return [];
    const area = button.getBoundingClientRect();
    const covered = [];
    const controls = 'button, a[href], input, textarea, select, [contenteditable="true"], [role="button"], [role="tab"]';
    for (const control of document.querySelectorAll(controls)) {
      if (control === button || button.contains(control)) continue;
      const box = control.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      if (box.right <= area.left || box.left >= area.right || box.bottom <= area.top || box.top >= area.bottom) continue;
      for (let node = control; node && node !== document.body; node = node.parentElement) {
        const position = getComputedStyle(node).position;
        if (position === 'sticky' || position === 'fixed') {
          covered.push((control.getAttribute('aria-label') || control.textContent || control.tagName).trim());
          break;
        }
      }
    }
    return covered;
  })()`);
}

test.describe('floating chat button at phone width', () => {
  test('it stays clear of the comment composer, also while a long comment is typed', async ({
    page,
  }) => {
    await open(page, '/issues/PM-1');
    const chat = page.getByTestId('chat-floating-button');
    const send = page.getByRole('button', { name: '评论', exact: true });
    const editor = page.getByRole('textbox', { name: '评论' });
    await expect(chat).toBeVisible();

    const apart = async () => {
      // Wait for the button to settle where it moves to.
      await expect
        .poll(async () => {
          const [a, b, c] = await Promise.all([
            chat.boundingBox(),
            send.boundingBox(),
            editor.boundingBox(),
          ]);
          if (!a || !b || !c) return 'missing';
          const overlaps = (x: typeof a, y: typeof a) =>
            x.x < y.x + y.width &&
            y.x < x.x + x.width &&
            x.y < y.y + y.height &&
            y.y < x.y + x.height;
          return overlaps(a, b) || overlaps(a, c) ? 'overlap' : 'apart';
        })
        .toBe('apart');
    };

    await apart();
    await editor.click();
    await editor.pressSequentially('第一行');
    for (const line of ['第二行', '第三行', '第四行']) {
      await page.keyboard.press('Shift+Enter');
      await editor.pressSequentially(line);
    }
    await apart();
    expect(await pinnedControlsUnderChatButton(page)).toEqual([]);
  });

  for (const { path } of PAGES) {
    test(`${path} pins no control under it`, async ({ page }) => {
      await open(page, path);
      expect(await pinnedControlsUnderChatButton(page)).toEqual([]);
    });
  }
});

test('deep issue tables fit narrow screens in both languages and modes and retain sorting', async ({
  page,
  api,
}) => {
  test.setTimeout(120_000);
  const tag = `hierarchy-${Date.now()}`;
  const label = await api.post<{ id: string }>('projects/labels', {
    name: `Long label 标签 ${tag}`,
    color: 'purple',
  });
  const issueIds: string[] = [];
  let parentIssueId: string | undefined;
  const identifiers: string[] = [];
  for (let depth = 0; depth < 9; depth++) {
    const issue = await api.post<{ id: string; identifier: string }>(
      'projects/issues',
      {
        title: `${tag} ${depth} ${'Long title 很长的标题'.repeat(12)}`,
        parentIssueId,
        priority: 'urgent',
        labelIds: [label.id],
      },
    );
    parentIssueId = issue.id;
    issueIds.push(issue.id);
    identifiers.push(issue.identifier);
  }
  // Exercise a long deployment mark without making a real deployment.
  await page.route('**/api/deploys/marks?*', async (route) => {
    const mark = {
      role: 'staging',
      status: 'deployed',
      appId: 'test-app',
      environmentId: 'test-env',
      environmentName: 'Long environment 很长的环境名称'.repeat(4),
      sha: 'abcdef1234567',
      version: null,
      deploymentId: 'test-deploy',
      withdrawnByDeploymentId: null,
      withdrawnVersion: null,
      deployedAt: '2026-01-01T00:00:00Z',
    };
    await route.fulfill({
      json: { data: Object.fromEntries(issueIds.map((id) => [id, [mark]])) },
    });
  });
  // Keep appearance changes local to this test; other workers use the same demo account.
  let appearance = { locale: 'zh-CN', 'theme.mode': 'light' };
  await page.route('**/api/users/me/preferences**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { data: appearance } });
    } else {
      await route.fulfill({ status: 204 });
    }
  });
  // The fixture signs in through the API; navigate before accessing origin-scoped storage.
  await open(page, `/issues?view=list&q=${tag}`);
  for (const width of [375, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const locale of ['zh-CN', 'en-US']) {
      for (const mode of ['light', 'dark']) {
        appearance = { locale, 'theme.mode': mode };
        await page.evaluate(
          `localStorage.setItem('nocobase.locale', ${JSON.stringify(locale)});` +
            `localStorage.setItem('nocobase:main:theme:color-scheme', ${JSON.stringify(mode)});`,
        );
        await open(page, `/issues?view=list&q=${tag}`);
        const table = page.getByRole('table');
        await expect(table.getByRole('link')).toHaveCount(9);
        expect(await table.getByRole('link').allTextContents()).toEqual(
          identifiers,
        );
        await expect(table.locator('[data-deploy-mark]').first()).toBeVisible();
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
        // A page may fit while the generic Table wrapper still scrolls horizontally.
        const overflow = await page.evaluate<number[]>(`(() => {
          const table = document.querySelector('table');
          const widths = [];
          for (let element = table; element; element = element.parentElement) {
            widths.push(element.scrollWidth - element.clientWidth);
          }
          return widths;
        })()`);
        expect(Math.max(...overflow)).toBeLessThanOrEqual(0);
        const priority = locale === 'zh-CN' ? '优先级' : 'Priority';
        await page.getByRole('button', { name: priority, exact: true }).click();
        await expect(page).toHaveURL(/sort=priority/);
        await page
          .getByRole('button', {
            name: locale === 'zh-CN' ? '更新时间' : 'Updated',
            exact: true,
          })
          .click();
        await expect
          .poll(() => new URL(page.url()).searchParams.get('sort'))
          .toBeNull();
        await page.screenshot({
          path: `storage/ui-workflow/issue-hierarchy/screenshots/${width}-${locale}-${mode}.png`,
        });
      }
    }
  }
});
