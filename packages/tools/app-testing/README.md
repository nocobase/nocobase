# @nocobase/app-testing

Test fixtures for NocoBase applications and plugins. A server test gets an application started the way `pnpm start` starts it — its own runtime, providers and plugins — on isolated test databases of its own, on the dialect `NOCOBASE_TEST_DB_DIALECT` selects, and SQLite when it is unset. An application's and a plugin's tests depend on this package alone: everything `@nocobase/db-testing` offers comes through `./server`, and everything `@nocobase/app-cli/testing` offers comes through `./cli`.

| Entry                          | What it gives a test                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `@nocobase/app-testing/server` | `createTestApp()`, the Vitest fixture `createAppTest()`, `createTestAppConfig()`, and `@nocobase/db-testing` |
| `@nocobase/app-testing/cli`    | `bindTestAppCommand()`, `createTestAppConfig()`, and `@nocobase/app-cli/testing`                             |
| `@nocobase/app-testing/client` | `renderWithApp()`, which renders a page inside a started client application                                  |

Declare it in `devDependencies`. The application runtime packages are optional peers: `./server` needs `@nocobase/app-server`, `./cli` needs `@nocobase/app-cli` and `@oclif/core`, `./client` needs `@nocobase/app-client`, `@nocobase/i18n`, `@nocobase/service-provider`, `react`, `react-router` and `@testing-library/react`, and the dialect packages follow `@nocobase/db-testing`'s rules — SQLite is required, every other dialect only when it is selected.

## An application on test databases

```ts
import { createTestApp } from '@nocobase/app-testing/server';
import { createStandaloneServer } from '../../server/standalone.ts';

const app = await createTestApp({ createServer: createStandaloneServer });
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

const test = createAppTest({ createServer: createStandaloneServer });

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

const config = await createTestAppConfig();
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

## Pages

```tsx
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import orders from '../client/index.js';
import { OrdersPage } from '../client/pages/orders.js';

test('lists the orders', async () => {
  await renderWithApp(<OrdersPage />, {
    plugins: [orders()],
    namespace: '@my-scope/app-plugin-orders',
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

The API client talks to `server` or `fetch`. Pass an application from `createTestApp()` as `server` to reach it in process, with `cookie` set to a session's `cookie` from `signIn()` to act as that user; otherwise `fetch` answers each request, and a request nothing answers fails the call that sent it. The server's `publicBasePath` is the mount path the page sees: the client configuration is written into the document the way the server renders it, so `resolveAppUrl()` builds URLs under it, as it does in the running application. `resolveAssetUrl()` follows that same mount path unless Vite's build-time `BASE_URL` is an absolute HTTP(S) CDN prefix; it is for shipped static files, not API or page URLs. Changing the test server's `publicBasePath` does not change a compiled CDN prefix. `answerApi(handler)` builds that `fetch` from a function of `{ method, path, query, json }`, with `path` below the API root: it returns the JSON body, or a `Response` for another status, and a handler that throws fails the request with status 500 and its message, as does a request whose JSON body cannot be parsed. A `vi.fn()` handler records every call the page made, for `toHaveBeenCalledWith`. `services` registers stand-ins before the plugins start, such as another plugin's client service; leave out the plugin a stand-in replaces. Toasts render after the page as plain text, and `toasts()` on the result lists the open ones.

The entry loads nothing from `@nocobase/db-testing`, so it runs under jsdom. Rendering Refine under a test's router needs `@refinedev/react-router` inlined, which the React preset of `@nocobase/dev-config` does.
