:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Довідка з API

## Серверна частина

API, доступні у структурі серверного пакета, показані в наступному коді:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

Клас плагіна робочих процесів.

Зазвичай, під час виконання застосунку, ви можете викликати `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` у будь-якому місці, де доступний екземпляр застосунку `app`, щоб отримати екземпляр плагіна робочих процесів (далі по тексту позначається як `plugin`).

#### `registerTrigger()`

Розширює та реєструє новий тип тригера.

**Сигнатура**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Параметри**

| Параметр  | Тип                         | Опис                     |
| --------- | --------------------------- | ------------------------ |
| `type`    | `string`                    | Ідентифікатор типу тригера |
| `trigger` | `typeof Trigger \| Trigger` | Тип або екземпляр тригера |

**Приклад**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // trigger workflow
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // listen some event to trigger workflow
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // remove listener
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register trigger
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

Розширює та реєструє новий тип вузла.

**Сигнатура**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Параметри**

| Параметр      | Тип                                 | Опис                       |
| ------------- | ----------------------------------- | -------------------------- |
| `type`        | `string`                            | Ідентифікатор типу інструкції |
| `instruction` | `typeof Instruction \| Instruction` | Тип або екземпляр інструкції |

**Приклад**

```ts
import PluginWorkflowServer, { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

class LogInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  },
};

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register instruction
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

Запускає певний робочий процес. В основному використовується в користувацьких тригерах для запуску відповідного робочого процесу при прослуховуванні певної користувацької події.

**Сигнатура**

`trigger(workflow: Workflow, context: any)`

**Параметри**
| Параметр | Тип | Опис |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | Об'єкт робочого процесу, який потрібно запустити |
| `context` | `object` | Контекстні дані, надані під час запуску |

:::info{title=Підказка}
`context` наразі є обов'язковим параметром. Якщо його не надати, робочий процес не буде запущено.
:::

**Приклад**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

Відновлює виконання призупиненого робочого процесу за допомогою певного завдання вузла.

- Відновити виконання можна лише для робочих процесів, що перебувають у стані очікування (`EXECUTION_STATUS.STARTED`).
- Відновити виконання можна лише для завдань вузлів, що перебувають у стані очікування (`JOB_STATUS.PENDING`).

**Сигнатура**

`resume(job: JobModel)`

**Параметри**

| Параметр | Тип        | Опис               |
| -------- | ---------- | ------------------ |
| `job`    | `JobModel` | Оновлений об'єкт завдання |

:::info{title=Підказка}
Переданий об'єкт завдання зазвичай є оновленим об'єктом, і його `status` зазвичай оновлюється до значення, відмінного від `JOB_STATUS.PENDING`, інакше він продовжить очікувати.
:::

**Приклад**

Детальніше дивіться у [вихідному коді](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

Базовий клас тригерів, що використовується для розширення користувацьких типів тригерів.

| Параметр      | Тип                                                         | Опис                                     |
| ------------- | ----------------------------------------------------------- | ---------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Конструктор                              |
| `on?`         | `(workflow: WorkflowModel): void`                           | Обробник подій після активації робочого процесу |
| `off?`        | `(workflow: WorkflowModel): void`                           | Обробник подій після деактивації робочого процесу |

`on`/`off` використовуються для реєстрації/скасування реєстрації слухачів подій при активації/деактивації робочого процесу. Переданий параметр — це екземпляр робочого процесу, що відповідає тригеру, який може бути оброблений відповідно до конфігурації. Деякі типи тригерів, які вже глобально прослуховують події, можуть не потребувати реалізації цих двох методів. Наприклад, у тригері за розкладом ви можете зареєструвати таймер у `on` та скасувати його реєстрацію в `off`.

### `Instruction`

Базовий клас типів інструкцій, що використовується для розширення користувацьких типів інструкцій.

| Параметр      | Тип                                                             | Опис                                                               |
| ------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Конструктор                                                        |
| `run`         | `Runner`                                                        | Логіка виконання при першому вході у вузол                         |
| `resume?`     | `Runner`                                                        | Логіка виконання при вході у вузол після відновлення з переривання |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`   | Надає вміст локальних змінних для гілки, згенерованої відповідним вузлом |

**Пов'язані типи**

