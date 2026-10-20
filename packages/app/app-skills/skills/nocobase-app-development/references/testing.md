# Testing and verification

## Testing with `@nocobase/app-testing`

Application tests use `@nocobase/app-testing` in `devDependencies`. It exposes `/server`, `/client` and `/cli`; choose the entry that matches the test environment. Use the real repository, application composition or command class whose behavior the test needs to prove. The examples below are references of the `nocobase-app-development` Skill delivered by `@nocobase/app-skills`.

### Worked examples by directory

Start with the example for the boundary you need to test. These examples run from a NocoBase 3 application's root and use its installed packages; they do not require the NocoBase source repository.

| Directory     | Example                                                                                                                                                       | Runtime and entry                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `database/`   | [Records, constraints, transactions and isolation](testing/database/repository.md), [apply, roll back and reapply a migration](testing/database/migration.md) | Node; `@nocobase/app-testing/server`                      |
| `server/`     | [Authentication, permissions, validation and persistence](testing/server/routes.md)                                                                           | Node; `@nocobase/app-testing/server`                      |
| `client/`     | [Submit from a component with the real API client and translations](testing/client/page.md)                                                                   | jsdom; `@nocobase/app-testing/client`                     |
| `cli/`        | [Test file output, dry runs and failures](testing/cli/files.md), [run a database-backed command](testing/cli/command.md)                                      | Node; `@nocobase/app-testing/cli`                         |
| `playwright/` | [Sign in once and reuse the browser session](testing/playwright/login.md)                                                                                     | Browser; `@playwright/test` against a running application |

The directory names organize the examples and their suggested test files. They are not five package exports: database fixtures come from `/server`, and there is no `@nocobase/app-testing/database` or `@nocobase/app-testing/playwright` entry. Playwright tests use an actual application URL; the server fixture handles requests in process without opening a browser-accessible port.

The examples assume `@nocobase/app-testing`, Vitest and the selected database driver are installed at versions compatible with the application. The client example additionally uses the React Vitest preset, Testing Library and jsdom already configured by the official templates. Each example lists its additional prerequisites. Run the named file and confirm it appears in the test summary; a successful command with no tests found is not verification.

The examples use `tests/database/`, `tests/server/`, `tests/client/`, `tests/cli/` and `tests/playwright/`. An existing application may still use the `logic/` and `components/` layout below; follow its current conventions instead of moving unrelated tests. Directory names alone do not select a Vitest environment. Each complete Vitest example supplies a dedicated configuration that selects Node or jsdom and limits test discovery; use the matching `--config` when running it. When adopting the files into the regular suite, use the application's existing environment selection or Vitest projects and keep `tests/playwright/**` excluded from Vitest. Preserve existing aliases, setup files and test discovery.

### Fixture selection and ownership

| What the test exercises                                   | Helper                                                       | Isolation and cleanup                                                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Repositories and transactions without application startup | `createDatabaseTest()` from `/server`                        | `isolation: 'schema'` resets and migrates before each case; the fixture destroys connections and drops its databases |
| A migration's schema and rollback                         | `describeMigration()` from `/server`                         | Owns its database and checks apply → rollback → reapply; `up` assertions run twice                                   |
| Routes, providers, plugins and authentication             | `createAppTest()` from `/server`                             | Default `scope: 'file'` shares an application; `scope: 'test'` installs a fresh one per case; cleanup is automatic   |
| A manually started test application                       | `createTestApp()` from `/server`                             | The caller closes it in `finally` with `await testApp.close()`                                                       |
| Components using application services                     | `renderWithApp()` from `/client`                             | Call inside a test; client shutdown is automatic and the React preset cleans up the DOM                              |
| A command operating on files or flags                     | `bindAppCommand()` + `runAppCommand()` from `/cli`           | The test owns its temporary files; command output capture is process-wide                                            |
| A command opening the real application                    | `createTestAppConfig()` + `bindTestAppCommand()` from `/cli` | The caller disposes the configuration in `finally`; `withApp()` closes the command's application                     |

For database, server and database-backed CLI tests, `NOCOBASE_TEST_DB_DIALECT` selects the dialect; unset means SQLite. Provision every application-owned connection by listing it in `connections`. An omitted connection keeps the application's configuration. Keep provisioned connection locations intact; use test configuration overrides for auth, seeds or other settings. Pure repository tests take explicit migration and seed sources; application fixtures install the application's registered sources by default.

Run database and server suites sequentially. CLI stream capture and environment stubs are process-wide, so do not use concurrent command cases. Keep temporary storage under the fixture's ownership, and never clean up a shared development database or a running Vite cache.

### Run a complete example

After creating the files in the linked examples, run from the application root:

