:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Розширення типів тригерів

Кожен робочий процес має бути налаштований зі специфічним тригером, який слугує точкою входу для запуску виконання процесу.

Тип тригера зазвичай представляє певну подію системного середовища. Протягом життєвого циклу програми будь-яка частина, що надає події, на які можна підписатися, може бути використана для визначення типу тригера. Наприклад, отримання запитів, операції з **колекціями**, планові завдання тощо.

Типи тригерів реєструються в таблиці тригерів **плагіна** на основі рядкового ідентифікатора. **Плагін робочих процесів** має кілька вбудованих тригерів:

- `'collection'`: Спрацьовує при операціях з **колекціями**;
- `'schedule'`: Спрацьовує за плановими завданнями;
- `'action'`: Спрацьовує після подій, пов'язаних з діями;

Розширені типи тригерів повинні мати унікальні ідентифікатори. Реалізація для підписки/відписки тригера реєструється на стороні сервера, а реалізація для інтерфейсу конфігурації – на стороні клієнта.

## Сторона сервера

Будь-який тригер повинен успадковуватись від базового класу `Trigger` та реалізовувати методи `on`/`off`, які використовуються відповідно для підписки та відписки від конкретних подій середовища. У методі `on` вам потрібно викликати `this.workflow.trigger()` всередині конкретної функції зворотного виклику події, щоб зрештою запустити подію. Крім того, у методі `off` необхідно виконати відповідні роботи з очищення для відписки.

`this.workflow` – це екземпляр **плагіна робочого процесу**, переданий у конструктор базового класу `Trigger`.

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

Потім, у **плагіні**, який розширює **робочий процес**, зареєструйте екземпляр тригера в рушії **робочих процесів**:

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

Після запуску та завантаження сервера тригер типу `'interval'` можна буде додавати та виконувати.

## Сторона клієнта

Клієнтська частина в основному надає інтерфейс конфігурації на основі елементів налаштування, необхідних для типу тригера. Кожен тип тригера також повинен зареєструвати свою відповідну конфігурацію типу в **плагіні робочих процесів**.

Наприклад, для вищезгаданого тригера планового виконання, визначте необхідний елемент конфігурації інтервалу часу (`interval`) у формі інтерфейсу конфігурації:

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

Потім зареєструйте цей тип тригера в екземплярі **плагіна робочих процесів** у межах розширеного **плагіна**:

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

Після цього новий тип тригера буде видно в інтерфейсі конфігурації **робочого процесу**.

:::info{title=Примітка}
Ідентифікатор типу тригера, зареєстрований на стороні клієнта, повинен бути узгоджений з ідентифікатором на стороні сервера, інакше це призведе до помилок.
:::

Інші деталі щодо визначення типів тригерів дивіться в розділі [Довідник API робочих процесів](./api#pluginregisterTrigger).