:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Расширение типов триггеров

Каждый рабочий процесс должен быть настроен с определенным триггером, который служит точкой входа для запуска выполнения процесса.

Тип триггера обычно представляет собой определенное событие системной среды. В течение жизненного цикла приложения любая часть, предоставляющая события, на которые можно подписаться, может быть использована для определения типа триггера. Например, получение запросов, операции с коллекциями, запланированные задачи и т.д.

Типы триггеров регистрируются в таблице триггеров плагина на основе строкового идентификатора. Плагин рабочего процесса имеет несколько встроенных триггеров:

- `'collection'`: Срабатывает при операциях с коллекциями;
- `'schedule'`: Срабатывает по расписанию (запланированные задачи);
- `'action'`: Срабатывает после выполнения действия;

Расширенные типы триггеров должны иметь уникальные идентификаторы. Реализация подписки/отписки для триггера регистрируется на стороне сервера, а реализация интерфейса конфигурации — на стороне клиента.

## Серверная часть

Любой триггер должен наследоваться от базового класса `Trigger` и реализовывать методы `on`/`off`, которые используются для подписки и отписки от определенных событий среды соответственно. В методе `on` вам нужно вызвать `this.workflow.trigger()` внутри функции обратного вызова события, чтобы в конечном итоге запустить событие. Кроме того, в методе `off` необходимо выполнить соответствующую очистку, связанную с отпиской.

`this.workflow` — это экземпляр плагина рабочего процесса, переданный в конструктор базового класса `Trigger`.

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

Затем, в плагине, который расширяет рабочий процесс, зарегистрируйте экземпляр триггера в движке рабочего процесса:

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

После запуска и загрузки сервера триггер типа `'interval'` может быть добавлен и выполнен.

## Клиентская часть

Клиентская часть в основном предоставляет интерфейс конфигурации на основе параметров, необходимых для типа триггера. Каждый тип триггера также должен зарегистрировать свою соответствующую конфигурацию типа в плагине рабочего процесса.

Например, для вышеупомянутого триггера с запланированным выполнением определите необходимый параметр конфигурации интервала времени (`interval`) в форме интерфейса конфигурации:

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

Затем зарегистрируйте этот тип триггера в экземпляре плагина рабочего процесса внутри расширенного плагина:

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

После этого новый тип триггера станет виден в интерфейсе конфигурации рабочего процесса.

:::info{title=Примечание}
Идентификатор типа триггера, зарегистрированный на стороне клиента, должен совпадать с идентификатором на стороне сервера, иначе это приведет к ошибкам.
:::

Другие подробности по определению типов триггеров см. в разделе [Справочник по API рабочего процесса](./api#pluginregisterTrigger).