# @nocobase/create-app

## 0.1.0-beta.26

### Patch Changes

- 3117923: Stop running the `better-sqlite3` install script in generated applications and deployment output. The driver ships prebuilt binaries for Linux (glibc and musl), macOS and Windows on x64 and arm64, so its `node-gyp rebuild` compiled nothing on those platforms, yet it failed the whole install on a machine without `make`, such as a slim Node.js container. `allowBuilds` now records it as `false`. After installing, `create-app` no longer runs `pnpm rebuild` when the driver fails to load, because that rebuild skips a package whose build is skipped; it reports the platform instead, with how to compile the driver there.

## 0.1.0-beta.25

### Patch Changes

- aeff80a: Exclude the optional `msgpackr-extract` native accelerator from generated applications and deployment output using pnpm's `ignoredOptionalDependencies` setting. BullMQ continues to use msgpackr's JavaScript implementation without installing the accelerator or its platform binary packages.

## 0.1.0-beta.24

### Minor Changes

- a857a08: **Breaking for anything that parses `--json`.** `pnpm create @nocobase/app --json` prints the application CLI's envelope, so an agent reads it the same way as the `pnpm nocobase … --json` commands it runs next: `{ schemaVersion: 1, ok, command: "create-app", status, result | error, warnings }`. `directory`, `projectCreated`, `dependenciesInstalled`, `configured`, `nextCommands` and `message` move under `result`. A failure has `status: "failure"` instead of `error`, and an `error` with a code for the stage it stopped at — `INVALID_USAGE`, `TEMPLATE_DOWNLOAD_FAILED`, `SCAFFOLD_FAILED`, `INSTALL_FAILED` or `DRIVER_VERIFICATION_FAILED` — its `message`, and `details` holding the `stage`, the `directory`, and whether the project was created and its dependencies installed. A failed install suggests the `pnpm --dir <directory> install` that retries it, as `{ command, args }` that runs from anywhere, where it used to set `nextCommands` to `["pnpm install"]`. `--help --json` and `--version --json` return `result.help` and `result.version`. Under `--json`, an unsupported Node.js now prints the same envelope on stdout, with `NODE_UNSUPPORTED`, instead of only text on stderr. Exit codes are unchanged.

### Patch Changes

- 9f75a27: The `--json` document is built by the new `@nocobase/cli-envelope` dependency rather than by a copy of the envelope kept here, and `bin/run.js` runs that package's Node.js guard. What is printed is unchanged.
- Updated dependencies [9f75a27]
  - @nocobase/cli-envelope@0.1.0-beta.0

## 0.1.0-beta.23

### Patch Changes

- 46ce11f: The client reads its runtime values only from the configuration the server renders into `index.html`. The router basename and `resolveAppUrl` take `app.basePath` from that block and throw when the page carries none, `defineAppRuntime` no longer accepts `basename`, and the block is read once per page. The server no longer writes `window` globals: `SpaConfig.runtime` and its `storagePrefix`, `storageType` and `shareToken` settings are removed. The public configuration gains `app.displayName` and `app.version` from the application's `package.json`, which the templates' sidebar footer now shows in place of the `__PORTAL_TEMPLATE_*` constants Vite used to define.

  The templates drop `@nocobase/app-portal-sdk`, `assetUrl`, every Vite `define` and `envPrefix`, and register a test setup that renders the configuration block. The `nocobase-app-upgrade` Skill's edge cases list the steps for an existing application.

## 0.1.0-beta.22

### Minor Changes

