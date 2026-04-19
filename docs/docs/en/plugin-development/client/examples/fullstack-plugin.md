---
title: "Building a Full-Stack Data Management Plugin"
description: "NocoBase plugin tutorial: Server-side data table definition + Client-side TableBlockModel for data display + custom fields and actions, a complete full-stack plugin."
keywords: "Full-Stack,TableBlockModel,defineCollection,ActionModel,ClickableFieldModel,ctx.viewer,NocoBase"
---

# Building a Full-Stack Data Management Plugin

Previous examples were either purely client-side (blocks, fields, actions) or client-side with simple APIs (settings page). This example demonstrates a more complete scenario -- the server defines a data table, the client inherits `TableBlockModel` to get full table capabilities, plus custom field components and custom action buttons, forming a data management plugin with full CRUD functionality.

This example ties together the blocks, fields, and actions learned earlier, showcasing a complete plugin development workflow.

:::tip Prerequisites

It's recommended to familiarize yourself with the following content for a smoother development experience:

- [Writing Your First Plugin](../../write-your-first-plugin) -- Plugin creation and directory structure
- [Plugin](../plugin) -- Plugin entry point and `load()` lifecycle
- [FlowEngine -> Block Extension](../flow-engine/block) -- BlockModel, CollectionBlockModel, TableBlockModel
- [FlowEngine -> Field Extension](../flow-engine/field) -- ClickableFieldModel, bindModelToInterface
- [FlowEngine -> Action Extension](../flow-engine/action) -- ActionModel, ActionSceneEnum
- [i18n Internationalization](../component/i18n) -- Translation file conventions and `tExpr()` usage
- [Server-Side Development Overview](../../server) -- Server-side plugin basics

:::

## Final Result

We're building a "Todo Items" data management plugin with the following capabilities:

- Server-side defines a `todoItems` data table, with sample data auto-inserted on plugin installation
- Client-side inherits `TableBlockModel` for an out-of-the-box table block (field columns, pagination, action bar, etc.)
- Custom field component -- renders the priority field with colored Tags
- Custom action button -- "New Todo" button that opens a dialog form to create records

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_16.32.52.mp4" type="video/mp4">
</video>

Full source code is available at [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource). If you want to run it locally:

```bash
yarn pm enable @nocobase-example/plugin-custom-table-block-resource
```

Let's build this plugin step by step from scratch.

## Step 1: Create the Plugin Skeleton

Run the following in the repository root:

```bash
yarn pm create @my-project/plugin-custom-table-block-resource
```

For detailed instructions, see [Writing Your First Plugin](../../write-your-first-plugin).

## Step 2: Define the Data Table (Server-Side)

Create `src/server/collections/todoItems.ts`. NocoBase will automatically load collection definitions from this directory:

```ts
// src/server/collections/todoItems.ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'todoItems',
  title: 'Todo Items',
  fields: [
    { name: 'title', type: 'string', title: 'Title' },
    {
      name: 'completed',
      type: 'boolean',
      title: 'Completed',
      defaultValue: false,
    },
    {
      name: 'priority',
      type: 'string',
      title: 'Priority',
      defaultValue: 'medium',
    },
  ],
});
```

Unlike the settings page example, there's no need to manually register a resource here -- NocoBase automatically generates standard CRUD APIs (`list`, `get`, `create`, `update`, `destroy`) for each collection.

## Step 3: Configure Permissions and Sample Data (Server-Side)

Edit `src/server/plugin.ts`. Configure ACL permissions in `load()` and insert sample data in `install()`:

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginDataBlockServer extends Plugin {
  async load() {
    // Logged-in users can perform CRUD operations on todoItems
    this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
  }

  async install() {
    // Insert sample data on first plugin installation
    const repo = this.db.getRepository('todoItems');
    const count = await repo.count();
    if (count === 0) {
      await repo.createMany({
        records: [
          { title: 'Learn NocoBase plugin development', completed: true, priority: 'high' },
          { title: 'Build a custom block', completed: false, priority: 'high' },
          { title: 'Write documentation', completed: false, priority: 'medium' },
          { title: 'Add unit tests', completed: false, priority: 'low' },
        ],
      });
    }
  }
}

