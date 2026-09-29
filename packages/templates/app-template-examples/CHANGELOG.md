# @nocobase/app-template-examples

## 1.0.0-beta.33

### Patch Changes

- 64cf25a: Follow `ai.llmServices` becoming a map keyed by service name, with `${NAME}` no longer expanded

  `config check` now reports a `${NAME}` under `ai.llmServices` and `ai.mcpServers` as literal text, as it already did for every other section, since the AI employee plugin no longer expands one. The application development Skill no longer names the AI sections as an exception.

  The templates default `ai.llmServices` to an empty map and declare `server/config/ai.ts` with the AI employee plugin's `defineAIConfig`, so `config check` validates the section and warns about a service with no key, and with an empty `env` for an application's own mappings. The commented AI example in `config.example.yml` shows the map form without a key, says how to set one with `pnpm nocobase config set --from-env`, and no longer claims that a change applies without a restart: a standalone server reads the file when it starts, and `pnpm dev` restarts on its own.

- 414956d: Add runtime `ai-employee models` and `ai-employee test` commands to discover built-in provider model IDs and verify model access before application startup, without connecting to the database or exposing credentials or completion content. Both commands support the standard CLI JSON envelope.

  Register the commands in the Default and Examples templates and document selecting initial enabled models before the first startup. Existing applications must register `@nocobase/app-plugin-ai-employee/cli` in `cli/plugins.ts` and provide the plugin's `@nocobase/app-cli` and `@oclif/core` peers as production dependencies. Model selection for already initialized services remains in the management UI; these commands do not modify database model lists.

- aeff80a: Add `@nocobase/app-plugin-schedule-example`, a plugin running a recurring job on the application's jobs service

  Its provider takes an executor of its own from `jobExecutorServiceToken`, registers a `heartbeat` job that runs every minute, sets the executor up, removes the rules of jobs it no longer defines, and shuts the executor down with the application. An authenticated `GET /api/schedule-example` returns the job's next firing and its recent runs. The examples template registers it.

- aeff80a: Compose the jobs service, and replace `@nocobase/cron` with `@nocobase/jobs`

  The templates add `JobExecutorServiceProvider` to `server/app.ts`, a `server/config/jobs.ts` offering a `memory` and a `redis` configuration, and `@nocobase/jobs` as a dependency, and remove the Scheduler's `queues.schedule` queue connection. The default and examples templates also add `server/config/scheduler.ts`, where `scheduler.jobs` or `SCHEDULER_JOBS` selects the `jobs` configuration Scheduler runs on. No configuration is the default: until `jobs.default` names one, scheduled jobs run on the built-in memory adapter — one process, its state written under `storage/jobs` when the application stops — and a warning reports it outside development. Set `jobs.default` to `redis` in `config.yml` to run several instances, each firing executed once; Redis must persist its data and use `maxmemory-policy noeviction`.

  `@nocobase/cron` is no longer part of the templates or of this repository; its published 0.1.0 stays installable. Code that scheduled work with `createCronJobManager()` moves to an executor of its own, which also stops several instances from each firing the job:

  ```ts
  import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';

  this.executor = this.app.container
    .resolve(jobExecutorServiceToken)
    .getScheduleExecutor('<your package name>');
  await this.executor.addJob({
    name: 'overdue-scan',
    options: { cron: '0 8 * * *', tz: 'Asia/Shanghai' },
    payload: {},
    execute: async () => {
      /* ... */
    },
  });
  await this.executor.setup(); // in start(); call this.executor.shutdown() in shutdown()
  ```

  The application development Skill describes this in its services and jobs reference, and the deployment Skill covers choosing the schedule backend.

- Updated dependencies [64cf25a]
- Updated dependencies [64cf25a]
- Updated dependencies [414956d]
- Updated dependencies [64cf25a]
- Updated dependencies [64cf25a]
- Updated dependencies [64cf25a]
- Updated dependencies [aeff80a]
- Updated dependencies [aeff80a]
- Updated dependencies [aeff80a]
- Updated dependencies [aeff80a]
  - @nocobase/app-plugin-ai-employee@1.0.0-beta.27
  - @nocobase/app-cli@1.0.0-beta.10
  - @nocobase/app-plugin-schedule-example@0.1.0-beta.0
  - @nocobase/jobs@0.1.0-beta.0
  - @nocobase/app-server@1.0.0-beta.30
  - @nocobase/app-plugin-scheduler@0.1.0-beta.10

## 1.0.0-beta.32

### Minor Changes

- db16945: Toasts go through a toaster that `@nocobase/app-client` defines and the application implements, so code that reports a result no longer depends on how toasts are rendered.

  - **App client.** `useToaster()` returns the application's `Toaster`. Its `show({ type, title, description, action, duration, id, onClose })` returns an id that `close(id)` takes, and `resolveToaster(app.services)` returns the same toaster outside React. The application registers the implementation under `toasterToken`; `@nocobase/app-client` registers none. Without one, nothing throws: each toast is logged to the console instead, an error toast as an error, and the first says how to register a toaster. Clicking a toast's action runs its `onClick` and leaves the toast open.
  - **Templates.** `client/lib/toaster.ts` forwards toasts to the Base UI `toast` manager that the mounted `Toaster` renders, and decides their presentation for the whole application: an error written as plain text is announced at once, while one with an action, or with an element for its title or description, keeps the default priority. `client/service-provider.ts` registers it in `register()`. The account menu, the language switcher and the Examples route overlay demo show their toasts through `useToaster()`.
  - **Plugins (breaking).** Hub, Users, Workflow and AI employee pages report through `useToaster()` instead of `Toast.useToastManager()` from `@base-ui/react/toast`, and no longer choose a toast's priority. They need the `@nocobase/app-client` that exports it, and the application has to register a toaster: without one nothing throws, but their toasts only reach the console, and a Hub page whose only content is an error shows nothing. They no longer require a Base UI `Toast.Provider`.
  - **Skills.** The frontend references and each affected plugin's Skill describe `useToaster()`, and the `nocobase-app-upgrade` edge case "Notifications and the application toaster" replaces "Notifications and the Base UI toast".

  Upgrade an existing application with the `nocobase-app-upgrade` Skill, which brings `client/lib/toaster.ts` and its registration together with the new `@nocobase/app-client` and plugin ranges; follow the same steps when upgrading by hand. `pnpm nocobase plugin update` is not enough on its own: the plugins stay inside the application's `^1.0.0-beta` ranges, so it installs them, but it leaves `@nocobase/app-client` where it is, and their pages then fail to load for want of `useToaster`.

### Patch Changes

- Updated dependencies [9f75a27]
- Updated dependencies [62e2724]
- Updated dependencies [84cc7d2]
- Updated dependencies [41f478f]
- Updated dependencies [db16945]
  - @nocobase/app-cli@1.0.0-beta.9
  - @nocobase/app-plugin-notification@0.1.0-beta.18
  - @nocobase/app-plugin-api-keys@0.1.0-beta.9
  - @nocobase/app-plugin-authz-default-access@0.1.0-beta.6
  - @nocobase/app-plugin-authz-restriction-rules@0.1.0-beta.5
  - @nocobase/app-plugin-authz-sharing-rules@0.1.0-beta.6
  - @nocobase/app-plugin-database-explorer@0.1.0-beta.7
  - @nocobase/app-plugin-authorization-example@0.1.0-beta.8
  - @nocobase/app-plugin-departments-example@0.0.2-beta.1
  - @nocobase/app-plugin-file-example@0.1.0-beta.12
  - @nocobase/app-plugin-repository-example@0.1.0-beta.15
  - @nocobase/app-plugin-users@1.0.0-beta.12
  - @nocobase/app-plugin-workflow@1.0.0-beta.29
  - @nocobase/app-plugin-ai-employee@1.0.0-beta.26

## 1.0.0-beta.31

### Major Changes

- 46ce11f: The client reads its runtime values only from the configuration the server renders into `index.html`. The router basename and `resolveAppUrl` take `app.basePath` from that block and throw when the page carries none, `defineAppRuntime` no longer accepts `basename`, and the block is read once per page. The server no longer writes `window` globals: `SpaConfig.runtime` and its `storagePrefix`, `storageType` and `shareToken` settings are removed. The public configuration gains `app.displayName` and `app.version` from the application's `package.json`, which the templates' sidebar footer now shows in place of the `__PORTAL_TEMPLATE_*` constants Vite used to define.

  The templates drop `@nocobase/app-portal-sdk`, `assetUrl`, every Vite `define` and `envPrefix`, and register a test setup that renders the configuration block. The `nocobase-app-upgrade` Skill's edge cases list the steps for an existing application.

- 46ce11f: A build is no longer tied to a mount path. `createAppViteConfig` builds with a relative base, and the application server rewrites the relative URLs in `index.html` — the `./assets/` chunks and every `public/` file the page references — to the path it is mounted at, so one `dist/` runs at any `APP_BASE_PATH`. The development server still needs an absolute base and refuses to start without `APP_BASE_PATH`, which `pnpm dev` always passes; `DEFAULT_APP_BASE_PATH` in `@nocobase/app-server/support` is the `/main` it falls back to. In proxy mode, `createDevClientConfigPlugin` from `@nocobase/app-cli/dev/proxy` renders the remote application's client configuration into the local page, and says which status or redirect it met when the remote does not serve one.

  `pnpm build` records `nocobase.relocatable: true` in `dist/package.json` in place of `nocobase.basePath`, and no longer copies `APP_BASE_PATH` into `dist/.env`. app-installer chooses the mount path with `install --base-path` and keeps it in `app.env`, and a Hub archive keeps `/hub` unless the flag says otherwise; an archive from an earlier build runs only at the path it records, and `install`, `upgrade` and `rollback` refuse it elsewhere with `BASE_PATH_MISMATCH`. The Hub refuses such an archive unless it was built for `/<appId>`. The template Dockerfiles no longer take `APP_BASE_PATH` as a build argument: the image defaults to `/main`, `/hub` for the Hub, and `docker run -e APP_BASE_PATH` moves it.

### Patch Changes

- Updated dependencies [46ce11f]
- Updated dependencies [46ce11f]
- Updated dependencies [46ce11f]
- Updated dependencies [46ce11f]
  - @nocobase/app-plugin-ai-employee@1.0.0-beta.25
  - @nocobase/app-server@1.0.0-beta.29
  - @nocobase/app-cli@1.0.0-beta.8
  - @nocobase/app-plugin-i18n@0.1.0-beta.10
  - @nocobase/app-plugin-file@0.1.0-beta.16

## 1.0.0-beta.30

### Minor Changes

- a4ee8aa: A standalone application keeps its data under `APP_STORAGE_DIR` when it is set, absolute or relative to the deployment root, instead of `storage/` in the deployment root. Set it when the deployment root is replaced on every release, as an installer that keeps one directory per release does. Explicit storage paths still take precedence, and embedded applications keep the volume their host provides. The Hub template's own `HUB_STORAGE_DIR` is gone in favour of it: a Hub deployment that sets only `HUB_STORAGE_DIR` must rename it to `APP_STORAGE_DIR` before upgrading, or the Hub starts on an empty storage directory.

### Patch Changes

- f5b066d: Include the template-print implementation Skill in every official application template.
- 2f97f00: Register the departments example after the authorization example; it shows permission sets inherited through a department tree. The authorization example's migration and seed were edited in place, so reset an existing examples database before upgrading.
- a4ee8aa: `ecosystem.config.js` no longer names every application after its template. The pm2 process name is `nocobase-` followed by the application's package name without its scope, read from `package.json` or, beside an unpacked deployment archive, from `dist/package.json`, and `APP_PM2_NAME` overrides it. Two applications created from the same template can now run under pm2 on one machine; before, the second `pm2 start` restarted the first.
- 601883e: `ecosystem.config.js` now starts the application under pm2. It used to point `script` at `./dist/server/standalone.js`, which pm2's fork mode loads through its own wrapper: `import.meta.main` is then false, `standalone.js` never calls `startServer()`, and pm2 keeps reporting the process as online while nothing listens (the Hub template even exits and restarts in a loop with empty logs). The file now has pm2 run `node ./dist/server/standalone.js` directly with `interpreter: 'none'`, which keeps `standalone.js` the main module.

  Existing applications that deploy with pm2 should make the same change to their own `ecosystem.config.js`: replace `script: './dist/server/standalone.js'` and `interpreter: 'node'` with `script: 'node'`, `args: './dist/server/standalone.js'`, `cwd: import.meta.dirname` and `interpreter: 'none'`. `cwd` resolves the relative `args` against the file's own directory, so `pm2 start /path/to/ecosystem.config.js` works from any directory.

- Updated dependencies [a4ee8aa]
- Updated dependencies [2f97f00]
- Updated dependencies [2f97f00]
- Updated dependencies [2f97f00]
- Updated dependencies [2f97f00]
- Updated dependencies [a4ee8aa]
- Updated dependencies [2f97f00]
  - @nocobase/app-server@1.0.0-beta.28
  - @nocobase/app-plugin-authorization-example@0.1.0-beta.7
  - @nocobase/authorization@0.1.0-beta.10
  - @nocobase/app-plugin-authorization@0.2.0-beta.21
  - @nocobase/app-plugin-authz-default-access@0.1.0-beta.5
  - @nocobase/app-plugin-authz-sharing-rules@0.1.0-beta.5
  - @nocobase/app-plugin-authz-restriction-rules@0.1.0-beta.4
  - @nocobase/app-cli@1.0.0-beta.7
  - @nocobase/app-plugin-departments-example@0.0.2-beta.0

## 1.0.0-beta.29

### Minor Changes

- 02d5402: `@nocobase/app-cli` is now the whole application command line: it provides the `nocobase` bin and absorbs `@nocobase/nb3-cli` (command assembly, the plugin contract, plugin and Skill management) and `@nocobase/app-tools` (`dev`, `build`, `start`, `server-deps`). Neither of those two packages is published any more, and there is no compatibility period.

  - **Commands.** Standard commands leave the `app` topic: `nocobase db apply`, `nocobase config init`, `nocobase collections generate`. `app db doctor` is now `collections doctor`, `app i18n:check` is now `locales check`, and `app upload`/`app deploy` are `release upload`/`release deploy`, registered only when `package.json` sets `nocobase.cli.publishing: true`. New commands `dev`, `build`, `start`, `dist retarget` and `dist check` replace the application's `scripts/*.mjs`. `plugin skills sync` and `plugin cli-hooks` are removed; use `skills sync`. `app` now holds only an application's own commands.
  - **Discovery.** Commands are found by path: an application's `cli/commands/orders/sync.ts` answers to `nocobase app orders sync`, with no index to maintain. The bin finds the application from the nearest `package.json` (`nocobase.templateKind` for a source checkout, `nocobase.buildTarget` for a built `dist/`), or from `NOCOBASE_APP_ROOT`; applications no longer have a `cli/index.ts`. A built-in command runs without importing the application's plugins.
  - **Plugins.** A plugin's topic is its package name without the scope and `app-plugin-` prefix, so the scheduler's commands move from `schedule` to `scheduler` and the CLI example's from `demo` to `cli-example`. `defineCliPlugin` accepts `devCommands`, which a built `dist/` leaves out; the workflow plugin's `check` and `build` are development commands. Plugins declare `@nocobase/app-cli` as their peer instead of `@nocobase/nb3-cli`.
  - **Deployment.** `nocobase build` writes `dist/cli/index.js`, so `node dist/cli/index.js db apply` runs from any directory without pnpm; `dist/package.json` keeps only the `start` and `nocobase` scripts. The `migrate` and `seed` scripts it used to generate pointed at commands that no longer existed and are gone. Development tooling (`typescript`, `tsx`, `vite`, `prettier`, `tar`, `@nocobase/dev-config`) is an optional peer, so a deployment installs none of it.
  - **Templates.** Scripts are reduced to `postinstall`, `dev`, `build`, `start` and the quality checks; every other command is `pnpm nocobase <topic> <command>`. `scripts/`, `cli/index.ts` and `cli/commands/index.ts` are removed.

  Upgrading an existing application requires moving to the new layout in one step: see "Shared application scripts and commands" in the `nocobase-app-upgrade` Skill (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) for the full procedure. Messages that named `nocobase app db repair` and similar commands now name the new ids.

