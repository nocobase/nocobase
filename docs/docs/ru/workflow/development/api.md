# Справочник API

## Серверная часть

API, доступные в серверной части пакета, показаны в следующем коде:

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

Обычно во время выполнения приложения в любом месте, где доступен экземпляр приложения `app`, можно вызвать `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)`, чтобы получить экземпляр плагина рабочего процесса (ниже — `plugin`).

#### `registerTrigger()`

Расширяет и регистрирует новый тип триггера.

**Сигнатура**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Параметры**

| Параметр | Тип | Описание |
| --------- | --------------------------- | ---------------- |
| `type` | `string` | Идентификатор типа триггера |
| `trigger` | `typeof Trigger \| Trigger` | Тип триггера или его экземпляр |

**Пример**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // запуск рабочего процесса
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // подписка на событие для запуска рабочего процесса
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // отмена подписки
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // получение экземпляра плагина рабочего процесса
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // регистрация триггера
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

Расширяет и регистрирует новый тип узла.

**Сигнатура**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Параметры**

| Параметр | Тип | Описание |
| ------------- | ----------------------------------- | -------------- |
| `type` | `string` | Идентификатор типа инструкции |
| `instruction` | `typeof Instruction \| Instruction` | Тип инструкции или её экземпляр |

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
    // получение экземпляра плагина рабочего процесса
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // регистрация инструкции
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

Запускает конкретный рабочий процесс. В основном используется в пользовательских триггерах, чтобы запускать соответствующий рабочий процесс при срабатывании определённого пользовательского события.

**Сигнатура**

`trigger(workflow: Workflow, context: any)`

**Параметры**
| Параметр | Тип | Описание |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | Объект рабочего процесса, который нужно запустить |
| `context` | `object` | Контекстные данные, передаваемые при срабатывании триггера |

:::info{title=Подсказка}
`context` сейчас обязателен. Если его не передать, рабочий процесс не будет запущен.
:::

