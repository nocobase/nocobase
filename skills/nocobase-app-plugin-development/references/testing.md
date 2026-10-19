# Testing and Delivery

Use this reference to select checks for the changed behavior and its target App integration. Plugin tests belong in the plugin-root `tests/` directory and use `*.test.ts` or `*.test.tsx`; they must stay out of published build output.

## Use app-testing in a plugin

Declare `@nocobase/app-testing` in the plugin's `devDependencies`. Import fixtures through its `/server`, `/client` or `/cli` entry instead of importing `@nocobase/db-testing` or `@nocobase/app-cli/testing` directly. Declare the runtime peers and test libraries the selected entry needs, following `packages/tools/app-testing/README.md` and the generated plugin manifest. Database is a test directory, not an `/database` package export; browser tests use `@playwright/test`, not an `/playwright` export.

| Directory | Environment and entry | Use it for |
| --- | --- | --- |
| `tests/database/` | Node, `@nocobase/app-testing/server` | `describeMigration()` for apply/rollback/reapply; `createDatabaseTest()` for repository and seed behavior |
| `tests/server/` | Node, `@nocobase/app-testing/server` | `createAppTest()` or `createTestApp()` for real plugin registration, routes, authentication and permissions |
| `tests/client/` | jsdom, `@nocobase/app-testing/client` | `renderWithApp()` and `answerApi()` for components using the real client runtime, services and translations |
| `tests/cli/` | Node, `@nocobase/app-testing/cli` | `bindAppCommand()` and `runAppCommand()` for command behavior; `bindTestAppCommand()` for commands that open a database-backed App |
| Target App's `tests/playwright/` | Browser, `@playwright/test` | Plugin integration across pages, real navigation, focus and browser-only behavior |

Keep fixtures in `tests/fixtures/` and shared helpers in `tests/helpers/`. Retain an older package's established layout until migrating it deliberately. A plugin is not a standalone App: an integration test needs a fixture App or target App that explicitly registers the plugin in the runtime under test. Installing the package or importing its declaration does not register it.

### Select the Vitest environment

Keep the scaffold's `vitest.config.ts` projects: `createNodeVitestConfig()` runs Server, database, CLI and project tests under Node; `createReactVitestConfig()` runs `tests/client/**/*.test.{ts,tsx}` under jsdom with DOM cleanup. The maintained configuration is `packages/tools/create-plugin/template/vitest.config.template.ts`. Exclude browser tests from Vitest if the package also owns them. Do not import `/server` into a jsdom suite merely to obtain a database fixture.

Run a focused file from the repository root, replacing the package and path with the ones under test:

```bash
pnpm --filter <plugin-package> exec vitest run tests/database/migrations.test.ts --project node --no-file-parallelism
pnpm --filter <plugin-package> exec vitest run tests/server/routes.test.ts --project node --no-file-parallelism
pnpm --filter <plugin-package> exec vitest run tests/client/page.test.tsx --project client
pnpm --filter <plugin-package> exec vitest run tests/cli/greet.test.ts --project node --no-file-parallelism
```

These selectors assume the scaffold's `node` and `client` project names; inspect an existing package's configuration first. Run database and Server suites one at a time. CLI output capture and environment stubs affect the process, so keep command cases sequential. Client files can use normal file parallelism, but cases sharing one DOM must not run concurrently. Confirm the named tests ran even when an existing scaffold allows an empty suite.

### Own the fixture and register the real plugin

