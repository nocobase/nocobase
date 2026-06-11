---
title: "FlowEngine Overview"
description: "NocoBase FlowEngine plugin development guide: FlowModel basics, renderComponent, registerFlow, uiSchema configuration, base class selection."
keywords: "FlowEngine,FlowModel,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# FlowEngine

In NocoBase, the **FlowEngine** is the core engine that drives visual configuration. Blocks, fields, and action buttons in the NocoBase interface are all managed by FlowEngine — including their rendering, configuration panels, and configuration persistence.

![20260403215904](https://static-docs.nocobase.com/20260403215904.png)

For plugin developers, FlowEngine provides two core concepts:

- **FlowModel** — A configurable component model responsible for rendering UI and managing props
- **Flow** — A configuration flow that defines the component's configuration panel and data processing logic

If your component needs to appear in the "Add block / field / action" menu, or needs to support visual configuration by users in the interface, you need to wrap it with a FlowModel. If these capabilities aren't needed, a plain React component is sufficient — see [Component vs FlowModel](../component-vs-flow-model).

## What is FlowModel

Unlike regular React components, FlowModel not only handles UI rendering but also manages where props come from, configuration panel definitions, and configuration persistence. In short: a regular component's props are hardcoded, while FlowModel's props are dynamically generated through Flows.

To learn more about FlowEngine's overall architecture, see [FlowEngine Full Documentation](../../../flow-engine/index.md). Below we introduce how to use it from a plugin developer's perspective.

## Minimal Example

Creating and registering a FlowModel takes three steps:

### 1. Extend a Base Class and Implement renderComponent

```tsx
// models/HelloBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h3>Hello FlowEngine!</h3>
        <p>This is a custom block.</p>
      </div>
    );
  }
}

// define() sets the display name in the menu
HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

`renderComponent()` is the model's rendering method, similar to a React component's `render()`. `tExpr()` is used for deferred translation — because `define()` executes at module load time, when i18n hasn't been initialized yet. See [Context Common Capabilities -> tExpr](../ctx/common-capabilities#texpr) for details.

### 2. Register in the Plugin

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        // Lazy loading — the module is loaded only when first used
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

### 3. Use in the Interface

After registration and enabling the plugin (see [Plugin Development Overview](../../index.md) for enabling plugins), create a new page in the NocoBase interface and click "Add block" to see your "Hello block".

![20260403221815](https://static-docs.nocobase.com/20260403221815.png)

## Adding Configuration with registerFlow

Rendering alone isn't enough — the core value of FlowModel lies in being **configurable**. Using `registerFlow()`, you can add configuration panels to a model, allowing users to modify properties in the interface.

For example, a block that supports editing HTML content:

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    // this.props values come from the Flow handler
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // Execute before rendering
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema defines the configuration panel UI
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // Default values
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // The handler sets the configuration panel values to the model's props
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Key points here:

- **`on: 'beforeRender'`** — Indicates this Flow executes before rendering; configuration panel values are written to `this.props` before rendering
- **`uiSchema`** — Defines the configuration panel UI in JSON Schema format. See [UI Schema](../../../flow-engine/ui-schema) for syntax reference
- **`handler(ctx, params)`** — `params` contains the values the user entered in the configuration panel, which are set to the model via `ctx.model.props`
- **`defaultParams`** — Default values for the configuration panel

## Common uiSchema Patterns

`uiSchema` is based on JSON Schema. v2 is compatible with uiSchema syntax, though its use cases are limited — it's mainly used in Flow configuration panels to describe form UI. For most runtime component rendering, it's recommended to use Ant Design components directly without going through uiSchema.

Here are the most commonly used component types (see [UI Schema](../../../flow-engine/ui-schema) for a complete reference):

```ts
uiSchema: {
  // Text input
  title: {
    type: 'string',
    title: 'Title',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  // Multi-line text
  content: {
    type: 'string',
    title: 'Content',
    'x-decorator': 'FormItem',
    'x-component': 'Input.TextArea',
  },
  // Dropdown select
  type: {
    type: 'string',
    title: 'Type',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    enum: [
      { label: 'Primary', value: 'primary' },
      { label: 'Default', value: 'default' },
      { label: 'Dashed', value: 'dashed' },
    ],
  },
  // Switch
  bordered: {
    type: 'boolean',
    title: 'Show border',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
  },
}
```

Each field is wrapped with `'x-decorator': 'FormItem'`, which automatically adds a title and layout.

## define() Parameter Reference

`FlowModel.define()` sets the model's metadata and controls how it appears in menus. The most commonly used parameter in plugin development is `label`, but it supports more:

| Parameter | Type | Description |
|-----------|------|-------------|
| `label` | `string \| ReactNode` | Display name in the "Add block / field / action" menu. Supports `tExpr()` for deferred translation |
| `icon` | `ReactNode` | Icon in the menu |
| `sort` | `number` | Sort weight; lower numbers appear first. Default is `0` |
| `hide` | `boolean \| (ctx) => boolean` | Whether to hide in the menu. Supports dynamic evaluation |
| `group` | `string` | Group identifier for categorizing into specific menu groups |
| `children` | `SubModelItem[] \| (ctx) => SubModelItem[]` | Sub-menu items. Supports async functions for dynamic construction |
| `toggleable` | `boolean \| (model) => boolean` | Whether toggle behavior is supported (unique within the same parent) |
| `searchable` | `boolean` | Whether sub-menu search is enabled |

Most plugins only need to set `label`:

```ts
MyBlockModel.define({
  label: tExpr('My block'),
});
```

If you need to control sorting or visibility, add `sort` and `hide`:

```ts
MyBlockModel.define({
  label: tExpr('My block'),
  sort: 10,       // Appears later in the list
  hide: (ctx) => !ctx.someCondition,  // Conditionally hidden
});
```

## FlowModel Base Class Selection

NocoBase provides multiple FlowModel base classes. Choose based on what you're extending:

| Base Class             | Purpose                                          | Documentation              |
| ---------------------- | ------------------------------------------------ | -------------------------- |
| `BlockModel`           | Basic block                                      | [Block Extension](./block)  |
| `DataBlockModel`       | Block that fetches its own data                  | [Block Extension](./block)  |
| `CollectionBlockModel` | Bound to a collection, auto-fetches data         | [Block Extension](./block)  |
| `TableBlockModel`      | Full table block with field columns, action bar, etc. | [Block Extension](./block)  |
| `FieldModel`           | Field component                                  | [Field Extension](./field)  |
| `ActionModel`          | Action button                                    | [Action Extension](./action) |

Generally speaking, use `TableBlockModel` for table blocks (most common, out-of-the-box), `CollectionBlockModel` or `BlockModel` for fully custom rendering, `FieldModel` for fields, and `ActionModel` for action buttons.

## Related Links

- [Block Extension](./block) — Develop blocks using the BlockModel series of base classes
- [Field Extension](./field) — Develop custom fields using FieldModel
- [Action Extension](./action) — Develop action buttons using ActionModel
- [Component vs FlowModel](../component-vs-flow-model) — Not sure which approach to use?
- [FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — Complete parameter reference and event type list for registerFlow
- [FlowEngine Full Documentation](../../../flow-engine/index.md) — Complete reference for FlowModel, Flow, and Context
- [FlowEngine Quick Start](../../../flow-engine/quickstart) — Build an orchestratable button component from scratch
- [Plugin Development Overview](../../index.md) — Overall introduction to plugin development
- [UI Schema](../../../flow-engine/ui-schema) — uiSchema syntax reference
