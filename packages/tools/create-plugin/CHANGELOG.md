# @nocobase/create-plugin

## 0.1.0-beta.13

### Minor Changes

- a857a08: **Breaking for anything that parses `--json`.** `pnpm plugin:create --json` prints the application CLI's envelope, `{ schemaVersion: 1, ok, command: "create-plugin", status, result | error, warnings }`, so it reads the same way as `pnpm nocobase plugin register --json` after it. `operation: "plugin:create"` is replaced by `command: "create-plugin"`, and the plan — `mode`, `plugin`, `requestedCapabilities`, `capabilities`, `derivedStructure`, `files`, `writes`, `commands` and `nextSteps` — moves under `result`. A success reports `status: "success"`, and a `--dry-run` `"success-noop"`. A failure is printed on stdout rather than stderr, with `status: "failure"`, and each of its `error.suggestions` is a `{ message }` object instead of a string. `--help --json` and `--version --json` return `result.help` and `result.version` instead of text, and under `--json` an unsupported Node.js prints the same envelope with `NODE_UNSUPPORTED`. Exit codes are unchanged.

### Patch Changes

- 9f75a27: The `--json` document is built by the new `@nocobase/cli-envelope` dependency rather than by a copy of the envelope kept here, and `bin/run.js` runs that package's Node.js guard. What is printed is unchanged, except that the text for an unsupported Node.js, without `--json`, now reads `[create-plugin]: Node.js 24 or later is required.` on two lines, as the other tools print it.
- 41f478f: Cite `lucide-react` instead of `sonner` as the example client peer in the plugin `AGENTS.md`, since plugins report toasts through the application and no longer depend on `sonner`.
- Updated dependencies [9f75a27]
  - @nocobase/cli-envelope@0.1.0-beta.0

## 0.1.0-beta.12

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
  - @nocobase/dev-config@0.1.0-beta.13

## 0.1.0-beta.11

### Patch Changes

- 9f0edf8: Tell a generated plugin how its migrations differ from an application's.

  The template explained `baseDir` and the compiled manifests but never the layout the declaration points at, so the application shape was the only one an agent had seen. A plugin declares one `database/migrations` and `database/seeds` with no connection segment, because it contributes to the installing application's default connection alone.

  Two consequences only appear in someone else's application, which is why they are worth stating here. Migration names must be unique across every source the application loads, so a collision with another plugin or with the application itself fails the whole run rather than one package's tasks; and ordering is by name across all sources, so a plugin's migrations interleave with the application's instead of applying as a block.

- Updated dependencies [56613b2]
- Updated dependencies [fc34a66]
  - @nocobase/dev-config@0.1.0-beta.11

## 0.1.0-beta.10

### Patch Changes

- 028dd7c: Use host-provided peers for shared database types, authorization errors, service tokens, cache registries, and repository filter metadata. Declare their production providers in all application templates so deployments with automatic peer installation disabled retain the required runtime packages. Document the provider contract for generated plugins.

  Existing applications upgrading these packages must add compatible versions of their required shared peers to production dependencies: @nocobase/db, @nocobase/service-provider, @nocobase/repository-input, @nocobase/authorization, @nocobase/caching, @nocobase/i18n, and @nocobase/queue for the standard server stack, plus @nocobase/ai-employee when using its plugin. Update the lockfile and verify the production install; peer declarations do not remove incompatible historical versions automatically.

## 0.1.0-beta.9

### Patch Changes

- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.
- Updated dependencies [a60decd]
  - @nocobase/dev-config@0.1.0-beta.7

## 0.1.0-beta.8

### Patch Changes

- a2dbe54: Stop listing the `database` source directory in a generated plugin's `files`. Its TypeScript already compiles into `dist/database`, which is what the runtime resolves; publishing the sources beside it shadowed the compiled copy and left the generated plugin unable to run its own migrations once installed, because Node refuses to strip types under `node_modules`.

## 0.1.0-beta.7

### Patch Changes

- 009ebed: Remove unavailable documentation references from generated plugin guidance.
- Updated dependencies [73f7538]
  - @nocobase/dev-config@0.1.0-beta.6

## 0.1.0-beta.6

