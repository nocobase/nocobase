# @nocobase/app-plugin-releases

## 0.1.0-beta.15

### Patch Changes

- 2b8a30e: Retain generated first administrator credentials until they are manually dismissed or the app is removed.
- Updated dependencies [b6934ad]
- Updated dependencies [d3f0c92]
- Updated dependencies [a0b4568]
- Updated dependencies [12b1f64]
- Updated dependencies [b6934ad]
- Updated dependencies [5ce4a7c]
- Updated dependencies [b6934ad]
- Updated dependencies [171f7fb]
  - @nocobase/app-plugin-authentication@2.0.0-beta.16
  - @nocobase/app-client@4.0.0-beta.5
  - @nocobase/app-server@3.0.0-beta.5
  - @nocobase/db@1.0.0-beta.24

## 0.1.0-beta.14

### Minor Changes

- 07b14c0: Allow applications to initialize their own App-linked records atomically during App creation.

  Environments have a `purpose`, `preview` or `test`, chosen when one is created and editable later; the migration `202611020001_rel_environment_purpose` sets it for existing environments, `preview` for those holding pull request preview Apps (`previewOf`). The environments list and an environment's page show it, and `EnvironmentsSettings` takes an optional `title` and `description`.

- 07b14c0: The environments list answers each environment's `appCount`, and the Environments page shows it in an Apps column.
- 07b14c0: Download an archive release's `.tar.gz` with `GET /api/releases/apps/:appId/releases/:releaseId/archive` (`release download`), and read several Apps' summaries in one batched read with `releases.summarizeApps(appIds)`.

### Patch Changes

- 07b14c0: Downloading a release whose archive is missing from the artifact storage answers `404` with reason `RELEASE_ARCHIVE_NOT_FOUND` before any response headers are sent, instead of failing the stream mid-response. `EnvironmentsSettings` takes any `ReactNode` as its `title` and `description`.
- Updated dependencies [451bf75]
- Updated dependencies [e3d9a52]
- Updated dependencies [22748f7]
  - @nocobase/app-client@4.0.0-beta.4
  - @nocobase/app-server@3.0.0-beta.4
  - @nocobase/app-plugin-authorization@1.0.0-beta.33
  - @nocobase/db@1.0.0-beta.23
  - @nocobase/app-plugin-authentication@2.0.0-beta.15

## 0.1.0-beta.13

### Patch Changes

- 05f800a: Publish editable file upload/preview and notification delivery-log UI through the UI Library. Install `@nocobase/file-component-ui` or `@nocobase/notification-logs-ui` with shadcn, and merge their bundled locale resources into the consuming application. Existing application-owned copies remain usable; reconcile upstream changes while preserving customizations. The default template keeps its File UI installation path and now tracks the UI Library source.

  Remove plugin-owned Registry recipes, their build/materialize commands, the Registry example plugin, and the `registry` capability from the plugin scaffold. Plugins can continue to install UI Library items into their own client source. Update plugin development guidance to use this single source distribution channel.

  Preserve custom file download callbacks for images opened from FileList, including preview toolbar and fallback downloads.

## 0.1.0-beta.12

### Patch Changes

- e5e7498: Normalize shared client imports in session, invitation and release components without changing their behavior.
- Updated dependencies [756f3df]
  - @nocobase/app-plugin-authentication@2.0.0-beta.14

## 0.1.0-beta.11

### Patch Changes

- 58531da: Support plain HTTP origins when creating session and upload identifiers or copying text. Provide shared browser UUID and clipboard helpers so draft, submission and invitation actions work without secure-context APIs.

  Document capability checks and user-facing explanations for secure-context browser features, require HTTP-compatible UUID and copy actions, and return an explicit copy result for localized recovery UI.

- Updated dependencies [58531da]
  - @nocobase/app-client@4.0.0-beta.3
  - @nocobase/app-host-docker@0.1.0-beta.2
  - @nocobase/app-server@3.0.0-beta.3
  - @nocobase/authorization@1.0.0-beta.15
  - @nocobase/config@0.1.0-beta.3
  - @nocobase/db@1.0.0-beta.22
  - @nocobase/i18n@2.0.0-beta.1
  - @nocobase/service-provider@0.0.2-beta.2
  - @nocobase/app-plugin-authentication@2.0.0-beta.13
  - @nocobase/app-plugin-authorization@1.0.0-beta.31

