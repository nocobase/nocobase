# NocoBase CLI

NocoBase CLI (`nb`) is a command-line tool for setting up and managing NocoBase
apps in a local workspace. It helps you connect coding agents to NocoBase by
preparing the app, saving the CLI env config, and providing day-to-day commands
for start, stop, logs, upgrade, and cleanup.

The CLI supports two common setup paths:

- Connect an existing NocoBase app so coding agents can use it.
- Install a new NocoBase app from Docker, npm, or Git, then connect it as a CLI env.

## Prerequisites

- Node.js v20+
- Yarn 1.x
- Git, required when installing from Git source
- Docker, required when installing with Docker or using the built-in database

## Installation

Install the CLI globally:

```bash
npm install -g @nocobase/cli@alpha
```

Check the available commands:

```bash
nb --help
nb init --help
```

## Core Concepts

- **Workspace**: the current project folder where `.nocobase` is stored.
- **Env**: a named NocoBase connection saved by the CLI. In `nb init`, the app name is also the env name.
- **Source**: how the local app is obtained. Supported values are `docker`, `npm`, and `git`.
- **Remote env**: an env that only stores an API connection to an existing NocoBase app.
- **Runtime resources**: local app process, Docker app container, built-in database container, source directory, and storage directory managed by CLI commands.

## Quick Start

### Guided Setup

Run the guided terminal flow:

```bash
nb init
```

Use the browser-based setup form:

```bash
nb init --ui
```

`nb init` can either connect to an existing NocoBase app or install a new one.
When creating a new app, it can also install NocoBase AI coding skills
(`nocobase/skills`) globally.

### Non-Interactive Setup

When prompts are skipped, an app/env name is required:

```bash
nb init --env app1 --yes
```

Install with Docker:

```bash
nb init --env app1 --yes --source docker --version alpha
```

Install from npm:

```bash
nb init --env app1 --yes --source npm --version alpha --app-port 13080
```

Install from Git source:

```bash
nb init --env app1 --yes --source git --version alpha
```

For Git source installs, `--version alpha` resolves to the `develop` branch.

Install from a Git branch:

```bash
nb init --env app1 --yes --source git --version fix/cli-v2
```

`--version` is the shared version input across sources:

- npm: package version
- Docker: image tag
- Git: git ref such as a branch or tag

By default, a new local app uses:

- Source directory: `./<envName>/source/`
- Storage directory: `./<envName>/storage/`

### Resume an Interrupted Setup

If `nb init` was interrupted after the env config had already been saved, you can continue the same setup:

```bash
nb init --env app1 --resume
```

`--resume` reuses the saved workspace env config for app, source, database, and env connection settings. In interactive mode, it only asks for any missing setup-only values.

In non-interactive resume mode, `nb init --resume --yes` uses default initialization values unless these flags are passed explicitly:

- `--lang`
- `--root-username`
- `--root-email`
- `--root-password`
- `--root-nickname`

## Daily Commands

| Command | Description |
| --- | --- |
| `nb init` | Set up NocoBase and connect it as a CLI env for coding agents. |
| `nb app` | Manage app runtimes: start, stop, restart, logs, cleanup, and upgrades. |
| `nb source` | Manage the local source project: download, develop, build, and test. |
| `nb db` | Inspect or manage built-in database runtime status for local envs. |
| `nb env` | Manage saved CLI env connections. |
| `nb api` | Call NocoBase API resources from the CLI. |
| `nb plugin` | Manage plugins for the selected NocoBase env. |
| `nb self` | Check or update the installed NocoBase CLI. |
| `nb skills` | Check, install, or update global NocoBase AI coding skills. |

Recommended style: pass the env name explicitly when operating on a specific env. Runtime commands accept `--env`, and `nb env info` also accepts a positional env name:

```bash
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb env info app1
nb db ps --env app1
```

Equivalent shorthand examples:

```bash
nb app start -e app1
nb app restart -e app1
nb app logs -e app1
nb app upgrade -e app1
nb db start -e app1
```

## CLI And Skills Updates

Check whether the installed CLI itself is up to date:

```bash
nb self check
nb self check --json
```

Update the CLI when it is installed globally with npm:

```bash
nb self update
```

Check whether the global NocoBase AI coding skills are installed:

```bash
nb skills check
nb skills check --json
```

