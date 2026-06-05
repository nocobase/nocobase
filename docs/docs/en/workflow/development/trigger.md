# Extend Trigger Types

Every workflow must be configured with a specific trigger, which serves as the entry point for starting the process execution.

A trigger type usually represents a specific system environment event. During the application's runtime lifecycle, any part that provides subscribable events can be used to define a trigger type. For example, receiving requests, collection operations, scheduled tasks, etc.

Trigger types are registered in the plugin's trigger table based on a string identifier. The Workflow plugin has several built-in triggers:

- `'collection'`: Triggered by collection operations;
- `'schedule'`: Triggered by scheduled tasks;
- `'action'`: Triggered by after-action events;


Extended trigger types need to ensure their identifiers are unique. The implementation for subscribing/unsubscribing the trigger is registered on the server-side, and the implementation for the configuration interface is registered on the client-side.

## Server-side

Any trigger needs to inherit from the `Trigger` base class and implement the `on`/`off` methods, which are used for subscribing to and unsubscribing from specific environment events, respectively. In the `on` method, you need to call `this.workflow.trigger()` within the specific event callback function to ultimately trigger the event. In the `off` method, you need to perform the relevant cleanup work for unsubscribing.

`this.workflow` is the workflow plugin instance passed into the `Trigger` base class's constructor.

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

Then, in the plugin that extends the workflow, register the trigger instance with the workflow engine:

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

After the server starts and loads, the `'interval'` type trigger can be added and executed.

## Client-side

The client-side part mainly provides a configuration interface based on the configuration items required by the trigger type. Each trigger type also needs to register its corresponding type configuration with the Workflow plugin.

For example, for the scheduled execution trigger mentioned above, define the required interval time configuration item (`interval`) in the configuration interface form:

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

Then, register this trigger type with the workflow plugin instance within the extended plugin:

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

After that, the new trigger type will be visible in the workflow configuration interface.

:::info{title=Note}
The identifier of the trigger type registered on the client-side must be consistent with the one on the server-side, otherwise it will cause errors.
:::

For other details on defining trigger types, please refer to the [Workflow API Reference](./api#pluginregisterTrigger) section.