- 4adcf24: Keep hand-written Collection metadata apart from the generated `collections/` cache

  `database/<connection>/collections/` used to hold two opposite things: a generated snapshot for a managed connection, and, for an external connection, `metadata.json` files that were the hand-written metadata source. The two now live in separate directories, so a directory is either written by people or generated, never both.

  - `DirectoryCollectionMetadataStore` reads a directory of `<name>.json` files, each holding one Collection metadata document with no wrapper. It refuses a directory in the generated `<name>/metadata.json` layout and says how to move it.
  - An external connection with no configured `metadataStore` reads `database/<connection>/metadata/<name>.json`. A `metadataStore` string names a directory in that layout, and may not point at a generated `collections/` directory. An application that still keeps metadata at `database/<connection>/collections/<name>/metadata.json` fails at startup with the steps to move it, rather than silently resolving its Collections without metadata. `resolveAppMetadataDirectory()` is exported beside `resolveAppCollectionsDirectory()`.
  - `collections generate` treats `collections/` as a cache for every connection, external ones included: it writes all three files there and never touches `metadata/`. The `orphans` result field is gone; a hand-written document whose Collection the database no longer has is reported as `unusedMetadata` and left in place. `_manifest.json` now records `generated: true`.
  - `nocobase build` copies `database/<connection>/metadata/` into `dist` instead of the `metadata.json` files under `collections/`.
  - The templates and generated applications ignore `/database/*/collections/` with one line instead of naming each managed connection. The Examples template moves its external CRM metadata to `database/externalCrm/metadata/`.

  To upgrade an application with an external connection, write each `"document"` from `database/<connection>/collections/<name>/metadata.json` to `database/<connection>/metadata/<name>.json`, point any `metadataStore` string at the new directory, delete the old `collections/` directory and regenerate it. Replace the per-connection `collections/` lines in `.gitignore` with `/database/*/collections/`. The `nocobase-app-upgrade` Skill lists the steps.

- 2217eb2: Remove `@nocobase/app-plugin-notification-provider` and show every notification through the Base UI toast the templates already ship. The package is no longer published, and Sonner is no longer a dependency of anything.

  - **Templates.** `client/react-providers.ts` mounts the `Toaster` from `client/components/ui/toast.tsx` once, in the `application` layer, and the account menu and language switcher call `toast.add` from `@/components/ui/toast`. A rule at the end of `client/styles.css` lifts the toast viewport above dialogs and sheets, which share its `z-50`. The plugin and `sonner` leave `client/plugins.ts` and `package.json`, and no Refine notification provider is registered.
  - **Plugins (breaking).** Hub, Users, Workflow and AI employee pages report through `Toast.useToastManager()` from `@base-ui/react/toast` instead of Sonner or Refine's `useNotification()`, so they now require the application to mount a Base UI `Toast.Provider`; without one their pages fail with `Base UI: useToastManager must be used within <Toast.Provider>`. They move to `1.0.0` for that reason, which keeps an existing application's `^0.1.0` ranges, and so `pnpm nocobase plugin update`, from installing them before the toaster is in place. Hub notifications appear where the application's toaster places them rather than top-right. `sonner` and `@refinedev/core` are no longer peers.
  - **Skills.** The frontend references describe `toast.add` from `@/components/ui/toast` in place of Sonner, and each affected plugin's Skill names the toaster requirement and the error that reveals it.

  Upgrade an existing application by moving to this template release with the `nocobase-app-upgrade` Skill, which brings the new plugin ranges together with the toaster. Its "Notifications and the Base UI toast" edge case (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) lists the steps, their order, and how to verify the pages afterwards; follow the same steps when upgrading by hand.

### Patch Changes

- dbf5631: Replace the last references to command names the application command line no longer has. The Bubble reference page in each template now shows `pnpm nocobase db apply` instead of `pnpm migrate`, and comments in `@nocobase/create-app` and `@nocobase/app-client` no longer name the removed `client:inspect`.
- 8c06293: The application templates no longer carry forwarding files in `cli/`: `cli/database-command.ts`, `cli/hub-publishing.ts`, `cli/commands/i18n-check.ts` and `cli/standard-commands.ts` are gone, and `cli/commands/index.ts` now calls `createAppCommands` itself. `@nocobase/app-cli` drops the `./database-command` and `./commands/i18n-check` subpaths that existed only for those files; `./hub-publishing` remains. An existing application generated from an earlier template re-exports those subpaths, so upgrading `@nocobase/app-cli` requires the same change there: delete `cli/database-command.ts` and `cli/commands/i18n-check.ts`, and move the `createAppCommands` call from `cli/standard-commands.ts` into `cli/commands/index.ts`. The helpers behind the two removed subpaths are no longer public.
- 05af1d4: Refresh the Collection cache when migrations change a schema

  `database/<connection>/collections/` went stale after every migration until someone ran `collections generate`. It is now refreshed where the schema changes:

  - `db apply`, `db redo`, `db rollback` and `db reset` regenerate it for each connection whose migrations they executed, rolled back or rebuilt. `--no-collections` skips it, and a built `dist/` never writes it. A failed refresh is a warning, not a failure: the migrations stay applied and the command still exits 0. With `--json`, the result gains a `collections` field listing each refresh; it is absent when nothing was refreshed.
  - `pnpm dev` does the same after the startup migrations of the application it started. `nocobase dev` names that application's root in `NOCOBASE_COLLECTIONS_REFRESH`, which `DatabaseProvider` compares against its own root, so a Hub's in-process applications and production never write the cache.
  - `refreshAppCollectionsArtifact()` in `@nocobase/app-server/database` is the shared implementation: given a database run's result, it regenerates the cache of every connection whose schema changed.

  Seeds and `db repair` or `db unlock` do not trigger a refresh. After editing an external connection's `metadata/`, or when another system changes its schema, run `collections generate` yourself.

- ec92b20: Plugin commands are `AppCommand`s and print the command envelope under `--json`. `scheduler sync` creates the application through `withApp()`, so it acts on the application the runner located rather than the current directory and always destroys the runtime. `workflow build` path flags are `appPath()` flags, so their defaults resolve against the application root from any directory. The CLI example's `artifact build` is a development command, and `pnpm plugin:create --with cli` generates an `AppCommand` with a test that uses `@nocobase/app-cli/testing`.

  The application Skill gains a reference on adding an application command, and the application templates and plugin `AGENTS.md` files describe commands in those terms: a command returns its result, throws `CommandError`, and creates the application with `withApp()` when it needs it. The templates import the CLI authoring API from `@nocobase/app-cli`.

- 2217eb2: The route dialog and drawer examples gain a "Show a notification" button that raises a toast from inside the overlay, showing that notifications stay above dialogs and drawers.
- dbf5631: The Default template registers the scheduler's command-line entry in `cli/plugins.ts`, so `pnpm nocobase scheduler sync` exists in a Default application as the scheduler documentation describes. The Examples and Hub templates ignore `/.env` like the Default template does, all three Docker build contexts exclude build output where builds write it — each workspace package's `dist`, not every directory named `dist` — so `@nocobase/app-cli`'s `dist` command sources reach an in-image build without an exception for them, and the agent guidance and READMEs describe the current layout: `package.json` scripts that call `nocobase`, `cli/plugins.ts`, the two scripts a built `dist/` carries, and hand-written external metadata under `database/<connection>/metadata/`.
- 757eedf: Guard unrestricted-only pages in the route guard and menus

  A page whose resolved `authz` is `'unrestricted'` — declared explicitly, or the default for a protected App or settings page that omits `authz` — is now checked through the authorization client's unrestricted requirement. Only identities with unrestricted access, such as root, can open it; for everyone else it is hidden from the App, settings and dev menus, and opening its URL shows "Access denied" without loading the page component. `AGENTS.md` describes the new rule: declare `authz` on the first page of every path, nested pages inherit it, and an omitted value no longer stops the application but defaults to unrestricted-only for protected App and settings pages and to `'skip'` for guest, optional and dev pages.

- Updated dependencies [ec92b20]
- Updated dependencies [dbf5631]
- Updated dependencies [ec92b20]
- Updated dependencies [757eedf]
- Updated dependencies [1b139b6]
- Updated dependencies [02d5402]
- Updated dependencies [ae43f41]
- Updated dependencies [8c06293]
- Updated dependencies [05af1d4]
- Updated dependencies [4adcf24]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
- Updated dependencies [dbf5631]
- Updated dependencies [2217eb2]
  - @nocobase/app-cli@1.0.0-beta.6
  - @nocobase/app-plugin-authorization@0.2.0-beta.20
  - @nocobase/app-plugin-authz-default-access@0.1.0-beta.4
  - @nocobase/app-plugin-authz-sharing-rules@0.1.0-beta.4
  - @nocobase/app-plugin-authz-restriction-rules@0.1.0-beta.3
  - @nocobase/app-plugin-workflow@1.0.0-beta.28
  - @nocobase/app-plugin-scheduler@0.1.0-beta.9
  - @nocobase/app-plugin-cli-example@0.1.0-beta.3
  - @nocobase/app-server@1.0.0-beta.27
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/app-plugin-i18n@0.1.0-beta.9
  - @nocobase/app-plugin-api-keys@0.1.0-beta.8
  - @nocobase/app-plugin-repository-example@0.1.0-beta.14
  - @nocobase/db-sqlite@0.1.0-beta.3
  - @nocobase/app-plugin-authorization-example@0.1.0-beta.6
  - @nocobase/app-plugin-database-explorer@0.1.0-beta.6
  - @nocobase/app-plugin-file-example@0.1.0-beta.11
  - @nocobase/app-plugin-users@1.0.0-beta.11
  - @nocobase/app-plugin-ai-employee@1.0.0-beta.23

## 1.0.0-beta.28

### Minor Changes

- d18e964: Declare environment variables on the configuration section they set, list them with `pnpm config:env`, and stop shipping environment variables nothing reads.

  `defineAppConfig` takes `env`, a map from variable to a mapping relative to the section, such as `{ APP_SERVER_PORT: envInteger('port') }`. The runtime loads these above the configuration file once the sections are known, and refuses one variable declared for two different fields. `defineAuthConfig` maps `AUTH_SECRET` itself, and the templates declare the rest in `server/config/session.ts`, `server.ts`, `app.ts`, `i18n.ts`, `snowflake.ts` and `spa.ts`. `server/environment.ts` is gone and `server/config.ts` loads only the configuration file. An existing application that keeps its own `server/environment.ts` still works, since a variable mapped twice to the same field is harmless; to move over, copy the `env` of each section file from the new template version and delete the mapping file.

  `pnpm config:env`, also in a built `dist/`, lists every variable the application reads — those its sections declare, with the configuration path each sets, and those the runtime reads itself, `APP_BASE_PATH`, `APP_CONFIG_FILE` and `NOCOBASE_STRICT_STARTUP` — and whether each is set, never its value. `--json` prints the same list. `RUNTIME_ENVIRONMENT_VARIABLES` in `@nocobase/app-server/config` names the runtime-read ones.

  `APP_NAME` is gone from the Hub's `.env.example` and from the `.env` that `create-app` writes for a Hub, which used to set it to the project directory's name: nothing read it, and an application's name follows from `APP_BASE_PATH`. The commented `API_CLIENT_*` lines are gone for the same reason. The Hub template gains a test that every variable `.env.example` names is one `config:env` lists. `pnpm build` no longer copies `DB_*`, `QUEUE_*`, `REDIS_*`, `SMTP_*`, `API_CLIENT_*` and the notification provider variables into `dist/.env`; nothing reads any of them.

### Patch Changes

- f6c3cd8: Let a configuration section declare validation and the fields the browser may read, and use it to hide sign-up when the server has disabled it.

  `defineAppConfig` in `@nocobase/app-server/config` now also takes an object, `{ defaults, validate, public }`, where `defaults` is an object or a function of the runtime; the function form keeps working unchanged. `validate` may be async and reports with `ctx.error(path, message, { fix })` and `ctx.warning(path, message)`. It runs when the application starts, where an error stops the start with every problem listed, on `AppConfig.reload()`, which refuses a configuration that breaks a rule and keeps the running one, and in `pnpm config:check`, which reports each problem with code `invalid`. `defineAppDatabaseConfig` now checks that `database.default` names a configured connection and that every connection sets a dialect. `checkConnections` moved from `@nocobase/app-cli` into `@nocobase/app-server/database`.

  `public` lists leaf fields, relative to the section, that are sent to the browser in a separate `public` block of the page's runtime configuration. The browser reads them with `config.public.get('<section>.<field>')` at the same path as on the server; `config.get` never returns them and, in development, throws when asked for one, and `config.public.get` warns with the published paths when asked for one that is not. Anything not listed is never sent, and an object, function or instance cannot be listed. `i18n.defaultLocale` is now always published this way; the client still falls back to `client.i18n.defaultLocale`. `pnpm config:check` lists the published values, and its `--json` result carries them under `public`.

  `@nocobase/app-plugin-authentication` adds `defineAuthConfig` for the `auth` section, which validates the `emailAndPassword` switches and publishes `emailAndPassword.enabled` and `emailAndPassword.disableSignUp`, and `useSignUpAvailable()` on the client. The templates declare `auth` with it, their `PasswordLoginForm` hides the sign-up link and `/register` redirects to `/login` while the server refuses sign-up. An existing application keeps working but must switch `server/config/auth.ts` to `defineAuthConfig({ defaults: { ... } })` for this to take effect; until then the plugin logs a warning at startup. Copy the updated `password-login-form.tsx` and `pages/auth/register.tsx` from the new template version to get the same behavior.

- c8ddd7d: Consolidate the authorization API. Resource types are either catalog types (`settings`, `composite`, `database.collection`), whose items and actions must be registered, or record types (`page`, `user`, `notification`, `hub.app`, `hub.host`), which declare type-level actions and judge each record; there are no `*` items. Business resources become composite resources, a built-in core mechanism: every Authorization has `authz.compositeResources` (which replaces `authz.business`) and reserves the `composite` resource type, so `businessPlugin()` is gone with no replacement and `resourceTypes.add({ type: 'composite' })` throws; `defineBusinessResource` is `defineCompositeResource`, every `Business*` type is `CompositeResource*` (`CompositeResource`, `CompositeResourceBuilder`, `CompositeResourceActionBuilder`, `CompositeResourceReference`, `CompositeResourceConditions`, `CompositeResourceApi`, `BindableCompositeResourcePermission` and so on) and the grant policy is `{ type: 'composite', scopes }`. Resource types carry no `title`: they are never displayed, and the library holds no translation keys. A composite composes exactly the grants its definition lists, on any type except another composite. A data scope no longer names a `collection`: it targets the one resource its grant actions address (`dataScopeTarget(action, key)`), whose type must declare `recordAccess: true` on `resourceTypes.add`, as `database.collection` does; `define` checks this when the type is registered, and `authz.compositeResources.validate()` and first use check types registered later. The library holds no display concepts. `@nocobase/app-plugin-authorization` provides `authz.ui`, also exposed to plugin setup contexts: `ui.sections.add` for the top-level sections `pages`, `business` and `administration` and one level of subsections (with `extend: true` for a subsection another plugin owns, as workflow owns `automation` and scheduler extends it), `ui.groups.add` for right-side groups, `ui.place(ref, { section, group? })`, and `ui.defaultSection(type, section)`. `pagesPlugin` registers the `pages.page` subsection, the only one the client fills, from its route tree. The client no longer remaps the `@nocobase/authorization` namespace. `authz.settings.add` no longer takes `section`; settings items and composites are placed with `authz.ui.place`, and unplaced ones land in their type's default section "Other". Startup validation runs after every provider has booted and reports unknown subsections and groups, placements of unregistered resources and unfit data scopes, throwing in development and logging a warning in production. A resource holds at most one default-access rule: the table is unique on `(resourceType, resourceId)` as well as `key`, and a second rule raises `DefaultAccessConflictError`, answered with 409. `authorizationToken` is the only service token: `permissionSetsToken` is gone, `authz.db` is now `authz.database`, settings items are registered with `authz.settings.add` and checked with semantic actions, and rule plugins build on `@nocobase/app-plugin-authorization/server/extension`. The client exposes `AuthorizationClient.snapshot/revision/invalidate/onInvalidated` and renamed management components. Every client page route must now declare `authz` (a check or `'skip'`); nothing is inferred from the route name. The authorization migrations and seeds were edited in place, including the new `key` column on default-access rules, so existing databases must be reset and reinstalled. A stored composite grant that no longer expands — an unknown action or data scope, an invalid scope value or policy — is skipped for that grant alone instead of failing every check of the identity: it permits nothing, a direct check of its action denies with `INVALID_GRANT`, and `createAuthorization({ onInvalidGrant })` is told once, which the application plugin logs; `authz.compositeResources.validateGrant` explains a stored grant, and the plugin's startup validation scans every stored Permission Set, throwing in development and warning in production. `authz.database.collections.add` treats a re-registration with the same actions as a no-op even when its title or description differ, keeping the first and reporting a startup warning through `collections.warnings()`; only different actions throw. `authz.resourceTypes.get(type).items.add(item)` remains the generic low-level item registration that `settings.add`, `database.collections.add` and `compositeResources.define` build on.
- 91cc403: `PageContainer`, `PageHeader`, `RouteDialog`, `RouteDrawer`, `RouteChildPage` and `useRouteOverlay` now come from the NocoBase UI Library, which publishes them as the `page-container`, `page-header`, `route-dialog`, `route-drawer` and `route-child-page` components, and plugins install those instead of copying template files. They stay in `client/components/` under the same names and import paths. The template copies now match the library: exports carry explicit types, every component merges class names with `cn` from `@/lib/utils`, and the route overlays' close button is translated under `routeOverlay.close` rather than `actions.close`. Existing applications need no change; to adopt the library versions, run `npx shadcn@latest add @nocobase/page-container @nocobase/page-header @nocobase/route-dialog @nocobase/route-drawer @nocobase/route-child-page`, let it overwrite each copy you have not customized, and add `routeOverlay.close` to `client/locales/`.
- Updated dependencies [c2aceaa]
- Updated dependencies [c2aceaa]
- Updated dependencies [c2aceaa]
- Updated dependencies [c2aceaa]
- Updated dependencies [c2aceaa]
- Updated dependencies [c2aceaa]
- Updated dependencies [c2aceaa]
- Updated dependencies [c2aceaa]
- Updated dependencies [c2aceaa]
- Updated dependencies [5537a22]
- Updated dependencies [c2aceaa]
- Updated dependencies [f6c3cd8]
- Updated dependencies [c8ddd7d]
- Updated dependencies [f3917b6]
- Updated dependencies [0b37436]
- Updated dependencies [d18e964]
- Updated dependencies [0231d46]
  - @nocobase/app-plugin-ai-employee@0.1.0-beta.22
  - @nocobase/ai-employee@0.2.0-beta.8
  - @nocobase/app-server@1.0.0-beta.26
  - @nocobase/app-cli@0.1.0-beta.5
  - @nocobase/app-plugin-authentication@1.0.0-beta.23
  - @nocobase/authorization@0.1.0-beta.9
  - @nocobase/app-plugin-authorization@0.2.0-beta.19
  - @nocobase/app-plugin-authz-default-access@0.1.0-beta.3
  - @nocobase/app-plugin-authz-sharing-rules@0.1.0-beta.3
  - @nocobase/app-plugin-authz-restriction-rules@0.1.0-beta.2
  - @nocobase/app-plugin-workflow@0.1.0-beta.27
  - @nocobase/app-plugin-scheduler@0.1.0-beta.8
  - @nocobase/app-plugin-users@0.1.0-beta.10
  - @nocobase/app-plugin-notification@0.1.0-beta.17
  - @nocobase/app-plugin-notification-in-app@0.2.0-beta.18
  - @nocobase/app-plugin-api-keys@0.1.0-beta.7
  - @nocobase/app-plugin-authorization-example@0.1.0-beta.5
  - @nocobase/app-plugin-file-example@0.1.0-beta.10
  - @nocobase/app-plugin-repository-example@0.1.0-beta.13
  - @nocobase/app-plugin-routes-example@0.1.0-beta.15

