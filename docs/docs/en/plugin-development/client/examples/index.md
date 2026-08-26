---
title: "Plugin Tutorial Examples"
description: "NocoBase client plugin complete tutorial examples: settings page, custom block, full-stack integration, custom field -- complete plugins from start to finish."
keywords: "Plugin Examples,Tutorial Examples,Complete Plugin,NocoBase"
---

# Plugin Tutorial Examples

Previous chapters introduced various capabilities including [Plugin](../plugin), [Router](../router), [Component](../component/index.md), [Context](../ctx/index.md), [FlowEngine](../flow-engine/index.md), etc. This chapter ties them together -- through several complete tutorial examples, demonstrating the entire process of building a plugin from creation to completion.

Each example corresponds to a runnable example plugin that you can view the source code of or run locally.

## Example List

| Example | Capabilities Involved | Difficulty |
| --- | --- | --- |
| [Building a Plugin Settings Page](./settings-page) | Plugin + Router + Component + Context + Server | Beginner |
| [Building a Custom Display Block](./custom-block) | Plugin + FlowEngine (BlockModel) | Beginner |
| [Building a Custom Field Component](./custom-field) | Plugin + FlowEngine (FieldModel) | Beginner |
| [Building a Custom Action Button](./custom-action) | Plugin + FlowEngine (ActionModel) | Beginner |
| [Building a Full-Stack Data Management Plugin](./fullstack-plugin) | Plugin + FlowEngine (TableBlockModel + FieldModel + ActionModel) + Server | Intermediate |

It's recommended to read them in order. The first example uses React components + a simple server API without involving FlowEngine; the middle three demonstrate FlowEngine's block, field, and action base classes respectively; the last one ties together the blocks, fields, and actions learned earlier, adds a server-side data table, and forms a complete full-stack plugin. If you're not sure whether to use React components or FlowModel, check [Component vs FlowModel](../component-vs-flow-model) first.

## Related Links

- [Writing Your First Plugin](../../write-your-first-plugin) -- Create a runnable plugin from scratch
- [Client Development Overview](../index.md) -- Learning path and quick index
- [FlowEngine Overview](../flow-engine/index.md) -- FlowModel basic usage and registerFlow
- [FlowEngine Complete Documentation](../../../flow-engine/index.md) -- Complete reference for FlowModel, Flow, Context
- [Component vs FlowModel](../component-vs-flow-model) -- Choosing between components and FlowModel
