---
title: "Расширение блоков"
description: "Разработка расширений блоков NocoBase: базовые классы BlockModel, DataBlockModel, CollectionBlockModel, TableBlockModel и способ регистрации."
keywords: "расширение блоков,Block,BlockModel,DataBlockModel,CollectionBlockModel,TableBlockModel,renderComponent,NocoBase"
---

# Расширение блоков

В NocoBase **блок (Block)** — это область содержимого на странице (например, таблица, форма, график, детали и т.д.). Унаследовав базовые классы серии BlockModel, Вы можете создавать пользовательские блоки и регистрировать их в меню «Добавить блок».

## Выбор базового класса

NocoBase предоставляет четыре базовых класса блока — выбирайте в зависимости от потребностей в данных:

| Базовый класс           | Иерархия наследования                | Сценарий применения                       |
| ---------------------- | ------------------------------------ | ----------------------------------------- |
| `BlockModel`           | Самый базовый блок                   | Блок отображения, не нуждающийся в источнике данных |
| `DataBlockModel`       | Наследует `BlockModel`               | Нужны данные, но без привязки к таблице данных NocoBase |
| `CollectionBlockModel` | Наследует `DataBlockModel`           | Привязан к таблице данных NocoBase, автоматически получает данные |
| `TableBlockModel`      | Наследует `CollectionBlockModel`     | Полноценный блок таблицы со столбцами полей, панелью действий, пагинацией и т.д. |

Цепочка наследования: `BlockModel` → `DataBlockModel` → `CollectionBlockModel` → `TableBlockModel`.

Обычно, если Вам нужен готовый блок таблицы, используйте `TableBlockModel` напрямую — у него встроены столбцы полей, панель действий, пагинация, сортировка и другие возможности, это самый часто используемый базовый класс. Если нужен полностью пользовательский способ рендеринга (например, список карточек, временная шкала и т.д.), используйте `CollectionBlockModel` и пишите `renderComponent` самостоятельно. Если требуется только отображать статичный контент или пользовательский UI, достаточно `BlockModel`.

`DataBlockModel` имеет особое позиционирование — сам по себе он не добавляет никаких новых свойств или методов, тело класса пустое. Его роль — **классифицирующий идентификатор**: блоки, наследующие `DataBlockModel`, попадают в группу меню «Блоки данных» в UI. Если Ваш блок должен сам управлять логикой получения данных (не используя стандартную привязку Collection в NocoBase), можно унаследовать `DataBlockModel`. Например, `ChartBlockModel` плагина графиков именно такой — он использует пользовательский `ChartResource` для получения данных, не нуждаясь в стандартной привязке к таблице данных. В большинстве сценариев `DataBlockModel` напрямую использовать не нужно — достаточно `CollectionBlockModel` или `TableBlockModel`.

## Пример BlockModel

Самый простой блок — поддерживающий редактирование HTML-содержимого:

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Этот пример охватывает три шага разработки блока:

1. **`renderComponent()`** — рендеринг UI блока, чтение свойств через `this.props`
2. **`define()`** — установка отображаемого имени блока в меню «Добавить блок»
3. **`registerFlow()`** — добавление панели визуальной конфигурации, пользователь может в интерфейсе редактировать HTML-содержимое

## Пример CollectionBlockModel

Если блок должен быть привязан к таблице данных NocoBase, используйте `CollectionBlockModel`. Он автоматически обрабатывает получение данных:

```tsx
// models/ManyRecordBlockModel.tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '@nocobase/flow-engine';

export class ManyRecordBlockModel extends CollectionBlockModel {
  // 声明这是一个多条记录的区块
  static scene = BlockSceneEnum.many;

  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    return (
      <div>
        <h3>数据表区块</h3>
        {/* resource.getData() 获取数据表的数据 */}
        <pre>{JSON.stringify(this.resource.getData(), null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records'),
});
```

По сравнению с `BlockModel`, у `CollectionBlockModel` есть дополнительно:

- **`static scene`** — объявление сценария блока. Распространённые значения: `BlockSceneEnum.many` (список нескольких записей), `BlockSceneEnum.one` (детали/форма одной записи). Полное перечисление также включает `new`, `select`, `filter`, `subForm`, `bulkEditForm` и т.д.
- **`createResource()`** — создание ресурса данных, `MultiRecordResource` для получения нескольких записей
- **`this.resource.getData()`** — получение данных таблицы данных

## Пример TableBlockModel

`TableBlockModel` наследует `CollectionBlockModel` и является встроенным в NocoBase полноценным блоком таблицы — со встроенными столбцами полей, панелью действий, пагинацией, сортировкой и другими возможностями. То, что выбирает пользователь в «Добавить блок» → «Table», — это и есть он.

Обычно, если встроенного `TableBlockModel` достаточно для нужд, пользователю достаточно добавить его прямо в интерфейсе, разработчику ничего делать не нужно. Только когда Вам нужно **выполнить кастомизацию на основе TableBlockModel**, нужно его наследовать — например:

- Переопределить `customModelClasses` для замены встроенных моделей групп действий или столбцов полей
- Через `filterCollection` ограничить доступность только для определённой таблицы данных
- Зарегистрировать дополнительные Flow, чтобы добавить пользовательские пункты конфигурации

```tsx
// 示例：限制只对 todoItems 数据表可用的表格区块
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

Полный пример кастомизации `TableBlockModel` см. в [Создание плагина управления данными с интеграцией фронтенда и бэкенда](../examples/fullstack-plugin).

## Регистрация блока

Зарегистрируйте в `load()` Plugin:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        loader: () => import('./models/SimpleBlockModel'),
      },
      ManyRecordBlockModel: {
        loader: () => import('./models/ManyRecordBlockModel'),
      },
    });
  }
}
```

После регистрации в интерфейсе NocoBase нажмите «Добавить блок» — и Вы увидите Ваш пользовательский блок.

## Полный исходный код

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — пример BlockModel
- [@nocobase-example/plugin-collection-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-collection-block) — пример CollectionBlockModel

## Связанные ссылки

- [Практика плагинов: создание пользовательского блока отображения](../examples/custom-block) — построение конфигурируемого блока BlockModel с нуля
- [Практика плагинов: создание плагина управления данными с интеграцией фронтенда и бэкенда](../examples/fullstack-plugin) — полный пример TableBlockModel + пользовательское поле + пользовательское действие
- [Обзор FlowEngine](../flow-engine/index.md) — базовое использование FlowModel и registerFlow
- [Расширение полей](./field) — пользовательские компоненты полей
- [Расширение действий](./action) — пользовательские кнопки действий
- [Шпаргалка по Resource API](../../../api/flow-engine/resource.md) — полные сигнатуры методов MultiRecordResource / SingleRecordResource
- [Определение FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — полные параметры registerFlow и типы событий
- [Полная документация FlowEngine](../../../flow-engine/index.md) — полный справочник
