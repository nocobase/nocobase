# Tests and Validation

Read this before writing or moving a test, writing a test that needs a database, asserting on a version, or deciding what to run after a change.

### Test Layout

Tests live in a `tests/` directory at the package root, never beside the source files they cover. A package with nested source roots puts `tests/` at the root of that source tree, as `packages/plugins/app-plugin-authentication/server/tests` does.

A plugin, an example or an application template groups its tests by the source directory they cover, and its `vitest.config.ts` picks the environment by directory through Vitest `projects`, so a test needs no `// @vitest-environment` line and one placed in the wrong directory fails in the wrong environment rather than passing by accident:

| Directory                           | What goes there                                                               | Environment |
| ----------------------------------- | ----------------------------------------------------------------------------- | ----------- |
| `tests/client/`                     | Pages, components, client services and runtime logic                          | jsdom       |
| `tests/server/`                     | Services, repositories, route declarations, permission boundaries             | Node        |
| `tests/database/`                   | `describeMigration()` and seed tests                                          | Node        |
| `tests/cli/`                        | Commands the package contributes                                              | Node        |
| `tests/project/`                    | Files at the package root and the build: `package.json`, tsconfigs, artifacts | Node        |
| `tests/fixtures/`, `tests/helpers/` | Test data, fixture applications and shared helpers, never a `*.test.ts`       | —           |
| `tests/setup/` (applications only)  | `setupFiles`                                                                  | —           |
| `tests/playwright/` (templates)     | Playwright tests against a running application; Vitest excludes it            | Browser     |

`packages/tools/app-testing/vitest.config.ts` is the configuration shape, and `pnpm plugin:create` generates it. A package without client code keeps the Node project alone and adds the jsdom one with its first client test. Packages that predate this layout, the application templates among them, move to it as they are worked on; until a package has moved, a new test follows the layout it already has. Libraries and tools are not bound to it: their subdirectories reflect whatever the package needs, such as `tests/unit` and `tests/integration` in `packages/libs/db`.

Name test files `*.test.ts` or `*.test.tsx`. Vitest discovers them by filename rather than by directory, so a test placed outside `tests/` still runs and will not fail loudly; keeping the layout consistent is a convention the tooling does not enforce for you.

Test files stay out of the build. Keep `include` in the package `tsconfig.json` pointed at `src` so `tests/` is excluded from the emitted output, unless the package deliberately typechecks its tests the way `packages/libs/db` does.

### Database Tests Do Not Choose a Dialect

A test outside the `@nocobase/db` packages that needs a database gets it from `@nocobase/db-testing` rather than configuring one: `createDatabaseTest()` gives each test migrated databases on the dialect `NOCOBASE_TEST_DB_DIALECT` names, SQLite when it is unset, and `describeMigration()` is the migration test described under "Database Migration Development". Such a test does not import a `@nocobase/db-<dialect>` package, does not configure `dialect: 'sqlite'` or `':memory:'`, and does not reach for SQL that only one database understands — `PRAGMA`, `sqlite_master`, triggers. Assert on the schema with `expectCollection()`, which compares Field and Collection names rather than physical ones, and prepare rows through a Repository or `connection.query`. `packages/libs/db-testing/README.md` lists what to write instead of each SQLite-specific form.

A plugin, an example or an application template takes all of this from `@nocobase/app-testing` instead, and depends on it alone: `./server` re-exports `@nocobase/db-testing/vitest` and adds `createTestApp()` and `createAppTest()`, which start the whole application on test databases of its own, `./cli` re-exports `@nocobase/app-cli/testing`, and `./client` renders a page inside a started client application with `renderWithApp()`, so a page test reads the real API client, services and strict translations of the plugins it passes in `plugins`, with a test toaster whose messages `toasts()` lists, instead of a `vi.mock('@nocobase/app-client')`. `@nocobase/app-plugin-authentication/testing` signs in through such an application, so a route's permission boundary is tested as a user meets it. Libraries, tools and the application runtime packages keep using `@nocobase/db-testing` and `@nocobase/app-cli/testing` directly, because `@nocobase/app-testing` is built on them. One entry keeps one copy of `@nocobase/db-testing` per package, whose provisioner cache and stale-database cleanup exist once per copy, and leaves a single package to name when an application's tests change.

The default run stays on SQLite so `pnpm test` needs no server, which is exactly why a test that only works on SQLite goes unnoticed: nothing fails until someone selects another dialect. A test whose subject is SQLite itself — the SQLite driver, or configuration that names it — is the exception and stays where it is, declaring so in its first lines with `// db-test-portability: sqlite-only — <why>` (or `dialect-specific` for one about every dialect's configuration). `pnpm db-tests:check` (`scripts/check-db-test-portability.mjs`, part of `pnpm check` and CI) reads every test and test helper outside the database packages and fails on a dialect import, the SQLite driver, `':memory:'`, `dialect: 'sqlite'`, `PRAGMA`, `sqlite_master` or a trigger without that marker, and in a plugin, an example or a template it also fails on an import of `@nocobase/db-testing` or `@nocobase/app-cli/testing`, which no marker exempts. A template's tests ship to the applications it generates and carry no note about this repository's checks, so the few whose subject is SQLite are listed in the script's `EXEMPT` instead; the check fails once a listed file or a marker no longer covers a violation, so every exemption only shrinks.

### Never Assert a Package's Own Version as a Literal

A test must not spell out the version of a package in this repository. Read it from the manifest instead:

```ts
import packageMetadata from '../package.json' with { type: 'json' };

expect(service.getInfo()).toMatchObject({ version: packageMetadata.version });
```

The release workflow runs `changeset version` and then runs the tests, so every published package is on a version different from the one committed by the time the suite executes. A literal that matches today fails during the next release, and it fails after the version bump — the point where the branch has already been rewritten and the run has to be repaired before anything can ship. `@nocobase/app-plugin-system-info` broke a release exactly this way, asserting `'0.0.1'` against a package `changeset version` had just moved to `0.1.0-beta.0`. Use the manifest import shown above, or resolve the dependency’s `package.json` through `createRequire`, rather than repeating its version.

This applies to the version of any workspace package, whether the test owns it or depends on it. It does not apply to a version a test makes up for a fixture it writes itself — `version: '1.0.0'` in a synthetic `package.json` describes nothing real and never drifts.

The same reasoning covers anything else a release rewrites. Assert against the manifest, not against a copy of what it currently says.

### Validation

Run `lint`, `typecheck`, `test`, and `build` for the packages you modified, and for the packages that consume what you changed. Scope the run to those with `pnpm --filter <package>`; a workspace-wide `pnpm -r test` takes minutes and is CI's job, not a routine step after an edit.

Widening the scope is worth it when a change reaches further than the package it lives in: an exported type or signature, a shared configuration preset, or anything a generated application depends on. Judge that from the change itself rather than running everything by reflex.

Root `pnpm check` also performs incremental formatting and publish-ready tarball checks. The Husky + lint-staged pre-commit hook fixes staged files automatically, but it does not replace CI.

The executable source of `@nocobase/dev-config` is TypeScript, while its npm
exports resolve to compiled ESM JavaScript and declarations in `dist`. When
changing `packages/tools/dev-config`, run
`pnpm --filter @nocobase/dev-config check`; do not hand-edit generated output.
