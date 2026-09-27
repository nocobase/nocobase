# @nocobase/dev-config

## 0.1.0-beta.14

### Minor Changes

- 46ce11f: A build is no longer tied to a mount path. `createAppViteConfig` builds with a relative base, and the application server rewrites the relative URLs in `index.html` — the `./assets/` chunks and every `public/` file the page references — to the path it is mounted at, so one `dist/` runs at any `APP_BASE_PATH`. The development server still needs an absolute base and refuses to start without `APP_BASE_PATH`, which `pnpm dev` always passes; `DEFAULT_APP_BASE_PATH` in `@nocobase/app-server/support` is the `/main` it falls back to. In proxy mode, `createDevClientConfigPlugin` from `@nocobase/app-cli/dev/proxy` renders the remote application's client configuration into the local page, and says which status or redirect it met when the remote does not serve one.

  `pnpm build` records `nocobase.relocatable: true` in `dist/package.json` in place of `nocobase.basePath`, and no longer copies `APP_BASE_PATH` into `dist/.env`. app-installer chooses the mount path with `install --base-path` and keeps it in `app.env`, and a Hub archive keeps `/hub` unless the flag says otherwise; an archive from an earlier build runs only at the path it records, and `install`, `upgrade` and `rollback` refuse it elsewhere with `BASE_PATH_MISMATCH`. The Hub refuses such an archive unless it was built for `/<appId>`. The template Dockerfiles no longer take `APP_BASE_PATH` as a build argument: the image defaults to `/main`, `/hub` for the Hub, and `docker run -e APP_BASE_PATH` moves it.

- 46ce11f: `@nocobase/app-portal-sdk` is removed; nothing in an application depends on it any more. The presets named after it are renamed: `@nocobase/dev-config/vite/portal` and `createPortalViteConfig` are `@nocobase/dev-config/vite/app` and `createAppViteConfig`, and `createPortalConfig` is `createApplicationConfig`. The application ESLint preset now reports any `import.meta.env` read other than `PROD`, `DEV` and `MODE`, since browser code takes runtime values from the client configuration. The i18n and file plugin Skills no longer refer to the Portal SDK.

## 0.1.0-beta.13

### Minor Changes

- ec92b20: The shared ESLint presets hold commands under `cli/` to the application command line's contract. Importing `@nocobase/app-server/node`, calling `process.cwd()`, writing with `console.log`, and calling `this.exit()` or `this.logJson()` are errors there, and each message names what to use instead: `withApp()`, `this.rootDir` or an `appPath()` flag, `this.log` and a returned result, or `CommandError`.

## 0.1.0-beta.12

### Patch Changes

- 9e8fc3e: Export `createShadcnRegistryConfig(root)` from `@nocobase/dev-config/eslint`. It returns the shadcn/ui registry relaxations `createPortalConfig` applies to `client/`, scoped to another directory, so a package whose primitives live elsewhere applies the same list instead of copying it.
- cde9a8e: Describe the monorepo's Skill links correctly in the comment on the ESLint Skills ignore patterns. The ignored paths are unchanged.

## 0.1.0-beta.11

### Patch Changes

- 56613b2: Relax the rules shadcn/ui registry output trips over in `createPortalConfig`, for `client/components/ui/**/*.tsx`, `client/hooks/use-mobile.ts` and the recharts payloads in `client/components/ui/chart.tsx`.

  `shadcn add` copies these files from the upstream registry verbatim, and `shadcn add <name> --diff` is only meaningful while the local copy matches, so rules such as `react-refresh/only-export-components` report on a shape nobody here chose and whose only available fix is the edit that destroys the diff. Putting the exception in the factory rather than in each `eslint.config.js` means every portal that adds a registry component gets it — the applications generated from the templates included — instead of each one discovering the same failure and writing the same block. Everything outside those paths, `client/components/` included, is held to the full rule set, and a portal can still override the relaxation through `overrides`.

- fc34a66: Exclude `.agents/skills/` and `.claude/skills/` from ESLint and Prettier. Skills are prose written for agents to read rather than source to reflow, an application's copies are replaced wholesale by `skills:sync`, and `.claude/skills/` holds symbolic links into `.agents/skills/` — so formatting through one checked the same file twice and wrote the result back into the directory it points at.

## 0.1.0-beta.10

### Patch Changes