- **Database:** give `createDatabaseTest({ migrations })` the plugin's migration sources and any prerequisite sources. Let `NOCOBASE_TEST_DB_DIALECT` select the driver; do not construct a SQLite-only connection in a plugin test. Use `expectCollection()` for schema assertions and the real Repository for constraints and transactions. The [migration example](database.md#test-a-migration-against-a-real-database) applies, rolls back and reapplies the production migration.
- **Server:** keep a small fixture App in `tests/fixtures/app/` with a real `createStandaloneServer` factory, explicit Server plugin registration and configuration loading through `context.configPath ?? context.environment.APP_CONFIG_FILE`. Pass that factory to `createAppTest({ createServer: createStandaloneServer })`. Startup discovers the registered plugin's migrations and seeds. File scope is the default and shares data between cases; use distinct records or `scope: 'test'` when a case needs a fresh App. The fixture closes automatically; a direct `createTestApp()` call needs `await app.close()` in `finally`.
- **Authentication:** register the required authentication and authorization plugins in that fixture, seed test users and grants, and call `signIn()` from `@nocobase/app-plugin-authentication/testing`. Check anonymous, signed-in-but-denied and allowed requests through the App. A permitted administrator alone does not prove the denied path.
- **Client:** pass the production Client plugin in `plugins`, its package name in `namespace`, and a supported `locale` to `renderWithApp()`. This exercises its actual providers and locale loaders. Use `namespaces` and `services` for a focused component fixture when full registration is not the subject; do not also register a plugin whose service the fixture replaces. The [Client example](client-examples.md#behavior-test-for-redirect-query-and-access-fallback) shows this distinction. Each render owns a client App that shuts down after the test.
- **CLI:** use the production command class and its plugin-topic command ID. For commands that open an App, use a fixture root with Server registration, load the generated test configuration and bind it with `bindTestAppCommand()`. Provision only connections owned by the test. Preparing migration sources for the test database and registering the plugin with the App are separate steps; a command may need both. Dispose `createTestAppConfig()` in `finally`, and keep file-writing commands in a temporary fixture root. See the [command example](cli.md#test).

For a client request test, match the HTTP method and API-relative path explicitly in `answerApi()`, return a non-success `Response` for unexpected endpoints, and assert on the recorded request outside the handler. The handler converts thrown errors, including failed assertions, into HTTP 500 responses. Check the payload and duplicate submissions when they are part of the component's behavior. Cover translated success and failure, and hold a response with `Promise.withResolvers<Response>()` to check loading and retry state without timers; release it inside `act()` in `finally`. Keep user interactions outside `waitFor()`.

Browser checks belong to a running target App that registers the plugin. Use its verified application entry URL and the App's existing Playwright setup; a jsdom `MemoryRouter` test does not prove browser reload or the host's route authorization. Authentication state belongs to a test user and must stay out of committed files.

### Find complete examples in the workspace

Start with the self-contained [complete plugin example](testing-example.md) for one plugin spanning a migration, service, configuration factory, protected API, translated Client component and CLI command. Its source and fixture App travel with this Skill under `assets/testing-example/`; the accompanying verifier runs lint, typecheck and both test environments against an installed NocoBase 3 application's dependencies.

The application Skill's complete examples live under `packages/app/app-skills/skills/nocobase-app-development/references/testing/`: `database/repository.md`, `database/migration.md`, `server/routes.md`, `client/page.md`, `cli/command.md`, `cli/files.md` and `playwright/login.md`. Read them from the source workspace when a complete fixture is needed. Adapt application-owned imports to the production plugin and explicitly register it in the fixture; do not copy an application composition unchanged and assume it includes the plugin. Those paths are repository lookup locations, not relative dependencies of this globally distributed Skill.

Maintained executable fixtures also live in `packages/tools/app-testing/tests/`, with its minimal App in `tests/fixtures/app/`, and scaffold tests in `packages/tools/create-plugin/template/tests/`. Inspect the current exports and fixture configuration before borrowing code; keep tests focused on the plugin's behavior rather than copying the harness's own tests.

## Select observable checks

| Changed surface           | Verify                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Client descriptor/options | Resolved contribution entries, option propagation, intentional defaults                                                   |
| Routes and Tabs           | Paths, parents, navigation/access, actual lazy loaders, direct URLs, reload, history, parent redirect, query preservation |
| Components                | Props, interactions, accessibility, public exports, target App rendering and themes                                       |
| React Providers           | Context values, composition order, cleanup, App-owned consumers                                                           |
| Client ServiceProviders   | Service registration, options, lifecycle, startup failure and reverse cleanup                                             |
| Server Services/Providers | Original Token, lazy singleton behavior, lifecycle, failure cleanup                                                       |
| HTTP contributions        | Production router requests, validation, status/body, authentication, allowed and denied authorization paths, and every route declared in the API document (`findUndeclaredApiRoutes`, `findApiDocumentSchemaProblems`) |
| Migration/Seed            | Real database schema and metadata, `up`, reversible `down`, required records and repeat behavior                          |
| Jobs                      | Registration before setup, execution, payload, service effects, retry/idempotency, interrupted shutdown                    |
| Queues                    | Handler execution, message, service effects, failures, retry/idempotency, unregister on shutdown                          |
| Locales                   | Key shape, namespaces, two-language rendering, request/recipient locale selection, lazy chunks                            |
| Registry                  | Config/build, copied source, App typecheck/test/build and actual integration                                              |
| CLI                       | Registration, command IDs, flags, errors, target App help/command execution                                               |
| Plugin Skills             | Valid structure, source/sync ownership, actual integration outcome                                                        |
| Exports/publishing        | Source and dist exports, consumer-resolvable declarations, tarball resources                                              |

Test actual behavior rather than only module existence or generated strings. Do not add tests for prose wording or low-impact formatting changes. Use existing focused tests and package scripts appropriate to the change.

Concrete starting points are the [production router tests](server-route-examples.md), [ServiceToken and lifecycle tests](service-examples.md), [Client behavior examples](client-examples.md), [Repository HTTP test](repository-examples.md), and [migration test](database.md#test-a-migration-against-a-real-database). Read each example's fixture and file prerequisites rather than assuming a helper is part of a public runtime API.

## Server and database verification

Use an isolated `ServiceContainer` to verify the owner-created Token and lifecycle. Test simple HTTP endpoints by calling the production contribution's `createRouter()` with test services and sending actual requests. Do not introduce `registerXxxRoutes(router, ...)` only to make tests possible. For a coherent complex child router, test both its `createXxxRoutes(options): Hono` behavior and the production contribution's Token resolution, middleware, and mounting.

App integration tests verify `/api` or Root mounting, public base paths, interactions between contributions, real login, and permissions. Every protected Route needs anonymous, authenticated-but-denied, and authorized cases as applicable; a public callback needs tests for its specific signature or protocol boundary. `plugin inspect` output is not security evidence.

Run migrations against a real test database, verifying both physical schema and metadata. Execute `down` when reversible. Seeds run against the schema migrations establish; test existing records and the declared repetition policy. Job and queue tests run the real Provider against a jobs or queue service whose memory state lives in a temporary directory, submit or publish, and observe the effects. See [Server development](server.md) and [database resources](database.md) for examples and contracts.

## UI and locale verification

Call actual component loaders and render public components through their supported imports. For routed Tabs, cover a direct child URL, reload, back/forward navigation, the parent redirect, denied children, and preserved queries. A page calling a Server endpoint needs a real page-to-API workflow in the target App.

For UI work, verify shadcn interaction and keyboard behavior, the shared theme in light/dark modes, and loading, empty, error, and success states. An App alias resolving in one development environment does not prove compiled plugin imports resolve for an installed consumer.

Use `en-US` as the locale key-shape source, run the relevant `i18n:check`/strict check, and render at least two supported languages. Public components must also work outside their plugin's render subtree. Server request tests cover session/header/default locale resolution and stable `code/ns/key/params` plus translated messages. Jobs, mail, and notifications must load resources before obtaining a fixed translator for a non-default recipient locale. Ensure emitted locale chunks are present in the build and tarball. See [internationalization](i18n.md).

## Registry and Skill verification

Build Registry items and install/materialize them into a temporary or intended App within the task's scope. Check copied paths, source extensions, dependencies, public imports, typecheck, tests, build, and rendered behavior. The App copy is not the plugin's canonical source, and a snapshot does not establish an upgrade merge strategy.

Check Plugin Skill frontmatter, ownership prefixes, absence of drafts, publication through `files`, and synchronization replacement/removal/conflict behavior. Then review every claimed public API, prerequisite, permission, and verification step against the implementation. File equality only proves synchronization; the target App must demonstrate the integration the Skill promises. The Skills example (`packages/examples/app-plugin-skills-example`) shows a public component consumer and actual App HTTP verification.

## Keep tests lean

These are habits rather than mechanical rules. When a suite gets slow, measure where the time goes (building, migrating, waiting, starting servers) and fix the largest part first.

- **Test at the cheapest layer that proves the behavior.** Browser tests are for what only a real browser shows, such as a flow across pages, real input, history and focus. States, copy and combinations of locale, theme or role belong in component or unit tests, and a server contract in a route or service test.
- **Do not repeat expensive setup per test.** Migrate a test database once per suite where the test tooling allows it, and start a whole App only for tests that need one.
- **Do not wait for real time.** Make back-offs, poll and sweep intervals and cache lifetimes configurable and set them short in tests, or use fake timers. Never sleep to show that something did not happen.
- **Keep tests independent.** Use a test's own user and data rather than changing shared fixtures or global settings, and let background work settle before closing a database.
- **Remove tests with what they cover, and do not guard absences.** When a feature, route, option or export goes away, delete or rewrite its tests in the same change. Do not add tests that prove something removed stays removed, such as a deleted route answering 404 or an old key never returning. Do not keep one-off evidence tests written for a task, and do not test the wording of README, Skill or other documentation files.
- **Test behavior, not implementation details.** Assert what a user or caller observes, not internal call counts, private helpers, patched timer values or copy that is not the subject of the change.
- **Do not check the same thing twice.** Do not duplicate what a dedicated check already compares, such as the API document or generated references, and replace a large snapshot nobody reads with assertions on the figures that matter.

## Run scoped package and consumer checks

For modified plugin code, run:

```bash
pnpm --filter <plugin-package> lint
pnpm --filter <plugin-package> typecheck
pnpm --filter <plugin-package> test
pnpm --filter <plugin-package> build
```

Run the relevant target App and affected consumers' checks, including lint for modified consumer code:

```bash
pnpm --filter <target-app> typecheck
pnpm --filter <target-app> test
pnpm --filter <target-app> build
```

Keep checks scoped; workspace-wide tests are not a routine substitute for identifying consumers. Widen validation when public types, shared configuration, runtime contracts, or generated applications are affected. Use the repository's database integration Skill if changes also touch `packages/libs/db*`.

After exports or packaging changes, inspect source/publish mappings, emitted `.d.ts`, locale chunks, migration/seed manifests, and tarball contents. Runtime libraries ship compiled resources without source directories shadowing them. Read a workspace package's version from its manifest in tests; never assert its current version as a literal. Follow repository changeset and publish-validation rules before a PR/push.

`plugin inspect` is an optional diagnostic after registration changes, not a fixed validation phase. Use it as [registration](registration.md) describes; `consistent: true` means the observed static composition has no reported conflict, not that implementation or runtime behavior is correct.

## Completion evidence

Deliver the requested behavior from the correct owning plugin, remove unused scaffold examples, align declarations/exports/dependencies, and verify the intended target App registration. Update App-facing Skills when public integration changes. Report checks run and their results, actual runtime verification, skipped checks, and unresolved limitations. A successful scaffold or registration command alone is not a completed feature.