- 02d5402: `@nocobase/app-cli` is now the whole application command line: it provides the `nocobase` bin and absorbs `@nocobase/nb3-cli` (command assembly, the plugin contract, plugin and Skill management) and `@nocobase/app-tools` (`dev`, `build`, `start`, `server-deps`). Neither of those two packages is published any more, and there is no compatibility period.

  - **Commands.** Standard commands leave the `app` topic: `nocobase db apply`, `nocobase config init`, `nocobase collections generate`. `app db doctor` is now `collections doctor`, `app i18n:check` is now `locales check`, and `app upload`/`app deploy` are `release upload`/`release deploy`, registered only when `package.json` sets `nocobase.cli.publishing: true`. New commands `dev`, `build`, `start`, `dist retarget` and `dist check` replace the application's `scripts/*.mjs`. `plugin skills sync` and `plugin cli-hooks` are removed; use `skills sync`. `app` now holds only an application's own commands.
  - **Discovery.** Commands are found by path: an application's `cli/commands/orders/sync.ts` answers to `nocobase app orders sync`, with no index to maintain. The bin finds the application from the nearest `package.json` (`nocobase.templateKind` for a source checkout, `nocobase.buildTarget` for a built `dist/`), or from `NOCOBASE_APP_ROOT`; applications no longer have a `cli/index.ts`. A built-in command runs without importing the application's plugins.
  - **Plugins.** A plugin's topic is its package name without the scope and `app-plugin-` prefix, so the scheduler's commands move from `schedule` to `scheduler` and the CLI example's from `demo` to `cli-example`. `defineCliPlugin` accepts `devCommands`, which a built `dist/` leaves out; the workflow plugin's `check` and `build` are development commands. Plugins declare `@nocobase/app-cli` as their peer instead of `@nocobase/nb3-cli`.
  - **Deployment.** `nocobase build` writes `dist/cli/index.js`, so `node dist/cli/index.js db apply` runs from any directory without pnpm; `dist/package.json` keeps only the `start` and `nocobase` scripts. The `migrate` and `seed` scripts it used to generate pointed at commands that no longer existed and are gone. Development tooling (`typescript`, `tsx`, `vite`, `prettier`, `tar`, `@nocobase/dev-config`) is an optional peer, so a deployment installs none of it.
  - **Templates.** Scripts are reduced to `postinstall`, `dev`, `build`, `start` and the quality checks; every other command is `pnpm nocobase <topic> <command>`. `scripts/`, `cli/index.ts` and `cli/commands/index.ts` are removed.

  Upgrading an existing application requires moving to the new layout in one step: see "Shared application scripts and commands" in the `nocobase-app-upgrade` Skill (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) for the full procedure. Messages that named `nocobase app db repair` and similar commands now name the new ids.

### Patch Changes

- dbf5631: Replace the last references to command names the application command line no longer has. The Bubble reference page in each template now shows `pnpm nocobase db apply` instead of `pnpm migrate`, and comments in `@nocobase/create-app` and `@nocobase/app-client` no longer name the removed `client:inspect`.
- 4adcf24: Keep hand-written Collection metadata apart from the generated `collections/` cache

  `database/<connection>/collections/` used to hold two opposite things: a generated snapshot for a managed connection, and, for an external connection, `metadata.json` files that were the hand-written metadata source. The two now live in separate directories, so a directory is either written by people or generated, never both.

  - `DirectoryCollectionMetadataStore` reads a directory of `<name>.json` files, each holding one Collection metadata document with no wrapper. It refuses a directory in the generated `<name>/metadata.json` layout and says how to move it.
  - An external connection with no configured `metadataStore` reads `database/<connection>/metadata/<name>.json`. A `metadataStore` string names a directory in that layout, and may not point at a generated `collections/` directory. An application that still keeps metadata at `database/<connection>/collections/<name>/metadata.json` fails at startup with the steps to move it, rather than silently resolving its Collections without metadata. `resolveAppMetadataDirectory()` is exported beside `resolveAppCollectionsDirectory()`.
  - `collections generate` treats `collections/` as a cache for every connection, external ones included: it writes all three files there and never touches `metadata/`. The `orphans` result field is gone; a hand-written document whose Collection the database no longer has is reported as `unusedMetadata` and left in place. `_manifest.json` now records `generated: true`.
  - `nocobase build` copies `database/<connection>/metadata/` into `dist` instead of the `metadata.json` files under `collections/`.
  - The templates and generated applications ignore `/database/*/collections/` with one line instead of naming each managed connection. The Examples template moves its external CRM metadata to `database/externalCrm/metadata/`.

  To upgrade an application with an external connection, write each `"document"` from `database/<connection>/collections/<name>/metadata.json` to `database/<connection>/metadata/<name>.json`, point any `metadataStore` string at the new directory, delete the old `collections/` directory and regenerate it. Replace the per-connection `collections/` lines in `.gitignore` with `/database/*/collections/`. The `nocobase-app-upgrade` Skill lists the steps.

## 0.1.0-beta.21

### Patch Changes