- fe564d9: Transform the queue loader in both Vitest presets so dynamically discovered TypeScript jobs load through the test runtime instead of Node's strip-only loader. Document the shared preset requirement for application job-discovery tests.

## 0.1.0-beta.9

### Patch Changes

- 5f92529: Render DOCX, XLSX, and PPTX locally in the editable file Registry components using lazily loaded OOXML viewers and existing content URLs. Preserve legacy Office Online fallback and viewer WASM asset paths in Portal development. Existing applications must merge the updated Registry source and install its declared dependency.

  Correct the file Skill read-field policy for queried records used by Registry UI, and document viewer installation, Vite configuration, content authentication boundaries, and preview verification.

  Demonstrate browser-local DOCX, XLSX, and PPTX previews in the file and order attachment examples, with local-network requirements and download-only legacy format guidance.

## 0.1.0-beta.8

### Patch Changes

- 26ac480: Add code-defined Cron scheduling with timezone support, transactional synchronization, and stable schedule identities. Applications and plugins register schedules with `SchedulerService.defineSchedule(definition)` and execution targets with `registerTarget()` during provider registration or boot.

  Route scheduled jobs and workers through the application's configured logical queue, with an adapter-neutral schedule store. Keep the upstream queue dependency unmodified and store queue and scheduler timestamps compatibly with their adapters while preserving absolute instants.

  Move queue storage migrations from Scheduler into the queue library, which resolves configured database connections and physical tables. Assemble these sources centrally in app-server for startup and CLI commands, rejecting overlapping active queue tables before execution. Support immutable target parameters, shared migration history and locks, upstream-compatible physical schemas, and read-only execution conditions that leave skipped migrations unapplied.

  Track idempotent occurrences through the target's final outcome, including asynchronous Workflow completion and recovery with stable run references. Target registration returns a completion-reporting handle scoped to that target; long-running executions can report completion without a fixed scheduler observation timeout.

  Provide an authorized, read-only schedule management page and API with paginated schedules, trigger counts, execution history, and separate schedule and execution statuses. Register `pnpm nocobase schedule sync` as a global CLI command and integrate it into all application templates.

  Include application examples for custom task targets and scheduled Workflows, and agent guidance for schedule definition, target selection, asynchronous execution, diagnostics, and recovery.

  Keep the database manifest CLI entry available before compilation so fresh workspace installs link the command required by package builds.

  Declare the OpenTelemetry dependencies referenced by the upstream queue declarations so consumers can typecheck published Server APIs without enabling tracing or skipping library checks.

## 0.1.0-beta.7

### Minor Changes

- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.

## 0.1.0-beta.6

### Patch Changes

- 73f7538: Resolve a Portal build's asset URLs from the runtime base path so a build keeps working when a host mounts it under a different prefix. Vite inlined the build-time `base` into its `__vitePreload` helper, and that helper awaits every stylesheet link it inserts, so a lazy chunk carrying its own CSS rejected its dynamic import and rendered the route's error state once the application was served from somewhere other than the prefix it was built for.

  The templates each carried their own copy of this fix, added before it existed in the shared configuration. They now inherit it from `createPortalViteConfig` instead. A consumer that configures `experimental.renderBuiltUrl` itself still overrides the shared one, so nothing that needs its own strategy loses it — the templates simply no longer need one.

## 0.1.0-beta.5

### Patch Changes

- ec576ba: Let plugins contribute commands to an application's CLI, and rename the bin to `nocobase`.

  An application now has a `cli/` composition root beside `client/` and `server/`. Its `cli/index.ts` calls `runAppCli()` from `@nocobase/nb3-cli/runtime`, which assembles one command tree from three sources: the built-in plugin management commands under `plugin`, the application's own commands under `app`, and each registered plugin's commands under the topic that plugin declares. `pnpm nocobase` runs it.

  A plugin contributes commands by exporting a `./cli` entry that calls `defineCliPlugin()` with a topic and a map of oclif `Command` subclasses. `@nocobase/app-plugin-cli-example` is the reference implementation. `@oclif/core` is a peer dependency of such a plugin so that the plugin and the application share one copy, which is what keeps help rendering and flag parsing consistent.

  `plugin register`, `plugin unregister`, and `plugin inspect` maintain `cli/plugins.ts` the same way they already maintain `client/plugins.ts` and `server/plugins.ts`, keyed on whether the plugin exports `./cli`. An application without TypeScript degrades to printed instructions for that file exactly as it does for the other two.

  `cli/` is compiled into `dist`, so a deployed application runs the same commands with `node ./cli/index.js`. The application's own `migrate` and `seed` are now commands rather than separate scripts, and `pnpm migrate` / `pnpm seed` dispatch through the CLI — the script names are unchanged. A command that cannot work in a deployment goes in `cli/dev-commands/`, which the build excludes; client inspection lives there because it needs Vite and the browser client. `server:config` was removed outright.

  Two breaking changes come with this. The bin is `nocobase` rather than `nb3`, and the five plugin commands moved from `app plugin *` to the top-level `plugin *`, which frees the `app` topic for the commands an application writes itself. The `pnpm plugin:*` script names are unchanged, so anything invoking those scripts is unaffected.

