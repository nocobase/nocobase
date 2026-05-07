---
title: "Building a Custom Display Block"
description: "NocoBase plugin tutorial: Build a configurable HTML display block using BlockModel + registerFlow + uiSchema."
keywords: "Custom Block,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# Building a Custom Display Block

In NocoBase, blocks are content areas on a page. This example demonstrates how to build the simplest custom block using `BlockModel` -- supporting HTML content editing through the UI, allowing users to modify the block's displayed content via a configuration panel.

This is the first example involving FlowEngine, using `BlockModel`, `renderComponent`, `registerFlow`, and `uiSchema`.

:::tip Prerequisites

It's recommended to familiarize yourself with the following content for a smoother development experience:

- [Writing Your First Plugin](../../write-your-first-plugin) -- Plugin creation and directory structure
- [Plugin](../plugin) -- Plugin entry point and `load()` lifecycle
- [FlowEngine Overview](../flow-engine/index.md) -- FlowModel, renderComponent, registerFlow basic usage
- [i18n Internationalization](../component/i18n) -- Translation file conventions and `tExpr()` deferred translation usage

:::

## Final Result

We're building a "Simple block":

- Appears in the "Add Block" menu
- Renders user-configured HTML content
- Allows users to edit HTML through a configuration panel (registerFlow + uiSchema)

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

Full source code is available at [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block). If you want to run it locally:

```bash
yarn pm enable @nocobase-example/plugin-simple-block
```

Let's build this plugin step by step from scratch.

## Step 1: Create the Plugin Skeleton

Run the following in the repository root:

```bash
yarn pm create @my-project/plugin-simple-block
```

This will generate a basic file structure under `packages/plugins/@my-project/plugin-simple-block`. For detailed instructions, see [Writing Your First Plugin](../../write-your-first-plugin).

## Step 2: Create the Block Model

Create `src/client-v2/models/SimpleBlockModel.tsx`. This is the core of the entire plugin -- defining how the block renders and how it's configured.

```tsx
// src/client-v2/models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

// Set the display name in the "Add Block" menu
SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

// Register a configuration panel to let users edit HTML content
SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // Execute before rendering
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema defines the form UI of the configuration panel
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // Default values for the configuration panel
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // Write configuration panel values to model's props
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Key points:

- **`renderComponent()`** -- Renders the block UI, reading HTML content via `this.props.html`
- **`define()`** -- Sets the display name in the "Add Block" menu. `tExpr()` is used for deferred translation because `define()` executes at module load time, when i18n hasn't been initialized yet
- **`registerFlow()`** -- Adds a configuration panel. `uiSchema` defines the form using JSON Schema (syntax reference: [UI Schema](../../../../flow-engine/ui-schema)), `handler` writes user-filled values to `ctx.model.props`, and `renderComponent()` can read them

## Step 3: Add Multilingual Files

Edit the translation files under the plugin's `src/locale/`, adding translations for all keys used by `tExpr()`:

```json
// src/locale/zh-CN.json
{
  "Simple block": "简单区块",
  "Simple Block Flow": "简单区块配置",
  "Edit HTML Content": "编辑 HTML 内容",
  "HTML Content": "HTML 内容"
}
```

```json
// src/locale/en-US.json
{
  "Simple block": "Simple block",
  "Simple Block Flow": "Simple Block Flow",
  "Edit HTML Content": "Edit HTML Content",
  "HTML Content": "HTML Content"
}
```

:::warning Note

Adding language files for the first time requires restarting the application to take effect.

:::

For more about translation file conventions and `tExpr()` usage, see [i18n Internationalization](../component/i18n).

## Step 4: Register in the Plugin

Edit `src/client-v2/plugin.tsx` to lazy-load the model via `registerModelLoaders`:

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleBlockClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        // Lazy loading -- the module is only loaded when first used
        loader: () => import('./models/SimpleBlockModel'),
      },
    });
  }
}

export default PluginSimpleBlockClient;
```

`registerModelLoaders` uses dynamic imports so that model code is only loaded when actually needed -- this is the recommended registration approach.

## Step 5: Enable the Plugin

```bash
yarn pm enable @my-project/plugin-simple-block
```

After enabling, create a new page and click "Add Block" to see "Simple block". Once added, click the block's configuration button to edit the HTML content.

## Full Source Code

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) -- Complete custom display block example

## Summary

Capabilities used in this example:

| Capability          | Usage                              | Documentation                                         |
| ------------------- | ---------------------------------- | ----------------------------------------------------- |
| Block Rendering     | `BlockModel` + `renderComponent()` | [FlowEngine -> Block Extension](../flow-engine/block) |
| Menu Registration   | `define({ label })`                | [FlowEngine Overview](../flow-engine/index.md)        |
| Configuration Panel | `registerFlow()` + `uiSchema`      | [FlowEngine Overview](../flow-engine/index.md)        |
| Model Registration  | `registerModelLoaders` (lazy loading) | [Plugin](../plugin)                                |
| Deferred Translation | `tExpr()`                         | [i18n Internationalization](../component/i18n)        |

## Related Links

- [Writing Your First Plugin](../../write-your-first-plugin) -- Create a plugin skeleton from scratch
- [FlowEngine Overview](../flow-engine/index.md) -- FlowModel basic usage and registerFlow
- [FlowEngine -> Block Extension](../flow-engine/block) -- BlockModel, DataBlockModel, CollectionBlockModel
- [UI Schema](../../../../flow-engine/ui-schema) -- uiSchema syntax reference
- [Component vs FlowModel](../component-vs-flow-model) -- When to use FlowModel
- [Plugin](../plugin) -- Plugin entry point and load() lifecycle
- [i18n Internationalization](../component/i18n) -- Translation file conventions and tExpr usage
- [FlowEngine Complete Documentation](../../../flow-engine/index.md) -- Complete reference for FlowModel, Flow, Context
