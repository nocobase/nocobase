---
title: "扩展触发器类型"
description: "扩展触发器类型：自定义触发器开发、配置界面、触发逻辑、API 参考。"
keywords: "工作流,扩展触发器,自定义触发器,触发器开发,NocoBase"
---

# 扩展触发器类型

每个工作流都必须配置特定的触发器，作为启动流程执行的入口。

触发器类型通常代表特定的系统环境事件。在应用运行周期中，任何提供了可被订阅的事件环节都可以用于触发器类型的定义。例如接收请求、数据表操作、定时任务等。

触发器类型基于字符串标识注册在插件的触发器表中，工作流插件内置了几种触发器：

- `'collection'`：数据表操作触发；
- `'schedule'`：定时任务触发；
- `'action'`：操作后事件触发；


扩展的触发器类型需要保证标识唯一，在服务端注册触发器的订阅/取消订阅的实现，在客户端注册界面配置的实现。

## 服务端

任意触发器需要继承自 `Trigger` 基类，并实现 `on`/`off` 方法，分别用于订阅和取消订阅具体的环境事件。在 `on` 方法中，需要在具体的事件回调函数中调用 `this.workflow.trigger()`，以最终触发事件。另外在 `off` 方法中，需要做取消订阅的相关清理工作。

其中 `this.workflow` 是 `Trigger` 基类在构造函数中传入的工作流插件实例。

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.workflow.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }

  off(workflow) {
    // unregister event
    clearInterval(this.timer);
  }
}
```

之后在对工作流进行扩展的插件中将触发器实例注册到工作流引擎上：

```ts
import WorkflowPlugin from '@nocobase/plugin-workflow';

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;

    // register trigger
    workflowPlugin.registerTrigger('interval', MyTrigger);
  }
}
```

服务端启动加载以后，`'interval'` 类型的触发器就可以被添加和执行了。

## 客户端

客户端的部分主要根据触发器类型所需的配置项提供配置界面。每种触发器类型同样需要向工作流插件注册相应的类型配置。

触发器的配置界面通过 Loader（懒加载函数）来定义，Loader 指向一个纯 React 组件，使用 antd 的 `Form.Item` 构建表单。

### 最简单的触发器

例如对上面的定时执行的触发器，定义配置界面表单中需要的间隔时间配置项（`interval`）：

```ts
import { Trigger } from '@nocobase/plugin-workflow/client-v2';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';

  // 触发器配置表单（懒加载组件）
  FieldsetLoader = () => import('./IntervalConfig');

  // 配置校验
  validate(config) {
    return Boolean(config?.interval);
  }
}
```

其中 `FieldsetLoader` 是一个返回 `Promise<{ default: ComponentType }>` 的函数，通过动态 `import()` 实现懒加载。它指向的组件是一个标准的 React 函数组件：

```tsx
// IntervalConfig.tsx
import { Form, InputNumber } from 'antd';

export default function IntervalConfig() {
  return (
    <Form.Item
      name={['config', 'interval']}
      label="Interval"
      initialValue={60000}
      rules={[{ required: true }]}
    >
      <InputNumber min={1000} />
    </Form.Item>
  );
}
```

注意表单字段的 `name` 使用嵌套数组格式 `['config', '字段名']`，这是 antd Form 的标准写法。

### 多个配置界面

触发器可以提供多个配置界面，分别用于不同的场景：

- `PresetFieldsetLoader` — 创建工作流时的预设表单（通常只包含必填项）
![PresetFieldsetLoader](https://static-docs.nocobase.com/20260701152711.png)

- `FieldsetLoader` — 触发器完整配置表单（在配置抽屉中显示）
![FieldsetLoader](https://static-docs.nocobase.com/20260701152822.png)

- `TriggerFieldsetLoader` — 手动执行时的输入表单
![FieldsetLoader](https://static-docs.nocobase.com/20260701152846.png)

当 Loader 需要指向文件中的命名导出（而非默认导出）时，使用 `.then()` 重映射：

```ts
class MyTrigger extends Trigger {
  title = 'My trigger';

  PresetFieldsetLoader = () =>
    import('./MyTriggerConfig').then((m) => ({ default: m.MyPresetConfig }));
  FieldsetLoader = () => import('./MyTriggerConfig');
  TriggerFieldsetLoader = () => import('./TriggerMyConfig');

  validate(config) {
    return Boolean(config?.collection && config?.mode);
  }

  createDefaultConfig() {
    return { mode: 1 };
  }
}
```

```tsx
// MyTriggerConfig.tsx
import { Form, Select } from 'antd';
import { CollectionCascader } from '@nocobase/plugin-workflow/client-v2';

// 创建时的预设表单（命名导出）
export function MyPresetConfig() {
  return (
    <Form.Item name={['config', 'collection']} label="Collection" rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

// 完整配置表单（默认导出）
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

### 注册触发器

在扩展的插件内向工作流插件实例注册触发器类型：

```ts
import { Plugin } from '@nocobase/client-v2';
import MyTrigger from './MyTrigger';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow');
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

之后在工作流的配置界面中就可以看到新的触发器类型了。

:::info{title=提示}
客户端注册的触发器类型标识必须与服务端的保持一致，否则会导致错误。
:::

实际项目中的完整示例可参考：[CollectionTrigger 源码](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/triggers/collection/index.tsx)

定义触发器类型的其他内容详见 [工作流 API 参考](./api) 部分。

:::info{title=提示}
如果你之前使用的是旧版（v1）的客户端代码，想迁移到 v2 新版的话，可以参考 [v1 到 v2 迁移指南](./migration)。
:::
