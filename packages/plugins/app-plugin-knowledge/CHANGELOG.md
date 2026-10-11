# @nocobase/app-plugin-knowledge

## 0.1.0-beta.1

### Minor Changes

- c796cb9: Remove the Settings and Dev route surfaces. `@nocobase/app-client` no longer exports `defineSettingsRoutes()`, `defineDevRoutes()`, `isAppClientSettingsRouteGroup()`, `isAppClientDevRouteGroup()` or their definition, contribution and registered-route types, and the resolved runtime no longer carries `settingsRouteTree`, `devRouteTree`, `settings`, `settingGroups`, `devRoutes` or `devRouteGroups`. `AppClientSettingsRouteNavigation` is renamed `AppClientRouteNavigation` and `AppClientSettingIcon` is renamed `AppClientRouteIcon`. A contribution to any parent other than `app` now fails registration with a message that names `defineAppRoutes()`. Plugins contribute no settings or dev pages; an application that wants a configuration page declares it with `defineAppRoutes()` in its own navigation, for example under a Settings group.

  The default and examples templates drop the settings layout, the `/settings/*` route, the dev route plumbing, and the Settings and Inbox buttons in the header; the `/inbox` page and the inbox block stay. The examples template no longer registers `@nocobase/app-plugin-departments-example`, which is removed. Upgrading an application means removing `defineSettingsRoutes([])` from `client/routes.ts`, the `settingsRouteTree` and `devRouteTree` props passed to `AppRouter`, and any settings layout it kept, and moving its own settings pages to `defineAppRoutes()`. Every package that depends on or peers with `@nocobase/app-client` is released again so that its published range accepts `3.0.0-beta.0`.

### Patch Changes

- c796cb9: Remove the AI employee packages from the repository

  `@nocobase/app-plugin-ai-employee`, `@nocobase/ai-employee` and `@nocobase/app-plugin-ai-employee-example` were already deprecated and no template installed them; they are now deleted and will not be released again. The Default and Examples templates drop `@nocobase/ai-employee-avatars`, which only the plugin's avatars used.

  Generated plugins' `AGENTS.md` and the copies shipped with existing plugins no longer list `@nocobase/ai-employee` among the identity-sensitive packages. The HTTP API references in the application development Skill use other plugins for their examples, and the upgrade Skill tells an application that still depends on the removed packages to review their usage before removing them, because the runtime will move past what their peer ranges accept.

  `pnpm build` no longer copies `ai/skills` into `dist/ai/skills`. The AI employee plugin was the only reader of that directory; an application that keeps Skills there for another purpose has to copy them itself, for example from a build hook.

- Updated dependencies [c796cb9]
- Updated dependencies [c796cb9]
- Updated dependencies [c796cb9]
- Updated dependencies [98e79a5]
- Updated dependencies [eea95a7]
- Updated dependencies [fb7b576]
  - @nocobase/app-server@2.0.0-beta.3
  - @nocobase/app-plugin-authentication@2.0.0-beta.3
  - @nocobase/app-plugin-authorization@1.0.0-beta.26
  - @nocobase/app-client@3.0.0-beta.0
  - @nocobase/app-plugin-file@1.0.0-beta.22
  - @nocobase/i18n@1.0.0-beta.6
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/markdown-mermaid@0.1.0-beta.1
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.0

### Minor Changes

- 68d4feb: Add `@nocobase/app-plugin-knowledge`: a knowledge base for any NocoBase application. Spaces, named by a kind and a key the application chooses, hold a tree of folders, Markdown articles and files; every saved version is kept whole under an optimistic lock, the text of files is extracted for search, search is fused from pluggable providers, proposals are decided by someone who may edit, and snapshots export spaces as files. It depends on no AI, agents or projects: the application binds `knowledgeAccessToken` to name its spaces and decide who may do what in each.

### Patch Changes

- 6162033: Declare `@testing-library/user-event` as a development dependency, which the package's tests now use to open menus and selects. Nothing an application installs changes.
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
- Updated dependencies [3f1b78f]
- Updated dependencies [8885ce4]
- Updated dependencies [0151805]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [e538d12]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [6162033]
  - @nocobase/markdown-mermaid@0.1.0-beta.0
  - @nocobase/app-client@2.0.0-beta.1
  - @nocobase/app-server@2.0.0-beta.1
  - @nocobase/app-plugin-authentication@2.0.0-beta.1
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/app-plugin-authorization@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/app-plugin-file@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 0.0.1

### Patch Changes

- Add the initial plugin scaffold.