export default PluginDataBlockServer;
```

Key points:

- **`acl.allow()`** -- `['list', 'get', 'create', 'update', 'destroy']` opens full CRUD permissions, `'loggedIn'` means any logged-in user can access
- **`install()`** -- Only executes on first plugin installation, suitable for inserting initial data
- **`this.db.getRepository()`** -- Gets a data operation object by collection name
- No need for `resourceManager.define()` -- NocoBase automatically generates CRUD APIs for collections

## Step 4: Create the Block Model (Client-Side)

Create `src/client-v2/models/TodoBlockModel.tsx`. Inheriting `TableBlockModel` gives you complete table block capabilities out of the box -- field columns, action bar, pagination, sorting, etc., without needing to write `renderComponent` yourself.

![20260408164204](https://static-docs.nocobase.com/20260408164204.png)

:::tip Tip

In actual plugin development, if you don't need to customize `TableBlockModel`, you don't actually need to inherit and register this block -- just let users select "Table" when adding a block. This article inherits `TableBlockModel` with a `TodoBlockModel` to demonstrate the block model definition and registration process. `TableBlockModel` handles everything else (field columns, action bar, pagination, etc.).

:::

```tsx
// src/client-v2/models/TodoBlockModel.tsx
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  // Restrict to only the todoItems data table
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

`filterCollection` restricts this block to only the `todoItems` data table -- when users add a "Todo block", the data table selection list will only show `todoItems`, not other unrelated tables.

