# @nocobase/app-plugin-releases

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
