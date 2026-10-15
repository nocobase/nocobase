import type { Page } from '@playwright/test';

import type { GitConnection } from '../shared/git.ts';
import type { Role } from '../shared/access.ts';
import { expect, open, signIn, test, unique, url } from './support/fixtures.ts';

test.use({ user: 'admin', isolatedStudio: true, locale: 'en-US' });

test.beforeEach(async ({ context, locale }) => {
  await context.addInitScript(
    `localStorage.setItem('nocobase.locale', ${JSON.stringify(locale)});`,
  );
});

async function capture(
  page: Page,
  name: string,
  info: import('@playwright/test').TestInfo,
) {
  const path = info.outputPath(`${name}.png`);
  await page
    .getByRole('region', { name: 'Git', exact: true })
    .screenshot({ path });
  await info.attach(name, { path, contentType: 'image/png' });
}

test('a failed read is distinct from an empty list and retry restores saved connections', async ({
  page,
  api,
}, info) => {
  const document = await api.get<{ paths: Record<string, unknown> }>('swagger');
  expect(
    Object.keys(document.paths).some((path) =>
      path.endsWith('/git/connections'),
    ),
  ).toBe(true);
  const connections = await api.get<GitConnection[]>('git/connections');
  expect(connections.length).toBeGreaterThan(0);
  let failures = 0;
  const route = '**/api/git/connections';
  await page.route(route, async (request) => {
    if (request.request().method() !== 'GET') return request.continue();
    failures += 1;
    await request.fulfill({
      status: 503,
      json: {
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable' },
      },
    });
  });
  await open(page, '/config/git');
  // Wait for the provider's automatic retries to finish before inspecting the result.
  await expect(
    page.getByRole('region', { name: 'Git', exact: true }).getByRole('status'),
  ).toHaveCount(0);
  expect(failures).toBeGreaterThan(0);
  await info.attach('failed-reads.json', {
    body: JSON.stringify({ injectedStatus: 503, failedReads: failures }),
    contentType: 'application/json',
  });
  await capture(page, 'git-read-failed', info);
  await expect(page.getByRole('alert')).toContainText(
    'Could not load code host connections.',
  );
  await expect(
    page.getByText('No code host connected yet', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Add connection', exact: true }),
  ).toHaveCount(0);
  await page.unroute(route);
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  for (const connection of connections) {
    await expect(
      page.locator(`[data-git-connection="${connection.id}"]`),
    ).toBeVisible();
  }
  await expect(page.getByRole('alert')).toHaveCount(0);
  await capture(page, 'git-recovered', info);
  await info.attach('read-recovery.json', {
    body: JSON.stringify({
      injectedStatus: 503,
      failedReads: failures,
      restoredConnections: connections.length,
    }),
    contentType: 'application/json',
  });
});

test('a successful empty list offers connection setup', async ({
  page,
}, info) => {
  await page.route('**/api/git/connections', (route) =>
    route.fulfill({ json: { data: [], meta: { total: 0 } } }),
  );
  await open(page, '/config/git');
  await expect(
    page.getByText('No code host connected yet', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Add connection', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await capture(page, 'git-empty', info);
});

test.describe('narrow dark error state', () => {
  test.use({ viewport: { width: 375, height: 812 }, colorScheme: 'dark' });

  for (const locale of ['en-US', 'zh-CN']) {
    test.describe(locale, () => {
      test.use({ locale });

      test('explains the failure and offers retry', async ({
        page,
        context,
      }, info) => {
        await context.addInitScript(
          "localStorage.setItem('nocobase:main:theme:color-scheme', 'dark');",
        );
        await page.route('**/api/git/connections', (route) =>
          route.fulfill({
            status: 503,
            json: {
              error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Service unavailable',
              },
            },
          }),
        );
        await open(page, '/config/git');
        await expect(page.getByRole('alert')).toContainText(
          locale === 'en-US'
            ? 'Could not load code host connections.'
            : '无法读取代码托管平台连接。',
        );
        await expect(
          page.getByRole('button', {
            name: locale === 'en-US' ? 'Retry' : '重试',
            exact: true,
          }),
        ).toBeVisible();
        await expect(page.locator('html')).toHaveClass(/dark/);
        const overflow = await page.evaluate<number>(
          'document.documentElement.scrollWidth - document.documentElement.clientWidth',
        );
        expect(overflow).toBe(0);
        if (locale === 'en-US')
          await capture(page, 'git-read-failed-dark-phone', info);
      });
    });
  }
});

test('a reader can recover connections and read an empty list without management actions', async ({
  page,
  api,
  context,
  studio,
}, info) => {
  const users = await api.get<
    Array<{
      id: string;
      email: string;
      roleScopes: Record<string, string | string[]>;
    }>
  >('users?q=lisa@example.com&pageSize=100');
  const member = users.find((entry) => entry.email === 'lisa@example.com')!;
  expect(member).toBeTruthy();
  const originalRoles = member.roleScopes.studio;
  const roles = Array.isArray(originalRoles)
    ? originalRoles
    : originalRoles
      ? [originalRoles]
      : [];
  const role = await api.post<Role>('access/roles', {
    title: `Git reader ${unique()}`,
    settings: { 'studio.git/read': true },
  });
  try {
    await api.put(`users/${member.id}/roleScopes/studio`, {
      value: [...roles, role.key],
    });
    await signIn(context, 'lisa', studio);
    const status = await api.get<{ canManage: boolean }>('git/status');
    expect(status.canManage).toBe(false);
    const connections = await api.get<GitConnection[]>('git/connections');
    expect(connections.length).toBeGreaterThan(0);
    await page.route('**/api/git/connections', (route) =>
      route.fulfill({
        status: 503,
        json: {
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Service unavailable',
          },
        },
      }),
    );
    await open(page, '/config/git');
    await expect(page.getByRole('alert')).toContainText(
      'Could not load code host connections.',
    );
    await page.unroute('**/api/git/connections');
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.locator('[data-git-connection]').first()).toBeVisible();
    await expect(
      page.getByText('Read-only: you can view this, but not change it.', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Add connection', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /^Actions for / }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Edit app', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Add installation', exact: true }),
    ).toHaveCount(0);
    await capture(page, 'git-read-only', info);
    const denied = await context.request.delete(
      url(`/api/git/connections/${connections[0]!.id}`, studio),
      { headers: { origin: studio.origin } },
    );
    expect(denied.status()).toBe(403);
    await page.route('**/api/git/connections', (route) =>
      route.fulfill({ json: { data: [], meta: { total: 0 } } }),
    );
    await page.reload();
    await expect(
      page.getByText('No code host connected yet', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'Ask an administrator to connect a code host so projects can link repositories.',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Add connection', exact: true }),
    ).toHaveCount(0);
    await capture(page, 'git-read-only-empty', info);
  } finally {
    await signIn(context, 'admin', studio);
    await api.put(`users/${member.id}/roleScopes/studio`, { value: roles });
    await api.delete(`access/roles/${role.key}`);
  }
});
