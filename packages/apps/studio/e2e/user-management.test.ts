/** Account maintenance and role permissions against a real, disposable Studio. */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import {
  expect,
  test as base,
  Api,
  apiAs,
  unique,
  url,
  horizontalOverflow,
  signIn,
} from './support/fixtures.ts';

// Each case owns its persistent preferences and administrator assignment.
const test = base.extend({
  context: async ({ context, browser }, use) => {
    const bootstrap = await apiAs(browser, 'admin');
    const email = `account-manager-${unique()}@example.test`;
    const password = 'SyntheticPassword123!';
    try {
      const manager = await bootstrap.api.post<{ id: string }>('users', {
        name: 'Synthetic account manager',
        email,
        password,
      });
      await signIn(context, { email, password });
      const api = new Api(context.request);
      await api.get('projects/me');
      // Account creation is fixture preparation, not a new default admin capability.
      const preparationRole = `pm358-fixture-create-${unique()}`;
      await bootstrap.api.post('authorization/permissionSets', {
        key: preparationRole,
        title: 'Synthetic account fixture preparation',
        grants: [
          {
            resource: { type: 'user', id: '*' },
            actions: [{ action: 'create' }],
          },
        ],
      });
      await bootstrap.api.put(`users/${manager.id}/roleScopes/studio`, {
        value: ['admin', preparationRole],
      });
      await api.patch('users/me/preferences', {
        locale: 'en-US',
        'theme.mode': 'light',
      });
    } finally {
      await bootstrap.close();
    }
    await use(context);
  },
});

const output = process.env.PM358_SCREENSHOT_DIR;
test.setTimeout(180_000);
test.use({
  user: 'admin',
  trace: 'off',
  launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {},
});

