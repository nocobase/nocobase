# @nocobase/app-plugin-workflow

## 1.0.0-beta.30

### Minor Changes

- 52f9811: Run workflow tasks on `@nocobase/jobs` instead of `@nocobase/queue`

  **Breaking.** Workflow publishes and consumes its tasks through its own `JobExecutor` from `@nocobase/app-server/jobs`, on the `@nocobase/app-plugin-workflow` scope. It depends on `@nocobase/jobs` as a peer instead of `@nocobase/queue`. The jobs namespace, which defaults to the application name, now keeps applications apart. The `workflow:<appName>` queue name did that before. The engine sets the executor up when it initializes and shuts it down when it is disposed. It no longer keeps a module-level registry of dispatch handlers.

  `workflow.jobs` names the `jobs` configuration tasks run on. Left out, they follow `jobs.default`. A name that `jobs` does not define stops the application from starting. The memory adapter serves one process, so an application running more than one instance needs a `redis` jobs configuration.

  Upgrading: compose `JobExecutorServiceProvider` in `server/app.ts` and declare `@nocobase/jobs` as a dependency. The application templates already do both. Tasks still waiting in a queue connection are not moved. Runs that were accepted but never started are published again by the recovery that runs when the engine initializes.

- dfdd449: ### Typed workflow DSL

  Author workflow definitions with a typed, immutable builder instead of hand-written variable templates.

  `workflow()`, exported from `@nocobase/app-plugin-workflow/dsl`, returns a builder that owns the definition's identity. `addNode()` returns a new builder over its own node list rather than mutating the one it was called on, so chained authoring works as before but code that called `addNode()` for its side effect has to keep the returned builder. `finalize()` rejects a node borrowed from another workflow, a node added to two workflows, and a duplicate node key. Give the `input` or `parameters` surface a TypeBox `Type.*` schema to type it; a raw JSON Schema still describes the surface and leaves it untyped. Workflow and node `options` are typed and validated, and preserved through artifacts and database materialization.

  Handlers are declared with `defineHandler<typeof handler>('./server/handler')` over a type-only import, so evaluating a definition never loads server implementations or their dependencies. A handler reads invocation input, parameters, and upstream results from one shared context rather than from per-node argument mappings, and each node's result type is inferred from its handler's return type and accumulates through the chain, nested branches included. `finalize()` checks that every handler's context requirements are satisfied by the typed surfaces and upstream results.

  The Workflow Skill now explains how to author typed DSL definitions and migrate mapped arguments and JSON Logic conditions to context handlers.

  Conditions now run a handler module that returns a boolean, and the JSON Logic engine is removed along with the `expression` config field and the `evaluateJsonLogic`, `validateJsonLogicExpression`, and `JSON_LOGIC_*` exports. An existing definition that configures `expression` must move that comparison into a handler module. A condition's branches can be declared with the chainable `yes()` and `no()` methods, which reject empty and duplicate branch declarations; generic `branch()` authoring still works.

  `parameters` accepts the same JSON Schema object shape as `inputSchema`, and `compileToFlatIr()` lowers it to the flat declaration map the parameter editor, the value resolver, and the materializer read. The lower-level `defineWorkflow()` API with `RunInstruction.create()` and friends is unchanged and still exported, together with `createReference()` and `lowerBindings()` for its `{{$input.x}}`, `{{$parameters.x}}`, and `{{$nodeResults.key.path}}` templates. A run node that carries no `args` receives the shared handler context, so both authoring styles execute on one engine.

  The examples template's workflows are migrated to the typed builder and read their shared inferred contexts without result casts.

  ### Custom Instruction nodes

  Open the typed workflow builder to application-registered Instructions.

  The builder resolved a node's expression metadata from a table holding `run`, `terminate` and `condition`, so a node of any other type failed with `Unknown workflow instruction`. It now reads the node's own type, configuration and branch structure, which is all the expression needs, and `createNode()` is exported so an extension can supply a node factory beside its Instruction class. The custom Instruction reference documents that factory alongside the existing `defineWorkflow()` form.

  ### Builder validation

  Fail finalization when a workflow builder's `addNode()` result was discarded.

  `addNode()` returns the workflow containing the node, so calling it for its side effect and finalizing the receiver compiled a definition the node was simply missing from — and with it every handler context requirement `finalize()` would otherwise have checked. Types cannot catch this, because the discarded builder is the only value that carries the node. The builder now records what it has claimed and rejects `finalize()` and `compile()` naming each node that was never compiled, including nodes nested in a branch.

  ### Workflow client forms

  Let a workflow revision render its own custom input and parameter forms.

  A workflow package may declare `input.form` and `parameters.form`, resolved inside its own `client/` directory. Those `client` declarations are persisted with the workflow revision and returned by the management API, and the form itself is published under the revision's Artifact hash, so a later build that changes a form cannot change how an already published revision renders. `@nocobase/app-plugin-workflow/vite` exposes those forms to the application build through a virtual module keyed by workflow, revision, and path. In development the module index refreshes when workflow sources change, including added and removed resources, without restarting Vite. Forms get React through bridge exports generated from the installed React modules and the matching host JSX runtimes, so they can use the full React API without bundling a second instance.

  Workflow management addresses unpublished candidates by Artifact hash, so a detail URL identifies one exact version. Hot updates refresh the workflow list and version picker; reopen a changed candidate from there, since an unpublished hash can expire. Materialized revision URLs and mutations stay bound to exact versions. Parameter settings and manual run on a version that has not been materialized yet prompt to enable it first, then navigate to the materialized id. A version that was already materialized stays usable while disabled.

  ### Custom input form schemas

  Hand a custom input form the declarations it is typed for.

  The manual run dialog passed a workflow's raw input schema properties to a custom input form through an `as never` cast, so a form received whatever the schema happened to hold rather than the `string`, `number` and `boolean` declarations `WorkflowParameterFormProps` promises. The properties are now narrowed at that boundary: a property the contract cannot describe is left out instead of being handed over under a type it does not have.

  ### Artifact materialization

  Materialize workflow revisions on demand rather than at startup.

  Startup persists immutable artifact snapshots and publishes client resources, in development as well as production, without creating database revisions. A revision is materialized when a user enables a version, configures its parameters, or runs it manually, and its forms and handlers are resolved from that version's artifact hash. Persisting artifacts, materializing, publishing client resources, and selecting the current version are separate steps: reading parameters and running manually no longer select the current revision, while the first successful parameter save still does. Browser assets are served before the development SPA fallback and restored from persistent storage on startup.

  ### Application workflow layout

  Keep application workflow definitions in a top-level `workflows/` directory and build them to `dist/workflows`.

  Development discovery, `workflow build`, `workflow check`, production artifact loading, and the application Skill all use that location.

  Application server source may now use extensionless relative imports, so a workflow package can import a handler as `./server/calculate-risk`. All three templates set `module: "ESNext"`, `moduleResolution: "Bundler"`, and `tsc-alias.resolveFullPaths: true` in `tsconfig.server.json`: development runs under `tsx`, and the build runs `tsc-alias` after `tsc` to complete the paths for native Node ESM before workflow resources are collected. Workflow source checking and evaluation resolve extensionless handler imports the same way. A workflow package's `client/` form is typechecked and linted as browser code, through the client project rather than the server build.

  `loadAppVitePlugins()` in `@nocobase/dev-config` loads the Vite contribution of every client plugin an application registers, so a template's `vite.config.ts` does not name individual plugins. An application without a `client/plugins.ts` contributes none rather than failing config resolution. A registered package that does not export its `package.json` is read from disk rather than failing config resolution.

  The Workflow Vite contribution refreshes the workflow list and materialized revision picker during development by injecting its module index into the development page. The plugin's published client code no longer imports that index, so an application installing the plugin from a registry no longer fails Vite's dependency pre-bundling with `Could not resolve "virtual:nocobase-workflow-client-entries"`, and an application whose `vite.config.ts` does not call `loadAppVitePlugins()` still builds and runs; it only loses the live candidate refresh. To get it, call `loadAppVitePlugins()` as the templates' `vite.config.ts` does.

  ### Vite source root

  Read a Vite contribution's registration options from the application that registered it.

  `AppVitePluginRegistration.config` was declared but never populated, so the Workflow Vite plugin's configurable `sourceRoot` could not be set by any application and always resolved to the default. `loadAppVitePlugins()` now parses the options literal the application passed to the plugin factory in its `client/plugins.ts`. Only statically writable values are read — an argument that is not a literal object of literal values leaves `config` undefined rather than reporting a partial one, because the declaration is parsed and never executed. `workflow({ sourceRoot })` is the supported way to point the Workflow client build at a directory other than `workflows`; keep it equal to the `sourceRoot` in the application's server workflow configuration.

