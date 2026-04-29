---
title: "OpenCode + NocoBase: Open Source, Free, Vendor-Unlocked NocoBase Building"
description: "Connect the open-source AI coding assistant OpenCode to NocoBase, freely choose models, and use natural language to operate your business system."
keywords: "OpenCode,NocoBase,AI Agent,open source,multi-model,Skills,CLI,natural language"
sidebar: false
---

:::warning Content Under Development

This page is still being written. Some sections may be incomplete or subject to change.

:::

# OpenCode + NocoBase: Open Source, Free, Vendor-Unlocked NocoBase Building

[OpenCode](https://github.com/opencode-ai/opencode) is an open-source terminal AI Agent — supporting 75+ models (Claude, GPT, Gemini, DeepSeek, etc.), not locked to any vendor, letting you freely choose the best model for your needs. After connecting it to NocoBase, you can use natural language to create data tables, build pages, configure workflows, while maintaining full control over model selection and costs.

<!-- Screenshot needed: OpenCode operating NocoBase in terminal -->

## What Is OpenCode

OpenCode is developed by Anomaly Innovations (GitHub 140k+ Stars), positioned as "a vendor-unlocked terminal AI Agent." Written in Go, it provides a beautiful TUI interface. Core features:

- **75+ model support** — Claude, GPT, Gemini, DeepSeek, local models, and more — freely switch between them
- **Zero vendor lock-in** — Bring your own API Key, pay by actual usage, no extra subscriptions needed
- **Multi-Agent architecture** — Built-in Build, Plan, Review, Debug, and Docs Agent roles
- **Privacy-first** — Doesn't store code or context, all data stays local

OpenCode also supports integration with VS Code, JetBrains, Zed, Neovim, and other editors, as well as a standalone desktop application.

## Why Choose OpenCode

If you're deciding which AI Agent to use for operating NocoBase, here are the scenarios where OpenCode fits best:

- **Don't want to be locked to a single model** — Use Claude today, switch to GPT tomorrow, try DeepSeek the day after — one tool handles it all
- **Care about cost control** — Bring your own API Key and pay per usage; supports using existing ChatGPT Plus subscriptions
- **Have privacy requirements** — Code and context don't go through third parties; supports local models
- **Like high customizability** — YAML configuration for custom Agent behavior, meeting team-specific needs

## How It Connects

OpenCode works with NocoBase in the following way:

```
You (Terminal / VS Code / JetBrains / ...)
  |
  └─→ OpenCode
        |
        ├── NocoBase Skills (enables Agent to understand NocoBase configuration system)
        |
        └── NocoBase CLI (executes create, modify, deploy, and other operations)
              |
              └─→ NocoBase Service (your business system)
```

- **NocoBase Skills** — Domain knowledge packages that tell OpenCode how to operate NocoBase
- **NocoBase CLI** — Command-line tool that actually executes data modeling, page building, and other operations
- **NocoBase Service** — Your running NocoBase instance

## Prerequisites

Before starting, make sure you have the following environment ready:

- OpenCode installed ([installation guide](https://opencode.ai/docs/))
- Node.js >= 22 (for running NocoBase CLI and Skills)
- If you already have a NocoBase instance, **AI capabilities are evolving rapidly and only the latest beta version provides the full experience. Minimum version >= 2.1.0-beta.20, latest version strongly recommended.**

## Quick Start

### One-Click AI Installation

Copy the prompt below to OpenCode, and it will automatically complete NocoBase CLI installation, initialization, and environment configuration:

```
Help me install NocoBase CLI and complete initialization: https://docs.nocobase.com/ai/ai-quick-start.md (please read the linked content directly)
```

### Manual Installation

```bash
npm install -g @nocobase/cli@beta
mkdir my-nocobase && cd my-nocobase
nb init --ui
```

The browser will automatically open a visual configuration page, guiding you to install NocoBase Skills, configure the database, and start the application. For detailed steps, see [Quick Start](../quick-start.md).

After installation is complete, run `nb ps` to confirm the environment status:

```bash
nb ps
```

Confirm the output shows the configured environment and its running status.

## FAQ

<!-- TODO: Compile 5-8 common questions. For example: How to configure API Keys for different models, how to switch models, how to use local models, what to do if Skills installation fails, etc. -->

## Related Links

- [NocoBase CLI](../quick-start.md) — Command-line tool for installing and managing NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Domain knowledge packages installable into AI Agents
- [AI Building Quick Start](../../ai-builder/index.md) — Build NocoBase applications from scratch with AI
- [OpenCode Official Documentation](https://opencode.ai/docs/) — OpenCode complete user guide
- [Claude Code + NocoBase](../claude-code/index.md) — Anthropic's official AI coding assistant
- [Codex + NocoBase](../codex/index.md) — OpenAI's official AI coding assistant
