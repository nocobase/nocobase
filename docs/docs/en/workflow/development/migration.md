---
title: "v1 to v2 Migration Guide"
description: "Workflow extension development: guide for migrating client-side code from v1 to v2."
keywords: "workflow,migration,v1,v2,NocoBase"
---

# v1 to v2 Client-side Migration Guide

This guide describes how to migrate the client-side code of a workflow extension plugin from v1 to v2. The core change in the v2 client is replacing Formily Schema declarative configuration UIs with a Loader + pure React/antd component approach.

## Overview

### Main Changes

1. **Import path changes**: `@nocobase/plugin-workflow/client` → `@nocobase/plugin-workflow/client-v2`, plugin base class `@nocobase/client` → `@nocobase/client-v2`
2. **Configuration UI pattern changes**: From Formily Schema objects (`fieldset`) to Loader lazy-loaded React components (`FieldsetLoader`)
3. **`scope`/`components` properties removed**: No longer necessary to inject scope objects or components into the Schema; simply import and use them directly in React components

### Import path mapping

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client';

// v2
import { Plugin } from '@nocobase/client-v2';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client-v2';
```

## General Rules

### Loader pattern

v2 uses `LoaderOf`-typed properties to replace v1's `fieldset` and other Formily Schema objects. A Loader is essentially a function that returns `Promise<{ default: ComponentType }>`, enabling code splitting and lazy loading via dynamic `import()`:

```ts
// v1: Formily Schema object
fieldset = {
  interval: {
    type: 'number',
    title: 'Interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: Loader pointing to a React component
FieldsetLoader = () => import('./MyConfig');
```

If you need to point to a named export (rather than the default export), use `.then()` to remap:

```ts
FieldsetLoader = () => import('./MyConfig').then((m) => ({ default: m.MyPresetConfig }));
```

### Configuration component syntax

The component loaded by a Loader is a standard React function component that uses antd's `Form.Item` to build forms. Field paths consistently use the nested array format `['config', 'fieldName']`:

```tsx
// v1: Formily Schema
fieldset = {
  interval: {
    type: 'number',
    title: '{{t("Interval")}}',
    name: 'config.interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: React component
import { Form, InputNumber } from 'antd';

export default function MyConfig() {
  const { t } = useWorkflowTranslation();

  return (
    <Form.Item
      name={['config', 'interval']}
      label={t('Interval')}
      initialValue={60000}
    >
      <InputNumber />
    </Form.Item>
  );
}
```

## Trigger Migration

### Property mapping table

| v1 Property | v2 Property | Description |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | Trigger configuration form |
| `presetFieldset` | `PresetFieldsetLoader` | Preset form on creation |
| `triggerFieldset` | `TriggerFieldsetLoader` | Input form for manual execution |
| `scope` | Removed | No longer needed; import directly in the component |
| `components` | Removed | No longer needed; import directly in the component |
| `view` | Removed | |
| — | `validate(config)` | New; configuration validation |
| — | `createDefaultConfig()` | New; provides default configuration values |

### Migration example

**v1 syntax:**

```ts
import { Trigger } from '@nocobase/plugin-workflow/client';

class MyTrigger extends Trigger {
  title = '{{t("My Trigger")}}';
  fieldset = {
    collection: {
      type: 'string',
      title: '{{t("Collection")}}',
      'x-decorator': 'FormItem',
      'x-component': 'CollectionSelect',
      required: true,
    },
    mode: {
      type: 'number',
      title: '{{t("Mode")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        options: [
          { label: '{{t("Created")}}', value: 1 },
          { label: '{{t("Updated")}}', value: 2 },
        ],
      },
    },
  };
  scope = { /* ... */ };
  components = { CollectionSelect };
}
```

**v2 syntax:**

```ts
import { Trigger } from '@nocobase/plugin-workflow/client-v2';

class MyTrigger extends Trigger {
  title = '{{t("My Trigger")}}';

  PresetFieldsetLoader = () =>
    import('./MyTriggerConfig').then((m) => ({ default: m.MyPresetConfig }));
  FieldsetLoader = () => import('./MyTriggerConfig');
  TriggerFieldsetLoader = () => import('./TriggerMyConfig');

  validate(config) {
    return Boolean(config?.collection && config?.mode);
  }
}
```

```tsx
// MyTriggerConfig.tsx
import { Form, Select } from 'antd';
import { CollectionCascader } from '@nocobase/plugin-workflow/client-v2';

export function MyPresetConfig() {
  return (
    <Form.Item name={['config', 'collection']} label="Collection" rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

export default function MyTriggerConfig() {
  return (
    <>
      <Form.Item name={['config', 'collection']} label="Collection">
        <CollectionCascader disabled />
      </Form.Item>
      <Form.Item name={['config', 'mode']} label="Mode">
        <Select
          options={[
            { label: 'Created', value: 1 },
            { label: 'Updated', value: 2 },
          ]}
        />
      </Form.Item>
    </>
  );
}
```

### Plugin registration

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin);
    workflow.registerTrigger('myTrigger', MyTrigger);
  }
}

// v2
import { Plugin } from '@nocobase/client-v2';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow');
    workflow.registerTrigger('myTrigger', MyTrigger);
  }
}
```

## Node Migration

### Property mapping table

| v1 Property | v2 Property | Description |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | Node configuration drawer form |
| `presetFieldset` | `PresetFieldsetLoader` | Preset form on creation |
| `Component` | `ComponentLoader` | Custom node rendering on the canvas |
| `scope` | Removed | No longer needed; import directly in the component |
| `components` | Removed | No longer needed; import directly in the component |
| `view` | Removed | |
| — | `createDefaultConfig()` | New; provides default configuration values |

### Migration example

**v1 syntax:**

```ts
import WorkflowPlugin, { Instruction } from '@nocobase/plugin-workflow/client';

class MyInstruction extends Instruction {
  title = 'Random string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    digit: {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': { min: 1, max: 10 },
      default: 6,
    },
  };
  useVariables(node, options) {
    return { value: node.key, label: node.title };
  }
}
```

**v2 syntax:**

```ts
import { Instruction } from '@nocobase/plugin-workflow/client-v2';

class MyInstruction extends Instruction {
  title = 'Random string';
  type = 'randomString';
  group = 'extended';

  FieldsetLoader = () => import('./components/RandomStringConfig');

  useVariables(node, options) {
    return { value: node.key, label: node.title };
  }
}
```

```tsx
// components/RandomStringConfig.tsx
import { Form, InputNumber } from 'antd';

export default function RandomStringConfig() {
  return (
    <Form.Item
      name={['config', 'digit']}
      label="Digit"
      initialValue={6}
      rules={[{ required: true }]}
    >
      <InputNumber min={1} max={10} />
    </Form.Item>
  );
}
```

## Other Notes

### Unchanged parts

The following properties and methods have essentially the same signatures in v1 and v2, and can be kept as-is during migration:

- `useVariables(node/config, options)` — Provides variable options
- `useScopeVariables(node, options)` — Provides branch-scoped variables
- `isAvailable(ctx)` — Node availability check (the v2 `NodeAvailableContext` adds a new `engine` property)

### New properties in v2

- `getCreateModelMenuItem` — Defines the configuration for creating sub-model menu items for nodes/triggers on the v2 canvas
- `useTempAssociationSource` — Provides temporary association data source information
- `validate(config)` — Trigger configuration validation (triggers only)
- `branching` — Declares whether the node is a branch node (nodes only)
- `end` — Declares whether the node is a terminal node (nodes only)
- `testable` — Declares whether the node supports test runs (nodes only)

### Value semantic consistency

When migrating, make sure the form values produced by v2 components are consistent with v1, especially the payload shape during manual execution. For example, if the v1 manual execution form stores a complete record object, the v2 version must maintain the same value structure rather than storing only the primary key.