### Patch Changes

- Updated dependencies [3d44c4c]
  - @nocobase/jobs@0.1.0-beta.1
  - @nocobase/app-server@1.0.0-beta.31
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/app-plugin-scheduler@0.1.0-beta.10
  - @nocobase/app-cli@1.0.0-beta.10
  - @nocobase/app-client@1.0.0-beta.23
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/app-plugin-authorization@0.2.0-beta.21

## 1.0.0-beta.29

### Major Changes

- db16945: Toasts go through a toaster that `@nocobase/app-client` defines and the application implements, so code that reports a result no longer depends on how toasts are rendered.

  - **App client.** `useToaster()` returns the application's `Toaster`. Its `show({ type, title, description, action, duration, id, onClose })` returns an id that `close(id)` takes, and `resolveToaster(app.services)` returns the same toaster outside React. The application registers the implementation under `toasterToken`; `@nocobase/app-client` registers none. Without one, nothing throws: each toast is logged to the console instead, an error toast as an error, and the first says how to register a toaster. Clicking a toast's action runs its `onClick` and leaves the toast open.
  - **Templates.** `client/lib/toaster.ts` forwards toasts to the Base UI `toast` manager that the mounted `Toaster` renders, and decides their presentation for the whole application: an error written as plain text is announced at once, while one with an action, or with an element for its title or description, keeps the default priority. `client/service-provider.ts` registers it in `register()`. The account menu, the language switcher and the Examples route overlay demo show their toasts through `useToaster()`.
  - **Plugins (breaking).** Hub, Users, Workflow and AI employee pages report through `useToaster()` instead of `Toast.useToastManager()` from `@base-ui/react/toast`, and no longer choose a toast's priority. They need the `@nocobase/app-client` that exports it, and the application has to register a toaster: without one nothing throws, but their toasts only reach the console, and a Hub page whose only content is an error shows nothing. They no longer require a Base UI `Toast.Provider`.
  - **Skills.** The frontend references and each affected plugin's Skill describe `useToaster()`, and the `nocobase-app-upgrade` edge case "Notifications and the application toaster" replaces "Notifications and the Base UI toast".

  Upgrade an existing application with the `nocobase-app-upgrade` Skill, which brings `client/lib/toaster.ts` and its registration together with the new `@nocobase/app-client` and plugin ranges; follow the same steps when upgrading by hand. `pnpm nocobase plugin update` is not enough on its own: the plugins stay inside the application's `^1.0.0-beta` ranges, so it installs them, but it leaves `@nocobase/app-client` where it is, and their pages then fail to load for want of `useToaster`.

### Patch Changes

- Updated dependencies [9f75a27]
- Updated dependencies [84cc7d2]
- Updated dependencies [db16945]
  - @nocobase/app-cli@1.0.0-beta.9
  - @nocobase/app-client@1.0.0-beta.23
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/app-plugin-scheduler@0.1.0-beta.9

## 1.0.0-beta.28

### Major Changes

- 2217eb2: Remove `@nocobase/app-plugin-notification-provider` and show every notification through the Base UI toast the templates already ship. The package is no longer published, and Sonner is no longer a dependency of anything.

  - **Templates.** `client/react-providers.ts` mounts the `Toaster` from `client/components/ui/toast.tsx` once, in the `application` layer, and the account menu and language switcher call `toast.add` from `@/components/ui/toast`. A rule at the end of `client/styles.css` lifts the toast viewport above dialogs and sheets, which share its `z-50`. The plugin and `sonner` leave `client/plugins.ts` and `package.json`, and no Refine notification provider is registered.
  - **Plugins (breaking).** Hub, Users, Workflow and AI employee pages report through `Toast.useToastManager()` from `@base-ui/react/toast` instead of Sonner or Refine's `useNotification()`, so they now require the application to mount a Base UI `Toast.Provider`; without one their pages fail with `Base UI: useToastManager must be used within <Toast.Provider>`. They move to `1.0.0` for that reason, which keeps an existing application's `^0.1.0` ranges, and so `pnpm nocobase plugin update`, from installing them before the toaster is in place. Hub notifications appear where the application's toaster places them rather than top-right. `sonner` and `@refinedev/core` are no longer peers.
  - **Skills.** The frontend references describe `toast.add` from `@/components/ui/toast` in place of Sonner, and each affected plugin's Skill names the toaster requirement and the error that reveals it.

  Upgrade an existing application by moving to this template release with the `nocobase-app-upgrade` Skill, which brings the new plugin ranges together with the toaster. Its "Notifications and the Base UI toast" edge case (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) lists the steps, their order, and how to verify the pages afterwards; follow the same steps when upgrading by hand.

### Minor Changes

- 02d5402: `@nocobase/app-cli` is now the whole application command line: it provides the `nocobase` bin and absorbs `@nocobase/nb3-cli` (command assembly, the plugin contract, plugin and Skill management) and `@nocobase/app-tools` (`dev`, `build`, `start`, `server-deps`). Neither of those two packages is published any more, and there is no compatibility period.

  - **Commands.** Standard commands leave the `app` topic: `nocobase db apply`, `nocobase config init`, `nocobase collections generate`. `app db doctor` is now `collections doctor`, `app i18n:check` is now `locales check`, and `app upload`/`app deploy` are `release upload`/`release deploy`, registered only when `package.json` sets `nocobase.cli.publishing: true`. New commands `dev`, `build`, `start`, `dist retarget` and `dist check` replace the application's `scripts/*.mjs`. `plugin skills sync` and `plugin cli-hooks` are removed; use `skills sync`. `app` now holds only an application's own commands.
  - **Discovery.** Commands are found by path: an application's `cli/commands/orders/sync.ts` answers to `nocobase app orders sync`, with no index to maintain. The bin finds the application from the nearest `package.json` (`nocobase.templateKind` for a source checkout, `nocobase.buildTarget` for a built `dist/`), or from `NOCOBASE_APP_ROOT`; applications no longer have a `cli/index.ts`. A built-in command runs without importing the application's plugins.
  - **Plugins.** A plugin's topic is its package name without the scope and `app-plugin-` prefix, so the scheduler's commands move from `schedule` to `scheduler` and the CLI example's from `demo` to `cli-example`. `defineCliPlugin` accepts `devCommands`, which a built `dist/` leaves out; the workflow plugin's `check` and `build` are development commands. Plugins declare `@nocobase/app-cli` as their peer instead of `@nocobase/nb3-cli`.
  - **Deployment.** `nocobase build` writes `dist/cli/index.js`, so `node dist/cli/index.js db apply` runs from any directory without pnpm; `dist/package.json` keeps only the `start` and `nocobase` scripts. The `migrate` and `seed` scripts it used to generate pointed at commands that no longer existed and are gone. Development tooling (`typescript`, `tsx`, `vite`, `prettier`, `tar`, `@nocobase/dev-config`) is an optional peer, so a deployment installs none of it.
  - **Templates.** Scripts are reduced to `postinstall`, `dev`, `build`, `start` and the quality checks; every other command is `pnpm nocobase <topic> <command>`. `scripts/`, `cli/index.ts` and `cli/commands/index.ts` are removed.

  Upgrading an existing application requires moving to the new layout in one step: see "Shared application scripts and commands" in the `nocobase-app-upgrade` Skill (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) for the full procedure. Messages that named `nocobase app db repair` and similar commands now name the new ids.

