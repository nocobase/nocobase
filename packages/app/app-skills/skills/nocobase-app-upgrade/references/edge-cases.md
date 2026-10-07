# Edge cases

Things that are not ordinary source and do not follow the file-by-file process in `SKILL.md`.

## `package.json`

Merge key by key; never copy the template's manifest over. What the template changed:

```bash
diff <(node -p "JSON.stringify(require('$WORK/$BASE/package.json'), null, 2)") \
     <(node -p "JSON.stringify(require('$WORK/$TARGET/package.json'), null, 2)")
```

| Key                                                              | Rule                                                                                                                                 |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `name`, `displayName`, `version`                                 | The application's. Never the template's.                                                                                             |
| `nocobase.templatePackage`, `nocobase.templateKind`              | Leave as they are.                                                                                                                   |
| `nocobase.defaultTemplateVersion`                                | The target — set last, after the merge.                                                                                              |
| `description`, `publishConfig`, `repository`                     | Absent by design; do not reintroduce.                                                                                                |
| `dependencies`, `devDependencies`                                | Add, update, and remove what the template did. Never replace the object: the database driver and the user's own additions live here. |
| `scripts`                                                        | Take the template's changes; keep the user's additions. Ask before overwriting a template script they redefined.                     |
| `files`, `engines`, `packageManager`, `browserslist`, `prettier` | The template's.                                                                                                                      |
| `pnpm`, `overrides`, `resolutions`                               | The user's, unless the template changed the same entry.                                                                              |

