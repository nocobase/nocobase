---
title: "v1 到 v2 迁移指南"
description: "工作流扩展开发：客户端代码从 v1 迁移到 v2 的指南。"
keywords: "工作流,迁移,v1,v2,NocoBase"
---

# v1 到 v2 客户端迁移指南

本文介绍如何将工作流扩展插件的客户端代码从 v1 迁移到 v2。v2 客户端的核心变化是将配置界面从 Formily Schema 声明式改为 Loader + 纯 React/antd 组件方式。

## 概述

### 主要变化

1. **导入路径变更**：`@nocobase/plugin-workflow/client` → `@nocobase/plugin-workflow/client-v2`，插件基类 `@nocobase/client` → `@nocobase/client-v2`
2. **配置界面模式变更**：从 Formily Schema 对象（`fieldset`）改为 Loader 懒加载的 React 组件（`FieldsetLoader`）
3. **`scope`/`components` 属性移除**：不再需要向 Schema 注入作用域对象或组件，直接在 React 组件中 import 使用即可

### 导入路径对照

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client';

// v2
import { Plugin } from '@nocobase/client-v2';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client-v2';
```

## 通用规则

### Loader 模式

v2 使用 `LoaderOf` 类型的属性替代 v1 的 `fieldset` 等 Formily Schema 对象。Loader 本质是一个返回 `Promise<{ default: ComponentType }>` 的函数，通过动态 `import()` 实现代码分割和懒加载：

```ts
// v1：Formily Schema 对象
fieldset = {
  interval: {
    type: 'number',
    title: 'Interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2：Loader 指向 React 组件
FieldsetLoader = () => import('./MyConfig');
```

如果需要指向文件中的命名导出（而非默认导出），使用 `.then()` 重映射：

```ts
FieldsetLoader = () => import('./MyConfig').then((m) => ({ default: m.MyPresetConfig }));
```

### 配置组件写法

Loader 加载的组件是标准的 React 函数组件，使用 antd 的 `Form.Item` 构建表单，字段路径统一使用 `['config', '字段名']` 的嵌套数组格式：

```tsx
// v1：Formily Schema
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

// v2：React 组件
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

## 触发器迁移

### 属性对照表

| v1 属性 | v2 属性 | 说明 |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | 触发器配置表单 |
| `presetFieldset` | `PresetFieldsetLoader` | 创建时的预设表单 |
| `triggerFieldset` | `TriggerFieldsetLoader` | 手动执行时的输入表单 |
| `scope` | 移除 | 不再需要，直接在组件中 import |
| `components` | 移除 | 不再需要，直接在组件中 import |
| `view` | 移除 | |
| — | `validate(config)` | 新增，配置校验 |
| — | `createDefaultConfig()` | 新增，提供默认配置值 |

### 迁移示例

**v1 写法：**

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

**v2 写法：**

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

### 插件注册方式

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

## 节点迁移

### 属性对照表

| v1 属性 | v2 属性 | 说明 |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | 节点配置抽屉表单 |
| `presetFieldset` | `PresetFieldsetLoader` | 创建时的预设表单 |
| `Component` | `ComponentLoader` | 画布上自定义节点渲染 |
| `scope` | 移除 | 不再需要，直接在组件中 import |
| `components` | 移除 | 不再需要，直接在组件中 import |
| `view` | 移除 | |
| — | `createDefaultConfig()` | 新增，提供默认配置值 |

### 迁移示例

**v1 写法：**

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

**v2 写法：**

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

## 其他注意事项

### 保持不变的部分

以下属性和方法在 v1 和 v2 中签名基本一致，迁移时可以直接保留：

- `useVariables(node/config, options)` — 提供变量选项
- `useScopeVariables(node, options)` — 提供分支局域变量
- `isAvailable(ctx)` — 节点可用性判断（v2 的 `NodeAvailableContext` 新增了 `engine` 属性）

### v2 新增的属性

- `getCreateModelMenuItem` — 定义节点/触发器在 v2 画布上创建子模型菜单项时的配置
- `useTempAssociationSource` — 提供临时关联数据源信息
- `validate(config)` — 触发器配置校验（仅触发器）
- `branching` — 声明节点是否为分支节点（仅节点）
- `end` — 声明节点是否为终止节点（仅节点）
- `testable` — 声明节点是否支持测试运行（仅节点）

### 值语义一致性

迁移时务必确保 v2 组件产生的表单值与 v1 一致，尤其是手动执行时的 payload 形状。例如，如果 v1 的手动执行表单存储完整记录对象，v2 也必须保持相同的值结构，而不能只存储主键。