## 0.1.0-beta.10

### Patch Changes

- 4b36a3d: Complete runtime timer inheritance labels in every supported client locale so the release management package builds and the settings remain translated.
- 10120a1: Let newly created apps inherit environment runtime timer defaults until a timer is explicitly customized.
- Updated dependencies [62da032]
  - @nocobase/app-client@4.0.0-beta.1
  - @nocobase/app-server@3.0.0-beta.1
  - @nocobase/app-plugin-authentication@2.0.0-beta.12
  - @nocobase/app-plugin-authorization@1.0.0-beta.30

## 0.1.0-beta.9

### Patch Changes

- 1952789: Complete all ten supported languages in plugin and example plugin catalogues, including model suggestions and test Web Push notifications. Align calendars and invitation emails, support locale-specific plural forms, and validate resource loading and formatting.

  Correct joined translation text and distinguish configuration save actions, refund stages, and domain-specific operation labels.

- Updated dependencies [1952789]
- Updated dependencies [06e53be]
  - @nocobase/app-plugin-authentication@2.0.0-beta.12
  - @nocobase/app-plugin-authorization@1.0.0-beta.30
  - @nocobase/i18n@2.0.0-beta.1
  - @nocobase/authorization@1.0.0-beta.15
  - @nocobase/app-client@4.0.0-beta.0

## 0.1.0-beta.8

### Patch Changes

- 1952789: Require explicitly declared realtime topics and authorize dynamic resources before subscription and delivery. Isolate the server core behind a broker contract, retain the application adapter and service tokens, and handle asynchronous publication throughout plugins and examples. Add acknowledged browser subscriptions, bounded recovery and heartbeat handling, shared React refresh helpers, original-session revalidation, transport limits, and usage documentation. The included adapter remains in-process; events are transient and clients recover by refetching after acknowledgement.
- 7afd595: Remove Refine from the client runtime

  The application shell no longer mounts Refine. `@nocobase/app-client` drops `app.refine`, `app.refineConfig`, `AppClientRefineConfig`, `AppClientRefineRegistry`, `AppClientRefineSetters`, `AppClientRefineSetterValue` and the provider-context methods `runWithProviderContext` and `runWithProviderContextAsync`, which existed only to attribute Refine settings to the provider that made them. Nothing in the repository read what was registered there: a title set through `app.refine.setOptions` never reached the page, and Refine resources never produced a menu entry.

  Refine also created the TanStack Query cache that pages read through `useQueryClient()`; `AppClientProviders` now creates it in the same place, the same way, so pages and plugins behave as before. `@tanstack/react-query` becomes a peer dependency of `@nocobase/app-client` and joins the identity-sensitive packages that plugins must declare as peers.

  `@nocobase/i18n/client` drops `createRefineI18nProvider`, `CreateRefineI18nProviderOptions` and `RefineI18nProvider`. `@nocobase/app-plugin-repository-example` drops its Client ServiceProvider and the `./client/providers` export, which only registered Refine resources.

  `nocobase build` builds the client with `vite build` instead of `refine build`, and `@nocobase/app-cli` no longer lists `@refinedev/cli` as an optional peer. The Default and Examples templates remove every `@refinedev/*` development dependency. The development and plugin Skills no longer mention Refine, and the upgrade Skill explains how an existing application removes its `this.app.refine` calls and Refine packages.

- Updated dependencies [1952789]
- Updated dependencies [1952789]
- Updated dependencies [1952789]
- Updated dependencies [1952789]
- Updated dependencies [1952789]
- Updated dependencies [7afd595]
  - @nocobase/app-client@4.0.0-beta.0
  - @nocobase/app-host@0.1.0-beta.17
  - @nocobase/app-host-docker@0.1.0-beta.2
  - @nocobase/app-plugin-authentication@2.0.0-beta.11
  - @nocobase/app-plugin-authorization@1.0.0-beta.29
  - @nocobase/app-server@3.0.0-beta.0
  - @nocobase/i18n@2.0.0-beta.0
  - @nocobase/authorization@1.0.0-beta.14
  - @nocobase/config@0.1.0-beta.3
  - @nocobase/db@1.0.0-beta.21
  - @nocobase/service-provider@0.0.2-beta.2

