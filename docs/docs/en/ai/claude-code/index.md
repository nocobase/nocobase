---
title: "Claude Code + NocoBase: The Strongest AI Brain, Your NocoBase Chief Architect"
description: "Connect Anthropic's official AI coding assistant Claude Code to NocoBase, and use natural language to operate your business system through Skills and CLI."
keywords: "Claude Code,NocoBase,AI Agent,Anthropic,Skills,CLI,natural language"
sidebar: false
---

:::warning Content Under Development

This page is still being written. Some sections may be incomplete or subject to change.

:::

# Claude Code + NocoBase: The Strongest AI Brain, Your NocoBase Chief Architect

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) is Anthropic's official AI coding assistant — it runs directly in your terminal, understands your entire codebase, and helps you with everything from coding to system building. After connecting it to NocoBase, you can use natural language to create data tables, build pages, configure workflows, and enjoy the building experience powered by the most capable AI models.

<!-- Screenshot needed: Claude Code operating NocoBase in terminal -->

## What Is Claude Code

Claude Code is a CLI-based AI Agent from Anthropic, powered by the Claude model series. It runs directly in the terminal and can understand project context and execute operations. Core features:

- **Top-tier model capability** — Based on Claude Opus / Sonnet, leading in code comprehension and generation
- **Terminal-native** — Runs directly in the terminal, seamlessly integrating with developer workflows
- **Project awareness** — Automatically understands project structure, dependencies, and code conventions
- **Multi-tool collaboration** — Supports reading/writing files, executing commands, searching code, and more

Claude Code also supports integration with VS Code, JetBrains, and other IDEs, and is available as a standalone desktop and web application.

## Why Choose Claude Code

If you're deciding which AI Agent to use for operating NocoBase, here are the scenarios where Claude Code fits best:

- **Want the strongest model capability** — Claude model series excels in complex reasoning and code generation
- **Developer daily workflow** — Terminal-native, seamlessly working with your IDE, Git, npm, and other tools
- **Need deep project understanding** — Claude Code automatically analyzes project structure and provides context-aware suggestions
- **Doing both building and development** — Can help you both build NocoBase applications and develop custom plugins

## How It Connects

Claude Code works with NocoBase in the following way:

```
You (Terminal / VS Code / JetBrains / ...)
  |
  └─→ Claude Code
        |
        ├── NocoBase Skills (enables Agent to understand NocoBase configuration system)
        |
        └── NocoBase CLI (executes create, modify, deploy, and other operations)
              |
              └─→ NocoBase Service (your business system)
```

- **NocoBase Skills** — Domain knowledge packages that tell Claude Code how to operate NocoBase
- **NocoBase CLI** — Command-line tool that actually executes data modeling, page building, and other operations
- **NocoBase Service** — Your running NocoBase instance

## Prerequisites

Before starting, make sure you have the following environment ready:

- Claude Code installed (`npm install -g @anthropic-ai/claude-code`)
- Node.js 22 (for running NocoBase CLI and Skills)
- If you already have a NocoBase instance, it needs to be version >= 2.1.0-alpha.22

## Quick Start

### One-Click AI Installation

Copy the prompt below to Claude Code, and it will automatically complete NocoBase CLI installation, initialization, and environment configuration:

```
Help me install NocoBase CLI: https://docs.nocobase.com/en/ai/ai-quick-start.md
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

<!-- TODO: Compile 5-8 common questions. For example: How to configure API Key, what models Claude Code supports, how to use it in VS Code, what to do if Skills installation fails, etc. -->

## Related Links

- [NocoBase CLI](../quick-start.md) — Command-line tool for installing and managing NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Domain knowledge packages installable into AI Agents
- [AI Building Quick Start](../../ai-builder/index.md) — Build NocoBase applications from scratch with AI
- [Claude Code Official Documentation](https://docs.anthropic.com/en/docs/claude-code) — Claude Code complete user guide
- [OpenClaw + NocoBase](../openclaw/index.md) — The world's most popular open-source AI Agent, one-click Lark deployment
- [Codex + NocoBase](../codex/index.md) — OpenAI's official AI coding assistant
- [OpenCode + NocoBase](../opencode/index.md) — Open-source terminal AI Agent supporting 75+ models
