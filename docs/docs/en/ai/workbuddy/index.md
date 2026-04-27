---
title: "Go Hands-Free with WorkBuddy Driving NocoBase"
description: "Remotely control NocoBase through Tencent's WorkBuddy, supporting WeCom, Lark, DingTalk, and other multi-platform access."
keywords: "WorkBuddy,NocoBase,AI Agent,Tencent,WeCom,Lark,DingTalk,remote control"
sidebar: false
---

:::warning Content Under Development

This page is still being written. Some sections may be incomplete or subject to change.

:::

# Go Hands-Free with WorkBuddy Driving NocoBase

[WorkBuddy](https://www.codebuddy.cn) is a full-scenario workplace AI agent by Tencent — describe your needs in one sentence, and it autonomously plans steps and executes them. After connecting it to NocoBase, you can remotely control your business system through WeCom, Lark, DingTalk, and other platforms, completing daily management tasks without opening a browser.

<!-- Screenshot needed: WorkBuddy operating NocoBase in a WeCom conversation -->

## What Is WorkBuddy

WorkBuddy is Tencent's "full-scenario workplace AI agent desktop workstation." Unlike ordinary AI conversational tools, WorkBuddy automatically breaks down, plans, and executes tasks when it receives them, ultimately delivering a verifiable result — without requiring your step-by-step guidance.

Core features:

- **Autonomous planning and execution** — Automatically breaks tasks into steps, executes them one by one, and delivers complete results
- **Multi-platform access** — Supports WeCom, Lark, DingTalk, QQ, and other mainstream Chinese enterprise platforms
- **20+ built-in skills** — Document generation, data analysis, PPT creation, email editing, and more — ready to use out of the box
- **Local file operations** — Can read and process local files you authorize

In short, traditional AI tools give you suggestions and leave you to do the work; WorkBuddy does the work for you.

| Traditional AI Chat | WorkBuddy |
|---|---|
| Can only chat, gives suggestions | Can actually execute tasks |
| Requires manual file operations | Automatically operates local files |
| Single-step simple tasks | Multi-step complex tasks, auto-decomposed |
| Outputs text replies | Delivers verifiable results |

## Why Choose WorkBuddy

If you're deciding which AI Agent to use for operating NocoBase, here are the scenarios where WorkBuddy fits best:

- **Team uses WeCom / Lark / DingTalk** — WorkBuddy supports the broadest range of Chinese enterprise platforms, with the widest coverage
- **Need mobile control of NocoBase** — Manage your system anytime from anywhere, without device restrictions
- **Want out-of-the-box experience** — Made by Tencent, with 20+ built-in skills and a low configuration barrier
- **Focus on task automation** — WorkBuddy excels at automatically decomposing and executing multi-step tasks, suitable for daily operations and management

## How It Connects

WorkBuddy works with NocoBase in the following way:

```
You (WeCom / Lark / DingTalk / ...)
  |
  └─→ WorkBuddy
        |
        ├── NocoBase Skills (enables Agent to understand NocoBase configuration system)
        |
        └── NocoBase CLI (executes create, modify, deploy, and other operations)
              |
              └─→ NocoBase Service (your business system)
```

You send instructions from any supported platform, WorkBuddy completes NocoBase operations on the backend through Skills and CLI, and results are pushed back to your chat window in real time.

## Prerequisites

Before starting, make sure you have the following environment ready:

- WorkBuddy account ([registration portal](https://www.codebuddy.cn))
- Node.js >= 22 (for running NocoBase CLI and Skills)
- If you already have a NocoBase instance, **AI capabilities are evolving rapidly and only the latest beta version provides the full experience. Minimum version >= 2.1.0-beta.20, latest version strongly recommended.**

:::warning Note

WorkBuddy is currently under rapid iteration, and some features may change. It is recommended to follow the [WorkBuddy official documentation](https://www.codebuddy.cn/docs/workbuddy/Overview) for the latest information.

:::

## Quick Start

### One-Click AI Installation

Copy the prompt below to WorkBuddy, and it will automatically complete NocoBase CLI installation, initialization, and environment configuration:

```
Help me install NocoBase CLI and complete initialization: https://docs.nocobase.com/en/ai/ai-quick-start.md (please read the linked content directly)
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

<!-- TODO: Compile 5-8 common questions. For example: What platforms does WorkBuddy support, how much free quota is available, how to handle operation failures, can multiple people share one WorkBuddy to control the same NocoBase instance, etc. -->

## Related Links

- [NocoBase CLI](../quick-start.md) — Command-line tool for installing and managing NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Domain knowledge packages installable into AI Agents
- [AI Building Quick Start](../../ai-builder/index.md) — Build NocoBase applications from scratch with AI
- [WorkBuddy Official Documentation](https://www.codebuddy.cn/docs/workbuddy/Overview) — WorkBuddy complete user guide
- [OpenClaw + NocoBase](../openclaw/index.md) — The world's most popular open-source AI Agent, one-click Lark deployment
- [Hermes Agent + NocoBase](../hermes-agent/index.md) — Automatically distills skills, understanding your business system better over time
