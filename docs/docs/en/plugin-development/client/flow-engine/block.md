---
title: "Block Extension"
description: "NocoBase block extension development: BlockModel, DataBlockModel, CollectionBlockModel, TableBlockModel base classes and registration."
keywords: "Block Extension,Block,BlockModel,DataBlockModel,CollectionBlockModel,TableBlockModel,renderComponent,NocoBase"
---

# Block Extension

In NocoBase, a **Block** is a content area on the page — such as a table, form, chart, detail view, etc. By extending the BlockModel series of base classes, you can create custom blocks and register them in the "Add block" menu.

## Choosing a Base Class

NocoBase provides three block base classes. Choose based on your data requirements:

| Base Class             | Inheritance                           | Use Case                                                       |
| ---------------------- | ------------------------------------- | -------------------------------------------------------------- |
| `BlockModel`           | The most basic block                  | Display blocks that don't need a data source                   |
| `DataBlockModel`       | Extends `BlockModel`                  | Needs data but not bound to a NocoBase collection              |
| `CollectionBlockModel` | Extends `DataBlockModel`              | Bound to a NocoBase collection, automatically fetches data     |
| `TableBlockModel`      | Extends `CollectionBlockModel`        | Full table block with built-in field columns, action bar, pagination, etc. |

The inheritance chain is: `BlockModel` -> `DataBlockModel` -> `CollectionBlockModel` -> `TableBlockModel`.

Generally speaking, if you want an out-of-the-box table block, use `TableBlockModel` directly — it comes with field columns, action bar, pagination, sorting, and other complete capabilities, making it the most commonly used base class. If you need fully custom rendering (such as a card list, timeline, etc.), use `CollectionBlockModel` and write your own `renderComponent`. If you just need to display static content or a custom UI, `BlockModel` is sufficient.

`DataBlockModel` has a special role — it doesn't add any new properties or methods; its class body is empty. Its purpose is **classification**: blocks that extend `DataBlockModel` are grouped under the "Data blocks" menu in the UI. If your block needs to manage its own data fetching logic (not using NocoBase's standard Collection binding), you can extend `DataBlockModel`. For example, the chart plugin's `ChartBlockModel` works this way — it uses a custom `ChartResource` to fetch data without needing standard collection binding. In most cases, you don't need to use `DataBlockModel` directly; `CollectionBlockModel` or `TableBlockModel` will suffice.

## BlockModel Example

A simple block that supports editing HTML content:

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

This example covers the three steps of block development:

1. **`renderComponent()`** — Renders the block UI, reading properties via `this.props`
2. **`define()`** — Sets the display name in the "Add block" menu
3. **`registerFlow()`** — Adds a visual configuration panel, allowing users to edit HTML content in the interface

## CollectionBlockModel Example

If a block needs to be bound to a NocoBase collection, use `CollectionBlockModel`. It automatically handles data fetching:

```tsx
// models/ManyRecordBlockModel.tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '@nocobase/flow-engine';

export class ManyRecordBlockModel extends CollectionBlockModel {
  // Declare this as a multi-record block
  static scene = BlockSceneEnum.many;

  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    return (
      <div>
        <h3>Collection Block</h3>
        {/* resource.getData() fetches data from the collection */}
        <pre>{JSON.stringify(this.resource.getData(), null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records'),
});
```

Compared to `BlockModel`, `CollectionBlockModel` adds the following:

- **`static scene`** — Declares the block scene. Common values: `BlockSceneEnum.many` (multi-record list), `BlockSceneEnum.one` (single-record detail/form). The full enum also includes `new`, `select`, `filter`, `subForm`, `bulkEditForm`, etc.
- **`createResource()`** — Creates a data resource; `MultiRecordResource` is used for fetching multiple records
- **`this.resource.getData()`** — Fetches data from the collection

## TableBlockModel Example

`TableBlockModel` extends `CollectionBlockModel` and is NocoBase's built-in full-featured table block — it comes with field columns, action bar, pagination, sorting, and more. When users select "Table" in "Add block", this is what they get.

Generally speaking, if the built-in `TableBlockModel` meets your needs, users can simply add it from the interface, and developers don't need to do anything. You only need to extend it when you want to **customize on top of TableBlockModel** — for example:

- Override `customModelClasses` to replace built-in action groups or field column models
- Use `filterCollection` to restrict availability to specific collections
- Register additional Flows to add custom configuration options

```tsx
// Example: A table block restricted to the todoItems collection
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

For a complete `TableBlockModel` customization example, see [Building a Full-Stack Data Management Plugin](../examples/fullstack-plugin).

## Registering Blocks

Register in the Plugin's `load()` method:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        loader: () => import('./models/SimpleBlockModel'),
      },
      ManyRecordBlockModel: {
        loader: () => import('./models/ManyRecordBlockModel'),
      },
    });
  }
}
```

After registration, you can see your custom blocks by clicking "Add block" in the NocoBase interface.

## Full Source Code

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — BlockModel example
- [@nocobase-example/plugin-collection-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-collection-block) — CollectionBlockModel example

## Related Links

- [Plugin Tutorial: Building a Custom Display Block](../examples/custom-block) — Build a configurable BlockModel block from scratch
- [Plugin Tutorial: Building a Full-Stack Data Management Plugin](../examples/fullstack-plugin) — A complete example with TableBlockModel + custom fields + custom actions
- [FlowEngine Overview](../flow-engine/index.md) — FlowModel basics and registerFlow
- [Field Extension](./field) — Custom field components
- [Action Extension](./action) — Custom action buttons
- [Resource API Cheat Sheet](../../../api/flow-engine/resource.md) — Complete method signatures for MultiRecordResource / SingleRecordResource
- [FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — Complete parameters and event types for registerFlow
- [FlowEngine Full Documentation](../../../flow-engine/index.md) — Complete reference