## 1.0.0-beta.27

### Patch Changes

- 8240685: Replace the frontend references of the application development Skill with a frontend workflow, UI guidelines and a frontend handbook under `references/frontend/`.

  `references/frontend/ui-workflow.md` is now where every change under `client/` starts: it decides between a full workflow (a design file reviewed once, then an independent acceptance review with screenshots) and a quick change (edit directly, static checks only), and says what to read at each step. `ui-guidelines.md` holds numbered Must/Should rules for page templates, overlays, states, copy and accessibility, used to design pages and to review designs and implementations. `frontend-dev.md` routes each task to a topic document in `references/frontend/references/` — pages and routes, child routes, route-first dialogs and drawers, forms, calling endpoints, tables, styling, theme tokens and presets, copy and translations, frontend tests — with complete examples. The workflow ships fill-in templates for its artifacts and a Playwright screenshot script.

  The references these documents replace are removed: `client-pages-and-routes.md`, `client-child-routes.md`, `components-and-styling.md`, `react-hook-form.md`, `header-actions.md`, `client-api.md`, `theme-tokens.md` and `themes.md`. `i18n.md` now covers server-side text, the languages the application offers, the default language and fallback, and `testing.md` points frontend testing to the new handbook. Each template's `AGENTS.md` and `CLAUDE.md` point at the new documents.

- d7543b5: Support users.initialAdmin.email for fresh installations, defaulting to admin@nocobase.com when omitted, and document every initial administrator field in the template configuration examples.
- d5a18ff: Ship a `Dockerfile` and `Dockerfile.dockerignore` with every application template. The image builds the application from its own sources with `pnpm build`, cross-targets native modules for multi-platform builds, and runs `node dist/server/standalone.js` as the `node` user without pnpm, with configuration at `/app/config.yml` and storage at `/app/storage`. Set the mount path with `--build-arg APP_BASE_PATH=...`; `.env` is not copied into the image. `--build-arg DIST=prebuilt` packages a `dist/` built beforehand with `pnpm build --target linux-<arch>` instead, after checking that it matches the image's platform, Node major and mount path, and without its `dist/.env`. Existing applications do not receive these files on upgrade: copy both from the new template version. The official Hub image is now built from the Hub template's Dockerfile, keeps its data in `/app/storage`, and no longer fails to start with `EACCES` when `HUB_STORAGE_DIR` is unset; a deployment that mounted `/app/dist/storage` should mount the same volume at `/app/storage` instead.
- Updated dependencies [d7543b5]
- Updated dependencies [441a3ef]
  - @nocobase/app-plugin-authentication@1.0.0-beta.22
  - @nocobase/app-plugin-users@0.1.0-beta.9

## 1.0.0-beta.26

### Major Changes

- 4e58fe3: Remove `@nocobase/app-plugin-install` and the install mode it existed for. Configuration is written by `nocobase app config init` before an application is started.

  The plugin redirected an application to `/install` whenever the authentication secret was the temporary one the runtime invented for an application with no configuration file. That page could never be reached from an application made by `create-app`, which always wrote a `config.yml` and so never entered install mode; it was undocumented, and a Hub-hosted application receives its configuration from the Hub instead. With the templates no longer shipping a configuration file at all, an unconfigured application has no database driver decision made either, and nothing left to serve the page with.

  `resolveAuthSecret` no longer takes the application root and no longer invents a secret. A secret generated at boot is different on every restart, which silently invalidates every session; a missing one is now an error that names the command which writes it. Applications upgrading from an earlier version remove `@nocobase/app-plugin-install` from `package.json` and drop its entries from `client/plugins.ts` and `server/plugins.ts`; applications that had come to rely on the installation page configure themselves with `pnpm config:init` instead.

### Minor Changes

- 4e58fe3: Add `nocobase app config check` and `nocobase app config set`, run in an application as `pnpm config:check` and `pnpm config:set`, so a configuration is written by `config:init`, changed by `config:set` and verified by `config:check`.

  `config:check` loads the configuration through the application itself — its files, its environment and its code defaults — without starting it. A file that fails to parse, or a database driver that is not installed, fails here for the same reason it would fail a start. It then reports what loading alone does not show: a secret missing or still the placeholder, a `session.secret` that is regenerated at every start and so ends every session with the process, a top-level section nothing reads with the name that was probably meant, and a `${NAME}` written where it is not expanded and would be used as literal text. Databases other than SQLite are connected to, one connection each taken from the pool and handed back, without running SQL or migrating anything; `--connect` includes SQLite and `--no-connect` stays offline. Each finding carries the key and, where there is one, a command that fixes it, and the command exits non-zero on any error, or on any warning with `--strict`.

  `config:set` sets `key=value` assignments in the file the application reads, keeping its comments, and writes it once. A key under a section the application does not know is refused with the nearest known one, so a typo fails instead of being written where nothing reads it. With `--from-env` each value names an environment variable to read, so a secret stays out of the command line. After writing it loads the configuration again and reports any key an environment variable overrides.

  `config:init` now returns its `nextCommands` and, for a database other than SQLite, the `requiredSettings` still at a placeholder. On a terminal it asks for them, reading the password without echo, and tries the connection before writing. Run on an application that is already configured it leaves the file alone and reports `unchanged`, failing only when `--dialect` asks for a different database than the one configured.

  A built `dist/package.json` carries `config:check` and `config:set` scripts, and its `pnpm-workspace.yaml` sets `verifyDepsBeforeRun: false`, so running one of a deployment's own scripts never makes pnpm install first. `create-app` includes `pnpm config:check` in the `nextCommands` it returns.

  `AppConfig` gains `layers()`, which returns the code defaults and the values the application's own sources supply as separate read-only copies — the distinction a check needs to tell a known section from a misspelled one.

- 4e58fe3: Add `nocobase app config init`, which writes the configuration file an application starts from, and run it in an application with `pnpm config:init`.

  It generates `config.yml` from the application's `config.example.yml` so the example's comments reach the file people edit, fills in `auth.secret` and `session.secret`, and points `database.connections.main` at the selected dialect while leaving every other connection alone. The dialect defaults to the installed driver when there is exactly one, is asked for on a terminal when there are several, and must be given with `--dialect` in a script.

  The command installs nothing. Which dialects an application can run on is decided by the driver it depends on, so a missing one is reported with the `pnpm add` that supplies it — pinned to the range the installed `@nocobase/app-server` declares for that driver, because the newest release is not necessarily one the runtime was built against — rather than installed behind the user's back — in a deployment, where adding a driver to a built `dist` would be undone by the next build, it reports that the application has to be built again instead. Everything is validated before anything is written, so a run that reports a problem leaves the directory untouched and can simply be repeated once the driver is there.

  The three application templates now declare `@nocobase/db-sqlite`, the driver their own `server/config/database.ts` defaults to, so a new application can be configured and started without installing one first.

  `@nocobase/app-server` exports `OFFICIAL_DIALECTS` and `OfficialDialect` from `@nocobase/app-server/database`, so tooling that has to name the dialects reads the same list the runtime loads drivers from.

  The application development and deployment Skills describe the new step: how an application is configured, that the driver decides which dialects it can run on, and that a deployment writes its configuration with `pnpm config:init` inside `dist/`, from the `config.example.yml` the archive carries. The database Skill shipped with `@nocobase/db` now points at `pnpm config:init` rather than at a creation flag that no longer exists.

### Patch Changes

- 1c46a0b: Add an application-owned internationalization example with interactive plurals, isolated missing-translation fallbacks, and regional number, currency, and date formatting.
- 4e58fe3: Stop declaring the MySQL, Oracle and PostgreSQL drivers. They date from when a template registered its drivers explicitly in `server/config/database.ts`; drivers load automatically now, and none of the Examples template's connections uses them — all three are SQLite.

  With four drivers installed, `pnpm config:init` cannot tell which one a new application means to use, and without a terminal to ask on it refuses rather than guess. The step every generated application is told to run next therefore failed for Examples in any scripted or agent-driven setup, while Default and Hub, which declare only SQLite, succeeded. Each of the unused drivers was also installed into every deployment. An application that wants one of them adds it with `pnpm add` and names it with `pnpm config:init --dialect`.

- aec05e1: Improve the notification task example with consistent task forms, server-side pagination, record counts, and responsive inbox error styling.
- 1124eeb: Revert the Settings theme page and the converted theme presets.

  Theme selection returns to the header's Appearance popover, which again offers both the color mode and the theme list, and Settings → Theme is removed. The 30 presets converted from tweakcn are removed, the Compact and Spacious presets return in place of the single `default` density, and the `appearance` locale block goes back to `title`, `mode`, `preset`, `light`, `dark` and `system`. The theme references in `@nocobase/app-skills` describe the popover again, while keeping the guidance that surface and outline tokens name a layer rather than a shade.

- Updated dependencies [cda1175]
- Updated dependencies [e286e0d]
- Updated dependencies [808bf34]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [aec05e1]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [80ef702]
  - @nocobase/app-plugin-authentication@1.0.0-beta.21
  - @nocobase/app-plugin-authorization@0.2.0-beta.18
  - @nocobase/app-plugin-authz-default-access@0.1.0-beta.2
  - @nocobase/app-plugin-authz-sharing-rules@0.1.0-beta.2
  - @nocobase/app-plugin-authz-restriction-rules@0.1.0-beta.1
  - @nocobase/app-cli@0.1.0-beta.4
  - @nocobase/app-server@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.15
  - @nocobase/app-plugin-notification-example@0.1.0-beta.1
  - @nocobase/app-plugin-notification-in-app@0.2.0-beta.17
  - @nocobase/app-plugin-users@0.1.0-beta.8
  - @nocobase/app-plugin-authorization-example@0.1.0-beta.4
  - @nocobase/app-plugin-queue-example@0.1.0-beta.7
  - @nocobase/app-plugin-repository-example@0.1.0-beta.12
  - @nocobase/app-plugin-routes-example@0.1.0-beta.14
  - @nocobase/app-plugin-skills-example@0.1.0-beta.4
  - @nocobase/app-plugin-ai-employee@0.1.0-beta.21
  - @nocobase/app-plugin-api-keys@0.1.0-beta.6
  - @nocobase/app-plugin-database-explorer@0.1.0-beta.5
  - @nocobase/app-plugin-notification@0.1.0-beta.16
  - @nocobase/app-plugin-scheduler@0.1.0-beta.7
  - @nocobase/app-plugin-workflow@0.1.0-beta.26

## 0.1.0-beta.25

### Patch Changes

- b00290d: Declare `tsx` and `typescript` as peer dependencies of `@nocobase/app-tools`, and stop loading the TypeScript compiler on every `pnpm dev`.

  `dev` spawns three executables it never imports — `vite`, `tsx`, and `nocobase` — and only two of them were declared. `tsx` sat in `devDependencies`, which are not installed for a consumer, so an application that installed `@nocobase/app-tools` from a registry carried no statement that it needed one. Nothing caught it: every template declares `tsx` for its own use, so the binary resolves in this repository and in any application generated from a template, and is absent only in an application that never installed it. Neither `pnpm deps:check` nor `pnpm peers:check` could have caught it either, because both read import specifiers and a spawned binary has none. Both checks now cover `packages/tools`, the package README carries a table of the executables these scripts spawn, and AGENTS.md records that a spawned tool is a dependency too.

  `typescript` moves from `dependencies` to `peerDependencies` for a different reason. It is imported directly, to parse `server/plugins.ts` without running it, while the build compiles through the application's own `pnpm exec tsc`. That is two copies, and a version split between them fails silently: the application compiles syntax the older parser then cannot read, `resolvePluginWatchIncludes` returns nothing, and editing a workspace plugin quietly stops restarting the server. **An application that does not already declare `typescript` must add it** — every template does, so an application generated from one needs no change.

  That parse is now gated as well. It can only ever name a workspace neighbour, so a `server/plugins.ts` naming none of them is answered without importing the compiler at all. Every `pnpm dev` in a generated application was loading 24 MB of TypeScript to be told there was nothing to watch. `resolvePluginWatchIncludes` is asynchronous as a result.

  `cross-spawn` and `tar` move to the workspace catalog, which also settles `tar` on a single range: `@nocobase/app-host` and `@nocobase/app-plugin-hub` were one minor version behind the four other declarations. The three templates drop their own `cross-spawn` and `tar` entries, which nothing in them has imported since these scripts moved into `@nocobase/app-tools`.

- 8f1ead4: Add `nocobase app db doctor`, which compares stored Collection metadata with the schema behind it and deletes the records whose table is gone.

  The physical schema and the Collection metadata are two records of what exists, and they can disagree: a table dropped outside a migration leaves its metadata record behind, and from then on resolving that Collection fails — including inside the migration that would recreate it, which is how the state becomes self-sustaining. Until now nothing reported it and nothing fixed it, so the only way out was deleting rows from `__nocobase_collection_metadata` by hand, which the documentation forbids for good reason.

  `ConnectionCollections.diagnose()` walks every metadata record, reports the ones whose physical table is missing as `COLLECTION_TABLE_MISSING`, and for the rest reports whatever resolving them reports. Only a missing table is marked `orphaned`, because deleting the record is then a complete fix; every other issue means the table is there and something in it no longer matches, which a migration has to reconcile.

  `db doctor` prints what disagrees per connection and exits non-zero while anything remains. `--fix` deletes the orphaned records and leaves the rest alone, `--connection` and `--all` select connections as they do elsewhere, and `--json` carries the result. The three templates gain a `db:doctor` script.

  `runAppCollectionsDoctor` is exported for hosts that run it themselves, and the connection selection the artifact generator already had is now shared rather than duplicated.

  The migrations reference also records why `onChecksumMismatch` defaults to `warn` and when to set `error` for a connection. The default was an implicit choice in the code, leaving a reader no way to judge whether to flip it: a checksum hashes the migration's file contents, so formatting the directory changes it and `error` would then stop the application from starting; startup runs migrations, so refusing to run turns drift into an outage on an upgrade where the compiled representation hashes differently. Nothing about the behaviour changes.

