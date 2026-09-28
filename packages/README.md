# Packages

Every package published from this repository lives here, grouped by what it is rather than by what it is named. The grouping is a convention for readers; pnpm resolves packages by name, so moving a package between these directories changes nothing about how it is depended on or filtered.

| Directory    | What belongs here                                                                     |
| ------------ | ------------------------------------------------------------------------------------- |
| `libs/`      | Runtime libraries that solve one problem and know nothing about NocoBase applications |
| `app/`       | The application runtime itself — what an application is built out of                  |
| `plugins/`   | Application plugins that ship as product features                                     |
| `examples/`  | Application plugins that exist to demonstrate a capability                            |
| `templates/` | Complete applications that `create-app` scaffolds from                                |
| `tools/`     | Development and build tooling, not shipped inside an application                      |

## `libs/`

Standalone libraries. Each solves one problem — storage, caching, queuing, logging — and depends on nothing above it. A library here should be usable outside NocoBase without pulling in an application runtime.

`caching` wraps a cache store behind a small interface. `i18n` (`@nocobase/i18n`) provides the translation mechanism: namespaces, resource loading, and the React and Node bindings, with no routes and no notion of a user.

## `app/`

The runtime an application is assembled from. `app-server` composes configuration, plugins, and providers into a running server; `app-skills` publishes the shared agent guidance synchronized into generated applications. `app-cli` is the application's command line — the runtime commands a deployment runs, plugin management, and the `dev` and `build` tooling, which it keeps out of a deployment as optional peers.

These packages know what a NocoBase application is, which is what separates them from `libs/`.

## `plugins/`

Plugins that contribute real product functionality: a feature is enabled by installing one. `app-plugin-file` provides file Repository services, route factories, and editable Registry UI; `app-plugin-authentication` adds sign-in.

Create one with `pnpm plugin:create`, which scaffolds it here.

## `examples/`

Plugins whose purpose is to show how something works. `app-plugin-routes-example` demonstrates server routes alongside lazily loaded client routes.

They are published and installable like any other plugin — the difference is intent, not packaging. An example is written to be read.

## `templates/`

Complete, runnable applications. `create-app` downloads one and scaffolds a project from it, so a template is published as its own source rather than as a built library.

`app-template-default` is what `pnpm create @nocobase/app` produces. `app-template-hub` is the application hub. `app-template-examples` combines application-owned article management with installable capability examples and demonstration data.

For everyday development and exploring examples in this repository, run `pnpm examples:dev` from the repository root. Each template has explicit root commands:

| Template | Development         | Build                 | Start the built application |
| -------- | ------------------- | --------------------- | --------------------------- |
| Examples | `pnpm examples:dev` | `pnpm examples:build` | `pnpm examples:start`       |
| Default  | `pnpm default:dev`  | `pnpm default:build`  | `pnpm default:start`        |
| Hub      | `pnpm hub:dev`      | `pnpm hub:build`      | `pnpm hub:start`            |

Inside a template's own directory, use `pnpm dev`, `pnpm build`, and `pnpm start`.

## `tools/`

Everything used to develop and build the packages above, none of which ends up in a deployed application's `dist/`. `dev-config` holds the shared TypeScript, ESLint, Prettier, Vitest, and Vite presets that every other package extends; it is also a development dependency of every template, so a generated application installs it for its own configuration and for `nocobase build`, which loads it as an optional peer of `app-cli`. `create-app` is the scaffolder that turns a template into a project. `hub-cli` is a development dependency of the Default template that gives it `nocobase hub deploy` and `hub upload`, by naming a CLI entry the application's command line finds among its dependencies.

## Adding a package

Pick the directory by the questions above, then follow the conventions in the repository root `AGENTS.md`: extend a preset from `@nocobase/dev-config` instead of copying a configuration, start at version `0.0.1` with `publishConfig.access` set to `"public"`, declare `files`, and put tests in a `tests/` directory at the package root.