```bash
pnpm exec vitest run --config vitest.database.config.ts
pnpm exec vitest run --config vitest.server.config.ts
pnpm exec vitest run --config vitest.client.config.ts
pnpm exec vitest run --config vitest.cli.config.ts
```

Run these commands one at a time. With all four groups copied, expect five database tests (including the migration), five server tests, five client tests and eight CLI tests (six file-command cases and two database-backed cases). A copied subset has the corresponding smaller count. The sample configurations set `passWithNoTests: false`; when using an existing configuration, still confirm that the named files ran.

If startup fails, check the installed package exports, the selected driver, the fixture's migration sources and the application's registered plugins before replacing a real service with a mock. A missing collection in a repository test usually needs its migration sources; failed sign-in needs the configured test seed and trusted origin; a server `403` with a valid session needs the intended grants. Client translation failures need the real namespace and locale keys, and CLI JSON failures need assertions on `exitCode` and the JSON error envelope.

## Where tests go

```text
tests/logic/        Logic and integration tests
tests/components/   Component tests
tests/playwright/   Browser tests against a running application at APP_URL (Playwright; Vitest skips it)
```

**Never put a test beside the source it covers.** Name files `*.test.ts` or `*.test.tsx`.

`vitest.config.ts` discovers `tests/**/*.test.{ts,tsx}` automatically. Theme token tests compile the real CSS; browser checks still need to verify computed styles, typography, spacing and focus.

Templates ship their tests into generated applications. Keep them runnable from the application root after scaffolding: read application identity from `package.json`, resolve application paths relative to the test file, and import dependencies through their published package exports. Do not depend on a monorepo checkout, a fixed template directory name, or a particular pnpm store layout. Run the affected test files in the generated application as well as in the template when changing these contracts.

## What to test, by change

| You changed           | Test at least                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| A server route        | Anonymous → `401`, authenticated but unpermitted → `403`, permitted → expected payload; the route is declared in the API document       |
| A list or stats route | Its query count does not grow with the number of rows or groups: count the reads for a few rows and for many, and assert they are equal |
| A public webhook      | Missing signature, invalid signature, valid signature, duplicate delivery                                                               |
| A migration           | `up` produces the expected schema; `down` reverses it; against a real database                                                          |
| A seed                | First run, run against existing data, repeat run                                                                                        |
| A service             | Its domain behavior, with its dependencies supplied directly                                                                            |
| A job                 | `execute()` with a realistic payload; a second run is harmless; failures behave as intended                                             |
| Frontend code         | See [frontend tests](frontend/references/testing.md): pages, components, route declarations, copy                                       |

## Testing a route

Call the real contribution's `createRouter()` with a container holding test doubles, then issue real requests. This exercises the production factory, including its dependency resolution and middleware:

```ts
const container = new ServiceContainer();
container.instance(authenticationToken, testAuth);

const router = await apiRoutes.createRouter({
  appName: 'main',
  publicBasePath: '/main',
  config: { app: { name: 'main', publicBasePath: '/main' } },
  paths: createAppPaths({ rootDir: '/missing' }),
  router: new Hono(),
  container,
});

const response = await router.request('/orders');
expect(response.status).toBe(401);
```

Do not add a `registerRoutes(router, ...)` helper just to make a route testable. It moves the security boundary out of the thing you are testing.

## Testing through the whole application

To check a route's authentication and permission boundaries as a user meets them, start the application itself on test databases with `@nocobase/app-testing/server` and sign in through its own sign-in route with `@nocobase/app-plugin-authentication/testing`:

```ts
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { createAppTest } from '@nocobase/app-testing/server';
import { createStandaloneServer } from '../../server/standalone.ts';

const test = createAppTest({ createServer: createStandaloneServer });

test('lists orders for an administrator only', async ({ testApp, request }) => {
  expect((await request('/orders')).status).toBe(401);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  expect((await admin.fetch('/orders')).status).toBe(200);
});
```

The application starts as `pnpm start` starts it and installs its migrations and seeds on start; one application serves the test file. A user other than the administrator is one a seed of the application created, signed in the same way.

### The API document