- ec92b20: Plugin commands are `AppCommand`s and print the command envelope under `--json`. `scheduler sync` creates the application through `withApp()`, so it acts on the application the runner located rather than the current directory and always destroys the runtime. `workflow build` path flags are `appPath()` flags, so their defaults resolve against the application root from any directory. The CLI example's `artifact build` is a development command, and `pnpm plugin:create --with cli` generates an `AppCommand` with a test that uses `@nocobase/app-cli/testing`.

  The application Skill gains a reference on adding an application command, and the application templates and plugin `AGENTS.md` files describe commands in those terms: a command returns its result, throws `CommandError`, and creates the application with `withApp()` when it needs it. The templates import the CLI authoring API from `@nocobase/app-cli`.

### Patch Changes

- Updated dependencies [ec92b20]
- Updated dependencies [dbf5631]
- Updated dependencies [ec92b20]
- Updated dependencies [757eedf]
- Updated dependencies [1b139b6]
- Updated dependencies [02d5402]
- Updated dependencies [dbf5631]
- Updated dependencies [ae43f41]
- Updated dependencies [8c06293]
- Updated dependencies [05af1d4]
- Updated dependencies [4adcf24]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
- Updated dependencies [dbf5631]
- Updated dependencies [757eedf]
  - @nocobase/app-cli@1.0.0-beta.6
  - @nocobase/app-plugin-authorization@0.2.0-beta.20
  - @nocobase/app-plugin-scheduler@0.1.0-beta.9
  - @nocobase/app-server@1.0.0-beta.27
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/app-client@1.0.0-beta.21
  - @nocobase/logging@0.1.0-beta.6
  - @nocobase/queue@0.1.0-beta.7
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.27

### Patch Changes

- c8ddd7d: Consolidate the authorization API. Resource types are either catalog types (`settings`, `composite`, `database.collection`), whose items and actions must be registered, or record types (`page`, `user`, `notification`, `hub.app`, `hub.host`), which declare type-level actions and judge each record; there are no `*` items. Business resources become composite resources, a built-in core mechanism: every Authorization has `authz.compositeResources` (which replaces `authz.business`) and reserves the `composite` resource type, so `businessPlugin()` is gone with no replacement and `resourceTypes.add({ type: 'composite' })` throws; `defineBusinessResource` is `defineCompositeResource`, every `Business*` type is `CompositeResource*` (`CompositeResource`, `CompositeResourceBuilder`, `CompositeResourceActionBuilder`, `CompositeResourceReference`, `CompositeResourceConditions`, `CompositeResourceApi`, `BindableCompositeResourcePermission` and so on) and the grant policy is `{ type: 'composite', scopes }`. Resource types carry no `title`: they are never displayed, and the library holds no translation keys. A composite composes exactly the grants its definition lists, on any type except another composite. A data scope no longer names a `collection`: it targets the one resource its grant actions address (`dataScopeTarget(action, key)`), whose type must declare `recordAccess: true` on `resourceTypes.add`, as `database.collection` does; `define` checks this when the type is registered, and `authz.compositeResources.validate()` and first use check types registered later. The library holds no display concepts. `@nocobase/app-plugin-authorization` provides `authz.ui`, also exposed to plugin setup contexts: `ui.sections.add` for the top-level sections `pages`, `business` and `administration` and one level of subsections (with `extend: true` for a subsection another plugin owns, as workflow owns `automation` and scheduler extends it), `ui.groups.add` for right-side groups, `ui.place(ref, { section, group? })`, and `ui.defaultSection(type, section)`. `pagesPlugin` registers the `pages.page` subsection, the only one the client fills, from its route tree. The client no longer remaps the `@nocobase/authorization` namespace. `authz.settings.add` no longer takes `section`; settings items and composites are placed with `authz.ui.place`, and unplaced ones land in their type's default section "Other". Startup validation runs after every provider has booted and reports unknown subsections and groups, placements of unregistered resources and unfit data scopes, throwing in development and logging a warning in production. A resource holds at most one default-access rule: the table is unique on `(resourceType, resourceId)` as well as `key`, and a second rule raises `DefaultAccessConflictError`, answered with 409. `authorizationToken` is the only service token: `permissionSetsToken` is gone, `authz.db` is now `authz.database`, settings items are registered with `authz.settings.add` and checked with semantic actions, and rule plugins build on `@nocobase/app-plugin-authorization/server/extension`. The client exposes `AuthorizationClient.snapshot/revision/invalidate/onInvalidated` and renamed management components. Every client page route must now declare `authz` (a check or `'skip'`); nothing is inferred from the route name. The authorization migrations and seeds were edited in place, including the new `key` column on default-access rules, so existing databases must be reset and reinstalled. A stored composite grant that no longer expands — an unknown action or data scope, an invalid scope value or policy — is skipped for that grant alone instead of failing every check of the identity: it permits nothing, a direct check of its action denies with `INVALID_GRANT`, and `createAuthorization({ onInvalidGrant })` is told once, which the application plugin logs; `authz.compositeResources.validateGrant` explains a stored grant, and the plugin's startup validation scans every stored Permission Set, throwing in development and warning in production. `authz.database.collections.add` treats a re-registration with the same actions as a no-op even when its title or description differ, keeping the first and reporting a startup warning through `collections.warnings()`; only different actions throw. `authz.resourceTypes.get(type).items.add(item)` remains the generic low-level item registration that `settings.add`, `database.collections.add` and `compositeResources.define` build on.
- Updated dependencies [f6c3cd8]
- Updated dependencies [c8ddd7d]
- Updated dependencies [f3917b6]
- Updated dependencies [0b37436]
- Updated dependencies [d18e964]
- Updated dependencies [0231d46]
  - @nocobase/app-server@1.0.0-beta.26
  - @nocobase/app-client@1.0.0-beta.20
  - @nocobase/app-plugin-authentication@1.0.0-beta.23
  - @nocobase/app-plugin-authorization@0.2.0-beta.19
  - @nocobase/app-plugin-scheduler@0.1.0-beta.8

## 0.1.0-beta.26

### Patch Changes

- Updated dependencies [cda1175]
- Updated dependencies [e286e0d]
- Updated dependencies [808bf34]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [80ef702]
  - @nocobase/app-plugin-authentication@1.0.0-beta.21
  - @nocobase/app-plugin-authorization@0.2.0-beta.18
  - @nocobase/app-server@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.15
  - @nocobase/app-plugin-scheduler@0.1.0-beta.7
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/queue@0.1.0-beta.7
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/nb3-cli@1.0.0-beta.11

## 0.1.0-beta.25

### Patch Changes

- 2ae6b2b: Say what to do when a workflow's enabled hash is missing from the production build. `Workflow Artifact <key>/<hash> is missing` now explains that the database still points at an earlier build's hash and that the deployed version has to be enabled by its new hash, through **Enable new version** in workflow management or the enable route, because enabling by workflow id keeps the missing hash.
- Updated dependencies [8f1ead4]
- Updated dependencies [77d34b6]
- Updated dependencies [ffafc2a]
- Updated dependencies [a1a8690]
  - @nocobase/db@1.0.0-beta.14
  - @nocobase/app-server@1.0.0-beta.24
  - @nocobase/app-plugin-authentication@0.1.0-beta.20
  - @nocobase/app-plugin-scheduler@0.1.0-beta.6

