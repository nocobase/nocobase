---
title: "Hermes Agent: A NocoBase Assistant That Learns as You Use It"
description: "Connect Hermes Agent to NocoBase, and through cross-session memory and automatic skill distillation, let AI understand your business system better over time."
keywords: "Hermes Agent,NocoBase,AI Agent,Nous Research,Skills,auto-learning,self-hosted"
sidebar: false
---

:::warning Content Under Development

This page is still being written. Some sections may be incomplete or subject to change.

:::

# Hermes Agent: A NocoBase Assistant That Learns as You Use It

[Hermes Agent](https://github.com/nousresearch/hermes-agent) is a self-hosted open-source AI Agent — it automatically distills each successful operation into reusable skill documents, getting smarter the more you use it. After connecting it to NocoBase, you can not only build and manage systems using natural language, but also let it gradually learn your business conventions and preferences.

<!-- Screenshot needed: Hermes Agent operating NocoBase in terminal or Lark conversation -->

## What Is Hermes Agent

Hermes Agent is developed by Nous Research (GitHub 35.7k Stars), with the core philosophy of "getting smarter the longer you use it." Unlike other AI Agents, Hermes has a complete closed-loop learning mechanism:

- **Cross-session memory** — Based on full-text search and LLM summarization, able to recall conversation context from weeks ago
- **Automatic skill distillation** — After each successful complex task completion, automatically creates reusable skill documents
- **Continuous self-improvement** — Skills are continuously refined through repeated use, becoming more precise over time
- **400+ model support** — Compatible with mainstream LLM providers, not locked to a specific model

Hermes supports 8 platforms including Lark, Telegram, Discord, and Slack, and can also be used directly in the terminal.

:::tip Tip

Hermes Agent runs on your own server, with all data and memory stored locally — ideal for scenarios with data security requirements.

:::

## Why Choose Hermes Agent

If you're deciding which AI Agent to use for operating NocoBase, here are the scenarios where Hermes fits best:

- **Long-term maintenance of the same system** — Hermes' memory mechanism means it understands your business better over time, no need to re-explain context each time
- **Team requires self-hosting** — Data stays completely local, never passes through third-party cloud services
- **Need standardized operating procedures** — Hermes' automatically distilled skill documents can serve as your team's operation manual
- **Prefer terminal operations** — Hermes natively supports CLI interaction, suitable for technical teams' daily use

## How It Connects

Hermes Agent works with NocoBase in the following way:

```
You (Lark / Telegram / Terminal / ...)
  |
  └─→ Hermes Agent
        |
        ├── NocoBase Skills (enables Agent to understand NocoBase configuration system)
        |
        ├── NocoBase CLI (executes create, modify, deploy, and other operations)
        |
        └── Memory & Skill Documents (automatically distilled, continuously reused)
              |
              └─→ NocoBase Service (your business system)
```

Unlike other Agents, Hermes updates its memory and skill documents after each operation. This information is stored locally and automatically reused in subsequent operations.

## Prerequisites

Before starting, make sure you have the following environment ready:

- A server running Hermes Agent (Linux / macOS, Python 3.10+)
- Node.js 22 (for running NocoBase CLI and Skills)
- If you already have a NocoBase instance, it needs to be version >= 2.1.0-alpha.22

Installing Hermes requires just one command:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

:::warning Note

Hermes Agent requires self-deployment and maintenance. If you prefer a zero-configuration out-of-the-box experience, consider [OpenClaw](../openclaw/index.md) (one-click Lark deployment) or [WorkBuddy](../workbuddy/index.md) (hosted by Tencent).

:::

## Quick Start

### One-Click AI Installation

Copy the prompt below to Hermes Agent, and it will automatically complete NocoBase CLI installation, initialization, and environment configuration:

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

<!-- TODO: Compile 5-8 common questions. For example: Where are memory files stored, how to migrate to a new server, what models are supported, how to clear incorrect memory, what's the difference between Hermes and OpenClaw, etc. -->

## Related Links

- [NocoBase CLI](../quick-start.md) — Command-line tool for installing and managing NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Domain knowledge packages installable into AI Agents
- [AI Building Quick Start](../../ai-builder/index.md) — Build NocoBase applications from scratch with AI
- [Hermes Agent GitHub](https://github.com/nousresearch/hermes-agent) — Hermes Agent source code and documentation
- [OpenClaw + NocoBase](../openclaw/index.md) — The world's most popular open-source AI Agent, one-click Lark deployment
- [WorkBuddy + NocoBase](../workbuddy/index.md) — Multi-platform remote control of NocoBase via WeCom, Lark, and DingTalk