- 2ae6b2b: Ship the `nocobase-deployment` Skill with `@nocobase/app-skills`, so `nocobase skills sync` delivers it to every generated application instead of leaving it in the source repository where an application's agent never sees it. The Skill now reads the application's own README rather than repository paths, says that `pnpm build` already installs production dependencies into `dist/` and that `pnpm install --prod` there is a repair rather than a deployment step, and names both ways to enable a workflow whose deployed hash changed: **Enable new version** in workflow management, or the enable route called with the new hash. Each template's `AGENTS.md` points at the Skill next to the upgrade Skill, and the README's deployment section explains the same `pnpm install --prod` relationship.
- 77d34b6: Stop a dependency install from restarting the development server mid-way, refuse a second development server for one application root, and shorten the development shutdown budget so a restart is not force-killed.

  `package.json` was handed to the file watcher as an `--include`, so an install restarted the server on its first write and again on the later ones. The server came back against a half-installed `node_modules`, and a write arriving while it was still shutting down is where the watcher escalates SIGTERM to SIGKILL — which skips releasing the migration lock. The manifest, the lockfile and the package manager's install state are now watched here instead, and the restart waits for all of them to stay quiet, so one install produces one restart.

  A second `pnpm dev` for the same application root is refused, naming the first one's process id. Nothing else caught it: the port check advances to the next free port, and the duplicate then failed on the migration lock the first server holds, before it bound anything — an error that names neither cause nor remedy. `NOCOBASE_DEV_ALLOW_MULTIPLE=true` starts one anyway, a run that only proxies a remote backend does not take the lock, and a lock left by a killed run is taken over rather than reported.

  `APP_SHUTDOWN_TIMEOUT_MS` sets the total shutdown budget: the force exit lands on it and the HTTP drain a second earlier. `pnpm dev` supplies four seconds, inside the five the watcher waits before force-killing, so a development restart shuts down on its own and releases its locks. A deployment keeps the 30 second drain and 35 second force exit, which suit a load balancer. `resolveNodeShutdownTimeouts` is exported and `StandaloneServer` carries the resolved `shutdownOptions`.

  Checksum drift now names both ways out instead of one. `db repair` was the only suggestion, and it is the wrong one whenever the edit changed what the migration does: repair records that the source and the schema agree, so using it there makes an un-applied change look applied. The CLI and the startup log now point at `db repair` for an edit that left the schema identical and at `db redo` for one that did not.

- e612b11: Answer to `db rollback`, `db redo`, `db unlock` and `db doctor`, and stop making every shared command re-export itself from its own file.

  The four commands were added to the map `@nocobase/app-cli` hands an application, but `cli/commands/index.ts` is what the CLI actually loads, and it listed each shared command separately. A command present in the first and missing from the second answers to nothing: `pnpm db:doctor` reported `Command app:db:doctor not found`, and so did the other three. The test that was supposed to cover this asserted the wrong map — it checked what the CLI package exports rather than what this application loads, so it passed the whole way.

  `cli/commands/index.ts` now spreads the shared map instead of naming its entries, which removes the place to forget: a shared command added later is reachable without touching the template. The per-command files that only re-exported one key each are gone, and the test compares both maps rather than listing names, so a future application that hand-picks commands and misses one fails instead of shipping a command nobody can run. `cli/commands/i18n-check.ts` stays, because it also re-exports `checkAppLocales`.

  An application generated from an earlier template keeps working as it is. To reach the four commands it needs the same change: pass the shared map through in `cli/commands/index.ts`, or list the new entries alongside the existing ones.

- ffafc2a: Use unique Channel map keys for sending, test sending, runtime isolation and retries. Preserve message types separately in delivery records and reject retries after the original Channel or Provider becomes unavailable. Migrate existing Channel identities and update application configuration and integration guidance.
- ffafc2a: Add a runnable task assignment example that persists tasks and sends in-app notifications with task summaries.
- ffafc2a: Replace notification configuration with named single-Provider Channels and send complete messages through a Channel-keyed map. Validate all messages before enqueueing, deliver native recipients independently, and retain retries bound to the original Channel and Provider. Simplify the test form and remove Provider instance names from delivery records with a new migration.
- a1a8690: Expire a task lock whose holder was killed, and add `nocobase app db unlock` to inspect and release one.

  A run that is hard-killed — SIGKILL, a stopped container, a lost machine — runs no cleanup, so its lock row survived it and every later run waited out the acquire timeout and then failed, until somebody deleted the row by hand. A holder now refreshes a `heartbeat_at` column every five seconds while it works, and a lock that has not been refreshed for thirty seconds is taken over by the next run, which then continues normally. The takeover is reported through `onStaleLock` and logged by the application, because it means a previous run did not shut down cleanly. A working run is never taken over: several missed beats are tolerated, so a slow database does not hand the lock to a second run.

  The lock table gains `heartbeat_at`, added in place when the table predates it. It cannot be a migration: the lock is what every migration runs inside.

  `db unlock` reports who holds each lock — the owner, when it was taken, and its last heartbeat — and releases the ones that have stopped beating. A lock that is still beating is reported rather than released; `--force` releases it anyway, which lets a second run start beside the first. It covers the migration and the seed lock together, takes `--connection` / `--all` / `--json` like the other database commands, and needs no migration or seed directory, since startup and plugins take the same locks. The three templates gain a `db:unlock` script.

  `Migrator` and `Seeder` gain `lock()`, which reads the lock without creating its table, and `unlock(options)`. `AppDatabaseTaskOperation` gains `'unlock'`, and a task result carries `lock`, `released` and `lockReason`. The exhausted-wait message now names the last heartbeat and points at `db unlock` rather than at deleting a row by hand.

- 183751a: Synchronize application Skills after installation and consolidate client and server development guidance into each template's root AGENTS.md.
- f5b066d: Point the shadcn registry at the hosted NocoBase UI Library.
- Updated dependencies [8f1ead4]
- Updated dependencies [77d34b6]
- Updated dependencies [ffafc2a]
- Updated dependencies [ffafc2a]
- Updated dependencies [ffafc2a]
- Updated dependencies [ffafc2a]
- Updated dependencies [ffafc2a]
- Updated dependencies [ffafc2a]
- Updated dependencies [ffafc2a]
- Updated dependencies [a1a8690]
- Updated dependencies [2ae6b2b]
  - @nocobase/db@1.0.0-beta.14
  - @nocobase/app-server@1.0.0-beta.24
  - @nocobase/app-cli@0.1.0-beta.3
  - @nocobase/app-plugin-notification@0.1.0-beta.15
  - @nocobase/app-plugin-notification-in-app@0.2.0-beta.16
  - @nocobase/app-plugin-notification-providers@0.2.0-beta.7
  - @nocobase/app-plugin-notification-example@0.1.0-beta.0
  - @nocobase/app-plugin-workflow@0.1.0-beta.25

## 0.1.0-beta.24

### Minor Changes

- fa01814: Add `db apply` and `db reset`, and retire `migrate --fresh`.

  `nocobase app db apply` (`pnpm db:apply`) runs migrations and seeds as one plan, in the order startup runs them: each connection is migrated, then seeded. Only pending tasks run, so repeating it is safe. `nocobase app db reset` (`pnpm db:reset`) drops every managed schema object first and reruns both from empty; it asks for confirmation and requires `--force` in CI or a non-interactive terminal.

  `migrate --fresh` is removed and now exits with a pointer to `db reset`. It rebuilt the schema without reseeding, so it left the seed history cleared and no seed executed — the default connection recovered on the next startup, and a connection with `autoRun: false` did not.

  The `migrate` and `seed` commands are removed along with their template scripts; `db apply` replaces both. Running one half on its own is not a separate command, because both halves apply only what is pending: on an already-migrated database `db apply` applies seeds alone, and the one case it does not cover — migrating ahead of a deployment without seeding — can be served by a flag later without breaking anything.

  `runAppDatabaseTasks` accepts several task kinds in one plan through its `kind` option, which is what makes a reset correct across both kinds: one plan means a connection's schema is rebuilt by its migrations task before its seeds run.

### Patch Changes

- 709f9ed: Update Better Auth and API keys to 1.7.5 and align fresh authentication databases with provider-based account identity. Existing authentication databases must be recreated; the original account migration has changed and no compatibility migration is provided.
- d696700: Stop the `bubblegum` theme from turning settings pages into competing hues, and fix the token misuse it exposed.

  The preset was carried over from tweakcn verbatim, and upstream spends the generic surface and outline roles on decoration: `--card` was a cream 101 degrees of hue away from the pink `--background`, `--border` was `--primary` itself at chroma 0.18 against a median of 0.02 across the other thirty presets, and `--muted` was a cyan. One demonstration card and a few dividers carry that; a settings page stacking several panels over dozens of hairlines does not, and pages showed pink, cream, cyan and teal at once. Six light values are retuned — `--card`, `--border`, `--muted`, `--input`, `--sidebar-border` and `--sidebar-primary` — keeping those roles in the background's hue family and leaving the preset's colour in `--primary`, `--secondary` and `--accent`. The dark values, the radius, and every other preset are unchanged, and `THIRD-PARTY-NOTICES.md` records the deviation.

  The same pages also used tokens for something other than their role, which no neutral preset makes visible. Authorization's two page shells and four Hub pages painted the whole page with `bg-muted/20`, which is the page surface and belongs to `bg-background`; under a preset whose `--muted` is a real colour that was a film over the entire viewport. The AI employee page's read-only fields hand-rolled `bg-muted/40` instead of using the shared `Input` and `Textarea` with `disabled`, three information callouts were fixed `bg-blue-50`, and the MCP transport labels were fixed `bg-blue-100`/`bg-green-100`/`bg-amber-100`; the transports now take their three tones from the theme's chart series, which is what a preset defines to be told apart.

  Three fixed colours on settings pages are corrected while they are in hand. The AI employee page's missing-knowledge-base warning and the schedule detail page's target-issue icon named a light-mode ink with no dark counterpart, so both were close to unreadable on a dark card; they now carry one. The routes example reported a load failure in a fixed red, which is what `--destructive` is for.

  The theme authoring reference and the token reference now state the rule, so a preset converted tomorrow is checked against it.

- fa01814: Report migration and seed checksum drift as a warning instead of failing, and add `nocobase app db repair` to realign the recorded history.

  An executed migration or seed whose source has since changed no longer stops the run. `latest()`, `rollback()` and `run()` return the drift in a new `warnings` field, the CLI prints it, `--json` carries it, and startup logs it through the application logger. Set `onChecksumMismatch: 'error'` on a connection's `migrations` or `seeds` configuration, or at the top level, to keep refusing to run. A history record whose migration is missing from the sources entirely still fails regardless of the policy.

  `pnpm db:repair` rewrites recorded checksums to match the current sources, covering both migrations and seeds in one command. It previews before writing, prompts for confirmation unless `--force` is passed, supports `--dry-run` for inspection in CI, and conditions every write on the checksum it read, so a history changed in between fails rather than being overwritten. It never deletes a history record, so a repair cannot make an executed task run again.

- 7bde7bd: Add `nocobase app db rollback` and `nocobase app db redo`, so a migration corrected before its branch is merged can be re-run without resetting the database.

  Editing an executed migration changes nothing on its own: it is recorded as executed, so `db apply` skips it and the database keeps the schema the old source produced. Until now the only way forward was `db reset`, which drops every managed table and every row with it, or editing the history table by hand — which the documentation forbids, and which splits the two records of what exists: dropping a table without its metadata record leaves the Collection unresolvable.

  `db rollback` runs `down()` for the latest migration batch, newest first, and deletes its history records. The batch is the unit the history records, so a batch that mixed application and plugin migrations rolls back as one, and the confirmation lists every migration with the package it belongs to before anything runs. It fails having run nothing when a migration in the batch is irreversible or has no `down()`. `db redo` is that followed by `db apply`. Both are destructive in the same way and confirm the same way: CI and non-interactive terminals require `--force`, `--connection` and `--all` select connections as they do elsewhere, and `--json` carries the result. Seeds are not re-run, so rows a seed inserted into a table the batch recreates are not restored.

  `Migrator.rollback()` accepts `{ dryRun: true }`, which is what the confirmation is built from: it takes the lock, resolves the batch, rejects an irreversible one, and reports what a run would undo without running any `down`. `MigrationRollbackResult` gains `records` — the batch's history records in rollback order, carrying each migration's package — and `dryRun`. `AppDatabaseTaskOperation` gains `'rollback'`, which applies to migrations alone: a plan including seeds is refused, because seeds have no inverse.

  The three templates gain `db:rollback` and `db:redo` scripts. The migrations reference now documents re-running a corrected migration, states what `db:repair` is and is not for — it records that the schema already matches, so using it on a change the database never received leaves the schema wrong and nothing recording that — and lists each internal table with the command that maintains it.

- dd0e02c: Use Execa to manage development process trees, preserve cleanup on repeated termination signals and launcher exit, and report startup progress. Remove automatic native watcher probes; polling is now explicitly configured.

  Exclude installed dependencies from server file watching, including pnpm dependencies outside the application's directory.

- ea91af0: Load the application's TypeScript compiler through a file URL so full Skills synchronization works on Windows, and preserve compiler loading errors instead of reporting them as a missing installation.

  Use directory junctions and normalize glob paths in the application template tests so they run on Windows without elevated symbolic-link privileges.

- ca3188e: Stop formatting the generated Collection artifacts under `database/<connection>/collections/`.

  Each template's `.prettierignore` now names that path. The artifacts are written by `pnpm collections:generate` through a stable serializer so that `pnpm collections:generate --check` can regenerate them and compare byte for byte; Prettier collapses their short arrays and objects onto single lines, which made that check report them as out of date when nothing about the schema had changed.

- 56613b2: Index `client/pages/reference/` so an agent can find the right page instead of listing the directory. A new `README.md` there maps the screen being built to the example page and the blocks inside it, and the interaction needed to the component page that demonstrates the primitive, with the Base UI API detail each one is easy to get wrong; every example page now opens with a module comment naming the patterns it holds, the component or block holding each one, and the parts that are demonstration filler.

  The application development Skill points at that README and turns "read a worked page" into ordered steps: pick the page from the table, read its header, open only the blocks the task needs, check the primitives exist, copy the skeleton without the mock data or frame, and move the strings into the application locales. Its components reference gains a section on Base UI composition — `render` in place of `asChild`, `data-icon` on icons beside text, grouped menu items, nullable `onValueChange` values — and a table of the compositions the template ships in `client/components/`, including that `toast.add` needs a `Toaster` the shell does not mount.

- d4783c2: Guide application agents to scope formatting, lint, type checking, tests, builds, and runtime verification to affected files, projects, or packages, expanding checks only when the impact requires it.
- fc34a66: Exclude `.agents/skills/` and `.claude/skills/` from ESLint and Prettier. Skills are prose written for agents to read rather than source to reflow, an application's copies are replaced wholesale by `skills:sync`, and `.claude/skills/` holds symbolic links into `.agents/skills/` — so formatting through one checked the same file twice and wrote the result back into the directory it points at.
- ca3188e: Run the CLI-backed package scripts through `tsx ./cli/index.ts` directly instead of through `pnpm nocobase`.

  `db:apply`, `db:reset`, `db:repair`, `collections:generate`, and Default's `upload` and `deploy` were each defined as `pnpm nocobase app <command>`, so running one started a second `pnpm run` inside the first. Both layers report a failure, which turned the single intended non-zero exit of `collections:generate --check` into two `ELIFECYCLE` lines and made it read as two failures. Each script now names the entry point it runs, and `pnpm nocobase <topic>` remains the way to reach a command that has no script of its own.

- f5b066d: Move zod to runtime dependencies so application deployments include it.
- ca3188e: Publish the `database/` directory by part rather than whole, so generated Collection artifacts stay out of the tarball.

  `files` listed `database`, and npm applies that whitelist ahead of every ignore file, so whatever `pnpm collections:generate` had written under `database/<connection>/collections/` was published with the template. Those files are a snapshot of one machine's database, down to the dialect's physical types and Oracle's generated sequence names, so what a template shipped depended on whether someone had run the generator locally and against what. Neither `.gitignore` nor `.npmignore` could take them back out. `@nocobase/app-template-examples` was carrying 214 such files, 1.1 MB, from an Oracle database, in a template whose `config.example.yml` offers SQLite.

  `files` now names `database/tsconfig.json`, `database/*/migrations/**` and `database/*/seeds/**`, plus Examples' `database/externalCrm/collections/**`, which is the metadata source for an external connection rather than generated output. Each template also ignores its managed connections' collections directories, and `create-app` writes the same entry into a generated application.