```ts
export type Job =
  | {
      status: JOB_STATUS[keyof JOB_STATUS];
      result?: unknown;
      [key: string]: unknown;
    }
  | JobModel
  | null;

export type InstructionResult = Job | Promise<Job>;

export type Runner = (
  node: FlowNodeModel,
  input: JobModel,
  processor: Processor,
) => InstructionResult;

export class Instruction {
  run: Runner;
  resume?: Runner;
}
```

Щодо `getScope`, ви можете звернутися до [реалізації циклічного вузла](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), який використовується для надання вмісту локальних змінних для гілок.

### `EXECUTION_STATUS`

Таблиця констант для статусів плану виконання робочого процесу, що використовується для ідентифікації поточного стану відповідного плану виконання.

| Назва константи                 | Значення                           |
| ------------------------------- | ---------------------------------- |
| `EXECUTION_STATUS.QUEUEING`     | У черзі                            |
| `EXECUTION_STATUS.STARTED`      | Виконується                        |
| `EXECUTION_STATUS.RESOLVED`     | Успішно завершено                  |
| `EXECUTION_STATUS.FAILED`       | Невдача                            |
| `EXECUTION_STATUS.ERROR`        | Помилка виконання                  |
| `EXECUTION_STATUS.ABORTED`      | Перервано                          |
| `EXECUTION_STATUS.CANCELED`     | Скасовано                          |
| `EXECUTION_STATUS.REJECTED`     | Відхилено                          |
| `EXECUTION_STATUS.RETRY_NEEDED` | Не виконано успішно, потрібна повторна спроба |

За винятком перших трьох, усі інші представляють стан невдачі, але можуть використовуватися для опису різних причин невдачі.

### `JOB_STATUS`

Таблиця констант для статусів завдань вузлів робочого процесу, що використовується для ідентифікації поточного стану відповідного завдання вузла. Стан, згенерований вузлом, також впливає на стан усього плану виконання.

| Назва константи           | Значення                                                               |
| ------------------------- | ---------------------------------------------------------------------- |
| `JOB_STATUS.PENDING`      | Очікування: Виконання досягло цього вузла, але інструкція вимагає призупинення та очікування |
| `JOB_STATUS.RESOLVED`     | Успішно завершено                                                      |
| `JOB_STATUS.FAILED`       | Невдача: Виконання цього вузла не відповідало налаштованим умовам      |
| `JOB_STATUS.ERROR`        | Помилка: Під час виконання цього вузла сталася необроблена помилка     |
| `JOB_STATUS.ABORTED`      | Припинено: Виконання цього вузла було припинено іншою логікою після перебування в стані очікування |
| `JOB_STATUS.CANCELED`     | Скасовано: Виконання цього вузла було вручну скасовано після перебування в стані очікування |
| `JOB_STATUS.REJECTED`     | Відхилено: Продовження цього вузла було вручну відхилено після перебування в стані очікування |
| `JOB_STATUS.RETRY_NEEDED` | Не виконано успішно, потрібна повторна спроба                          |

## Клієнтська частина

API, доступні у структурі клієнтського пакета, показані в наступному коді:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Реєструє панель конфігурації для типу тригера.

**Сигнатура**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Параметри**

| Параметр  | Тип                         | Опис                                       |
| --------- | --------------------------- | ------------------------------------------ |
| `type`    | `string`                    | Ідентифікатор типу тригера, що відповідає ідентифікатору, використаному для реєстрації |
| `trigger` | `typeof Trigger \| Trigger` | Тип або екземпляр тригера                  |

#### `registerInstruction()`

Реєструє панель конфігурації для типу вузла.

**Сигнатура**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Параметри**

| Параметр      | Тип                                 | Опис                                     |
| ------------- | ----------------------------------- | ---------------------------------------- |
| `type`        | `string`                            | Ідентифікатор типу вузла, що відповідає ідентифікатору, використаному для реєстрації |
| `instruction` | `typeof Instruction \| Instruction` | Тип або екземпляр вузла                  |

#### `registerInstructionGroup()`

Реєструє групу типів вузлів. NocoBase за замовчуванням надає 4 групи типів вузлів:

*   `'control'`: Керування
*   `'collection'`: Операції з колекціями
*   `'manual'`: Ручна обробка
*   `'extended'`: Інші розширення