![20260408170026](https://static-docs.nocobase.com/20260408170026.png)

## Step 5: Create a Custom Field Component (Client-Side)

Create `src/client-v2/models/PriorityFieldModel.tsx`. Rendering the priority field with colored Tags is much more intuitive than plain text:

![20260408163645](https://static-docs.nocobase.com/20260408163645.png)

```tsx
// src/client-v2/models/PriorityFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { Tag } from 'antd';
import { tExpr } from '../locale';

const priorityColors: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'green',
};

export class PriorityFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    if (!value) return <span>-</span>;
    return <Tag color={priorityColors[value] || 'default'}>{value}</Tag>;
  }
}

PriorityFieldModel.define({
  label: tExpr('Priority tag'),
});

// Bind to the input (single-line text) field interface type
DisplayItemModel.bindModelToInterface('PriorityFieldModel', ['input']);
```

After registration, you can switch to "Priority tag" in the "Field Component" dropdown menu of the table's priority column configuration.

## Step 6: Create a Custom Action Button (Client-Side)

Create `src/client-v2/models/NewTodoActionModel.tsx`. Clicking the "New Todo" button opens a dialog with `ctx.viewer.dialog()`, where users fill out a form to create a record:

![20260408163810](https://static-docs.nocobase.com/20260408163810.png)

```tsx
// src/client-v2/models/NewTodoActionModel.tsx
import React from 'react';
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource, observable, observer } from '@nocobase/flow-engine';
import { Button, Form, Input, Select, Space, Switch } from 'antd';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

// Use observable to manage loading state, replacing useState
const formState = observable({
  loading: false,
});

// Form component inside the dialog, wrapped with observer to respond to observable changes
const NewTodoForm = observer(function NewTodoForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    const values = await form.validateFields();
    formState.loading = true;
    try {
      await onSubmit(values);
    } finally {
      formState.loading = false;
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={{ priority: 'medium', completed: false }}>
      <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter title' }]}>
        <Input placeholder="Enter todo title" />
      </Form.Item>
      <Form.Item label="Priority" name="priority">
        <Select
          options={[
            { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' },
            { label: 'Low', value: 'low' },
          ]}
        />
      </Form.Item>
      <Form.Item label="Completed" name="completed" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={formState.loading}>
            OK
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
});

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    type: 'primary',
    children: tExpr('New todo'),
  };
}

NewTodoActionModel.define({
  label: tExpr('New todo'),
});

NewTodoActionModel.registerFlow({
  key: 'newTodoFlow',
  title: tExpr('New todo'),
  on: 'click', // Listen for button click events
  steps: {
    openForm: {
      async handler(ctx) {
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        // Use ctx.viewer.dialog to open a dialog
        ctx.viewer.dialog({
          content: (view) => (
            <NewTodoForm
              onSubmit={async (values) => {
                await resource.create(values);
                ctx.message.success(ctx.t('Created successfully'));
                view.close();
              }}
              onCancel={() => view.close()}
            />
          ),
        });
      },
    },
  },
});
```

Key points:

- **`ActionSceneEnum.collection`** -- The button appears in the action bar at the top of the block
- **`on: 'click'`** -- Listens for the button's `click` event via `registerFlow`
- **`ctx.viewer.dialog()`** -- NocoBase's built-in dialog capability. `content` accepts a function, and the `view` parameter can call `view.close()` to close the dialog
- **`resource.create(values)`** -- Calls the data table's create API to create a record; the table automatically refreshes after creation
- **`observable` + `observer`** -- Uses reactive state management from flow-engine instead of `useState`; the component automatically responds to changes in `formState.loading`

## Step 7: Add Multilingual Files

Edit the translation files under the plugin's `src/locale/`:

```json
// src/locale/zh-CN.json
{
  "Todo block": "待办事项区块",
  "Priority tag": "优先级标签",
  "New todo": "新建待办",
  "Todo form": "待办表单",
  "Title": "标题",
  "Priority": "优先级",
  "Completed": "已完成",
  "Created successfully": "创建成功"
}
```

```json
// src/locale/en-US.json
{
  "Todo block": "Todo block",
  "Priority tag": "Priority tag",
  "New todo": "New todo",
  "Todo form": "Todo form",
  "Title": "Title",
  "Priority": "Priority",
  "Completed": "Completed",
  "Created successfully": "Created successfully"
}
```

:::warning Note

Adding language files for the first time requires restarting the application to take effect.

:::

For more about translation file conventions and `tExpr()` usage, see [i18n Internationalization](../component/i18n).

## Step 8: Register in the Plugin (Client-Side)

Edit `src/client-v2/plugin.tsx`. Two things need to be done: register models and register `todoItems` to the client-side data source.

:::warning Note

Manually registering a data table in plugin code via `addCollection` is an **uncommon practice** -- it's only done here to demonstrate the complete full-stack workflow. In real projects, data tables are usually created and configured by users through the NocoBase UI, or managed via APIs / MCP, without needing explicit registration in plugin client code.

:::

Tables defined via `defineCollection` are server-side internal tables that don't appear in the block's data table selection list by default. After manually registering via `addCollection`, users can select `todoItems` when adding blocks.

![20260408164023](https://static-docs.nocobase.com/20260408164023.png)

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

const todoItemsCollection = {
  name: 'todoItems',
  title: 'Todo Items',
  // filterTargetKey must be set, otherwise the collection won't appear in the block's data table selection list
  filterTargetKey: 'id',
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
      interface: 'id',
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Title', 'x-component': 'Input' },
    },
    {
      type: 'boolean',
      name: 'completed',
      interface: 'checkbox',
      uiSchema: { type: 'boolean', title: 'Completed', 'x-component': 'Checkbox' },
    },
    {
      type: 'string',
      name: 'priority',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Priority', 'x-component': 'Input' },
    },
  ],
};

export class PluginCustomTableBlockResourceClientV2 extends Plugin {
  async load() {
    // Register block, field, and action models
    this.flowEngine.registerModelLoaders({
      TodoBlockModel: {
        loader: () => import('./models/TodoBlockModel'),
      },
      PriorityFieldModel: {
        loader: () => import('./models/PriorityFieldModel'),
      },
      NewTodoActionModel: {
        loader: () => import('./models/NewTodoActionModel'),
      },
    });

    // Register todoItems to the client-side data source.
    // Must listen to 'dataSource:loaded' event because ensureLoaded() runs after load(),
    // and it calls setCollections() which clears all collections before re-setting from server.
    // Re-register in the event callback to ensure addCollection survives reload.
    const addTodoCollection = () => {
      const mainDS = this.flowEngine.dataSourceManager.getDataSource('main');
      if (mainDS && !mainDS.getCollection('todoItems')) {
        mainDS.addCollection(todoItemsCollection);
      }
    };

    this.app.eventBus.addEventListener('dataSource:loaded', (event: Event) => {
      if ((event as CustomEvent).detail?.dataSourceKey === 'main') {
        addTodoCollection();
      }
    });
  }
}

export default PluginCustomTableBlockResourceClientV2;
```

Key points:

- **`registerModelLoaders`** -- Lazy-loads and registers three models: block, field, and action
- **`this.app.eventBus`** -- Application-level event bus for listening to lifecycle events
- **`dataSource:loaded` event** -- Fires after data source loading completes. You must call `addCollection` in this event callback because `ensureLoaded()` runs after `load()` and clears then re-sets all collections -- calling `addCollection` directly in `load()` would be overwritten
- **`addCollection()`** -- Registers a collection to the client-side data source. Fields need `interface` and `uiSchema` properties so NocoBase knows how to render them
- **`filterTargetKey: 'id'`** -- Must be set; specifies the field used to uniquely identify records (typically the primary key). If not set, the collection won't appear in the block's data table selection list
- The server-side `defineCollection` handles creating the physical table and ORM mapping, while the client-side `addCollection` lets the UI know the table exists -- both sides work together to complete the full-stack integration

## Step 9: Enable the Plugin

```bash
yarn pm enable @my-project/plugin-custom-table-block-resource
```

After enabling:

1. Create a new page, click "Add Block", select "Todo block", and bind it to the `todoItems` data table
2. The table will automatically load data and display field columns, pagination, etc.
3. Add a "New todo" button from "Configure Actions", click to open a dialog form to create records
4. Switch to "Priority tag" in the priority column's "Field Component" menu to display priorities with colored Tags

<!-- A screenshot of the complete functionality after enabling is needed -->

## Full Source Code

- [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource) -- Complete full-stack data management plugin example

## Summary

Capabilities used in this example:

| Capability            | Usage                                                   | Documentation                                                   |
| --------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| Define Data Table     | `defineCollection()`                                    | [Server -> Collections](../../server/collections)               |
| Access Control        | `acl.allow()`                                           | [Server -> ACL Access Control](../../server/acl)                |
| Initial Data          | `install()` + `repo.createMany()`                       | [Server -> Plugin](../../server/plugin)                         |
| Table Block           | `TableBlockModel`                                       | [FlowEngine -> Block Extension](../flow-engine/block)           |
| Client Collection Registration | `addCollection()` + `eventBus` + `filterTargetKey` | [Plugin](../plugin)                                             |
| Custom Field          | `ClickableFieldModel` + `bindModelToInterface`          | [FlowEngine -> Field Extension](../flow-engine/field)           |
| Custom Action         | `ActionModel` + `registerFlow({ on: 'click' })`        | [FlowEngine -> Action Extension](../flow-engine/action)         |
| Dialog                | `ctx.viewer.dialog()`                                   | [Context -> Common Capabilities](../ctx/common-capabilities)    |
| Reactive State        | `observable` + `observer`                               | [Component Development](../component/index.md)                  |
| Model Registration    | `this.flowEngine.registerModelLoaders()`                | [Plugin](../plugin)                                             |
| Deferred Translation  | `tExpr()`                                               | [i18n Internationalization](../component/i18n)                  |

## Related Links

- [Writing Your First Plugin](../../write-your-first-plugin) -- Create a plugin skeleton from scratch
- [FlowEngine Overview](../flow-engine/index.md) -- FlowModel basic usage and registerFlow
- [FlowEngine -> Block Extension](../flow-engine/block) -- BlockModel, TableBlockModel
- [FlowEngine -> Field Extension](../flow-engine/field) -- ClickableFieldModel, bindModelToInterface
- [FlowEngine -> Action Extension](../flow-engine/action) -- ActionModel, ActionSceneEnum
- [Building a Custom Display Block](./custom-block) -- BlockModel basic example
- [Building a Custom Field Component](./custom-field) -- FieldModel basic example
- [Building a Custom Action Button](./custom-action) -- ActionModel basic example
- [Server-Side Development Overview](../../server) -- Server-side plugin basics
- [Server -> Collections](../../server/collections) -- defineCollection and addCollection
- [Resource API Quick Reference](../../../api/flow-engine/resource.md) -- Complete method signatures for MultiRecordResource / SingleRecordResource
- [Plugin](../plugin) -- Plugin entry point and load() lifecycle
- [i18n Internationalization](../component/i18n) -- Translation file conventions and tExpr usage
- [Server -> ACL Access Control](../../server/acl) -- Permission configuration
- [Server -> Plugin](../../server/plugin) -- Server-side plugin lifecycle
- [Context -> Common Capabilities](../ctx/common-capabilities) -- ctx.viewer, ctx.message, etc.
- [Component Development](../component/index.md) -- Antd Form and other component usage
- [FlowEngine Complete Documentation](../../../flow-engine/index.md) -- Complete reference for FlowModel, Flow, Context