- f6c3cd8: Stop writing `AUTH_DISABLE_SIGN_UP=true` into a generated Hub's `.env`. Nothing read the variable, so it never had any effect; the Hub disables public sign-up through `auth.emailAndPassword.disableSignUp: true` in `config.yml`, which `config.example.yml` already sets. Existing Hubs can delete the line from `.env`, and should confirm their `config.yml` sets `disableSignUp: true` under `auth.emailAndPassword`.
- d18e964: Declare environment variables on the configuration section they set, list them with `pnpm config:env`, and stop shipping environment variables nothing reads.

  `defineAppConfig` takes `env`, a map from variable to a mapping relative to the section, such as `{ APP_SERVER_PORT: envInteger('port') }`. The runtime loads these above the configuration file once the sections are known, and refuses one variable declared for two different fields. `defineAuthConfig` maps `AUTH_SECRET` itself, and the templates declare the rest in `server/config/session.ts`, `server.ts`, `app.ts`, `i18n.ts`, `snowflake.ts` and `spa.ts`. `server/environment.ts` is gone and `server/config.ts` loads only the configuration file. An existing application that keeps its own `server/environment.ts` still works, since a variable mapped twice to the same field is harmless; to move over, copy the `env` of each section file from the new template version and delete the mapping file.

  `pnpm config:env`, also in a built `dist/`, lists every variable the application reads — those its sections declare, with the configuration path each sets, and those the runtime reads itself, `APP_BASE_PATH`, `APP_CONFIG_FILE` and `NOCOBASE_STRICT_STARTUP` — and whether each is set, never its value. `--json` prints the same list. `RUNTIME_ENVIRONMENT_VARIABLES` in `@nocobase/app-server/config` names the runtime-read ones.

  `APP_NAME` is gone from the Hub's `.env.example` and from the `.env` that `create-app` writes for a Hub, which used to set it to the project directory's name: nothing read it, and an application's name follows from `APP_BASE_PATH`. The commented `API_CLIENT_*` lines are gone for the same reason. The Hub template gains a test that every variable `.env.example` names is one `config:env` lists. `pnpm build` no longer copies `DB_*`, `QUEUE_*`, `REDIS_*`, `SMTP_*`, `API_CLIENT_*` and the notification provider variables into `dist/.env`; nothing reads any of them.

## 0.1.0-beta.20

### Minor Changes

- 4e58fe3: Stop generating `config.yml` and stop choosing a database. Creation now produces a project that is ready to configure, and `pnpm config:init` configures it.

  `--dialect` is removed. It decided two things at once — the connection settings written into `config.yml` and which driver the project depended on — and only one of them belonged to scaffolding. The templates now depend on `@nocobase/db-sqlite`, the dialect their own `server/config/database.ts` defaults to, so a generated application still needs nothing installed before it can be configured; using another database means adding its driver and running `config:init --dialect` with it, both inside the application.

  `nextCommands` is now the whole remaining procedure in order — `pnpm config:init` then `pnpm dev`, preceded by `pnpm install` after `--no-install`, and ending with `pnpm build` and `pnpm start` for a Hub — so an agent can run it as written instead of reconstructing it from prose. `dialect`, `configurationRequired`, `configFile`, `configPath` and `databaseConnectionVerified` are gone from the JSON result, replaced by `configured`, which is always `false`.

  A generated project now carries an `.npmrc` recording the registry the template came from, scoped to `@nocobase`. Until now that registry was passed to the one install this command runs and then forgotten, so the next `pnpm add @nocobase/…` a user ran — a driver for another dialect, a plugin, an upgrade — resolved against the public npm and failed with a 404 that never mentioned a registry. The line is omitted when the registry is the public npm, so an application generated once the packages are published there carries no pin to a mirror. `strict-peer-dependencies=false` is written alongside it, because the templates carry it in their own `.npmrc` and npm strips that file from every tarball it builds.

### Patch Changes

