---
title: 'Testing'
description: 'Test application pages, routes, migrations and commands with shared fixtures.'
---

# Testing

Application and plugin tests use `@nocobase/app-testing` from `devDependencies`. It provides an application running on isolated databases, a client application around a page, and command fixtures. Keep ordinary Vitest tests for pure functions and services whose dependencies can be supplied directly.

## Choose the layer

| What needs verification                                  | Tool                                                                    | Environment |
| -------------------------------------------------------- | ----------------------------------------------------------------------- | ----------- |
| Page behavior, API calls, translations and notifications | `renderWithApp()` and `answerApi()` from `@nocobase/app-testing/client` | jsdom       |
| Real application routes, login and permissions           | `createAppTest()` from `@nocobase/app-testing/server`                   | Node        |
| A database-backed service or focused router              | `createDatabaseTest()` from `@nocobase/app-testing/server`              | Node        |
| Migration schema and metadata                            | `describeMigration()` from `@nocobase/app-testing/server`               | Node        |
| CLI flags, results, errors and application access        | `@nocobase/app-testing/cli`                                             | Node        |
| Browser navigation, layout and complete user workflows   | Playwright against a running application                                | Browser     |

A real database or sign-in does not by itself require a browser test. Check the API boundary in Node and the page behavior under jsdom; add a browser test for behavior that crosses those boundaries or depends on the browser.

## Where tests live

Current application templates use `tests/components/` for page/component tests, `tests/logic/` for logic and integration tests, and `tests/playwright/` for browser tests. Name files `*.test.ts` or `*.test.tsx`, never beside their production source. Their Vitest configuration defaults to jsdom, so server, database and CLI files declare `// @vitest-environment node`. Follow your application's actual configuration. Newly generated plugins use a [different directory-based environment configuration](../plugin-development/testing).

The examples below assume you have implemented an orders page, an authenticated `GET /api/orders` route returning `{ data: [{ id, name }] }`, a migration creating `orders.name`, and an export command with `--dry-run`. Replace these names and response shapes with your feature's contract. For a runnable page example already in the template, start with `tests/components/page-harness.test.tsx`.

## Test the real application

```ts
// tests/logic/orders.test.ts
// @vitest-environment node
import { createAppTest } from '@nocobase/app-testing/server';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.ts';

const test = createAppTest({
  createServer: createStandaloneServer,
  config: { auth: { secret: 'test-only-auth-secret-at-least-32-characters' } },
});

test('requires a session to list orders', async ({ testApp, request }) => {
  expect((await request('/orders')).status).toBe(401);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  expect((await admin.fetch('/orders')).status).toBe(200);
});
```

The fixture starts the application's own runtime, including its registered plugins, migrations and seeds. `request('/orders')` addresses the API below the application's public base path. Sign in using accounts your application actually seeds or creates; the default credentials apply only when the default administrator is installed. Add an authenticated account without the required grant and assert `403` for a protected route. The example above covers only anonymous and administrator access.

`createAppTest()` starts one application per file by default. Tests share its rows; select `scope: 'test'` for a fresh application per case, or explicitly clean up the records and grants each test creates. Databases and storage belong to the fixture and are removed afterward. When using `createTestApp()` directly, call `close()` in `finally`.

Use `connections` to name every connection the test writes, such as `['main', 'analytics']`. An omitted connection retains the application's own configuration. Additional test configuration goes in `config`; the application's config loader must honor the `configPath` supplied by the fixture, as the templates do. Disable unrelated external integrations in the test configuration when needed.

## Test a page

```tsx
// tests/components/orders.test.tsx
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import packageMetadata from '../../package.json' with { type: 'json' };
import locales from '../../client/locales/index.js';
import OrdersPage from '../../client/pages/orders.js';

it('shows the orders returned by the API', async () => {
  const api = vi.fn(({ method, path }: ApiCall) => {
    if (method === 'GET' && path === 'orders') {
      return { data: [{ id: '1', name: 'Order 1' }] };
    }
    return new Response(null, { status: 404 });
  });
  await renderWithApp(<OrdersPage />, {
    route: '/orders',
    namespace: packageMetadata.name,
    namespaces: { [packageMetadata.name]: locales },
    fetch: answerApi(api),
  });

  expect(await screen.findByText('Order 1')).toBeInTheDocument();
  expect(api).toHaveBeenCalledWith({ method: 'GET', path: 'orders' });
});
```

`renderWithApp()` starts a client application and keeps `useApiClient()`, `useService()`, `useTranslation()` and `useToaster()` real. It does not automatically load your application's `client/runtime.ts`. Pass required client plugins in `plugins`, application translations through `namespace` and `namespaces`, and application services or external substitutes through `services`. Do not register both a substitute and the plugin that owns the same service token.

The helper owns a memory router. Set `route` for the starting URL and render `Routes` with child `Route` elements inside it; do not nest another router. Declared host route guards are not enforced automatically, so test them through the application's route tests or a browser flow too.

If an installed application reports that `useLocation()` has no Router inside this helper, check the React Vitest preset's inline rules. With an older preset, add `/@nocobase\/(?:app-client\/|app-plugin-[^/]+\/(?:dist\/)?client\/|app-testing\/(?:dist\/)?src\/client\/)/u` to `test.server.deps.inline` so the published helper, page and plugin clients share application and router contexts. Keep server/database fixtures external; adding another Router does not fix the split context.

