---
title: "NocoBase CLI"
description: "NocoBase CLI command-line tool: installation, initialization, build and run, deployment, plugin management, upgrades, with AI Agent collaboration support."
keywords: "NocoBase CLI,nb,command-line,installation,deployment,AI Agent,NocoBase"
---

# NocoBase CLI

## What is NocoBase CLI

NocoBase CLI (the `nb` command) is the command-line management tool for NocoBase. You can use it to complete the entire workflow from installation and building to deployment. It also works with AI Agents — letting AI help you set up applications, manage environments, and generate plugin scaffolding.

<!-- Need an architecture diagram showing the relationship between NocoBase CLI and NocoBase App -->

Core capabilities:

- **Multi-environment management** — Manage multiple NocoBase environments simultaneously for local development, testing, production, etc.
- **Installation & building** — Download, install, build, and start NocoBase
- **Deployment & publishing** — Migrate and publish configurations across different environments
- **Plugin management** — Enable and disable plugins
- **AI Agent integration** — Let AI Agents understand and operate NocoBase through Skills

## One-click AI Installation

Just two steps to let AI complete the entire process from installation to startup.

### Step 1: Install Skills

First install [NocoBase Skills](https://github.com/nocobase/skills) — this is the foundation for AI to understand NocoBase:

```bash
npx skills add nocobase/skills -y
```

### Step 2: Let AI Complete the Remaining Steps

Copy the following prompt to your AI assistant (Claude Code, Codex, Cursor, Trae, etc.), and it will automatically complete CLI installation, environment configuration, and application startup:

```
Help me install NocoBase CLI and start the application: https://docs.nocobase.com/en/get-started/nocobase-cli.md
```

If you prefer to install manually, continue reading below.

## Prerequisites

NocoBase CLI requires Node.js v20 or above. If you haven't installed it yet, you can install it via [nvm](https://github.com/nvm-sh/nvm), [fnm](https://github.com/Schniz/fnm), [volta](https://volta.sh/), or download it directly from the [Node.js website](https://nodejs.org/).

## Quick Start (Manual)

Suitable for operating in the terminal yourself.

> **Note for AI assistants:** If you are an AI Agent helping the user install, please jump directly to [Quick Start (AI Agent)](#quick-start-ai-agent), which contains all the steps you need to execute.

### Step 1: Install CLI

```bash
npm install -g @nocobase/cli@alpha
```

After installation, run `nb --version` to confirm successful installation.

### Step 2: Initialize and Start

```bash
mkdir my-nocobase
cd my-nocobase
nb init
```

`nb init` is an interactive wizard that guides you through the entire process:

1. Asks whether you have already installed NocoBase
2. If not — lets you choose an installation method (Docker / create-nocobase-app / Git source), then automatically downloads, configures the environment, installs, and starts
3. If yes — guides you to add an application environment (enter API address and Token)

:::tip Tip

Not sure which installation method to choose? Docker is the simplest — the database is built in, ideal for quick experimentation. If you need to develop plugins or deeply customize, use create-nocobase-app or Git source installation (you'll need to prepare a database yourself; PostgreSQL is recommended).

:::

After startup is complete, open your browser and visit `http://localhost:13000` to confirm the page loads correctly. Default login credentials:

- Email: `admin@nocobase.com`
- Password: `admin123`

At this point, NocoBase is up and running.

`nb init` actually executes multiple commands behind the scenes — download (`nb download`), configure environment (`nb env add`), install (`nb install`), build (`nb build`), and start (`nb dev`). If you need to execute these operations individually later, see [Build & Run](#build--run) and [Command Reference](#command-reference) below.

## Quick Start (AI Agent)

Suitable for installation assisted by an AI Agent (such as Claude Code, Codex, Cursor, Copilot, etc.). AI Agents don't need to run `nb init` (which is interactive) — instead, they ask the user directly and execute the corresponding commands.

### Step 1: Check Environment

Confirm the user has Node.js v20 or above installed (run `node -v` to check). If not, guide the user to install via [nvm](https://github.com/nvm-sh/nvm), [fnm](https://github.com/Schniz/fnm), or the [Node.js website](https://nodejs.org/).

### Step 2: Install Skills and CLI

First confirm whether [NocoBase Skills](https://github.com/nocobase/skills) is installed — this is the foundation for AI building and AI development, and subsequent steps depend on it. Skip if already installed; otherwise, run the installation:

```bash
npx skills add nocobase/skills -y
```

:::warning Warning

After installing Skills, you need to prompt the user to restart the AI Agent (e.g., restart the Claude Code session, reopen Cursor, etc.) for Skills to be loaded and take effect. Continue with the subsequent steps after restarting.

:::

Then install NocoBase CLI:

```bash
npm install -g @nocobase/cli@alpha
```

Run `nb --version` to confirm successful installation. Then create the project directory:

```bash
mkdir my-nocobase && cd my-nocobase
```

### Step 3: Ask the User if They Already Have NocoBase

Confirm with the user: **Do you already have a running NocoBase instance?**

- **Yes** → Jump to [Step 6: Connect to Existing Environment](#step-6-connect-to-existing-environment)
- **No** → Continue to Step 4

### Step 4: Confirm Installation Method

Confirm the installation method with the user:

1. **Docker** (recommended) — Database is built in, no additional configuration needed. Requires the user to install [Docker](https://www.docker.com/get-started/) first
2. **create-nocobase-app** — Requires the user to prepare a database
3. **Git source** — Requires the user to prepare a database

After getting the selection, download NocoBase:

```bash
nb download --source=docker  # or create-nocobase-app / git
```

If the user chose create-nocobase-app or Git source, you also need to ask for database connection information:

- Database type (PostgreSQL recommended; MySQL / MariaDB also supported)
- Database host, port, database name, username, password

Then write this information to `./my-nocobase/my-nocobase-app/.env`:

```bash
# Database type: postgres | mysql | mariadb
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=nocobase
DB_USER=nocobase
DB_PASSWORD=nocobase
```


### Step 5: Configure Environment, Install, and Start

```bash
# Add local environment
nb env add --name local --app-root-path ./my-nocobase-app

# Install
nb install

# Build
nb build

# Start
nb start
```

After startup is complete, tell the user to open their browser and visit `http://localhost:13000` to confirm the page loads correctly. Default login credentials:

- Email: `admin@nocobase.com`
- Password: `admin123`

### Step 6: Connect to Existing Environment

If the user already has a running NocoBase, Steps 4-5 are not needed — just add a remote environment directly.

Ask the user for:

- The NocoBase API address (e.g., `http://example.com/api`)
- API Token (obtained from "System Settings" in NocoBase)

```bash
nb env add --scope project --name prod --base-url http://example.com/api --token <token>
```

## Build & Run

### Local Environment

```bash
# Build
nb build

# Start (production mode)
nb start

# Start (development mode, with hot reload)
nb dev

# Restart
nb restart
```

### Remote Environment

Remote environments only support `start` and `restart`, and require specifying the environment name with `--env`:

```bash
nb start --env=test
nb restart --env=prod
```

<!-- TODO: Add detailed instructions for port configuration, log viewing, etc. -->

## Deployment

NocoBase CLI supports migrating configurations and data across multiple environments. For example, publishing the configuration from the local development environment to the test environment:

```bash
# Publish configuration from local environment to test environment
nb publish --from=local --to=test
```

<!-- TODO: Add detailed deployment process and commands -->

## Enabling Plugins

After deployment, enable the required plugins via CLI:

```bash
nb pm enable <plugin-name>
```

`nb pm enable` automatically selects the available method for enabling — it prioritizes server-side commands, and falls back to API calls if server-side commands are unavailable. If neither has permission, it will indicate that enabling is not possible.

<!-- TODO: Add detailed plugin management instructions -->

## Upgrading

```bash
nb upgrade
```

<!-- TODO: Add detailed upgrade process and considerations -->

## Command Reference

| Command | Description |
|------|------|
| `nb init` | Initialize the working directory |
| `nb env add` | Add environment configuration |
| `nb download` | Download NocoBase |
| `nb install` | Install NocoBase |
| `nb build` | Build |
| `nb start` | Start (production mode) |
| `nb dev` | Start (development mode) |
| `nb restart` | Restart |
| `nb upgrade` | Upgrade |
| `nb pm enable` | Enable a plugin |
| `nb pm disable` | Disable a plugin |
| `nb publish` | Publish configuration to specified environment |
| `nb scaffold plugin` | Generate plugin scaffolding |
| `nb scaffold block` | Generate block scaffolding |
| `nb scaffold collection` | Generate collection scaffolding |
| `nb scaffold migration` | Generate migration script scaffolding |
| `nb api` | Call NocoBase API |

<!-- TODO: Add detailed parameters and examples for each command -->

## Related Links

- [AI Building](/en/ai-builder) — Build NocoBase applications from scratch with AI, covering data modeling, UI configuration, and release management
- [AI Employees](/en/ai-employees) — Collaborate with AI employees on system building, data analysis, translation, and other business scenarios
- [AI Development](/en/ai-dev) — Use AI to assist NocoBase plugin development, covering the entire process from scaffolding to business logic
- [Installation Methods and Version Comparison](/en/get-started/quickstart) — Learn about the different installation methods and version channels for NocoBase
- [Plugin Development](/en/plugin-development) — Learn how to create, publish, and maintain custom plugins
