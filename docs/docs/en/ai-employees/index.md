---
pkg: "@nocobase/plugin-ai"
---

# Overview

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

AI Employees (`AI Employees`) are intelligent agent capabilities deeply integrated into NocoBase business systems.

They are not just chatbots. They are "digital colleagues" that can understand business context in the UI and execute actions directly:

- **Understand business context**: perceive current pages, blocks, data structures, and selected content.
- **Execute actions directly**: call skills to query, analyze, fill, configure, and generate.
- **Role-based collaboration**: configure different employees by role and switch models in conversation.

## 5-Minute Getting Started Path

Start with [Quick Start](/ai-employees/quick-start), and complete minimal setup in this order:

1. Configure at least one [LLM Service](/ai-employees/features/llm-service).
2. Enable at least one [AI Employee](/ai-employees/features/enable-ai-employee).
3. Open a session and start [collaborating with AI Employees](/ai-employees/features/collaborate).
4. Enable [Web Search](/ai-employees/features/web-search) and [Shortcut Tasks](/ai-employees/features/task) when needed.

## Feature Map

### A. Basic Configuration (Admin)

- [Configure LLM Service](/ai-employees/features/llm-service): connect providers and manage available models.
- [Enable AI Employees](/ai-employees/features/enable-ai-employee): enable/disable built-in employees and control scope.
- [New AI Employee](/ai-employees/features/new-ai-employees): define role, persona, greeting message, and capability boundary.
- [Use Skills](/ai-employees/features/tool): configure skill permissions (`Ask` / `Allow`) and control execution risk.

### B. Daily Collaboration (Business Users)

- [Collaborate with AI Employees](/ai-employees/features/collaborate): switch employee and model in chat for continuous collaboration.
- [Add Context - Blocks](/ai-employees/features/pick-block): send page blocks as context to AI.
- [Shortcut Tasks](/ai-employees/features/task): preset common tasks on pages/blocks and run with one click.
- [Web Search](/ai-employees/features/web-search): enable retrieval for up-to-date information when needed.

### C. Advanced Capabilities (Extensions)

- [Built-in AI Employees](/ai-employees/features/built-in-employee): understand built-in role positioning and suitable scenarios.
- [Permission Control](/ai-employees/permission): control employee, skill, and data access by org permissions.
- [AI Knowledge Base](/ai-employees/knowledge-base/index): import enterprise knowledge for stable and traceable answers.
- [Workflow LLM Nodes](/ai-employees/workflow/nodes/llm/chat): orchestrate AI capabilities into automated workflows.

## Core Concepts (Recommended to Align First)

Keep the following terms aligned with the glossary:

- **AI Employee**: an executable agent composed of Role setting and Tool/Skill.
- **LLM Service**: model access and capability configuration unit for Provider and model list management.
- **Provider**: model supplier behind an LLM service.
- **Enabled Models**: model set that the current LLM service allows in chat.
- **AI Employee Switcher**: switch current collaborating employee in chat.
- **Model Switcher**: switch model in chat and remember preference per employee.
- **Tool / Skill**: executable capability unit callable by AI.
- **Skill Permission (Ask / Allow)**: whether to require human confirmation before skill calls.
- **Context**: business environment information such as pages, blocks, and data structures.
- **Chat**: one continuous interaction between user and AI Employee.
- **Web Search**: capability that enhances answers with external retrieval.
- **Knowledge Base / RAG**: retrieval-augmented generation with enterprise knowledge.
- **Vector Store**: vectorized storage that provides semantic retrieval for knowledge base.

## Installation

AI Employees are built into NocoBase (`@nocobase/plugin-ai`) and are ready to use without separate installation.
