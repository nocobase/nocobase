---
title: "Use Codex to Operate NocoBase for Both Building and Development"
description: "Connect OpenAI's official AI coding assistant Codex to NocoBase, and use natural language to operate your business system through Skills and CLI."
keywords: "Codex,OpenAI,NocoBase,AI Agent,Skills,CLI,natural language"
sidebar: false
---

:::warning Content Under Development

This page is still being written. Some sections may be incomplete or subject to change.

:::

# Use Codex to Operate NocoBase for Both Building and Development

[Codex](https://github.com/openai/codex) is OpenAI's official AI coding assistant — it runs in the terminal, can read and write code, execute commands, and help you with everything from coding to system building. After connecting it to NocoBase, you can use natural language to create data tables, build pages, configure workflows, and leverage GPT series models to quickly build business systems.

<!-- Screenshot needed: Codex operating NocoBase in terminal -->

## What Is Codex

Codex is a CLI-based AI Agent from OpenAI, powered by GPT series models (including o3, o4-mini, etc.). It runs in a local sandbox environment, safely executing code and commands. Core features:

- **GPT series powered** — Based on OpenAI's latest models, excels at code generation and task planning
- **Sandbox execution** — Runs commands in an isolated sandbox, safe and controllable
- **Multimodal understanding** — Supports text, images, and other input types; can understand UI layouts from screenshots
- **Flexible autonomy levels** — From suggestion mode to full auto mode, you decide the AI's level of autonomy

## Why Choose Codex

If you're deciding which AI Agent to use for operating NocoBase, here are the scenarios where Codex fits best:

- **Already using the OpenAI ecosystem** — If you have a ChatGPT Plus/Pro subscription or OpenAI API Key, Codex is the most natural choice
- **Value security** — The sandbox execution mechanism ensures AI operations don't accidentally affect your system
- **Need flexible control** — Switch autonomy levels based on task complexity: full auto for simple tasks, confirmation required for sensitive operations
- **Prefer OpenAI model style** — GPT series has its own strengths in task planning and step-by-step execution

## How It Connects

Codex works with NocoBase in the following way:

```
You (Terminal / ...)
  |
  └─→ Codex
        |
        ├── NocoBase Skills (enables Agent to understand NocoBase configuration system)
        |
        └── NocoBase CLI (executes create, modify, deploy, and other operations)
              |
              └─→ NocoBase Service (your business system)
```

- **NocoBase Skills** — Domain knowledge packages that tell Codex how to operate NocoBase
- **NocoBase CLI** — Command-line tool that actually executes data modeling, page building, and other operations
- **NocoBase Service** — Your running NocoBase instance

## Prerequisites

Before starting, make sure you have the following environment ready:

- Codex installed (`npm install -g @openai/codex`)
- Node.js >= 22 (for running NocoBase CLI and Skills)
- If you already have a NocoBase instance, **AI capabilities are evolving rapidly and only the latest beta version provides the full experience. Minimum version >= 2.1.0-beta.20, latest version strongly recommended.**

## Quick Start

### One-Click AI Installation

Copy the prompt below to Codex, and it will automatically complete NocoBase CLI installation, initialization, and environment configuration:

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

<!-- TODO: Compile 5-8 common questions. For example: How to configure OpenAI API Key, what models Codex supports, how to choose autonomy level, what to do if Skills installation fails, etc. -->

## Related Links

- [NocoBase CLI](../quick-start.md) — Command-line tool for installing and managing NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Domain knowledge packages installable into AI Agents
- [AI Building Quick Start](../../ai-builder/index.md) — Build NocoBase applications from scratch with AI
- [Codex GitHub](https://github.com/openai/codex) — Codex source code and documentation
- [Claude Code + NocoBase](../claude-code/index.md) — Anthropic's official AI coding assistant
- [OpenCode + NocoBase](../opencode/index.md) — Open-source terminal AI Agent supporting 75+ models
