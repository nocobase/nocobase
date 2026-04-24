---
pkg: '@nocobase/plugin-ai'
title: 'AI Employees Quick Start'
description: 'Complete the minimal AI Employee setup in 5 minutes: install the plugin, configure LLM models, enable built-in employees, and start collaborating. Includes an overview of built-in employees such as Atlas, Ellis, Dex, Viz, and more.'
keywords: 'AI Employees quick start,NocoBase AI setup,LLM service,built-in employees,Atlas,Dex,Viz'
---

# Quick Start

Let's complete a minimal usable AI Employee setup in 5 minutes.

## Install Plugin

AI Employees are built into NocoBase (`@nocobase/plugin-ai`), so no separate installation is required.

## Configure Models

You can configure LLM services from either entry:

1. Admin entry: `System Settings -> AI Employees -> LLM Service`.
2. Frontend shortcut: In the AI chat panel, click the "Add LLM Service" shortcut when selecting a model to jump directly to configuration.

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

Usually you need to:

1. Select a Provider.
2. Fill in the API Key.
3. Configure Enabled Models; simply use Recommended models by default.

## Enable Built-in Employees

Built-in AI Employees are all enabled by default, and usually do not need to be enabled one by one.

If you need to adjust availability (enable/disable a specific employee), update the `Enabled` switch in `System Settings -> AI Employees` list.

![](https://static-docs.nocobase.com/202604230813855.png)

## Start Collaborating

Click the AI Employee entry at the bottom right to open the chat dialog.

![](https://static-docs.nocobase.com/202604230814677.png)

The default AI Employee is the team leader Atlas. You can type your question to start a conversation directly. When needed, Atlas will call the appropriate employees based on your question to collaborate and complete the task. You can also manually switch to a suitable employee and model for your specific scenario.

![](https://static-docs.nocobase.com/202604230816190.png)

You can also:

- Add blocks
- Add attachments
- Enable Web Search

## Shortcut Tasks

You can preset common tasks for each AI Employee at the current location, with pre-configured task background, user messages, block context, and more. This way you can start working with just one click, making it fast and convenient.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## Built-in Employees Overview

NocoBase provides multiple built-in AI Employees for different scenarios.

You only need to:

1. Configure LLM services.
2. Adjust employee enable status when needed (enabled by default).
3. Select a model in chat and start collaborating.

| Employee Name | Role Positioning | Core Capabilities |
| :--- | :--- | :--- |
| **Atlas** | Team Leader | Default general-purpose AI Employee that identifies user intent and automatically dispatches the appropriate AI Employee to handle the task |
| **Dex** | Data Organizer | Field translation, formatting, information extraction |
| **Viz** | Insight Analyst | Data insight, trend analysis, key indicator interpretation |
| **Lexi** | Translation Assistant | Multilingual translation, communication assistance |
| **Vera** | Research Analyst | Web search, information aggregation, in-depth research |
| **Ellis** | Email Expert | Email writing, summary generation, reply suggestions |
| **Orin** | Data Modeling Expert | Assist in designing collection structures, field suggestions |
| **Nathan** | Frontend Engineer | Assist in writing frontend code snippets, style adjustments |
| **Dara** | Data Visualization Expert | Chart configuration |

**Notes**

Some built-in AI Employees have dedicated work scenarios:

- Orin: data modeling pages.
- Dara: chart configuration blocks.
- Nathan: JS Block and similar code editors.