- 56613b2: Carry the shadcn/ui primitive set, the documented compositions and the reference pages across from Default, so all three templates start an application from the same UI vocabulary. `client/components/ui/` grows to the full 52-component registry set plus the `use-mobile` hook the sidebar depends on, and `button.tsx` and `badge.tsx` now export their `cva` variants for the primitives that compose them.

  `client/components/` gains the compositions shadcn documents without publishing — `DataTable` with `DataTableColumnHeader`, `DataTablePagination` and `DataTableViewOptions`, `DatePicker` and `DateRangePicker`, and the `Typography*` prose primitives — with their strings in the application locales. Hub also gains `actions.close`, which its locale was missing.

  `client/pages/reference/` arrives whole: eight complete business screens on mock data under `examples/`, one page per primitive under `components/`, and the frame both share. Nothing routes them in any template, so a production build never reaches them and no user sees one; each template's `tests/logic/client-routes.test.ts` now fails if one does, `tests/logic/locale-coverage.test.ts` fails on a key only one language has, and `tests/components/reference-pages.test.tsx` renders all of them against the English wording. Both `AGENTS.md` files point an agent at these pages before it builds one of its own.

- d696700: Make the compact density the only density and call it Default.

  Settings → Theme no longer offers Compact and Spacious as two cards with one palette. The former Compact preset is now `default`, the fallback every fresh browser starts on, and the former Spacious preset is gone. Every other preset takes the same `--spacing` of `0.2rem` and the same tighter line heights from `sm` to `4xl`, so switching palettes never changes the density; each keeps its own corner radius. A browser that saved `compact` falls back to `default` and sees the same theme; one that saved `default` now sees it at the compact density.

  The `appearance.themes.compact` label is removed and `appearance.themes.default` reads "Default" / "默认". The theme references record `default` as the fallback and the new typography values.

- d696700: Ship 30 more theme presets, converted from the tweakcn collection.

  An application now starts with 32 presets to choose from in Settings → Theme: the two it had, and 30 palettes covering minimal, warm, pastel, brutalist, terminal and night looks. A converted file states the same tokens as the shipped presets — the fonts, text sizes, spacing and shadows Default defines — and takes only the colours and corner radius from upstream, so each one reads as Default with a different palette and none needs a font resource. The upstream opacity, shadow, letter-spacing and spacing values stay out, which is what keeps CJK rendering and density consistent across the grid.

  The palettes are the upstream ones and have not been re-audited for contrast against this application's components. The theme reference now records the conversion rules, and `client/theme/themes/THIRD-PARTY-NOTICES.md` in each template names the source revision, the Apache-2.0 licence and the values the conversion drops.

- d696700: Move theme selection out of the header popover and onto a Settings page.

  The header entry is now a single button that switches between light and dark and says what it does through its tooltip and accessible label, instead of a popover offering both the color mode and the theme list. Choosing a theme is a longer-lived decision and gets a page of its own: Settings → Theme renders every registered preset as a preview card in an auto-filling grid with the selection marked, and filters the grid through a search field, so an application with dozens of themes stays workable. Selection still lives in the browser, under the same storage keys and `config.yml` defaults.

  The page declares `authz` on its route, so it is visible to administrators by default and grantable to another role through the permissions interface like any other page. `system` stays a valid configured default: the header button moves to the opposite explicit mode on its first click.

  The `appearance` locale block now carries `toggle` and `theme.{title,description,search,empty}` in place of `title`, `mode`, `preset`, `light`, `dark` and `system`; the theme labels under `appearance.themes` are unchanged. The themes and header-action references describe the new page and the in-place toggle.

- Updated dependencies [709f9ed]
- Updated dependencies [d696700]
- Updated dependencies [fa01814]
- Updated dependencies [ca3188e]
- Updated dependencies [38e5253]
- Updated dependencies [fa01814]
- Updated dependencies [7bde7bd]
- Updated dependencies [5380642]
- Updated dependencies [ea91af0]
- Updated dependencies [3187ace]
- Updated dependencies [d4783c2]
- Updated dependencies [095319c]
- Updated dependencies [d696700]
- Updated dependencies [5380642]
- Updated dependencies [c5f4438]
- Updated dependencies [3187ace]
- Updated dependencies [38e5253]
- Updated dependencies [38e5253]
  - @nocobase/app-plugin-authentication@0.1.0-beta.20
  - @nocobase/app-plugin-api-keys@0.1.0-beta.5
  - @nocobase/app-plugin-authorization-example@0.1.0-beta.3
  - @nocobase/app-plugin-ai-employee@0.1.0-beta.20
  - @nocobase/app-plugin-notification-in-app@0.2.0-beta.15
  - @nocobase/app-plugin-authorization@0.2.0-beta.17
  - @nocobase/app-plugin-routes-example@0.1.0-beta.13
  - @nocobase/app-plugin-scheduler@0.1.0-beta.6
  - @nocobase/db@1.0.0-beta.13
  - @nocobase/app-server@1.0.0-beta.23
  - @nocobase/app-cli@0.1.0-beta.2
  - @nocobase/app-plugin-repository-example@0.1.0-beta.11
  - @nocobase/nb3-cli@1.0.0-beta.11
  - @nocobase/app-plugin-authz-default-access@0.1.0-beta.1
  - @nocobase/app-plugin-authz-sharing-rules@0.1.0-beta.1
  - @nocobase/app-plugin-notification@0.1.0-beta.14
  - @nocobase/app-plugin-users@0.1.0-beta.7

## 0.1.0-beta.23

### Patch Changes

- 43592e9: Support users.initialAdmin credentials for fresh installations, preserving legacy defaults when omitted and assigning root permission to the configured administrator without resetting existing accounts.
- 43592e9: Expose a read-only config.get() reader and service container to migration and seed callbacks. Inject application configuration snapshots for startup and CLI database tasks and document configuration and rollback semantics.

  Restrict application database task service access to the ID generator and reuse the templates’ application factory for CLI migrations and seeds. CLI tasks share the application database manager and dispose application and scope resources without booting providers or triggering autoRun.

  Simplify createAppCommands to one options object with lazy rootDir-based runtime and application discovery and optional factory overrides.

- Updated dependencies [4ffcbc2]
- Updated dependencies [43592e9]
- Updated dependencies [43592e9]
- Updated dependencies [c3fb653]
  - @nocobase/app-plugin-workflow@0.1.0-beta.24
  - @nocobase/app-plugin-scheduler@0.1.0-beta.5
  - @nocobase/app-plugin-authentication@0.1.0-beta.19
  - @nocobase/app-plugin-authorization@0.2.0-beta.16
  - @nocobase/db@1.0.0-beta.12
  - @nocobase/app-server@1.0.0-beta.22
  - @nocobase/app-cli@0.1.0-beta.1

## 0.1.0-beta.22

### Patch Changes

- 5e3c802: Extract shared application development and build tooling into app-tools and runtime CLI commands into app-cli. Keep template entry points and application composition local, preserve supported commands and development restart behavior, and document customization and upgrade boundaries.

  Remove the application client and server inspection commands, their development-only CLI registration, and related guidance.

- 9f52fc6: Correct route authorization guidance to use the existing authz field instead of the removed access field.
- 5e3c802: Isolate client inspection and file-watching test caches from running Vite development servers to prevent missing lazy dependency chunks. Document cache ownership for auxiliary Vite instances.
- 8124b03: Mirror every synchronized skill into `.claude/skills/` as a relative symbolic link, so Claude Code discovers the skills an application's NocoBase packages ship. Claude Code reads only `~/.claude/skills/` and `<project>/.claude/skills/`, so a synchronized `.agents/skills/` was invisible to it while globally installed NocoBase 2 skills stayed available. Removing a package or a skill drops its link, application-owned entries are left alone, and a real directory occupying a `nocobase-` name is reported rather than overwritten. Ignore the generated mirror in the template and generated `.gitignore` files alongside `.agents/`.
- 5e3c802: Clear stale route loading errors when a subsequent component load succeeds so mounted routes recover after loader updates.
- 5e3c802: Restart development processes when .env or .env.local changes, reloading client and server environment configuration while preserving shell overrides and strict startup behavior.
- 5e3c802: Replace template development forwarding files with a single dev entry and a direct proxy helper import. Expose the dev lifecycle through the tools launcher and keep development implementation modules and tests inside app-tools.

  Consolidate standalone server dependency operations into one template entry and keep build utility implementations and exports private to app-tools.

  Organize template scripts by purpose and remove redundant test:all, refine, template pack:check, and plugin:skills:sync shortcuts. Keep the application CLI entry and legacy CLI compatibility command unchanged.

- Updated dependencies [5e3c802]
- Updated dependencies [8124b03]
  - @nocobase/app-cli@0.0.2-beta.0
  - @nocobase/nb3-cli@1.0.0-beta.10

## 0.1.0-beta.21

### Patch Changes

- b2a37a7: Show menu labels and interactive group navigation immediately on hover in collapsed desktop sidebars, with no group popover closing delay.
- b2a37a7: Persist desktop sidebar collapse state under one origin-wide LocalStorage key shared by application, settings and developer layouts.
- e819ad3: Make the application tests shipped with templates runnable after scaffolding with a custom project name and installed npm packages, and document how to keep these tests portable.

## 0.1.0-beta.20

### Patch Changes

- 836014a: Extract reusable header and sidebar containers in the Examples template while keeping navigation permissions and route behavior in each layout. Add accessible mobile sidebar dismissal and preserve child state across collapse and visibility changes.

  Organize layout components under `client/layouts/components` and rename the main application shell to `AppLayout`.

- Updated dependencies [86c4d2c]
- Updated dependencies [71d159c]
- Updated dependencies [4b3bcfe]
- Updated dependencies [4694f66]
- Updated dependencies [4b3bcfe]
  - @nocobase/app-plugin-authorization-example@0.1.0-beta.2
  - @nocobase/app-plugin-file@0.1.0-beta.15
  - @nocobase/app-plugin-scheduler@0.1.0-beta.4
  - @nocobase/app-plugin-workflow@0.1.0-beta.23

## 0.1.0-beta.19

### Patch Changes

- f93f147: Remove the default SQLite driver dependency from application templates. Application creation supplies the database driver selected by --dialect, defaulting to SQLite.
- Updated dependencies [cbee7d8]
- Updated dependencies [c175bef]
- Updated dependencies [8f5eacf]
- Updated dependencies [8f5eacf]
- Updated dependencies [8f5eacf]
- Updated dependencies [8f5eacf]
- Updated dependencies [8f5eacf]
  - @nocobase/app-plugin-authorization-example@0.1.0-beta.1
  - @nocobase/app-plugin-workflow@0.1.0-beta.22
  - @nocobase/app-plugin-ai-employee@0.1.0-beta.18

## 0.1.0-beta.18

### Patch Changes

- 64b3fdb: Make article management available to signed-in users without permission-set configuration. Remove the article resource registration and automatic administrator permission-set provisioning while retaining authentication and input validation.
- 64b3fdb: Separate authorization services from application integration: the library provides decisions, permission-set and access-rule services, store contracts and handlers; the application plugin owns database adapters, migrations, identities and management UI.

  Add configurable root and default permission sets, protected-set metadata, transaction-bound service APIs, and integration with user management and Hub roles. Add database authorization for explicitly registered collections through Repository policies, plus a runnable example plugin.

  Provide a permission-set workspace with routed editing and user assignments, nested resource groups, field and record-scope controls, and a permission inspector. Localize management UI and request-specific resource labels. Application routes may declare signed-in access without a page grant.

  Migration ownership changes inline the existing table definitions in the application plugin. This changes the checksums of previously executed migrations; upgrade compatibility must be resolved before deploying to an existing database.

- 64b3fdb: Support entry-level parent references for settings routes contributed by different plugins. Preserve route ownership and localization while resolving nested groups independently of plugin order.

  Split default access, sharing rules and restriction rules into application plugins that own management endpoints, stores, migrations and UI. Keep pure authorization rules and Store contracts in the authorization library and move permission-set management HTTP handlers to the application plugin. Update all application templates to explicitly compose the new plugins. The migration ownership change assumes a fresh installation.

- 64b3fdb: Install page authorization automatically alongside permission sets and database authorization in createAppAuthorization. Remove explicit pages() installation from application configuration; the Default, Examples and Hub templates now configure only optional access-rule plugins. Page grants and route access behavior remain unchanged.
- 64b3fdb: Add composed business operations with named data scopes and categorized business and administration groups. Permission and rule editors expose only this catalog; page, collection and custom resource handlers remain internal authorization targets.

  Enforce per-operation default access, sharing and restriction scopes while preserving field permissions. Return resolved underlying decisions and repository policies for inspection and execution.

  Use translation descriptors for permission titles, integrate permission-set assignments into user management, and demonstrate independent project, quote and order scopes with direct and team-based assignments.

- 64b3fdb: Allow development sign-in through localhost and 127.0.0.1 on the allocated backend port. Preserve existing Better Auth trusted origins and application configuration; only augment the local development backend environment.
- 64b3fdb: Remove Refine from client authorization checks. Use `AuthorizationClient.can({ resource, action })` instead of the removed two-argument signature, and import `useCan` from `@nocobase/app-plugin-authorization/client`. Migrate page guards, navigation, and notification visibility while preserving session isolation and realtime permission invalidation.

  Remove the Refine access-control configuration and legacy global authorization client accessors. Resolve the application-owned client through `useAuthorizationClient()` or `authorizationClientToken`. Settings actions now revoke stale access immediately; route checks no longer bypass the authorization page or translate Refine CRUD action names.

  Unify route authorization under `authz: 'skip' | { resource: { type, id }, action }`. Normalize default rules during registration and share them across page guards, navigation, permission discovery, and inspection. Remove the legacy `access` field and string resource adapter.

  Limit settings action checks to the actions each page uses, keep the permission-set action helper internal, and avoid rebuilding navigation twice when selecting a route.

- 64b3fdb: Align workflow and scheduler route paths with their current pages while preserving page authorization, including nested workflow tabs. Remove duplicate development declarations for dependencies already required by the examples and hub server runtimes.
- 64b3fdb: Move default user permission-set integration into the Users plugin and remove duplicated template providers. Add application-owned preset title metadata for client-side localization without overwriting custom names. Preserve Hub's custom role scope and share searchable assignment selection between user creation and editing.
- fe564d9: Add opt-in strict startup verification that propagates job import failures and exits development and production processes on startup failure.
- 64b3fdb: Unify grantable resource registration through getResource(type).items and separate recursive display groups. Move authorization settings to module-qualified items under the built-in settings resource, replace the database collections registration entry point, and preserve page navigation groups in the resource picker. Existing authorization settings grant records are not migrated.

  Replace the permission-set list and separate detail view with a collapsible, searchable sidebar and routed permission configuration and user-assignment tabs. Keep edits in the workspace with save/discard controls and protected-set restrictions. Present registered resources in an expandable tree with searchable field configuration in a local floating panel, and toggle simple permissions directly between full access and no grant.

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
- Updated dependencies [64b3fdb]
  - @nocobase/authorization@0.1.0-beta.8
  - @nocobase/app-plugin-authorization@0.2.0-beta.15
  - @nocobase/app-plugin-authorization-example@0.1.0-beta.0
  - @nocobase/app-plugin-users@0.1.0-beta.6
  - @nocobase/app-plugin-notification@0.1.0-beta.13
  - @nocobase/app-server@1.0.0-beta.21
  - @nocobase/app-plugin-authz-default-access@0.1.0-beta.0
  - @nocobase/app-plugin-authz-sharing-rules@0.1.0-beta.0
  - @nocobase/app-plugin-authz-restriction-rules@0.1.0-beta.0
  - @nocobase/app-plugin-ai-employee@0.1.0-beta.17
  - @nocobase/app-plugin-api-keys@0.1.0-beta.4
  - @nocobase/app-plugin-database-explorer@0.1.0-beta.4
  - @nocobase/app-plugin-repository-example@0.1.0-beta.10
  - @nocobase/app-plugin-routes-example@0.1.0-beta.12
  - @nocobase/app-plugin-scheduler@0.1.0-beta.3
  - @nocobase/app-plugin-workflow@0.1.0-beta.21
  - @nocobase/queue@0.1.0-beta.7

## 0.1.0-beta.17

### Patch Changes

- e9da3c2: Resolve installed official database drivers asynchronously from application configuration before provider registration or standalone database tasks. Configure only the needed dialects and install their optional peer packages in application dependencies. Preserve explicit driver registrations and synchronous core manager APIs; direct core consumers continue to register drivers explicitly. Standard development and test loaders require no synchronous ESM compatibility configuration.
- 9628cdd: Improve workflow and scheduler management pages with consistent layouts, filters, tables, and switches. Keep page layout and UI components local to their owning plugins, and align authorization pages with the same layout conventions.

  Normalize workflow and execution URLs under `/settings/workflow` and scheduler URLs under `/settings/schedules`, retaining the automation menu group without adding it to URLs. Update scheduler target links and the examples homepage entry. Use bookmarkable workflow/run child routes, preserve queries and browser history, and link execution detail titles to their workflow.

  Improve the workflow execution canvas with reorganized run controls, fullscreen viewing, terminal edge markers, direct empty-branch connections, and theme-aware styling. Unify node dialogs with consistent titles and close controls, collapsible descriptions, execution results and status colors, and explanatory states for unexecuted nodes.

