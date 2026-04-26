---
title: "OpenClaw + NocoBase: The Most Popular AI Agent Working for You"
description: "Connect the world's most popular open-source AI Agent OpenClaw to NocoBase, and use natural language to operate your business system through Skills and CLI."
keywords: "OpenClaw,NocoBase,AI Agent,Skills,CLI,Lark,natural language"
sidebar: false
---

:::warning Content Under Development

This page is still being written. Some sections may be incomplete or subject to change.

:::

# OpenClaw + NocoBase: The Most Popular AI Agent Working for You

[OpenClaw](https://github.com/openclaw/openclaw) is the world's most popular open-source AI Agent framework — it doesn't just chat, it actually executes tasks. After connecting it to NocoBase, you can use natural language to create data tables, build pages, configure workflows, and even let it run 24/7 autonomously to continuously maintain your business system.

<!-- Screenshot needed: OpenClaw operating NocoBase in a Lark conversation -->

## What Is OpenClaw

OpenClaw is an open-source AI Agent framework created by developer Peter Steinberger, and one of the hottest AI Agent projects in the world (GitHub 300k+ Stars). Its positioning is "an AI assistant that gets things done." Unlike conversational tools like ChatGPT and Claude, OpenClaw has four core features:

- **Execution capability** — Automatically completes tasks after receiving natural language instructions, not just giving suggestions
- **Cross-session memory** — Remembers your preferences and usage habits, getting better with use
- **Skills ecosystem** — Extend capabilities by installing Skills, like "teaching new skills" to your assistant
- **24/7 operation** — Supports scheduled tasks and proactive reporting, no need for you to keep watching

OpenClaw supports 26+ platforms including Lark, Telegram, and Discord, so you can chat with it directly in the tools you use for daily work. Lark users can deploy with one click, no technical background required.

## Why Choose OpenClaw

If you're deciding which AI Agent to use for operating NocoBase, here are the scenarios where OpenClaw fits best:

- **Need zero-barrier onboarding** — Lark users can deploy with one click, no need to set up your own server
- **Team uses Lark for work** — OpenClaw is deeply integrated with Lark, with smooth experiences like streaming messages and @bot in group chats
- **Need 24/7 availability** — OpenClaw is deployed in the cloud, unaffected by your local computer status
- **Value community ecosystem** — OpenClaw has the largest Skills community, with many other skills available beyond NocoBase

## How It Connects

OpenClaw works with NocoBase in the following way:

```
You (Lark / Telegram / ...)
  |
  └─→ OpenClaw Agent
        |
        ├── NocoBase Skills (enables Agent to understand NocoBase configuration system)
        |
        └── NocoBase CLI (executes create, modify, deploy, and other operations)
              |
              └─→ NocoBase Service (your business system)
```

- **NocoBase Skills** — Domain knowledge packages that tell OpenClaw how to operate NocoBase
- **NocoBase CLI** — Command-line tool that actually executes data modeling, page building, and other operations
- **NocoBase Service** — Your running NocoBase instance

## Prerequisites

Before starting, make sure you have the following environment ready:

- A deployed OpenClaw Agent ([one-click Lark deployment](https://openclaw.feishu.cn) or local deployment)
- Node.js >= 22 (for running NocoBase CLI and Skills)
- If you already have a NocoBase instance, it needs to be version >= 2.1.0-alpha.22

:::warning Note

When installing third-party Skills, pay attention to security — prioritize official or trusted Skills sources and avoid installing unreviewed community skills.

:::

## Quick Start

### One-Click AI Installation

Copy the prompt below to OpenClaw, and it will automatically complete NocoBase CLI installation, initialization, and environment configuration:

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

<!-- TODO: Compile 5-8 common questions. For example: What to do if Skills installation fails, how to update Skills version, what models OpenClaw supports, how to roll back on errors, etc. -->

## Related Links

- [NocoBase CLI](../quick-start.md) — Command-line tool for installing and managing NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Domain knowledge packages installable into AI Agents
- [AI Building Quick Start](../../ai-builder/index.md) — Build NocoBase applications from scratch with AI
- [OpenClaw Lark Deployment Guide](https://openclaw.feishu.cn) — One-click deploy OpenClaw to Lark
- [Hermes Agent + NocoBase](../hermes-agent/index.md) — Automatically distills skills, understanding your business system better over time
- [WorkBuddy + NocoBase](../workbuddy/index.md) — Multi-platform remote control of NocoBase via WeCom, Lark, and DingTalk
