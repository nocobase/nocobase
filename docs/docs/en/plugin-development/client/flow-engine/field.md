---
title: "Field Extension"
description: "NocoBase field extension development: FieldModel, ClickableFieldModel base classes, field rendering, binding field interfaces."
keywords: "Field Extension,Field,FieldModel,ClickableFieldModel,renderComponent,bindModelToInterface,NocoBase"
---

# Field Extension

In NocoBase, **Field components** are used in tables and forms to display and edit data. By extending FieldModel-related base classes, you can customize how fields are rendered — such as displaying data in a special format or using a custom component for editing.

## Example: Custom Display Field

The following example creates a simple display field that wraps the field value with square brackets `[]`:

![20260407201138](https://static-docs.nocobase.com/20260407201138.png)

```tsx
// models/SimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    // this.context.record gives you the full record of the current row
    console.log('Current record:', this.context.record);
    console.log('Current record index:', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// Bind to the 'input' field interface type
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

Key points:

- **`renderComponent(value)`** — Receives the current field's value as a parameter and returns the rendered JSX
- **`this.context.record`** — Gets the full data record of the current row
- **`this.context.recordIndex`** — Gets the index of the current row
- **`ClickableFieldModel`** — Extends `FieldModel` with click interaction capabilities
- **`DisplayItemModel.bindModelToInterface()`** — Binds the field model to a specified field interface type (e.g., `input` for text input fields), so that this display component can be selected for fields of that type

## Registering Fields

Register with `registerModelLoaders` for lazy loading in the Plugin's `load()` method:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/SimpleFieldModel'),
      },
    });
  }
}
```

After registration, find a field column of the corresponding type in a table block (for example, the above example binds to `input`, which corresponds to single-line text fields), click the column's configuration button, and you can switch to this custom display component in the "Field component" dropdown menu. For a complete hands-on example, see [Building a Custom Field Component](../examples/custom-field).

![20260407201221](https://static-docs.nocobase.com/20260407201221.png)

## Full Source Code

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — Custom field component example

## Related Links

- [Plugin Tutorial: Building a Custom Field Component](../examples/custom-field) — Build a custom field display component from scratch
- [Plugin Tutorial: Building a Full-Stack Data Management Plugin](../examples/fullstack-plugin) — Custom fields in a real-world complete plugin
- [FlowEngine Overview](../flow-engine/index.md) — FlowModel basics
- [Block Extension](./block) — Custom blocks
- [Action Extension](./action) — Custom action buttons
- [FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — Complete parameters and event types for registerFlow
- [FlowEngine Full Documentation](../../../flow-engine/index.md) — Complete reference
