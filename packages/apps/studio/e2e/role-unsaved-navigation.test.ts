import type { Locator, Page } from '@playwright/test';

import { expect, open, test, unique, url } from './support/fixtures.ts';

// This suite owns every custom role it creates; it also runs against a fresh development database without demo data.
test.use({ user: 'admin', locale: 'en-US' });

const confirmation = (page: Page): Locator =>
  page.getByRole('alertdialog', { name: 'Discard unsaved changes?' });
const rolesNavigation = (page: Page): Locator =>
  page
    .getByRole('navigation', { name: 'Settings navigation' })
    .getByRole('link', { name: 'Roles', exact: true });
const nameInput = (page: Page): Locator =>
  page.getByRole('textbox', { name: 'Name', exact: true });

for (const kind of ['name', 'permission'] as const) {
  test(`${kind}: cancelled navigation preserves input and confirmed navigation discards it`, async ({
    page,
    api,
  }) => {
    const title = `Navigation regression ${unique()}`;
    const role = await api.post<{ key: string }>('access/roles', {
      title,
      abilities: {},
      settings: {},
    });
    try {
      await open(page, '/config/roles');
      await page
        .getByRole('region', { name: 'Roles', exact: true })
        .getByRole('link', { name: title, exact: true })
        .click();
      await expect(nameInput(page)).toHaveValue(title);
      const permission = page.getByRole('switch').first();
      if (kind === 'name') {
        await nameInput(page).press('End');
        await page.keyboard.type(' unsaved');
      } else await permission.click();
      await rolesNavigation(page).click();
      await expect(confirmation(page)).toBeVisible();
      await expect(page).toHaveURL(url(`/config/roles/${role.key}`));
      if (process.env.PM374_EVIDENCE_DIR)
        await page.screenshot({
          path: `${process.env.PM374_EVIDENCE_DIR}/${kind}-confirmation.png`,
        });
      await confirmation(page)
        .getByRole('button', { name: 'Keep editing' })
        .click();
      await expect(confirmation(page)).toBeHidden();
      if (kind === 'name')
        await expect(nameInput(page)).toHaveValue(`${title} unsaved`);
      else await expect(permission).toBeChecked();
      // Keyboard activation of the breadcrumb goes through the same navigation boundary.
      const crumb = page
        .getByRole('navigation', { name: 'Breadcrumb' })
        .getByRole('link', { name: 'Roles', exact: true });
      await crumb.focus();
      await page.keyboard.press('Enter');
      await expect(confirmation(page)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(confirmation(page)).toBeHidden();
      await page
        .getByRole('navigation', { name: 'Settings navigation' })
        .getByRole('link', { name: 'Labels', exact: true })
        .click();
      await expect(confirmation(page)).toBeVisible();
      await confirmation(page)
        .getByRole('button', { name: 'Keep editing' })
        .click();
      await rolesNavigation(page).click();
      await confirmation(page)
        .getByRole('button', { name: 'Discard', exact: true })
        .focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(url('/config/roles'));
      await page
        .getByRole('region', { name: 'Roles', exact: true })
        .getByRole('link', { name: title, exact: true })
        .click();
      await expect(nameInput(page)).toHaveValue(title);
      await expect(page.getByRole('switch').first()).not.toBeChecked();
    } finally {
      await api.delete(`access/roles/${role.key}`);
    }
  });
}

test('clean edits, successful saves and explicit discard leave without confirmation; failed saves retain protection', async ({
  page,
  api,
}) => {
  const title = `Save regression ${unique()}`;
  const role = await api.post<{ key: string }>('access/roles', {
    title,
    abilities: {},
    settings: {},
  });
  const path = `/config/roles/${role.key}`;
  try {
    await open(page, path);
    await rolesNavigation(page).click();
    await expect(page).toHaveURL(url('/config/roles'));
    await expect(confirmation(page)).toBeHidden();
    await page
      .getByRole('region', { name: 'Roles', exact: true })
      .getByRole('link', { name: title, exact: true })
      .click();
    await nameInput(page).fill(`${title} saved `);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Save', exact: true }),
    ).toBeDisabled();
    await expect(nameInput(page)).toHaveValue(`${title} saved`);
    if (process.env.PM374_EVIDENCE_DIR)
      await page.screenshot({
        path: `${process.env.PM374_EVIDENCE_DIR}/save-success.png`,
      });
    await rolesNavigation(page).click();
    await expect(page).toHaveURL(url('/config/roles'));
    await page
      .getByRole('region', { name: 'Roles', exact: true })
      .getByRole('link', { name: `${title} saved`, exact: true })
      .click();
    await page.getByRole('switch').first().click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Save', exact: true }),
    ).toBeDisabled();
    await rolesNavigation(page).click();
    await expect(page).toHaveURL(url('/config/roles'));
    await page
      .getByRole('region', { name: 'Roles', exact: true })
      .getByRole('link', { name: `${title} saved`, exact: true })
      .click();
    await expect(page.getByRole('switch').first()).toBeChecked();
    await nameInput(page).fill(`${title} failed`);
    const endpoint = url(`/api/access/roles/${role.key}`);
    await page.route(endpoint, async (route) => {
      if (route.request().method() === 'PATCH')
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { code: 'TEST_FAILURE', message: 'Simulated save failure' },
          }),
        });
      else await route.continue();
    });
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Save', exact: true }),
    ).toBeEnabled();
    await expect(nameInput(page)).toHaveValue(`${title} failed`);
    await rolesNavigation(page).click();
    await expect(confirmation(page)).toBeVisible();
    if (process.env.PM374_EVIDENCE_DIR)
      await page.screenshot({
        path: `${process.env.PM374_EVIDENCE_DIR}/save-failure-confirmation.png`,
      });
    await confirmation(page)
      .getByRole('button', { name: 'Keep editing' })
      .click();
    await expect(nameInput(page)).toHaveValue(`${title} failed`);
    await page.unroute(endpoint);
    await page
      .getByRole('button', { name: 'Discard changes', exact: true })
      .click();
    await rolesNavigation(page).click();
    await expect(page).toHaveURL(url('/config/roles'));
    await expect(confirmation(page)).toBeHidden();
  } finally {
    await api.delete(`access/roles/${role.key}`);
  }
});

