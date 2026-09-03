---
title: "Руководство по миграции с v1 на v2"
description: "Разработка расширений рабочего процесса: руководство по миграции клиентского кода с v1 на v2."
keywords: "рабочий процесс,миграция,v1,v2,NocoBase"
---

# Руководство по миграции клиентского кода с v1 на v2

Данное руководство описывает, как перенести клиентский код плагина расширения рабочего процесса с v1 на v2. Основное изменение в клиенте v2 — замена декларативных интерфейсов настройки на основе Formily Schema подходом с Loader и чистыми React/antd-компонентами.

## Обзор

### Основные изменения

1. **Изменение путей импорта**: `@nocobase/plugin-workflow/client` → `@nocobase/plugin-workflow/client-v2`, базовый класс плагина `@nocobase/client` → `@nocobase/client-v2`
2. **Изменение паттерна интерфейса настройки**: от объектов Formily Schema (`fieldset`) к React-компонентам с отложенной загрузкой через Loader (`FieldsetLoader`)
3. **Удалены свойства `scope`/`components`**: больше нет необходимости внедрять объекты scope или компоненты в Schema; просто импортируйте и используйте их напрямую в React-компонентах

### Таблица соответствия путей импорта

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client';

// v2
import { Plugin } from '@nocobase/client-v2';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client-v2';
```

## Общие правила

### Паттерн Loader

В v2 свойства типа `LoaderOf` заменяют объекты Formily Schema, такие как `fieldset` в v1. Loader — это по сути функция, возвращающая `Promise<{ default: ComponentType }>`, реализующая разделение кода и отложенную загрузку через динамический `import()`:

```ts
// v1: Formily Schema object
fieldset = {
  interval: {
    type: 'number',
    title: 'Interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: Loader pointing to a React component
FieldsetLoader = () => import('./MyConfig');
```

Когда Loader должен указывать на именованный экспорт (а не экспорт по умолчанию), используйте `.then()` для переназначения:

```ts
FieldsetLoader = () => import('./MyConfig').then((m) => ({ default: m.MyPresetConfig }));
```

### Синтаксис компонента настройки

Компонент, загружаемый Loader, — стандартный функциональный React-компонент, использующий `Form.Item` из antd для построения форм. Пути полей неизменно используют формат вложенного массива `['config', 'fieldName']`:

```tsx
// v1: Formily Schema
fieldset = {
  interval: {
    type: 'number',
    title: '{{t("Interval")}}',
    name: 'config.interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: React component
import { Form, InputNumber } from 'antd';

export default function MyConfig() {
  const { t } = useWorkflowTranslation();

  return (
    <Form.Item
      name={['config', 'interval']}
      label={t('Interval')}
      initialValue={60000}
    >
      <InputNumber />
    </Form.Item>
  );
}
```

## Миграция триггеров

### Таблица соответствия свойств

| Свойство v1 | Свойство v2 | Описание |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | Форма настройки триггера |
| `presetFieldset` | `PresetFieldsetLoader` | Предустановленная форма при создании |
| `triggerFieldset` | `TriggerFieldsetLoader` | Форма ввода для ручного запуска |
| `scope` | Удалено | Больше не нужно; импортируйте напрямую в компоненте |
| `components` | Удалено | Больше не нужно; импортируйте напрямую в компоненте |
| `view` | Удалено | |
| — | `validate(config)` | Новое; валидация конфигурации |
| — | `createDefaultConfig()` | Новое; предоставляет значения конфигурации по умолчанию |

### Пример миграции

**Синтаксис v1:**

```ts
import { Trigger } from '@nocobase/plugin-workflow/client';

class MyTrigger extends Trigger {
  title = '{{t("My Trigger")}}';
  fieldset = {
    collection: {
      type: 'string',
      title: '{{t("Collection")}}',
      'x-decorator': 'FormItem',
      'x-component': 'CollectionSelect',
      required: true,
    },
    mode: {
      type: 'number',
      title: '{{t("Mode")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        options: [
          { label: '{{t("Created")}}', value: 1 },
          { label: '{{t("Updated")}}', value: 2 },
        ],
      },
    },
  };
  scope = { /* ... */ };
  components = { CollectionSelect };
}
```

**Синтаксис v2:**

```ts
import { Trigger } from '@nocobase/plugin-workflow/client-v2';

class MyTrigger extends Trigger {
  title = '{{t("My Trigger")}}';

  PresetFieldsetLoader = () =>
    import('./MyTriggerConfig').then((m) => ({ default: m.MyPresetConfig }));
  FieldsetLoader = () => import('./MyTriggerConfig');
  TriggerFieldsetLoader = () => import('./TriggerMyConfig');

  validate(config) {
    return Boolean(config?.collection && config?.mode);
  }
}
```

```tsx
// MyTriggerConfig.tsx
import { Form, Select } from 'antd';
import { CollectionCascader } from '@nocobase/plugin-workflow/client-v2';

export function MyPresetConfig() {
  return (
    <Form.Item name={['config', 'collection']} label="Collection" rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

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

### Регистрация плагина

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin);
    workflow.registerTrigger('myTrigger', MyTrigger);
  }
}

// v2
import { Plugin } from '@nocobase/client-v2';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow');
    workflow.registerTrigger('myTrigger', MyTrigger);
  }
}
```

## Миграция узлов

### Таблица соответствия свойств

| Свойство v1 | Свойство v2 | Описание |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | Форма настройки узла в панели |
| `presetFieldset` | `PresetFieldsetLoader` | Предустановленная форма при создании |
| `Component` | `ComponentLoader` | Пользовательский рендеринг узла на холсте |
| `scope` | Удалено | Больше не нужно; импортируйте напрямую в компоненте |
| `components` | Удалено | Больше не нужно; импортируйте напрямую в компоненте |
| `view` | Удалено | |
| — | `createDefaultConfig()` | Новое; предоставляет значения конфигурации по умолчанию |

### Пример миграции

**Синтаксис v1:**

```ts
import WorkflowPlugin, { Instruction } from '@nocobase/plugin-workflow/client';

