import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import type { Role } from '../shared/access.js';
import { Api, USERS, url } from './support/fixtures.ts';

// The standard harness supplies its own administrator; isolated development runs may supply a temporary one.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('nocobase.locale', 'en-US'),
  );
  await page.goto(url('/login'));
  await page
    .getByRole('textbox', { name: 'Username or email' })
    .fill(process.env.E2E_USERNAME ?? USERS.admin.email);
  await page
    .getByRole('textbox', { name: 'Password' })
    .fill(process.env.E2E_PASSWORD ?? USERS.admin.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
});

async function withRole(
  page: Page,
  run: (role: Role, api: Api) => Promise<void>,
  title = 'PM-367 temporary role',
): Promise<void> {
  const api = new Api(page.request);
  const role = await api.post<Role>('access/roles', {
    title,
    pages: [],
    settings: {},
    abilities: {},
  });
  try {
    await page.goto(url(`/config/roles/${role.key}`));
    await expect(
      page.getByRole('textbox', { name: 'Name', exact: true }),
    ).toHaveValue(title);
    await run(role, api);
  } finally {
    await api.delete(`access/roles/${role.key}`);
  }
}

async function clean(page: Page, title: string): Promise<void> {
  await expect(
    page.getByRole('textbox', { name: 'Name', exact: true }),
  ).toHaveValue(title);
  await expect(
    page.getByRole('button', { name: 'Save', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Discard changes', exact: true }),
  ).toBeDisabled();
}

async function save(page: Page): Promise<void> {
  const response = page.waitForResponse(
    (r) =>
      r.request().method() === 'PATCH' &&
      r.url().includes('/api/access/roles/'),
  );
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  expect((await response).status()).toBe(200);
}

test('normalizes the saved title, saves ordinary titles again and preserves permissions', async ({
  page,
}) => {
  await withRole(page, async (role, api) => {
    const input = page.getByRole('textbox', { name: 'Name', exact: true });
    await input.fill('');
    await input.pressSequentially('  QA test role  ');
    await save(page);
    const saved = (await api.get<Role[]>('access/roles')).find(
      (r) => r.key === role.key,
    )!;
    expect(saved.title).toBe('QA test role');
    await clean(page, 'QA test role');
    if (process.env.PM367_SCREENSHOT_DIR)
      await page.screenshot({
        path: path.join(
          process.env.PM367_SCREENSHOT_DIR,
          'role-normalized.png',
        ),
      });
    expect(saved.pages).toEqual(role.pages);
    expect(saved.settings).toEqual(role.settings);
    expect(saved.abilities).toEqual(role.abilities);
    for (const title of ['Ordinary role', 'Edited again']) {
      await input.fill(title);
      await expect(
        page.getByRole('button', { name: 'Save', exact: true }),
      ).toBeEnabled();
      await save(page);
      await clean(page, title);
    }
  });
});

for (const field of ['title', 'permission'] as const) {
  test(`preserves reverted ${field} edits when reconnect GET arrives before PATCH response`, async ({
    page,
  }) => {
    let lastRefresh = Date.now();
    page.on('response', (response) => {
      if (response.url().endsWith('/api/access/roles'))
        lastRefresh = Date.now();
    });
    await withRole(
      page,
      async (role, api) => {
        let release!: () => void;
        let reached!: () => void;
        const held = new Promise<void>((resolve) => {
          release = resolve;
        });
        const persisted = new Promise<void>((resolve) => {
          reached = resolve;
        });
        await page.route('**/api/access/roles/*', async (route) => {
          if (route.request().method() !== 'PATCH') return route.continue();
          const response = await route.fetch();
          expect(response.status()).toBe(200);
          console.log(`${field}: PATCH persisted; response held`);
          reached();
          await held;
          await route.fulfill({ response });
        });
        const input = page.getByRole('textbox', { name: 'Name', exact: true });
        const permission = page.getByRole('switch', {
          name: 'My issues',
          exact: true,
        });
        await input.fill('Submitted');
        if (field === 'permission') await permission.click();
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        try {
          await persisted;
          if (field === 'title') await input.fill('Original');
          else await permission.click();
          console.log(`${field}: post-submit edit reverted to original`);
          // Reconnect refetches only stale queries. Wait for the real application's ten-second stale time.
          await expect
            .poll(() => Date.now() - lastRefresh, { timeout: 15000 })
            .toBeGreaterThan(10050);
          const refreshed = page.waitForResponse(
            (response) =>
              response.url().endsWith('/api/access/roles') &&
              response.request().method() === 'GET',
          );
          // Dispatch the browser connectivity events without aborting the already-persisted PATCH response.
          await page.evaluate(
            "window.dispatchEvent(new Event('offline')); window.dispatchEvent(new Event('online'));",
          );
          expect((await refreshed).status()).toBe(200);
          await expect(
            page.getByRole('heading', {
              name: 'Submitted Custom',
              exact: true,
            }),
          ).toBeVisible();
          console.log(
            `${field}: GET returned Submitted and rendered before PATCH response`,
          );
          if (field === 'title') await expect(input).toHaveValue('Original');
          else await expect(permission).not.toBeChecked();
        } finally {
          release();
        }
        await expect(
          page.getByRole('button', { name: 'Save', exact: true }),
        ).toBeEnabled();
        if (field === 'title') await expect(input).toHaveValue('Original');
        else await expect(permission).not.toBeChecked();
        console.log(
          `${field}: PATCH response delivered; later edit and dirty state retained`,
        );
        if (process.env.PM367_SCREENSHOT_DIR) {
          await page
            .getByRole('button', { name: 'Business operations', exact: true })
            .click();
          await page.screenshot({
            path: path.join(
              process.env.PM367_SCREENSHOT_DIR,
              `reverted-${field}.png`,
            ),
          });
        }
        await page.unrouteAll({ behavior: 'wait' });
        await page
          .getByRole('button', { name: 'Discard changes', exact: true })
          .click();
        await clean(page, 'Submitted');
        if (field === 'permission') await expect(permission).toBeChecked();
        if (field === 'title') await input.fill('Original');
        else await permission.click();
        await save(page);
        await clean(page, field === 'title' ? 'Original' : 'Submitted');
        const saved = (await api.get<Role[]>('access/roles')).find(
          (item) => item.key === role.key,
        )!;
        expect(saved.title).toBe(field === 'title' ? 'Original' : 'Submitted');
        expect(saved.pages).not.toContain('pm-my-issues');
        console.log(
          `${field}: discard restored saved baseline; reverted edit saved again successfully`,
        );
      },
      'Original',
    );
  });
}

test('saves title and page permission together', async ({ page }) => {
  await withRole(page, async (role, api) => {
    await page
      .getByRole('textbox', { name: 'Name', exact: true })
      .fill('  With permission  ');
    const permission = page.getByRole('switch', {
      name: 'My issues',
      exact: true,
    });
    await permission.click();
    await save(page);
    await clean(page, 'With permission');
    await expect(permission).toBeChecked();
    const saved = (await api.get<Role[]>('access/roles')).find(
      (r) => r.key === role.key,
    )!;
    expect(saved.pages).toContain('pm-my-issues');
    expect(saved.title).toBe('With permission');
  });
});

test('keeps input and permissions with visible feedback after a failed request', async ({
  page,
}) => {
  await withRole(page, async () => {
    await page.route('**/api/access/roles/*', (route) =>
      route.request().method() === 'PATCH'
        ? route.abort('failed')
        : route.continue(),
    );
    await page
      .getByRole('textbox', { name: 'Name', exact: true })
      .fill('  Keep after failure  ');
    const permission = page.getByRole('switch', {
      name: 'My issues',
      exact: true,
    });
    await permission.click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page
        .getByText('The request failed. Please try again.', { exact: true })
        .and(page.locator('[data-slot="toast-title"]')),
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: 'Name', exact: true }),
    ).toHaveValue('  Keep after failure  ');
    await expect(permission).toBeChecked();
    await expect(
      page.getByRole('button', { name: 'Save', exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole('button', { name: 'Discard changes', exact: true }),
    ).toBeEnabled();
    if (process.env.PM367_SCREENSHOT_DIR)
      await page.screenshot({
        path: path.join(process.env.PM367_SCREENSHOT_DIR, 'role-failure.png'),
      });
  });
});

test('keeps edits made during the save and its subsequent refresh', async ({
  page,
}) => {
  await withRole(page, async (role, api) => {
    let releaseSave!: () => void;
    let saveReached!: () => void;
    const saving = new Promise<void>((resolve) => {
      saveReached = resolve;
    });
    const heldSave = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });
    await page.route('**/api/access/roles/*', async (route) => {
      if (route.request().method() === 'PATCH') {
        saveReached();
        await heldSave;
      }
      await route.continue();
    });
    let releaseRefresh!: () => void;
    let refreshReached!: () => void;
    const refreshing = new Promise<void>((resolve) => {
      refreshReached = resolve;
    });
    const heldRefresh = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    await page.route('**/api/access/roles', async (route) => {
      const response = await route.fetch();
      refreshReached();
      await heldRefresh;
      await route.fulfill({ response });
    });
    const input = page.getByRole('textbox', { name: 'Name', exact: true });
    const permission = page.getByRole('switch', {
      name: 'My issues',
      exact: true,
    });
    await input.fill('  Submitted title  ');
    await permission.click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await saving;
    await input.fill('Typed while saving');
    releaseSave();
    await refreshing;
    await expect(input).toHaveValue('Typed while saving');
    await input.fill('Typed while refreshing');
    await permission.click();
    const refreshed = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/access/roles') && r.request().method() === 'GET',
    );
    releaseRefresh();
    await refreshed;
    await expect(input).toHaveValue('Typed while refreshing');
    await expect(permission).not.toBeChecked();
    await expect(
      page.getByRole('button', { name: 'Save', exact: true }),
    ).toBeEnabled();
    await page.unrouteAll({ behavior: 'wait' });
    await save(page);
    await clean(page, 'Typed while refreshing');
    const saved = (await api.get<Role[]>('access/roles')).find(
      (r) => r.key === role.key,
    )!;
    expect(saved.pages).not.toContain('pm-my-issues');
  });
});
