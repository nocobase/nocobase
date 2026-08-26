---
title: "Обзор FlowEngine"
description: "Руководство по разработке плагинов NocoBase FlowEngine: базовое использование FlowModel, renderComponent, registerFlow, конфигурация uiSchema, выбор базового класса."
keywords: "FlowEngine,FlowModel,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# FlowEngine

В NocoBase **FlowEngine (поточный движок)** — это ядро, управляющее визуальной конфигурацией. Блоки, поля, кнопки действий в интерфейсе NocoBase управляются через FlowEngine — включая их рендеринг, панели конфигурации и сохранение конфигурации.

![20260403215904](https://static-docs.nocobase.com/20260403215904.png)

Для разработчиков плагинов FlowEngine предоставляет два ключевых концепта:

- **FlowModel** — конфигурируемая модель компонента, отвечает за рендеринг UI и управление props
- **Flow** — процесс конфигурации, определяет панель конфигурации компонента и логику обработки данных

Если Ваш компонент должен появиться в меню «Добавить блок / поле / действие» или должен поддерживать визуальную конфигурацию пользователем в интерфейсе, его нужно обернуть через FlowModel. Если эти возможности не нужны, достаточно обычного React-компонента — см. [Component vs FlowModel](../component-vs-flow-model).

## Что такое FlowModel

В отличие от обычного React-компонента, FlowModel помимо рендеринга UI также управляет источником props, определением панели конфигурации и сохранением конфигурации. Проще говоря: props обычного компонента жёстко заданы, а props FlowModel генерируются динамически через Flow.

Если хотите глубже разобраться в архитектуре FlowEngine, см. [полную документацию FlowEngine](../../../flow-engine/index.md). Ниже описано использование с точки зрения разработчика плагина.

## Минимальный пример

Создание и регистрация FlowModel выполняется в три шага:

### 1. Унаследовать базовый класс, реализовать renderComponent

```tsx
// models/HelloBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h3>Hello FlowEngine!</h3>
        <p>这是一个自定义区块。</p>
      </div>
    );
  }
}

// define() 设置菜单里的显示名
HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

`renderComponent()` — это метод рендеринга этой модели, аналогичный `render()` React-компонента. `tExpr()` используется для отложенного перевода — потому что `define()` выполняется на этапе загрузки модуля, и в этот момент i18n ещё не инициализирован. Подробнее см. [Распространённые возможности Context → tExpr](../ctx/common-capabilities#texpr).

### 2. Зарегистрировать в Plugin

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        // 按需加载，首次用到时才加载模块
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

### 3. Использовать в интерфейсе

После регистрации, после запуска плагина (см. включение плагина в [Обзор разработки плагинов](../../index.md)), создайте новую страницу в интерфейсе NocoBase, нажмите «Добавить блок» — и Вы увидите Ваш «Hello block».

![20260403221815](https://static-docs.nocobase.com/20260403221815.png)

## Добавление пунктов конфигурации через registerFlow

Просто рендерить — этого мало. Ключевая ценность FlowModel — **возможность конфигурации**. Через `registerFlow()` можно добавить модели панель конфигурации, чтобы пользователь мог изменять свойства в интерфейсе.

Например, блок, поддерживающий редактирование HTML-содержимого:

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    // this.props 的值来自 Flow handler 的设置
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // 渲染前执行
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema 定义配置面板的 UI
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // 默认值
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // handler 里把配置面板的值设置到 model 的 props 上
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Несколько ключевых моментов:

- **`on: 'beforeRender'`** — указывает, что этот Flow выполняется перед рендерингом, значения панели конфигурации записываются в `this.props` до рендеринга
- **`uiSchema`** — определяет UI панели конфигурации в формате JSON Schema, синтаксис см. в [UI Schema](../../../flow-engine/ui-schema)
- **`handler(ctx, params)`** — `params` — это значения, заполненные пользователем в панели конфигурации; через `ctx.model.props` они устанавливаются на модель
- **`defaultParams`** — значения по умолчанию для панели конфигурации

## Распространённые приёмы написания uiSchema

`uiSchema` основан на JSON Schema. v2 совместима с синтаксисом uiSchema, но сценарии использования ограничены — в основном, для описания UI формы в панелях конфигурации Flow. Большая часть рендеринга компонентов во время выполнения рекомендуется выполнять напрямую через компоненты Antd, не используя uiSchema.

Здесь перечислены наиболее распространённые компоненты (полный справочник см. в [UI Schema](../../../flow-engine/ui-schema)):

```ts
uiSchema: {
  // 文本输入
  title: {
    type: 'string',
    title: '标题',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  // 多行文本
  content: {
    type: 'string',
    title: '内容',
    'x-decorator': 'FormItem',
    'x-component': 'Input.TextArea',
  },
  // 下拉选择
  type: {
    type: 'string',
    title: '类型',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    enum: [
      { label: '主要', value: 'primary' },
      { label: '默认', value: 'default' },
      { label: '虚线', value: 'dashed' },
    ],
  },
  // 开关
  bordered: {
    type: 'boolean',
    title: '显示边框',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
  },
}
```

Каждое поле оборачивается через `'x-decorator': 'FormItem'` — это автоматически добавит заголовок и компоновку.

## Описание параметров define()

`FlowModel.define()` используется для установки метаданных модели, контролирующих способ её отображения в меню. В разработке плагинов чаще всего используется `label`, но также поддерживаются и другие параметры:

| Параметр | Тип | Описание |
|------|------|------|
| `label` | `string \| ReactNode` | Отображаемое имя в меню «Добавить блок / поле / действие», поддерживает `tExpr()` для отложенного перевода |
| `icon` | `ReactNode` | Иконка в меню |
| `sort` | `number` | Вес сортировки, чем меньше число, тем выше. По умолчанию `0` |
| `hide` | `boolean \| (ctx) => boolean` | Скрывать ли в меню, поддерживает динамическое определение |
| `group` | `string` | Идентификатор группы, для группировки в определённую группу меню |
| `children` | `SubModelItem[] \| (ctx) => SubModelItem[]` | Дочерние пункты меню, поддерживается асинхронная функция для динамического построения |
| `toggleable` | `boolean \| (model) => boolean` | Поддерживает ли поведение переключения (уникальное в рамках одного родителя) |
| `searchable` | `boolean` | Включён ли поиск в дочернем меню |

Большинству плагинов достаточно установить только `label`:

```ts
MyBlockModel.define({
  label: tExpr('My block'),
});
```

Если нужно управлять сортировкой или скрытием, добавьте `sort` и `hide`:

```ts
MyBlockModel.define({
  label: tExpr('My block'),
  sort: 10,       // 排在后面
  hide: (ctx) => !ctx.someCondition,  // 条件隐藏
});
```

## Выбор базового класса FlowModel

NocoBase предоставляет несколько базовых классов FlowModel — выбирайте в зависимости от типа расширения:

| Базовый класс           | Назначение                          | Подробная документация |
| ---------------------- | ---------------------------------- | -------------------- |
| `BlockModel`           | Обычный блок                       | [Расширение блоков](./block) |
| `DataBlockModel`       | Блок, самостоятельно получающий данные | [Расширение блоков](./block) |
| `CollectionBlockModel` | Привязан к таблице данных, автоматически получает данные | [Расширение блоков](./block) |
| `TableBlockModel`      | Полноценный блок таблицы со встроенными столбцами полей, панелью действий и т.д. | [Расширение блоков](./block) |
| `FieldModel`           | Компонент поля                     | [Расширение полей](./field) |
| `ActionModel`          | Кнопка действия                    | [Расширение действий](./action) |

Обычно для блока таблицы используют `TableBlockModel` (наиболее распространённый, готовое решение); для полностью пользовательского рендеринга — `CollectionBlockModel` или `BlockModel`; для полей — `FieldModel`; для кнопок действий — `ActionModel`.

## Связанные ссылки

- [Расширение блоков](./block) — разработка блоков на базовых классах серии BlockModel
- [Расширение полей](./field) — разработка пользовательских полей на FieldModel
- [Расширение действий](./action) — разработка кнопок действий на ActionModel
- [Component vs FlowModel](../component-vs-flow-model) — не уверены, какой подход выбрать?
- [Определение FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — полное описание параметров registerFlow и список типов событий
- [Полная документация FlowEngine](../../../flow-engine/index.md) — полный справочник FlowModel, Flow, Context
- [Быстрый старт FlowEngine](../../../flow-engine/quickstart) — построение оркестрируемого компонента кнопки с нуля
- [Обзор разработки плагинов](../../index.md) — общее введение в разработку плагинов
- [UI Schema](../../../flow-engine/ui-schema) — справочник по синтаксису uiSchema
