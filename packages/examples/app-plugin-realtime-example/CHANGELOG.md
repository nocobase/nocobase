# @nocobase/app-plugin-realtime-example

## 0.1.0-beta.9

### Minor Changes

- 1952789: Add realistic realtime workflows for collaborative task boards, personal inbox synchronization, and durable background CSV exports. Reuse participant-authorized task data and existing in-app notifications, expose task invalidation and export-read contracts, and retain the technical capability lab as a secondary view.

  Store CSV export content as LONGTEXT on MySQL so files larger than 64 KiB can be saved without truncation, while retaining the existing text mapping on other databases.

- 1952789: Add an authenticated Realtime demonstration page covering public and personal topics, dynamic resource authorization, acknowledged retries, coalesced snapshot refresh, subscription errors, and connection recovery. Register the page in the examples application and retain the public native WebSocket clock.

### Patch Changes

- 1952789: Require explicitly declared realtime topics and authorize dynamic resources before subscription and delivery. Isolate the server core behind a broker contract, retain the application adapter and service tokens, and handle asynchronous publication throughout plugins and examples. Add acknowledged browser subscriptions, bounded recovery and heartbeat handling, shared React refresh helpers, original-session revalidation, transport limits, and usage documentation. The included adapter remains in-process; events are transient and clients recover by refetching after acknowledgement.
- 1952789: Ship a dedicated versioned Realtime integration Skill and references for authorization, snapshot recovery, distributed delivery, polling decisions and business verification. Include it in both application templates' direct dependencies so Skills synchronization discovers it, and document optional Redis configuration in both templates.

  Use one refresh scheduler for the Realtime business examples' initial, manual and event reads. Retry transient snapshot failures without another event, preserve trailing reads and provide low-frequency reconciliation. Forward capability-lab read failures to the shared retry policy.

- Updated dependencies [1952789]
- Updated dependencies [1952789]
- Updated dependencies [1952789]
- Updated dependencies [1952789]
- Updated dependencies [1952789]
- Updated dependencies [1952789]
- Updated dependencies [7afd595]
  - @nocobase/app-client@4.0.0-beta.0
  - @nocobase/app-plugin-authentication@2.0.0-beta.11
  - @nocobase/app-plugin-notification-example@1.0.0-beta.9
  - @nocobase/app-plugin-notification-in-app@1.0.0-beta.26
  - @nocobase/app-server@3.0.0-beta.0
  - @nocobase/i18n@2.0.0-beta.0
  - @nocobase/db@1.0.0-beta.21
  - @nocobase/jobs@0.1.0-beta.3
  - @nocobase/service-provider@0.0.2-beta.2

## 0.1.0-beta.8

### Patch Changes

- cf23bfe: Republish every package so the `latest` dist-tag points at its current beta release, matching `beta`.
- Updated dependencies [cf23bfe]
  - @nocobase/app-server@2.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.2

## 0.1.0-beta.7

### Patch Changes

- e123790: Move `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-users`, `@nocobase/app-plugin-hub`, `@nocobase/app-plugin-workflow` and `@nocobase/app-plugin-ai-employee` to the 2.0.0 prerelease line. The HTTP API migration released in 1.0.0-beta.N changed every route and the error body, but in prerelease mode a `major` changeset on a version that is already a `1.0.0` prerelease only increments the prerelease number, so nothing in the version said the change was breaking. These packages now release as `2.0.0-beta.0`, and every package that depends on or peers with one of them is released again so that its published range is `^2.0.0-beta.0` rather than a `^1.0.0-beta` range the new versions do not satisfy. An application upgrading to these versions upgrades all of them together.
- Updated dependencies [e123790]
  - @nocobase/app-server@2.0.0-beta.0

## 0.1.0-beta.6

### Patch Changes

- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [a60decd]
- Updated dependencies [63db898]
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.5

### Patch Changes

- 52d1107: Declare each peer dependency once, dropping the devDependency that used to accompany it.

  The pairing was required on the grounds that a peer range is wide enough for development to drift off this repository's copy. It is not: pnpm installs a peer and links it into the plugin's own `node_modules`, resolving `workspace:^` to the same package `workspace:*` would. A plugin with the devDependency removed still links, typechecks, builds, and tests against it — verified against a clean install with every plugin's `node_modules` deleted first.

  What remained was a second declaration that changed nothing and had to be kept in step with the first. `pnpm peers:check` no longer asks for it, and `create-plugin` no longer emits it.

## 0.1.0-beta.4

### Minor Changes