- 4e58fe3: Add `nocobase app config check` and `nocobase app config set`, run in an application as `pnpm config:check` and `pnpm config:set`, so a configuration is written by `config:init`, changed by `config:set` and verified by `config:check`.

  `config:check` loads the configuration through the application itself — its files, its environment and its code defaults — without starting it. A file that fails to parse, or a database driver that is not installed, fails here for the same reason it would fail a start. It then reports what loading alone does not show: a secret missing or still the placeholder, a `session.secret` that is regenerated at every start and so ends every session with the process, a top-level section nothing reads with the name that was probably meant, and a `${NAME}` written where it is not expanded and would be used as literal text. Databases other than SQLite are connected to, one connection each taken from the pool and handed back, without running SQL or migrating anything; `--connect` includes SQLite and `--no-connect` stays offline. Each finding carries the key and, where there is one, a command that fixes it, and the command exits non-zero on any error, or on any warning with `--strict`.

  `config:set` sets `key=value` assignments in the file the application reads, keeping its comments, and writes it once. A key under a section the application does not know is refused with the nearest known one, so a typo fails instead of being written where nothing reads it. With `--from-env` each value names an environment variable to read, so a secret stays out of the command line. After writing it loads the configuration again and reports any key an environment variable overrides.

  `config:init` now returns its `nextCommands` and, for a database other than SQLite, the `requiredSettings` still at a placeholder. On a terminal it asks for them, reading the password without echo, and tries the connection before writing. Run on an application that is already configured it leaves the file alone and reports `unchanged`, failing only when `--dialect` asks for a different database than the one configured.

  A built `dist/package.json` carries `config:check` and `config:set` scripts, and its `pnpm-workspace.yaml` sets `verifyDepsBeforeRun: false`, so running one of a deployment's own scripts never makes pnpm install first. `create-app` includes `pnpm config:check` in the `nextCommands` it returns.

  `AppConfig` gains `layers()`, which returns the code defaults and the values the application's own sources supply as separate read-only copies — the distinction a check needs to tell a known section from a misspelled one.

## 0.1.0-beta.19

### Patch Changes

- ca3188e: Publish the `database/` directory by part rather than whole, so generated Collection artifacts stay out of the tarball.

  `files` listed `database`, and npm applies that whitelist ahead of every ignore file, so whatever `pnpm collections:generate` had written under `database/<connection>/collections/` was published with the template. Those files are a snapshot of one machine's database, down to the dialect's physical types and Oracle's generated sequence names, so what a template shipped depended on whether someone had run the generator locally and against what. Neither `.gitignore` nor `.npmignore` could take them back out. `@nocobase/app-template-examples` was carrying 214 such files, 1.1 MB, from an Oracle database, in a template whose `config.example.yml` offers SQLite.

  `files` now names `database/tsconfig.json`, `database/*/migrations/**` and `database/*/seeds/**`, plus Examples' `database/externalCrm/collections/**`, which is the metadata source for an external connection rather than generated output. Each template also ignores its managed connections' collections directories, and `create-app` writes the same entry into a generated application.

## 0.1.0-beta.18

### Patch Changes

- 8124b03: Mirror every synchronized skill into `.claude/skills/` as a relative symbolic link, so Claude Code discovers the skills an application's NocoBase packages ship. Claude Code reads only `~/.claude/skills/` and `<project>/.claude/skills/`, so a synchronized `.agents/skills/` was invisible to it while globally installed NocoBase 2 skills stayed available. Removing a package or a skill drops its link, application-owned entries are left alone, and a real directory occupying a `nocobase-` name is reported rather than overwritten. Ignore the generated mirror in the template and generated `.gitignore` files alongside `.agents/`.

## 0.1.0-beta.17

### Minor Changes

- fe564d9: Support database selection with --dialect and non-interactive structured output with --json. Generate local database connection settings, install compatible drivers, and guide agents through configuration before startup.

### Patch Changes

- fe564d9: Default generated applications to verifyDepsBeforeRun: false so running development, build, or startup scripts does not implicitly install dependencies. Document explicit installation after dependency changes and preserve template-provided settings.
- fe564d9: Classify occupied target directories as scaffold failures, select main for existing SQLite configurations, and explicitly report the limited scope of native dependency verification for other dialects.

## 0.1.0-beta.16

### Patch Changes

- d86f6aa: Synchronize agent skills from direct NocoBase package dependencies with the new skills:sync command while preserving plugin:skills:sync compatibility, and share application development and upgrade skills through @nocobase/app-skills across all application templates.

  Add package:remove to uninstall a NocoBase dependency and clean up its synchronized skills and ownership records, reusing plugin unregistration for plugin packages. Document the removal workflow in application templates and the shared development and upgrade skills.

