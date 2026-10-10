import { atHome, expect, open, test } from './support/fixtures.ts';

// Preferences follow the person, so these tests use an account no other test signs in as.
test.use({ user: 'wendy' });

test.describe('personal settings', () => {
  test('the colour mode chosen in preferences persists across reloads and browsers', async ({
    page,
    api,
    browser,
  }) => {
    await open(page, '/account/preferences');
    const preferences = page.getByRole('region', { name: '偏好设置' });
    const mode = preferences.getByRole('group', { name: '颜色模式' });

    await mode.getByRole('button', { name: '深色' }).click();
    await expect(mode.getByRole('button', { name: '深色' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await expect
      .poll(
        async () =>
          (await api.get<Record<string, unknown>>('users/me/preferences'))[
            'theme.mode'
          ],
      )
      .toBe('dark');

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await expect(
      page
        .getByRole('region', { name: '偏好设置' })
        .getByRole('group', { name: '颜色模式' })
        .getByRole('button', { name: '深色' }),
    ).toHaveAttribute('aria-pressed', 'true');

    // A browser that never chose a mode gets it from the account.
    const other = await browser.newContext({
      storageState: await page.context().storageState({ indexedDB: false }),
    });
    try {
      const fresh = await other.newPage();
      await fresh.addInitScript('localStorage.clear()');
      await fresh.goto(page.url());
      await expect(fresh.locator('html')).toHaveClass(/\bdark\b/);
    } finally {
      await other.close();
    }

    await mode.getByRole('button', { name: '浅色' }).click();
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
    await expect
      .poll(
        async () =>
          (await api.get<Record<string, unknown>>('users/me/preferences'))[
            'theme.mode'
          ],
      )
      .toBe('light');
  });

  test('the profile page shows the signed-in person', async ({ page }) => {
    await open(page, '/account');
    await expect(page).toHaveURL(atHome('?account=profile'));
    await expect(page.getByRole('dialog', { name: '个人设置' })).toBeVisible();
    const profile = page.getByRole('region', { name: '个人资料' });
    await expect(
      profile.getByRole('textbox', { name: '显示名称 *' }),
    ).toHaveValue('Wendy Foster');
    await expect(
      profile.getByRole('textbox', { name: '用户名 *' }),
    ).toHaveValue('wendy');
  });
});