## 0.1.0-beta.7

### Patch Changes

- 22717d7: Support synchronous custom driver factories alongside existing configuration objects in `drive.disks`. Create drivers lazily through the shared application Drive provider, preserve Flydrive caching and fakes, and reject factory references where release artifacts require serializable Host configuration. Ship the `nocobase-drive` Skill with filesystem, S3, native Aliyun OSS, and custom driver guides, and direct application guidance to that shared documentation. Consumers reading disk configuration fields must narrow out factory functions first.
- Updated dependencies [22717d7]
  - @nocobase/drive@0.1.0-beta.7
  - @nocobase/app-server@2.0.0-beta.9
  - @nocobase/app-plugin-authentication@2.0.0-beta.10

## 0.1.0-beta.6

### Minor Changes

- fe81e4b: Allow releases.artifact to reference a named drive disk with an optional relative artifact key prefix. The referenced disk is validated with the drive's own rules and must be private. Repeated slashes in the prefix are collapsed. Preserve full disk configurations and existing artifact keys when changing the prefix.

### Patch Changes

- 49f61b9: Show optional settings permissions separately from business actions in CLI identity output, and explain run-token-only permissions. Add available-command typo suggestions, a hint for truncated text, and clean shutdown when a pipe closes early. Describe route schema inputs so generated CLI help and reference tables explain their parameters. The manifest identity and whoami JSON result gain an optional settings list; command admission and authorization are unchanged.
- Updated dependencies [98b3862]
- Updated dependencies [89648ee]
- Updated dependencies [fe81e4b]
- Updated dependencies [1cdbaf4]
- Updated dependencies [5fe8773]
- Updated dependencies [b22d999]
- Updated dependencies [0037dd2]
- Updated dependencies [c0b7537]
- Updated dependencies [eb4b081]
- Updated dependencies [14b7aec]
- Updated dependencies [49f61b9]
- Updated dependencies [0037dd2]
  - @nocobase/db@1.0.0-beta.21
  - @nocobase/drive@0.1.0-beta.6
  - @nocobase/app-host@0.1.0-beta.16
  - @nocobase/app-client@3.0.0-beta.2
  - @nocobase/app-server@2.0.0-beta.8
  - @nocobase/app-plugin-authentication@2.0.0-beta.10
  - @nocobase/app-plugin-authorization@1.0.0-beta.28
  - @nocobase/authorization@1.0.0-beta.14
  - @nocobase/app-host-docker@0.1.0-beta.1
  - @nocobase/config@0.1.0-beta.3
  - @nocobase/i18n@1.0.0-beta.7
  - @nocobase/service-provider@0.0.2-beta.2

## 0.1.0-beta.5

### Patch Changes

- 943a9a8: Fix MySQL installation of the agents and releases plugins by removing the unused directory/status index and limiting archive artifact keys to 172 characters while preserving full-value uniqueness. Add a Collection builder inspection method and forward migrations to converge existing installations without truncating data; oversized legacy artifact keys stop the upgrade before any column or index change. Rebuild the existing artifact-key unique index within the migration transaction on SQL Server so indexed legacy columns can be shortened while retaining uniqueness, nullable behavior and the actual index name under custom naming configurations.

  This fix edits the released migrations `202610020003_ag_create_runs` and `202610020001_rel_create_tables` because their oversized indexes prevent fresh MySQL installations from reaching a later repair migration. Existing installations should expect checksum warnings on the next `nocobase db apply`; installations using `onChecksumMismatch: error` stop instead. After reviewing these exact changes, use `nocobase db repair --dry-run` and then `nocobase db repair` to acknowledge the new checksums, followed by `nocobase db apply` to perform the forward schema changes. Repairing checksums alone does not upgrade the schema. The forward corrections are irreversible because restoring the old indexes would make MySQL installations invalid again. See the plugins' `docs/mysql-installation-upgrade.md` for the upgrade and failed-installation recovery procedure.