## 0.1.0-beta.4

### Patch Changes

- 813da59: Require eslint-plugin-react-refresh 0.5.6, which restores the member-expression check that 0.5.5 dropped. Under 0.5.5 an aliased component export such as `const Select = SelectPrimitive.Root` was reported as a non-component export, so a freshly generated application failed `pnpm lint` on an untouched shadcn/ui file.

## 0.1.0-beta.3

### Minor Changes

- 174eab5: Consolidate the browser packages into `@nocobase/app-client`.

  `@nocobase/app-sdk` is gone; its API client now lives in `@nocobase/app-client` and is imported from there. `@nocobase/app-portal-sdk` is deprecated and keeps only what still has consumers: `NocoBaseClient` and the runtime configuration it reads, which exist to reach a v2 NocoBase server, and the route surface containers under `/routing`. Its ACL, auth, data, extension, i18n, and system-settings modules are removed, as is the route tree that `/routing` used to export alongside the surfaces.

  `@nocobase/app-client` gains `resolveAppBase()`, which reports the path the application is mounted at.

  Four plugins built their API client at import time instead of resolving it from the application's service container, so they could not see `api.baseURL` from the application configuration. They now resolve it, which means an application that configures a base URL gets one client rather than two that disagree.

  The injected browser global `NOCOBASE_PORTAL_BASE` is renamed to `APP_BASE_PATH`. Its value has always been the `APP_BASE_PATH` environment variable, and the old name grouped it with the settings that address a v2 NocoBase server. Those keep their names. A client and the server that serves it must be upgraded together.

  `@nocobase/app-plugin-data-provider` is removed. It forwarded the Portal data provider, and applications built on the current client runtime do not use it.

  The Hub template is rebuilt from the default template and now runs the same client and server stack as every other v3 application. Its `/api/apps` endpoint and its v2 API proxy are gone, so a hub's `.env` no longer configures them.

  The Portal SDK's template compatibility check is removed with the rest: it had been disabled behind a constant, and its install script cost every generated project a `pnpm-workspace.yaml` `allowBuilds` entry it did not need. `createPortalViteConfig` no longer takes the plugin that injected it.

### Patch Changes

- 174eab5: Keep `dist` readable while it rebuilds. The build deleted the directory before compiling, so a package linting in parallel could fail to resolve `@nocobase/dev-config/eslint` during that window. The output is now staged and swapped in once compilation succeeds, which also leaves the last good build in place when compilation fails.
- 02876d6: Raise the shared Vitest `testTimeout` and `hookTimeout` to 30 seconds. Vitest's 5-second default is a local-machine number: CI runs every package's suite in parallel on one shared runner, so work that finishes in under a second on a developer's machine can take several seconds there. A test that grows legitimately then fails as a timeout on CI long before it is slow enough to notice locally. A package that needs a different value still sets its own, which continues to take precedence over the shared one.

## 0.0.1-beta.2

### Patch Changes

- fb1a752: Make the shared service-provider runtime environment-neutral and add a matching universal ESLint configuration for libraries that do not depend on Node, browser, or React globals.

## 0.0.1-beta.1

### Patch Changes

- b049266: Add language switching on top of `@nocobase/app-i18n`. Applications and plugins declare their locales the same way on both sides, the browser loads only the language it is showing, and the chosen one is kept in storage and mirrored to the server session.

## 0.0.1-beta.0

### Patch Changes

- da1b1b0: 首次发布。
