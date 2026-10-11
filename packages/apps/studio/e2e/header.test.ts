import type { Page } from '@playwright/test';

import {
  apiAs,
  expect,
  horizontalOverflow,
  open,
  test,
  unique,
  url,
  type Api,
} from './support/fixtures.ts';
import { projectWithDoneApproval } from './support/approval.ts';
import type { Issue } from './support/runner.ts';

/** The header's inbox button, whatever its label says about the count; not the breadcrumb on the inbox itself. */
const inboxButton = (page: Page) =>
  page.getByRole('banner').getByTestId('studio-inbox-button');

/** The decisions waiting on the viewer, as the server counts them. */
async function pendingDecisions(api: Api): Promise<number> {
  return (await api.get<{ decision: number }>('inbox/pending')).decision;
}

test.describe('header inbox', () => {
  // Lisa Nguyen, a contributor, leads a project whose workflow makes a member moving an issue to Done wait for her
  // approval. No other test asks her for a decision, so the count is hers alone.
  test.use({ user: 'lisa' });

  test('the badge counts the decisions waiting and follows a new one without a reload', async ({
    page,
    api,
    browser,
  }) => {
    await open(page, '/issues');
    const before = await pendingDecisions(api);
    await expect(inboxButton(page)).toHaveAccessibleName(
      before > 0 ? `收件箱，${before} 项待处理` : /^收件箱/,
    );

    const lisa = await api.get<{ userId: string }>('projects/me');
    const admin = await apiAs(browser, 'alex');
    const project = await projectWithDoneApproval(
      admin.api,
      lisa.userId,
    ).finally(() => admin.close());
    const wendy = await apiAs(browser, 'wendy');
    try {
      const me = await wendy.api.get<{ userId: string }>('projects/me');
      const issue = await wendy.api.post<Issue>('projects/issues', {
        title: `顶栏收件箱角标 ${unique()}`,
        projectId: project.id,
        ownerUserId: me.userId,
        statusKey: 'in_progress',
        executor: { type: 'user', id: me.userId },
      });
      const current = await wendy.api.get<Issue>(`projects/issues/${issue.id}`);
      await wendy.api.patch(`projects/issues/${issue.id}`, {
        revision: current.revision,
        statusKey: 'done',
      });
    } finally {
      await wendy.close();
    }

    await expect.poll(() => pendingDecisions(api)).toBe(before + 1);
    // The realtime event refreshes the badge on the page already open.
    await expect(inboxButton(page)).toHaveAccessibleName(
      `收件箱，${before + 1} 项待处理`,
    );
    await expect(
      inboxButton(page).getByTestId('studio-inbox-badge'),
    ).toHaveText(before + 1 > 99 ? '99+' : String(before + 1));
  });

  // The counts below are the server's answers, fixed so that what other tests send at the same time cannot change them.
  for (const { decision, unread, kind, text, name } of [
    {
      decision: 0,
      unread: 4,
      kind: 'unread',
      text: '4',
      name: '收件箱，4 条未读',
    },
    {
      decision: 0,
      unread: 120,
      kind: 'unread',
      text: '99+',
      name: '收件箱，120 条未读',
    },
    {
      decision: 2,
      unread: 5,
      kind: 'decisions',
      text: '2',
      name: '收件箱，2 项待处理',
    },
  ])
    test(`with ${decision} decisions waiting and ${unread} unread, the badge reads ${text} (${kind})`, async ({
      page,
    }) => {
      await page.route('**/api/inbox/pending', (route) =>
        route.fulfill({ json: { data: { decision } } }),
      );
      await page.route(
        '**/api/notificationInApp/messages/unreadCount',
        (route) => route.fulfill({ json: { data: { count: unread } } }),
      );
      await open(page, '/issues');
      await expect(inboxButton(page)).toHaveAccessibleName(name);
      const badge = inboxButton(page).getByTestId('studio-inbox-badge');
      await expect(badge).toHaveText(text);
      await expect(badge).toHaveAttribute('data-kind', kind);
      await expect(page).toHaveTitle(
        new RegExp(`^\\(${text.replace('+', '\\+')}\\) `, 'u'),
      );
    });

  test('the button opens the inbox and is marked current there', async ({
    page,
  }) => {
    await open(page, '/issues');
    await expect(inboxButton(page)).not.toHaveAttribute('aria-current');
    await inboxButton(page).click();
    await expect(page).toHaveURL(/\/inbox$/u);
    await expect(
      page.getByRole('heading', { name: '收件箱', level: 1 }),
    ).toBeVisible();
    await expect(inboxButton(page)).toHaveAttribute('aria-current', 'page');
    // The sidebar has no inbox entry any more.
    await expect(
      page
        .getByRole('navigation', { name: '应用导航' })
        .getByRole('link', { name: /收件箱/ }),
    ).toHaveCount(0);
  });

  test('the button is reachable by keyboard', async ({ page }) => {
    await open(page, '/issues');
    const button = inboxButton(page);
    await button.focus();
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/inbox$/u);
  });

  test.describe('at phone width', () => {
    test.use({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    test('the button stays in the header without pushing it sideways', async ({
      page,
    }) => {
      await open(page, '/');
      await expect(inboxButton(page)).toBeVisible();
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      await inboxButton(page).click();
      await expect(page).toHaveURL(/\/inbox$/u);
    });
  });
});

test.describe('back-office settings', () => {
  test('the header has no settings entry', async ({ page }) => {
    await open(page, '/');
    await expect(inboxButton(page)).toBeVisible();
    await expect(
      page.getByRole('banner').getByRole('link', { name: '设置' }),
    ).toHaveCount(0);
  });

  for (const path of ['/settings', '/settings/users', '/settings/ai']) {
    test(`${path} is not routed: it lands on the home page`, async ({
      page,
    }) => {
      await open(page, path);
      // The catch-all route sends it to the application's root, with or without the trailing slash.
      await expect
        .poll(() => page.url().replace(/\/$/u, ''))
        .toBe(url('/').replace(/\/$/u, ''));
      await expect(
        page.getByRole('heading', { name: '今天要做什么？' }),
      ).toBeVisible();
    });
  }

  test("Studio's own settings stay in the sidebar", async ({ page }) => {
    await open(page, '/');
    await page
      .getByRole('navigation', { name: '应用导航' })
      .getByRole('link', { name: '设置' })
      .click();
    await expect(page).toHaveURL(/\/config/u);
    await expect(
      page.getByRole('heading', { name: '常规', level: 1 }),
    ).toBeVisible();
  });
});
