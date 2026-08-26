---
title: "Action Extension"
description: "NocoBase action extension development: ActionModel base class, ActionSceneEnum action scenes, custom action buttons."
keywords: "Action Extension,Action,ActionModel,ActionSceneEnum,Action Button,NocoBase"
---

# Action Extension

In NocoBase, an **Action** is a button within a block that triggers business logic — such as "Create", "Edit", "Delete", etc. By extending the `ActionModel` base class, you can add custom action buttons.

## Action Scenes

Each action needs to declare the scene in which it appears, specified via the `static scene` property:

| Scene      | Value                        | Description                                                  |
| ---------- | ---------------------------- | ------------------------------------------------------------ |
| collection | `ActionSceneEnum.collection` | Operates on the collection, e.g., "Create" button            |
| record     | `ActionSceneEnum.record`     | Operates on a single record, e.g., "Edit", "Delete" buttons  |
| both       | `ActionSceneEnum.both`       | Available in both scenes                                     |
| all        | `ActionSceneEnum.all`        | Available in all scenes (including special contexts like dialogs) |

## Examples

### Collection-Level Action

Operates on the entire collection, appears in the action bar at the top of the block:

```tsx
// models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});
```

### Record-Level Action

Operates on a single record, appears in the action column of each table row:

```tsx
// models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});
```

### Available in Both Scenes

If the action doesn't distinguish between scenes, use `ActionSceneEnum.both`:

```tsx
// models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});
```

The structure of all three patterns is identical — the only differences are the `static scene` value and the button text in `defaultProps`.

## Registering Actions

Register with `registerModelLoaders` for lazy loading in the Plugin's `load()` method:

```ts
// plugin.tsx
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
```

After registration, you can add your custom action buttons in the block's "Configure actions" menu.

## Full Source Code

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — Complete example of all three action scenes

## Related Links

- [Plugin Tutorial: Building Custom Action Buttons](../examples/custom-action) — Build action buttons for all three scenes from scratch
- [Plugin Tutorial: Building a Full-Stack Data Management Plugin](../examples/fullstack-plugin) — Custom actions + ctx.viewer.dialog in a real-world complete plugin
- [FlowEngine Overview](../flow-engine/index.md) — FlowModel basics
- [Block Extension](./block) — Custom blocks
- [Field Extension](./field) — Custom field components
- [FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — Complete parameters and event types for registerFlow
- [FlowEngine Full Documentation](../../../flow-engine/index.md) — Complete reference
