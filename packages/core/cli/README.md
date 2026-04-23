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
(`nocobase/skills`) for the current workspace.

### Non-Interactive Setup

When prompts are skipped, `--env <envName>` is required:

```bash
nb init --yes --env app1
```

Install with Docker:

```bash
nb init --yes --env app1 --source docker --version alpha
```

Install from npm:

```bash
nb init --yes --env app1 --source npm --version alpha --app-port 13080
```

Install from Git source:

```bash
nb init --yes --env app1 --source git --version alpha
```

By default, a new local app uses:

- Source directory: `./<envName>/source/`
- Storage directory: `./<envName>/storage/`

## Daily Commands

| Command | Description |
| --- | --- |
| `nb init` | Set up NocoBase and connect it as a CLI env for coding agents. |
| `nb install` | Advanced command used by `nb init` to install a local NocoBase app and save env config. In most cases, use `nb init` instead. |
| `nb download` | Advanced command used by `nb init` or `nb upgrade` to fetch NocoBase from Docker, npm, or Git. It is rarely used directly. |
| `nb start` | Start the selected local app or Docker container. |
| `nb stop` | Stop the selected local app or Docker container. |
| `nb dev` | Run development mode for npm/Git source envs. |
| `nb logs` | Show app logs for npm/Git or Docker envs. |
| `nb ps` | Show runtime status for configured envs. |
| `nb upgrade` | Refresh code/image and restart the selected app. |
| `nb down` | Stop and remove local runtime containers for an env. |
| `nb env` | Manage saved CLI env connections. |
| `nb api` | Call NocoBase API resources from the CLI. |
| `nb pm` | Manage plugins for the selected NocoBase env. |

Most app-management commands accept `-e, --env` to select an env:

```bash
nb start -e app1
nb logs -e app1
nb ps -e app1
```

Some commands also accept the env name as the first argument:

```bash
nb logs app1
nb ps app1
nb down app1
```

## Runtime Types

### Docker

Docker envs are managed through saved Docker containers and images:

```bash
nb init --yes --env app1 --source docker --version alpha
nb start -e app1
nb logs app1
nb stop -e app1
```

Docker downloads support platform selection:

```bash
nb download --source docker --version alpha --docker-platform auto
nb download --source docker --version alpha --docker-platform linux/amd64
nb download --source docker --version alpha --docker-platform linux/arm64
```

### npm and Git

npm and Git envs use a local source directory and can run development mode:

```bash
nb init --yes --env app1 --source git --version alpha
nb dev -e app1
```

`nb dev` only supports npm/Git source envs. Docker envs can be inspected with
`nb logs`, and remote envs only support API/env operations.

### Existing NocoBase App

To connect an existing app, use `nb init` and choose the existing-app setup
path, or add the env directly:

```bash
nb env add app1 --base-url http://localhost:13000/api
```

`nb env add` will start the authentication flow automatically when needed.

## Upgrade

Upgrade refreshes the saved source or image, then restarts the app:

```bash
nb upgrade -e app1
```

Use `--skip-code-update` or `-s` to restart with the saved local code or Docker
image without downloading updates first:

```bash
nb upgrade -e app1 -s
```

## Cleanup

Bring down a local env:

```bash
nb down app1
```

By default, `nb down` stops the app and removes app/database containers if they
exist. It keeps user data, source files, and CLI env config.

Use explicit flags for destructive cleanup:

```bash
nb down app1 --remove-data
nb down app1 --remove-source
nb down app1 --remove-env
```

- `--remove-data`: delete storage and managed database data. This requires confirmation unless `--yes` is used.
- `--remove-source`: delete the npm/Git source directory.
- `--remove-env`: remove the saved CLI env config.

## Environment Management

Show the current env:

```bash
nb env
```

List configured envs:

```bash
nb env list
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
