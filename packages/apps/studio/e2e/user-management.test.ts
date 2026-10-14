/** Account maintenance and role permissions against a real, disposable Studio. */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test, url, horizontalOverflow } from './support/fixtures.ts';

const output = process.env.PM358_SCREENSHOT_DIR;
test.setTimeout(180_000);
test.use({
  user: 'admin',
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
  await shot('role-assignment-en');
  await page.getByRole('option', { name: 'Member', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(row.getByText('Member', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Member actions' }).click();
  await page.getByRole('menuitem', { name: 'Disable user' }).click();
  await shot('disable-confirm-en');
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Disable user', exact: true })
    .click();
  await expect(row.getByText('Disabled', { exact: true })).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Status', exact: true })
    .selectOption('disabled');
  await shot('disabled-users-en');
  await row.getByRole('button', { name: 'Member actions' }).click();
  await page.getByRole('menuitem', { name: 'Enable user' }).click();
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
  await page.goto(url('/config/roles/admin'));
  await expect(
    page.getByText('Reset password', { exact: true }).first(),
  ).toBeVisible();
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
  await page.evaluate(
    "localStorage.setItem('nocobase:main:theme:color-scheme', 'dark')",
  );
  await page.reload();
  await expect(
    page.getByRole('textbox', { name: 'Search users' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/u);
  await shot('users-narrow-dark-en');
  await page.evaluate("localStorage.setItem('nocobase.locale', 'zh-CN')");
  await page.reload();
  await expect(page.getByRole('textbox', { name: '搜索用户' })).toBeVisible();
  await shot('users-zh');
});
