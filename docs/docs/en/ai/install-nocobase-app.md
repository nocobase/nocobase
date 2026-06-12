---
title: Install NocoBase App
description: Install NocoBase CLI and quickly create a new NocoBase application with `nb init --ui`, so your AI Agent can start working right away.
---

# Install NocoBase App

## Prerequisites

- Node.js >= 22
- Yarn 1.x
- If you plan to install with Docker, make sure Docker is already running

## Step 1: Install CLI

Install NocoBase CLI globally first:

```bash
npm install -g @nocobase/cli
nb --version
```

If you often work with multiple terminals or want to operate in parallel with AI Agents, we also recommend running `nb session setup` once. This lets each session keep its own `current env`, so they are less likely to affect one another.

## Step 2: Initialize the app

We recommend opening the visual wizard directly:

```bash
nb init --ui
```

![2026-06-11-20-14-32](https://static-docs.nocobase.com/2026-06-11-20-14-32.png)

Different setup paths show slightly different steps. If you follow the default `Install a new app` path, you will usually see these six steps:

1. `Getting started` - set the `--env` identifier and choose `Install a new app`
2. `App environment` - set the app basics, storage location, and runtime port
3. `App source and version` - choose how to get the app and which source and version to use
4. `Configure the database` - choose the built-in database or a custom database
5. `Create an admin account` - set up the first admin account
6. `Connection & authentication` - enter the app access URL and choose an authentication method

If you prefer terminal interaction, you can also run:

```bash
nb init
```

If you need to initialize in scripts or CI, use non-interactive mode:

```bash
nb init --yes --env app1
```

:::tip Install on a remote server

If you run `nb init --ui` on a server, we recommend changing the default host to that server's IP first. That way, you can open the wizard from your local browser.

```bash
nb config set default-ui-host <server-ip>
nb config set default-api-host <server-ip>
```

:::

## Step 3: Confirm the app is ready

After installation, it is usually worth confirming these three things first:

- The env has been saved successfully
- The app has started normally
- You can sign in with the administrator account

Common commands:

```bash
nb env list
nb env info
nb app logs
```

For a local default installation, you can usually open `http://localhost:13000` in your browser directly. After signing in, start a new AI Agent session or restart the current one, and the AI can begin working with this NocoBase app.

CLI configuration is stored in `~/.nocobase/` by default, so AI Agents can usually access it from any working directory.

If this app will be exposed to real users later, we do not recommend using `IP + port` for the long term. The next step is usually to put it behind a reverse proxy and enable HTTPS.

## Next Steps

- If you already have a running NocoBase app, see [AI Agent Integration Guide](./quick-start.mdx)
- If you want to manage app startup, shutdown, logs, and upgrades, see [Manage apps](../nocobase-cli/operations/manage-app.md)
- If you want to continue with production deployment, see [Install apps with CLI](../nocobase-cli/installation/cli.md) and [Production deployment overview](../nocobase-cli/production/index.md)
- If you want AI to start building apps, see [AI Builder](../ai-builder/index.md)

## Related Links

- [Installation and Version Comparison](../get-started/quickstart.md) — Compare installation methods and version channels first, then decide how to install
- [AI Agent Integration Guide](./quick-start.mdx) — Connect an existing NocoBase app and let your AI Agent start working
- [`nb init` command reference](../api/cli/init.md) — Initialize a new app, take over an existing local app, or connect a remote app
- [`nb env info` command reference](../api/cli/env/info.md) — View the connection details and runtime configuration of the current env
- [NocoBase CLI](../api/cli/index.md) — Full reference for all `nb` commands
- [Manage apps](../nocobase-cli/operations/manage-app.md) — Start, stop, restart, view logs, and upgrade apps
- [Multiple environment management](../nocobase-cli/operations/multi-environment.md) — Common operations when you maintain multiple envs at the same time
