---
title: "Building a Custom Field Component"
description: "NocoBase plugin tutorial: Build a custom field display component using ClickableFieldModel and bind it to a field interface."
keywords: "Custom Field,FieldModel,ClickableFieldModel,bindModelToInterface,Field Extension,NocoBase"
---

# Building a Custom Field Component

In NocoBase, field components are used to display and edit data in tables and forms. This example demonstrates how to build a custom field display component using `ClickableFieldModel` -- adding square brackets `[]` around the field value, and binding it to the `input` type field interface.

:::tip Prerequisites

It's recommended to familiarize yourself with the following content for a smoother development experience:

- [Writing Your First Plugin](../../write-your-first-plugin) -- Plugin creation and directory structure
- [Plugin](../plugin) -- Plugin entry point and `load()` lifecycle
- [FlowEngine Overview](../flow-engine/index.md) -- FlowModel basic usage
- [FlowEngine -> Field Extension](../flow-engine/field) -- FieldModel, ClickableFieldModel base class introduction
- [i18n Internationalization](../component/i18n) -- Translation file conventions and `tExpr()` deferred translation usage

:::

## Final Result

We're building a custom field display component:

- Inherits `ClickableFieldModel` with custom rendering logic
- Displays the field value wrapped in `[]`
- Bound to the `input` (single-line text) field type via `bindModelToInterface`

After enabling the plugin, find a single-line text field column in a table block, click the column's configuration button, and you'll see the `DisplaySimpleFieldModel` option in the "Field Component" dropdown menu. After switching to it, the column's values will display in `[value]` format.

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_20.08.48.mp4" type="video/mp4">
</video>

Full source code is available at [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple). If you want to run it locally:

```bash
yarn pm enable @nocobase-example/plugin-field-simple
```

Let's build this plugin step by step from scratch.

## Step 1: Create the Plugin Skeleton

Run the following in the repository root:

```bash
yarn pm create @my-project/plugin-field-simple
```

For detailed instructions, see [Writing Your First Plugin](../../write-your-first-plugin).

## Step 2: Create the Field Model

Create `src/client-v2/models/DisplaySimpleFieldModel.tsx`. This is the core of the plugin -- defining how the field renders and which field interface it binds to.

```tsx
// src/client-v2/models/DisplaySimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    // this.context.record gives you the complete record of the current row
    console.log('Current record:', this.context.record);
    console.log('Current record index:', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// Set the display name in the "Field Component" dropdown menu
DisplaySimpleFieldModel.define({
  label: tExpr('Simple field'),
});

// Bind to the 'input' (single-line text) field interface type
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

Key points:

- **`renderComponent(value)`** -- Receives the current field's value as a parameter and returns the rendered JSX
- **`this.context.record`** -- Gets the complete data record of the current row
- **`this.context.recordIndex`** -- Gets the index of the current row
- **`ClickableFieldModel`** -- Extends `FieldModel` with click interaction capabilities
- **`define({ label })`** -- Sets the display name in the "Field Component" dropdown menu; without it, the class name would be displayed directly
- **`DisplayItemModel.bindModelToInterface()`** -- Binds the field model to specified field interface types (e.g., `input` for single-line text fields), making this display component selectable for fields of that type

## Step 3: Add Multilingual Files

Edit the translation files under the plugin's `src/locale/`, adding translations for all keys used by `tExpr()`:

```json
// src/locale/zh-CN.json
{
  "Simple field": "简单字段"
}
```

```json
// src/locale/en-US.json
{
  "Simple field": "Simple field"
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

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/DisplaySimpleFieldModel'),
      },
    });
  }
}

export default PluginFieldSimpleClient;
```

## Step 5: Enable the Plugin

```bash
yarn pm enable @my-project/plugin-field-simple
```

After enabling, find a single-line text field column in a table block, click the column's configuration button, and switch to this custom display component in the "Field Component" dropdown menu.

## Full Source Code

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) -- Complete custom field component example

## Summary

Capabilities used in this example:

| Capability              | Usage                                            | Documentation                                         |
| ----------------------- | ------------------------------------------------ | ----------------------------------------------------- |
| Field Rendering         | `ClickableFieldModel` + `renderComponent(value)` | [FlowEngine -> Field Extension](../flow-engine/field) |
| Bind Field Interface    | `DisplayItemModel.bindModelToInterface()`        | [FlowEngine -> Field Extension](../flow-engine/field) |
| Model Registration      | `this.flowEngine.registerModelLoaders()`         | [Plugin](../plugin)                                   |

## Related Links

- [Writing Your First Plugin](../../write-your-first-plugin) -- Create a plugin skeleton from scratch
- [FlowEngine Overview](../flow-engine/index.md) -- FlowModel basic usage
- [FlowEngine -> Field Extension](../flow-engine/field) -- FieldModel, ClickableFieldModel, bindModelToInterface
- [FlowEngine -> Block Extension](../flow-engine/block) -- Custom blocks
- [Component vs FlowModel](../component-vs-flow-model) -- When to use FlowModel
- [Plugin](../plugin) -- Plugin entry point and load() lifecycle
- [i18n Internationalization](../component/i18n) -- Translation file conventions and tExpr usage
- [FlowEngine Complete Documentation](../../../flow-engine/index.md) -- Complete reference for FlowModel, Flow, Context
