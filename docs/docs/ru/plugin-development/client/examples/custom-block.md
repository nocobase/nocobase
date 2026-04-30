---
title: "Создание пользовательского блока отображения"
description: "Практика плагинов NocoBase: создание конфигурируемого HTML-блока отображения с помощью BlockModel + registerFlow + uiSchema."
keywords: "пользовательский блок,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# Создание пользовательского блока отображения

В NocoBase блок — это область содержимого на странице. Этот пример показывает, как с помощью `BlockModel` создать простейший пользовательский блок — поддерживающий редактирование HTML-содержимого в интерфейсе. Пользователь может через панель конфигурации изменять отображаемое содержимое блока.

Это первый пример, затрагивающий FlowEngine — будут использованы `BlockModel`, `renderComponent`, `registerFlow` и `uiSchema`.

:::tip Предварительное чтение

Рекомендуется сначала ознакомиться со следующим — это упростит разработку:

- [Написание первого плагина](../../write-your-first-plugin) — создание плагина и структура каталогов
- [Plugin (Плагин)](../plugin) — точка входа плагина и жизненный цикл `load()`
- [Обзор FlowEngine](../flow-engine/index.md) — FlowModel, renderComponent, базовое использование registerFlow
- [i18n Интернационализация](../component/i18n) — формат файлов перевода и использование `tExpr()` для отложенного перевода

:::

## Конечный результат

Мы делаем блок «Simple block»:

- Появляется в меню «Добавить блок»
- Рендерит сконфигурированное пользователем HTML-содержимое
- Через панель конфигурации (registerFlow + uiSchema) позволяет пользователю редактировать HTML

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

Полный исходный код см. в [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block). Если хотите запустить и посмотреть локально:

```bash
yarn pm enable @nocobase-example/plugin-simple-block
```

Ниже шаг за шагом построим этот плагин с нуля.

## Шаг 1: создать каркас плагина

Выполните в корне репозитория:

```bash
yarn pm create @my-project/plugin-simple-block
```

Это сгенерирует базовую файловую структуру в `packages/plugins/@my-project/plugin-simple-block`. Подробное описание см. в [Написание первого плагина](../../write-your-first-plugin).

## Шаг 2: создать модель блока

Создайте `src/client-v2/models/SimpleBlockModel.tsx`. Это ядро плагина — здесь определяется, как блок рендерится и как настраивается.

```tsx
// src/client-v2/models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

// 设置区块在「添加区块」菜单里的显示名
SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

// 注册配置面板，让用户可以编辑 HTML 内容
SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // 渲染前执行
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema 定义配置面板的表单 UI
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // 配置面板的默认值
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // 把配置面板的值写入 model 的 props
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Несколько ключевых моментов:

- **`renderComponent()`** — рендеринг UI блока, чтение HTML-содержимого через `this.props.html`
- **`define()`** — установка отображаемого имени блока в меню «Добавить блок». `tExpr()` используется для отложенного перевода, потому что `define()` выполняется на этапе загрузки модуля, и в этот момент i18n ещё не инициализирован
- **`registerFlow()`** — добавление панели конфигурации. `uiSchema` определяет форму через JSON Schema (синтаксис см. в [UI Schema](../../../../flow-engine/ui-schema)), `handler` записывает значения, заполненные пользователем, в `ctx.model.props`, а `renderComponent()` их читает

## Шаг 3: добавить файлы локализации

Отредактируйте файлы перевода в `src/locale/` плагина, добавьте переводы для всех ключей, использованных в `tExpr()`:

```json
// src/locale/zh-CN.json
{
  "Simple block": "简单区块",
  "Simple Block Flow": "简单区块配置",
  "Edit HTML Content": "编辑 HTML 内容",
  "HTML Content": "HTML 内容"
}
```

```json
// src/locale/en-US.json
{
  "Simple block": "Simple block",
  "Simple Block Flow": "Simple Block Flow",
  "Edit HTML Content": "Edit HTML Content",
  "HTML Content": "HTML Content"
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

export class PluginSimpleBlockClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        // 按需加载，首次用到时才加载模块
        loader: () => import('./models/SimpleBlockModel'),
      },
    });
  }
}

export default PluginSimpleBlockClient;
```

`registerModelLoaders` использует динамический импорт — код модели загружается только при первом обращении. Это рекомендуемый способ регистрации.

## Шаг 5: включить плагин

```bash
yarn pm enable @my-project/plugin-simple-block
```

После включения создайте новую страницу, нажмите «Добавить блок» — Вы увидите «Simple block». После добавления нажмите кнопку настройки блока, чтобы редактировать HTML-содержимое.

## Полный исходный код

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — полный пример пользовательского блока отображения

## Резюме

Возможности, использованные в этом примере:

| Возможность | Использование                              | Документация                                  |
| ----------- | ------------------------------------------ | --------------------------------------------- |
| Рендеринг блока | `BlockModel` + `renderComponent()`     | [FlowEngine → Расширение блоков](../flow-engine/block) |
| Регистрация в меню | `define({ label })`                | [Обзор FlowEngine](../flow-engine/index.md)   |
| Панель конфигурации | `registerFlow()` + `uiSchema`     | [Обзор FlowEngine](../flow-engine/index.md)   |
| Регистрация модели | `registerModelLoaders` (ленивая загрузка) | [Plugin (Плагин)](../plugin)            |
| Отложенный перевод | `tExpr()`                          | [i18n Интернационализация](../component/i18n) |

## Связанные ссылки

- [Написание первого плагина](../../write-your-first-plugin) — создание каркаса плагина с нуля
- [Обзор FlowEngine](../flow-engine/index.md) — базовое использование FlowModel и registerFlow
- [FlowEngine → Расширение блоков](../flow-engine/block) — BlockModel, DataBlockModel, CollectionBlockModel
- [UI Schema](../../../../flow-engine/ui-schema) — справочник синтаксиса uiSchema
- [Component vs FlowModel](../component-vs-flow-model) — когда использовать FlowModel
- [Plugin (Плагин)](../plugin) — точка входа плагина и жизненный цикл load()
- [i18n Интернационализация](../component/i18n) — формат файлов перевода и использование tExpr
- [Полная документация FlowEngine](../../../flow-engine/index.md) — полный справочник FlowModel, Flow, Context