- Updated dependencies [69e212c]
- Updated dependencies [943a9a8]
- Updated dependencies [943a9a8]
- Updated dependencies [1cd749c]
- Updated dependencies [bdb0581]
- Updated dependencies [9b946f4]
  - @nocobase/app-server@2.0.0-beta.7
  - @nocobase/db@1.0.0-beta.20
  - @nocobase/app-plugin-authentication@2.0.0-beta.9
  - @nocobase/app-plugin-authorization@1.0.0-beta.27

## 0.1.0-beta.4

### Patch Changes

- 693e43d: Update agent guidance to refer to the renamed `nocobase-app-plugin-development` Skill.
- Updated dependencies [d54dd59]
  - @nocobase/app-plugin-authentication@2.0.0-beta.7

## 0.1.0-beta.3

### Patch Changes

- cf23bfe: Republish every package so the `latest` dist-tag points at its current beta release, matching `beta`.
- Updated dependencies [cf23bfe]
  - @nocobase/app-client@3.0.0-beta.1
  - @nocobase/app-host@0.1.0-beta.15
  - @nocobase/app-host-docker@0.1.0-beta.1
  - @nocobase/app-plugin-authentication@2.0.0-beta.6
  - @nocobase/app-plugin-authorization@1.0.0-beta.27
  - @nocobase/app-server@2.0.0-beta.4
  - @nocobase/authorization@1.0.0-beta.13
  - @nocobase/config@0.1.0-beta.3
  - @nocobase/db@1.0.0-beta.19
  - @nocobase/drive@0.1.0-beta.5
  - @nocobase/i18n@1.0.0-beta.7
  - @nocobase/logging@0.1.0-beta.7
  - @nocobase/secrets@0.1.0-beta.1
  - @nocobase/service-provider@0.0.2-beta.2

## 0.1.0-beta.2

### Minor Changes

- c796cb9: Remove the Settings and Dev route surfaces. `@nocobase/app-client` no longer exports `defineSettingsRoutes()`, `defineDevRoutes()`, `isAppClientSettingsRouteGroup()`, `isAppClientDevRouteGroup()` or their definition, contribution and registered-route types, and the resolved runtime no longer carries `settingsRouteTree`, `devRouteTree`, `settings`, `settingGroups`, `devRoutes` or `devRouteGroups`. `AppClientSettingsRouteNavigation` is renamed `AppClientRouteNavigation` and `AppClientSettingIcon` is renamed `AppClientRouteIcon`. A contribution to any parent other than `app` now fails registration with a message that names `defineAppRoutes()`. Plugins contribute no settings or dev pages; an application that wants a configuration page declares it with `defineAppRoutes()` in its own navigation, for example under a Settings group.

  The default and examples templates drop the settings layout, the `/settings/*` route, the dev route plumbing, and the Settings and Inbox buttons in the header; the `/inbox` page and the inbox block stay. The examples template no longer registers `@nocobase/app-plugin-departments-example`, which is removed. Upgrading an application means removing `defineSettingsRoutes([])` from `client/routes.ts`, the `settingsRouteTree` and `devRouteTree` props passed to `AppRouter`, and any settings layout it kept, and moving its own settings pages to `defineAppRoutes()`. Every package that depends on or peers with `@nocobase/app-client` is released again so that its published range accepts `3.0.0-beta.0`.

### Patch Changes

- c796cb9: Remove the AI employee packages from the repository

  `@nocobase/app-plugin-ai-employee`, `@nocobase/ai-employee` and `@nocobase/app-plugin-ai-employee-example` were already deprecated and no template installed them; they are now deleted and will not be released again. The Default and Examples templates drop `@nocobase/ai-employee-avatars`, which only the plugin's avatars used.

  Generated plugins' `AGENTS.md` and the copies shipped with existing plugins no longer list `@nocobase/ai-employee` among the identity-sensitive packages. The HTTP API references in the application development Skill use other plugins for their examples, and the upgrade Skill tells an application that still depends on the removed packages to review their usage before removing them, because the runtime will move past what their peer ranges accept.

  `pnpm build` no longer copies `ai/skills` into `dist/ai/skills`. The AI employee plugin was the only reader of that directory; an application that keeps Skills there for another purpose has to copy them itself, for example from a build hook.

