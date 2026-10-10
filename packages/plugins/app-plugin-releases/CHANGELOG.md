# @nocobase/app-plugin-releases

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
