# Quick Start

Let's complete a minimal usable AI Employee setup in 5 minutes.

## Install Plugin

AI Employees are built into NocoBase (`@nocobase/plugin-ai`), so no separate installation is required.

## Configure Models

You can configure LLM services from either entry:

1. Admin entry: `System Settings -> AI Employees -> LLM service`.
2. Frontend shortcut: In the AI chat panel, use `Model Switcher` to choose a model, then click the shortcut to add an LLM service.

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

Usually you need to confirm:

1. Select Provider.
2. Fill API Key.
3. Configure `Enabled Models`; default `Recommend` is usually enough.

## Enable Built-in Employees

Built-in AI Employees are enabled by default, and usually do not need to be enabled one by one.

If you need to adjust availability (enable/disable a specific employee), update the `Enabled` switch in `System Settings -> AI Employees` list.

![ai-employee-list-enable-switch.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-list-enable-switch.png)

## Start Collaborating

On the application page, hover over the bottom-right shortcut entry and choose an AI Employee.

![ai-employees-entry-bottom-right.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employees-entry-bottom-right.png)

Click to open the AI chat dialog:

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)

You can also:

- Add blocks
- Add attachments
- Enable Web Search
- Switch AI Employees
- Select models

AI Employees can also automatically get page structure as context. For example, Dex on a form block can read form field structures and call suitable skills to operate on the page.

## Shortcut Tasks

You can preset common tasks for each AI Employee at the current location, so work can start with one click.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## Built-in Employees Overview

NocoBase provides multiple built-in AI Employees for different scenarios.

You only need to:

1. Configure LLM services.
2. Adjust employee enable status when needed (enabled by default).
3. Select model in chat and start collaborating.

| Employee Name | Role Positioning | Core Capabilities |
| :--- | :--- | :--- |
| **Cole** | NocoBase Assistant | Product usage Q&A, document retrieval |
| **Ellis** | Email Expert | Email writing, summary generation, reply suggestions |
| **Dex** | Data Organizer | Field translation, formatting, information extraction |
| **Viz** | Insight Analyst | Data insight, trend analysis, key indicator interpretation |
| **Lexi** | Translation Assistant | Multilingual translation, communication assistance |
| **Vera** | Research Analyst | Web search, information aggregation, in-depth research |
| **Dara** | Data Visualization Expert | Chart configuration, visual report generation |
| **Orin** | Data Modeling Expert | Assist in designing data table structures, field suggestions |
| **Nathan** | Frontend Engineer | Assist in writing frontend code snippets, style adjustments |

**Notes**

Some built-in AI Employees do not appear in the bottom-right list because they have dedicated scenarios:

- Orin: data modeling pages.
- Dara: chart configuration blocks.
- Nathan: JS Block and similar code editors.
