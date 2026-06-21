---
title: "Создание пользовательского компонента поля"
description: "Практика плагинов NocoBase: создание пользовательского компонента отображения поля с ClickableFieldModel и привязка к интерфейсу поля."
keywords: "пользовательское поле,FieldModel,ClickableFieldModel,bindModelToInterface,расширение полей,NocoBase"
---

# Создание пользовательского компонента поля

В NocoBase компонент поля используется в таблицах и формах для отображения и редактирования данных. Этот пример показывает, как с помощью `ClickableFieldModel` создать пользовательский компонент отображения поля — добавить квадратные скобки `[]` по обе стороны значения поля и привязать его к интерфейсу полей типа `input`.

:::tip Предварительное чтение

Рекомендуется сначала ознакомиться со следующим — это упростит разработку:

- [Написание первого плагина](../../write-your-first-plugin) — создание плагина и структура каталогов
- [Plugin (Плагин)](../plugin) — точка входа плагина и жизненный цикл `load()`
- [Обзор FlowEngine](../flow-engine/index.md) — базовое использование FlowModel
- [FlowEngine → Расширение полей](../flow-engine/field) — введение в базовые классы FieldModel, ClickableFieldModel
- [i18n Интернационализация](../component/i18n) — формат файлов перевода и использование `tExpr()` для отложенного перевода

:::

## Конечный результат

Мы делаем пользовательский компонент отображения поля:

- Наследует `ClickableFieldModel`, кастомизирует логику рендеринга
- Отображает значение поля с `[]` по обе стороны
- Через `bindModelToInterface` привязан к полям типа `input` (однострочный текст)

После включения плагина в блоке таблицы найдите столбец однострочного текстового поля, нажмите кнопку настройки столбца — в выпадающем меню «Компонент поля» появится опция `DisplaySimpleFieldModel`. После переключения значение в столбце будет отображаться в формате `[value]`.

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_20.08.48.mp4" type="video/mp4">
</video>

Полный исходный код см. в [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple). Если хотите запустить и посмотреть локально:

```bash
yarn pm enable @nocobase-example/plugin-field-simple
```

Ниже шаг за шагом построим этот плагин с нуля.

## Шаг 1: создать каркас плагина

Выполните в корне репозитория:

```bash
yarn pm create @my-project/plugin-field-simple
```

Подробное описание см. в [Написание первого плагина](../../write-your-first-plugin).

## Шаг 2: создать модель поля

Создайте `src/client-v2/models/DisplaySimpleFieldModel.tsx`. Это ядро плагина — здесь определяется, как поле рендерится и к какому интерфейсу полей оно привязано.

```tsx
// src/client-v2/models/DisplaySimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    // this.context.record 可以拿到当前行的完整记录
    console.log('当前记录：', this.context.record);
    console.log('当前记录 index：', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// 设置在「字段组件」下拉菜单里的显示名
DisplaySimpleFieldModel.define({
  label: tExpr('Simple field'),
});

// 绑定到 'input'（单行文本）类型的字段接口
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

Несколько ключевых моментов:

- **`renderComponent(value)`** — принимает текущее значение поля как параметр, возвращает рендеримый JSX
- **`this.context.record`** — получение полной записи данных текущей строки
- **`this.context.recordIndex`** — получение индекса текущей строки
- **`ClickableFieldModel`** — наследует `FieldModel`, имеет возможность взаимодействия по клику
- **`define({ label })`** — установка отображаемого имени в выпадающем меню «Компонент поля». Без этого будет напрямую отображаться имя класса
- **`DisplayItemModel.bindModelToInterface()`** — привязывает модель поля к указанному типу интерфейса поля (например, `input` означает поле однострочного текста). Так в полях соответствующего типа можно будет выбрать этот компонент отображения

## Шаг 3: добавить файлы локализации

Отредактируйте файлы перевода в `src/locale/` плагина, добавьте переводы для ключей, использованных в `tExpr()`:

```json
// src/locale/zh-CN.json
{
  "Simple field": "简单字段"
}
```

```json
// src/locale/en-US.json
{
  "Simple field": "Simple field"
}
```

:::warning Внимание

При первом добавлении файла языка нужно перезапустить приложение, чтобы он вступил в силу.

:::

О формате файлов перевода и других способах использования `tExpr()` подробнее см. в [i18n Интернационализация](../component/i18n).

## Шаг 4: зарегистрировать в плагине

Отредактируйте `src/client-v2/plugin.tsx`, через `registerModelLoaders` подгружайте модель по требованию:

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/DisplaySimpleFieldModel'),
      },
    });
  }
}

export default PluginFieldSimpleClient;
```

## Шаг 5: включить плагин

```bash
yarn pm enable @my-project/plugin-field-simple
```

После включения в блоке таблицы найдите столбец однострочного текстового поля, нажмите кнопку настройки столбца — в выпадающем меню «Компонент поля» можно будет переключиться на этот пользовательский компонент отображения.

## Полный исходный код

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — полный пример пользовательского компонента поля

## Резюме

Возможности, использованные в этом примере:

| Возможность     | Использование                                        | Документация                                |
| --------------- | ---------------------------------------------------- | ------------------------------------------- |
| Рендеринг поля  | `ClickableFieldModel` + `renderComponent(value)`     | [FlowEngine → Расширение полей](../flow-engine/field) |
| Привязка к интерфейсу поля | `DisplayItemModel.bindModelToInterface()`         | [FlowEngine → Расширение полей](../flow-engine/field) |
| Регистрация модели | `this.flowEngine.registerModelLoaders()`          | [Plugin (Плагин)](../plugin)                |

## Связанные ссылки

- [Написание первого плагина](../../write-your-first-plugin) — создание каркаса плагина с нуля
- [Обзор FlowEngine](../flow-engine/index.md) — базовое использование FlowModel
- [FlowEngine → Расширение полей](../flow-engine/field) — FieldModel, ClickableFieldModel, bindModelToInterface
- [FlowEngine → Расширение блоков](../flow-engine/block) — пользовательские блоки
- [Component vs FlowModel](../component-vs-flow-model) — когда использовать FlowModel
- [Plugin (Плагин)](../plugin) — точка входа плагина и жизненный цикл load()
- [i18n Интернационализация](../component/i18n) — формат файлов перевода и использование tExpr
- [Полная документация FlowEngine](../../../flow-engine/index.md) — полный справочник FlowModel, Flow, Context