## 0.1.0-beta.24

### Patch Changes

- 4ffcbc2: Align workflow and schedule management pages with the standard page container, heading typography, and spacing used by other settings pages.
- c3fb653: Require the workflow manage permission for all management HTTP APIs and page entry points. Return localized HTTP 403 responses for unauthorized users while preserving root access. Existing read grants must be explicitly replaced with manage grants by an administrator.
- Updated dependencies [4ffcbc2]
- Updated dependencies [43592e9]
- Updated dependencies [43592e9]
  - @nocobase/app-plugin-scheduler@0.1.0-beta.5
  - @nocobase/app-plugin-authentication@0.1.0-beta.19
  - @nocobase/app-plugin-authorization@0.2.0-beta.16
  - @nocobase/db@1.0.0-beta.12
  - @nocobase/app-server@1.0.0-beta.22

## 0.1.0-beta.23

### Patch Changes

- 4694f66: Require meaningful descriptions for every node in workflow authoring guidance and update the DSL examples.

  Suggest summarizing the latest DSL change and its reason in the workflow description, replacing any previous change note while preserving the workflow purpose.

- 4b3bcfe: Use standard switch sizing, consolidate version comparison headings, center unobstructed connector bends, and restore blue new-version badges.
- Updated dependencies [4b3bcfe]
  - @nocobase/app-plugin-scheduler@0.1.0-beta.4

## 0.1.0-beta.22

### Minor Changes

- c175bef: Add per-revision comparison actions in the workflow version dropdown, opening side-by-side workflow version comparison with node additions, removals, definition and connection changes, and field-level details for published and unpublished revisions.

## 0.1.0-beta.21

### Patch Changes

- 64b3fdb: Remove Refine from client authorization checks. Use `AuthorizationClient.can({ resource, action })` instead of the removed two-argument signature, and import `useCan` from `@nocobase/app-plugin-authorization/client`. Migrate page guards, navigation, and notification visibility while preserving session isolation and realtime permission invalidation.

  Remove the Refine access-control configuration and legacy global authorization client accessors. Resolve the application-owned client through `useAuthorizationClient()` or `authorizationClientToken`. Settings actions now revoke stale access immediately; route checks no longer bypass the authorization page or translate Refine CRUD action names.

  Unify route authorization under `authz: 'skip' | { resource: { type, id }, action }`. Normalize default rules during registration and share them across page guards, navigation, permission discovery, and inspection. Remove the legacy `access` field and string resource adapter.

  Limit settings action checks to the actions each page uses, keep the permission-set action helper internal, and avoid rebuilding navigation twice when selecting a route.

- 64b3fdb: Align workflow and scheduler route paths with their current pages while preserving page authorization, including nested workflow tabs. Remove duplicate development declarations for dependencies already required by the examples and hub server runtimes.
- 0f17c1b: Complete English and Chinese translations for workflow canvas controls and inspector statuses, and scheduled task target types, pending status, and execution reasons.
- 64b3fdb: Move workflow and schedule settings and detail routes to the read actions of system administration resources, grouped under Automation, instead of ordinary page permissions.
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [fe564d9]
- Updated dependencies [fe564d9]
- Updated dependencies [64b3fdb]
- Updated dependencies [0f17c1b]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/app-plugin-authorization@0.2.0-beta.15
  - @nocobase/app-server@1.0.0-beta.21
  - @nocobase/app-plugin-scheduler@0.1.0-beta.3
  - @nocobase/queue@0.1.0-beta.7
  - @nocobase/app-plugin-authentication@0.1.0-beta.18
  - @nocobase/db@1.0.0-beta.11
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/nb3-cli@1.0.0-beta.9

## 0.1.0-beta.20

### Patch Changes

- 9628cdd: Improve workflow and scheduler management pages with consistent layouts, filters, tables, and switches. Keep page layout and UI components local to their owning plugins, and align authorization pages with the same layout conventions.

  Normalize workflow and execution URLs under `/settings/workflow` and scheduler URLs under `/settings/schedules`, retaining the automation menu group without adding it to URLs. Update scheduler target links and the examples homepage entry. Use bookmarkable workflow/run child routes, preserve queries and browser history, and link execution detail titles to their workflow.

  Improve the workflow execution canvas with reorganized run controls, fullscreen viewing, terminal edge markers, direct empty-branch connections, and theme-aware styling. Unify node dialogs with consistent titles and close controls, collapsible descriptions, execution results and status colors, and explanatory states for unexecuted nodes.

- 7542686: Save condition nodes as resolved before executing their selected branch, preserving their results when branches wait, fail, or terminate the workflow.

  Remove the nextKey instruction result and execution summary fields. Ordinary execution follows the node graph's downstream link; branching instructions transfer execution directly to their selected branch.

- Updated dependencies [c84bfe8]
- Updated dependencies [e9da3c2]
- Updated dependencies [9628cdd]
  - @nocobase/db@1.0.0-beta.11
  - @nocobase/app-server@1.0.0-beta.20
  - @nocobase/app-plugin-scheduler@0.1.0-beta.2
  - @nocobase/app-plugin-authentication@0.1.0-beta.18

## 0.1.0-beta.19

### Patch Changes

- e13ed84: Preserve structured workflow context alongside queued run return values when integrating scheduled execution. Route terminal observer failures and registered queue jobs through application loggers while retaining committed workflow outcomes.
- e13ed84: Persist per-deployment phase and failure logs and expose application runtime logs in Hub with scoped access, incremental reading, retention, and independent file and console outputs.

  Unify runtime logging configuration and source routing, merge default outputs into app files, connect workflow diagnostics with execution identities, and preserve legacy configuration and historical log readability.

  Enforce hosted capture policy, declare the Host server runtime peer, merge paged source logs chronologically with bounded opaque cursors, and preserve correlation and error details when truncating oversized records. Handle expired scans explicitly in the Hub viewer and downloads.

  Route HTTP request logs to separate request files by default in all application templates.

- 25cf9f6: Return manual workflow runs after persistence without waiting for node completion and show submission feedback before navigating to the execution record.
- 49a7890: Yield workflow execution before running script nodes in the background, then resume the persisted node attempt with its result. Preserve error propagation, timeout cancellation, and graceful shutdown draining.
- Updated dependencies [e0c4b3d]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [00362cf]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
  - @nocobase/app-plugin-scheduler@0.1.0-beta.1
  - @nocobase/queue@0.1.0-beta.6
  - @nocobase/db@1.0.0-beta.10
  - @nocobase/app-server@1.0.0-beta.19
  - @nocobase/logging@0.1.0-beta.5
  - @nocobase/app-plugin-authentication@0.1.0-beta.18
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/nb3-cli@1.0.0-beta.9

## 0.1.0-beta.18

### Minor Changes

- 26ac480: Add code-defined Cron scheduling with timezone support, transactional synchronization, and stable schedule identities. Applications and plugins register schedules with `SchedulerService.defineSchedule(definition)` and execution targets with `registerTarget()` during provider registration or boot.

  Route scheduled jobs and workers through the application's configured logical queue, with an adapter-neutral schedule store. Keep the upstream queue dependency unmodified and store queue and scheduler timestamps compatibly with their adapters while preserving absolute instants.

  Move queue storage migrations from Scheduler into the queue library, which resolves configured database connections and physical tables. Assemble these sources centrally in app-server for startup and CLI commands, rejecting overlapping active queue tables before execution. Support immutable target parameters, shared migration history and locks, upstream-compatible physical schemas, and read-only execution conditions that leave skipped migrations unapplied.

  Track idempotent occurrences through the target's final outcome, including asynchronous Workflow completion and recovery with stable run references. Target registration returns a completion-reporting handle scoped to that target; long-running executions can report completion without a fixed scheduler observation timeout.

  Provide an authorized, read-only schedule management page and API with paginated schedules, trigger counts, execution history, and separate schedule and execution statuses. Register `pnpm nocobase schedule sync` as a global CLI command and integrate it into all application templates.

  Include application examples for custom task targets and scheduled Workflows, and agent guidance for schedule definition, target selection, asynchronous execution, diagnostics, and recovery.

  Keep the database manifest CLI entry available before compilation so fresh workspace installs link the command required by package builds.

  Declare the OpenTelemetry dependencies referenced by the upstream queue declarations so consumers can typecheck published Server APIs without enabling tracing or skipping library checks.