test('browser history cancellation keeps the editor and a second attempt can discard', async ({
  page,
  api,
}) => {
  const title = `History regression ${unique()}`;
  const role = await api.post<{ key: string }>('access/roles', {
    title,
    abilities: {},
    settings: {},
  });
  try {
    await open(page, '/config/roles');
    await page
      .getByRole('region', { name: 'Roles', exact: true })
      .getByRole('link', { name: title, exact: true })
      .click();
    await nameInput(page).fill(`${title} unsaved`);
    await page.goBack();
    await expect(confirmation(page)).toBeVisible();
    await confirmation(page)
      .getByRole('button', { name: 'Keep editing' })
      .click();
    await expect(page).toHaveURL(url(`/config/roles/${role.key}`));
    await expect(nameInput(page)).toHaveValue(`${title} unsaved`);
    await page.goBack();
    await confirmation(page)
      .getByRole('button', { name: 'Discard', exact: true })
      .click();
    await expect(page).toHaveURL(url('/config/roles'));
    await page.goForward();
    await expect(nameInput(page)).toHaveValue(title);
  } finally {
    await api.delete(`access/roles/${role.key}`);
  }
});

test('the read-only owner role leaves without an erroneous confirmation', async ({
  page,
}) => {
  await open(page, '/config/roles/owner');
  await expect(
    page.getByRole('heading', { name: 'Owner Built-in', level: 1 }),
  ).toBeVisible();
  await expect(nameInput(page)).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Save', exact: true }),
  ).toHaveCount(0);
  for (const permission of await page.getByRole('switch').all())
    await expect(permission).toBeDisabled();
  await rolesNavigation(page).click();
  await expect(page).toHaveURL(url('/config/roles'));
  await expect(confirmation(page)).toBeHidden();
});