### Minor Changes

- e9f796d: Add a `cli` capability and a `--with all` shorthand

  `pnpm plugin:create <name> --with cli` scaffolds a `cli/` entry with one example command, the `./cli` export, and the peer dependencies an application resolves it through. `--with all` selects every capability, so a plugin that needs most of them no longer means naming each one.

## 0.1.0-beta.5

### Patch Changes

- 1d042c0: Support recursive page routes and navigation groups across App, Settings, and Dev. Render application menus from route navigation instead of Refine resources, preserve parent access checks, and migrate template and example navigation. Refine resources remain available for CRUD integration.

## 0.1.0-beta.4

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

## 0.1.0-beta.3

### Minor Changes

- 813da59: Generate `AGENTS.md` and `CLAUDE.md` in every new plugin, documenting where a dependency goes: server runtime imports in `dependencies`, client and build-time imports in `devDependencies`, and packages the application must own a single copy of in `peerDependencies`. A plugin created without that guidance reintroduces the browser packages in `dependencies` that this repository has just finished removing.

### Patch Changes

- Updated dependencies [813da59]
  - @nocobase/dev-config@0.1.0-beta.4

## 0.1.0-beta.2

### Minor Changes

- 1527426: Declare identity-sensitive runtime packages as peer dependencies of every plugin.

  A plugin used to list `@nocobase/app-server`, `@nocobase/db`, `@nocobase/service-provider`, `@nocobase/i18n`, `@nocobase/queue`, `@nocobase/app-portal-sdk`, and the plugins it builds on among its `dependencies`. Each of these carries state that only works while exactly one copy of the module exists in the process: `ServiceContainer` keys its bindings by the token object itself, React contexts match only the provider created from the same module, and `@nocobase/queue` registers job classes into a global `Locator`. A `dependencies` range lets a package manager install a second copy to satisfy it, which splits that state.

  The monorepo could never show the problem, because `workspace:` links every consumer to one directory. It appears once a plugin is installed from a registry into an application, and it appears at runtime rather than at install time: a service that is registered reports `Service "..." is not registered`, or a context reads `undefined` under a mounted provider.

  Each of these packages is now a peer dependency paired with a devDependency. The peer is the published contract that makes the installing application provide the single copy; the devDependency pins this repository's copy for development and tests, which the deliberately wide peer range does not. Applications built from the templates are unaffected — they already install every one of these packages directly, which is what satisfies the new peer ranges.

  `pnpm plugin:create` generates the same shape, and `pnpm peers:check` enforces it in CI.

### Patch Changes

- ab7b341: Add `defineDevRoutes()`, for pages that exist only while developing an application.

  It takes the same shape as `defineSettingsRoutes()` — pages, one level of groups, `navigation` and `access` — and mounts under `/dev` instead of `/settings`. The two are separate path spaces, so the same relative path may appear in both and resolve to `/settings/orders` and `/dev/orders`.

  What makes it different is that nothing it declares reaches a production bundle. The guard lives inside `defineDevRoutes()` rather than at each call site, so a plugin author calls it unconditionally the way they call `defineSettingsRoutes()` and cannot forget it. A production build replaces `import.meta.env.PROD` with `true`, which makes the argument unreachable and lets the bundler drop the page components behind it, along with any module only those pages import. The templates guard their `/dev` route and the dev entry in the header the same way, so a production build carries no dev route, no dev layout chunk, and no dev entry point.

  This draws its boundary at the build output, not at runtime permissions. A page that has to exist in production but be restricted by role is still a Settings Route with `access`, enforced by the server.

  Both templates' headers offer a dev entry beside the settings gear, visible only during development. A surface withdraws its own entry: the settings centre shows the dev entry but not the gear, the dev tools show the gear but not the dev entry, and the application shell shows both.

  Both templates gain a `client/layouts/` directory. The settings centre's chrome — the navigation rail, group disclosures, the mobile page select, and the per-page access filtering — is now one `SurfaceLayout` that the settings centre and the dev tools each render with their own copy, rather than a second copy of the same layout. The Hub template's settings navigation picks up the translation the default template already had.

  `client:inspect` reports the resolved dev routes and accepts `--type dev-routes`.