Translations are strict: a missing key fails rendering even if the component supplies `defaultValue`. Fix the key or locale resources. Use the locale loader map with `locale: 'zh-CN'` to cover another language. An isolated translated primitive that does not need application services can still use `TestI18nProvider` from `@nocobase/i18n/testing`.

`answerApi()` gives the handler `method`, an API-relative `path`, and optional `query` and parsed `json`. Return the response body for status 200 or a `Response` for another status. Handle unexpected calls explicitly: returning nothing produces a successful `null` body, and throwing becomes an HTTP 500 response. Assert the result and expected calls so errors cannot pass unnoticed.

Keep the render result to inspect notifications: `expect(view.toasts()).toEqual([expect.objectContaining({ type: 'success' })])`, after waiting for the action to finish. The helper renders toast text and cleans up when the test ends. Cover loading, empty, error and success states, and both allowed and denied actions; wait for permission checks before asserting that an action is absent.

The `server` option can replace `fetch` with a target exposing `fetch(Request)` and `publicBasePath`, such as a `createTestApp()` result. A session's `cookie` from `signIn()` makes requests as that user. The client entry is jsdom-safe; Node database/server fixtures still need their appropriate environment. For a complete browser/server workflow, use the browser suite.

## Test databases and migrations

Tests do not import database drivers or configure their own in-memory databases. Fixtures select SQLite when `NOCOBASE_TEST_DB_DIALECT` is unset, or the selected dialect otherwise. Install the selected dialect's package and configure its test server using that package's testing instructions. Assert schema with `expectCollection()`, which uses logical collection and field names instead of database-specific SQL.

Use `createDatabaseTest({ migrations, seeds })` for a database-backed service without a whole application. Its default schema isolation resets data and reapplies migrations between tests; `isolation: 'none'` shares the database within the file.

```ts
// tests/logic/orders-migration.test.ts
// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { describeMigration } from '@nocobase/app-testing/server';
import packageMetadata from '../../package.json' with { type: 'json' };

describeMigration('202610080001_create_orders', {
  sources: [
    {
      packageName: packageMetadata.name,
      directory: fileURLToPath(
        new URL('../../database/main/migrations', import.meta.url),
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('orders').toHaveField('name', {
      type: 'string',
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('orders').not.toExist();
  },
});
```

`describeMigration()` applies earlier migrations, applies the named migration, rolls it back, and reapplies it. It checks schema/metadata agreement and restores the previous schema on rollback. Include dependency migration sources when needed. Use `before` to prepare rows for a data migration, and `reversible: false` only for a deliberately irreversible migration. Test seed behavior against existing records and repeated execution too.

## Test commands

For a command that does not open the application, bind its class with `bindAppCommand()` and run it with `runAppCommand()` from `@nocobase/app-testing/cli`. Assert `result`, `json()`, `error` and `exitCode`. The following example supplies isolated database configuration for a command that opens the real application:

```ts
// tests/logic/export-orders.test.ts
// @vitest-environment node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import {
  bindTestAppCommand,
  createTestAppConfig,
  runAppCommand,
} from '@nocobase/app-testing/cli';
import { expect, it } from 'vitest';
import OrdersExport from '../../cli/commands/orders/export.ts';
import runtime from '../../server/runtime.ts';
import { createApp } from '../../server/app.ts';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));

it('previews the export', async () => {
  const config = await createTestAppConfig({
    config: {
      auth: { secret: 'test-only-auth-secret-at-least-32-characters' },
    },
  });
  try {
    const Bound = bindTestAppCommand(OrdersExport, {
      rootDir,
      id: 'app:orders:export',
      config,
      createApp,
      loadRuntime: () =>
        resolveStandaloneAppRuntime(runtime, {
          rootDir,
          configPath: config.path,
          env: { APP_STORAGE_DIR: path.join(config.directory, 'storage') },
          consoleLogStream: 'stderr',
        }),
    });
    const run = await runAppCommand(Bound, ['--dry-run', '--json']);
    expect(run.json()).toMatchObject({ ok: true, status: 'success-noop' });
  } finally {
    await config.dispose();
  }
});
```

The explicit `runtime` and `createApp` imports let Vitest resolve the application's TypeScript modules and their `.js` import specifiers. A custom `loadRuntime` must pass `config.path` itself; the example also keeps application storage in the fixture directory. With compiled JavaScript or an active TypeScript loader, the conventional loader can be used instead. `createTestAppConfig()` isolates databases, not arbitrary command output files, so direct exports and other writes to a temporary directory as well.

Prepare the schema and domain rows the command expects. The configuration fixture provisions databases but does not start an application: `app.start()` runs installation when auto-run is enabled, while `app.registerProviders()` alone does not apply migrations. This example assumes the command starts the application before querying; a command that assumes an already installed database needs installation in its test setup instead.

## Run the relevant checks

Run the affected files from the application root:

```bash
pnpm exec vitest run tests/components/orders.test.tsx tests/logic/orders.test.ts
pnpm exec eslint --max-warnings 0 tests/components/orders.test.tsx tests/logic/orders.test.ts
```

Confirm the test summary actually counts the named files: templates allow an empty test suite, so a mistyped path can exit successfully without testing anything. Run the owning TypeScript project and build when production code or emitted output changes; reserve `pnpm check` for changes that warrant every application check.

Default and Examples provide `pnpm test:e2e`; Hub needs Playwright configured before its first browser test. Start the application separately and set `APP_URL` to its full URL, including the base path. Keep login credentials in environment variables and browser session state out of Git. Use browser tests for layout, focus, navigation and complete workflows; jsdom cannot verify computed layout or input-method behavior.
