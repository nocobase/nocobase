# Playwright example: sign in once and reuse the session

Use Playwright for a flow that needs the actual browser, server and session cookie. There is no `@nocobase/app-testing/playwright` export. `createAppTest()` handles requests in process; it does not provide the HTTP address a browser needs.

## Prerequisites

Start a dedicated test application with its own database and storage. Use the full application entry URL printed as `Local:` by `pnpm dev`, including the deployment base path. For ordinary full-stack development this is the Hono server entry, not Vite's internal port. The example assumes the template's `/login` form in English, an enabled test account, and a home page with a level-one heading. Adapt accessible names to the application's actual localized UI.

The official templates include `@playwright/test` and `playwright.config.ts`. If Chromium is not installed, run `pnpm exec playwright install chromium`. In an application without Playwright, follow [frontend test setup](../../frontend/references/testing.md#where-tests-go) first. Keep `tests/playwright/**` excluded from Vitest and included in `tsconfig.node.json`.

Set `APP_URL`, `E2E_USERNAME` and `E2E_PASSWORD` in the shell or the CI secret environment. For example, `APP_URL=http://127.0.0.1:13000/main/` is valid only when it matches this test application's actual ready URL. No account values belong in committed test files. The template ignores `storage/`; preserve that exclusion because the saved browser state contains the session cookie.

## Resolve paths without dropping the deployment prefix

Create `tests/playwright/environment.ts`:

```ts
import { fileURLToPath } from 'node:url';

const entry = process.env.APP_URL;
if (!entry)
  throw new Error('Set APP_URL to the running test application entry.');

export const appUrl = new URL(`${entry.replace(/\/+$/, '')}/`);
export const authFile = fileURLToPath(
  new URL('../../storage/e2e/auth.json', import.meta.url),
);
```

Use relative URL paths below: `new URL('login', appUrl)` preserves `/main/`, whereas `new URL('/login', appUrl)` discards it.

## Sign in during global setup

Create `tests/playwright/global-setup.ts`:

```ts
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { appUrl, authFile } from './environment.js';

export default async function globalSetup(): Promise<void> {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  if (!username || !password) {
    throw new Error('Set E2E_USERNAME and E2E_PASSWORD for the test account.');
  }

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ locale: 'en-US' });
    const page = await context.newPage();
    await page.goto(new URL('login', appUrl).href);
    await page.getByLabel('Username or email').fill(username);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL(
      (url) => !url.pathname.replace(/\/$/, '').endsWith('/login'),
    );
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const session = await page.request.get(
      new URL('api/auth/get-session', appUrl).href,
    );
    expect(session.status()).toBe(200);
    await expect(session.json()).resolves.toMatchObject({
      user: { id: expect.any(String) },
    });

    await mkdir(dirname(authFile), { recursive: true });
    await context.storageState({ path: authFile });
  } finally {
    await browser.close();
  }
}
```

Global setup creates fresh state for each run. A failed sign-in fails setup instead of silently skipping the suite or saving an anonymous session.

## Load the saved state

For the template's single-browser configuration, add `globalSetup` and `use.storageState`, preserving any other application-specific settings:

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { authFile } from './tests/playwright/environment.js';

export default defineConfig({
  testDir: './tests/playwright',
  testMatch: '**/*.test.ts',
  globalSetup: './tests/playwright/global-setup.ts',
  timeout: 120_000,
  workers: 1,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    locale: 'en-US',
    storageState: authFile,
    trace: 'off',
  },
});
```

Create `tests/playwright/session.test.ts`:

```ts
import { expect, test } from '@playwright/test';
import { appUrl } from './environment.js';

test('opens the home page and retains the session after a reload', async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(appUrl.href);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const response = await page.request.get(
    new URL('api/auth/get-session', appUrl).href,
  );
  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toMatchObject({
    user: { id: expect.any(String) },
  });
  expect(pageErrors).toEqual([]);
});
```

`page.request` shares the browser context's cookies. The session assertion distinguishes a real signed-in session from an anonymous `200` response with a null body. Each test gets its own browser context initialized from the saved state, but the account and backend data remain shared. Tests that change preferences, permissions or records need separate users or test-owned data with cleanup.

## Run and check

With the application already running and the three environment variables set:

```bash
pnpm exec playwright test tests/playwright/session.test.ts
pnpm exec tsc -p tsconfig.node.json --noEmit
```

Expect one browser test, preceded by a successful setup login. The flow checks rendering, session reuse after reload, an authenticated API response and browser page errors. It does not verify a business operation or a permission matrix. Add those flows only when they need a real browser; use [client tests](../client/page.md) for loading, error and translation combinations.

Return to [testing and verification](../../testing.md).
