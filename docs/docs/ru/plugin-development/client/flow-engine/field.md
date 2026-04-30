---
title: "Расширение полей"
description: "Разработка расширений полей NocoBase: базовые классы FieldModel, ClickableFieldModel, рендеринг полей, привязка к интерфейсу поля."
keywords: "расширение полей,Field,FieldModel,ClickableFieldModel,renderComponent,bindModelToInterface,NocoBase"
---

# Расширение полей

В NocoBase **компонент поля (Field)** используется в таблицах и формах для отображения и редактирования данных. Унаследовав соответствующие базовые классы FieldModel, Вы можете кастомизировать способ рендеринга поля — например, отображать определённый тип данных в специальном формате или редактировать через пользовательский компонент.

## Пример: пользовательское отображаемое поле

Следующий пример создаёт простое отображаемое поле — добавляет квадратные скобки `[]` по обе стороны значения поля:

![20260407201138](https://static-docs.nocobase.com/20260407201138.png)

```tsx
// models/SimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    // this.context.record 可以拿到当前行的完整记录
    console.log('当前记录：', this.context.record);
    console.log('当前记录 index：', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// 绑定到 'input' 类型的字段接口
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

Несколько ключевых моментов:

- **`renderComponent(value)`** — принимает текущее значение поля как параметр, возвращает рендеримый JSX
- **`this.context.record`** — получение полной записи данных текущей строки
- **`this.context.recordIndex`** — получение индекса текущей строки
- **`ClickableFieldModel`** — наследует `FieldModel`, имеет возможность взаимодействия по клику
- **`DisplayItemModel.bindModelToInterface()`** — привязывает модель поля к указанному типу интерфейса поля (например, `input` означает поле текстового ввода). Так в полях соответствующего типа можно будет выбрать этот компонент отображения

## Регистрация поля

В `load()` Plugin зарегистрируйте через `registerModelLoaders` для ленивой загрузки:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/SimpleFieldModel'),
      },
    });
  }
}
```

После регистрации в блоке таблицы найдите столбец поля соответствующего типа (например, в примере выше привязано к `input` — соответствует полю однострочного текста), нажмите кнопку настройки столбца — в выпадающем меню «Компонент поля» можно будет переключиться на этот пользовательский компонент отображения. Полный практический пример см. в [Создание пользовательского компонента поля](../examples/custom-field).

![20260407201221](https://static-docs.nocobase.com/20260407201221.png)

## Полный исходный код

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — пример пользовательского компонента поля

## Связанные ссылки

- [Практика плагинов: создание пользовательского компонента поля](../examples/custom-field) — построение пользовательского компонента отображения поля с нуля
- [Практика плагинов: создание плагина управления данными с интеграцией фронтенда и бэкенда](../examples/fullstack-plugin) — практическое применение пользовательского поля в полноценном плагине
- [Обзор FlowEngine](../flow-engine/index.md) — базовое использование FlowModel
- [Расширение блоков](./block) — пользовательские блоки
- [Расширение действий](./action) — пользовательские кнопки действий
- [Определение FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — полные параметры registerFlow и типы событий
- [Полная документация FlowEngine](../../../flow-engine/index.md) — полный справочник
