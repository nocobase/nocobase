# @nocobase/app-plugin-knowledge

## 0.1.0-beta.8

### Minor Changes

- 7a6d311: Declare indexer notification coverage and expose it as optional snapshot metadata. Share event and fallback refresh scheduling across index query observers, reconcile complete acknowledged subscriptions once per minute, and use bounded adaptive polling for incomplete or legacy indexers. Refresh inherited permission changes, clear inaccessible index snapshots, and release subscriptions and timers when queries leave the cache. Preserve existing API data and client method return shapes. Show failed index refreshes with a reader-accessible retry action in document badges, section panels and space summaries.

### Patch Changes

- @nocobase/app-server@3.0.0-beta.0
  - @nocobase/app-plugin-file@1.0.0-beta.25

## 0.1.0-beta.7

### Minor Changes

- 1952789: Make mail synchronization and office workflow views refresh from committed state notifications, including empty sync results, failures, cancellation and lifecycle transitions. Add optional periodic reconciliation to the shared refresh scheduler, pause hidden views, and retain one-minute reconciliation for transient announcements and out-of-band changes. Reduce existing task, run, session and chat fallback reads to one minute while retaining time-based computer status checks, external indexing status reads, deployment health probes and bounded initialization waits.

  Announce knowledge rechunking start and completion even when no chunks change, and support optional committed status notifications from external indexers. Continue tracking pending index work when some sections have already failed.

  Preserve application providers when `renderWithApp` rerenders its page. Exercise mail refresh through real application services and fix the mail account navigation translation key exposed by those checks.

### Patch Changes

- 1952789: Require explicitly declared realtime topics and authorize dynamic resources before subscription and delivery. Isolate the server core behind a broker contract, retain the application adapter and service tokens, and handle asynchronous publication throughout plugins and examples. Add acknowledged browser subscriptions, bounded recovery and heartbeat handling, shared React refresh helpers, original-session revalidation, transport limits, and usage documentation. The included adapter remains in-process; events are transient and clients recover by refetching after acknowledgement.
- 1952789: Add `refreshRealtimeQueries` to refresh active TanStack Query snapshots after pre-event requests settle, including initial loads, prefixes and predicates. Keep inactive snapshots invalid, expose refresh failures, and stop queued follow-ups when their owner is disposed. The application client now declares its TanStack Query peer contract.

  Use the shared catch-up behavior in Projects, Knowledge, Agents, Agent Sessions and the inbox. Refresh additional inbox topics after subscription readiness and preserve refresh promises so concurrent events coalesce correctly. Update application guidance to avoid reusing stale in-flight responses.

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
  - @nocobase/app-plugin-authentication@2.0.0-beta.11
  - @nocobase/app-plugin-authorization@1.0.0-beta.29
  - @nocobase/app-plugin-file@1.0.0-beta.25
  - @nocobase/app-server@3.0.0-beta.0
  - @nocobase/i18n@2.0.0-beta.0
  - @nocobase/authorization@1.0.0-beta.14
  - @nocobase/db@1.0.0-beta.21
  - @nocobase/markdown-mermaid@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.2

## 0.1.0-beta.6

### Patch Changes

- e897e4f: Keep Markdown nodes mounted while session records and knowledge documents refresh or their rendering options change.
- Updated dependencies [22717d7]
  - @nocobase/app-server@2.0.0-beta.9
  - @nocobase/app-plugin-file@1.0.0-beta.24
  - @nocobase/app-plugin-authentication@2.0.0-beta.10

## 0.1.0-beta.5

### Patch Changes

- 84fa838: Keep the selected historical document version when leaving the history list by updating the version and reading mode together.
- 49f61b9: Show optional settings permissions separately from business actions in CLI identity output, and explain run-token-only permissions. Add available-command typo suggestions, a hint for truncated text, and clean shutdown when a pipe closes early. Describe route schema inputs so generated CLI help and reference tables explain their parameters. The manifest identity and whoami JSON result gain an optional settings list; command admission and authorization are unchanged.
- Updated dependencies [98b3862]
- Updated dependencies [1cdbaf4]
- Updated dependencies [5fe8773]
- Updated dependencies [b22d999]
- Updated dependencies [00c5970]
- Updated dependencies [0037dd2]
- Updated dependencies [c0b7537]
- Updated dependencies [eb4b081]
- Updated dependencies [14b7aec]
- Updated dependencies [49f61b9]
- Updated dependencies [0037dd2]
  - @nocobase/db@1.0.0-beta.21
  - @nocobase/app-client@3.0.0-beta.2
  - @nocobase/app-server@2.0.0-beta.8
  - @nocobase/app-plugin-file@1.0.0-beta.24
  - @nocobase/app-plugin-authentication@2.0.0-beta.10
  - @nocobase/app-plugin-authorization@1.0.0-beta.28
  - @nocobase/authorization@1.0.0-beta.14
  - @nocobase/i18n@1.0.0-beta.7
  - @nocobase/markdown-mermaid@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.2

## 0.1.0-beta.4

### Minor Changes

- ff9d41b: Show an authorized project and shared system knowledge directory with lazy trees, accurate document counts, global search, explicit creation targets, and complete permission-filtered pending reviews. Preserve single-space views, existing links and archive workflows, with consistent creation parents/permissions and per-space search diagnostic targets.

### Patch Changes

- Updated dependencies [69e212c]
- Updated dependencies [943a9a8]
- Updated dependencies [943a9a8]
- Updated dependencies [1cd749c]
- Updated dependencies [bdb0581]
- Updated dependencies [9b946f4]
  - @nocobase/app-server@2.0.0-beta.7
  - @nocobase/db@1.0.0-beta.20
  - @nocobase/app-plugin-authentication@2.0.0-beta.9
  - @nocobase/app-plugin-file@1.0.0-beta.23
  - @nocobase/app-plugin-authorization@1.0.0-beta.27

## 0.1.0-beta.3

### Patch Changes

- 693e43d: Update agent guidance to refer to the renamed `nocobase-app-plugin-development` Skill.
- Updated dependencies [d54dd59]
  - @nocobase/app-plugin-authentication@2.0.0-beta.7

## 0.1.0-beta.2

### Patch Changes

- cf23bfe: Republish every package so the `latest` dist-tag points at its current beta release, matching `beta`.
- Updated dependencies [cf23bfe]
  - @nocobase/app-client@3.0.0-beta.1
  - @nocobase/app-plugin-authentication@2.0.0-beta.6
  - @nocobase/app-plugin-authorization@1.0.0-beta.27
  - @nocobase/app-plugin-file@1.0.0-beta.23
  - @nocobase/app-server@2.0.0-beta.4
  - @nocobase/authorization@1.0.0-beta.13
  - @nocobase/db@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.7
  - @nocobase/markdown-mermaid@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.2

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