## 0.1.0-beta.15

### Minor Changes

- c258b92: Generate `config.yml` from the template's own `config.example.yml` and remove `--db-dialect`.

  The database is no longer chosen at generation time. Since dialects were split into `@nocobase/db-*` packages, a connection may only use a dialect the application registers in `server/config/database.ts`, and that file cannot be overridden from `config.yml`. Adding a bare driver to `dependencies` — what `--db-dialect` did — therefore produced an application that failed to start with `Database dialect "postgres" is not registered.` for every dialect but SQLite. A generated application now starts on the SQLite connection its template declares, and another database is a change to that file plus the matching dialect package.

  `config.yml` is built from the template's `config.example.yml` with `auth.secret` and `session.secret` filled in, rather than assembled here. The example documents everything an application can be configured with — notification channels, LLM services, additional connections — and a file written from scratch carried a fraction of it and went stale whenever the example grew.

  A hub is generated the same way. It owns a database like any other application, so it now gets a `config.yml` too: without one it started in install mode on a secret regenerated every boot, which invalidated every session on restart. It also gets its plugin skills synchronized, and no longer gets the vestigial `app-dist/` directory, which nothing reads. `.env` remains, for the deployment facts that belong to it.

  The fallback `.gitignore`, written when a template ships none, now also covers `.env`, `config.toml`, and the local SQLite files.

## 0.1.0-beta.14

### Patch Changes

- f17f3a6: Provide editable TypeScript defaults for application modules, assembled by the runtime before services start. Module factories receive the runtime with application paths and plugin metadata; deployment files and environment variables override defaults, and configuration reload preserves code defaults.

  Keep deployment settings in YAML examples and reserve explicit environment overrides for secrets and startup integration. Simplify application configuration loading, merging and reload subscriptions.

  Align client configuration assembly with the server: runtime merges application TypeScript defaults beneath public configuration before services start. Client inspection reports the application configuration entry.

- f17f3a6: Support TypeScript authentication options in application templates and use the native authentication client. Keep authentication plugins and callbacks in editable server and client configuration, with YAML as the default format for deployment settings.

  Runtime assembly now prepares complete configuration before application creation. Module configuration factories use defineAppConfig and defaultAppConfigs, receive the runtime once, and retain their defaults when environment configuration reloads.

## 0.1.0-beta.13

### Patch Changes

- 1d59a9c: Add a template upgrade Skill and record the source template in the generated manifest.

  `skills/nocobase-app-upgrade/` describes how to merge a newer template release into an application generated from a template. It compares the two template releases to learn what changed, then decides file by file how each change lands in the application, so a customization is never reverted and a removal that breaks user code outside the changed files is caught before the upgrade is called done.

  `pnpm create @nocobase/app` now writes `nocobase.templatePackage` into the generated manifest, naming the template package the application came from. An upgrade needs it to know which template to diff: `name` becomes the application's own at generation, and `templateKind` does not distinguish the app templates from each other.

## 0.1.0-beta.12

### Minor Changes

- e3fa827: Add reusable user administration and Hub-scoped role-based authorization. Authentication now supports disabled accounts, transaction-aware administration, stable duplicate-identity conflicts, Session revocation, and immediate Realtime disconnects. Authorization supports protected Permission Sets, atomic scoped assignment replacement, and Client permission invalidation. The Users page supports protected role options, readable multi-role editing, explicit unassigned states, and a distinction between direct roles and authenticated-user defaults; password reset and database Session revocation share one transaction. The default App exposes its direct Authorization Permission Sets as application roles while keeping System administrator changes in Authorization. The Hub defines Administrator, Operator, and Viewer roles, batch-loads their user assignments, enforces every Hub and user-management action on the server, protects the final enabled Administrator, and hides unauthorized Client controls. Both templates register the reusable Users plugin; Hub exposes Applications, User management, and a read-only role matrix directly in its control-plane navigation, while the default App keeps Users in Settings. Only the Hub template receives Hub roles, disables public sign-up, and omits ordinary App Settings, workflows, notifications, and example plugins.

## 0.1.0-beta.11

### Minor Changes

- d29d1fe: Add an independent Examples application template based on Default, with a localized examples homepage, article management, initial data, and registered capability examples. Add the `examples` template alias to create-app and include the template in release version synchronization.

