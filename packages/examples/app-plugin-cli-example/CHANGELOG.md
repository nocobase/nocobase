# @nocobase/app-plugin-cli-example

## 0.1.0-beta.4

### Patch Changes

- be0fbbd: Tests in these plugins and example plugins take their fixtures from `@nocobase/app-testing` alone: database fixtures such as `createDatabaseTest()`, `describeMigration()` and `expectCollection()` from `@nocobase/app-testing/server`, and the command runner from `@nocobase/app-testing/cli`. Each package replaces its `@nocobase/db-testing` development dependency with `@nocobase/app-testing`. Nothing any of them ships changes.
- Updated dependencies [463a7a8]
- Updated dependencies [463a7a8]
- Updated dependencies [e44f49c]
  - @nocobase/app-cli@1.0.0-beta.12

## 0.1.0-beta.3

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

- dbf5631: Replace guidance that named removed commands and layouts. The Hub's development page names the archive `nocobase build --tar` actually writes, `storage/exports/dist.tar.gz`. The scheduler Skill synchronizes with `pnpm nocobase scheduler sync` instead of `nb3 schedule:sync` and gives the deployed form, `node dist/cli/index.js scheduler sync --finalize`. The repository example applies its migrations and seeds with `nocobase db apply`, the CLI example's Skill matches its manifest and the stdout-only `--json` contract, and the i18n Skill no longer presents `pnpm i18n:check` as the monorepo form of `locales check`. Plugin `AGENTS.md` files carry the current dependency rules from the plugin template.
- Updated dependencies [ec92b20]
- Updated dependencies [dbf5631]
- Updated dependencies [ec92b20]
- Updated dependencies [02d5402]
- Updated dependencies [ae43f41]
- Updated dependencies [8c06293]
- Updated dependencies [05af1d4]
- Updated dependencies [4adcf24]
  - @nocobase/app-cli@1.0.0-beta.6

## 0.1.0-beta.2

### Minor Changes

- e9f796d: Demonstrate a build hook

  The plugin now registers a `beforeBuild` hook alongside its commands, showing that a hook command is any executable rather than one of the plugin's own oclif commands.

### Patch Changes

- Updated dependencies [e9f796d]
  - @nocobase/nb3-cli@1.0.0-beta.6

## 0.1.0-beta.1

### Patch Changes

- 52d1107: Declare each peer dependency once, dropping the devDependency that used to accompany it.

  The pairing was required on the grounds that a peer range is wide enough for development to drift off this repository's copy. It is not: pnpm installs a peer and links it into the plugin's own `node_modules`, resolving `workspace:^` to the same package `workspace:*` would. A plugin with the devDependency removed still links, typechecks, builds, and tests against it — verified against a clean install with every plugin's `node_modules` deleted first.

  What remained was a second declaration that changed nothing and had to be kept in step with the first. `pnpm peers:check` no longer asks for it, and `create-plugin` no longer emits it.

## 0.1.0-beta.0

### Minor Changes

- ec576ba: Let plugins contribute commands to an application's CLI, and rename the bin to `nocobase`.

  An application now has a `cli/` composition root beside `client/` and `server/`. Its `cli/index.ts` calls `runAppCli()` from `@nocobase/nb3-cli/runtime`, which assembles one command tree from three sources: the built-in plugin management commands under `plugin`, the application's own commands under `app`, and each registered plugin's commands under the topic that plugin declares. `pnpm nocobase` runs it.

  A plugin contributes commands by exporting a `./cli` entry that calls `defineCliPlugin()` with a topic and a map of oclif `Command` subclasses. `@nocobase/app-plugin-cli-example` is the reference implementation. `@oclif/core` is a peer dependency of such a plugin so that the plugin and the application share one copy, which is what keeps help rendering and flag parsing consistent.

  `plugin register`, `plugin unregister`, and `plugin inspect` maintain `cli/plugins.ts` the same way they already maintain `client/plugins.ts` and `server/plugins.ts`, keyed on whether the plugin exports `./cli`. An application without TypeScript degrades to printed instructions for that file exactly as it does for the other two.

  `cli/` is compiled into `dist`, so a deployed application runs the same commands with `node ./cli/index.js`. The application's own `migrate` and `seed` are now commands rather than separate scripts, and `pnpm migrate` / `pnpm seed` dispatch through the CLI — the script names are unchanged. A command that cannot work in a deployment goes in `cli/dev-commands/`, which the build excludes; client inspection lives there because it needs Vite and the browser client. `server:config` was removed outright.

  Two breaking changes come with this. The bin is `nocobase` rather than `nb3`, and the five plugin commands moved from `app plugin *` to the top-level `plugin *`, which frees the `app` topic for the commands an application writes itself. The `pnpm plugin:*` script names are unchanged, so anything invoking those scripts is unaffected.

### Patch Changes

- Updated dependencies [ec576ba]
- Updated dependencies [67907ec]
  - @nocobase/nb3-cli@1.0.0-beta.5

## 0.0.1

### Patch Changes

- Add an example plugin that contributes commands to an application's `nocobase` CLI, demonstrating arguments, flags, JSON output, and a nested sub-command.
