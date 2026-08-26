---
title: "Расширение действий"
description: "Разработка расширений действий NocoBase: базовый класс ActionModel, сценарии действий ActionSceneEnum, пользовательские кнопки действий."
keywords: "расширение действий,Action,ActionModel,ActionSceneEnum,кнопка действия,NocoBase"
---

# Расширение действий

В NocoBase **действие (Action)** — это кнопка в блоке, используемая для запуска бизнес-логики (например, «Создать», «Редактировать», «Удалить» и т.д.). Унаследовав базовый класс `ActionModel`, Вы можете добавлять пользовательские кнопки действий.

## Сценарии действий

Каждое действие должно объявить сценарий, в котором оно появляется, через статическое свойство `static scene`:

| Сценарий   | Значение                       | Описание                                  |
| ---------- | ------------------------------ | ----------------------------------------- |
| collection | `ActionSceneEnum.collection`   | Применяется к таблице данных, например, кнопка «Создать» |
| record     | `ActionSceneEnum.record`       | Применяется к одной записи, например, кнопки «Редактировать», «Удалить» |
| both       | `ActionSceneEnum.both`         | Доступно в обоих сценариях                |
| all        | `ActionSceneEnum.all`          | Доступно во всех сценариях (включая особые контексты, такие как модальные окна) |

## Примеры

### Действие уровня таблицы данных

Применяется ко всей таблице данных, появляется в панели действий вверху блока:

```tsx
// models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});
```

### Действие уровня записи

Применяется к одной записи, появляется в столбце действий каждой строки таблицы:

```tsx
// models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});
```

### Подходит для обоих сценариев

Если действие не различает сценариев, используйте `ActionSceneEnum.both`:

```tsx
// models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});
```

Структура трёх вариантов одинакова — различие только в значении `static scene` и тексте кнопки в `defaultProps`.

## Регистрация действия

В `load()` Plugin зарегистрируйте через `registerModelLoaders` для ленивой загрузки:

```ts
// plugin.tsx
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
```

После регистрации в «Настройка действий» блока можно будет добавить Ваши пользовательские кнопки действий.

## Полный исходный код

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — полный пример с тремя сценариями действий

## Связанные ссылки

- [Практика плагинов: создание пользовательской кнопки действия](../examples/custom-action) — построение кнопок действий трёх сценариев с нуля
- [Практика плагинов: создание плагина управления данными с интеграцией фронтенда и бэкенда](../examples/fullstack-plugin) — практическое применение пользовательских действий + ctx.viewer.dialog в полноценном плагине
- [Обзор FlowEngine](../flow-engine/index.md) — базовое использование FlowModel
- [Расширение блоков](./block) — пользовательские блоки
- [Расширение полей](./field) — пользовательские компоненты полей
- [Определение FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — полные параметры registerFlow и типы событий
- [Полная документация FlowEngine](../../../flow-engine/index.md) — полный справочник
