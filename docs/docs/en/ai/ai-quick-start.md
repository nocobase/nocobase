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

- **Node.js 22** (run `node -v` to check). If not installed, guide the user to install via [nvm](https://github.com/nvm-sh/nvm), [fnm](https://github.com/Schniz/fnm), or the [Node.js website](https://nodejs.org/)
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

Run this command in the working directory created or selected in Step 3 (this command has a default timeout of 30 minutes — do not interrupt it midway, and do not run it repeatedly):

```bash
nb init --ui
```

![nocobase cli visual wizard](https://static-docs.nocobase.com/20260424121223.png)

Tell the user: the browser will automatically open a local configuration page where they need to complete the configuration. If the browser cannot open automatically due to sandbox permissions or similar issues, provide the output URL to the user so they can copy it into their browser. After completion, ask the user to confirm before proceeding to the next steps.

Notes:

- The `nb init --ui` command has a 30-minute timeout and cannot be interrupted while running. If the user doesn't complete the browser configuration within 30 minutes, CLI will exit automatically. Do not run this command again before it exits.
- If the URL can't be opened in a sandbox, suggest elevating permissions first; if denied, give the URL to the user
- The user fills in the installation form in the browser themselves; the agent is only responsible for prompting and guiding
- Wait for the user to complete all configuration in the browser. Do not fill in any information on behalf of the user, as they may need to make choices based on their own environment and requirements.

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
