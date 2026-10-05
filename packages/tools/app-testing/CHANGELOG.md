# @nocobase/app-testing

## 0.1.0-beta.1

### Patch Changes

- e123790: Move `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-users`, `@nocobase/app-plugin-hub`, `@nocobase/app-plugin-workflow` and `@nocobase/app-plugin-ai-employee` to the 2.0.0 prerelease line. The HTTP API migration released in 1.0.0-beta.N changed every route and the error body, but in prerelease mode a `major` changeset on a version that is already a `1.0.0` prerelease only increments the prerelease number, so nothing in the version said the change was breaking. These packages now release as `2.0.0-beta.0`, and every package that depends on or peers with one of them is released again so that its published range is `^2.0.0-beta.0` rather than a `^1.0.0-beta` range the new versions do not satisfy. An application upgrading to these versions upgrades all of them together.
- Updated dependencies [e123790]
  - @nocobase/app-client@2.0.0-beta.0
  - @nocobase/app-server@2.0.0-beta.0
  - @nocobase/app-cli@1.0.0-beta.13

## 0.1.0-beta.0

### Minor Changes

- 299b35a: `@nocobase/app-testing/client` renders a page inside a started client application with `renderWithApp(ui, { plugins, namespace, route, server | fetch })`. The page reads the real `useApiClient()`, `useService()`, `useToaster()` and `useTranslation()` instead of mocks of `@nocobase/app-client`: the application registers the plugins' services and strict translations, mounts its React providers and Refine under a `MemoryRouter`, writes the client configuration into the document so `resolveAppUrl()` resolves under the server's mount path, and sends API requests to a server in process — an application from `createTestApp()`, with a session `cookie` from `signIn()` — or to the test's `fetch`, which `answerApi(handler)` builds from a function of `{ method, path, query, json }` that returns the response body. `services` registers stand-ins before the plugins start, toasts render as plain text and are listed by `toasts()`, and the application shuts down when the test finishes. The entry loads nothing from `@nocobase/db-testing`, so it runs under jsdom; `@nocobase/app-client`, `@nocobase/i18n`, `@nocobase/service-provider`, `react`, `react-router` and `@testing-library/react` are optional peers.
- 463a7a8: A new package of test fixtures for NocoBase applications and plugins. `createTestApp({ createServer })` from `@nocobase/app-testing/server` starts an application through its own standalone server — its own runtime, providers and plugins — on isolated test databases of its own, on the dialect `NOCOBASE_TEST_DB_DIALECT` selects and SQLite otherwise. It provisions one database per connection named, writes the configuration file that points the application at them, lets the application install its and its plugins' migrations and seeds on start unless `install: false`, keeps its storage in a temporary directory, and drops everything again on `close()`. `createAppTest()` is the Vitest fixture around it, one application per test file by default. `createTestAppConfig()` writes that configuration alone, and `./server` also carries everything `@nocobase/db-testing` exports. `@nocobase/app-testing/cli` carries `@nocobase/app-cli/testing` and `bindTestAppCommand()`, which runs a command that opens the application against the databases a test configuration names. The application runtime packages are optional peers, and the dialect packages follow `@nocobase/db-testing`'s rules.

### Patch Changes

- Updated dependencies [21d274c]
- Updated dependencies [21d274c]
- Updated dependencies [463a7a8]
- Updated dependencies [299b35a]
- Updated dependencies [463a7a8]
- Updated dependencies [21d274c]
- Updated dependencies [e44f49c]
- Updated dependencies [7f9450e]
- Updated dependencies [4403687]
- Updated dependencies [be0fbbd]
- Updated dependencies [463a7a8]
- Updated dependencies [be0fbbd]
- Updated dependencies [4403687]
- Updated dependencies [be0fbbd]
- Updated dependencies [7dbc54b]
- Updated dependencies [27f09bd]
- Updated dependencies [463a7a8]
- Updated dependencies [be0fbbd]
- Updated dependencies [4403687]
- Updated dependencies [be0fbbd]
- Updated dependencies [463a7a8]
- Updated dependencies [7dbc54b]
- Updated dependencies [be0fbbd]
- Updated dependencies [3f01f61]
- Updated dependencies [21d274c]
- Updated dependencies [0b933b3]
- Updated dependencies [21d274c]
  - @nocobase/app-server@1.0.0-beta.33
  - @nocobase/app-cli@1.0.0-beta.12
  - @nocobase/app-client@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.17
  - @nocobase/db-mysql@0.1.0-beta.3
  - @nocobase/db-sqlite@0.1.0-beta.4
  - @nocobase/db-testing@0.1.0-beta.0
  - @nocobase/db-postgres@0.1.0-beta.3
  - @nocobase/db-kingbase@0.1.0-beta.3
  - @nocobase/db-oceanbase@0.1.0-beta.2
  - @nocobase/db-mssql@0.1.0-beta.2
  - @nocobase/db-oracle@0.1.0-beta.3
  - @nocobase/db-dameng@0.1.0-beta.3
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 0.0.1

Initial version.