- 1527426: Declare identity-sensitive runtime packages as peer dependencies of every plugin.

  A plugin used to list `@nocobase/app-server`, `@nocobase/db`, `@nocobase/service-provider`, `@nocobase/i18n`, `@nocobase/queue`, `@nocobase/app-portal-sdk`, and the plugins it builds on among its `dependencies`. Each of these carries state that only works while exactly one copy of the module exists in the process: `ServiceContainer` keys its bindings by the token object itself, React contexts match only the provider created from the same module, and `@nocobase/queue` registers job classes into a global `Locator`. A `dependencies` range lets a package manager install a second copy to satisfy it, which splits that state.

  The monorepo could never show the problem, because `workspace:` links every consumer to one directory. It appears once a plugin is installed from a registry into an application, and it appears at runtime rather than at install time: a service that is registered reports `Service "..." is not registered`, or a context reads `undefined` under a mounted provider.

  Each of these packages is now a peer dependency paired with a devDependency. The peer is the published contract that makes the installing application provide the single copy; the devDependency pins this repository's copy for development and tests, which the deliberately wide peer range does not. Applications built from the templates are unaffected — they already install every one of these packages directly, which is what satisfies the new peer ranges.

  `pnpm plugin:create` generates the same shape, and `pnpm peers:check` enforces it in CI.

### Patch Changes

- Updated dependencies [174eab5]
- Updated dependencies [174eab5]
  - @nocobase/app-server@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.3

### Minor Changes

- ac3f033: Export every server plugin from its package's `./server` entry point, and update application composition, plugin discovery, and generated plugins to use the unified entry point.

### Patch Changes

- 78cf0a2: Generate runtime-aware TypeScript, ESLint, Node engine, and development dependency configuration for Client-only, Server-only, and full-stack plugins, including stable package-scoped Queue Job identities.

  Keep plugins aligned with the Agent development contract by giving Queue, System Information, and Workflow Routes path-scoped authentication, documenting the Queue API path and Database declaration source accurately, and storing example tests under each plugin's root test directory.

- fb1a752: Unify Client and Server application composition around the explicit `serviceProviders` contribution and rename Client React tree contributions to `reactProviders`.

  Replace Client bootstrap modules with application-owned ServiceProvider lifecycle hooks, make the default Client start through `ClientApplication` and render through the Browser host, and update built-in plugins and runtime inspection to the new static contribution protocol.

- Updated dependencies [948304d]
- Updated dependencies [ac3f033]
- Updated dependencies [fb1a752]
- Updated dependencies [78cf0a2]
- Updated dependencies [fb1a752]
- Updated dependencies [fb1a752]
  - @nocobase/app-server-kit@0.1.0-beta.3
  - @nocobase/service-provider@0.0.2-beta.1

## 0.0.1-beta.2

### Patch Changes

- ce4eab8: Add a focused ServiceProvider plugin example with a tokenized heartbeat
  service, lifecycle management, and an HTTP status route. Pass the Application
  directly to providers and standardize service access through `app.container`.
- 7cdffbd: Replace separate API and root route arrays with one ordered `routes` contribution array. Route factories now receive the Application, create and return their own Hono router, and are mounted automatically at `/api` or the application root according to their definition.

  Standardize plugin server modules around `providers/index.ts` and `routes/index.ts` collection entries, `services/` domain implementations, and a stable `tokens.ts` public contract.

  Generated plugins now declare conventional database and queue contribution directories by default. Missing optional directories are ignored until executable migrations, seeds, or jobs are added.

  Generated plugins now include an App-facing starter Agent Skill under the package's `skills/` directory. Plugin registration and skill synchronization copy these package-owned Skills into registered applications' `.agents/skills/` directories.

  Unify Client page contributions behind one `routes` loader. Plugins now use `defineAppRoutes()` and `defineSettingsRoutes()` to add child Routes to the application's two built-in Client Routes, mirroring how Server plugins use `defineRootRoutes()` and `defineApiRoutes()` with the built-in Hono routers.

- 7cdffbd: Add explicit `server/plugin.ts` definitions for Providers, API routes, root routes, database sources, and queue jobs. Register routes in a dedicated Application phase after Provider boot, add reusable HTTP and runtime composition helpers to their owning packages, and remove the default template's duplicate runtime layer and legacy plugin discovery contract.
- Updated dependencies [b049266]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [ce4eab8]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
  - @nocobase/app-server-kit@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.0

## 0.0.1-beta.1

### Patch Changes

- 0465323: Declare explicit publish files for the example plugins and Hub template, and add a safe Hub environment example for generated projects.
- Updated dependencies [0465323]
  - @nocobase/app-server-kit@0.0.1-beta.1

## 0.0.1-beta.0

### Patch Changes

- da1b1b0: 首次发布。
- Updated dependencies [da1b1b0]
  - @nocobase/app-server-kit@0.0.1-beta.0