### Patch Changes

- Updated dependencies [d4ca00e]
- Updated dependencies [60fa139]
- Updated dependencies [24e771f]
- Updated dependencies [60fa139]
- Updated dependencies [26ac480]
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/app-plugin-authentication@0.1.0-beta.17
  - @nocobase/db@1.0.0-beta.9
  - @nocobase/app-plugin-scheduler@0.1.0-beta.0
  - @nocobase/queue@0.1.0-beta.5
  - @nocobase/app-server@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/nb3-cli@1.0.0-beta.9

## 0.1.0-beta.17

### Patch Changes

- 6acf3bc: Use plugin-owned PageContainer components to unify settings page width, spacing, and responsive padding across database exploration, user management, API keys, workflows, and notification logs.

  Use plugin-owned PageHeader components for consistent titles, descriptions, and page actions while preserving permission checks and workflow detail navigation.

  Preserve spacing below workflow tabs and wrap workflow list filters and actions on narrow screens.

  Restore spacing between workflow detail back links and headings, and keep execution duration cells aligned when table rows grow.

- 89955c5: Upgrade better-sqlite3 to ^13.0.3 and keep its dependency declaration in @nocobase/db-sqlite only. Remove redundant test dependencies from consumers so they use the same SQLite driver as applications.

  Preserve the bundled musl binary when building applications for Alpine Linux.

- Updated dependencies [89955c5]
  - @nocobase/app-plugin-authentication@0.1.0-beta.15
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/db@1.0.0-beta.7

## 0.1.0-beta.16

### Patch Changes

- 7c0ec03: Document custom workflow Instruction APIs with a complete checker, artifact build, and asynchronous runtime registration example. Clarify command entry points and use config.yml in workflow skill configuration guidance.
- 7c0ec03: Recommend filling in workflow node descriptions to explain their operations and business purpose in the workflow authoring skill.

## 0.1.0-beta.15

### Patch Changes

- 63db898: Move concrete database connection types into their owning dialect packages and keep the core connection contract independent of installed dialects. Import `SqliteConnectionConfig`, `PostgresConnectionConfig`, `MysqlConnectionConfig`, `OracleConnectionConfig`, and `MssqlConnectionConfig` from the corresponding `@nocobase/db-<dialect>` package instead of `@nocobase/db`.

  `ConnectionConfig` and the default `DatabaseConfig` and `AppDatabaseConfig` now describe the common runtime contract. For strict configuration checking, supply a concrete connection type or use `DatabaseConfigFromDrivers` and `AppDatabaseConfigFromDrivers`. The core also exports `DriverConnectionConfig` and `ConnectionConfigFromDrivers` for reusable driver inference. Preserve mutually exclusive host and socket targets in MySQL and OceanBase configuration and factory options.

- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.
- 1a85a86: Add breadcrumb labels to plugin routes so nested pages show their navigation path.
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [a60decd]
- Updated dependencies [1a85a86]
- Updated dependencies [1c70f60]
- Updated dependencies [63db898]
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/db@1.0.0-beta.7
  - @nocobase/app-plugin-authentication@0.1.0-beta.14
  - @nocobase/app-client@1.0.0-beta.16
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/queue@0.1.0-beta.3
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/nb3-cli@1.0.0-beta.7

## 0.1.0-beta.14

### Minor Changes

- f17f3a6: Provide editable TypeScript defaults for application modules, assembled by the runtime before services start. Module factories receive the runtime with application paths and plugin metadata; deployment files and environment variables override defaults, and configuration reload preserves code defaults.

  Keep deployment settings in YAML examples and reserve explicit environment overrides for secrets and startup integration. Simplify application configuration loading, merging and reload subscriptions.

  Align client configuration assembly with the server: runtime merges application TypeScript defaults beneath public configuration before services start. Client inspection reports the application configuration entry.

- 027d13d: Let a candidate workflow revision be read before it is enabled

  A deployed Artifact only becomes a revision row when something enables or runs it, and `revisions()` listed rows. So the version picker on a workflow's page offered only the revision already running, and the candidate revision reported next to it as `pendingArtifact` had no entry at all: the only way to see what the new version contained was to press "Enable new version", which is precisely the decision the reading was meant to inform.

  `revisions()` now also returns any deployed Artifact for that key with no row yet, addressed by its Artifact hash with a null id and a null version. Reading one writes nothing — `GET /workflows/<hash>` already resolves an unmaterialized Artifact from discovery — so a candidate revision can be opened, read, and left alone.

  The picker on the page follows: it lists the candidate as "Unpublished" and loads its options with the definition rather than when the picker is opened, because a native select renders its options as the popup opens and options arriving later stay invisible until the next open. A revision another revision has superseded is marked as not the running version and offers "Enable this version" in place of the enable/disable switch, which describes swapping the running version rather than turning the workflow off and on. The "New version available" badge in the workflow list links to the candidate as well.

  `GET /workflows/<hash>` for an unmaterialized Artifact also reports the execution count for its key, which it previously reported as zero while every other revision of the same workflow reported the real count.

- 72ed008: Store run and node-run timestamps as instants, so durations stop reporting a whole time-zone offset

  Every timestamp on a run and a node run was declared `datetime`, the zone-free type, while the engine wrote UTC instants through `database.query()` — the query builder, which is deliberately not Collection metadata aware and hands values straight to the driver. On PostgreSQL the offset was dropped on the way in and a `Date` was rebuilt in the host's zone on the way out, so a value moved by the host offset on every round trip; on MySQL the write was rejected outright.

  `startedAt` was written, read back, and written again when the node finished, while `finishedAt` was written fresh, so the pair ended up a full host offset apart and a node that ran for three milliseconds reported about 28800 seconds.

  The columns are now `datetimeTz`, and the engine persists through Repositories instead of the query builder. That is the layer that reads Collection metadata, so it already knows what `datetimeTz` costs on each database and formats these columns at the SQL boundary — no driver decodes a timestamp in either direction. A run's instants are consequently written and read as canonical `YYYY-MM-DDTHH:mm:ss.sssZ` strings on every dialect, with no dialect branch in the plugin and no connection option a deployment has to set.

  A migration converts the columns, reading the existing zone-free values as the UTC they were written as. It cannot repair history: on an affected PostgreSQL deployment a node run's stored `startedAt` already carries an extra offset that nothing recorded, so runs from before the upgrade keep their reported duration. Runs created afterwards are correct.

  Two fixes came with the move. A node run is now read back from the insert that wrote it rather than by re-selecting the newest row for that node, which two processes running the same execution could get wrong. And the per-workflow and per-revision execution counters are upserts with a database-side increment rather than a read followed by a write, so concurrent triggers of one workflow can no longer lose a count.

### Patch Changes

