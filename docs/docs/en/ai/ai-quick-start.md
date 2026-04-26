---
title: "AI Agent Installation Guide"
description: "NocoBase CLI installation and configuration guide for AI Agents, including complete steps for environment checks, installation, initialization, and verification."
keywords: "NocoBase CLI,AI Agent,installation,Claude Code,Codex,Cursor,Skills"
sidebar: false
---

# AI Agent Installation Guide

This page is a NocoBase CLI installation and initialization guide for AI Agents (such as Claude Code, Codex, Cursor, Copilot, etc.).

If you are a human user, please refer to [Quick Start](./quick-start.md).

## Step 1: Check Prerequisites

Confirm the user has the following dependencies installed:

- **Node.js >= 22** (run `node -v` to check). If the current version is below 22:
  1. First check whether the user has a Node version manager installed (run `nvm --version`, `fnm --version`, `volta --version` in order)
  2. If any of these tools is detected, use it to switch to Node.js 22 (e.g., `nvm install 22 && nvm use 22`, `fnm install 22 && fnm use 22`, `volta install node@22`)
  3. If no version manager is found, guide the user to download and install Node.js >= 22 from the [Node.js website](https://nodejs.org/)
- **Yarn 1.x** (run `yarn -v` to check). If not installed, install via `npm install -g yarn`
- **Git** (run `git --version` to check). If not installed, install from the [Git website](https://git-scm.com/)
- **Docker** (if the user needs to install NocoBase via Docker). Run `docker -v` to check; if not installed, guide the user to install from the [Docker website](https://www.docker.com/get-started/)

## Step 2: Install CLI

```bash
npm install -g @nocobase/cli@beta
```

Run `nb --version` to confirm successful installation.

## Step 3: Create a Working Directory

Ask the user whether to use the current directory as the working directory. Inform the user that if they choose the current directory, CLI will create `.nocobase`, `.agents`, and other related files and folders in it. If the user chooses not to use the current directory, tell them you will create a `my-nocobase` directory in the current directory by default as the working directory, and proceed with CLI initialization and configuration there. If the user agrees, continue:

```bash
mkdir my-nocobase
cd my-nocobase
```

If the user disagrees, ask them to provide a directory path, and proceed to the next initialization step in the directory they specify.

## Step 4: Run nb init --ui

**⚠️ IMPORTANT: You MUST run the exact command below. Do NOT modify, replace, or omit the `--ui` flag. Do NOT use any other combination of `nb init` parameters (such as `--yes`, `--env`, `--source`, `--version`, `--builtin-db`, etc.) instead of `--ui`. Do NOT attempt to "speed things up" by using non-interactive mode or assembling parameters yourself — `--ui` is the only correct way to initialize.**

Run in the working directory created or selected in Step 3:

```bash
nb init --ui
```

![nocobase cli visual wizard](https://static-docs.nocobase.com/20260424121223.png)

This command launches a browser-based visual wizard where the user completes all configuration (including installation method, database, admin account, etc.). Your responsibilities as an AI Agent are:

1. **Only run `nb init --ui`** — do not append any additional parameters
2. **Tell the user** the browser will automatically open a local configuration page where they need to complete the setup
3. **If the browser cannot open automatically** (e.g., due to sandbox permission restrictions), provide the URL from the command output to the user so they can manually copy it into their browser
4. **Wait for the user to confirm** the configuration is complete before proceeding to the next step

Prohibited actions:

- **Do NOT** assemble other `nb init` parameters to replace `--ui`
- **Do NOT** choose installation methods, database types, or fill in account/password for the user — these are all done by the user in the browser
- **Do NOT** interrupt or re-run this command midway (timeout is 30 minutes; do not re-execute before the command exits)

## Step 5: Verify Results

```bash
nb ps
```

Confirm the output shows the configured environment and its running status. Then remind the user to open the running NocoBase instance URL and log in with the configured account and password.


## Step 6: Complete

Tell the user the installation is complete. If the user is using a graphical AI Agent (such as Claude Code Desktop, Cursor, Codex App, etc.), they need to add the CLI-initialized directory (e.g., `my-nocobase`) as the tool's working directory, so the AI Agent can access the CLI configuration and NocoBase runtime environment. Inform the user about all of this.

For full documentation of all `nb` commands and parameters, refer to [NocoBase CLI Reference](../api/cli/cli).

## Related Links

- [Quick Start](./quick-start.md) — Installation and configuration guide for human users
- [AI Building Quick Start](../ai-builder/index.md) — Build NocoBase applications from scratch with AI
- [AI Plugin Development](../ai-dev/index.md) — Develop NocoBase plugins with AI assistance
- [Security & Audit](../ai-builder/security) — Authentication methods, permission control, and operation audit
- [NocoBase CLI Reference](../api/cli/cli) — Full parameter documentation for all commands
- [NocoBase Skills](https://github.com/nocobase/skills) — AI Agent domain knowledge package source code
