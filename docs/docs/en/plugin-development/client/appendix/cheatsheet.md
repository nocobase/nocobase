---
title: "Plugin Development Cheatsheet"
description: "NocoBase plugin development cheatsheet: what to do -> which file -> which API to call. Quickly locate where your code should go."
keywords: "Cheatsheet,Registration,File Location,NocoBase"
---

# Plugin Development Cheatsheet

When writing plugins, you often wonder "which file should I put this in and which API should I call?" This cheatsheet helps you quickly find the answer.

## Plugin Directory Structure

Create a plugin with `yarn pm create @my-project/plugin-name`, which automatically generates the following directory structure. Do not create directories manually to avoid missing registration steps that would cause the plugin to not work. See [Writing Your First Plugin](../../write-your-first-plugin) for details.

```bash
plugin-name/
├── src/
│   ├── client-v2/              # Client-side code (v2)
│   │   ├── plugin.tsx          # Client plugin entry
│   │   ├── locale.ts           # useT / tExpr translation hook
│   │   ├── models/             # FlowModel (blocks, fields, actions)
│   │   └── pages/              # Page components
│   ├── client/                 # Client-side code (v1, compatible)
│   │   ├── plugin.tsx
│   │   ├── locale.ts
│   │   ├── models/
│   │   └── pages/
│   ├── server/                 # Server-side code
│   │   ├── plugin.ts           # Server plugin entry
│   │   └── collections/        # Data table definitions
│   └── locale/                 # Multilingual translation files
│       ├── zh-CN.json
│       └── en-US.json
├── client-v2.js                # Root entry (points to build output)
├── client-v2.d.ts
├── client.js
├── client.d.ts
├── server.js
├── server.d.ts
└── package.json
```

## Client-Side: What I Want to Do -> How to Write It

| What I want to do | Which file | Which API | Docs |
| --- | --- | --- | --- |
| Register a page route | `plugin.tsx`'s `load()` | `this.router.add()` | [Router](../router) |
| Register a plugin settings page | `plugin.tsx`'s `load()` | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router](../router) |
| Register a custom block | `plugin.tsx`'s `load()` | `this.flowEngine.registerModelLoaders()` | [FlowEngine - Block Extension](../flow-engine/block) |
| Register a custom field | `plugin.tsx`'s `load()` | `this.flowEngine.registerModelLoaders()` | [FlowEngine - Field Extension](../flow-engine/field) |
| Register a custom action | `plugin.tsx`'s `load()` | `this.flowEngine.registerModelLoaders()` | [FlowEngine - Action Extension](../flow-engine/action) |
| Make an internal table appear in block data source selection | `plugin.tsx`'s `load()` | `mainDS.addCollection()` | [Collections](../../server/collections) |
| Translate plugin text | `locale/zh-CN.json` + `locale/en-US.json` | — | [i18n Internationalization](../component/i18n) |

## Server-Side: What I Want to Do -> How to Write It

| What I want to do | Which file | Which API | Docs |
| --- | --- | --- | --- |
| Define a data table | `server/collections/xxx.ts` | `defineCollection()` | [Collections](../../server/collections) |
| Extend an existing data table | `server/collections/xxx.ts` | `extendCollection()` | [Collections](../../server/collections) |
| Register a custom API endpoint | `server/plugin.ts`'s `load()` | `this.app.resourceManager.define()` | [ResourceManager](../../server/resource-manager) |
| Configure API permissions | `server/plugin.ts`'s `load()` | `this.app.acl.allow()` | [ACL](../../server/acl) |
| Write initial data on plugin install | `server/plugin.ts`'s `install()` | `this.db.getRepository().create()` | [Plugin](../../server/plugin) |

## FlowModel Cheatsheet

| What I want to do | Which base class to extend | Key API |
| --- | --- | --- |
| Build a display-only block | `BlockModel` | `renderComponent()` + `define()` |
| Build a data-bound block (custom rendering) | `CollectionBlockModel` | `createResource()` + `renderComponent()` |
| Build a full table block (customizing the built-in table) | `TableBlockModel` | `filterCollection()` + `customModelClasses` |
| Build a field display component | `ClickableFieldModel` | `renderComponent(value)` + `bindModelToInterface()` |
| Build an action button | `ActionModel` | `static scene` + `registerFlow({ on: 'click' })` |

## Translation Method Cheatsheet

| Context | What to use | Where to import |
| --- | --- | --- |
| In Plugin `load()` | `this.t('key')` | Built into Plugin base class |
| In React components | `const t = useT(); t('key')` | `locale.ts` |
| In FlowModel static definitions (`define()`, `registerFlow()`) | `tExpr('key')` | `locale.ts` |

## Common API Call Cheatsheet

| What I want to do | In Plugin | In Components |
| --- | --- | --- |
| Send an API request | `this.context.api.request()` | `ctx.api.request()` |
| Get translations | `this.t()` | `useT()` |
| Get logger | `this.context.logger` | `ctx.logger` |
| Register a route | `this.router.add()` | — |
| Navigate to a page | — | `ctx.router.navigate()` |
| Open a dialog | — | `ctx.viewer.dialog()` |

## Related Links

- [Client Development Overview](../index.md) — Learning path and quick index
- [Plugin](../plugin) — Plugin entry and lifecycle
- [FAQ & Troubleshooting Guide](./faq) — Common pitfalls
- [Router](../router) — Page route registration
- [FlowEngine - Block Extension](../flow-engine/block) — BlockModel base classes
- [FlowEngine - Field Extension](../flow-engine/field) — FieldModel development
- [FlowEngine - Action Extension](../flow-engine/action) — ActionModel development
- [Collections](../../server/collections) — defineCollection and field types
- [i18n Internationalization](../component/i18n) — Translation file format
- [ResourceManager](../../server/resource-manager) — Custom REST APIs
- [ACL](../../server/acl) — Permission configuration
- [Plugin (Server)](../../server/plugin) — Server plugin lifecycle
- [Writing Your First Plugin](../../write-your-first-plugin) — Plugin scaffolding