- 027d13d: Render boolean workflow parameters with a Switch in the parameter settings dialog.
- ceb356b: Fix published package metadata and database test driver registration.
- 027d13d: 将工作流管理页面调整为“工作流”和“执行记录”两个 Tab，并保留自动化分组菜单入口。
- 027d13d: Clarify that Run node timeout options are not enforced independently and document the supported workflow-level timeout.
- 027d13d: Convert the workflow and execution-record list pages to standard table layouts for clearer, more consistent list interactions.
- 0867612: 完善 Workflow Skill，补充自定义 Instruction（发邮件节点）的完整注册、检查、Artifact 构建与运行示例，并统一 workflow check 命令和 config.yml 配置说明。
- 027d13d: Style workflow list refresh actions as standard outline buttons for clearer feedback.
- 027d13d: Move the workflow list's new-version tag below the workflow name.
- Updated dependencies [ceb356b]
- Updated dependencies [f17f3a6]
- Updated dependencies [f17f3a6]
- Updated dependencies [f17f3a6]
- Updated dependencies [43d25b4]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [40e2d49]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [590861e]
- Updated dependencies [e11b855]
- Updated dependencies [72ed008]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [e11b855]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [e11b855]
- Updated dependencies [ceb356b]
- Updated dependencies [40e2d49]
- Updated dependencies [590861e]
- Updated dependencies [ceb356b]
- Updated dependencies [bf0f05b]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
  - @nocobase/app-server@1.0.0-beta.11
  - @nocobase/app-client@1.0.0-beta.14
  - @nocobase/app-plugin-authentication@0.1.0-beta.11
  - @nocobase/db@1.0.0-beta.5
  - @nocobase/logging@0.1.0-beta.4
  - @nocobase/nb3-cli@1.0.0-beta.7

## 0.1.0-beta.13

### Minor Changes

- e9f796d: Register the Artifact build as a CLI hook instead of relying on the application's build script

  `pnpm build` and `pnpm dev` pick up the workflow Artifact build from this plugin, so an application gets it by installing the plugin rather than by carrying the step in its own scripts. The commands and their output are unchanged.

- aa7420a: Load workflow definitions from source in development instead of from built Artifacts.

  A development server previously saw only what `nocobase workflow build` had written to `dist/server/workflows`, so `pnpm dev` ran that build on every start and an edited `workflow.ts` needed a manual rebuild and a restart before it could be listed, enabled, or triggered. The loader now compiles the workflow source root on demand whenever the runtime is not production, skipping the work while the tree is unchanged, and the plugin no longer registers a `beforeDev` CLI hook, so `pnpm dev` runs no workflow build. The `afterServerBuild` hook is unchanged: a deployment still reads committed Artifacts.

  The definition it produces is what a build produces: the same schema validation, semantic validation, flat IR compilation, resource collection, and content-addressed digest, so the revision enabled in development is the revision the build later ships. What it drops is `ts.createProgram`, which the application's own typecheck already covers, and the disposable evaluation process a server running under a TypeScript loader does not need — together the difference between seconds and milliseconds. Development validates against the instruction set the engine executes with rather than the core set alone, and a key that exists only under `dist/server/workflows` is still offered, with source winning for a key present in both. A production runtime is unchanged: it reads built Artifacts and never loads the compilation path.

  Starting a run no longer requires an Artifact store entry in development. The engine has always resolved development run modules from the source package and never from the store, so the store was the wrong precondition there; it is now the source package that must be present, and production still requires the committed Artifact for the revision's digest.

  `nocobase workflow check <package> --ir` prints the compiled flat IR, the definition an Artifact carries, for reading a workflow outside a running server.

### Patch Changes

- Updated dependencies [a009e2d]
- Updated dependencies [e9f796d]
  - @nocobase/app-server@1.0.0-beta.10
  - @nocobase/app-client@1.0.0-beta.13
  - @nocobase/i18n@1.0.0-beta.3
  - @nocobase/nb3-cli@1.0.0-beta.6

## 0.1.0-beta.12

### Patch Changes

- eb3bc38: Align catalog-managed peer dependency ranges with the workspace catalog.
- Updated dependencies [e3fa827]
- Updated dependencies [c3e02bf]
- Updated dependencies [0a3fa83]
- Updated dependencies [1d042c0]
  - @nocobase/app-server@1.0.0-beta.9
  - @nocobase/app-plugin-authentication@0.1.0-beta.10
  - @nocobase/app-client@1.0.0-beta.12
  - @nocobase/db@1.0.0-beta.4

## 0.1.0-beta.11

### Patch Changes

- 52d1107: Resolve the shared UI packages through the workspace catalog: `@base-ui/react`, `class-variance-authority`, `clsx`, `lucide-react`, `shadcn`, `tailwind-merge`, and `tw-animate-css`.

  Every package already agreed on one version for each of these — the catalog is what keeps them agreeing. A range edited in one manifest and not the others would otherwise put two copies of a UI primitive into an application's bundle, which is the kind of drift nothing reports until a component behaves differently depending on which plugin rendered it.

  Peer dependencies use `catalog:` too. `pnpm pack` resolves it before publishing, so a consumer still reads an ordinary range.

- 52d1107: Declare the packages each plugin's browser code imports as peer dependencies, so an application that installs the plugin can resolve them while a server deployment installs none of them.

  A plugin's `client/` is not bundled by the plugin: `build` is `tsc`, so `dist/client/*.js` keeps its bare imports and the consuming application's Vite build resolves them. That application has only what the published manifest declares, and npm does not publish `devDependencies` — so a client import declared only there fails with `Could not resolve "…"`. `sonner` and `@xyflow/react` both shipped that way. Ten of these plugins appeared to work only because `app-template-default` happened to declare the same package for its own use; `@nocobase/app-plugin-hub`'s CodeMirror imports had no such coincidence and were unresolvable wherever it was installed.

  Peer dependencies are what satisfy both sides. An application installs one shared copy, and a deployment — which sets `autoInstallPeers: false` — installs none, so packages a server never requires stay out of it. Each keeps a matching devDependency so the workspace still resolves it and the version used here stays pinned. None is marked `optional`: an optional peer is not auto-installed anywhere, including in the application that needs it.

  `create-plugin` emits the same shape and its generated `AGENTS.md` teaches it, so a plugin created tomorrow declares its browser packages as peers rather than repeating the mistake.

- 52d1107: Declare each peer dependency once, dropping the devDependency that used to accompany it.

  The pairing was required on the grounds that a peer range is wide enough for development to drift off this repository's copy. It is not: pnpm installs a peer and links it into the plugin's own `node_modules`, resolving `workspace:^` to the same package `workspace:*` would. A plugin with the devDependency removed still links, typechecks, builds, and tests against it — verified against a clean install with every plugin's `node_modules` deleted first.

  What remained was a second declaration that changed nothing and had to be kept in step with the first. `pnpm peers:check` no longer asks for it, and `create-plugin` no longer emits it.

- Updated dependencies [52d1107]
- Updated dependencies [52d1107]
- Updated dependencies [52d1107]
  - @nocobase/app-plugin-authentication@0.1.0-beta.9

## 0.1.0-beta.10

### Minor Changes

- 008969c: Contribute Workflow check and build commands through the application's unified `nocobase workflow` CLI topic, including structured JSON output, and register the commands in both application templates.

### Patch Changes

- 435e0df: Keep workflow management status aligned with the current runtime revision when a newer Artifact is deployed, and expose the pending Artifact separately for explicit enablement.
- 5723210: Refine the published Workflow Skill to select durable business lifecycles precisely, separate orchestration from typed business code, document public recovery and custom Instruction validation boundaries, and cover implicit Skill selection in isolated evaluations.
- Updated dependencies [d29d1fe]
- Updated dependencies [ec576ba]
- Updated dependencies [67907ec]
- Updated dependencies [5281fd1]
  - @nocobase/app-server@1.0.0-beta.8
  - @nocobase/nb3-cli@1.0.0-beta.5
  - @nocobase/drive@0.1.0-beta.4
  - @nocobase/app-plugin-authentication@0.1.0-beta.8
  - @nocobase/app-client@1.0.0-beta.11
  - @nocobase/db@1.0.0-beta.3
  - @nocobase/i18n@1.0.0-beta.2
  - @nocobase/queue@0.1.0-beta.3
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.9