The same started application proves that every route declares itself for the [API document](http-api.md#api-documentation):

```ts
import {
  apiDocsToken,
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
} from '@nocobase/app-server/router';

test('declares its routes in the API document', async ({ testApp }) => {
  expect(findUndeclaredApiRoutes(testApp.application)).toEqual([]);
  const document = await testApp.application.container
    .resolve(apiDocsToken)
    .getDocument();
  expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  const cancel = document.paths?.['/api/orders/{orderId}/cancel']?.post;
  expect(cancel?.operationId).toBe('cancelOrder');
  // 401, 403 and 500 from apiErrorResponses, 400 from its validators and its own precondition, and its 404.
  expect(Object.keys(cancel?.responses ?? {}).sort()).toEqual([
    '200',
    '400',
    '401',
    '403',
    '404',
    '500',
  ]);
});
```

The document lists only the statuses a route can return: a route without a permission check has no `403`, and one without `apiValidator()` and no other `400` of its own has no `400`. [HTTP API design](http-api.md#declaring-a-route) states the rule.

## Test databases

A test never chooses its database: it does not import a `@nocobase/db-<dialect>` package, configure `dialect: 'sqlite'` or `':memory:'`, or reach for SQL only one database understands, such as `PRAGMA` or `sqlite_master`. It gets its databases from `@nocobase/app-testing/server` — `createAppTest()` for the whole application, `createTestDatabase()` or `createDatabaseTest()` for a database alone — on the dialect `NOCOBASE_TEST_DB_DIALECT` names, and SQLite when it is unset, so `pnpm test` needs no server. Assert on the schema with `expectCollection()`, which compares Field and Collection names rather than physical ones.

## Testing the frontend

Component tests, the route test and translation checks are described in [frontend tests](frontend/references/testing.md), including a minimal component test that renders with the real i18n runtime from `@nocobase/i18n/testing`. Do not mock `@nocobase/i18n/client`: a mocked `t` hides misspelt keys and wrong namespaces.

## Testing migrations

Run against a real test database. A test that only imports the migration file proves nothing about the schema it produces. `describeMigration()` from `@nocobase/app-testing/server` applies the migrations before it, applies this one, rolls it back and applies it again, and checks after each step that metadata and tables agree and that rolling back restores every table as it was; its `up` and `down` callbacks verify the fields, indexes and constraints with `expectCollection()`.

## Keeping the suite fast and honest

These are habits, not rules to apply mechanically; when the suite gets slow, measure where the time goes first (building, migrating, waiting, starting servers) and fix the largest part.

- **Test at the cheapest layer that proves the behavior.** A browser test earns its cost for what only a real browser shows: a flow across pages, real input, history and focus. Loading, error and empty states, copy, and combinations of locale, theme or role belong in component or unit tests. When a browser test is removed, name the test that now covers it.
- **Migrate once, not per test.** A suite whose every test needs a freshly migrated database can pass `template: true` to `createTestDatabase()`: it migrates and seeds once and gives each test a copy. Re-running every migration per test is usually most of a slow server suite.
- **Do not wait for real time.** Make retry back-offs, sweep or poll intervals and cache lifetimes configurable and set them short in tests, or use fake timers (`vi.useFakeTimers()`, Playwright's `page.clock`). Hold a mocked response open until the step that needs it instead of adding a fixed delay, and never sleep to show that nothing happened.
- **Keep tests independent.** Give a test its own user rather than changing a shared account's language, theme or settings. Start a separate application only for a test that changes global settings, and stop it at once afterwards. Let background work and the connection pool settle before closing a test database.
- **Assert, do not collect evidence.** A test checks behavior; it does not save screenshots or report files or print logs. Screenshots meant for people to look at are a separate run outside routine CI, and still fail on page errors.
- **Do not check the same thing twice.** Do not copy the framework's or the template's own tests into the application, do not snapshot what a dedicated check already compares (the API document, generated references), and replace a large snapshot nobody reads with assertions on the few figures that matter.
- **Remove tests with what they cover, and do not guard absences.** When a feature, page, route or option goes away, delete or rewrite its tests in the same change instead of leaving them to test a stub. Do not add tests that prove something removed stays removed (a deleted route still answers 404, an old translation key never returns, a file no longer contains a string): they protect nothing anyone relies on and outlive their reason. The same goes for tests written as one-off evidence for a task, and for tests of a document's or a Skill's wording.
- **Test behavior, not implementation details.** Assert what a user or caller observes, not exact internal call counts, private helpers, timer values patched by delay or full copy that is not the subject of the change; such tests break on every refactor and catch nothing.
- **Match parallelism to the machine.** More workers than cores, or a server and browsers competing for the same cores, make each test slower rather than the suite faster.

## Before finishing

Scope every check to the changed behavior and its affected consumers. Select relevant checks rather than running a fixed full-application checklist after each edit:

| Check               | Scope                                                                                                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formatting and lint | Pass the changed files to Prettier or ESLint using the project's configuration; include other files only when shared formatting or lint configuration affects them                      |
| Type checking       | Use the smallest owning TypeScript project configuration that covers the change; preserve project references and compiler settings rather than passing individual source files to `tsc` |
| Tests               | Use `pnpm exec vitest run <affected-test-files>` with actual relevant paths; include integration or end-to-end tests for affected behavior across boundaries                            |
| Build               | Build affected packages or supported application targets when emitted output, bundling, or deployment behavior needs verification                                                       |
| Runtime             | Exercise only the affected workflows, including their authentication and permission boundaries when relevant                                                                            |

In a workspace, use `pnpm --filter <affected-package> <script>` for each affected package and affected consumer. For standalone applications, inspect available scripts and project configurations before selecting commands. Do not invent selectors that a command does not support. If a necessary check only supports a whole project or package, use that smallest supported scope and explain the limitation.

Expand scope only when shared code, dependencies, configuration, or a failure gives a concrete reason, or when the user explicitly requests it. Full-application verification is appropriate when the impact actually spans the application. Once checks pass, repeat them only after further relevant changes or to resolve failures. `pnpm check` combines full checks, so use it only when all of its work is warranted by the affected scope.

Add focused regression coverage when behavior changes. Documentation-only changes need formatting and link checks for the changed documents, not type checking, runtime tests, or builds.

Then verify the affected behavior, selecting only the applicable steps below. Green commands mean the code compiles and the assertions you wrote hold — not that the feature works:

- For a frontend change, verify as [the frontend workflow](frontend/ui-workflow.md) prescribes for the workflow it took: a quick change runs the static checks and the related tests and looks at the changed element once in the browser; a theme change runs the theme tests and its browser check; the full workflow ends with its acceptance review.
- Confirm the endpoint's responses for signed-out, unpermitted, and permitted callers.
- Confirm `pnpm nocobase db apply` applies cleanly.

When a change is about performance, or adds a list, a statistic or a frequently called endpoint, measure it in a realistic environment: the database the application is actually deployed on, with a realistic data volume. A small data set hides slow queries and missing indexes, and SQLite's costs differ from those of a database server, so a timing on one says little about another. After release, consider each endpoint's call count multiplied by its duration rather than a single measurement: a cheap endpoint called constantly can cost more than a slow one called rarely.

## Reporting

Say what you ran, what passed, and what you did not run. If you could not verify something — no test database, a flow needing real credentials — say so rather than implying it was checked.

## Strict startup verification

Set `NOCOBASE_STRICT_STARTUP=true` when running `pnpm dev` or `pnpm start` in automated verification. Startup failures exit nonzero after resource cleanup. Strict dev runs the server without watch mode so a failed server cannot remain hidden behind a watcher; restart the command after server or configuration changes. Client HMR remains available. Omit the variable or set it to `false` for normal development with server hot reload. Request errors and individual job execution failures do not terminate the application.

In application tests that start jobs or queues, keep their memory state files out of the working tree: `createAppTest()` and `createTestApp()` put the application's storage in a temporary directory, and a test that starts the application another way selects a `jobs` or `queue` configuration key whose `persistence.path` is a temporary directory.

## Vite cache isolation

Every auxiliary Vite server started by a test or auxiliary tool must use its own temporary `cacheDir` and remove it after closing the server. A fixture that symlinks the application's `node_modules` also shares its default `.vite` directory. `optimizeDeps.noDiscovery` and an empty `include` are not isolation: plugins can add optimizer entries. Overwriting the live server's dependency files leaves its in-memory module URLs pointing at missing chunks and breaks lazy pages until restart.

Do not delete or rebuild a running development server's cache. For an already corrupted cache, stop all processes using that application cache before rebuilding it, then reload the browser with its cache disabled if stale dependency responses remain. A separate Vitest configuration does not isolate Vite instances created inside tests or child commands.

## Environment changes during development

`pnpm dev` watches `.env` and `.env.local` with stat polling, including creation, atomic saves, and deletion. Changes stop the current development run before starting a fresh one, so both Vite and the server receive updated ports, base paths, proxy settings, and environment values. Shell variables retain precedence. Use the new ready URL after an address change. Proxy mode restarts Vite; `config.yml` changes restart only the local server. Strict startup disables automatic environment restarts as well as server watching. Never restart with the previous child's resolved environment: deleted dotenv keys would persist.

## Shared application tooling

`@nocobase/app-cli` implements the application's scripts and commands: `pnpm dev`, `pnpm build` and `pnpm start` run `nocobase dev`, `nocobase build` and `nocobase start`, and every standard command is `pnpm nocobase <topic> <command>`. In the source repository, run shared implementation tests in `packages/app/app-cli` and application composition tests in each affected template. Keep tests for the application's own commands in the application. A generated application consumes the compiled package; do not edit installed package files to customize behavior.

Application server source supports extensionless relative imports. Keep `module: "ESNext"`, `moduleResolution: "Bundler"`, and `tsc-alias.resolveFullPaths: true` in `tsconfig.server.json`. Development uses `tsx`; production builds run `tsc-alias` after `tsc` to complete ESM paths, before build hooks run. When changing this configuration, verify the compiled output with plain Node and no source files or TypeScript loader.

Vite configuration imports the proxy helpers from `@nocobase/app-cli/dev/proxy`. Watcher, proxy, supervisor and build-step unit tests live in `app-cli`; templates verify their composition and Vite integration.
