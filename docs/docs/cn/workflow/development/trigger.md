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

例如对上面的定时执行的触发器，定义配置界面表单中需要的间隔时间配置项（`interval`）：

```ts
import { Trigger } from '@nocobase/workflow/client';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';
  // fields of trigger config
  fieldset = {
    interval: {
      type: 'number',
      title: 'Interval',
      name: 'config.interval',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 60000,
    },
  };
}
```

然后在扩展的插件内向工作流插件实例注册这个触发器类型：

```ts
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import MyTrigger from './MyTrigger';

export default class extends Plugin {
  // You can get and modify the app instance here
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

之后在工作流的配置界面中就可以看到新的触发器类型了。

:::info{title=提示}
客户端注册的触发器类型标识必须与服务端的保持一致，否则会导致错误。
:::

定义触发器类型的其他内容详见 [工作流 API 参考](./api#pluginregisterTrigger) 部分。