### Patch Changes

- 9536bf5: Restore the client dependencies an installed application needs to bundle the workflow canvas and the Sonner-backed notification provider. A plugin's `client/` is compiled by the consuming application's Vite build and its `dist/client` keeps bare imports intact, so a package declared only as a `devDependency` is absent once the plugin is installed from the registry rather than linked from this workspace: `pnpm dev` failed with `Could not resolve "@xyflow/react"` and `Could not resolve "sonner"`. Move `@xyflow/react` back into the workflow plugin's `dependencies`, and declare `sonner` in both application templates.
- Updated dependencies [0e9505a]
- Updated dependencies [9536bf5]
- Updated dependencies [9536bf5]
  - @nocobase/app-plugin-authentication@0.1.0-beta.8
  - @nocobase/drive@0.1.0-beta.3
  - @nocobase/app-client@1.0.0-beta.11

## 0.1.0-beta.8

### Minor Changes

- db6685f: Replace the run module's Application runtime access with execution options containing a read-only service resolver, abort signal, and contextual logger, so scripts can consume public application services without accessing or mutating the Application container.

### Patch Changes

- 90a4903: Replace the composite application transport with application-owned `ApiClient` and `RealtimeClient` services. Client plugins, examples, and application templates now use object-style HTTP request options through the shared API client, while realtime subscriptions resolve their dedicated WebSocket client.
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [a864497]
- Updated dependencies [a864497]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
  - @nocobase/db@1.0.0-beta.3
  - @nocobase/app-server@1.0.0-beta.7
  - @nocobase/app-client@1.0.0-beta.10
  - @nocobase/app-plugin-authentication@0.1.0-beta.7

## 0.1.0-beta.7

### Patch Changes

- 15c77a6: Move Workflow source parsing and Artifact generation behind the `workflow build` command while retaining the public build API for applications with custom Instructions. The command uses Node's native TypeScript loading in a disposable process and removes esbuild entirely. CLI build modules remain in the published package, but production servers do not load them or TypeScript at runtime.
- fe9ad59: Add complete English and Chinese translations for workflow management, canvas controls, status and dialog copy, navigation, accessibility labels, and request-localized API errors.
- b446b6a: Validate and route workflow definition IDs and Artifact hashes before querying the database.
- 15988a2: Teach and verify workflow authoring under the application's `isolatedDeclarations` server typecheck: bind `defineWorkflow()` to a `WorkflowSourceAst`-annotated const before default-exporting it instead of default-exporting the call directly, and compile the skill-eval workflow fixtures under that contract in `pnpm typecheck`. Also drop the stale `.agents` entry from the published `files` allowlist — the workflow skill ships under `skills/` and the plugin has no `.agents` directory.

## 0.1.0-beta.6

### Minor Changes

- 4243eb0: Add a terminate instruction that can finish a workflow early from the main path or a conditional branch, with success and failure outcomes and a distinct termination icon.

### Patch Changes

- 813da59: Declare browser-only packages as devDependencies rather than dependencies, and make `react-i18next` an optional peer of `@nocobase/i18n` provided by `@nocobase/app-client`. Client code is bundled by the consuming application, so these entries did nothing for the bundle while `dist/package.json` pulled every one of them into the server deployment to be installed and never required.
- 4243eb0: Reload workflows after status changes, open manual runs on their execution canvas, and keep descriptions out of canvas node cards.
- 4243eb0: Render each empty workflow condition branch as a distinct path before it rejoins the common successor.
- 4243eb0: Show workflow node descriptions in canvas dialogs and execution detail dialogs, with a subtle borderless disclosure for descriptions in execution records.
- 4243eb0: Add a theme-aware canvas control for switching between compact vertical and horizontal workflow layouts, adapt the zoom controls and minimap to light and dark themes, route edges with ELK orthogonal paths, preserve condition branch order, and merge converging edges at their successor input port.
- 813da59: Declare `typescript` as a runtime dependency. `server/loader/source-parser.ts` imports it and the engine reaches that module through a static import chain, so a deployed application crashed on start with `Cannot find package 'typescript'` while every development checkout resolved it from devDependencies.
- Updated dependencies [8d88ff4]
- Updated dependencies [43d5bf0]
- Updated dependencies [813da59]
- Updated dependencies [cee3251]
  - @nocobase/app-server@1.0.0-beta.6
  - @nocobase/app-client@1.0.0-beta.9
  - @nocobase/i18n@1.0.0-beta.2
  - @nocobase/app-plugin-authentication@0.1.0-beta.6
  - @nocobase/db@1.0.0-beta.2
  - @nocobase/queue@0.1.0-beta.3
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.5

### Minor Changes

- 4736903: Narrow the Workflow server entry to its registration definition and supported cross-plugin contracts, keep implementation details package-internal, and load extensionless run module specifiers from package-relative resources produced by the application's default server build without an artifact manifest mapping.

### Patch Changes

- Updated dependencies [68a4e26]
  - @nocobase/app-client@1.0.0-beta.7
  - @nocobase/app-plugin-authentication@0.1.0-beta.5

## 0.1.0-beta.4

### Minor Changes

- 174eab5: Consolidate the browser packages into `@nocobase/app-client`.

  `@nocobase/app-sdk` is gone; its API client now lives in `@nocobase/app-client` and is imported from there. `@nocobase/app-portal-sdk` is deprecated and keeps only what still has consumers: `NocoBaseClient` and the runtime configuration it reads, which exist to reach a v2 NocoBase server, and the route surface containers under `/routing`. Its ACL, auth, data, extension, i18n, and system-settings modules are removed, as is the route tree that `/routing` used to export alongside the surfaces.

  `@nocobase/app-client` gains `resolveAppBase()`, which reports the path the application is mounted at.

  Four plugins built their API client at import time instead of resolving it from the application's service container, so they could not see `api.baseURL` from the application configuration. They now resolve it, which means an application that configures a base URL gets one client rather than two that disagree.

  The injected browser global `NOCOBASE_PORTAL_BASE` is renamed to `APP_BASE_PATH`. Its value has always been the `APP_BASE_PATH` environment variable, and the old name grouped it with the settings that address a v2 NocoBase server. Those keep their names. A client and the server that serves it must be upgraded together.

  `@nocobase/app-plugin-data-provider` is removed. It forwarded the Portal data provider, and applications built on the current client runtime do not use it.

  The Hub template is rebuilt from the default template and now runs the same client and server stack as every other v3 application. Its `/api/apps` endpoint and its v2 API proxy are gone, so a hub's `.env` no longer configures them.

  The Portal SDK's template compatibility check is removed with the rest: it had been disabled behind a constant, and its install script cost every generated project a `pnpm-workspace.yaml` `allowBuilds` entry it did not need. `createPortalViteConfig` no longer takes the plugin that injected it.

- 1527426: Declare identity-sensitive runtime packages as peer dependencies of every plugin.

  A plugin used to list `@nocobase/app-server`, `@nocobase/db`, `@nocobase/service-provider`, `@nocobase/i18n`, `@nocobase/queue`, `@nocobase/app-portal-sdk`, and the plugins it builds on among its `dependencies`. Each of these carries state that only works while exactly one copy of the module exists in the process: `ServiceContainer` keys its bindings by the token object itself, React contexts match only the provider created from the same module, and `@nocobase/queue` registers job classes into a global `Locator`. A `dependencies` range lets a package manager install a second copy to satisfy it, which splits that state.

  The monorepo could never show the problem, because `workspace:` links every consumer to one directory. It appears once a plugin is installed from a registry into an application, and it appears at runtime rather than at install time: a service that is registered reports `Service "..." is not registered`, or a context reads `undefined` under a mounted provider.

  Each of these packages is now a peer dependency paired with a devDependency. The peer is the published contract that makes the installing application provide the single copy; the devDependency pins this repository's copy for development and tests, which the deliberately wide peer range does not. Applications built from the templates are unaffected — they already install every one of these packages directly, which is what satisfies the new peer ranges.

  `pnpm plugin:create` generates the same shape, and `pnpm peers:check` enforces it in CI.

