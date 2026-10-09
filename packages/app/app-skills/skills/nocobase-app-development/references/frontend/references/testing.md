# Frontend testing

## Where tests go

```text
tests/components/   Component tests: rendering and interaction of pages and components (Vitest, jsdom)
tests/logic/        Logic tests: route declarations, pure functions, providers (Vitest)
tests/playwright/   End-to-end tests against a running application (Playwright); create the directory with the first test
```

Tests never go beside the source. Vitest discovers `tests/**/*.test.{ts,tsx}` and skips `tests/playwright/` (`vitest.config.ts`); Playwright discovers `tests/playwright/**/*.test.ts` (`playwright.config.ts`). Use `tests/playwright/` for browser behavior and complete browser-to-API flows. A real server, database or sign-in alone belongs in a Node test with `createAppTest()` from `@nocobase/app-testing/server`; it does not require Playwright. Applications created from the Default and Examples templates have Playwright set up; one created from the Hub template does not, so before its first end-to-end test add `@playwright/test` to `devDependencies`, a `playwright.config.ts` with `testDir: './tests/playwright'` and `testMatch: '**/*.test.ts'`, a `test:e2e` script running `playwright test --pass-with-no-tests`, `exclude: ['tests/playwright/**']` to the `test` section of `vitest.config.ts` unless it is already there, and `playwright.config.ts` and `tests/playwright/**/*.ts` to the `include` of `tsconfig.node.json`.

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

**For a page, copy `tests/components/page-harness.test.tsx`.** It uses `renderWithApp()` from `@nocobase/app-testing/client` to render a list page and child-route `RouteDialog` with real API, i18n, authorization and toaster hooks. Its `answerApi()` handler answers requests, its `services` callback registers the real authorization client and a stand-in authentication service, and the real `AuthenticationProvider` reads that service. It covers loading, the request sent, 403 without retry, 401 with session refresh, allowed and denied actions, and closing a direct dialog URL with a success toast. Replace the inline page and routes with yours and replace the inline `copy` with the application's own locale resources.

`renderWithApp()` owns the `MemoryRouter`; render `Routes`, `Route` and `Outlet` inside it and set the initial URL through `route`. It starts registered client plugins and their providers, and shuts the client down when the test finishes. It does not load `client/runtime.ts`, the application shell or its route guards automatically. Register the plugins and application services the page actually needs; a test of host routing or declared permissions also needs the application's route tests or a browser test.

- Pass `plugins` for the client plugins whose real services, providers and translations the page needs. A plugin not listed contributes nothing.
- Pass `namespace: packageMetadata.name` and `namespaces: { [packageMetadata.name]: locales }` for application-owned text; import `locales` from `client/locales/index.ts`. Add a plugin's locales through its registration. For a shared component that must name its own namespace, omit `namespace` to test that contract.
- Use `services` to register application-owned services or substitutes for external dependencies before startup. Leave out a plugin whose service you replace: duplicate token registrations fail startup. Keep `useApiClient()`, `useService()`, `useToaster()` and `useTranslation()` real.
- `fetch: answerApi(handler)` receives `{ method, path, query, json }`, where `path` is below `/api/`. Return a JSON body for success or a `Response` for other statuses. Handle unexpected calls explicitly with an error response; returning nothing means a successful `null` response. A thrown handler becomes a 500 response, not an automatic test failure, so assert the page's result and the relevant calls.
- `toasts()` on the render result lists open notifications as `{ type, title, description, ... }`; assert those values or their rendered text rather than mocking `useToaster()` or inspecting the production toast component's DOM.
- For a second language, use the locale loader map with `locale: 'zh-CN'`. Translations are strict; fix missing keys rather than mocking `t` or disabling checks. `strictTranslations: false` is only for deliberately unowned literal text.

If an installed application's page reports `useLocation() may be used only in the context of a <Router>` even inside `renderWithApp()`, check the shared React Vitest preset. Its inline rules must include app-client, plugin client entries and the published app-testing client files so they use the same router module as the page. With an older preset, add `/@nocobase\/(?:app-client\/|app-plugin-[^/]+\/(?:dist\/)?client\/|app-testing\/(?:dist\/)?src\/client\/)/u` to `test.server.deps.inline` locally. Keep server/database fixtures external and do not add another Router.

## A page test

