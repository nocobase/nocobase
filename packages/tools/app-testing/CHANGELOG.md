# @nocobase/app-testing

## 0.1.0-beta.2

### Patch Changes

- c796cb9: Remove NocoBase Hub. `@nocobase/app-plugin-hub`, `@nocobase/app-template-hub` and `@nocobase/hub-cli` are no longer published, and every package that offered or described the Hub drops it.

  Breaking for `@nocobase/app-installer`: it installs, upgrades and rolls back from a deployment archive only. `install --template`, `install --keep-source`, `upgrade --to`, `upgrade --rebuild`, `upgrade --keep-source` and `status --offline` are removed, as are the `latest` and `updateAvailable` members of the `status` result and the `rebuilt` and `notes` members of the `upgrade` result. An installation an earlier version built from the published Hub template is refused with `STATE_UNSUPPORTED`; manage it with the app-installer version that installed it. The error codes that only a template build reported (`PNPM_MISSING`, `PNPM_UNSUPPORTED`, `REGISTRY_UNREACHABLE`, `VERSION_NOT_FOUND`, `DISK_LOW`, `CREATE_FAILED`, `DRIVER_INSTALL_FAILED` and `BUILD_FAILED`) are no longer produced, and pm2 always kills the process tree of an application it stops.

  Breaking for `@nocobase/create-app`: `--template hub` is no longer a template name, and a generated application no longer gets a `.env`.

  The Default template no longer depends on `@nocobase/hub-cli`, so an application generated from it has no `pnpm nocobase hub` commands. An application upgraded from an earlier version that published to a Hub removes the dependency with `pnpm nocobase package remove @nocobase/hub-cli` and deletes `.nocobase/hub.json`; the `nocobase-app-upgrade` Skill describes the steps. The application Skills, the plugins' documentation and the in-app test notification text no longer mention the Hub.

- c796cb9: Remove the Settings and Dev route surfaces. `@nocobase/app-client` no longer exports `defineSettingsRoutes()`, `defineDevRoutes()`, `isAppClientSettingsRouteGroup()`, `isAppClientDevRouteGroup()` or their definition, contribution and registered-route types, and the resolved runtime no longer carries `settingsRouteTree`, `devRouteTree`, `settings`, `settingGroups`, `devRoutes` or `devRouteGroups`. `AppClientSettingsRouteNavigation` is renamed `AppClientRouteNavigation` and `AppClientSettingIcon` is renamed `AppClientRouteIcon`. A contribution to any parent other than `app` now fails registration with a message that names `defineAppRoutes()`. Plugins contribute no settings or dev pages; an application that wants a configuration page declares it with `defineAppRoutes()` in its own navigation, for example under a Settings group.

  The default and examples templates drop the settings layout, the `/settings/*` route, the dev route plumbing, and the Settings and Inbox buttons in the header; the `/inbox` page and the inbox block stay. The examples template no longer registers `@nocobase/app-plugin-departments-example`, which is removed. Upgrading an application means removing `defineSettingsRoutes([])` from `client/routes.ts`, the `settingsRouteTree` and `devRouteTree` props passed to `AppRouter`, and any settings layout it kept, and moving its own settings pages to `defineAppRoutes()`. Every package that depends on or peers with `@nocobase/app-client` is released again so that its published range accepts `3.0.0-beta.0`.

- Updated dependencies [c796cb9]
- Updated dependencies [c796cb9]
- Updated dependencies [c796cb9]
- Updated dependencies [98e79a5]
- Updated dependencies [fb7b576]
  - @nocobase/app-cli@1.0.0-beta.17
  - @nocobase/app-server@2.0.0-beta.3
  - @nocobase/app-client@3.0.0-beta.0
  - @nocobase/i18n@1.0.0-beta.6
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/db-dameng@0.1.0-beta.3
  - @nocobase/db-kingbase@0.1.0-beta.3
  - @nocobase/db-mssql@0.1.0-beta.3
  - @nocobase/db-mysql@0.1.0-beta.4
  - @nocobase/db-oceanbase@0.1.0-beta.3
  - @nocobase/db-oracle@0.1.0-beta.3
  - @nocobase/db-postgres@0.1.0-beta.3
  - @nocobase/db-sqlite@0.1.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

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