- Updated dependencies [174eab5]
- Updated dependencies [174eab5]
- Updated dependencies [02876d6]
  - @nocobase/dev-config@0.1.0-beta.3

## 0.1.0-beta.1

### Minor Changes

- fb1a752: Replace the ambiguous plugin scaffold capabilities `server.providers`, `client.providers`, and `client.bootstrap` with `server.service-providers`, `client.service-providers`, and `client.react-providers`.

  Generate static Client and Server contribution declarations, Client ServiceProvider lifecycle structure, and explicitly named React Provider structure for the selected capabilities.

- ac3f033: Export every server plugin from its package's `./server` entry point, and update application composition, plugin discovery, and generated plugins to use the unified entry point.

### Patch Changes

- 78cf0a2: Return a single versioned JSON envelope for both successful and failed Create
  Plugin and Plugin Skills synchronization commands. Plugin Skills
  synchronization now includes consistent success and failure statuses. JSON
  failures keep a non-zero exit code and expose stable error codes, readable
  messages, and actionable suggestions without appending non-JSON usage output.
- 78cf0a2: Add a complete App-facing Plugin Skill example with a reusable Notice component, an authenticated Server API, target-App integration tests, and capability-aware Skill scaffolding. Clarify System Info ownership, authorization, and behavioral verification guidance.
- 78cf0a2: Align Route examples, scaffolding guidance, and Agent-facing Client and Server Route documentation with the latest ownership and testing practices.
- 78cf0a2: Generate runtime-aware TypeScript, ESLint, Node engine, and development dependency configuration for Client-only, Server-only, and full-stack plugins, including stable package-scoped Queue Job identities.

  Keep plugins aligned with the Agent development contract by giving Queue, System Information, and Workflow Routes path-scoped authentication, documenting the Queue API path and Database declaration source accurately, and storing example tests under each plugin's root test directory.

- Updated dependencies [fb1a752]
  - @nocobase/dev-config@0.0.1-beta.2

## 0.0.2-beta.0

### Patch Changes

- Add explicit `client.locales` and `server.locales` capabilities, and stop generating locale resources implicitly for unrelated Client capabilities.
- b049266: Scaffold a plugin with locale files and a declared `locales` entry, so a new plugin starts out translatable rather than needing i18n retrofitted.
- 7cdffbd: Replace separate API and root route arrays with one ordered `routes` contribution array. Route factories now receive the Application, create and return their own Hono router, and are mounted automatically at `/api` or the application root according to their definition.

  Standardize plugin server modules around `providers/index.ts` and `routes/index.ts` collection entries, `services/` domain implementations, and a stable `tokens.ts` public contract.

  Generated plugins now declare conventional database and queue contribution directories by default. Missing optional directories are ignored until executable migrations, seeds, or jobs are added.

  Generated plugins now include an App-facing starter Agent Skill under the package's `skills/` directory. Plugin registration and skill synchronization copy these package-owned Skills into registered applications' `.agents/skills/` directories.

  Unify Client page contributions behind one `routes` loader. Plugins now use `defineAppRoutes()` and `defineSettingsRoutes()` to add child Routes to the application's two built-in Client Routes, mirroring how Server plugins use `defineRootRoutes()` and `defineApiRoutes()` with the built-in Hono routers.

- 12dfb68: Add the template-based `@nocobase/create-plugin` scaffold with complete client and server examples, including shadcn configuration for plugin-owned runtime UI and an application-owned Registry component recipe with build, materialize, and publishing metadata. Reuse the `nb3 app plugin` commands from the monorepo root, and register exported server plugin definitions in the application's explicit `server/plugins.ts` composition root.
- Updated dependencies [b049266]
  - @nocobase/dev-config@0.0.1-beta.1

## 0.0.1

### Patch Changes

- Add a template-based generator for NocoBase 3 application plugins.
- Document that the registration command automatically connects the generated `./server` export to the target application's explicit server composition root.
- Replace the complete default scaffold with explicit, composable plugin
  capabilities and a shared generation plan. Add structured JSON dry runs and
  require callers to select capabilities or explicitly request an empty
  package foundation.
