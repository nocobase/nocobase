# Frontend testing

## Where tests go

```text
tests/components/   Component tests: rendering and interaction of pages and components (Vitest, jsdom)
tests/logic/        Logic tests: route declarations, pure functions, providers (Vitest)
e2e/                End-to-end tests against a running application (Playwright); create the directory with the first test
```

Tests never go beside the source. Vitest discovers `tests/**/*.test.{ts,tsx}` (`vitest.config.ts`); Playwright discovers `e2e/**/*.test.ts` (`playwright.config.ts`). Use `e2e/` only for what needs a real server and database, such as a flow across the browser and the API or a server-side permission check seen from the page. Everything else is a component or logic test. Applications created from the Default and Examples templates have Playwright set up; one created from the Hub template does not, so before its first end-to-end test add `@playwright/test` to `devDependencies`, a `playwright.config.ts` with `testDir: './e2e'` and `testMatch: '**/*.test.ts'`, a `test:e2e` script running `playwright test --pass-with-no-tests`, and `playwright.config.ts` and `e2e/**/*.ts` to the `include` of `tsconfig.node.json`.

## What to test

| What changed          | Test at least                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page or component     | What it renders in each state (loading, empty, no results, failed) and what happens after an interaction: the request sent, the state change, the toast, the error shown where the action started                                                                                                                                                                                             |
| Overlay (child route) | Opening its URL renders the overlay over the parent; closing returns to the parent URL with the query kept; `beforeClose` blocks closing while submitting; opened from a view other than the first one the page shows — every tab of a page whose header opens it — the URL keeps that view and closing returns to it ([`example/detail-page-tabs.md`](example/detail-page-tabs.md#the-test)) |
| Covering child page   | Opening its URL covers the parent: the parent's content stays in the document, and `RouteChildPage` makes what it covers `inert`, so `expect(screen.getByRole('heading', { name: parentTitle }).closest('[inert]')).not.toBeNull()` passes, and fails for a child route that renders inline below the parent's content; the back button returns to the parent URL with the query kept         |
| Route declarations    | `tests/logic/client-routes.test.ts` already checks that every page loads and pins each page's resolved `authz`; when you add a page that requires sign-in, add it to the test's page grant list, as [section 12 of `page.md`](page.md#12-update-the-route-test) describes                                                                                                                     |
| Copy                  | `tests/logic/app-locale-coverage.test.ts` passes: every key the application's code passes to `t()` or names as a route `title`, and every dynamic key family, exists in both locale files. Component tests render with the real i18n runtime (below) rather than a mocked `t`, so both languages show real text, not keys                                                                     |
| A bug fix             | A test that fails before the fix and passes after it, when jsdom can reproduce the bug                                                                                                                                                                                                                                                                                                        |

## Building the test harness

**For a page, copy `tests/components/page-harness.test.tsx`.** It renders a small list page with a child-route `RouteDialog` in a memory router inside the real, strict i18n runtime (next section), and mocks only what the page reaches outside itself for: `useApiClient` (keeping the real `ApiClientError`), `useCan` and `useToaster`, all created with `vi.hoisted`. Its tests are the shapes to repeat: the request the page sends, a 403 without "Retry", a 401 that offers "Sign in again", an action shown with permission and hidden without it, and a child route opened from its URL and closed back to the list. It also mocks `useAuthentication` for the 401 case. Replace its inline page with your page and its child routes, drop the `copy` the harness defines for its inline page, since your page's keys are in `client/locales/`, keep the setup, and put the file in `tests/components/` (the template's own overlay test happens to sit in `tests/logic/`).

For anything else, start from the test that already sets it up:

- **A second language**: pass the `client/locales/index.ts` loader map and switch with `changeLanguage` inside `act`, as the next section shows; `tests/components/primitive-labels.test.tsx` renders in Chinese from the start with `locale: 'zh-CN'`.
- **Overlay behavior in depth** (`beforeClose`, nested layers, focus): `tests/logic/route-overlay.test.tsx`.
- **A UI Library item**: it passes its English as `defaultValue`, but the strict runtime still fails on a key `client/locales/` lacks, so add the keys the item's README lists before testing a page that renders it.

- Assert what the user can see: text, roles and accessible names, the result of a click (`@testing-library/react`, `@testing-library/user-event` and the jest-dom assertions are set up). Do not assert internal state.
- To assert a toast, mock `useToaster` as the harness does, returning one shared `{ show: vi.fn(), close: vi.fn() }`, and assert what `show` was called with: its `type`, `title` and `description`, not how Base UI renders them. A component rendered without a registered toaster still renders; its toasts are logged to the console instead of shown.
- When a button contains a `Spinner`, the spinner's "Loading" label becomes part of the button's name, so use a regular expression when you query by name.
- An open `RouteDialog` or `RouteDrawer` hides the page behind it from the accessibility tree, so a role query for something behind it, such as the selected tab, passes `hidden: true`: `getByRole('link', { name: 'Orders', hidden: true })`.
- A `Button` rendered as a `Link` (`nativeButton={false}`) has the `button` role, not `link`; query "New project" with `getByRole('button', …)`. Test an absence together with the presence case, as the harness does, so the assertion can fail.
- jsdom does not lay out the page or run an input method. Leave layout, narrow screens and IME input to the browser check (the screenshot tool, [`../scripts/capture.md`](../scripts/capture.md)), and do not simulate pointer geometry for hover menus (see [section 2 of `shell.md`](shell.md#2-header-icon-buttons)).
- A Vite server that a test starts itself (including one started by a helper) must use its own temporary `cacheDir`, deleted afterward. Do not delete or rebuild the dependency cache of a running development server; lazily loaded pages then stop working until the server is restarted.

## A minimal component test

Render with the real i18n runtime and the application's own locale files, a router, and one shared mock of each hook that reaches outside the component. `tests/components/` in the application holds more examples to follow.

```tsx
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';

import packageMetadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';
import OrdersPage from '../../client/pages/orders.js';

// One object for the whole file, so effects that depend on `api` do not refetch on every render.
const api = { request: vi.fn() };
const toaster = { show: vi.fn(), close: vi.fn() };
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => toaster,
}));

it('creates an order and confirms it', async () => {
  api.request
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ id: 1 });
  const runtime = await createTestI18nRuntime({
    application: { namespace: packageMetadata.name, resources: enUS },
  });

  render(
    <TestI18nProvider runtime={runtime} namespace={packageMetadata.name}>
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>
    </TestI18nProvider>,
  );
  await userEvent.click(
    await screen.findByRole('button', { name: enUS.orders.create }),
  );

  expect(api.request).toHaveBeenLastCalledWith(
    expect.objectContaining({ path: 'orders:create', method: 'POST' }),
  );
  expect(toaster.show).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'success' }),
  );
});
```

- **Do not mock `@nocobase/i18n/client`.** A mocked `t` returns what the test told it to, so a misspelt key, a key the locale file lacks, or a component reading the wrong namespace all pass. The test runtime is strict: a key missing from the whole fallback chain throws, even when the call passes a `defaultValue`.
- When a strict runtime throws, fix the locale file or the component, not the test. Pass `strict: false` only for strings that are not keys, such as route titles passed through as their own `defaultValue`.
- Omit `namespace` on `TestI18nProvider` for a component a plugin exports for the application to render, so the test proves the component names its own namespace.
- To check a second language, pass the `client/locales/index.ts` loader map instead of a resource and call `runtime.changeLanguage('zh-CN')` inside `act`.

`packages/libs/i18n/README.md` in the `@nocobase/i18n` package documents every option.

## Running tests

Run only the related test files, then lint them: `tests/` is outside every tsconfig and only ESLint checks it (`e2e/` is covered by `tsconfig.node.json`):

```bash
pnpm exec vitest run <related-test-files>
```

```bash
pnpm exec eslint --max-warnings 0 <related-test-files>
```

`vitest.config.ts` sets `passWithNoTests: true`, so a mistyped or missing path prints "No test files found" and exits 0 without running anything. Confirm that the summary line counts every file you named (`Test Files  N passed (N)`).

End-to-end tests run against a running application. `playwright.config.ts` sets no `baseURL` or `webServer`, so start `pnpm dev` first and have each test read the application URL, including the deployment base path, from `APP_URL` (defaulting to the `Local:` URL `pnpm dev` prints, such as `http://127.0.0.1:13000/main/`). Sign in once, not in every test. The template's `playwright.config.ts` has neither of the two settings this needs, so add them: `globalSetup: './e2e/global-setup.ts'`, whose default export opens `/login`, signs in with a development account read from `E2E_USERNAME` and `E2E_PASSWORD` (so no credentials are committed) and saves the context's `storageState` to `storage/e2e/auth.json`, which `storage/` keeps out of git; and `use: { storageState: 'storage/e2e/auth.json' }` in the config. Tests then create and remove their own data with `page.request`, which sends the same session cookie:

```bash
pnpm test:e2e
```