### Patch Changes

- c033168: Ignore root-level `.agent-annotations/` in generated applications, including when a template provides its own ignore file.

## 0.1.0-beta.10

### Minor Changes

- 90a4903: Add Microsoft SQL Server support through Knex and the `tedious` driver, including connection configuration, Collection Builder and Query behavior, Schema Inspector introspection, real Docker integration tests, generated-application driver installation, and template runtime packaging.
- 90a4903: Add Oracle Database support through the `oracledb` Thin driver, including connection configuration, Collection Builder and Query behavior, Schema Inspector introspection, real Docker integration tests, generated-application driver installation, and template runtime packaging.

## 0.1.0-beta.9

### Minor Changes

- 5b36849: Remove `nb3 app create`, `dev`, `info`, `config`, `destroy`, `deploy`, `pull`, `list` and the whole `nb3 hub` topic, leaving the five `nb3 app plugin *` commands the repository and generated applications actually call. Those commands came from an earlier plan where a user installed `nb3` globally and created projects with it; projects are generated by `pnpm create @nocobase/app` and run through their own scripts instead, so nothing invoked them and three were never implemented. A generated hub no longer gets a `.nb3/` directory either, since only the removed commands read it.

## 0.1.0-beta.8

### Minor Changes

- 813da59: Rewrite the template's package name into the generated application's own, in `client/runtime.ts`, `client/service-provider.ts`, and `server/providers/app-example.ts`, and set `displayName` to the application name instead of dropping it. The client previously declared an i18n namespace the server did not share, and `pnpm client:inspect` refused to run because the two disagreed.

## 0.1.0-beta.7

### Patch Changes

- 15c7197: Publish the `./i18n` subpath. `exports` declared it but `publishConfig.exports` did not, so it resolved from source in this repository and was absent from the published package. A generated application failed to start on `pnpm dev` with `ERR_PACKAGE_PATH_NOT_EXPORTED` for `./i18n`, imported by its own `server/app.ts`.

  `pnpm pack:check` now compares `exports` against `publishConfig.exports` and rejects a subpath present in one and missing from the other, in either direction. This class of defect is invisible in the workspace — every consumer resolves through the source map — and only appears once the package is installed from a registry.

  A generated application no longer stops its first install with `ERR_PNPM_IGNORED_BUILDS`. `tesseract.js` reaches the dependency tree through `officeparser` and its `postinstall` only prints a donation notice, so `allowBuilds` now records it as a deliberate `false` rather than leaving it undecided; entries accordingly carry their own value instead of always being written as `true`. The generated `pnpm-workspace.yaml` also sets `strictDepBuilds: false`, so a transitive dependency introduced later reports a skipped install script as a warning rather than failing the install of a project that is otherwise fine. The repository's own `pnpm-workspace.yaml` takes the same setting.

## 0.1.0-beta.6

### Minor Changes

- 174eab5: Consolidate the browser packages into `@nocobase/app-client`.

  `@nocobase/app-sdk` is gone; its API client now lives in `@nocobase/app-client` and is imported from there. `@nocobase/app-portal-sdk` is deprecated and keeps only what still has consumers: `NocoBaseClient` and the runtime configuration it reads, which exist to reach a v2 NocoBase server, and the route surface containers under `/routing`. Its ACL, auth, data, extension, i18n, and system-settings modules are removed, as is the route tree that `/routing` used to export alongside the surfaces.

  `@nocobase/app-client` gains `resolveAppBase()`, which reports the path the application is mounted at.

  Four plugins built their API client at import time instead of resolving it from the application's service container, so they could not see `api.baseURL` from the application configuration. They now resolve it, which means an application that configures a base URL gets one client rather than two that disagree.

  The injected browser global `NOCOBASE_PORTAL_BASE` is renamed to `APP_BASE_PATH`. Its value has always been the `APP_BASE_PATH` environment variable, and the old name grouped it with the settings that address a v2 NocoBase server. Those keep their names. A client and the server that serves it must be upgraded together.

  `@nocobase/app-plugin-data-provider` is removed. It forwarded the Portal data provider, and applications built on the current client runtime do not use it.

  The Hub template is rebuilt from the default template and now runs the same client and server stack as every other v3 application. Its `/api/apps` endpoint and its v2 API proxy are gone, so a hub's `.env` no longer configures them.

  The Portal SDK's template compatibility check is removed with the rest: it had been disabled behind a constant, and its install script cost every generated project a `pnpm-workspace.yaml` `allowBuilds` entry it did not need. `createPortalViteConfig` no longer takes the plugin that injected it.