- Updated dependencies [c84bfe8]
- Updated dependencies [e9da3c2]
- Updated dependencies [e9da3c2]
- Updated dependencies [9628cdd]
- Updated dependencies [7542686]
  - @nocobase/db@1.0.0-beta.11
  - @nocobase/app-server@1.0.0-beta.20
  - @nocobase/db-postgres@0.1.0-beta.2
  - @nocobase/app-plugin-workflow@0.1.0-beta.20
  - @nocobase/app-plugin-scheduler@0.1.0-beta.2
  - @nocobase/app-plugin-authorization@0.2.0-beta.14

## 0.1.0-beta.16

### Minor Changes

- e13ed84: Unify application directory fields and path helpers in AppPaths, shared by configuration factories, runtime and Application. Replace ConfigPaths and runtime.configPaths with AppPaths and runtime.paths, and construct applications through createAppFromRuntime so Host logging policy and the runtime application reference are wired consistently.

  Standalone applications declare their deployment root separately from their code root. Configuration and default persistent storage use that deployment root in both source and compiled execution. Explicit storage paths take precedence over HUB_STORAGE_DIR, and embedded applications retain Host-provided volumes.

  Standardize Hub storage and expanded releases on the hub, host and apps layout, remove legacy layout detection and offline storage migration commands, and replace appDeploymentsDir with appRevisionsDir. Expanded releases use appRevisionsDir/<appId>/<sha256>; standalone discovery records the selected revision. Consumers must update removed path and storage APIs and configure existing data locations explicitly before adopting this release. Rebuild application artifacts with the updated runtime and templates.

### Patch Changes

- a255f91: Use the Compact theme by default across application templates while preserving configured defaults and saved browser preferences. Label the other theme Spacious instead of Default to avoid confusing its name with the default selection. Update theme development guidance.
- 78e3c42: Add a personal notification center using the authenticated in-app inbox, with homepage and navigation entries in English and Chinese. Enable the database-backed in-app channel by default so test notifications can be sent to the current user or a specified user. Add an authenticated header bell with a live unread badge and a link to the notification center.
- e55b17d: Add localized header tooltips for component examples and settings, plus the Examples notification entry, and open appearance and account panels immediately on hover using the built-in shadcn behavior. Preserve click, touch, keyboard, and default dismissal behavior; close the account menu when selecting a language.
- e13ed84: Organize Hub storage by ownership, add explicit managed revision and log directories, retain legacy layouts, and provide an offline migration preview and copy workflow. Keep standalone Hub data outside build output and place template build archives under storage/exports with matching publishing defaults.
- 8607909: Update agent-annotations to 0.1.9 so the development annotation toolbar remembers its collapsed or expanded state across page reloads.
- e13ed84: Make development logs concise and application-scoped while retaining structured file diagnostics. Route configuration and authentication diagnostics through application logging, reduce routine startup and request noise, distinguish optional AI Skill directories from missing configured paths, and align development console settings across templates. Document that deployed applications need rebuilding to adopt the current logging protocol.
- 64733b6: Clarify that useRouteOverlay must run in a descendant of the intended overlay, with complete usage examples and guidance on avoiding the parent context in nested overlays.
- e13ed84: Persist per-deployment phase and failure logs and expose application runtime logs in Hub with scoped access, incremental reading, retention, and independent file and console outputs.

  Unify runtime logging configuration and source routing, merge default outputs into app files, connect workflow diagnostics with execution identities, and preserve legacy configuration and historical log readability.

  Enforce hosted capture policy, declare the Host server runtime peer, merge paged source logs chronologically with bounded opaque cursors, and preserve correlation and error details when truncating oversized records. Handle expired scans explicitly in the Hub viewer and downloads.

  Route HTTP request logs to separate request files by default in all application templates.

- Updated dependencies [e0c4b3d]
- Updated dependencies [e13ed84]
- Updated dependencies [78e3c42]
- Updated dependencies [5f92529]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [00362cf]
- Updated dependencies [9e3bbee]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [25cf9f6]
- Updated dependencies [49a7890]
  - @nocobase/app-plugin-scheduler@0.1.0-beta.1
  - @nocobase/queue@0.1.0-beta.6
  - @nocobase/db@1.0.0-beta.10
  - @nocobase/db-oracle@0.1.0-beta.2
  - @nocobase/app-server@1.0.0-beta.19
  - @nocobase/app-plugin-notification-in-app@0.2.0-beta.14
  - @nocobase/app-plugin-file@0.1.0-beta.14
  - @nocobase/app-plugin-file-example@0.1.0-beta.9
  - @nocobase/app-plugin-workflow@0.1.0-beta.19
  - @nocobase/app-plugin-ai-employee@0.1.0-beta.16
  - @nocobase/app-plugin-authentication@0.1.0-beta.18
  - @nocobase/app-plugin-notification@0.1.0-beta.12
  - @nocobase/app-plugin-install@0.1.0-beta.9

## 0.1.0-beta.15

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

- 365a9fe: Complete English and Chinese translations for authentication, route feedback, authorization, shared controls, File and Notification Registry components, and development examples. Use concise semantic keys consistently for the new translations. Resolve AI Registry copy from the active language and localize development navigation and section headings. Translate MCP configuration guidance, tool drawer labels, and transport descriptions.
- 365a9fe: Translate application shell copy, settings and development empty states, return links, and header action labels using the application locale and its configured fallback chain.
- f5b066d: Include the tests directory in the published application templates.
- d4ca00e: Use useApiClient() for React API client access across application pages, plugins and shared examples, preserving application-scoped client resolution.
- Updated dependencies [d4ca00e]
- Updated dependencies [365a9fe]
- Updated dependencies [365a9fe]
- Updated dependencies [ec93611]
- Updated dependencies [60fa139]
- Updated dependencies [21d3ed4]
- Updated dependencies [24e771f]
- Updated dependencies [60fa139]
- Updated dependencies [d4ca00e]
- Updated dependencies [26ac480]
- Updated dependencies [365a9fe]
- Updated dependencies [d4ca00e]
- Updated dependencies [60fa139]
- Updated dependencies [60fa139]
- Updated dependencies [d4ca00e]
  - @nocobase/app-plugin-notification-in-app@0.2.0-beta.13
  - @nocobase/app-plugin-repository-example@0.1.0-beta.9
  - @nocobase/app-plugin-routes-example@0.1.0-beta.11
  - @nocobase/app-plugin-ai-employee@0.1.0-beta.15
  - @nocobase/app-plugin-api-keys@0.1.0-beta.3
  - @nocobase/app-plugin-authorization@0.2.0-beta.13
  - @nocobase/app-plugin-file@0.1.0-beta.13
  - @nocobase/app-plugin-notification@0.1.0-beta.11
  - @nocobase/app-plugin-users@0.0.2-beta.5
  - @nocobase/app-plugin-authentication@0.1.0-beta.17
  - @nocobase/app-plugin-i18n@0.1.0-beta.8
  - @nocobase/db@1.0.0-beta.9
  - @nocobase/app-plugin-scheduler@0.1.0-beta.0
  - @nocobase/queue@0.1.0-beta.5
  - @nocobase/app-server@1.0.0-beta.18
  - @nocobase/app-plugin-workflow@0.1.0-beta.18
  - @nocobase/app-plugin-file-example@0.1.0-beta.8
  - @nocobase/app-plugin-database-explorer@0.1.0-beta.3

## 0.1.0-beta.14

### Patch Changes

- 4349a40: Preserve navigation group expansion when switching pages in the application, Settings, and Dev tools.
- d86f6aa: Synchronize agent skills from direct NocoBase package dependencies with the new skills:sync command while preserving plugin:skills:sync compatibility, and share application development and upgrade skills through @nocobase/app-skills across all application templates.

  Add package:remove to uninstall a NocoBase dependency and clean up its synchronized skills and ownership records, reusing plugin unregistration for plugin packages. Document the removal workflow in application templates and the shared development and upgrade skills.

- 028dd7c: Use host-provided peers for shared database types, authorization errors, service tokens, cache registries, and repository filter metadata. Declare their production providers in all application templates so deployments with automatic peer installation disabled retain the required runtime packages. Document the provider contract for generated plugins.

  Existing applications upgrading these packages must add compatible versions of their required shared peers to production dependencies: @nocobase/db, @nocobase/service-provider, @nocobase/repository-input, @nocobase/authorization, @nocobase/caching, @nocobase/i18n, and @nocobase/queue for the standard server stack, plus @nocobase/ai-employee when using its plugin. Update the lockfile and verify the production install; peer declarations do not remove incompatible historical versions automatically.

- Updated dependencies [d86f6aa]
- Updated dependencies [028dd7c]
  - @nocobase/nb3-cli@1.0.0-beta.8
  - @nocobase/ai-employee@0.2.0-beta.6
  - @nocobase/app-plugin-ai-employee@0.1.0-beta.14
  - @nocobase/app-plugin-authentication@0.1.0-beta.16
  - @nocobase/app-plugin-authorization@0.2.0-beta.12
  - @nocobase/app-plugin-users@0.0.2-beta.4
  - @nocobase/app-server@1.0.0-beta.17
  - @nocobase/authorization@0.1.0-beta.7
  - @nocobase/db@1.0.0-beta.8
  - @nocobase/queue@0.1.0-beta.4

## 0.1.0-beta.13

### Patch Changes

- 1fea79a: Refresh permission snapshots, navigation, and route guards when sessions or permissions change, and discard obsolete permission responses without requiring a browser reload. Support explicit type:id domain resources in client access checks without rewriting their actions.
- 1fea79a: Show localized sign-out errors instead of silently refreshing an active session after an API or network failure.
- Updated dependencies [415d763]
- Updated dependencies [1fea79a]
  - @nocobase/app-server@1.0.0-beta.16
  - @nocobase/app-plugin-authorization@0.2.0-beta.11

## 0.1.0-beta.12

### Patch Changes

- 489d08a: Read settings navigation from the existing application runtime and remove the redundant settings route context from template headers.
- 9b6c645: Add the PageContainer component from the Examples template to the Default and Hub templates.

  Require PageContainer when writing page components in all three application development Skills, and align page and child-route examples with the shared container.

- Updated dependencies [9131230]
- Updated dependencies [9131230]
  - @nocobase/app-plugin-ai-employee@0.1.0-beta.13
  - @nocobase/app-plugin-notification-in-app@0.2.0-beta.12
  - @nocobase/app-plugin-routes-example@0.1.0-beta.10

## 0.1.0-beta.11

### Patch Changes

- d927494: Align shared application tooling and dependency declarations with Default while preserving Examples demonstrations and Hub management features. Remove duplicate and unused dependencies, correct repository metadata, and remove obsolete global OpenSSL options from Examples.

  Add Default's Users role scope, permission seed, and complete API Keys authentication integration to Examples. Remove unused workflow, notification, and heartbeat configuration and demonstration routes from Hub. Provide an explicit Playwright entry for the optional AI server test in Default and Examples, using the current API and a real test user's API key.

  Restore the shared Settings surface in Hub so its registered API Keys page is reachable for authorized users. Show the Settings entry only when an accessible navigation page exists across all three templates, correct stale template development and upgrade guidance, and resolve test dependencies through public package exports instead of monorepo-only source paths.

- f5b066d: Increase the compact theme's base corner radius from 0.25rem to 0.375rem for softer corners on controls and containers.
- 89955c5: Upgrade better-sqlite3 to ^13.0.3 and keep its dependency declaration in @nocobase/db-sqlite only. Remove redundant test dependencies from consumers so they use the same SQLite driver as applications.

  Preserve the bundled musl binary when building applications for Alpine Linux.

- 92c355f: Add build command help that exits before loading build dependencies or changing deployment artifacts. Record deployment target metadata even when no native modules are present, detect musl for current-machine Linux builds, and document the platform and Node fields available for deployment checks.
- Updated dependencies [6acf3bc]
- Updated dependencies [d927494]
- Updated dependencies [6acf3bc]
- Updated dependencies [89955c5]
  - @nocobase/app-plugin-ai-employee@0.1.0-beta.12
  - @nocobase/app-plugin-database-explorer@0.1.0-beta.2
  - @nocobase/app-plugin-users@0.0.2-beta.3
  - @nocobase/app-plugin-api-keys@0.1.0-beta.2
  - @nocobase/app-plugin-workflow@0.1.0-beta.17
  - @nocobase/app-plugin-notification@0.1.0-beta.10
  - @nocobase/db-sqlite@0.1.0-beta.2
  - @nocobase/app-plugin-authentication@0.1.0-beta.15
  - @nocobase/app-plugin-file@0.1.0-beta.12
  - @nocobase/app-plugin-file-example@0.1.0-beta.7
  - @nocobase/app-plugin-repository-example@0.1.0-beta.8

## 0.1.0-beta.10

### Patch Changes

- b34801e: Add a reusable PageContainer and use its default layout across example pages. Reuse PageHeader for articles, numeric examples, and external CRM, removing redundant header labels.

  Refine numeric and external CRM example layouts with consistent controls, tables, and status presentation.

- d3429aa: Deduplicate dependencies during template upgrades and resolve stale dependency type conflicts. Replace outdated migration documents with upgrade Skill guidance based on template differences and application state, preserving migration history and user-authored operational notes. Check application code and configuration before proposing plugin removal, and obtain user confirmation before removing unused dependencies and registrations.
- Updated dependencies [11c276a]
- Updated dependencies [b34801e]
- Updated dependencies [7c0ec03]
- Updated dependencies [7c0ec03]
  - @nocobase/app-plugin-ai-employee@0.1.0-beta.11
  - @nocobase/app-plugin-repository-example@0.1.0-beta.7
  - @nocobase/app-plugin-file-example@0.1.0-beta.6
  - @nocobase/app-plugin-workflow@0.1.0-beta.16

## 0.1.0-beta.9

### Minor Changes

- 1a85a86: Add route breadcrumbs, nested child pages, and reusable page headers to the client and application templates.

### Patch Changes

- 63db898: Reorganize application database guidance around complete configuration factory examples. Clarify YAML overrides and SQLite paths, managed and external connections, default database selection, and verification that distinguishes reads from migrations. Keep driver installation and type inference details in troubleshooting guidance.
- 63db898: Exclude the application's complete build output from Vite file watching to prevent EMFILE errors after a build, while preserving hot updates for linked workspace dependencies.

  Check native file watching before development startup, fall back to polling with agent annotations disabled when native watchers are unavailable, and poll application configuration files so watcher resource errors no longer crash the development process.

- 63db898: Add `defineAppDatabaseConfig` to infer connection types from the drivers returned by a runtime configuration callback. Application templates now directly export this helper without explicit factory annotations, driver type maps, or `satisfies` clauses. Keep declaration emission but use full TypeScript inference for application server builds; library packages retain isolated declaration checking.
- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.
- 63db898: Add a `database connections` reference to the application development Skill, covering how to switch the database and add a connection.

  Nothing documented this. `database-and-data.md` states in its first line that it is about reading and writing rows at runtime, and `migrations.md` covers per-connection migrations without saying how a connection comes to exist — so of the eight dialects the runtime supports, only SQLite was reachable from the documentation.

  The new page covers why a dialect is registered in `server/config/database.ts` rather than configured in `config.yml`, the four steps to switch the default connection, a table of every dialect with its package, native driver, default port and connection fields, which drivers install a native binary and which do not, and the fact that switching does not carry data across. It is routed from `SKILL.md` and `AGENTS.md` in each template.

  It also shows how to configure `kingbase`, `oceanbase` and `dameng`, whose connection shapes `@nocobase/db` does not declare, by naming them on `AppDatabaseConfig`.

- e067113: Depend on one zod major, so a deployment can resolve better-auth

  An application that installed both the AI employee plugin and the API keys plugin failed to start with `z.ipv4 is not a function`, thrown while loading `@better-auth/core`. Nothing in better-auth was wrong: the AI employee packages asked for `zod: ^3` while better-auth asks for `^4`, and a deployment installs `dist/` with `nodeLinker: hoisted`, where one version of a package takes the root slot and the rest are nested underneath whoever depends on them. zod 3 won the root, which forced better-auth's whole subtree to be nested, and a `@better-auth/core` that ended up next to the root zod bound to the wrong major.

  The same collision has a second failure mode that is harder to read. `@better-auth/api-key` declares `@better-auth/core`, `better-call`, `jose`, `kysely` and `nanostores` as peer dependencies, and a deployment sets `autoInstallPeers: false` so it installs none of them. It works anyway when better-auth's dependencies hoist to the root, because the peers are then sitting where the resolver looks; it stops working the moment the zod conflict pushes them down into `node_modules/better-auth/node_modules`, and the application fails with `Cannot find package '@better-auth/core'`.

  So the fix is not to declare better-auth's internals somewhere. `@nocobase/ai-employee` never imported zod at all and no longer declares it, `@nocobase/app-plugin-ai-employee` moves to zod 4, and all three templates and the plugin now take it from the `zod` catalog entry, so one version is what an application gets. Its schemas use `z.object`, `z.string`, `z.number`, `z.array`, `z.record`, `z.coerce`, `z.any` and `z.unknown`, all of which carry over unchanged; `buildStandardAgentMiddleware` gained an explicit `AgentMiddleware[]` return type, which the new resolution made necessary.

  A deployment tree now holds a single `zod` and a single `@better-auth/core`, hoisted to the root where `@better-auth/api-key` resolves them.