**Пример**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // регистрация события
    this.timer = setInterval(() => {
      // запуск рабочего процесса
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

Возобновляет ожидающий рабочий процесс по конкретной задаче узла.

- Возобновить можно только рабочий процесс в состоянии ожидания (`EXECUTION_STATUS.STARTED`).
- Возобновить можно только задачу узла в состоянии ожидания (`JOB_STATUS.PENDING`).

**Сигнатура**

`resume(job: JobModel)`

**Параметры**

| Параметр | Тип | Описание |
| ----- | ---------- | ---------------- |
| `job` | `JobModel` | Обновлённый объект задачи |

:::info{title=Подсказка}
Передаваемый объект задачи обычно уже обновлён, и его `status` обычно изменён на значение, отличное от `JOB_STATUS.PENDING`, иначе ожидание продолжится.
:::

**Пример**

Подробности см. в [исходном коде](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

Базовый класс триггера, используется для расширения пользовательских типов триггеров.

| Параметр | Тип | Описание |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Конструктор |
| `on?` | `(workflow: WorkflowModel): void` | Обработчик события после включения рабочего процесса |
| `off?` | `(workflow: WorkflowModel): void` | Обработчик события после отключения рабочего процесса |

`on`/`off` используются для регистрации и снятия обработчиков событий при включении и отключении рабочего процесса. Передаваемый параметр — экземпляр рабочего процесса, соответствующий триггеру, который можно обрабатывать в соответствии с конфигурацией. Некоторым типам триггеров с уже глобально прослушиваемыми событиями эти методы могут быть не нужны. Например, в триггере по расписанию можно зарегистрировать таймер в `on` и снять его в `off`.

### `Instruction`

Базовый класс типов инструкций, используется для расширения пользовательских инструкций.

| Параметр | Тип | Описание |
| ------------- | --------------------------------------------------------------- | ---------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Конструктор |
| `run` | `Runner` | Логика выполнения при первом входе в узел |
| `resume?` | `Runner` | Логика выполнения при входе в узел после возобновления |
| `getScope?` | `(node: FlowNodeModel, data: any, processor: Processor): any` | Предоставляет содержимое локальных переменных для ветви, созданной соответствующим узлом |

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

Для `getScope` можно ориентироваться на [реализацию узла «Цикл»](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), которая используется для предоставления локальных переменных для ветвей.

### `EXECUTION_STATUS`

Таблица констант статусов плана выполнения рабочего процесса, используется для идентификации текущего состояния соответствующего плана выполнения.

| Имя константы | Значение |
| ------------------------------- | -------------------- |
| `EXECUTION_STATUS.QUEUEING` | В очереди |
| `EXECUTION_STATUS.STARTED` | Запущен |
| `EXECUTION_STATUS.RESOLVED` | Успешно завершён |
| `EXECUTION_STATUS.FAILED` | Сбой |
| `EXECUTION_STATUS.ERROR` | Ошибка |
| `EXECUTION_STATUS.ABORTED` | Прерван |
| `EXECUTION_STATUS.CANCELED` | Отменён |
| `EXECUTION_STATUS.REJECTED` | Отклонён |
| `EXECUTION_STATUS.RETRY_NEEDED` | Выполнен неуспешно, требуется повтор |

Кроме первых трёх, все остальные представляют неуспешное состояние, но используются для описания разных причин неуспеха.

### `JOB_STATUS`

Таблица констант статусов задач узлов в рабочем процессе, используется для идентификации текущего состояния соответствующей задачи узла. Статус, сформированный узлом, также влияет на статус всего плана выполнения.

| Имя константы | Значение |
| ------------------------- | ---------------------------------------- |
| `JOB_STATUS.PENDING` | Ожидание: выполнение дошло до узла, но инструкция требует приостановить и ждать |
| `JOB_STATUS.RESOLVED` | Успешно завершён |
| `JOB_STATUS.FAILED` | Сбой: выполнение узла не удовлетворило заданным условиям |
| `JOB_STATUS.ERROR` | Ошибка: во время выполнения узла возникла необработанная ошибка |
| `JOB_STATUS.ABORTED` | Прерван: выполнение узла завершено другой логикой после состояния ожидания |
| `JOB_STATUS.CANCELED` | Отменён: выполнение узла вручную отменено после состояния ожидания |
| `JOB_STATUS.REJECTED` | Отклонён: продолжение узла вручную отклонено после состояния ожидания |
| `JOB_STATUS.RETRY_NEEDED` | Выполнен неуспешно, требуется повтор |

## Клиентская часть

API, доступные в клиентской части пакета, показаны в следующем коде:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Регистрирует панель настройки для типа триггера.

**Сигнатура**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Параметры**

| Параметр | Тип | Описание |
| --------- | --------------------------- | ------------------------------------ |
| `type` | `string` | Идентификатор типа триггера, должен совпадать с идентификатором при регистрации |
| `trigger` | `typeof Trigger \| Trigger` | Тип триггера или его экземпляр |

#### `registerInstruction()`

Регистрирует панель настройки для типа узла.

**Сигнатура**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Параметры**

| Параметр | Тип | Описание |
| ------------- | ----------------------------------- | ---------------------------------- |
| `type` | `string` | Идентификатор типа узла, должен совпадать с идентификатором при регистрации |
| `instruction` | `typeof Instruction \| Instruction` | Тип узла или его экземпляр |

#### `registerInstructionGroup()`

Регистрирует группу типов узлов. В NocoBase есть 4 группы по умолчанию:

* `'control'`: управление
* `'collection'`: операции с коллекциями
* `'manual'`: ручная обработка
* `'extended'`: прочие расширения

Если нужно добавить другие группы, используйте этот метод для их регистрации.

**Сигнатура**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Параметры**

| Параметр | Тип | Описание |
| --------- | ----------------- | ----------------------------- |
| `type` | `string` | Идентификатор группы узлов, должен совпадать с идентификатором при регистрации |
| `group` | `{ label: string }` | Информация о группе, сейчас включает только заголовок |

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

Базовый класс триггера, используется для расширения пользовательских триггеров.

| Параметр | Тип | Описание |
| --------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `title` | `string` | Название типа триггера |
| `fieldset` | `{ [key: string]: ISchema }` | Набор элементов настройки триггера |
| `scope?` | `{ [key: string]: any }` | Набор объектов, которые могут использоваться в схеме настройки |
| `components?` | `{ [key: string]: React.FC }` | Набор компонентов, которые могут использоваться в схеме настройки |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Метод доступа к значениям контекстных данных триггера |

- Если `useVariables` не задан, этот тип триггера не предоставляет функцию получения значений, и контекстные данные триггера нельзя выбрать в узлах рабочего процесса.

### `Instruction`

Базовый класс инструкций, используется для расширения пользовательских типов узлов.

| Параметр | Тип | Описание |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `group` | `string` | Идентификатор группы типа узла; сейчас доступны: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset` | `Record<string, ISchema>` | Набор элементов настройки узла |
| `scope?` | `Record<string, Function>` | Набор объектов, которые могут использоваться в схеме элементов настройки |
| `components?` | `Record<string, React.FC>` | Набор компонентов, которые могут использоваться в схеме элементов настройки |
| `Component?` | `React.FC` | Пользовательский компонент отображения узла |
| `useVariables?` | `(node, options: UseVariableOptions) => VariableOption` | Метод, с помощью которого узел предоставляет варианты переменных |
| `useScopeVariables?` | `(node, options?) => VariableOptions` | Метод, с помощью которого узел предоставляет локальные переменные ветви |
| `useInitializers?` | `(node) => SchemaInitializerItemType` | Метод, с помощью которого узел предоставляет варианты инициализации |
| `isAvailable?` | `(ctx: NodeAvailableContext) => boolean` | Метод определения доступности узла |

**Связанные типы**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Если `useVariables` не задан, этот тип узла не предоставляет функцию получения значений, и данные результата такого узла нельзя выбрать в узлах рабочего процесса. Если результат единственный (не выбирается), можно вернуть статическое содержимое с нужной информацией (см.: [исходный код узла «Вычисление»](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Если значение нужно выбирать (например, свойство объекта), можно настроить соответствующий компонент выбора (см.: [исходный код узла «Создать запись»](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component` — пользовательский компонент отображения узла. Если стандартного отображения недостаточно, его можно полностью переопределить для пользовательского представления узла. Например, если для стартового узла ветвящегося типа нужны дополнительные кнопки действий или другое взаимодействие, используйте этот метод (см.: [исходный код узла «Параллельная ветвь»](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers` предоставляет метод инициализации блоков. Например, в ручном узле можно инициализировать связанные пользовательские блоки на основе вышестоящих узлов. Если метод задан, он доступен при инициализации блоков в интерфейсе настройки ручного узла (см.: [исходный код узла создания записи](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable` в основном определяет, можно ли использовать (добавить) узел в текущем окружении. Текущее окружение включает текущий рабочий процесс, вышестоящие узлы и индекс текущей ветви.