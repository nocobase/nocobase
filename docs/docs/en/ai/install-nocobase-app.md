---
title: Install NocoBase App
description: Install NocoBase CLI and quickly create a new NocoBase application with `nb init --ui`, so your AI Agent can start working right away.
---

# Install NocoBase App

If you do not have a NocoBase application yet, the fastest way is to install `@nocobase/cli` first, then run `nb init --ui` once. In most cases, the default options in the wizard are enough.

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

In the wizard, complete these steps in order:

1. Set the app name - it also becomes the env name in CLI
2. Choose "Fresh Installation"
3. Choose the installation method - Docker, npm, or Git
4. Set the port, database, and administrator account
5. Wait for the download, installation, and startup to finish

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
nb env status
nb app logs
```

For a local default installation, you can usually open `http://localhost:13000` in your browser directly. After signing in, start a new AI Agent session or restart the current one, and the AI can begin working with this NocoBase app.

CLI configuration is stored in `~/.nocobase/` by default, so AI Agents can usually access it from any working directory.

If this app will be exposed to real users later, we do not recommend using `IP + port` for the long term. The next step is usually to put it behind a reverse proxy and enable HTTPS.

## What's next

- If you already have a running NocoBase instance, go to [AI Agent Integration Guide](./quick-start.mdx)
- If you want to continue with production deployment, go to [Install using CLI](../nocobase-cli/installation/cli.md) and [Production deployment overview](../nocobase-cli/production/index.md)
- If you want AI to start building the app next, go to [AI Builder](../ai-builder/index.md)