- Updated dependencies [1c70f60]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [a60decd]
- Updated dependencies [1a85a86]
- Updated dependencies [1c70f60]
- Updated dependencies [63db898]
- Updated dependencies [e067113]
  - @nocobase/app-plugin-ai-employee@0.1.0-beta.10
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/db@1.0.0-beta.7
  - @nocobase/db-sqlite@0.1.0-beta.1
  - @nocobase/db-postgres@0.1.0-beta.1
  - @nocobase/db-mysql@0.1.0-beta.2
  - @nocobase/db-oracle@0.1.0-beta.1
  - @nocobase/app-plugin-notification@0.1.0-beta.9
  - @nocobase/app-plugin-workflow@0.1.0-beta.15
  - @nocobase/app-plugin-authentication@0.1.0-beta.14
  - @nocobase/app-plugin-authorization@0.2.0-beta.10
  - @nocobase/app-plugin-database-example@0.1.0-beta.6
  - @nocobase/app-plugin-database-explorer@0.1.0-beta.1
  - @nocobase/app-plugin-file@0.1.0-beta.11
  - @nocobase/app-plugin-file-example@0.1.0-beta.5
  - @nocobase/app-plugin-i18n@0.1.0-beta.7
  - @nocobase/app-plugin-install@0.1.0-beta.8
  - @nocobase/app-plugin-notification-in-app@0.2.0-beta.11
  - @nocobase/app-plugin-notification-providers@0.2.0-beta.6
  - @nocobase/app-plugin-queue-example@0.1.0-beta.6
  - @nocobase/app-plugin-realtime-example@0.1.0-beta.6
  - @nocobase/app-plugin-repository-example@0.1.0-beta.6
  - @nocobase/app-plugin-routes-example@0.1.0-beta.9
  - @nocobase/app-plugin-service-provider-example@0.1.0-beta.5
  - @nocobase/app-plugin-skills-example@0.1.0-beta.3

## 0.1.0-beta.8

### Patch Changes

- c258b92: Declare `auth.secret` and `session.secret` as live keys in `config.example.yml` rather than commented-out placeholders, and describe how a generated application's `config.yml` and database now come about.

  `@nocobase/create-app` generates `config.yml` from this file and fills the two secrets in. Leaving them commented meant the generator had to uncomment them, which made the exact comment syntax of this file part of its contract; a live key with a placeholder value is a target it can simply replace.

  The other way this file is used — copying it to `config.yml` by hand — is covered separately: the placeholder is a non-empty string that would otherwise pass for a configured secret, so the runtime now refuses it by name and says how to generate a replacement.

  The generator no longer asks which database to use, so "Review your configuration" in each README no longer says `config.yml` carries the database you chose. An application starts on SQLite, and another database means registering its dialect in `server/config/database.ts` and adding the matching `@nocobase/db-*` package — drivers are code rather than settings, and a dialect the application does not register cannot be introduced from `config.yml`.

  The Hub's upgrade skill no longer describes `app-dist/`, which the generator stopped creating and nothing reads.

- Updated dependencies [c258b92]
  - @nocobase/app-server@1.0.0-beta.14
  - @nocobase/app-plugin-authentication@0.1.0-beta.13

## 0.1.0-beta.7

### Patch Changes

- c01baf6: Resolve application namespace aliases in React translations, synchronize the document language at startup and on changes, and inject the configured default language into served HTML. Allow client-only language selections with an English server fallback and an informational toast, and standardize documented locale checks on `pnpm nocobase app i18n:check`.
- Updated dependencies [154e09e]
- Updated dependencies [154e09e]
- Updated dependencies [154e09e]
- Updated dependencies [154e09e]
- Updated dependencies [c01baf6]
  - @nocobase/app-plugin-ai-employee@0.1.0-beta.9
  - @nocobase/app-plugin-authentication@0.1.0-beta.12
  - @nocobase/app-plugin-notification-in-app@0.2.0-beta.10
  - @nocobase/app-server@1.0.0-beta.13
  - @nocobase/app-plugin-i18n@0.1.0-beta.6

## 0.1.0-beta.6

### Minor Changes

- 1d5ee9a: Add `pnpm collections:generate` for writing and checking Collection artifacts

  `pnpm nocobase app collections generate` reads every Collection of a managed connection and writes `collection.json`, `metadata.json` and `schema.json` under `database/<connection>/collections/<name>/`, plus a `_manifest.json` per connection recording the dialect, whether the schema is managed or external, and the last applied migration. `--connection` targets one connection, `--all` every configured one including external connections, and `--check` compares the result with the files on disk and exits non-zero on any difference without writing, which is what a CI step runs.

  The command is a thin entry over `generateAppCollectionsArtifact()` from `@nocobase/app-server`; the files are derived output for developers, documentation and AI tooling, and nothing reads them back at runtime. `AGENTS.md` and the README describe the directory.

- 1d5ee9a: Add an external database example

  The `externalCrm` connection reads a database another system owns: `schemaManagement: 'external'` keeps NocoBase from changing its schema, `naming` maps the CRM's `crm_`-prefixed tables to logical Collection names, and a `ModuleCollectionMetadataStore` fed from `database/externalCrm/metadata.ts` supplies titles and the `orders.customer` relation the schema cannot express. Two read-only repository routes, `crmCustomers` and `crmOrders`, expose it to signed-in users, and an **External CRM** page lists the orders with their customers through them.

  The connection points at a local SQLite file so the example runs without a real CRM; a provider plays the foreign system and creates the tables and sample rows when they are missing, and does nothing once the connection is pointed elsewhere.

### Patch Changes

- a153ad8: Add a read-only Database Explorer plugin and enable it in the Default and Examples templates.

  The Settings page browses the application's database connections, the collections on each one, and their fields and physical columns. The two detail panes are child routes and the selection rides in the query string, so any view can be linked to and is restored by browser Back.

  Read-only means the plugin creates, alters or drops no collection and changes no row. One qualifier: reading a collection initializes the collection registry, whose metadata store creates `__nocobase_collection_metadata` on a managed connection when it is missing, so that one bookkeeping table is the only object a read can bring into existence — and only when the first NocoBase activity against a database is an Explorer read. External connections cannot reach that path. A test states this boundary against a real database rather than assuming it.

  Listing connections reads configuration and opens no database, so one unreachable external connection cannot take down the page. A connection reports its dialect, schema management, logical database, schemas, naming options, and internal tables, and never its credentials, host, port, socket path, or SQLite file — enforced as an allow-list, so a field a new dialect introduces stays inside by default. Driver errors are withheld from responses and recorded in logs by classification only, never by message or cause.

  The collections list follows the server's cursor to the end so its client-side search sees every collection, and says so when a connection exceeds the bound.

  Every endpoint requires `page:database-explorer/access`, the grant the page and both of its panes declare, which the seeded System Administrator permission set covers.

- 1d5ee9a: Keep the external CRM example's metadata in `metadata.json` files

  The `externalCrm` connection no longer constructs a `ModuleCollectionMetadataStore` from TypeScript documents. Its metadata lives in `database/externalCrm/collections/{customers,orders}/metadata.json`, the default source for an external connection, so the connection is configured by `dialect`, `schemaManagement` and `naming` alone. The build copies these files into `dist/database` so a deployment resolves the same titles and relations.

- 22d0d2a: Resolve client chunk URLs at run time so a built application works wherever it is mounted.

  Vite bakes `base` into the bundle at build time, while an App Host mounts a deployed application under its own App ID. A build made for `/main` and deployed as `/crm` therefore asked for `/main/assets/<chunk>.js` and got a 404 for every chunk the browser had to fetch at run time, which is every lazily imported route: the application loaded, its shell rendered, and each lazy page failed with "Route … could not be loaded". Pages whose chunks `index.html` preloads kept working, so the failure looked like it belonged to a particular plugin rather than to the deployment.

  Only the URLs emitted into JavaScript become runtime-relative, resolved against `import.meta.url`; every chunk sits beside the entry chunk, so this is correct at any mount path. The URLs in `index.html` stay absolute: the document is served at arbitrary SPA route depths where a relative URL would resolve against the current route, and the Host rewrites those root-relative attributes to the mount path, which it can only do while they start with `/`.

  Applications generated from these templates need to rebuild to pick this up. No configuration changes, and a build deployed at the path it was built for behaves as before.

- 73f7538: Resolve a Portal build's asset URLs from the runtime base path so a build keeps working when a host mounts it under a different prefix. Vite inlined the build-time `base` into its `__vitePreload` helper, and that helper awaits every stylesheet link it inserts, so a lazy chunk carrying its own CSS rejected its dynamic import and rendered the route's error state once the application was served from somewhere other than the prefix it was built for.

  The templates each carried their own copy of this fix, added before it existed in the shared configuration. They now inherit it from `createPortalViteConfig` instead. A consumer that configures `experimental.renderBuiltUrl` itself still overrides the shared one, so nothing that needs its own strategy loses it — the templates simply no longer need one.

- Updated dependencies [be92e2b]
- Updated dependencies [6d43421]
- Updated dependencies [1d5ee9a]
- Updated dependencies [1d5ee9a]
- Updated dependencies [a153ad8]
- Updated dependencies [1d5ee9a]
- Updated dependencies [211538b]
- Updated dependencies [1d5ee9a]
- Updated dependencies [1d5ee9a]
- Updated dependencies [1d5ee9a]
- Updated dependencies [6d43421]
- Updated dependencies [6d43421]
  - @nocobase/app-plugin-ai-employee@0.1.0-beta.7
  - @nocobase/app-server@1.0.0-beta.12
  - @nocobase/app-plugin-database-explorer@0.1.0-beta.0
  - @nocobase/db@1.0.0-beta.6
  - @nocobase/db-mysql@0.1.0-beta.1

## 0.1.0-beta.5

### Minor Changes

- ceb356b: Add an independent analytics database with channel, campaign, and daily metric examples, deterministic initial data, and authenticated Repository API routes for CRUD and aggregation.
- ceb356b: Add an application-owned numeric types example with a migrated table, repeatable initial data, and an authenticated page comparing Query and Repository reads and aggregates.
- ceb356b: Add runnable quotation routing, analytics daily report, and failure diagnostic workflows, with a homepage entry, idempotent report storage, and usage examples.
- 0f80d52: Support PROXY_TARGET_URL during development to run the local Vite client against another application's API and WebSocket service, including browser origin handling for authentication, without starting a local backend.
- 3bb34a3: Add RouteDialog and RouteDrawer with guarded closing and a shared useRouteOverlay hook. The wrappers insert no child outlet: the page that owns a child route places one itself, so an overlay can render its next child wherever the page needs it. Include route overlay examples and application development guidance.

### Patch Changes

- ceb356b: Declare database dialect drivers on the application's own database config.

  An application lists the dialect packages it installs under `database.drivers`,
  next to the connections that use them, and the runtime, the CLI commands and the
  tests all resolve a dialect from that one place. The app-server runtime stays
  independent of every concrete database driver.

  This replaces the process-wide `registerAppDatabaseDrivers` registry and the
  `databaseDrivers` option on `Application`, both of which are removed. An
  application that used either one moves its drivers into `database.drivers` and
  drops the module it imported only for the registration side effect.

- f17f3a6: Provide editable TypeScript defaults for application modules, assembled by the runtime before services start. Module factories receive the runtime with application paths and plugin metadata; deployment files and environment variables override defaults, and configuration reload preserves code defaults.

  Keep deployment settings in YAML examples and reserve explicit environment overrides for secrets and startup integration. Simplify application configuration loading, merging and reload subscriptions.

  Align client configuration assembly with the server: runtime merges application TypeScript defaults beneath public configuration before services start. Client inspection reports the application configuration entry.

- f17f3a6: Move the password authentication pages to the application. The authentication plugin keeps only the protocol, session state, guards and headless actions: it no longer declares `/login`, `/register`, `/forgot-password` or `/reset-password`, drops the `client/routes` and `client/route-contracts` entries, and removes the `loginPage`/`registerPage` route override options.

  Each application template now declares those four guest routes in `client/routes.ts` and loads the application-owned pages from `client/pages/auth/`, which compose the preinstalled UI from `client/extensions/nocobase-auth-ui/`. The pages use ordinary relative links; URL handling remains with the application router and basename.

- f17f3a6: Support TypeScript authentication options in application templates and use the native authentication client. Keep authentication plugins and callbacks in editable server and client configuration, with YAML as the default format for deployment settings.

  Runtime assembly now prepares complete configuration before application creation. Module configuration factories use defineAppConfig and defaultAppConfigs, receive the runtime once, and retain their defaults when environment configuration reloads.

- ceb356b: Supply plugin migration and seed sources to database planning directly instead
  of through the database configuration.

  `AppDatabaseConfig.taskSources` is removed. It held the application's package
  name and the migration and seed directories contributed by registered server
  plugins — values the runtime derives from resolved plugins rather than values
  anyone configures. Carrying them in the `database` namespace put them where a
  `config.yml` deep-merges: `database.taskSources.migrations: []` silently
  dropped every plugin's migrations, and the application still started.

  They now travel as an `AppDatabaseTaskContributions` value alongside the
  configuration. `planAppDatabaseTasks`, `runAppDatabaseTasks`, `runAppMigrations`
  and `runAppSeeds` take an options object carrying it, with `paths`, `drivers`
  and the task selection, in place of their positional parameters.
  `createAppPluginDatabaseConfig` and `resolveAppPluginDatabaseConfig` are
  replaced by `createAppDatabaseTaskContributions`, which maps resolved plugins to
  that value. `contributions` is required, so a call site that has not been
  updated fails to compile rather than quietly planning without its plugins.

  An application's `server/config/database.ts` keeps only what it configures —
  drivers and connections — and no longer calls into the plugin resolver. Its
  `cli/database-command.ts` builds the contributions from the runtime it already
  resolves; `cli/commands/migrate.ts` and `cli/commands/seed.ts` are unchanged.

- ceb356b: Restore the application route contribution order so route overlay examples are registered before the articles page.
- e11b855: Locate a built application's `config.yml` next to `dist/` when none exists inside it, build the client against the same `.env` files the server loads, and prefer the compiled dependency tree when resolving plugins from a production build.
- ceb356b: Add the destructive `pnpm migrate --fresh --force` workflow for managed
  connections. It clears dialect-owned schema objects, reruns visible migrations,
  requires confirmation in interactive terminals, and rejects external
  connections.
- bf0f05b: Replace the `plugin update --plugin` flag with an optional plugin name argument, supporting full package names and short names while preserving updates of all registered plugins when no name is supplied.

  Document the positional plugin update command, version-range behavior, and Skills synchronization in all three application templates' README, agent guidelines, and development Skill.

- f718a90: Honor APP_SERVER_PORT as the local Vite port during remote-backend development while retaining local backend port configuration in normal development.
- d566dde: Align the example and Hub templates with the AI resource packaging and deployment artifact pruning changes.
- ceb356b: Remove the Dameng/DMDB driver from the examples application so its default development configuration uses SQLite without requiring a local DMDB service, and provide a development Docker Compose file for the supported server-backed database dialects. Improve Oracle schema normalization so repeated nullable column changes are skipped across all column types, map integers with enough precision for the full 32-bit range, and accept the application's ISO timestamp seed format.
- c960d07: Replace the Repository API's per-action `writePolicy` with a Repository Policy
  declared once per exposure.

  **Breaking.** `defineRepositoryApiRoutes()` no longer accepts `writePolicy` on
  an action, and every exposure must declare a `policy`. An action configuration
  now says only that an endpoint exists; what it may do is the exposure's Policy,
  which governs reading, creating, updating and deleting together. Declaring one
  is required rather than optional because `writePolicy` defaulted to refusing
  writes while an absent Policy restricts nothing — making it optional would have
  turned every existing declaration from "refuse every write" into "allow
  everything" without a word of warning.

  Declare `policy` as a function of a principal, together with a
  `principal(context)` resolver, to scope rows to the caller. The resolver belongs
  to the application, since this router installs no authentication; one that
  returns nothing refuses the request with 403 `PRINCIPAL_REQUIRED` rather than
  binding a Policy built from a principal that is not there. A fixed Policy is
  still normalized when the routes are defined, so a malformed one fails where it
  is written; a Policy function cannot be, and its `INVALID_POLICY` now reaches
  the host error handler as a server error instead of being reported to the caller
  as a 400.

  `@nocobase/db` gains `buildRepositoryPolicy`, a builder whose unmentioned nodes
  are denied, so the four-node requirement costs nothing to satisfy while the
  default stays refusal. Two related fixes travel with it: `create`, `update` and
  `delete` nodes that are `false` now refuse a write before its payload is read,
  so an empty body is reported as forbidden rather than as invalid input; and a
  `create` node whose relations grant `update`, `upsert`, `disconnect`, `set` or
  `delete` is refused during normalization, since a root create performs none of
  them.

  `@nocobase/app-plugin-file` exposures declare a Policy too, and it reaches
  uploads: the upload path binds a Policy derived from the exposure's, inheriting
  `create.scope` and `create.defaults` and substituting the file columns for the
  field allowlist. A file uploaded under a scoped Policy therefore lands inside
  the scope the same exposure reads from. The public content route under
  `accessPath` is unchanged and deliberately outside it.

  The method-level `writePolicy` option on `db.repository()` calls is unaffected
  and remains available for narrowing a single call.