Install the skills for the first time, or update an existing `nocobase/skills` install:

```bash
nb skills install
nb skills update
```

## Runtime Types

### Docker

Docker envs are managed through saved Docker containers and images:

```bash
nb init --env app1 --yes --source docker --version alpha
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app stop --env app1
```

Docker downloads support platform selection:

```bash
nb source download --source docker --version alpha --docker-platform auto
nb source download --source docker --version alpha --docker-platform linux/amd64
nb source download --source docker --version alpha --docker-platform linux/arm64
```

### npm and Git

npm and Git envs use a local source directory and can run development mode:

```bash
nb init --env app1 --yes --source git --version alpha
nb source dev --env app1
```

`nb source dev` only supports npm/Git source envs. Docker envs can be inspected with
`nb app logs`, and remote envs only support API/env operations.

### Existing NocoBase App

To connect an existing app, use `nb init` and choose the existing-app setup
path, or add the env directly:

```bash
nb env add app1 --api-base-url http://localhost:13000/api
```

`nb env add` will start the authentication flow automatically when needed.

## Upgrade

Upgrade refreshes the saved source or image, then restarts the app:

```bash
nb app upgrade --env app1
```

Use `--skip-code-update` or `-s` to restart with the saved local code or Docker
image without downloading updates first:

```bash
nb app upgrade --env app1 -s
```

## Database Commands

Use `nb db` to inspect or manage the built-in database runtime for a local env:

```bash
nb db ps
nb db ps --env app1
nb db start --env app1
nb db stop --env app1
nb db logs --env app1
```

Notes:

- `nb db start` and `nb db stop` only work for envs created with the built-in database option enabled.
- `nb db logs` only works for envs created with the built-in database option enabled.
- `nb db ps` can also show `external` or `remote` status for envs that do not have a CLI-managed database container.

## Cleanup

Bring down a local env:

```bash
nb app down --env app1
```

By default, `nb app down` stops the app and removes app/database containers if they
exist. For local envs, it also deletes the saved local app files. It keeps storage data and CLI env config.

Use explicit flags for destructive cleanup:

```bash
nb app down --env app1 --all --yes
```

- `--all`: delete everything for the env, including storage data and the saved env config. This requires `--yes`.

## Environment Management

Show the current env:

```bash
nb env
```

List configured envs with token-verified API status:

```bash
nb env list
```

Show details for one env:

```bash
nb env info app1
```

Switch the current env:

```bash
nb env use app1
```

Re-authenticate an env when credentials need to be refreshed:

```bash
nb env auth app1
```

Update runtime command metadata from the selected app:

```bash
nb env update app1
```

## API Commands

The CLI can call NocoBase resources through the configured env:

```bash
nb api resource list --resource users -e app1
nb api resource get --resource users --filter-by-tk 1 -e app1
nb api resource create --resource users --values '{"nickname":"Ada"}' -e app1
```

Use `-j, --json-output` to print raw JSON when available:

```bash
nb api resource list --resource users -e app1 -j
```

Available API command topics:

| Command | Description |
| --- | --- |
| `nb api acl` | Manage access control based on roles, resources, and actions. |
| `nb api api-keys` | Manage API keys for HTTP API access. |
| `nb api app` | Manage application resources. |
| `nb api authenticators` | Manage user authentication, including password auth, SMS auth, SSO protocols, and extensible providers. |
| `nb api data-modeling` | Manage data sources, collections, and database modeling resources. |
| `nb api file-manager` | Manage file storage services, file collections, and attachment fields. |
| `nb api flow-surfaces` | Compose and mutate page, tab, block, field, and action surfaces. |
| `nb api pm` | Manage plugins through API commands. |
| `nb api resource` | Work with generic collection resources. |
| `nb api system-settings` | Adjust system title, logo, language, and other global settings. |
| `nb api theme-editor` | Customize UI colors and dimensions, save themes, and switch between them. |
| `nb api workflow` | Manage workflow resources for business automation. |

## Local Data

The CLI stores workspace-level config in `.nocobase`:

- `config.json`: env definitions, current env, and workspace-level settings.
- `versions/<version>/commands.json`: cached runtime commands generated from the target app.

Runtime data such as source files, storage files, Docker containers, and
database data are managed separately according to the env source and install
options.
