# @nocobase/app-testing

Test fixtures for NocoBase applications and plugins. A server test gets an application started the way `pnpm start` starts it — its own runtime, providers and plugins — on isolated test databases of its own, on the dialect `NOCOBASE_TEST_DB_DIALECT` selects, and SQLite when it is unset. An application's and a plugin's tests depend on this package alone: everything `@nocobase/db-testing` offers comes through `./server`, and everything `@nocobase/app-cli/testing` offers comes through `./cli`.

| Entry                          | What it gives a test                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `@nocobase/app-testing/server` | `createTestApp()`, the Vitest fixture `createAppTest()`, `createTestAppConfig()`, and `@nocobase/db-testing` |
| `@nocobase/app-testing/cli`    | `bindTestAppCommand()`, `createTestAppConfig()`, and `@nocobase/app-cli/testing`                             |
| `@nocobase/app-testing/client` | `renderWithApp()`, which renders a page inside a started client application                                  |

Declare it in `devDependencies`. The application runtime packages are optional peers: `./server` needs `@nocobase/app-server`, `./cli` needs `@nocobase/app-cli` and `@oclif/core`, `./client` needs `@nocobase/app-client`, `@nocobase/i18n`, `@nocobase/service-provider`, `react`, `react-router` and `@testing-library/react`, and the dialect packages follow `@nocobase/db-testing`'s rules — SQLite is required, every other dialect only when it is selected.

Use ordinary Vitest tests for pure functions and services with explicit dependencies. Run server, database and CLI fixtures under Node, and page tests under jsdom. New plugins select those environments by directory through Vitest projects (`tests/client/`, `tests/server/`, `tests/database/`, `tests/cli/`); current application templates retain `tests/components/` and `tests/logic/`, with Node environment comments for server tests. Follow the consumer's actual configuration. Real login and a real database do not require a browser test; reserve browser tests for browser behavior and complete user workflows.

## An application on test databases

```ts
import { createTestApp } from '@nocobase/app-testing/server';
import { createStandaloneServer } from '../../server/standalone.ts';

const app = await createTestApp({
  createServer: createStandaloneServer,
  config: { auth: { secret: 'test-only-auth-secret-at-least-32-characters' } },
});
try {
  const response = await app.request('/healthz'); // <publicBasePath>/api/healthz
} finally {
  await app.close(); // stops it, drops its databases, removes its files
}
```

`createTestApp()` provisions one database per connection in `connections` (`['main']` by default) and writes an application configuration file naming them, which the application loads through `configPath` exactly as it loads `config.yml`. A connection not named keeps what the application configures, which is how an `external` connection keeps the database it reads but does not own. `config` adds further sections to the same file, such as `{ users: { initialAdmin: … } }`. The application installs itself on start — its own and its plugins' migrations and seeds on every provisioned connection — unless `install: false`. Its storage goes to a temporary directory, so applications started side by side share no queue or jobs state.

The application has to load the configuration file it is given, as the application templates' `server/config.ts` does with `context.configPath ?? context.environment.APP_CONFIG_FILE`.

To act as a signed-in user, sign in through the application with `signIn()` from `@nocobase/app-plugin-authentication/testing`; a test application qualifies as its target.

```ts
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';

const admin = await signIn(app, DEFAULT_ADMIN_CREDENTIALS);
const users = await admin.fetch('/users');
```

## With Vitest

```ts
import { createAppTest } from '@nocobase/app-testing/server';
import { createStandaloneServer } from '../../server/standalone.ts';

const test = createAppTest({
  createServer: createStandaloneServer,
  config: { auth: { secret: 'test-only-auth-secret-at-least-32-characters' } },
});

test('serves the seeded items', async ({ request, expectCollection }) => {
  await expectCollection('items').toHaveField('name');
  expect((await request('/items')).status).toBe(200);
});
```

The context carries `testApp`, `app`, `fetch`, `request`, `database`, `connection` and `expectCollection`. `scope: 'file'` (the default) starts one application for the test file, because starting one installs every migration and seed of it and its plugins; `scope: 'test'` starts a fresh one, on fresh databases, for every test. Everything else — `createDatabaseTest()`, `describeMigration()`, `expectCollection()`, `testDatabaseCapabilities()` — is `@nocobase/db-testing`'s, documented in its README.

## Commands

```ts
import {
  bindTestAppCommand,
  createTestAppConfig,
  runAppCommand,
} from '@nocobase/app-testing/cli';

const config = await createTestAppConfig({
  config: { auth: { secret: 'test-only-auth-secret-at-least-32-characters' } },
});
try {
  const run = await runAppCommand(
    bindTestAppCommand(MyCommand, { rootDir, config }),
    ['--json'],
  );
  expect(run.json()).toMatchObject({ ok: true });
} finally {
  await config.dispose();
}
```

