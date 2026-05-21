English | [简体中文](./README.zh-CN.md) | [日本語](./README.ja-JP.md) | [Français](./README.fr.md) | [Español](./README.es.md) | [Português](./README.pt.md) | [Bahasa Indonesia](./README.id.md) | [Tiếng Việt](./README.vi.md) | [Deutsch](./README.de.md)

https://github.com/user-attachments/assets/3b89d965-f60f-48e0-8110-24186c2911d2

<p align="center">
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase - Scalability&#0045;first&#0044;&#0032;open&#0045;source&#0032;no&#0045;code&#0032;platform | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

## Table of Contents

- [What is NocoBase](#what-is-nocobase)
- [Release Notes](#release-notes)
- [Distinctive Features](#distinctive-features)
- [AI Agent Access](#ai-agent-access)
- [Installation](#installation)

## What is NocoBase

NocoBase is an open-source AI + no-code platform for building business systems fast. Instead of generating everything from scratch, AI works on top of production-proven infrastructure and a WYSIWYG no-code interface, so you get both speed and reliability.

Homepage:  
https://www.nocobase.com/

Online demo:  
https://demo.nocobase.com/new

Documentation:  
https://docs.nocobase.com/

Forum:  
https://forum.nocobase.com/c/english-forum/5

User stories:  
https://www.nocobase.com/en/blog/tags/customer-stories

## Release Notes

Our [release notes](https://www.nocobase.com/en/blog/timeline) are updated regularly on the blog, with weekly summaries of important changes.

## Distinctive Features

### 1. Collaborative: AI and people build together

Coding agents get a full CLI and skills, while people get a WYSIWYG no-code interface, so both can collaborate efficiently.

#### Build with the AI coding agents you already know

Go from deployment to a working system in minutes with mainstream coding agents.

- Works with mainstream agents like Claude Code, Cursor, Codex, OpenCode, and TRAE
- Agents can handle setup, development, migration, and release end to end

![coding-agent](https://static-docs.nocobase.com/coding-agent.png)

#### Build manually in a WYSIWYG no-code interface

People can build and modify visually in a WYSIWYG interface, even without AI.

- Switch between usage mode and configuration mode with one click
- Review and configure data models, pages, workflows, and permissions visually
- Designed for regular users, not just developers

![wysiwyg](https://static-docs.nocobase.com/wysiwyg.gif)

#### Mix AI development and manual building however you need

Split the work as needed: people can refine what AI builds, and AI can continue from human configuration.

- AI can quickly create data models, pages, and workflows
- People can quickly refine the UI and interactions
- Collaborate as needed and keep iterating

![ai-no-coding](https://static-docs.nocobase.com/ai-no-coding.png)

### 2. Intelligent: AI helps run the business, not just build the system

NocoBase includes AI employees, so AI can work directly inside the system.

#### AI employees integrated into business workflows

AI employees get business context automatically and execute tasks directly inside the system.

- Front-end: help with analysis, Q&A, form filling, and more
- Back-end: handle document recognition, risk monitoring, and task routing automatically
- Integrated with workflows, AI employees can join decisions and execution

![AI-employee](https://static-docs.nocobase.com/ai-employee-home.png)

#### Open interfaces for the agent ecosystem

MCP, HTTP APIs, CLI, and rich skills let external agents connect securely.

- Platforms like OpenClaw, Hermes, Dify, Coze, and n8n connect through standard protocols
- Connects with Telegram, WhatsApp, Slack, and Gmail to query data, trigger actions, and execute business workflows
- One interface model keeps internal and external agents within the same boundaries

![agents](https://static-docs.nocobase.com/f-agents-logos.jpeg)

#### Permission controls keep AI behavior under control

Every AI action follows the same fine-grained permissions as human users.

- Each AI employee has its own role, with field-level read and write permissions
- Audit logs make every data change and workflow trigger traceable
- Admins can adjust AI permissions at any time to keep boundaries clear

![permission](https://static-docs.nocobase.com/f-permission.png)

### 3. Reliable: ready infrastructure for real business

Data models, permissions, and workflows are complex and error-sensitive.  
NocoBase provides them as built-in infrastructure, tested and proven in production.

#### Complete infrastructure, without starting from scratch

Dozens of built-in modules cover the most common business needs.

- Data models, permissions, workflows, and audit logs work out of the box
- Proven in production, instead of regenerated as black-box code each time
- Built-in guardrails keep AI output aligned with the system architecture

![core](https://static-docs.nocobase.com/f-core.png)

#### Data-model driven, with data decoupled from UI

Business data stays in standard relational structures, separate from the UI.

- Use the main database, external databases, and third-party APIs as data sources
- AI and people work on the same data model, so results stay transparent
- Your data always stays in your own database, without platform lock-in

![model](https://static-docs.nocobase.com/model.png)

#### Plugin architecture for sustainable growth

With a microkernel design, everything is a plugin and the system can grow without losing control.

- New features are added through composable plugins with shared conventions
- Mix custom and official plugins to fit your business
- The same architecture applies to both AI-built and manually built plugins

![plugins](https://static-docs.nocobase.com/plugins.png)

## AI Agent Access

The simplest way to let an AI agent operate NocoBase is to install the NocoBase CLI, finish initialization, and then start or restart your AI agent session inside the initialized working directory.

- NocoBase CLI is responsible for installing, connecting, and managing NocoBase applications
- During initialization, CLI automatically installs NocoBase Skills so the agent understands data models, pages, workflows, permissions, and plugins
- Once initialization is done, the AI agent can start working as long as its workspace points to that directory

Minimal flow:

```bash
npm install -g @nocobase/cli@beta
mkdir my-nocobase && cd my-nocobase
nb init --ui
```

Then restart your AI agent session in that directory, for example:

```bash
cd my-nocobase && codex
```

Learn more:  
https://docs.nocobase.com/ai/quick-start

## Installation

NocoBase supports three installation methods:

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/docker-compose">Install with Docker (recommended)</a>

  Best for no-code scenarios and requires no code writing. To upgrade, pull the latest image and restart.

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/create-nocobase-app">Install with create-nocobase-app</a>

  The business code of your project stays independent and supports low-code development.

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/git-clone">Install from Git source code</a>

  If you want the latest unreleased version or plan to contribute by modifying and debugging source code directly, this method is recommended. It requires stronger development skills, and you can pull updates through Git when the code changes.
