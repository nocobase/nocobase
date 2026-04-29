---
title: "Building a Custom Action Button"
description: "NocoBase plugin tutorial: Build custom action buttons using ActionModel + ActionSceneEnum, supporting both collection-level and record-level actions."
keywords: "Custom Action,ActionModel,ActionSceneEnum,Action Button,NocoBase"
---

# Building a Custom Action Button

In NocoBase, actions are buttons within blocks that trigger business logic -- such as "Create", "Edit", "Delete", etc. This example demonstrates how to build custom action buttons using `ActionModel` and control the scenarios where buttons appear using `ActionSceneEnum`.

:::tip Prerequisites

It's recommended to familiarize yourself with the following content for a smoother development experience:

- [Writing Your First Plugin](../../write-your-first-plugin) -- Plugin creation and directory structure
- [Plugin](../plugin) -- Plugin entry point and `load()` lifecycle
- [FlowEngine -> Action Extension](../flow-engine/action) -- ActionModel, ActionSceneEnum introduction
- [i18n Internationalization](../component/i18n) -- Translation file conventions and `tExpr()` deferred translation usage

:::

## Final Result

We'll build three custom action buttons, each corresponding to a different action scenario:

- **Collection-level action** (`collection`) -- Appears in the action bar at the top of the block, next to the "Create" button
- **Record-level action** (`record`) -- Appears in the action column of each table row, next to "Edit" and "Delete"
- **Both** (`both`) -- Appears in both scenarios

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

Full source code is available at [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action). If you want to run it locally:

```bash
yarn pm enable @nocobase-example/plugin-simple-action
```

Let's build this plugin step by step from scratch.

## Step 1: Create the Plugin Skeleton

Run the following in the repository root:

```bash
yarn pm create @my-project/plugin-simple-action
```

For detailed instructions, see [Writing Your First Plugin](../../write-your-first-plugin).

## Step 2: Create Action Models

Each action needs to declare the scenario it appears in via the `static scene` property:

| Scenario   | Value                        | Description                                               |
| ---------- | ---------------------------- | --------------------------------------------------------- |
| collection | `ActionSceneEnum.collection` | Acts on the data table, e.g., the "Create" button         |
| record     | `ActionSceneEnum.record`     | Acts on a single record, e.g., "Edit" and "Delete" buttons |
| both       | `ActionSceneEnum.both`       | Available in both scenarios                                |

### Collection-Level Action

Create `src/client-v2/models/SimpleCollectionActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});

// Listen for click events via registerFlow, and provide user feedback with ctx.message
SimpleCollectionActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple collection action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.success(ctx.t('Collection action clicked'));
      },
    },
  },
});
```

### Record-Level Action

Create `src/client-v2/models/SimpleRecordActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});

// Record-level actions can access the current row's data and index via ctx.model.context
SimpleRecordActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple record action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        const index = ctx.model.context.recordIndex;
        const record = ctx.model.context.record;
        const id = record?.id;
        ctx.message.info(ctx.t('Record action clicked, record ID: {{id}}, row index: {{index}}', { id, index }));
      },
    },
  },
});
```

### Both Scenarios

Create `src/client-v2/models/SimpleBothActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});

SimpleBothActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple both action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.info(ctx.t('Both action clicked'));
      },
    },
  },
});
```

The structure of all three is identical -- the only differences are the `static scene` value and button text. Each button listens for click events via `registerFlow({ on: 'click' })` and uses `ctx.message` to display a notification so users can see the button is working.

## Step 3: Add Multilingual Files

Edit the translation files under the plugin's `src/locale/`:

```json
// src/locale/zh-CN.json
{
  "Simple collection action": "简单数据表操作",
  "Simple record action": "简单记录操作",
  "Simple both action": "简单通用操作",
  "Collection action clicked": "数据表操作被点击了",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "记录操作被点击了，记录 ID：{{id}}，行索引：{{index}}",
  "Both action clicked": "通用操作被点击了"
}
```

```json
// src/locale/en-US.json
{
  "Simple collection action": "Simple collection action",
  "Simple record action": "Simple record action",
  "Simple both action": "Simple both action",
  "Collection action clicked": "Collection action clicked",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "Record action clicked, record ID: {{id}}, row index: {{index}}",
  "Both action clicked": "Both action clicked"
}
```

:::warning Note

Adding language files for the first time requires restarting the application to take effect.

:::

For more about translation file conventions and `tExpr()` usage, see [i18n Internationalization](../component/i18n).

## Step 4: Register in the Plugin

Edit `src/client-v2/plugin.tsx` to register with lazy-loading via `registerModelLoaders`:

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleActionClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleCollectionActionModel: {
        loader: () => import('./models/SimpleCollectionActionModel'),
      },
      SimpleRecordActionModel: {
        loader: () => import('./models/SimpleRecordActionModel'),
      },
      SimpleBothActionModel: {
        loader: () => import('./models/SimpleBothActionModel'),
      },
    });
  }
}

export default PluginSimpleActionClient;
```

## Step 5: Enable the Plugin

```bash
yarn pm enable @my-project/plugin-simple-action
```

Once enabled, you can add these custom action buttons from the "Configure Actions" menu in table blocks.

## Full Source Code

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) -- Complete example of three action scenarios

## Summary

Capabilities used in this example:

| Capability      | Usage                                                | Documentation                                          |
| --------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| Action Button   | `ActionModel` + `static scene`                       | [FlowEngine -> Action Extension](../flow-engine/action) |
| Action Scenario | `ActionSceneEnum.collection / record / both / all`   | [FlowEngine -> Action Extension](../flow-engine/action) |
| Menu Registration | `define({ label })`                                | [FlowEngine Overview](../flow-engine/index.md)         |
| Model Registration | `this.flowEngine.registerModelLoaders()`          | [Plugin](../plugin)                                    |
| Deferred Translation | `tExpr()`                                      | [i18n Internationalization](../component/i18n)         |

## Related Links

- [Writing Your First Plugin](../../write-your-first-plugin) -- Create a plugin skeleton from scratch
- [FlowEngine Overview](../flow-engine/index.md) -- FlowModel basic usage
- [FlowEngine -> Action Extension](../flow-engine/action) -- ActionModel, ActionSceneEnum
- [FlowEngine -> Block Extension](../flow-engine/block) -- Custom blocks
- [FlowEngine -> Field Extension](../flow-engine/field) -- Custom field components
- [Component vs FlowModel](../component-vs-flow-model) -- When to use FlowModel
- [Plugin](../plugin) -- Plugin entry point and load() lifecycle
- [i18n Internationalization](../component/i18n) -- Translation file conventions and tExpr usage
- [FlowEngine Complete Documentation](../../../flow-engine/index.md) -- Complete reference for FlowModel, Flow, Context