Якщо вам потрібно розширити інші групи, ви можете використовувати цей метод для їх реєстрації.

**Сигнатура**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Параметри**

| Параметр | Тип                 | Опис                                       |
| -------- | ------------------- | ------------------------------------------ |
| `type`   | `string`            | Ідентифікатор групи вузлів, що відповідає ідентифікатору, використаному для реєстрації |
| `group`  | `{ label: string }` | Інформація про групу, наразі містить лише заголовок |

**Приклад**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

Базовий клас тригерів, що використовується для розширення користувацьких типів тригерів.

| Параметр        | Тип                                                             | Опис                                             |
| --------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| `title`         | `string`                                                        | Назва типу тригера                               |
| `fieldset`      | `{ [key: string]: ISchema }`                                    | Колекція елементів конфігурації тригера          |
| `scope?`        | `{ [key: string]: any }`                                        | Колекція об'єктів, які можуть використовуватися в Schema елементів конфігурації |
| `components?`   | `{ [key: string]: React.FC }`                                   | Колекція компонентів, які можуть використовуватися в Schema елементів конфігурації |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Засіб доступу до значень контекстних даних тригера |

- Якщо `useVariables` не встановлено, це означає, що цей тип тригера не надає функцію отримання значень, і контекстні дані тригера не можуть бути вибрані у вузлах робочого процесу.

### `Instruction`

Базовий клас інструкцій, що використовується для розширення користувацьких типів вузлів.

| Параметр             | Тип                                                     | Опис                                                                           |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `group`              | `string`                                                | Ідентифікатор групи типу вузла, наразі доступні опції: `control`/`collection`/`manual`/`extended` |
| `fieldset`           | `Record<string, ISchema>`                               | Колекція елементів конфігурації вузла                                          |
| `scope?`             | `Record<string, Function>`                              | Колекція об'єктів, які можуть використовуватися в Schema елементів конфігурації |
| `components?`        | `Record<string, React.FC>`                              | Колекція компонентів, які можуть використовуватися в Schema елементів конфігурації |
| `Component?`         | `React.FC`                                              | Користувацький компонент для рендерингу вузла                                  |
| `useVariables?`      | `(node, options: UseVariableOptions) => VariableOption` | Метод для вузла, що надає опції змінних вузла                                  |
| `useScopeVariables?` | `(node, options?) => VariableOptions`                   | Метод для вузла, що надає опції локальних змінних гілки                        |
| `useInitializers?`   | `(node) => SchemaInitializerItemType`                   | Метод для вузла, що надає опції ініціалізатора                                 |
| `isAvailable?`       | `(ctx: NodeAvailableContext) => boolean`                | Метод для визначення, чи доступний вузол                                       |

**Пов'язані типи**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Якщо `useVariables` не встановлено, це означає, що цей тип вузла не надає функцію отримання значень, і дані результату цього типу вузла не можуть бути вибрані у вузлах робочого процесу. Якщо значення результату є одиничним (невибірним), ви можете повернути статичний вміст, який виражає відповідну інформацію (див.: [вихідний код вузла обчислення](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Якщо потрібна можливість вибору (наприклад, властивість об'єкта), ви можете налаштувати відповідний компонент вибору (див.: [вихідний код вузла створення даних](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component` — це користувацький компонент для рендерингу вузла. Коли стандартний рендеринг вузла не задовольняє вимоги, його можна повністю замінити для користувацького рендерингу представлення вузла. Наприклад, якщо вам потрібно надати більше кнопок дій або інших взаємодій для початкового вузла типу гілки, вам слід використовувати цей метод (див.: [вихідний код паралельної гілки](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers` використовується для надання методу ініціалізації блоків. Наприклад, у ручному вузлі ви можете ініціалізувати відповідні користувацькі блоки на основі вищестоящих вузлів. Якщо цей метод надано, він буде доступний під час ініціалізації блоків у конфігурації інтерфейсу ручного вузла (див.: [вихідний код вузла створення даних](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable` в основному використовується для визначення, чи може вузол бути використаний (доданий) у поточному середовищі. Поточне середовище включає поточний робочий процес, вищестоящі вузли та поточний індекс гілки тощо.