test('maintains a disabled account, profile, password deep link and role permissions', async ({
  page,
  context,
  api,
}) => {
  await context.addInitScript(
    "if (!localStorage.getItem('pm358-locale-initialized')) { localStorage.setItem('nocobase.locale', 'en-US'); localStorage.setItem('pm358-locale-initialized', 'true'); }",
  );
  const email = `reviewer-${Date.now()}@example.test`;
  const account = await api.post<{ id: string }>('users', {
    name: 'Synthetic reviewer',
    email,
    password: 'SyntheticPassword123!',
  });
  const shot = async (name: string) => {
    if (output) {
      mkdirSync(output, { recursive: true });
      await page.screenshot({
        path: path.join(output, name + '.png'),
        fullPage: true,
        animations: 'disabled',
      });
    }
  };
  await page.goto(url('/config/members'));
  await expect(
    page.getByRole('textbox', { name: 'Search users' }),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Search users' })
    .fill('Synthetic reviewer');
  const row = page.getByRole('row').filter({ hasText: 'Synthetic reviewer' });
  await expect(row).toBeVisible();
  await shot('users-list-en');
  await row.getByRole('button', { name: 'Member actions' }).click();
  await page.getByRole('menuitem', { name: 'Edit profile' }).click();
  const dialog = page.getByRole('dialog', {
    name: 'Edit profile',
    exact: true,
  });
  await dialog
    .getByLabel('Name', { exact: true })
    .fill('Synthetic reviewer updated');
  await shot('profile-edit-en');
  await dialog.getByLabel('Email', { exact: true }).fill('admin@nocobase.com');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    dialog.getByText('This username or email is already in use.'),
  ).toBeVisible();
  await shot('profile-conflict-en');
  await dialog.getByLabel('Email', { exact: true }).fill(email);
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await row.getByRole('combobox').click();
  await expect(
    page.getByRole('option', { name: 'Member', exact: true }),
  ).toBeVisible();
  await shot('role-assignment-en');
  await page.getByRole('option', { name: 'Member', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(row.getByText('Member', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Member actions' }).click();
  await page.getByRole('menuitem', { name: 'Disable user' }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await shot('disable-confirm-en');
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Disable user', exact: true })
    .click();
  await expect(row.getByText('Disabled', { exact: true })).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Status', exact: true })
    .selectOption('disabled');
  await expect(row.getByText('Disabled', { exact: true })).toBeVisible();
  await shot('disabled-users-en');
  await row.getByRole('button', { name: 'Member actions' }).click();
  await page.getByRole('menuitem', { name: 'Enable user' }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await shot('enable-confirm-en');
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Enable user', exact: true })
    .click();
  await expect(row).not.toBeVisible();
  await page
    .getByRole('combobox', { name: 'Status', exact: true })
    .selectOption('all');
  await expect(row.getByText('Enabled', { exact: true })).toBeVisible();
  await page.goto(url(`/config/members/${account.id}/reset-password`));
  await expect(
    page.getByRole('dialog', { name: /Reset password/ }),
  ).toBeVisible();
  await shot('reset-password-en');
  await page.keyboard.press('Escape');
  await page.goto(url('/config/roles'));
  await expect(
    page.getByText(/Holder counts include direct assignments/),
  ).toBeVisible();
  await shot('roles-list-en');
  await page.goto(url('/config/roles/admin'));
  await expect(
    page.getByText('Reset passwords', { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByText('Reset passwords', { exact: true })
    .first()
    .scrollIntoViewIfNeeded();
  await shot('role-permissions-en');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url('/config/members'));
  await page
    .getByRole('textbox', { name: 'Search users' })
    .fill('Synthetic reviewer');
  await expect(page.getByText('Synthetic reviewer updated')).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  await shot('users-narrow-en');
  await page.getByRole('textbox', { name: 'Search users' }).focus();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('combobox', { name: 'Status', exact: true }),
  ).toBeFocused();
  await api.patch('users/me/preferences', { 'theme.mode': 'dark' });
  await page.evaluate(
    "localStorage.setItem('nocobase:main:theme:color-scheme', 'dark')",
  );
  await page.reload();
  await expect(
    page.getByRole('textbox', { name: 'Search users' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/u);
  await page
    .getByRole('textbox', { name: 'Search users' })
    .fill('Synthetic reviewer');
  await expect(row.getByText('Enabled', { exact: true })).toBeVisible();
  await shot('users-narrow-dark-en');
  await page.setViewportSize({ width: 1440, height: 900 });
  await api.patch('users/me/preferences', { locale: 'zh-CN' });
  await page.evaluate("localStorage.setItem('nocobase.locale', 'zh-CN')");
  await page.reload();
  await expect(page.getByRole('textbox', { name: '搜索用户' })).toBeVisible();
  await page
    .getByRole('textbox', { name: '搜索用户' })
    .fill('Synthetic reviewer');
  await expect(
    row.getByText('Synthetic reviewer updated', { exact: true }),
  ).toBeVisible();
  await row
    .getByText('Synthetic reviewer updated', { exact: true })
    .scrollIntoViewIfNeeded();
  await expect(row.getByText('已启用', { exact: true })).toBeVisible();
  await shot('users-zh');
});

test('observes account permission revocation without a realtime connection', async ({
  browser,
  api,
}) => {
  const email = `polling-${Date.now()}@example.test`;
  const user = await api.post<{ id: string }>('users', {
    name: 'Synthetic polling reviewer',
    email,
    password: 'SyntheticPassword123!',
  });
  const role = await api.post<{ key: string }>('access/roles', {
    title: 'Synthetic profile editor',
    settings: { 'user/read': true, 'user/update': true },
  });
  const context = await browser.newContext({ locale: 'en-US' });
  try {
    await context.addInitScript(
      "localStorage.setItem('nocobase.locale', 'en-US')",
    );
    await context.routeWebSocket('**/*', (socket) => socket.close());
    await signIn(context, { email, password: 'SyntheticPassword123!' });
    // First admission applies the existing default role; explicitly replace it afterwards.
    const admission = await context.request.get(url('/api/projects/me'));
    expect(admission.ok()).toBe(true);
    await api.put(`users/${user.id}/roleScopes/studio`, { value: [role.key] });
    const page = await context.newPage();
    await page.goto(url('/config/members?q=Lisa'));
    const row = page.getByRole('row').filter({ hasText: 'Lisa Nguyen' });
    await expect(row).toBeVisible();
    await expect(
      row.getByRole('button', { name: 'Member actions' }),
    ).toBeVisible();
    await api.patch(`access/roles/${role.key}`, {
      settings: { 'user/read': true, 'user/update': false },
    });
    await expect(
      row.getByRole('button', { name: 'Member actions' }),
    ).toHaveCount(0, { timeout: 30_000 });
    await expect(
      page.getByRole('link', { name: 'Roles', exact: true }),
    ).toHaveCount(0);
    if (output)
      await page.screenshot({
        path: path.join(output, 'users-read-only-en.png'),
        fullPage: true,
      });
  } finally {
    await context.close();
  }
});

test('paginates the user directory and recovers from a list request failure', async ({
  page,
  context,
  api,
}) => {
  await api.patch('users/me/preferences', { locale: 'en-US' });
  await context.addInitScript(
    "localStorage.setItem('nocobase.locale', 'en-US')",
  );
  const batch = Date.now();
  for (let index = 0; index < 21; index++)
    await api.post('users', {
      name: `Synthetic paging ${index}`,
      email: `paging-${batch}-${index}@example.test`,
      password: 'SyntheticPassword123!',
    });
  await page.goto(url('/config/members?q=Synthetic+paging'));
  await expect(page.getByText('21 users', { exact: true })).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(21);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(/[?&]page=2/u);
  await expect(page.getByRole('row')).toHaveCount(2);
  await expect(
    page.getByRole('button', { name: 'Next', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(page.getByRole('row')).toHaveCount(21);
  if (output)
    await page.screenshot({
      path: path.join(output, 'users-pagination-en.png'),
      fullPage: true,
    });

  const failure = '**/api/users?*';
  await page.route(failure, (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { code: 'UNAVAILABLE', message: 'Synthetic directory failure' },
      }),
    }),
  );
  await page.reload();
  await expect(page.getByText('Unable to load members')).toBeVisible();
  if (output)
    await page.screenshot({
      path: path.join(output, 'users-list-error-en.png'),
      fullPage: true,
    });
  await page.unroute(failure);
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('row')).toHaveCount(21);
});