`bindTestAppCommand()` is `bindAppCommand()` with the application the command opens pointed at the test databases `config` names, so a command that opens the application — `db apply`, or one of a plugin's — runs against databases of its own.

The conventional loader uses Node. For a TypeScript application whose source imports `.js` specifiers, run with the application's TypeScript loader or statically import `server/runtime.ts` and `server/app.ts` in the test and pass `loadRuntime` and `createApp`. A custom loader calls `resolveStandaloneAppRuntime(runtime, { rootDir, configPath: config.path, env: { APP_STORAGE_DIR: path.join(config.directory, 'storage') }, consoleLogStream: 'stderr' })` from `@nocobase/app-server/node`. It must pass the test configuration itself. The fixture provisions databases; a command that assumes an installed schema needs migrations and any required rows prepared before its operations. `app.start()` installs when auto-run is enabled, whereas `app.registerProviders()` alone does not. Redirect output files into a temporary directory too: database isolation does not redirect arbitrary writes.

## Pages

```tsx
// tests/client/orders.test.tsx in a plugin.
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import orders from '../../client/index.js';
import { OrdersPage } from '../../client/pages/orders.js';
import packageMetadata from '../../package.json' with { type: 'json' };

test('lists the orders', async () => {
  await renderWithApp(<OrdersPage />, {
    plugins: [orders()],
    namespace: packageMetadata.name,
    route: '/orders',
    fetch: answerApi(({ method, path }) =>
      method === 'GET' && path === 'orders'
        ? { data: [{ name: 'Order 1' }] }
        : new Response(null, { status: 404 }),
    ),
  });

  expect(await screen.findByText('Order 1')).toBeInTheDocument();
});
```

`renderWithApp()` starts a client application with `plugins`, their services and their translations, and renders the page inside it under a `MemoryRouter` starting at `route`, the way the application renders it: `useApiClient()`, `useService()`, `useToaster()` and `useTranslation()` are the real ones, not mocks of `@nocobase/app-client`. `namespace` is the translation scope the application gives a plugin's own pages. Translations are strict, so a key the locale files lack fails the test. Call it inside a test: the application shuts down when the test finishes.

For application-owned pages, read the namespace from the application's `package.json` and pass its `client/locales/index.ts` loader map as `namespaces: { [packageMetadata.name]: locales }`, with `namespace: packageMetadata.name`. Set `locale` to exercise another language. The helper does not automatically load the application's `client/runtime.ts`: supply required plugins and application services explicitly. Render `Routes` with child `Route` elements inside the existing router rather than nesting another router. Host route guards and declared `authz` are not installed automatically and need application routing or browser coverage too. A translated primitive that needs no application services can use `TestI18nProvider` from `@nocobase/i18n/testing` alone.

The API client talks to `server` or `fetch`. Pass an application from `createTestApp()` as `server` to reach it in process, with `cookie` set to a session's `cookie` from `signIn()` to act as that user; otherwise `fetch` answers each request, and a request nothing answers fails the call that sent it. The server's `publicBasePath` is the mount path the page sees: the client configuration is written into the document the way the server renders it, so `resolveAppUrl()` builds URLs under it, as it does in the running application. `resolveAssetUrl()` follows that same mount path unless Vite's build-time `BASE_URL` is an absolute HTTP(S) CDN prefix; it is for shipped static files, not API or page URLs. Changing the test server's `publicBasePath` does not change a compiled CDN prefix. `answerApi(handler)` builds that `fetch` from a function of `{ method, path, query, json }`, with `path` below the API root: it returns the JSON body, or a `Response` for another status, and a handler that throws fails the request with status 500 and its message, as does a request whose JSON body cannot be parsed. A `vi.fn()` handler records every call the page made, for `toHaveBeenCalledWith`. `services` registers stand-ins before the plugins start, such as another plugin's client service; leave out the plugin a stand-in replaces. Toasts render after the page as plain text, and `toasts()` on the result lists the open ones.

The entry loads nothing from `@nocobase/db-testing`, so it runs under jsdom. The React preset of `@nocobase/dev-config` inlines `@refinedev/react-router`, `@nocobase/app-client`, plugin client entries and the app-testing client files so the helper, page and plugins share application and router contexts. With an older preset, add `/@nocobase\/(?:app-client\/|app-plugin-[^/]+\/(?:dist\/)?client\/|app-testing\/(?:dist\/)?src\/client\/)/u` to `test.server.deps.inline` if a published fixture reports `useLocation()` outside a Router. Keep the match limited to the client runtime, plugin clients and fixture files.

Keep server/database fixture imports in their supported Node environment; the client entry's jsdom support does not make every server import jsdom-safe. An `answerApi()` handler should handle unexpected requests explicitly: returning nothing produces status 200 with a `null` body, and a thrown handler produces status 500, so assert the expected response or page state as well as the calls. Wait for pending API and permission checks before asserting that a protected action is absent.
