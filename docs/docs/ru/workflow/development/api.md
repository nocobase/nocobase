---
title: "Справочник API"
description: "Справочник API расширений рабочего процесса: модель рабочего процесса, контекст выполнения узла, API триггера, передача переменных."
keywords: "рабочий процесс,справочник API,модель рабочего процесса,контекст узла,API триггера,NocoBase"
---

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
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register instruction
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

:::info{title=Примечание}
`context` сейчас является обязательным параметром. Если его не передать, рабочий процесс не будет запущен.
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

Возобновляет ожидающий рабочий процесс по конкретной задаче узла.

- Возобновить можно только рабочий процесс в состоянии ожидания (`EXECUTION_STATUS.STARTED`).
- Возобновить можно только задачу узла в состоянии ожидания (`JOB_STATUS.PENDING`).

**Сигнатура**

`resume(job: JobModel)`

**Параметры**

| Параметр | Тип | Описание |
| --------- | ---------- | ---------------------- |
| `job` | `JobModel` | Обновлённый объект задачи |

:::info{title=Примечание}
Передаваемый объект задачи обычно уже обновлён, и его `status` обычно изменён на значение, отличное от `JOB_STATUS.PENDING`, иначе ожидание продолжится.
:::

**Пример**

Подробности см. в [исходном коде](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

Базовый класс триггера, используется для расширения пользовательских типов триггеров.

```ts
import { Trigger } from '@nocobase/plugin-workflow';
```

| Параметр | Тип | Описание |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Конструктор |
| `on?` | `(workflow: WorkflowModel): void` | Обработчик события после включения рабочего процесса |
| `off?` | `(workflow: WorkflowModel): void` | Обработчик события после отключения рабочего процесса |

`on`/`off` используются для регистрации и снятия обработчиков событий при включении и отключении рабочего процесса. Передаваемый параметр — экземпляр рабочего процесса, соответствующий триггеру, который можно обрабатывать в соответствии с конфигурацией. Некоторым типам триггеров с уже глобально прослушиваемыми событиями эти методы могут быть не нужны. Например, в триггере по расписанию можно зарегистрировать таймер в `on` и снять его в `off`.

### `Instruction`

Базовый класс типов инструкций, используется для расширения пользовательских инструкций.

```ts
import { Instruction } from '@nocobase/plugin-workflow';
```

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

```ts
import { EXECUTION_STATUS } from '@nocobase/plugin-workflow';
```

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

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';
```

| Имя константы | Значение |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
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
import PluginWorkflowClientV2, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client-v2';
```

### `PluginWorkflowClientV2`

Класс клиентского плагина рабочего процесса. Обычно получается через `this.app.pm.get('workflow')`.

#### `registerTrigger()`

Регистрирует панель настройки для типа триггера.

**Сигнатура**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Параметры**

| Параметр | Тип | Описание |
| --- | --- | --- |
| `type` | `string` | Идентификатор типа триггера, должен совпадать с серверным идентификатором |
| `trigger` | `typeof Trigger \| Trigger` | Тип триггера или его экземпляр |

#### `registerInstruction()`

Регистрирует панель настройки для типа узла.

**Сигнатура**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Параметры**

| Параметр | Тип | Описание |
| --- | --- | --- |
| `type` | `string` | Идентификатор типа узла, должен совпадать с серверным идентификатором |
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
| --- | --- | --- |
| `type` | `string` | Идентификатор группы узлов |
| `group` | `{ label: string }` | Информация о группе, сейчас включает только заголовок |

**Пример**

```ts
import { Plugin } from '@nocobase/client-v2';

export default class YourPluginClient extends Plugin {
  async load() {
    const pluginWorkflow = this.app.pm.get('workflow');
    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

#### `isWorkflowSync()`

Определяет, находится ли рабочий процесс в синхронном режиме.

**Сигнатура**

`isWorkflowSync(workflow: object): boolean`

### `Trigger`

Базовый класс триггера, используется для расширения пользовательских типов триггеров.

| Параметр | Тип | Описание |
| --- | --- | --- |
| `title` | `string` | Название типа триггера |
| `description?` | `string` | Описание типа триггера |
| `PresetFieldsetLoader?` | `LoaderOf` | Предустановленная форма при создании (отложенная загрузка) |
| `FieldsetLoader?` | `LoaderOf` | Полная форма настройки триггера (отложенная загрузка) |
| `TriggerFieldsetLoader?` | `LoaderOf` | Форма ввода для ручного запуска (отложенная загрузка) |
| `validate` | `(config: Record<string, unknown>) => boolean` | Валидация конфигурации; возвращает `true`, если конфигурация корректна |
| `createDefaultConfig?` | `() => Record<string, unknown>` | Предоставляет значения конфигурации по умолчанию |
| `useVariables?` | `(config, options?: UseVariableOptions) => VariableOption[] \| null` | Варианты переменных для контекстных данных триггера |
| `getCreateModelMenuItem?` | `(args) => SubModelItem \| SubModelItem[] \| null` | Пункты меню для создания подмоделей на холсте |
| `useTempAssociationSource?` | `(config, workflow?) => TriggerTempAssociationSource \| null` | Предоставляет временный источник ассоциативных данных |

**Связанные типы**

```ts
export type LoaderOf<P = {}> = () => Promise<{ default: ComponentType<P> }>;
```

- Если `useVariables` не задан, этот тип триггера не предоставляет функцию получения значений, и контекстные данные триггера нельзя выбрать в узлах рабочего процесса.

### `Instruction`

Базовый класс инструкций, используется для расширения пользовательских типов узлов.

| Параметр | Тип | Описание |
| --- | --- | --- |
| `title` | `string` | Название типа узла |
| `type` | `string` | Идентификатор типа узла |
| `group` | `string` | Идентификатор группы типа узла; варианты: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `description?` | `string` | Описание типа узла |
| `icon?` | `JSX.Element` | Иконка узла |
| `FieldsetLoader?` | `LoaderOf` | Форма настройки узла в панели (отложенная загрузка) |
| `PresetFieldsetLoader?` | `LoaderOf` | Предустановленная форма при создании (отложенная загрузка) |
| `ComponentLoader?` | `LoaderOf<{ data: any }>` | Пользовательский рендеринг узла на холсте (отложенная загрузка), используется для узлов с ветвлением и других случаев, требующих особого отображения |
| `branching?` | `boolean \| object \| ((config) => boolean \| object)` | Объявляет, является ли узел узлом ветвления |
| `end?` | `boolean \| ((node) => boolean)` | Объявляет, является ли узел завершающим |
| `testable?` | `boolean` | Объявляет, поддерживает ли узел тестовый запуск |
| `createDefaultConfig?` | `() => object` | Предоставляет значения конфигурации по умолчанию |
| `useVariables?` | `(node, options?: UseVariableOptions) => VariableOption` | Метод, с помощью которого узел предоставляет варианты переменных |
| `useScopeVariables?` | `(node, options?) => VariableOption[] \| MetaTreeNode[]` | Метод, с помощью которого узел предоставляет переменные области видимости ветви |
| `isAvailable?` | `(ctx: NodeAvailableContext) => boolean` | Метод определения доступности узла |
| `getCreateModelMenuItem?` | `({ node, workflow }) => SubModelItem \| null` | Пункты меню для создания подмоделей на холсте |
| `useTempAssociationSource?` | `(node) => TempAssociationSource \| null` | Предоставляет временный источник ассоциативных данных |

**Связанные типы**

```ts
export type NodeAvailableContext = {
  engine: WorkflowPlugin;
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Если `useVariables` не задан, этот тип узла не предоставляет функцию получения значений, и данные результата такого узла нельзя выбрать в узлах рабочего процесса. Если результат единственный (не выбирается), можно вернуть статическое содержимое с нужной информацией (см.: [исходный код узла «Вычисление»](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/calculation.tsx)). Если значение нужно выбирать (например, свойство объекта), можно настроить соответствующий компонент выбора (см.: [исходный код узла «Запрос данных»](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/query.tsx)).
- `ComponentLoader` — пользовательский компонент отображения узла. Если стандартного отображения недостаточно, его можно полностью переопределить для пользовательского рендеринга узла. Например, для узлов ветвящегося типа можно добавить дополнительный рендеринг ветвей (см.: [исходный код узла «Условие»](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/condition.tsx)).
- `isAvailable` в основном определяет, можно ли использовать (добавить) узел в текущем окружении. Текущее окружение включает экземпляр плагина рабочего процесса, текущий рабочий процесс, вышестоящие узлы и индекс текущей ветви.

### Компоненты ввода переменных

Рабочий процесс предоставляет набор компонентов ввода переменных, позволяющих пользователям выбирать переменные рабочего процесса в формах настройки узлов и триггеров.

```ts
import {
  WorkflowVariableInput,
  WorkflowVariableTextArea,
  WorkflowTypedVariableInput,
  WorkflowVariableWrapper,
} from '@nocobase/plugin-workflow/client-v2';
```

#### `WorkflowVariableInput`

Поле ввода переменной с поддержкой выбора переменной и продолжения ввода текста. Подходит для однострочных сценариев, требующих сочетания ссылок на переменные и произвольного текста.

```tsx
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'target']} label="Target">
  <WorkflowVariableInput />
</Form.Item>
```

![WorkflowVariableInput](https://static-docs.nocobase.com/20260701160110.png)

**Свойства**

| Параметр | Тип | Описание |
| --- | --- | --- |
| `value?` | `string` | Значение пути переменной, например `{{$jobsMapByNodeKey.xxx.field}}` |
| `onChange?` | `(value: string) => void` | Колбэк изменения значения |
| `variableOptions?` | `UseWorkflowVariableOptions` | Параметры фильтрации переменных (фильтрация по типу, глубина и т.д.) |
| `disabled?` | `boolean` | Отключено ли поле |
| `placeholder?` | `string` | Текст-заполнитель |

#### `WorkflowVariableTextArea`

Многострочное текстовое поле с поддержкой вставки ссылок на переменные в любую позицию курсора. Подходит для сценариев произвольного текста, таких как тело HTTP-запроса, шаблонный текст и т.д.

```tsx
import { WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'body']} label="Body">
  <WorkflowVariableTextArea autoSize={{ minRows: 5 }} />
</Form.Item>
```

![WorkflowVariableTextArea](https://static-docs.nocobase.com/20260701160242.png)

**Свойства**

| Параметр | Тип | Описание |
| --- | --- | --- |
| `value?` | `string` | Текстовое значение (может содержать ссылки на переменные) |
| `onChange?` | `(value: string) => void` | Колбэк изменения значения |
| `variableOptions?` | `UseWorkflowVariableOptions` | Параметры фильтрации переменных |
| `delimiters?` | `readonly [string, string]` | Разделители переменных, по умолчанию `['{{', '}}']` |

Наследует остальные свойства от `TextArea` из antd (такие как `autoSize`, `placeholder` и т.д.).

#### `WorkflowTypedVariableInput`

Типизированный ввод с переключением между режимами «константа» и «ссылка на переменную». В режиме переменной можно только выбрать переменную; продолжение ввода после выбора недоступно. В режиме константы поддерживаются пять типов: `string`, `number`, `boolean`, `date` и `object`.

```tsx
import { WorkflowTypedVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'value']} label="Value">
  <WorkflowTypedVariableInput />
</Form.Item>
```

![WorkflowTypedVariableInput](https://static-docs.nocobase.com/20260701160608.png)

**Свойства**

| Параметр | Тип | Описание |
| --- | --- | --- |
| `variableOptions?` | `UseWorkflowVariableOptions` | Параметры фильтрации переменных |

Наследует остальные свойства от `TypedVariableInput` (за исключением внутренних `extraNodes`, `metaTree`, `namespaces`).

#### `WorkflowVariableWrapper`

Универсальная обёртка для подстановки различных компонентов ввода в различных контекстах. Например, когда одно и то же поле требует разных способов ввода в конфигурации триггера и в панели настройки узла, можно использовать этот компонент для оборачивания нативного элемента ввода в элемент с переключением режима переменной.

```tsx
import { WorkflowVariableWrapper } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'timeout']} label="Timeout">
  <WorkflowVariableWrapper
    render={({ value, onChange }) => (
      <InputNumber value={value} onChange={onChange} min={0} />
    )}
  />
</Form.Item>
```

**Свойства**

| Параметр | Тип | Описание |
| --- | --- | --- |
| `value?` | `TValue \| string \| null` | Текущее значение (значение константы или строка пути переменной) |
| `onChange?` | `(value: TValue \| string \| null) => void` | Колбэк изменения значения |
| `variableOptions?` | `UseWorkflowVariableOptions` | Параметры фильтрации переменных |
| `render` | `(props: { value?, onChange? }) => ReactNode` | Рендерит нативный компонент ввода |
| `clearValue?` | `TValue \| null` | Начальное значение при переключении из режима переменной обратно в режим константы, по умолчанию `null` |

### Компоненты, связанные с коллекциями

Рабочий процесс также предоставляет набор вспомогательных компонентов, связанных с коллекциями:

```ts
import {
  CollectionCascader,
  AppendsSelect,
  FieldsSelect,
  SortFieldsInput,
  PaginationFields,
} from '@nocobase/plugin-workflow/client-v2';
```

- `CollectionCascader` — каскадный селектор коллекций с поддержкой источников данных
- `AppendsSelect` — селектор предзагрузки связанных полей (древовидный выбор)
- `FieldsSelect` — мультиселектор полей коллекции
- `SortFieldsInput` — поле ввода для сортировки
- `PaginationFields` — элементы формы для параметров пагинации
