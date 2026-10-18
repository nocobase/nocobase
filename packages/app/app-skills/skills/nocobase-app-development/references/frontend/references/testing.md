# Frontend testing

## Where tests go

```text
tests/components/   Component tests: rendering and interaction of pages and components (Vitest, jsdom)
tests/logic/        Logic tests: route declarations, pure functions, providers (Vitest)
tests/playwright/   End-to-end tests against a running application (Playwright); create the directory with the first test
```

Tests never go beside the source. Vitest discovers `tests/**/*.test.{ts,tsx}` and skips `tests/playwright/` (`vitest.config.ts`); Playwright discovers `tests/playwright/**/*.test.ts` (`playwright.config.ts`). Use `tests/playwright/` only for what needs a real server and database, such as a flow across the browser and the API or a server-side permission check seen from the page. Everything else is a component or logic test. Applications created from the Default and Examples templates have Playwright set up; an application without it, before its first end-to-end test, adds `@playwright/test` to `devDependencies`, a `playwright.config.ts` with `testDir: './tests/playwright'` and `testMatch: '**/*.test.ts'`, a `test:e2e` script running `playwright test --pass-with-no-tests`, `exclude: ['tests/playwright/**']` to the `test` section of `vitest.config.ts` unless it is already there, and `playwright.config.ts` and `tests/playwright/**/*.ts` to the `include` of `tsconfig.node.json`.

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

Also run `tests/logic/page-permission-titles.test.ts` when adding or changing routes. It requires translated names for every application page permission, including overlays without navigation/breadcrumbs, and preserves the complete resource/action identity list. See [permission display names](page.md#permission-display-names).

For a page or component that uses application services, start from the [complete `@nocobase/app-testing/client` example](../../testing/client/page.md). `renderWithApp()` supplies the real API client, router, translations and toaster. Supply HTTP responses through `answerApi()`, load the application's locale map, and assert visible state and `view.toasts()`. Register the client plugins or service doubles that the page actually consumes; avoid mocking the whole `@nocobase/app-client` module.

Existing `tests/components/page-harness.test.tsx` files can still illustrate which states to cover: a request payload, a `403` without retry, a `401` offering sign-in, an action shown or hidden with permission, and a child route opened by URL. When adapting those cases, import the real page and use the application fixture for its service context. Put new files in the application's current test layout; the worked example uses `tests/client/` with an explicit React config.

For anything else, start from the test that already sets it up:

- **A second language**: pass the `client/locales/index.ts` loader map and switch with `changeLanguage` inside `act`, as the next section shows; `tests/components/primitive-labels.test.tsx` renders in Chinese from the start with `locale: 'zh-CN'`.
- **Overlay behavior in depth** (`beforeClose`, nested layers, focus): `tests/logic/route-overlay.test.tsx`.
- **A UI Library item**: it passes its English as `defaultValue`, but the strict runtime still fails on a key `client/locales/` lacks, so add the keys the item's README lists before testing a page that renders it.

- Assert what the user can see: text, roles and accessible names, the result of a click (`@testing-library/react`, `@testing-library/user-event` and the jest-dom assertions are set up). Do not assert internal state.
- To assert a toast from `renderWithApp()`, use `await waitFor(() => expect(view.toasts()).toMatchObject([...]))` with the expected `type`, `title` or `description`. The fixture registers a test toaster and also renders its messages as text; assertions do not depend on Base UI internals.
- When a button contains a `Spinner`, the spinner's "Loading" label becomes part of the button's name, so use a regular expression when you query by name.
- An open `RouteDialog` or `RouteDrawer` hides the page behind it from the accessibility tree, so a role query for something behind it, such as the selected tab, passes `hidden: true`: `getByRole('link', { name: 'Orders', hidden: true })`.
- A `Button` rendered as a `Link` (`nativeButton={false}`) has the `button` role, not `link`; query "New project" with `getByRole('button', …)`. Test an absence together with the presence case, as the harness does, so the assertion can fail.
- jsdom does not lay out the page or run an input method. Leave layout, narrow screens and IME input to the browser check (the screenshot tool, [`../scripts/capture.md`](../scripts/capture.md)), and do not simulate pointer geometry for hover menus (see [section 2 of `shell.md`](shell.md#2-header-icon-buttons)).
- A Vite server that a test starts itself (including one started by a helper) must use its own temporary `cacheDir`, deleted afterward. Do not delete or rebuild the dependency cache of a running development server; lazily loaded pages then stop working until the server is restarted.

## A minimal component test

The [complete component example](../../testing/client/page.md) includes the React config, component, English and Chinese locale files, and five cases covering bilingual submission and retry, plus pending state. Reuse that setup for a component that calls `useApiClient()`, `useTranslation()` or `useToaster()`.

For a primitive that needs translations alone, `createTestI18nRuntime()` and `TestI18nProvider` from `@nocobase/i18n/testing` can provide the smaller context. Give that runtime the application's actual namespace and locale resources and keep its strict translation checks enabled. Keep this narrower setup for components that do not consume application services.

- **Do not mock `@nocobase/i18n/client`.** A mocked `t` returns what the test told it to, so a misspelt key, a key the locale file lacks, or a component reading the wrong namespace all pass. The test runtime is strict: a key missing from the whole fallback chain throws, even when the call passes a `defaultValue`.
- When a strict runtime throws, fix the locale file or the component, not the test. Pass `strict: false` only for strings that are not keys, such as route titles passed through as their own `defaultValue`.
- Omit `namespace` on `TestI18nProvider` for a component a plugin exports for the application to render, so the test proves the component names its own namespace.
- To check a second language with `renderWithApp()`, pass the loader map in `namespaces` and set `locale: 'zh-CN'`. With a directly created i18n runtime, pass the loader map instead of one resource and call `runtime.changeLanguage('zh-CN')` inside `act`.

`packages/libs/i18n/README.md` in the `@nocobase/i18n` package documents every option.

## Running tests

Run the related test files with the application's matching React configuration, then lint them. Inspect its tsconfig includes before claiming the tests were typechecked; many templates exclude Vitest tests from their build configs. The complete client example uses `--config vitest.client.config.ts`:

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
