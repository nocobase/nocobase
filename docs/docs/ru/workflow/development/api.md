:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Справочник API

## Серверная часть

API, доступные в структуре серверного пакета, представлены в следующем коде:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

Класс плагина рабочего процесса.

Обычно во время выполнения приложения вы можете вызвать `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` в любом месте, где доступен экземпляр приложения `app`, чтобы получить экземпляр плагина рабочего процесса (далее по тексту — `plugin`).

#### `registerTrigger()`

Расширяет и регистрирует новый тип триггера.

**Сигнатура**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Параметры**

| Параметр  | Тип                         | Описание             |
| --------- | --------------------------- | -------------------- |
| `type`    | `string`                    | Идентификатор типа триггера |
| `trigger` | `typeof Trigger \| Trigger` | Тип или экземпляр триггера |

**Пример**

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

Расширяет и регистрирует новый тип узла.

**Сигнатура**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Параметры**

| Параметр      | Тип                                 | Описание             |
| ------------- | ----------------------------------- | -------------------- |
| `type`        | `string`                            | Идентификатор типа инструкции |
| `instruction` | `typeof Instruction \| Instruction` | Тип или экземпляр инструкции |

**Пример**

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

Запускает определённый рабочий процесс. В основном используется в пользовательских триггерах для запуска соответствующего рабочего процесса при прослушивании определённого пользовательского события.

**Сигнатура**

`trigger(workflow: Workflow, context: any)`

**Параметры**
| Параметр | Тип | Описание |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | Объект рабочего процесса, который нужно запустить |
| `context` | `object` | Контекстные данные, предоставляемые при запуске |

:::info{title=Подсказка}
`context` в настоящее время является обязательным параметром. Если он не предоставлен, рабочий процесс не будет запущен.
:::

**Пример**

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

Возобновляет выполнение приостановленного рабочего процесса с определённой задачей узла.

- Возобновить выполнение можно только для рабочих процессов, находящихся в состоянии ожидания (`EXECUTION_STATUS.STARTED`).
- Возобновить выполнение можно только для задач узлов, находящихся в состоянии ожидания (`JOB_STATUS.PENDING`).

**Сигнатура**

`resume(job: JobModel)`

**Параметры**

| Параметр  | Тип        | Описание             |
| ----- | ---------- | -------------------- |
| `job` | `JobModel` | Обновлённый объект задачи |

:::info{title=Подсказка}
Передаваемый объект задачи обычно является обновлённым объектом, и его `status` обычно обновляется до значения, отличного от `JOB_STATUS.PENDING`, в противном случае он продолжит находиться в состоянии ожидания.
:::

**Пример**

