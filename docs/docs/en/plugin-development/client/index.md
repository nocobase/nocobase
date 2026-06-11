---
title: "Client Plugin Development Overview"
description: "NocoBase client plugin development overview: learning path Plugin -> Router -> Component -> Context -> FlowEngine, with a quick reference table to help locate sections."
keywords: "client plugin,Plugin,Router,Component,Context,FlowEngine,FlowModel,NocoBase"
---

# Overview

NocoBase client plugins can do a lot: register new pages, write custom components, call backend APIs, add blocks and fields, and even extend action buttons. All these capabilities are organized through a unified plugin entry point.

If you already have React development experience, getting started is fast -- most scenarios involve writing regular React components and using NocoBase's context capabilities (such as making requests, internationalization) to integrate with NocoBase. You only need to learn about [FlowEngine](./flow-engine/index.md) when you want your components to appear in NocoBase's visual configuration interface.

:::warning Note

NocoBase is migrating from `client` (v1) to `client-v2`. Currently `client-v2` is still under development. The content in this documentation is for early exploration and is not recommended for production use. New plugins should use the `src/client-v2/` directory and the `@nocobase/client-v2` API.

:::

## Learning Path

It is recommended to learn client plugin development in the following order, from simple to complex:

```
Plugin (entry) -> Router (pages) -> Component (components) -> Context (context) -> FlowEngine (UI extensions)
```

Specifically:

1. **[Plugin](./plugin)**: The plugin entry class. Register routes, models, and other resources in lifecycle methods like `load()`.
2. **[Router](./router)**: Register page routes via `router.add()` and plugin settings pages via `pluginSettingsManager`.
3. **[Component](./component/index.md)**: Routes mount React components. Just use React + Antd by default -- no different from regular frontend development.
4. **[Context](./ctx/index.md)**: In plugins, access context via `this.context`; in components, use `useFlowContext()` to get the context. This gives you access to NocoBase capabilities -- making requests (`ctx.api`), internationalization (`ctx.t`), logging (`ctx.logger`), etc.
5. **[FlowEngine](./flow-engine/index.md)**: If your components need to appear in the "Add Block / Field / Action" menus and support visual configuration by users, you need to wrap them with FlowModel.

The first four steps cover most plugin scenarios. You only need step five when deep integration with NocoBase's UI configuration system is required. If you're unsure which approach to use, see [Component vs FlowModel](./component-vs-flow-model).

## Quick Reference

| I want to...                                     | Where to look                                            |
| ------------------------------------------------ | -------------------------------------------------------- |
| Understand client plugin basic structure          | [Plugin](./plugin)                                       |
| Add a standalone page                             | [Router](./router)                                       |
| Add a plugin settings page                        | [Router](./router)                                       |
| Write a regular React component                   | [Component](./component/index.md)                        |
| Call backend APIs, use NocoBase built-in features  | [Context - Common Capabilities](./ctx/common-capabilities) |
| Customize component styles                        | [Styles & Themes](./component/styles-themes)             |
| Add a new block                                   | [FlowEngine - Block Extension](./flow-engine/block)      |
| Add a new field component                         | [FlowEngine - Field Extension](./flow-engine/field)      |
| Add a new action button                           | [FlowEngine - Action Extension](./flow-engine/action)    |
| Not sure whether to use Component or FlowModel    | [Component vs FlowModel](./component-vs-flow-model)      |
| See a complete plugin example                     | [Plugin Examples](./examples/index.md)                   |

## Related Links

- [Writing Your First Plugin](../write-your-first-plugin) -- Create a runnable plugin from scratch
- [Server-side Development Overview](../server) -- Client plugins typically need server-side counterparts
- [FlowEngine Full Documentation](../../flow-engine/index.md) -- Complete reference for FlowModel, Flow, and Context
- [Project Directory Structure](../project-structure) -- Where plugin files go
