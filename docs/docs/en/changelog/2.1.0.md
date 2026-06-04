# NocoBase 2.1.0 Release Notes

This is a major upgrade **centered on AI capabilities**. This release lets you bring AI Agents into NocoBase. From CLI integration and AI-assisted building to enhanced AI Employees and an AI development plugin, it covers the full flow from environment onboarding to system building and business collaboration. At the same time, we have continued to substantially round out 2.0 page support and core capabilities — more blocks, fields, actions, and plugins now support 2.0.

## What's New

### Introducing the NocoBase CLI

In this release, the NocoBase CLI (`nb`) is the core entry point for both regular users and AI Agents to connect to NocoBase.

The CLI is used to initialize, connect, and manage NocoBase applications in a local workspace. It covers several scenarios:

- Install a new NocoBase application via Docker, npm, or Git, then save it as a CLI env
- Connect to an existing NocoBase application and save it as a CLI env
- Install, create, and activate plugins
- Operate, back up, and manage NocoBase applications

![NocoBase CLI visual wizard](https://static-docs.nocobase.com/2026-04-29-15-55-19.png)

Whether you want to plug AI into an existing system or spin up a new application from scratch, you can handle initialization and ongoing management through the CLI.

For teams, the CLI provides a standard entry point that AI Agents can understand and operate on — environment initialization, connection configuration, and runtime management all share the same flow.

The official release also adds a set of operations-related commands:

- `nb api`: Call the NocoBase API through the CLI.
- `nb app`: Manage application runtime state: start, stop, restart, logs, and upgrade.
- `nb backup`: Create a backup and download it locally, or restore a local backup file to a target env.
- `nb config`: Manage CLI default configuration.
- `nb db`: Manage the built-in database of the selected env.
- `nb env`: Manage NocoBase project environments, the current env, status, details, and runtime commands.
- `nb license`: Manage commercial licenses and licensed plugins.
- `nb plugin`: Manage plugins of the selected NocoBase env.
- `nb scaffold`: Generate a NocoBase plugin development scaffold.
- `nb self`: Check or update the NocoBase CLI itself.
- `nb source`: Manage local source projects: download, develop, build, and test.

Related documentation:

- [Install NocoBase with the CLI](https://docs.nocobase.com/quickstart/installation/cli)
- [AI Agent integration guide](https://docs.nocobase.com/ai/quick-start)
- [NocoBase CLI command reference](https://docs.nocobase.com/api/cli/)

### AI-assisted building: replace manual configuration with conversation

AI-assisted building is one of the core experiences in this release. You can describe your business needs in natural language, and the AI helps complete data modeling, page configuration, permission setup, and workflow orchestration.

Compared with traditional low-code building, AI-assisted building has several clear advantages:

- A lower barrier to entry — you don't need to be familiar with every configuration concept up front
- A shorter path from requirement description to working prototype
- Data, UI, and workflow configuration can be completed by the AI continuously

For example: "design a CRM data model for me", "create a customer management page for me", or "orchestrate a workflow that automatically deducts inventory after an order is created" — all of these can be handled by the AI within the scope of NocoBase's capabilities.

Related documentation:

- [AI-assisted building quick start](https://docs.nocobase.com/ai-builder/)

### NocoBase Skills cover the full building flow

To help the AI truly understand NocoBase's configuration system, this release ships a set of domain knowledge packs that can be installed into AI Agents — NocoBase Skills.

Skills are standardized knowledge and operation wrappers organized around NocoBase's key capability domains, helping the AI more accurately understand object models, configuration structures, and execution boundaries.

We currently provide 8 Skills that cover the full building flow:

- [Environment management](https://docs.nocobase.com/ai-builder/env-bootstrap) — environment checks, install/deploy, upgrade, and troubleshooting
- [Data modeling](https://docs.nocobase.com/ai-builder/data-modeling) — create and manage tables, fields, and relations
- [UI building](https://docs.nocobase.com/ai-builder/ui-builder) — create and edit pages, blocks, popups, and interaction reactions
- [Workflow management](https://docs.nocobase.com/ai-builder/workflow) — create, edit, enable, and diagnose workflows
- [Permission configuration](https://docs.nocobase.com/ai-builder/acl) — manage roles, permission policies, user bindings, and risk assessment
- [Solutions](https://docs.nocobase.com/ai-builder/dsl-reconciler) — bulk-build entire business systems from YAML (still in beta, with limited stability)
- [Plugin management](https://docs.nocobase.com/ai-builder/plugin-manage) — view, enable, and disable plugins
- [Publish management](https://docs.nocobase.com/ai-builder/publish) — cross-environment publishing, backup/restore, and migration

With Skills, the AI can more accurately understand NocoBase's configuration system and provide smarter assistance when building and managing systems.

**Note**: NocoBase Skills are still being actively improved. NocoBase Skills are also installed automatically when you install and initialize the NocoBase CLI, so in most cases you don't need to install them separately.

Related documentation:

- [NocoBase Skills](https://github.com/nocobase/skills)

### AI development plugin

This release fills in the foundational capabilities needed for AI plugin development, so the AI can take part not only in application building but also in custom plugin development.

This shows up in three main areas:

- A unified `rsbuild/rspack` build pipeline, consolidating plugin development and the frontend build system
- A `client-v2` capability and `/v/` routing system aimed at AI development, preparing for the next-generation client plugin development
- AI plugin development Skills that help the AI better understand plugin structure, code organization, and implementation patterns

Preparation around `client-v2` includes:

- `@nocobase/app` exposes the `client-v2` entry
- The kernel ships a `@nocobase/client-v2` package with base components, utilities, and type definitions
- Each plugin gets a `/src/client-v2` directory
- A new `/v/` route is added — still being actively improved, available for early adopters
- The kernel is gradually migrating to V2
- Plugins are gradually migrating to V2

A unified build pipeline lowers the cost of frontend plugin development and debugging. The gradual rollout of `client-v2` also gives the AI a more stable target structure for generating and maintaining plugin code.

In practice: you can describe a plugin requirement in natural language, and the AI helps generate the frontend and backend code, data tables, APIs, permission configuration, and i18n content.

**Note**: AI plugin development is only for `client-v2`-style new plugins. We will follow up with migration documentation and Skills for moving from `client-v1` plugins to `client-v2`, to help you bring existing plugins into the new system.

Related documentation:

- [AI development plugin quick start](https://docs.nocobase.com/ai-dev/)
- [Plugin development](https://docs.nocobase.com/plugin-development/)

### AI Employees enhancements

AI-assisted building answers "how do I use AI to build a system"; AI Employees answer "how do I let AI work inside the system to solve concrete business problems".

AI Employees existed in earlier releases, but in this release the related capabilities have been enhanced and the AI kernel has been rounded out:

- [MCP support](https://docs.nocobase.com/ai-employees/features/mcp)
- [New AI Employee Atlas](https://docs.nocobase.com/ai-employees/features/built-in-employee#default-ai-employee-atlas), playing a team-leader role and dispatching other AI Employees to complete tasks based on user intent
- [AI Employee workflow node](https://docs.nocobase.com/ai-employees/workflow/nodes/employee/configuration)
- [LLM-based web search tool](https://docs.nocobase.com/ai-employees/features/web-search)
- [New aggregation query tool and report generation tool](https://docs.nocobase.com/ai-employees/scenarios/business-report) for producing business analysis reports
- [New localization engineer Lina](https://docs.nocobase.com/ai-employees/built-in/lina), a built-in AI Employee from the localization plugin used for system localization translation, supporting incremental, selected, and full translation scopes

These improvements take AI Employees' extensibility, orchestration, and execution capabilities inside business systems to the next level. AI Employees can understand the current business context, invoke skills to execute specific tasks, participate in automated workflows, and combine external information to deliver analysis and output.

The official release also adds support for AI Employees to load files from workflow attachment fields and to handle multiple conversations in parallel, further improving the usability of AI Employees in real business processes.

Related documentation:

- [AI Employees](https://docs.nocobase.com/ai-employees/)
- [Lina: Localization engineer](https://docs.nocobase.com/ai-employees/built-in/lina)
- [Translate localization terms with Lina and a local HY-MT1.5-1.8B model](https://docs.nocobase.com/ai-employees/scenarios/localization-hy-mt)

### Multi-app enhancements

In this release, we have made some important enhancements to multi-app deployments, mainly in three areas:

- [New app block and app switcher](https://docs.nocobase.com/multi-app/multi-app/app-block-and-switcher), which let you surface entry points to other sub-applications on a page, making it easy for users to switch between the main app and sub-apps.

![](https://static-docs.nocobase.com/202605271403304.png)

- [New app single sign-on](https://docs.nocobase.com/multi-app/multi-app/app-sso). When a user enters a sub-app from the main app, or switches between sub-apps, the system attempts to automatically sign them in to the target sub-app using the currently logged-in user. Users no longer need to re-enter their credentials in each sub-app.

![](https://static-docs.nocobase.com/202605271406542.png)

- [Calling sub-app APIs](https://docs.nocobase.com/multi-app/multi-app/sub-app-api). In multi-app scenarios, each sub-app has its own independent API, distinguished by path prefix, parameters, and so on, making it easy to call a sub-app's API.

These enhancements are very practical for users running multi-app deployments, making it easier to exchange data and operate across multiple applications and improving the overall collaboration efficiency of multi-app systems.

Related documentation:

- [App block and app switcher](https://docs.nocobase.com/multi-app/multi-app/app-block-and-switcher)
- [App single sign-on](https://docs.nocobase.com/multi-app/multi-app/app-sso)
- [Calling sub-app APIs](https://docs.nocobase.com/multi-app/multi-app/sub-app-api)

### Workflow enhancements

This release enhances the **controllability and observability** of workflows:

- Added timeout control — workflows that run too long are automatically terminated (subflows also support timeout configuration)
- Added created-by and updated-by fields
- Added a log field to node jobs, making it easier to view node logs while debugging
- The Webhook trigger (synchronous mode) returns a 408 response status on timeout

Related documentation:

- [Workflow](https://docs.nocobase.com/workflow/)

### Handwritten signature field

Added a handwritten signature field that lets you draw and save a signature in a form, suitable for approvals, confirmation sheets, receipts, and similar scenarios.

Related documentation:

- [Handwritten signature field](https://docs.nocobase.com/data-sources/field-signature/)

### JS Item action

Added the JS Item action, which lets you run custom logic in an action by writing JS, working together with event flows to meet more flexible interaction needs.

Related documentation:

- [JS Item action](https://docs.nocobase.com/interface-builder/actions/types/js-item)

### 2.0 adaptation and new features

Beyond AI, this release continues to migrate key feature modules to 2.0, while also rolling out new features for real-world business scenarios.

New features

- [Handwritten signature field](https://docs.nocobase.com/data-sources/field-signature/)
- [JS Item action](https://docs.nocobase.com/interface-builder/actions/types/js-item)

2.0 adaptation

- [Custom request](https://docs.nocobase.com/interface-builder/actions/types/custom-request)
- [Tree filter block](https://docs.nocobase.com/interface-builder/blocks/filter-blocks/tree)
- [Calendar block](https://docs.nocobase.com/data-sources/calendar/)
- [Kanban block](https://docs.nocobase.com/interface-builder/blocks/data-blocks/kanban)
- [Gantt block](https://docs.nocobase.com/plugins/@nocobase/plugin-gantt)
- [List block](https://docs.nocobase.com/interface-builder/blocks/data-blocks/list)
- [Grid card block](https://docs.nocobase.com/interface-builder/blocks/data-blocks/grid-card)
- [Map block](https://docs.nocobase.com/plugins/@nocobase/plugin-map)
- [Markdown block](https://docs.nocobase.com/interface-builder/blocks/other-blocks/markdown)
- [iframe block](https://docs.nocobase.com/integration/embed)
- [Chart block / Data visualization](https://docs.nocobase.com/data-visualization)

## Multilingual documentation

- Added Indonesian and Vietnamese documentation
