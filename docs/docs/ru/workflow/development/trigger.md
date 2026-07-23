---
title: "Расширение типов триггеров"
description: "Расширение типов триггеров: разработка пользовательских триггеров, интерфейс настройки, логика срабатывания, справочник API."
keywords: "рабочий процесс,расширение триггеров,пользовательские триггеры,разработка триггеров,NocoBase"
---

# Расширение типов триггеров

Каждый рабочий процесс должен быть настроен с конкретным триггером — это точка входа для запуска выполнения.

Тип триггера обычно соответствует конкретному событию в окружении системы. В течение жизненного цикла приложения для определения типа триггера можно использовать любую часть системы с подписываемыми событиями: приём запросов, операции с коллекциями, задачи по расписанию и т. д.

Типы триггеров регистрируются в таблице триггеров плагина по строковому идентификатору. В плагине «Рабочий процесс» есть несколько встроенных триггеров:

- `'collection'`: срабатывает при операциях с коллекциями;
- `'schedule'`: срабатывает по расписанию;
- `'action'`: срабатывает при событиях после действия;


Для добавляемых типов триггеров нужно обеспечивать уникальность идентификаторов. Реализация подписки и отписки регистрируется на сервере, а интерфейс настройки — на клиенте.

## Серверная часть

Любой триггер наследует базовый класс `Trigger` и реализует методы `on` и `off` для подписки на события окружения и отписки от них соответственно. В методе `on` в обратном вызове нужного события нужно вызвать `this.workflow.trigger()`, чтобы запустить рабочий процесс. В методе `off` выполняется очистка при отписке.

`this.workflow` — экземпляр плагина рабочего процесса, передаваемый в конструктор базового класса `Trigger`.

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

Затем в плагине, расширяющем рабочий процесс, зарегистрируйте экземпляр триггера в движке рабочего процесса:

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

После старта и загрузки сервера триггер типа `'interval'` можно добавить и выполнять.

## Клиентская часть

На клиенте в основном задаётся интерфейс настройки по параметрам, которые требует тип триггера. Каждый тип триггера также должен зарегистрировать свою конфигурацию в плагине «Рабочий процесс».

Интерфейс настройки триггера определяется через Loader (функцию отложенной загрузки), которая указывает на обычный React-компонент, строящий форму с помощью `Form.Item` из antd.

### Простейший триггер

Например, для триггера периодического запуска, описанного выше, определите в форме настройки параметр интервала (`interval`):

```ts
import { Trigger } from '@nocobase/plugin-workflow/client-v2';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';

  // Trigger config form (lazy-loaded component)
  FieldsetLoader = () => import('./IntervalConfig');

  // Config validation
  validate(config) {
    return Boolean(config?.interval);
  }
}
```

Здесь `FieldsetLoader` — функция, возвращающая `Promise<{ default: ComponentType }>`, реализующая отложенную загрузку через динамический `import()`. Компонент, на который она указывает, — стандартный функциональный React-компонент:

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

Обратите внимание, что поле формы `name` использует формат вложенного массива `['config', 'fieldName']` — стандартное соглашение antd Form.

### Несколько интерфейсов настройки

Триггер может предоставлять несколько интерфейсов настройки для различных сценариев:

- `PresetFieldsetLoader` — предустановленная форма при создании рабочего процесса (обычно содержит только обязательные поля)
![PresetFieldsetLoader](https://static-docs.nocobase.com/20260701152711.png)

- `FieldsetLoader` — полная форма настройки триггера (отображается в панели настройки)
![FieldsetLoader](https://static-docs.nocobase.com/20260701152822.png)

- `TriggerFieldsetLoader` — форма ввода для ручного запуска
![FieldsetLoader](https://static-docs.nocobase.com/20260701152846.png)

Когда Loader должен указывать на именованный экспорт (а не экспорт по умолчанию) файла, используйте `.then()` для переназначения:

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

// Preset form for creation (named export)
export function MyPresetConfig() {
  return (
    <Form.Item name={['config', 'collection']} label="Collection" rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

// Full config form (default export)
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

### Регистрация триггера

Зарегистрируйте тип триггера в экземпляре плагина рабочего процесса внутри расширяющего плагина:

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

После этого новый тип триггера появится в интерфейсе настройки рабочего процесса.

:::info{title=Примечание}
Идентификатор типа триггера, зарегистрированный на клиенте, должен совпадать с идентификатором на сервере, иначе возникнут ошибки.
:::

Полный пример из реального проекта: [исходный код CollectionTrigger](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/triggers/collection/index.tsx)

Подробнее об определении типов триггеров см. раздел [Справочник API](./api).

:::info{title=Примечание}
Если вы ранее использовали устаревший клиентский код (v1) и хотите перейти на новую версию v2, обратитесь к [Руководству по миграции с v1 на v2](./migration).
:::