### Patch Changes

- 9886667: Keep the Workflow CLI available from its TypeScript entry in an unbuilt source workspace while published installations continue to execute compiled output, and expose its checker errors through the public build entry.
- Updated dependencies [174eab5]
- Updated dependencies [ab7b341]
- Updated dependencies [1527426]
- Updated dependencies [174eab5]
  - @nocobase/app-client@1.0.0-beta.6
  - @nocobase/app-server@1.0.0-beta.4
  - @nocobase/app-plugin-authentication@0.1.0-beta.5
  - @nocobase/db@1.0.0-beta.2
  - @nocobase/i18n@1.0.0-beta.1
  - @nocobase/queue@0.1.0-beta.3
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.3

### Minor Changes

- ac3f033: Replace aggregated application configuration objects and config factories with typed module-owned configuration definitions. Applications now compose defaults, file providers, environment layers, validation, explicit reloads, and subscriptions through `AppConfig`, while providers read their configuration through `app.config.get(definition)`.
- ac3f033: Export every server plugin from its package's `./server` entry point, and update application composition, plugin discovery, and generated plugins to use the unified entry point.

### Patch Changes

- 78cf0a2: Generate runtime-aware TypeScript, ESLint, Node engine, and development dependency configuration for Client-only, Server-only, and full-stack plugins, including stable package-scoped Queue Job identities.

  Keep plugins aligned with the Agent development contract by giving Queue, System Information, and Workflow Routes path-scoped authentication, documenting the Queue API path and Database declaration source accurately, and storing example tests under each plugin's root test directory.

- fb1a752: Unify Client and Server application composition around the explicit `serviceProviders` contribution and rename Client React tree contributions to `reactProviders`.

  Replace Client bootstrap modules with application-owned ServiceProvider lifecycle hooks, make the default Client start through `ClientApplication` and render through the Browser host, and update built-in plugins and runtime inspection to the new static contribution protocol.

- Updated dependencies [fb1a752]
- Updated dependencies [948304d]
- Updated dependencies [78cf0a2]
- Updated dependencies [ac3f033]
- Updated dependencies [fb1a752]
- Updated dependencies [ac3f033]
- Updated dependencies [78cf0a2]
- Updated dependencies [fb1a752]
- Updated dependencies [fb1a752]
  - @nocobase/app-client@1.0.0-beta.5
  - @nocobase/logging@0.1.0-beta.3
  - @nocobase/app-server-kit@0.1.0-beta.3
  - @nocobase/app-plugin-authentication@0.1.0-beta.4
  - @nocobase/drive@0.1.0-beta.2
  - @nocobase/queue@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.2

### Patch Changes

- b049266: Translate the built-in workflow pages, as the reference for how a plugin declares its locales and picks up its namespace.
- 7cdffbd: Replace separate API and root route arrays with one ordered `routes` contribution array. Route factories now receive the Application, create and return their own Hono router, and are mounted automatically at `/api` or the application root according to their definition.

  Standardize plugin server modules around `providers/index.ts` and `routes/index.ts` collection entries, `services/` domain implementations, and a stable `tokens.ts` public contract.

  Generated plugins now declare conventional database and queue contribution directories by default. Missing optional directories are ignored until executable migrations, seeds, or jobs are added.

  Generated plugins now include an App-facing starter Agent Skill under the package's `skills/` directory. Plugin registration and skill synchronization copy these package-owned Skills into registered applications' `.agents/skills/` directories.

  Unify Client page contributions behind one `routes` loader. Plugins now use `defineAppRoutes()` and `defineSettingsRoutes()` to add child Routes to the application's two built-in Client Routes, mirroring how Server plugins use `defineRootRoutes()` and `defineApiRoutes()` with the built-in Hono routers.

- 7cdffbd: Add explicit `server/plugin.ts` definitions for Providers, API routes, root routes, database sources, and queue jobs. Register routes in a dedicated Application phase after Provider boot, add reusable HTTP and runtime composition helpers to their owning packages, and remove the default template's duplicate runtime layer and legacy plugin discovery contract.
- Updated dependencies [b049266]
- Updated dependencies [b049266]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [ce4eab8]
- Updated dependencies [7cdffbd]
- Updated dependencies [b049266]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
  - @nocobase/app-i18n@0.0.2-beta.0
  - @nocobase/app-client@1.0.0-beta.4
  - @nocobase/app-server-kit@0.1.0-beta.2
  - @nocobase/app-plugin-authentication@0.1.0-beta.3
  - @nocobase/drive@0.0.1-beta.1
  - @nocobase/logging@0.1.0-beta.2
  - @nocobase/queue@0.1.0-beta.1
  - @nocobase/service-provider@0.0.2-beta.0
  - @nocobase/app-database@0.0.1-beta.1

## 0.1.0-beta.1

### Minor Changes

- c8f38c8: Register client plugins explicitly in the application's `client/plugins.ts` instead of discovering them from `nocobase.plugins` through a Vite virtual module.

  Each plugin now ships a `client/plugin.ts` descriptor, exported as `./client/plugin`, that declares its bootstrap, routes, providers, and route component overrides. An application composes them with `defineClientPlugins([...])`, where array order is bootstrap order and a plugin is enabled by being present. The entry is real, type-checked application source: it can be read, diffed, and edited, and Vite reloads it like any other module.

  Plugins can also accept options. `defineClientPlugin` takes an options type that reaches the bootstrap context, the routes and providers factories, and the route component overrides, so an application can pass a custom login page or a notification label at registration.

  `@nocobase/app-plugin-registry-example` only drops its now-unread `nocobase.plugin.client` manifest field; it contributes no client extensions.

- 1a9732a: Re-export the client registration factory as the default from `client/index.ts`, so an application registers a plugin by importing `<package>/client` instead of `<package>/client/plugin`. `client/plugin.ts` still defines the factory and its `./client/plugin` subpath still resolves; the barrel simply re-exports it.

  Every plugin now declares `sideEffects: false`. An application imports the barrel, which also carries types, helpers, and components, and without that declaration a bundler must assume each of those matters and keeps them in the application entry chunk. With it, importing `<package>/client` costs exactly what importing `<package>/client/plugin` cost: the entry chunk is byte-identical for all eight plugins, where before it grew by 696 bytes for authentication and 88 for file.

  The declaration was checked rather than assumed: every client module's top-level statements are pure declarations, with no global assignment and no bare `import './x.css'`. The CSS imports under `app-plugin-workflow/registry` are copied as source by `registry materialize` and never bundled through `exports`. A plugin that later introduces a module-level side effect must drop the declaration.

  `@nocobase/app-plugin-workflow` additionally points `./client` at `./client/index.ts` rather than `./dist/client/index.js`, matching every other plugin. Consuming the built output made the barrel resolve to a stale artifact, which failed the build outright.

### Patch Changes

- Updated dependencies [062f5b1]
- Updated dependencies [c8f38c8]
  - @nocobase/app-client@1.0.0-beta.3

## 0.0.1-alpha.0

### Patch Changes

- Add the Workflow application plugin with workflow authoring, build tooling,
  persistence, runtime execution, queue integration, management APIs, stable
  client routes, an application-owned Workflow Management Registry recipe, and
  the Workflow Agent Skill published with its owning plugin.