- c796cb9: Remove NocoBase Hub. `@nocobase/app-plugin-hub`, `@nocobase/app-template-hub` and `@nocobase/hub-cli` are no longer published, and every package that offered or described the Hub drops it.

  Breaking for `@nocobase/app-installer`: it installs, upgrades and rolls back from a deployment archive only. `install --template`, `install --keep-source`, `upgrade --to`, `upgrade --rebuild`, `upgrade --keep-source` and `status --offline` are removed, as are the `latest` and `updateAvailable` members of the `status` result and the `rebuilt` and `notes` members of the `upgrade` result. An installation an earlier version built from the published Hub template is refused with `STATE_UNSUPPORTED`; manage it with the app-installer version that installed it. The error codes that only a template build reported (`PNPM_MISSING`, `PNPM_UNSUPPORTED`, `REGISTRY_UNREACHABLE`, `VERSION_NOT_FOUND`, `DISK_LOW`, `CREATE_FAILED`, `DRIVER_INSTALL_FAILED` and `BUILD_FAILED`) are no longer produced, and pm2 always kills the process tree of an application it stops.

  Breaking for `@nocobase/create-app`: `--template hub` is no longer a template name, and a generated application no longer gets a `.env`.

  The Default template no longer depends on `@nocobase/hub-cli`, so an application generated from it has no `pnpm nocobase hub` commands. An application upgraded from an earlier version that published to a Hub removes the dependency with `pnpm nocobase package remove @nocobase/hub-cli` and deletes `.nocobase/hub.json`; the `nocobase-app-upgrade` Skill describes the steps. The application Skills, the plugins' documentation and the in-app test notification text no longer mention the Hub.

- Updated dependencies [c796cb9]
- Updated dependencies [c796cb9]
- Updated dependencies [c796cb9]
- Updated dependencies [98e79a5]
- Updated dependencies [fb7b576]
  - @nocobase/app-server@2.0.0-beta.3
  - @nocobase/app-plugin-authentication@2.0.0-beta.3
  - @nocobase/app-plugin-authorization@1.0.0-beta.26
  - @nocobase/app-client@3.0.0-beta.0
  - @nocobase/i18n@1.0.0-beta.6
  - @nocobase/app-host-docker@0.1.0-beta.0
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/config@0.1.0-beta.2
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.1

### Patch Changes

- 3380f9d: Update application lifecycle buttons from the current runtime state, explain unavailable operations, and refresh visible application pages automatically with retry and stale-response protection.

## 0.1.0-beta.0

### Minor Changes

- 68d4feb: Add `@nocobase/app-plugin-releases`: release management for a NocoBase application. Apps (always running, or started on demand and stopped when idle), releases, environments, deployments and rollbacks, configuration with write-only secrets sealed by the secrets service, logs, upload tickets for CI, and deployment requests with approval. Deployment targets are pluggable drivers; the plugin ships the `host` driver, which deploys through App Hosts in process or in Docker containers (`@nocobase/app-host-docker`). The plugin knows nothing about projects, agents or roles: it declares what can be granted in `shared/access.ts` and the assembling application decides who holds what. CI reaches it with a scoped API key and the application's CLI (`release upload`, `release image`).

### Patch Changes

- 32d8faa: On PostgreSQL, a member who may see no project, no issue or no App no longer gets a server error: the filters used a NUL character as a placeholder id that matches nothing, which PostgreSQL refuses. The releases plugin's App list, for one, answered 500 to every member who had created no App.
- ee4da29: A row's menu in the releases plugin's lists no longer closes by itself when the list renders again, such as when other data on the page loads: the lists' cells are no longer remounted on every render.
- 6162033: Declare `@testing-library/user-event` as a development dependency, which the package's tests now use to open menus and selects. Nothing an application installs changes.
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [be0fbbd]
- Updated dependencies [bc1e83f]
- Updated dependencies [6993158]
- Updated dependencies [a6796d9]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [6162033]
  - @nocobase/app-host-docker@0.1.0-beta.0
  - @nocobase/secrets@0.1.0-beta.0
  - @nocobase/app-client@2.0.0-beta.1
  - @nocobase/app-host@0.1.0-beta.14
  - @nocobase/app-server@2.0.0-beta.1
  - @nocobase/app-plugin-authentication@2.0.0-beta.1
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/app-plugin-authorization@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/config@0.1.0-beta.2
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 0.0.1

### Patch Changes

- Add the initial plugin scaffold.