Dependency keys get reordered between releases, so most of the raw diff is noise — compare key by key. A dependency the template dropped may be one the user now imports directly; search application code, configuration, tests, and build scripts before deleting it, same as a removed export. For plugins, complete the [code and configuration review](#review-a-removed-plugins-usage). Obtain confirmation before removing any apparently unused `@nocobase/*` capability, and keep each retained package in the appropriate dependency section together with any required registrations.

After its references have been migrated and the user has confirmed the removal, run `pnpm nocobase package remove @nocobase/example` instead of deleting only the manifest key. Use `--dry-run` to preview or `--json` for structured output. The command invokes the application's package manager so `package.json` and the lockfile stay consistent, then removes only synchronized Skills recorded as owned by that package. For an `@nocobase/app-plugin-*` target it delegates to the plugin unregister workflow and removes Client, Server, and CLI registrations together; `pnpm nocobase plugin unregister <name>` remains available as the plugin-specific entry point. The removal command does not edit business code or configuration, which is why the usage review and any migration happen first.

After an interrupted or manual removal, confirm that the final manifest no longer declares the package and run a full `pnpm nocobase skills sync` to reconcile stale package-owned output. `package remove` can also clean recorded historical Skill ownership for a named package already absent from the manifest, and it does not uninstall or clean Skills belonging to another package.

Ranges in a published template are already resolved (`pnpm pack` expands `workspace:` and `catalog:`). Take them as published.

Keep the existing application and template identities: changing from one template lineage to another is a separate source and database migration, and changing the package name does not transfer migration history.

### Dependency resolution conflicts

An existing lockfile may keep an older dependency resolution that still satisfies its declared range. After a template upgrade, the application's direct `@nocobase/db` and the copy used by an authorization dependency can therefore differ, making `DatabaseConnection` types incompatible. The Finish step runs `pnpm dedupe` to consolidate compatible versions; it cannot reconcile incompatible declared ranges.

If the same-package type conflict remains, inspect the paths reported by TypeScript and use `pnpm why <package>` to find which dependency retains the older copy. For the authorization example:

```bash
pnpm why @nocobase/db
pnpm why @nocobase/authorization
pnpm why @nocobase/app-plugin-authorization
```

When a compatible newer version of the retaining dependency is available within its declared range, run `pnpm update <identified-package>`, then `pnpm dedupe`, and inspect the dependency paths again. Update only the package identified by the conflict; do not run an unscoped update or use `--latest`. If the declared ranges or application overrides prevent a shared version, report the conflicting constraints and reconcile them with the target template and the user's custom dependencies instead of forcing a version or deleting the lockfile.

After resolving the conflict, rerun `pnpm nocobase skills sync` and all Finish checks. Confirm the affected paths use a compatible shared package resolution; unrelated packages may legitimately retain multiple versions. A remaining type error without duplicate package resolutions needs investigation as a source or API compatibility issue.

## Generated configuration and committed examples

`config.yml` holds real settings and generated secrets. A template may also generate `.env` for build-time deployment facts. These live files are gitignored, were written by `pnpm nocobase config init` and the generator rather than copied from the template, and are absent from the release diff. Never print or replace them as part of the merge. `config init` refuses to overwrite an existing configuration, so it is safe to run during an upgrade; `--force` replaces one and is never part of a merge.

`config.example.yml` ships with every current official template and merges normally. A template may also ship `.env.example`. Changes to these examples are the signal that a corresponding live file may need a manual edit:

```bash
diff "$WORK/$BASE/config.example.yml" "$WORK/$TARGET/config.example.yml"
if [ -f "$WORK/$BASE/.env.example" ] || [ -f "$WORK/$TARGET/.env.example" ]; then
  diff "$WORK/$BASE/.env.example" "$WORK/$TARGET/.env.example"
fi
```

A new key with a working default needs nothing. One without a default is a startup failure waiting for the next restart: tell the user what to add and let them edit the live file. Preserve application identity, public paths, ports, credentials, and other deployment facts rather than copying values from an example.

### A removed plugin the diff cannot remove for you

A target release that drops `@nocobase/app-plugin-install` leaves an upgrading application still importing it. Remove the dependency from `package.json` and its entries from `client/plugins.ts` and `server/plugins.ts`; there is nothing to migrate, because the installation page only ever appeared for an application that had no configuration file, and a configured one never reached it. An application that did rely on that page configures itself with `pnpm nocobase config init` instead.

A target release that drops `@nocobase/app-plugin-notification-provider` is the case where removing a plugin is not enough on its own: the application has to provide the toaster the plugin used to, or four plugins' pages report nothing. Follow [Notifications and the application toaster](#notifications-and-the-application-toaster) rather than removing only the registration.

## `client/plugins.ts`, `server/plugins.ts`, `cli/plugins.ts`

Composition roots: the template registers what it ships, `pnpm nocobase plugin register` appends what the user installed. Both sides append to the same region, which is exactly what a text merge gets wrong. Merge them as sets of registrations:

- Added by the template — merge the target's registration and options, preserving any deliberate application customization.
- Removed by the template — complete the usage review below before removing either the registration or dependency. Preserve user-added or used plugins, including those originally enabled by the template. Removal stops registering a capability; it does not delete tables or data.
- Options changed — take the new ones, unless the user deliberately set otherwise.
- Anything the user added — keep it.

Follow the [Finish step](../SKILL.md#8-finish) to install and deduplicate dependencies before synchronizing Skills: the sync resolves direct `@nocobase/*` dependencies from the final `node_modules` and retains compatibility with registered plugins.

An older application may also carry a `nocobase.plugins` array in `package.json`. Remove it after merging the CLI and template scripts that use the Client, Server, and CLI composition roots for plugin discovery. Preserve the user's registrations in those roots, and check application-owned scripts for remaining consumers of the legacy field.

### Review a removed plugin's usage

Registration origin and application usage are separate questions. Review the application's code and configuration even when the plugin's registration is unchanged from BASE.

1. Identify the removed plugin's capabilities from BASE and its public documentation. Search beyond the composition roots for its package name, exported services, API paths, route names, and collection names in application-owned code and configuration.
2. If neither code nor configuration shows usage, treat the plugin as apparently unused and ask the user to confirm its removal in the upgrade plan. This review does not require inspecting running workflows or business data. Remove the dependency and registrations together only after confirmation; otherwise keep them.
3. If references are found or the user says the capability is needed, retain its manifest dependency and required Client, Server, and CLI registrations, and check compatibility with TARGET. Preserve user-added plugins unless the user explicitly chooses to remove them. If retention is incompatible or a replacement is needed, agree on the capability and data migration before removing the old plugin; a similar package name does not establish equivalence.

Before combining a retained plugin with a replacement added by TARGET, check that their dependencies and registrations can coexist. If they conflict, leave that combination unmerged until a migration is agreed.

Apply the agreed outcome to the manifest and composition roots together, then verify the affected application behavior after upgrading.

## Migrations

A release can ship a migration under `database/`. Copy it in like any added file, then `pnpm nocobase db apply`.

Never edit a migration that arrives this way, and never edit one already run — a correction goes in a new migration. The user's own migrations and seeds stay byte for byte where they are; an upgrade never rewrites them.

Template cleanup does not authorize deleting previously executed application migrations or seeds, even when they originally came from the template. Preserve their original package owner, paths, contents, and history; do not reset checksums, drop tables, or repoint history to another template. For directory or connection changes, follow [existing application migration rules](../../nocobase-app-development/references/migrations.md#existing-applications) and verify the original sources remain available in the deployment.

Unregistering a plugin leaves its records and migration history intact. Do not roll back a retired plugin's migrations after removing its sources; an intentional rollback requires restoring the original plugin version first.

## Documentation and generated directories

`AGENTS.md`, `CLAUDE.md`, and `README.MD` ship with the template and may contain user additions. Take the template's version where the user wrote nothing and merge where they did.

Older template releases also shipped a committed `skills/` directory. A target release that moves those Skills into `@nocobase/app-skills` does not authorize deleting local changes. Compare each legacy file with the BASE template: an unchanged template copy may be removed only after install and `pnpm nocobase skills sync` produce the corresponding package-owned Skill under `.agents/skills/`; a modified or added file is application-owned and must be preserved. Keep a customized legacy directory with explicit links from `AGENTS.md`, or move its rules into `AGENTS.md` or another committed application-owned source after showing the user the exact relocation. Never silently fold custom content into a generated copy.

Older releases may include `MIGRATION.md`. Treat it as historical context and verify each suggestion against BASE → TARGET and the project's state; never remove a capability that TARGET still provides solely because an old note says to. When TARGET removes the document, delete an unchanged template copy, but preserve or relocate the user's own operational notes before removing a customized copy.

`.mcp.json`, `.cursor/mcp.json` and `.vscode/mcp.json` ship with the template and configure the shadcn MCP server for Claude Code, Cursor and VS Code. The user may have added servers of their own, or created one of these files before the template shipped it. Merge them as JSON objects, never by overwriting: take the template's entry under `mcpServers` (`servers` in `.vscode/mcp.json`) where the user's entry by that name is unchanged or missing, keep every other server and setting the user has, and ask before replacing a `shadcn` entry they changed.

`.agents/skills/` is generated and gitignored. `pnpm nocobase skills sync` replaces each synchronized package-owned Skill directory wholesale, so never merge into or edit it. Local custom guidance belongs in committed application-owned files outside this generated directory.

`config.yml`, optional generated `.env`, `.gitignore`, `.npmrc`, and `pnpm-workspace.yaml` were written by the generator or by `pnpm nocobase config init` and appear in no diff at all.

### Hand-written Collection metadata moved out of `collections/`

A release whose `nocobase-db` Skill documents `database/<connection>/metadata/` keeps an external connection's hand-written metadata there, one `<name>.json` per Collection holding only the metadata document, and treats `database/<connection>/collections/` as a gitignored cache for every connection. An application upgraded from an earlier release still has its metadata at `database/<connection>/collections/<name>/metadata.json`, and startup then fails with an error naming that layout; nothing is read from it silently. For each external connection, and for any `metadataStore` string that pointed into a `collections/` directory:

1. Create `database/<connection>/metadata/` and write each Collection's `"document"` value from `collections/<name>/metadata.json` to `metadata/<name>.json`. Skip a file whose `"document"` is `null`: it held no metadata.
2. Point a `metadataStore` string at the new directory, such as `database/shared-crm/metadata` instead of `database/shared-crm/collections`.
3. Delete the old `database/<connection>/collections/` directory, commit the `metadata/` files, and run `pnpm nocobase collections generate --all` to rebuild the cache.
4. Replace the `/database/<name>/collections/` lines in `.gitignore`, which no diff shows, with the single `/database/*/collections/`.

An application without an external connection only needs step 4.

### Browser tests moved from `e2e/` to `tests/playwright/`

A release whose Default or Examples template has `testDir: './tests/playwright'` in `playwright.config.ts` keeps Playwright tests in `tests/playwright/`; earlier releases kept them in `e2e/`. Move the application's own files from `e2e/` to `tests/playwright/` with `git mv`, then take the template's `playwright.config.ts`, add `exclude: ['tests/playwright/**']` to the `test` section of `vitest.config.ts` so Vitest does not run them, and replace `e2e/**/*.ts` with `tests/playwright/**/*.ts` in `tsconfig.node.json`. Update any `globalSetup` path or script that names `e2e/`. Earlier templates shipped no tests in `e2e/`, so everything there belongs to the application. Run `pnpm exec vitest run` and `pnpm test:e2e` afterward to confirm each runner picks up only its own files.

## Where the user's code lives

```text
Rarely touched by the template — a change landing here deserves a careful read
  client/pages/  client/components/  client/locales/  client/routes.ts
  server/routes/  server/providers/  database/  cli/commands/  tests/

Template structure — where most of the delta lands
  client/routing/  client/layouts/  client/theme/
  client/app.ts  client/runtime.ts  client/startup.tsx  server/*.ts
  vite.config.ts  vitest.config.ts  eslint.config.js
  tsconfig*.json  index.html  components.json

Both sides edit these — the hardest decisions
  client/plugins.ts  server/plugins.ts  cli/plugins.ts
  package.json  config.example.yml  optional .env.example  AGENTS.md  CLAUDE.md
  .mcp.json  .cursor/mcp.json  .vscode/mcp.json

Legacy application-owned guidance, when present
  skills/
```

## Shared application scripts and commands

An application from before `@nocobase/app-cli` took over the whole command line depends on `@nocobase/nb3-cli` and, usually, `@nocobase/app-tools`. Neither is published any more, so the upgrade has to move to the new layout in one step; there is no compatibility period.

1. In `package.json`, remove `@nocobase/nb3-cli` and `@nocobase/app-tools`, keep `@nocobase/app-cli` in `dependencies` at the target template's range, and add the development tools it expects the application to provide to `devDependencies` — `typescript`, `tsx`, `vite`, `prettier`, `tar`, `@refinedev/cli`, `tsc-alias` and `@nocobase/dev-config`, taking the target template's ranges.
2. Replace `scripts` with the target template's: `postinstall`, `dev`, `build` and `start` run `nocobase …`, and the quality scripts stay. Delete the command aliases (`config:*`, `db:*`, `migrate`, `seed`, `collections:generate`, `plugin:*`, `package:remove`, `skills:sync`, `upload`, `deploy`, `server:deps:*`, `nocobase`); each is now `pnpm nocobase <topic> <command>`. Keep scripts the user added that are not aliases, and ask before dropping one they redefined.
3. If the application publishes to a Hub (it had `upload` and `deploy`), add `@nocobase/hub-cli` to `devDependencies` at the target template's range. The commands are now `hub upload` and `hub deploy`; see [Hub publishing commands](#hub-publishing-commands).
4. Delete `scripts/dev.mjs`, `scripts/build.mjs`, `scripts/start.mjs` and `scripts/server-deps.mjs`, and `cli/index.ts`. Compare any locally modified script first and move application-specific behavior into a plugin build or dev hook.
5. Delete `cli/commands/index.ts`, `cli/standard-commands.ts` and any `cli/database-command.ts`, `cli/hub-publishing.ts` or `cli/commands/i18n-check.ts` forwarding files. Keep every command file the application wrote under `cli/commands/`: it is now registered by its path, so `cli/commands/sync-orders.ts` answers to `nocobase app sync-orders`. Its name comes from the file, not from the key it had in the old `cli/commands/index.ts`, so rename a file whose key differed; a file must default-export its command class.
6. In `cli/plugins.ts` and `vite.config.ts`, import from `@nocobase/app-cli` and `@nocobase/app-cli/dev/proxy`.
7. Remove `scripts/*.ts` from `tsconfig.node.json`'s `include` and `scripts` from `files`, as the target template does.
8. Replace every `app` command id in the application's own documentation, CI and scripts: `nocobase app db apply` is `nocobase db apply`, `app db doctor` is `collections doctor`, `app i18n:check` is `locales check`, `app upload` is `hub upload`, or `hub deploy` when it also deployed, `app deploy` is `hub deploy --release-id`, `plugin skills sync` is `skills sync`, `server:deps:retarget` and `server:deps:verify` are `dist retarget` and `dist check`, and `plugin cli-hooks` is gone because plugins declare `buildHooks` and `devHooks` in `defineCliPlugin`, which `nocobase build` and `nocobase dev` read themselves. A plugin topic follows its package name, so the scheduler's `schedule sync` is `scheduler sync` and the CLI example's `demo` topic is `cli-example`.
9. Update deployment runbooks. A `dist/` built by the earlier release had `migrate`, `seed`, `config:init`, `config:check`, `config:set` and `config:env` scripts in its `dist/package.json`; a new build writes only `start` and `nocobase`. Inside `dist/`, run `pnpm nocobase db apply` where a runbook ran `pnpm migrate` or `pnpm seed`, and `pnpm nocobase config init` (or `check`, `set`, `env`) where it ran `pnpm config:*`; from anywhere else, `node dist/cli/index.js db apply` and `node dist/cli/index.js config …` do the same.
10. Update whatever reads `--json`. Every command now prints one envelope, `{ schemaVersion, ok, command, status, result | error, warnings }`: fields a command used to print at the top level are under `result`, a failure's code, suggestions and data are under `error`, `operation` is replaced by `command` (`hub upload`, not `hub:upload`), and `status` is one of `success`, `success-noop`, `partial-success` and `failure` — `config init`'s `unchanged` is `success-noop`, `config check`'s `passed` is `success`, and a failed `config check` carries its findings in `error.details.findings`. Every `--dry-run`, and a `db` command that found nothing to do, answers `success-noop`. `hub upload` and `hub deploy` report a bad argument as `INVALID_USAGE`, where the earlier commands reported `INVALID_ARGUMENTS`, and a usage error's message names flags but no longer repeats what was typed. Change CI steps and scripts in the same upgrade; keep the exit-code checks, which are unchanged.
11. The application's own commands keep working as oclif `Command` subclasses, but only an `AppCommand` gets the envelope, `withApp()` and `appPath()`. Convert each one: extend `AppCommand` from `@nocobase/app-cli`, delete its hand-written `json` flag and `if (flags.json)` branches, return the result from `run()`, and throw `CommandError` instead of printing an error and calling `exit()`. The application's `nocobase-app-development` Skill describes the contract; ask before converting a command whose output something else parses.

Run `pnpm install`, then `pnpm nocobase --help`, `pnpm build`, and `node dist/cli/index.js --help` to confirm the source and deployment command sets.

## Notifications and the application toaster

Plugin pages report results through `useToaster()` from `@nocobase/app-client`: the Users, Workflow and AI employee pages and every Hub page. `@nocobase/app-client` renders nothing itself. The application registers a toaster service under `toasterToken` and mounts the `Toaster` component that renders what it forwards; the template does both, in `client/service-provider.ts` and `client/react-providers.ts`. An application missing either half shows no toasts. Nothing throws: without the registration every toast is logged to the browser console instead, and without the mounted `Toaster` nothing says so. A page that reports an error only through a toast, such as Hub's API Keys page opened without the permission, then shows no explanation at all.

Make these changes together, before the [Finish step](../SKILL.md#8-finish) installs dependencies:

1. Take `client/lib/toaster.ts` from the target template, and the `register()` in its `client/service-provider.ts` that binds it: `this.app.container.instance(toasterToken, createToaster())`. An application that customized `client/service-provider.ts` adds the method to its own version. Register the toaster there only; a second registration stops startup with `Service "@nocobase/app-client/toaster" is already registered`.
2. In `client/react-providers.ts`, keep the target's `toaster` entry: `{ component: Toaster, layer: 'application', name: 'toaster' }` with `import { Toaster } from '@/components/ui/toast'`. An application that customized this file has to add the entry to its own version; the template diff shows it as an ordinary addition, not as the requirement it is. Take `client/components/ui/toast.tsx` from the target template when the application does not have it, and keep the target's `[data-slot='toast-viewport']` rule at the end of `client/styles.css`; without it, toasts raised while a dialog is open appear dimmed and blurred under its overlay. Keep that one `Toaster` as the only one: a page that mounts another shows every toast twice, because both listen to the same manager.
3. An application that still registers `@nocobase/app-plugin-notification-provider` removes it with `pnpm nocobase package remove @nocobase/app-plugin-notification-provider`, which drops the dependency and its `client/plugins.ts` entry together.
4. In `package.json`, take the target's ranges for `@nocobase/app-client` and the four plugins together: a plugin that reports through `useToaster()` needs the `@nocobase/app-client` that exports it. `pnpm nocobase plugin update` alone does not do this. These plugin versions stay inside the `^1.0.0-beta` ranges the application already declares, so it installs them, but it updates only registered plugins and leaves `@nocobase/app-client` where it is: their pages then fail to load because `@nocobase/app-client` does not export `useToaster`. Update `@nocobase/app-client` in the same step, and only after steps 1 and 2.
5. Rewrite application code that shows toasts to call `const toaster = useToaster()` and `toaster.show(...)`. `toast.add({ ... })` from `@/components/ui/toast` keeps its `type`, `title` and `description`; `timeout` becomes `duration`, `actionProps` becomes `action: { label, onClick }`, and `priority` goes, because `client/lib/toaster.ts` decides it. `toast.success(message)`, `toast.error(message)` and `toast.info(message)` imported from `sonner` become `toaster.show({ type: 'success', title: message })` and its `error` and `info` counterparts, and calls to Refine's `useNotification()` move to `useToaster()` too. When `grep -rn "from 'sonner'\|useNotification" client/` finds nothing, remove `sonner` from `package.json`.
6. A test that stands in for the application with a hand-written `services` object, as the template's `tests/logic/client-shell.test.tsx` does, gives it `has` alongside `resolve`. `useToaster()` asks whether a toaster is registered before resolving one, so a stub without `has` fails every page that shows the account menu with `services.has is not a function`.

After the Finish step, run `pnpm typecheck` and `pnpm build`, then show one toast from the application and one from a plugin: sign out while the server is stopped for the account menu's error toast, and delete a user on the Users page, or in a Hub application copy an API key. A toast that does not appear means step 1 did not land when the console logs `Toast not shown: the application registers no toaster`, and step 2 when it does not; one that appears twice means a second `Toaster` is mounted. An upgrade done by hand, outside this Skill, needs the same six steps.

## Client runtime configuration and relocatable builds

The release that removes `@nocobase/app-portal-sdk` also changes how the client finds its mount path. The server renders the client configuration into `index.html` as `<script id="nocobase-runtime-config" type="application/json">`, and the client reads `app.basePath`, `api.baseURL` and the public configuration from it; nothing is put on `window`, and Vite injects no environment values. A build uses a relative asset base, so one `dist/` runs at whatever `APP_BASE_PATH` the server starts with. An application that keeps the earlier template files fails at build time on imports that no longer exist, or at run time with `The page carries no app.basePath in its client configuration`.

Make these changes together, before the [Finish step](../SKILL.md#8-finish) installs dependencies:

1. Remove the package with `pnpm nocobase package remove @nocobase/app-portal-sdk`. Then `grep -rn "app-portal-sdk\|getPortalBase\|assetUrl\|__PORTAL_\|window\.__nocobase\|import\.meta\.env\." client/ tests/` lists what still depends on the old runtime: the mount path comes from `useClientApplication().config.get('app.basePath')`, API requests go through `useApiClient()`, the application name and version from `config.public.get('app.displayName')` and `'app.version'`, and a static asset from a plain relative import or `import.meta.url`. `import.meta.env.PROD`, `DEV` and `MODE` stay; any other `import.meta.env` read is now a lint error.
2. Take the target's `vite.config.ts`: it calls `createAppViteConfig` from `@nocobase/dev-config/vite/app` and adds `createDevClientConfigPlugin` from `@nocobase/app-cli/dev/proxy`, and it has no `base`, `define` or `envPrefix`. Carry the application's own aliases and plugins across; do not reintroduce a `base` or a `define` for a runtime value.
3. In `eslint.config.js`, `createPortalConfig` is `createApplicationConfig`. In `client/runtime.ts`, drop `basename` from `defineAppRuntime`; the runtime reads it from the page. `client/lib/utils.ts` keeps only `cn`, and `client/vite-env.d.ts` loses the `__PORTAL_*` declarations.
4. In `server/config/spa.ts`, remove the `runtime` block (`storagePrefix`, `storageType`, `shareToken`); `SpaConfig` no longer has it.
5. Take the target's `tests/setup/client-config.ts` and its `setupFiles` entry in `vitest.config.ts`. A client test that renders without a configuration block in the page now throws, so a test with its own expectations about the mount path renders one itself, as the target's `client-theme.test.tsx` does.
6. Take the target's `Dockerfile`. `APP_BASE_PATH` is no longer a build argument; the image defaults to `/main`, and `docker run -e APP_BASE_PATH=<path>` mounts it elsewhere. Remove `--build-arg APP_BASE_PATH` and `APP_BASE_PATH=… pnpm build` from the application's own CI and deployment scripts, and pass the path where the server runs instead: `app.env` or `--base-path` for app-installer, the container environment for Docker. A Hub mounts each application at `/<appId>` whatever it was built for.

After the Finish step, run `pnpm typecheck`, `pnpm test` and `pnpm build`, then `pnpm dev` and open a deep route directly and a page that loads its own styles. A build made before this release is tied to the path it was built for, so rebuild before deploying: app-installer and Hub refuse such an archive at another path with `BASE_PATH_MISMATCH`. An upgrade done by hand, outside this Skill, needs the same six steps.

## Components the templates stopped shipping

The release that stops shipping `DataTable` and `DatePicker` shows their files as `Only in BASE`: `client/components/data-table.tsx` with `data-table-column-header.tsx`, `data-table-pagination.tsx` and `data-table-view-options.tsx`, and `client/components/date-picker.tsx`. The `calendar` primitive goes with them, as do `select` and `table` in Default and Hub, and `@tanstack/react-table`, `date-fns` and `react-day-picker` leave `devDependencies`; Hub keeps `react-day-picker`, which `@nocobase/app-plugin-hub` requires as a peer. Nothing replaced them in the template: a `DatePicker` or `DataTable` the application uses stays its own code, and a new one is composed from the `calendar` and `popover` or `table` primitives.

1. Search the application for imports of each file and primitive and of each package before removing any of them, as [step 5](../SKILL.md#5-check-what-the-diff-cannot-show) describes. A file something still imports stays as application-owned code, together with the primitives and packages it needs; nothing about it has to change. Remove only what nothing imports.
2. Keep the `dataTable` and `datePicker` keys in the locale files; the target template keeps them.

## Hub publishing commands

The Hub commands come from depending on `@nocobase/hub-cli`. It reads the target App from a remote committed in `.nocobase/hub.json` and the API key from the user's credentials file, never from `HUB_URL`, `HUB_APP_ID`, `HUB_API_KEY` or the `--hub`, `--app-id` and `--api-key` flags, and `hub deploy` builds the archive itself. An application from before `@nocobase/hub-cli` has `release upload` and `release deploy` from `@nocobase/app-cli` instead, registered by the `nocobase.cli.publishing` flag; `pnpm nocobase release …` now fails as an unknown command. An application with neither the flag nor the dependency did not publish to a Hub and needs none of these steps.

1. If `package.json` sets `"nocobase": { "cli": { "publishing": true } }`, remove the flag and add `@nocobase/hub-cli` to `devDependencies` at the target template's range.
2. Rewrite the commands in CI, scripts and the application's own documentation: `release upload --deploy` is `hub deploy`, `release deploy --release-id <id>` is `hub deploy --release-id <id>`, and `release upload` without `--deploy` is `hub upload`. `hub upload` takes no `--deploy`, `--wait` or `--config`, and `hub deploy` refuses `--file` together with `--release-id`. Drop `--hub`, `--app-id` and `--api-key`, and the `pnpm build --tar` step before a Hub command: `hub deploy` and `hub upload` build for the platform the Hub reports. A script that has to send an archive built elsewhere passes `--no-build` or `--file`, and the archive is checked against the Hub's platform.
3. For each Hub App the application publishes to, run `pnpm nocobase hub remote add <name> <HUB_URL>/apps/<HUB_APP_ID>` and commit `.nocobase/hub.json`; the first remote is the default. Remove the `HUB_*` variables from `.env` and any example environment file. Ask the user to run `pnpm nocobase hub auth login` for each remote themselves rather than logging in with the old `HUB_API_KEY` value. In CI, keep the key as a secret and pipe it in before deploying: `echo "$HUB_KEY" | pnpm nocobase hub auth login --remote <name> --with-token`, then `pnpm nocobase hub deploy --remote <name>`.
4. Update whatever reads `--json`: `command` is `hub deploy` or `hub upload`, a failure that is not the Hub's own is `DEPLOY_FAILED` or `UPLOAD_FAILED`, where `release upload` reported `PUBLISH_FAILED`, and a missing remote or key is `NO_REMOTE` or `NOT_LOGGED_IN`. Deploying an archive the Hub already has deploys its Release instead of failing with `NO_DEPLOYMENT`. The exit codes keep their meaning; `1` also covers a failed build.

After the Finish step, `pnpm nocobase hub --help` lists the `remote`, `auth`, `deploy` and `upload` commands, `pnpm nocobase hub auth status` reports each remote's key, and `.agents/skills/nocobase-hub-cli/` holds the Skill the package ships. An upgrade done by hand, outside this Skill, needs the same four steps.