Подробности смотрите в [исходном коде](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

Базовый класс для триггеров, используемый для расширения пользовательских типов триггеров.

| Параметр      | Тип                                                         | Описание                   |
| ------------- | ----------------------------------------------------------- | -------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Конструктор                |
| `on?`         | `(workflow: WorkflowModel): void`                           | Обработчик событий после активации рабочего процесса |
| `off?`        | `(workflow: WorkflowModel): void`                           | Обработчик событий после деактивации рабочего процесса |

Методы `on`/`off` используются для регистрации/отмены регистрации слушателей событий при активации/деактивации рабочего процесса. Передаваемый параметр — это экземпляр рабочего процесса, соответствующий триггеру, который может быть обработан согласно соответствующей конфигурации. Некоторые типы триггеров, которые уже прослушивают события глобально, могут не нуждаться в реализации этих двух методов. Например, в триггере по расписанию вы можете зарегистрировать таймер в `on` и отменить его регистрацию в `off`.

### `Instruction`

Базовый класс для типов инструкций, используемый для расширения пользовательских типов инструкций.

| Параметр      | Тип                                                             | Описание                               |
| ------------- | --------------------------------------------------------------- | -------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Конструктор                            |
| `run`         | `Runner`                                                        | Логика выполнения при первом входе в узел |
| `resume?`     | `Runner`                                                        | Логика выполнения при входе в узел после возобновления из прерывания |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`   | Предоставляет содержимое локальных переменных для ветви, созданной соответствующим узлом |

**Связанные типы**

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

Для `getScope` вы можете обратиться к [реализации узла цикла](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), который используется для предоставления содержимого локальных переменных для ветвей.

### `EXECUTION_STATUS`

Таблица констант для статусов планов выполнения рабочего процесса, используемая для идентификации текущего статуса соответствующего плана выполнения.

| Название константы              | Значение                 |
| ------------------------------- | ------------------------ |
| `EXECUTION_STATUS.QUEUEING`     | В очереди                |
| `EXECUTION_STATUS.STARTED`      | Выполняется              |
| `EXECUTION_STATUS.RESOLVED`     | Успешно завершено        |
| `EXECUTION_STATUS.FAILED`       | Неудача                  |
| `EXECUTION_STATUS.ERROR`        | Ошибка выполнения        |
| `EXECUTION_STATUS.ABORTED`      | Прервано                 |
| `EXECUTION_STATUS.CANCELED`     | Отменено                 |
| `EXECUTION_STATUS.REJECTED`     | Отклонено                |
| `EXECUTION_STATUS.RETRY_NEEDED` | Не выполнено успешно, требуется повторная попытка |

За исключением первых трёх, все остальные статусы представляют собой состояние неудачи, но могут использоваться для описания различных причин сбоя.

### `JOB_STATUS`

Таблица констант для статусов задач узлов рабочего процесса, используемая для идентификации текущего статуса соответствующей задачи узла. Статус, генерируемый узлом, также влияет на статус всего плана выполнения.

| Название константы        | Значение                                 |
| ------------------------- | ---------------------------------------- |
| `JOB_STATUS.PENDING`      | Ожидание: выполнение достигло этого узла, но инструкция требует приостановки и ожидания |
| `JOB_STATUS.RESOLVED`     | Успешно завершено                        |
| `JOB_STATUS.FAILED`       | Неудача: выполнение этого узла не соответствовало заданным условиям |
| `JOB_STATUS.ERROR`        | Ошибка: во время выполнения этого узла произошла необработанная ошибка |
| `JOB_STATUS.ABORTED`      | Прервано: выполнение этого узла было прервано другой логикой после состояния ожидания |
| `JOB_STATUS.CANCELED`     | Отменено: выполнение этого узла было вручную отменено после состояния ожидания |
| `JOB_STATUS.REJECTED`     | Отклонено: продолжение выполнения этого узла было вручную отклонено после состояния ожидания |
| `JOB_STATUS.RETRY_NEEDED` | Не выполнено успешно, требуется повторная попытка |

## Клиентская часть

API, доступные в структуре клиентского пакета, представлены в следующем коде:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Регистрирует панель конфигурации для типа триггера.

**Сигнатура**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Параметры**

| Параметр  | Тип                         | Описание                                 |
| --------- | --------------------------- | ---------------------------------------- |
| `type`    | `string`                    | Идентификатор типа триггера, должен совпадать с идентификатором, используемым при регистрации |
| `trigger` | `typeof Trigger \| Trigger` | Тип или экземпляр триггера               |

#### `registerInstruction()`

Регистрирует панель конфигурации для типа узла.

**Сигнатура**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Параметры**

| Параметр      | Тип                                 | Описание                                 |
| ------------- | ----------------------------------- | ---------------------------------------- |
| `type`        | `string`                            | Идентификатор типа узла, должен совпадать с идентификатором, используемым при регистрации |
| `instruction` | `typeof Instruction \| Instruction` | Тип или экземпляр инструкции             |

#### `registerInstructionGroup()`

Регистрирует группу типов узлов. NocoBase по умолчанию предоставляет 4 группы типов узлов:

* `'control'`: Управление
* `'collection'`: Операции с коллекциями
* `'manual'`: Ручная обработка
* `'extended'`: Другие расширения

Если вам нужно расширить другие группы, вы можете использовать этот метод для их регистрации.

**Сигнатура**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Параметры**

| Параметр  | Тип               | Описание                           |
| --------- | ----------------- | ---------------------------------- |
| `type`    | `string`          | Идентификатор группы узлов, должен совпадать с идентификатором, используемым при регистрации |
| `group` | `{ label: string }` | Информация о группе, в настоящее время содержит только заголовок |

**Пример**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

Базовый класс для триггеров, используемый для расширения пользовательских типов триггеров.

| Параметр            | Тип                                                              | Описание                               |
| --------------- | ---------------------------------------------------------------- | -------------------------------------- |
| `title`         | `string`                                                         | Название типа триггера                 |
| `fieldset`      | `{ [key: string]: ISchema }`                                     | Набор элементов конфигурации триггера  |
| `scope?`        | `{ [key: string]: any }`                                         | Набор объектов, которые могут использоваться в схеме элементов конфигурации |
| `components?`   | `{ [key: string]: React.FC }`                                    | Набор компонентов, которые могут использоваться в схеме элементов конфигурации |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Метод получения значений контекстных данных триггера |

- Если `useVariables` не установлен, это означает, что данный тип триггера не предоставляет функцию получения значений, и контекстные данные триггера не могут быть выбраны в узлах рабочего процесса.

### `Instruction`

Базовый класс для инструкций, используемый для расширения пользовательских типов узлов.

| Параметр                 | Тип                                                     | Описание                                                                           |
| -------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `group`              | `string`                                                | Идентификатор группы типов узлов, в настоящее время доступны: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset`           | `Record<string, ISchema>`                               | Набор элементов конфигурации узла                                                  |
| `scope?`             | `Record<string, Function>`                              | Набор объектов, которые могут использоваться в схеме элементов конфигурации        |
| `components?`        | `Record<string, React.FC>`                              | Набор компонентов, которые могут использоваться в схеме элементов конфигурации     |
| `Component?`         | `React.FC`                                              | Пользовательский компонент для рендеринга узла                                     |
| `useVariables?`      | `(node, options: UseVariableOptions) => VariableOption` | Метод для узла, предоставляющий опции переменных узла                              |
| `useScopeVariables?` | `(node, options?) => VariableOptions`                   | Метод для узла, предоставляющий опции локальных переменных ветви                   |
| `useInitializers?`   | `(node) => SchemaInitializerItemType`                   | Метод для узла, предоставляющий опции инициализаторов                              |
| `isAvailable?`       | `(ctx: NodeAvailableContext) => boolean`                | Метод для определения доступности узла                                             |

**Связанные типы**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Если `useVariables` не установлен, это означает, что данный тип узла не предоставляет функцию получения значений, и данные результата этого типа узла не могут быть выбраны в узлах рабочего процесса. Если результирующее значение является единичным (невыбираемым), вы можете вернуть статическое содержимое, выражающее соответствующую информацию (см.: [исходный код узла вычисления](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Если требуется возможность выбора (например, свойство объекта), вы можете настроить вывод соответствующего компонента выбора (см.: [исходный код узла создания данных](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component` — это пользовательский компонент для рендеринга узла. Если стандартный рендеринг узла не подходит, его можно полностью переопределить для создания пользовательского представления узла. Например, если вам нужно предоставить дополнительные кнопки действий или другие интерактивные элементы для начального узла типа ветви, вам следует использовать этот метод (см.: [исходный код параллельной ветви](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers` используется для предоставления метода инициализации блоков. Например, в узле ручной обработки вы можете инициализировать связанные пользовательские блоки на основе вышестоящих узлов. Если этот метод предоставлен, он будет доступен при инициализации блоков в конфигурации интерфейса узла ручной обработки (см.: [исходный код узла создания данных](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable` в основном используется для определения того, может ли узел быть использован (добавлен) в текущей среде. Текущая среда включает текущий рабочий процесс, вышестоящие узлы и текущий индекс ветви.