This example assumes an application-owned `OrdersPage` that loads `GET orders`, creates an order with `POST orders`, and displays a success toast, with its text in `client/locales/`. Adapt the routes, keys and response shape to the page's actual contract. The runnable template sample is `tests/components/page-harness.test.tsx`.

```tsx
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import packageMetadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';
import locales from '../../client/locales/index.js';
import OrdersPage from '../../client/pages/orders.js';

it('creates an order and confirms it', async () => {
  const api = vi.fn(({ method, path }: ApiCall) => {
    if (method === 'GET' && path === 'orders') {
      return { data: [], meta: { page: 1, pageSize: 20, total: 0 } };
    }
    if (method === 'POST' && path === 'orders') return { data: { id: '1' } };
    return new Response(null, { status: 404 });
  });
  const view = await renderWithApp(<OrdersPage />, {
    route: '/orders',
    namespace: packageMetadata.name,
    namespaces: { [packageMetadata.name]: locales },
    fetch: answerApi(api),
  });

  await userEvent.click(
    await screen.findByRole('button', { name: enUS.orders.create }),
  );

  expect(api).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'orders', method: 'POST' }),
  );
  await waitFor(() =>
    expect(view.toasts()).toEqual([
      expect.objectContaining({ type: 'success' }),
    ]),
  );
});
```

`server` can replace `fetch` with an in-process target implementing `fetch(Request)` and `publicBasePath`; the result of `createTestApp()` qualifies. Pass a session's `cookie` from `signIn()` to act as that user. The client entry is jsdom-safe; run Node server/database fixtures in their appropriate environment instead of assuming importing them into jsdom is supported. Use the Node application suite for real permission boundaries and a browser test when the full page/server flow needs verification.

## Components and browser limits

An isolated primitive with no application services may use Testing Library directly, with `TestI18nProvider` and `createTestI18nRuntime` from `@nocobase/i18n/testing` when it translates. Use the real locale resources and keep strict checks. `tests/components/primitive-labels.test.tsx` and `tests/logic/route-overlay.test.tsx` remain examples for translated primitives and detailed overlay behavior.

- Assert visible text, roles, accessible names and the result of interactions. For absence assertions, wait for the relevant API or permission check to finish, and cover the corresponding presence case too.
- A UI Library item may supply `defaultValue`, but strict translation still fails on a missing key; add the keys its README lists.
- A button containing a `Spinner` includes the spinner's "Loading" label in its accessible name; use a regular expression when appropriate.
- An open `RouteDialog` or `RouteDrawer` hides the parent page from the accessibility tree. Querying a control behind it may need `hidden: true`.
- A `Button` rendered as a `Link` (`nativeButton={false}`) has the `button` role. Use `getByRole('button', …)`.
- jsdom does not lay out the page or run an input method. Verify layout, narrow screens and IME input in the browser; see [browser capture](../scripts/capture.md) and [header buttons](shell.md#2-header-icon-buttons).
- A Vite server started by a test must use its own temporary `cacheDir`, deleted afterward. Do not delete or rebuild the dependency cache of a running development server.

## Running tests

Run only the related test files, then lint them: `tests/` is outside every tsconfig and only ESLint checks it (`tests/playwright/` is covered by `tsconfig.node.json`):

```bash
pnpm exec vitest run <related-test-files>
```

```bash
pnpm exec eslint --max-warnings 0 <related-test-files>
```

`vitest.config.ts` sets `passWithNoTests: true`, so a mistyped or missing path prints "No test files found" and exits 0 without running anything. Confirm that the summary line counts every file you named (`Test Files  N passed (N)`).

End-to-end tests run against a running application. `playwright.config.ts` sets no `baseURL` or `webServer`, so start `pnpm dev` first and have each test read the application URL, including the deployment base path, from `APP_URL` (defaulting to the `Local:` URL `pnpm dev` prints, such as `http://127.0.0.1:13000/main/`). Sign in once, not in every test. The template's `playwright.config.ts` has neither of the two settings this needs, so add them: `globalSetup: './tests/playwright/global-setup.ts'`, whose default export opens `/login`, signs in with a development account read from `E2E_USERNAME` and `E2E_PASSWORD` (so no credentials are committed) and saves the context's `storageState` to `storage/e2e/auth.json`, which `storage/` keeps out of git; and `use: { storageState: 'storage/e2e/auth.json' }` in the config. Tests then create and remove their own data with `page.request`, which sends the same session cookie:

```bash
pnpm test:e2e
```
