---
title: "Создание пользовательской кнопки действия"
description: "Практика плагинов NocoBase: создание пользовательских кнопок действий с ActionModel + ActionSceneEnum, поддержка действий уровня таблицы данных и уровня записи."
keywords: "пользовательское действие,ActionModel,ActionSceneEnum,кнопка действия,NocoBase"
---

# Создание пользовательской кнопки действия

В NocoBase действие (Action) — это кнопка в блоке, используемая для запуска бизнес-логики (например, «Создать», «Редактировать», «Удалить» и т.д.). Этот пример показывает, как с помощью `ActionModel` сделать пользовательскую кнопку действия и через `ActionSceneEnum` контролировать сценарий появления кнопки.

:::tip Предварительное чтение

Рекомендуется сначала ознакомиться со следующим — это упростит разработку:

- [Написание первого плагина](../../write-your-first-plugin) — создание плагина и структура каталогов
- [Plugin (Плагин)](../plugin) — точка входа плагина и жизненный цикл `load()`
- [FlowEngine → Расширение действий](../flow-engine/action) — введение в ActionModel, ActionSceneEnum
- [i18n Интернационализация](../component/i18n) — формат файлов перевода и использование `tExpr()` для отложенного перевода

:::

## Конечный результат

Мы делаем три пользовательские кнопки действий, по одной для каждого из трёх сценариев действия:

- **Действие уровня таблицы данных** (`collection`) — появляется в панели действий вверху блока, рядом с кнопкой «Создать»
- **Действие уровня записи** (`record`) — появляется в столбце действий каждой строки таблицы, рядом с «Редактировать», «Удалить»
- **Подходит для обоих** (`both`) — появляется в обоих сценариях

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

Полный исходный код см. в [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action). Если хотите запустить и посмотреть локально:

```bash
yarn pm enable @nocobase-example/plugin-simple-action
```

Ниже шаг за шагом построим этот плагин с нуля.

## Шаг 1: создать каркас плагина

Выполните в корне репозитория:

```bash
yarn pm create @my-project/plugin-simple-action
```

Подробное описание см. в [Написание первого плагина](../../write-your-first-plugin).

## Шаг 2: создать модели действий

Каждое действие должно объявить сценарий своего появления через статическое свойство `static scene`:

| Сценарий   | Значение                       | Описание                                |
| ---------- | ------------------------------ | --------------------------------------- |
| collection | `ActionSceneEnum.collection`   | Применяется к таблице данных, например, кнопка «Создать» |
| record     | `ActionSceneEnum.record`       | Применяется к одной записи, например, кнопки «Редактировать», «Удалить» |
| both       | `ActionSceneEnum.both`         | Доступно в обоих сценариях              |

### Действие уровня таблицы данных

Создайте `src/client-v2/models/SimpleCollectionActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});

// 通过 registerFlow 监听点击事件，用 ctx.message 给用户反馈
SimpleCollectionActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple collection action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.success(ctx.t('Collection action clicked'));
      },
    },
  },
});
```

### Действие уровня записи

Создайте `src/client-v2/models/SimpleRecordActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});

// 记录级操作可以通过 ctx.model.context 拿到当前行的数据和索引
SimpleRecordActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple record action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        const index = ctx.model.context.recordIndex;
        const record = ctx.model.context.record;
        const id = record?.id;
        ctx.message.info(ctx.t('Record action clicked, record ID: {{id}}, row index: {{index}}', { id, index }));
      },
    },
  },
});
```

### Подходит для обоих сценариев

Создайте `src/client-v2/models/SimpleBothActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});

SimpleBothActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple both action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.info(ctx.t('Both action clicked'));
      },
    },
  },
});
```

Структура трёх вариантов одинакова — различие только в значении `static scene` и тексте кнопки. Каждая кнопка через `registerFlow({ on: 'click' })` слушает событие клика, через `ctx.message` показывает уведомление, чтобы пользователь видел, что кнопка действительно сработала.

## Шаг 3: добавить файлы локализации

Отредактируйте файлы перевода в `src/locale/` плагина:

```json
// src/locale/zh-CN.json
{
  "Simple collection action": "简单数据表操作",
  "Simple record action": "简单记录操作",
  "Simple both action": "简单通用操作",
  "Collection action clicked": "数据表操作被点击了",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "记录操作被点击了，记录 ID：{{id}}，行索引：{{index}}",
  "Both action clicked": "通用操作被点击了"
}
```

```json
// src/locale/en-US.json
{
  "Simple collection action": "Simple collection action",
  "Simple record action": "Simple record action",
  "Simple both action": "Simple both action",
  "Collection action clicked": "Collection action clicked",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "Record action clicked, record ID: {{id}}, row index: {{index}}",
  "Both action clicked": "Both action clicked"
}
```

:::warning Внимание

При первом добавлении файла языка нужно перезапустить приложение, чтобы он вступил в силу.

:::

О формате файлов перевода и других способах использования `tExpr()` подробнее см. в [i18n Интернационализация](../component/i18n).

## Шаг 4: зарегистрировать в плагине

Отредактируйте `src/client-v2/plugin.tsx`, зарегистрируйте через `registerModelLoaders` для ленивой загрузки:

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleActionClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleCollectionActionModel: {
        loader: () => import('./models/SimpleCollectionActionModel'),
      },
      SimpleRecordActionModel: {
        loader: () => import('./models/SimpleRecordActionModel'),
      },
      SimpleBothActionModel: {
        loader: () => import('./models/SimpleBothActionModel'),
      },
    });
  }
}

export default PluginSimpleActionClient;
```

## Шаг 5: включить плагин

```bash
yarn pm enable @my-project/plugin-simple-action
```

После включения в «Настройка действий» блока таблицы можно будет добавить эти пользовательские кнопки действий.

## Полный исходный код

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — полный пример с тремя сценариями действий

## Резюме

Возможности, использованные в этом примере:

| Возможность | Использование                                | Документация                                   |
| ----------- | -------------------------------------------- | ---------------------------------------------- |
| Кнопка действия | `ActionModel` + `static scene`            | [FlowEngine → Расширение действий](../flow-engine/action) |
| Сценарий действия | `ActionSceneEnum.collection / record / both / all` | [FlowEngine → Расширение действий](../flow-engine/action) |
| Регистрация в меню | `define({ label })`                     | [Обзор FlowEngine](../flow-engine/index.md)    |
| Регистрация модели | `this.flowEngine.registerModelLoaders()` | [Plugin (Плагин)](../plugin)                   |
| Отложенный перевод | `tExpr()`                               | [i18n Интернационализация](../component/i18n)  |

## Связанные ссылки

- [Написание первого плагина](../../write-your-first-plugin) — создание каркаса плагина с нуля
- [Обзор FlowEngine](../flow-engine/index.md) — базовое использование FlowModel
- [FlowEngine → Расширение действий](../flow-engine/action) — ActionModel, ActionSceneEnum
- [FlowEngine → Расширение блоков](../flow-engine/block) — пользовательские блоки
- [FlowEngine → Расширение полей](../flow-engine/field) — пользовательские компоненты полей
- [Component vs FlowModel](../component-vs-flow-model) — когда использовать FlowModel
- [Plugin (Плагин)](../plugin) — точка входа плагина и жизненный цикл load()
- [i18n Интернационализация](../component/i18n) — формат файлов перевода и использование tExpr
- [Полная документация FlowEngine](../../../flow-engine/index.md) — полный справочник FlowModel, Flow, Context