class MyInstruction extends Instruction {
  title = 'Random string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    digit: {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': { min: 1, max: 10 },
      default: 6,
    },
  };
  useVariables(node, options) {
    return { value: node.key, label: node.title };
  }
}
```

**Синтаксис v2:**

```ts
import { Instruction } from '@nocobase/plugin-workflow/client-v2';

class MyInstruction extends Instruction {
  title = 'Random string';
  type = 'randomString';
  group = 'extended';

  FieldsetLoader = () => import('./components/RandomStringConfig');

  useVariables(node, options) {
    return { value: node.key, label: node.title };
  }
}
```

```tsx
// components/RandomStringConfig.tsx
import { Form, InputNumber } from 'antd';

export default function RandomStringConfig() {
  return (
    <Form.Item
      name={['config', 'digit']}
      label="Digit"
      initialValue={6}
      rules={[{ required: true }]}
    >
      <InputNumber min={1} max={10} />
    </Form.Item>
  );
}
```

## Прочие замечания

### Неизменённые части

Следующие свойства и методы имеют практически одинаковые сигнатуры в v1 и v2 и могут быть оставлены без изменений при миграции:

- `useVariables(node/config, options)` — предоставляет варианты переменных
- `useScopeVariables(node, options)` — предоставляет переменные области видимости ветви
- `isAvailable(ctx)` — проверка доступности узла (в v2 `NodeAvailableContext` добавлено новое свойство `engine`)

### Новые свойства в v2

- `getCreateModelMenuItem` — определяет конфигурацию создания пунктов меню подмоделей для узлов/триггеров на холсте v2
- `useTempAssociationSource` — предоставляет информацию о временном источнике ассоциативных данных
- `validate(config)` — валидация конфигурации триггера (только для триггеров)
- `branching` — объявляет, является ли узел узлом ветвления (только для узлов)
- `end` — объявляет, является ли узел завершающим (только для узлов)
- `testable` — объявляет, поддерживает ли узел тестовый запуск (только для узлов)

### Согласованность семантики значений

При миграции убедитесь, что значения форм, генерируемые компонентами v2, согласованы с v1, особенно структура данных при ручном запуске. Например, если форма ручного запуска в v1 сохраняет полный объект записи, версия v2 должна сохранять ту же структуру значений, а не только первичный ключ.