- f5b066d: Keep header navigation entries visible on their destination pages while retaining the development-only Dev tools entry.
- e11b855: Use consistent medium-weight typography for sidebar navigation items, so an item's weight no longer changes as the selection moves.
- Updated dependencies [d566dde]
- Updated dependencies [c8f8a93]
- Updated dependencies [d566dde]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [f17f3a6]
- Updated dependencies [f17f3a6]
- Updated dependencies [f17f3a6]
- Updated dependencies [43d25b4]
- Updated dependencies [027d13d]
- Updated dependencies [c8f8a93]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [c8f8a93]
- Updated dependencies [c8f8a93]
- Updated dependencies [c8f8a93]
- Updated dependencies [c8f8a93]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [c8f8a93]
- Updated dependencies [027d13d]
- Updated dependencies [027d13d]
- Updated dependencies [40e2d49]
- Updated dependencies [c8f8a93]
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
- Updated dependencies [22b9672]
- Updated dependencies [22b9672]
- Updated dependencies [5e17578]
- Updated dependencies [28132fd]
- Updated dependencies [d566dde]
- Updated dependencies [28132fd]
- Updated dependencies [e11b855]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [e11b855]
- Updated dependencies [c8f8a93]
- Updated dependencies [ceb356b]
- Updated dependencies [c8f8a93]
- Updated dependencies [40e2d49]
- Updated dependencies [e11b855]
- Updated dependencies [c8f8a93]
- Updated dependencies [590861e]
- Updated dependencies [35f9722]
- Updated dependencies [ceb356b]
- Updated dependencies [c8f8a93]
- Updated dependencies [c8f8a93]
- Updated dependencies [ceb356b]
- Updated dependencies [c8f8a93]
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
- Updated dependencies [c8f8a93]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [c960d07]
- Updated dependencies [027d13d]
- Updated dependencies [c8f8a93]
- Updated dependencies [c8f8a93]
- Updated dependencies [c8f8a93]
- Updated dependencies [c8f8a93]
- Updated dependencies [ceb356b]
- Updated dependencies [c960d07]
- Updated dependencies [ceb356b]
- Updated dependencies [c8f8a93]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [c8f8a93]
- Updated dependencies [c8f8a93]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [c8f8a93]
- Updated dependencies [027d13d]
- Updated dependencies [0867612]
- Updated dependencies [027d13d]
- Updated dependencies [72ed008]
- Updated dependencies [027d13d]
  - @nocobase/app-plugin-ai-employee@0.1.0-beta.6
  - @nocobase/db-mysql@0.1.0-beta.0
  - @nocobase/db-sqlite@0.1.0-beta.0
  - @nocobase/db-oracle@0.1.0-beta.0
  - @nocobase/app-server@1.0.0-beta.11
  - @nocobase/app-plugin-notification@0.1.0-beta.8
  - @nocobase/app-plugin-workflow@0.1.0-beta.14
  - @nocobase/app-plugin-service-provider-example@0.1.0-beta.4
  - @nocobase/app-plugin-authentication@0.1.0-beta.11
  - @nocobase/config@0.1.0-beta.1
  - @nocobase/app-plugin-install@0.1.0-beta.7
  - @nocobase/db@1.0.0-beta.5
  - @nocobase/db-postgres@0.1.0-beta.0
  - @nocobase/app-plugin-file-example@0.1.0-beta.3
  - @nocobase/app-plugin-notification-in-app@0.2.0-beta.9
  - @nocobase/app-plugin-repository-example@0.1.0-beta.4
  - @nocobase/app-plugin-file@0.1.0-beta.10
  - @nocobase/nb3-cli@1.0.0-beta.7

## 0.1.0-beta.4

### Minor Changes

- a009e2d: Derive the languages an application offers from its own locale files, and configure the default language in one place.

  `i18n.defaultLocale` in `config.yml` now names the language the application starts in, for the browser and the server alike. The `i18n.locales` setting and its `APP_LOCALES` environment variable are removed, along with `client.app.defaultLocale`: an application offers whichever languages its own `client/locales/index.ts` and `server/locales/index.ts` declare loaders for, so adding a language means adding its file rather than editing a second list. A plugin's locale file supplies translations for those languages and no longer adds one, which keeps an installed plugin from putting an unexpected language in the picker.

  The browser resolves its startup language as the visitor's stored choice, then `i18n.defaultLocale`, then `en-US`. `navigator.language` is no longer consulted. Switching language in the interface remains a user-level choice and does not change the configured default.

  An untranslated key now falls back through `i18n.defaultLocale` and then `en-US`, rather than through the default alone. An application that defaults to Chinese and adds Spanish leaves its plugins translated in neither, and English is the language they are most likely to ship; the fallback languages are loaded alongside the one in use so the fallback has resources to read. `pnpm nocobase app i18n:check` reports a language declared in `client/locales/` but not `server/locales/`, or the reverse — the case where the interface offers a language the server then rejects.

  `LocaleResource` and `PartialLocaleResource` now accept an `overrides` block at the top level. The shape is derived from the source locale, which never declares that key, so annotating a locale file with it and adding the block documented for rewording a plugin's copy was a compile error — the documented example did not compile.

  To migrate, replace `i18n.locales` and `client.app.defaultLocale` with `i18n.defaultLocale`, and make sure every language the application offers has a file in its own `client/locales/` and `server/locales/`.

- e9f796d: Run plugin-registered commands during `pnpm build` and `pnpm dev`

  Both scripts now ask the application's CLI which commands its plugins have registered, and run them at the matching stage. The workflow Artifact build was written directly into these scripts and moves to the workflow plugin, which is what installs it; an application without that plugin no longer carries the step, and a plugin that needs one no longer requires an edit here.

  Failing to read the list fails the run: a build that silently skipped a hook would look successful while missing whatever the hook produces. Declaring no hooks is not that case and changes nothing.

### Patch Changes

- b90a65f: Keep the sidebar at viewport height

  On a tall page the desktop sidebar used to stretch along with the document, because it was a stretched flex item of a `min-h-svh` shell. Its navigation therefore never scrolled: the whole page moved instead, and the sidebar's header and footer drifted out of view. The sidebar now sticks to the viewport at a fixed height, and the menu scrolls inside it once its entries overflow. The same fix applies to the settings and dev-tools surface, which shares the layout.

- 426bd48: Remove logical IM `target` recipients and make `send().to` optional so Webhook Providers can be selected directly by Provider name or fan-out strategy.
- 1d59a9c: Add a template upgrade Skill and record the source template in the generated manifest.

  `skills/nocobase-app-upgrade/` describes how to merge a newer template release into an application generated from a template. It compares the two template releases to learn what changed, then decides file by file how each change lands in the application, so a customization is never reverted and a removal that breaks user code outside the changed files is caught before the upgrade is called done.

  `pnpm create @nocobase/app` now writes `nocobase.templatePackage` into the generated manifest, naming the template package the application came from. An upgrade needs it to know which template to diff: `name` becomes the application's own at generation, and `templateKind` does not distinguish the app templates from each other.

- Updated dependencies [adedf9c]
- Updated dependencies [a009e2d]
- Updated dependencies [e9f796d]
- Updated dependencies [e9f796d]
- Updated dependencies [426bd48]
- Updated dependencies [e9f796d]
- Updated dependencies [aa7420a]
  - @nocobase/app-plugin-notification-in-app@0.2.0-beta.8
  - @nocobase/app-plugin-i18n@0.1.0-beta.5
  - @nocobase/app-server@1.0.0-beta.10
  - @nocobase/app-plugin-workflow@0.1.0-beta.13
  - @nocobase/app-plugin-cli-example@0.1.0-beta.2
  - @nocobase/app-plugin-notification@0.1.0-beta.7
  - @nocobase/app-plugin-notification-providers@0.2.0-beta.5
  - @nocobase/nb3-cli@1.0.0-beta.6

## 0.1.0-beta.3

### Patch Changes

- f5b066d: Declare `@nocobase/db` and `@nocobase/service-provider` in `dependencies`, so a generated application can build its server

## 0.1.0-beta.2

### Minor Changes

- c3e02bf: Support client.app.defaultLocale, defaultColorScheme, and defaultTheme configuration while preserving saved user preferences and ignoring unsupported defaults.

### Patch Changes

- 1d042c0: Align the Examples template with nested routes and route-owned navigation.
- f79ab75: Remove type declarations, third-party source maps, and third-party documentation from the deployment build, cutting the archive an application deploys from by roughly 30%
- f5b066d: Add `pnpm build --tar`, which packs the deployment build and `config.example.yml` into `storage/dist.tar.gz`
- 1d042c0: Only display navigation icons when explicitly configured.
- 741d0eb: Remove the commercial AI Knowledge Base plugin dependency and default runtime composition from the open-source application templates.
- 1d042c0: Reset page loading and error state when navigating to another route.
- 0a3fa83: Always show the notification test action, use user-facing delivery method labels, and enforce its permission only when a test message is submitted.
- f5b066d: Document `pnpm build --tar` in the template README
- 5a891d7: Replace the File plugin's legacy backend and client protocol with File Repository services, multipart uploads, and configurable content routes. Preserve its editable Registry components and adapt them to ClientFileRepository and contentUrl. Remove the separate File Repository package, rename its example to app-plugin-file-example, and update application registration and Agent integration guidance.

  This is a breaking replacement of the old File API: access-token routes, inventory settings, FilesClient, and runtime component exports are removed. Applications own file collections and route security; metadata deletion retains storage objects. The example migration remains unchanged.

  Keep the File core in Default and the core plus app-plugin-file-example in Examples. Preserve Hub without a default File registration.

  Require the unified API version for Registry components, preserve PDF previews across cross-origin storage redirects, and normalize database file sizes to safe numeric values without treating custom record or records fields as response envelopes.

- Updated dependencies [e3fa827]
- Updated dependencies [0a3fa83]
- Updated dependencies [0a3fa83]
- Updated dependencies [0a3fa83]
- Updated dependencies [1d042c0]
- Updated dependencies [0a3fa83]
- Updated dependencies [eb3bc38]
- Updated dependencies [5a891d7]
  - @nocobase/app-server@1.0.0-beta.9
  - @nocobase/app-plugin-authentication@0.1.0-beta.10
  - @nocobase/app-plugin-authorization@0.2.0-beta.9
  - @nocobase/app-plugin-notification@0.1.0-beta.6
  - @nocobase/app-plugin-notification-in-app@0.2.0-beta.7
  - @nocobase/app-plugin-notification-providers@0.2.0-beta.4
  - @nocobase/db@1.0.0-beta.4
  - @nocobase/app-plugin-repository-example@0.1.0-beta.3
  - @nocobase/app-plugin-workflow@0.1.0-beta.12
  - @nocobase/app-plugin-file@0.1.0-beta.9
  - @nocobase/app-plugin-file-example@0.0.2-beta.2

## 0.1.0-beta.1

### Minor Changes

- 52d1107: Keep client packages out of the server deployment, and make every native binary match the platform being deployed to.

  A plugin's `client/` is compiled by the consuming application's Vite build, so the packages it imports have to be published in the plugin's manifest — but a server has no client build and never requires them. Plugins now declare those as peer dependencies, and the generated `dist/pnpm-workspace.yaml` sets `autoInstallPeers: false`, so an application installs one shared copy while a deployment installs none. What reaches a server is decided by declarations rather than by analysis.

  Native binaries are compiled for one platform, architecture, C library, and Node ABI at once, so a build made on a Mac installs binaries a Linux server cannot load. `pnpm build` targets the machine it runs on, keeping `pnpm build && pnpm start` working; `--target linux-x64` (or `linux-arm64`, `linux-x64-musl`, `darwin-arm64`, `win32-x64`) and `--node-version` select another. Each build states the platform it produced and records it in `dist/package.json` under `nocobase.buildTarget`.

  The build then verifies its own result: it fails when a package the application's own server, database, or CLI code imports would not reach a deployment. It reads literal specifiers, so an import whose name is assembled at run time is invisible to it and has to be declared deliberately.

  Add `pnpm server:deps:retarget` and `pnpm server:deps:verify`, which run the two steps on their own.

### Patch Changes

- 52d1107: Declare the packages an application's server, database, and CLI code imports in `dependencies` rather than `devDependencies`, and generate `dist/package.json` from that declaration instead of by scanning the built output.

  The scan existed because the declaration did not: with every package in `devDependencies`, nothing could tell which of them a deployment needed, so the build walked `dist/server` for bare imports and expanded each transitive dependency by hand. With the declaration correct, `pnpm install` applies the same rules — a plugin's `dependencies` come along, its `peerDependencies` are skipped by `autoInstallPeers: false`, and `devDependencies` were never published — and a scan that resolves specifiers is a scan that can miss one.

- 52d1107: Resolve the shared UI packages through the workspace catalog: `@base-ui/react`, `class-variance-authority`, `clsx`, `lucide-react`, `shadcn`, `tailwind-merge`, and `tw-animate-css`.

  Every package already agreed on one version for each of these — the catalog is what keeps them agreeing. A range edited in one manifest and not the others would otherwise put two copies of a UI primitive into an application's bundle, which is the kind of drift nothing reports until a component behaves differently depending on which plugin rendered it.

  Peer dependencies use `catalog:` too. `pnpm pack` resolves it before publishing, so a consumer still reads an ordinary range.

- Updated dependencies [52d1107]
- Updated dependencies [52d1107]
- Updated dependencies [52d1107]
  - @nocobase/app-plugin-ai-employee@0.1.0-beta.5
  - @nocobase/app-plugin-ai-knowledge-base@0.1.0-beta.5
  - @nocobase/app-plugin-authentication@0.1.0-beta.9
  - @nocobase/app-plugin-authorization@0.2.0-beta.8
  - @nocobase/app-plugin-i18n@0.1.0-beta.4
  - @nocobase/app-plugin-install@0.1.0-beta.6
  - @nocobase/app-plugin-notification@0.1.0-beta.5
  - @nocobase/app-plugin-notification-in-app@0.2.0-beta.6
  - @nocobase/app-plugin-workflow@0.1.0-beta.11
  - @nocobase/app-plugin-repository-example@0.1.0-beta.2
  - @nocobase/app-plugin-routes-example@0.1.0-beta.8
  - @nocobase/app-plugin-file-repository@0.0.2-beta.1
  - @nocobase/app-plugin-notification-providers@0.2.0-beta.3
  - @nocobase/app-plugin-cli-example@0.1.0-beta.1
  - @nocobase/app-plugin-database-example@0.1.0-beta.5
  - @nocobase/app-plugin-file-repository-example@0.0.2-beta.1
  - @nocobase/app-plugin-queue-example@0.1.0-beta.5
  - @nocobase/app-plugin-realtime-example@0.1.0-beta.5
  - @nocobase/app-plugin-service-provider-example@0.1.0-beta.3
  - @nocobase/app-plugin-skills-example@0.1.0-beta.2

## 0.0.2-beta.0

### Patch Changes

- d29d1fe: Add an independent Examples application template based on Default, with a localized examples homepage, article management, initial data, and registered capability examples. Add the `examples` template alias to create-app and include the template in release version synchronization.
- d29d1fe: Register Workflow commands in the application CLI and build workflow artifacts through `pnpm nocobase workflow build`.
- f5b066d: Fix development startup by building workflows through the application CLI instead of the removed standalone workflow command.
- d29d1fe: Remove the system information plugin package from the workspace and all application templates. Remove its client page, server API, plugin registrations, dependencies, synchronized Skills and integration test references. Document the source upgrade and use a new plugin name in the scaffolding tutorial.
- d29d1fe: Align plugin discovery, development watches, and deployment packaging with the CLI composition roots and remove duplicate plugin manifest metadata.
- d29d1fe: Remove `@nocobase/app-plugin-file` from all application templates, including client/server registration, direct dependencies, test fixtures and installed-plugin guidance. The plugin's file inventory settings page and API are no longer included by default. Preserve stored files and independently registered file Repository capabilities.

## 0.0.1

### Patch Changes

- Initial Examples application template, based on the Default application with article management and registered capability examples.