## 0.1.0-beta.5

### Minor Changes

- 1b5f10f: Accept `--template hub` in `create-app`, and scaffold a hub as a hub rather than as an app.

  A hub has no database, so the app flow was wrong for it in every step that touches one: it would have asked which dialect to use, added a driver dependency the hub never loads, and written a `config.yml` the hub never reads. A template now declares what it is through `nocobase.templateKind`, and `create-app` reads that to decide which flow applies — falling back to the package name so a local path to a checkout predating the field still works. The kind is settled after the template is downloaded, because a package specifier or a local path does not reveal it any earlier.

  A generated hub gets the scaffolding `nb3 hub create` already produced: `.env` derived from the template's `.env.example` with `APP_NAME` set to the project name, `.nb3/hub.json` so the `nb3 hub` commands can find it, `app-dist/` for the apps it serves, the runtime directories it writes into, and the matching `.gitignore` entries. `--db-dialect` is reported as ignored rather than silently dropped when it is passed alongside a hub template.

### Patch Changes

- 78cf0a2: Keep synchronized `.agents` content out of generated application source control while preserving local Plugin Skill synchronization and inspection.
- a7d4453: Synchronize plugin skills into a generated app after its dependencies are installed. The sync resolves plugins out of `node_modules`, so it can only run after the install; `create-app` now runs the app's own `plugin:skills:sync` script at that point, which leaves a new project carrying the skills of the plugins the template ships instead of an empty `.agents/skills/`.

  Skills are an assistive layer rather than something the app needs to boot, so a failed sync is reported as a warning along with the command to run by hand, and the generated project is still reported as created.

- d048955: Ignore local NocoBase runtime state in newly generated applications.

## 0.1.0-beta.4

### Patch Changes

- ad7ffd8: Set `trustLockfile` in generated applications, so installs stop re-auditing every lockfile entry against the supply-chain policy each time. The check queries registry metadata per package and re-verifies versions the lockfile already pins; newly resolved packages are still checked.

## 0.1.0-beta.3

### Patch Changes

- 8fb9319: Pin the pnpm version in generated applications. Without it the project runs on whatever pnpm the machine defaults to, and pnpm 10 does not read `allowBuilds` at all, so the database driver installs without compiling its native addon and fails only at the first query.

## 0.1.0-beta.2

### Patch Changes

- b269e38: Write the full `allowBuilds` list into every generated application rather than only the driver its database needs. `better-sqlite3` is listed even when another database was chosen, so switching an app to sqlite later works instead of failing with an error that names nothing actionable, and `@nocobase/app-portal-sdk` and `esbuild` are listed because the application installs both and pnpm 11 skips their build scripts otherwise.
- c13418c: Point the default template at the `latest` dist-tag instead of `beta`. changesets leaves `beta` on a package's first published version while tagging every release since as `latest`, so `beta` named the oldest template rather than the newest, and scaffolding from it produced an app missing settings that later releases added to `.env.example`.
- c13418c: Add `--template-tag` to choose which channel a named template is fetched from, `latest` (the default) or `beta`. A template given as a package specifier or a local path is unaffected, since it already says which version to use.

## 0.1.0-beta.1

### Patch Changes

- 31245b6: Keep the template's identity out of generated applications. The manifest no longer has its `version` reset or `private` added, so an app records which template release it came from; `displayName` and `description` are now dropped, which previously left a new app labelled "Default Template". Comment blocks in `.env.local` whose settings were replaced are removed along with them, instead of leaving headings with nothing under them.

## 0.1.0-beta.0

### Minor Changes

- b3286fc: Add `@nocobase/create-app`, which scaffolds an application with `pnpm create @nocobase/app <directory>`. It prompts for the target directory and the database type, downloads the app template, installs the one driver that database needs, and writes `.env.local` with the connection settings and a generated `AUTH_SECRET`. Both answers can be passed as arguments instead, making the command usable from a script.
