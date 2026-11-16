# Builds, logging, storage and demo systems

Operational detail the entry Skill points to. Read the section for the task in front of you.

## Builds

`pnpm build --help` (or `-h`) lists build options and exits without loading build dependencies, running hooks, or modifying `dist/`. Every successful build records `nocobase.buildTarget` in `dist/package.json`, including builds with no native modules: `platform`, `arch`, `libc`, `nodeMajor`, and `nodeAbi`. Use `libc` only for Linux; its value on other platforms is a compatibility placeholder. Deployment checks compare these fields with the host runtime and also respect `engines.node`. With `--target current` (the default), the Node version and ABI come from the running process; an explicit platform target defaults to Node 24 unless `--node-version` is supplied.

When building for another platform, pass `--target` and verify the native binaries retained in `dist/node_modules`. `better-sqlite3` 13 bundles N-API binaries for multiple platforms; Alpine targets need the `linuxmusl` binary, while other Linux targets use the `linux` binary.

## Logging

Use the application logging service for diagnostics so entries carry application identity and follow its level and output policy. Development pretty output uses local time and displays `[appId/logger]`; file and JSON console output retain UTC timestamps and structured context. Request starts and headers, configuration diagnostics and AI resource loading stages are DEBUG; request completions and AI resource totals are INFO. Default optional `ai/skills` directories may be absent; explicitly configured missing directories still warn.

Deployed releases carry their own runtime and logging packages: an old release keeps the formatter it was built with. Upgrade the application dependencies, rebuild and deploy a new release; never edit a deployed artifact or intercept process-wide stdout to rewrite its logs. Verify console enablement and pretty mode after upgrading.

Authentication diagnostics use the application `auth` logger unless an explicit authentication logger is configured. A missing Better Auth base URL is a configuration warning, not a logging error: configure `app.publicOrigin` with the externally reachable origin in the application deployment configuration. Do not substitute the internal Host bind address or suppress the warning to make startup appear clean.

## Storage

For file storage configuration and custom driver factories in `drive.disks`, read `.agents/skills/nocobase-drive/SKILL.md`, supplied by the installed `@nocobase/drive` package. Keep the application's shared Drive provider and token when adding a custom disk. [File storage](app-structure.md#file-storage) identifies the application configuration entry point.

Standalone source and compiled entries share the deployment directory's storage; `APP_STORAGE_DIR` selects another storage directory, and explicit storage paths take precedence over it. Embedded applications use Host-provided paths. Expanded releases live at `appRevisionsDir/<appId>/<sha256>` and restart recovery requires their installed metadata. Build archives use `storage/exports/dist.tar.gz`.

## Sample data and demo systems

A request to add example customers, orders or tasks normally means sample data in the existing application. Use `sample: true` seeds or `sampleDataToken`; see [sample data and demo systems](migrations.md#sample-data-and-demo-systems). Keep required initialization data in ordinary seeds. Do not infer an isolated demo deployment from the words "demo data" alone.

A dedicated demo system has its own database and storage, repeatable business-data generation, clearing and reset, visitor write policies and optional simulated external or Agent execution. For that requirement, follow the `nocobase-app-plugin-demo-mode` Skill. If `@nocobase/app-plugin-demo-mode` is not yet a dependency, ask before registering it with `pnpm nocobase plugin register demo-mode`, which also synchronizes its Skill. The plugin supplies the environment mechanisms; the application supplies its dataset, cleanup, management UI and any simulation adapters. If the intended scope is ambiguous, clarify it before adding full-business cleanup or changing the environment mode. A trial, staging or customer environment where users keep their data, a provider's sandbox credentials and an in-app presentation mode are not demo systems.

When the application already depends on `@nocobase/app-plugin-demo-mode`, a change that adds business collections, outbound integrations or background jobs also updates the demo dataset's cleanup and adapters; follow that Skill's maintenance section.

## Languages and startup defaults

After adding or removing a language in `client/locales/` or `server/locales/`, run `pnpm nocobase locales check`. It compares only the two language lists: it reports a language declared on one side alone and exits nonzero until the lists align. A client-only language is still supported at runtime and the server falls back to English; add matching server translations when server-produced text should use that language.

Application startup defaults belong in `config.yml`: `i18n.defaultLocale` for the language, and `client.app.defaultColorScheme` and `client.app.defaultTheme` for appearance. Valid browser-local choices take precedence. Which languages the interface offers is not configured — `client/locales/` is that list, while `server/locales/` independently defines the server's translated languages. See [internationalization](i18n.md), [frontend copy](frontend/references/i18n.md) and [themes and tokens](frontend/references/theme.md).
