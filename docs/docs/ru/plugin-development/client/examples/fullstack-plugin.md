---
title: "Создание плагина управления данными с интеграцией фронтенда и бэкенда"
description: "Практика плагинов NocoBase: сервер определяет таблицу данных + клиент использует TableBlockModel для отображения + пользовательские поле и действие — полноценный плагин с интеграцией фронтенда и бэкенда."
keywords: "интеграция фронтенда и бэкенда,TableBlockModel,defineCollection,ActionModel,ClickableFieldModel,ctx.viewer,NocoBase"
---

# Создание плагина управления данными с интеграцией фронтенда и бэкенда

Предыдущие примеры были либо чисто клиентские (блок, поле, действие), либо клиентские + простой API (страница настроек). Этот пример показывает более полноценный сценарий — сервер определяет таблицу данных, клиент наследует `TableBlockModel`, чтобы получить полные возможности таблицы, плюс пользовательский компонент поля и пользовательскую кнопку действия — образуя плагин управления данными с CRUD-операциями.

Этот пример объединяет изученные ранее блок, поле и действие, демонстрируя процесс разработки полноценного плагина.

:::tip Предварительное чтение

Рекомендуется сначала ознакомиться со следующим — это упростит разработку:

- [Написание первого плагина](../../write-your-first-plugin) — создание плагина и структура каталогов
- [Plugin (Плагин)](../plugin) — точка входа плагина и жизненный цикл `load()`
- [FlowEngine → Расширение блоков](../flow-engine/block) — BlockModel, CollectionBlockModel, TableBlockModel
- [FlowEngine → Расширение полей](../flow-engine/field) — ClickableFieldModel, bindModelToInterface
- [FlowEngine → Расширение действий](../flow-engine/action) — ActionModel, ActionSceneEnum
- [i18n Интернационализация](../component/i18n) — формат файлов перевода и использование `tExpr()`
- [Обзор серверной разработки](../../server) — основы серверных плагинов

:::

## Конечный результат

Мы делаем плагин управления данными «Список дел» со следующими возможностями:

- Сервер определяет таблицу `todoItems`, при установке плагина автоматически записываются данные-примеры
- Клиент наследует `TableBlockModel`, готовый к использованию блок таблицы (столбцы полей, пагинация, панель действий и т.д.)
- Пользовательский компонент поля — рендерит поле priority цветным Tag
- Пользовательская кнопка действия — кнопка «Создать задачу», по клику открывает модальное окно с формой для создания записи

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_16.32.52.mp4" type="video/mp4">
</video>

Полный исходный код см. в [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource). Если хотите запустить и посмотреть локально:

```bash
yarn pm enable @nocobase-example/plugin-custom-table-block-resource
```

Ниже шаг за шагом построим этот плагин с нуля.

## Шаг 1: создать каркас плагина

Выполните в корне репозитория:

```bash
yarn pm create @my-project/plugin-custom-table-block-resource
```

Подробное описание см. в [Написание первого плагина](../../write-your-first-plugin).

## Шаг 2: определить таблицу данных (сервер)

Создайте `src/server/collections/todoItems.ts`. NocoBase автоматически загружает определения collection из этого каталога:

```ts
// src/server/collections/todoItems.ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'todoItems',
  title: 'Todo Items',
  fields: [
    { name: 'title', type: 'string', title: 'Title' },
    {
      name: 'completed',
      type: 'boolean',
      title: 'Completed',
      defaultValue: false,
    },
    {
      name: 'priority',
      type: 'string',
      title: 'Priority',
      defaultValue: 'medium',
    },
  ],
});
```

В отличие от примера со страницей настроек, здесь не нужно вручную регистрировать ресурс — NocoBase автоматически генерирует стандартные CRUD-интерфейсы (`list`, `get`, `create`, `update`, `destroy`) для каждой collection.

## Шаг 3: настроить права доступа и данные-примеры (сервер)

Отредактируйте `src/server/plugin.ts`: в `load()` настройте права ACL, в `install()` вставьте данные-примеры:

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginDataBlockServer extends Plugin {
  async load() {
    // 登录用户可以对 todoItems 进行增删改查
    this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
  }

  async install() {
    // 插件首次安装时，插入几条示例数据
    const repo = this.db.getRepository('todoItems');
    const count = await repo.count();
    if (count === 0) {
      await repo.createMany({
        records: [
          { title: 'Learn NocoBase plugin development', completed: true, priority: 'high' },
          { title: 'Build a custom block', completed: false, priority: 'high' },
          { title: 'Write documentation', completed: false, priority: 'medium' },
          { title: 'Add unit tests', completed: false, priority: 'low' },
        ],
      });
    }
  }
}

export default PluginDataBlockServer;
```

Несколько ключевых моментов:

- **`acl.allow()`** — `['list', 'get', 'create', 'update', 'destroy']` открывает полные права на CRUD; `'loggedIn'` означает, что доступ имеет любой авторизованный пользователь
- **`install()`** — выполняется только при первой установке плагина, подходит для записи начальных данных
- **`this.db.getRepository()`** — получение объекта операций над данными по имени collection
- Не нужно `resourceManager.define()` — NocoBase автоматически генерирует CRUD-интерфейсы для collection

## Шаг 4: создать модель блока (клиент)

Создайте `src/client-v2/models/TodoBlockModel.tsx`. Наследование `TableBlockModel` сразу даёт полные возможности блока таблицы — столбцы полей, панель действий, пагинацию, сортировку и т.д., — не нужно писать `renderComponent` самостоятельно.

![20260408164204](https://static-docs.nocobase.com/20260408164204.png)

:::tip Подсказка

В реальной разработке плагинов, если кастомизация `TableBlockModel` не требуется, можно вообще не наследовать и не регистрировать этот блок — пользователю достаточно при добавлении блока выбрать «Таблица». В этой статье `TodoBlockModel` написан как наследник `TableBlockModel` для демонстрации процесса определения и регистрации модели блока. `TableBlockModel` обработает всё остальное (столбцы полей, панель действий, пагинацию и т.д.).

:::

```tsx
// src/client-v2/models/TodoBlockModel.tsx
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  // 限制只对 todoItems 数据表可用
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

Через `filterCollection` ограничиваем доступность этого блока только для таблицы `todoItems` — при добавлении пользователем блока «Todo block» в списке выбора таблиц данных будет отображаться только `todoItems`, а не другие нерелевантные таблицы.

![20260408170026](https://static-docs.nocobase.com/20260408170026.png)

## Шаг 5: создать пользовательский компонент поля (клиент)

Создайте `src/client-v2/models/PriorityFieldModel.tsx`. Рендерим поле priority цветным Tag — это намного нагляднее обычного текста:

![20260408163645](https://static-docs.nocobase.com/20260408163645.png)

```tsx
// src/client-v2/models/PriorityFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { Tag } from 'antd';
import { tExpr } from '../locale';

const priorityColors: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'green',
};

export class PriorityFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    if (!value) return <span>-</span>;
    return <Tag color={priorityColors[value] || 'default'}>{value}</Tag>;
  }
}

PriorityFieldModel.define({
  label: tExpr('Priority tag'),
});

// 绑定到 input（单行文本）类型的字段接口
DisplayItemModel.bindModelToInterface('PriorityFieldModel', ['input']);
```

После регистрации в настройках столбца priority в выпадающем меню «Компонент поля» можно будет переключиться на «Priority tag».

## Шаг 6: создать пользовательскую кнопку действия (клиент)

Создайте `src/client-v2/models/NewTodoActionModel.tsx`. По клику на кнопку «Создать задачу» через `ctx.viewer.dialog()` открывается модальное окно — после заполнения формы создаётся запись:

![20260408163810](https://static-docs.nocobase.com/20260408163810.png)

```tsx
// src/client-v2/models/NewTodoActionModel.tsx
import React from 'react';
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource, observable, observer } from '@nocobase/flow-engine';
import { Button, Form, Input, Select, Space, Switch } from 'antd';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

// 用 observable 管理加载状态，替代 useState
const formState = observable({
  loading: false,
});

// 弹窗内的表单组件，用 observer 包裹以响应 observable 变化
const NewTodoForm = observer(function NewTodoForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    const values = await form.validateFields();
    formState.loading = true;
    try {
      await onSubmit(values);
    } finally {
      formState.loading = false;
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={{ priority: 'medium', completed: false }}>
      <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter title' }]}>
        <Input placeholder="Enter todo title" />
      </Form.Item>
      <Form.Item label="Priority" name="priority">
        <Select
          options={[
            { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' },
            { label: 'Low', value: 'low' },
          ]}
        />
      </Form.Item>
      <Form.Item label="Completed" name="completed" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={formState.loading}>
            OK
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
});

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    type: 'primary',
    children: tExpr('New todo'),
  };
}

NewTodoActionModel.define({
  label: tExpr('New todo'),
});

NewTodoActionModel.registerFlow({
  key: 'newTodoFlow',
  title: tExpr('New todo'),
  on: 'click', // 监听按钮点击事件
  steps: {
    openForm: {
      async handler(ctx) {
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        // 使用 ctx.viewer.dialog 打开弹窗
        ctx.viewer.dialog({
          content: (view) => (
            <NewTodoForm
              onSubmit={async (values) => {
                await resource.create(values);
                ctx.message.success(ctx.t('Created successfully'));
                view.close();
              }}
              onCancel={() => view.close()}
            />
          ),
        });
      },
    },
  },
});
```

Несколько ключевых моментов:

- **`ActionSceneEnum.collection`** — кнопка появляется в панели действий вверху блока
- **`on: 'click'`** — через `registerFlow` слушается событие `click` кнопки
- **`ctx.viewer.dialog()`** — встроенная в NocoBase возможность модального окна. `content` принимает функцию, через параметр `view` можно вызывать `view.close()` для закрытия окна
- **`resource.create(values)`** — вызов интерфейса create таблицы данных для создания записи; после создания таблица автоматически обновляется
- **`observable` + `observer`** — реактивное управление состоянием от flow-engine вместо `useState`; компонент будет автоматически реагировать на изменения `formState.loading`

## Шаг 7: добавить файлы локализации

Отредактируйте файлы перевода в `src/locale/` плагина:

```json
// src/locale/zh-CN.json
{
  "Todo block": "待办事项区块",
  "Priority tag": "优先级标签",
  "New todo": "新建待办",
  "Todo form": "待办表单",
  "Title": "标题",
  "Priority": "优先级",
  "Completed": "已完成",
  "Created successfully": "创建成功"
}
```

```json
// src/locale/en-US.json
{
  "Todo block": "Todo block",
  "Priority tag": "Priority tag",
  "New todo": "New todo",
  "Todo form": "Todo form",
  "Title": "Title",
  "Priority": "Priority",
  "Completed": "Completed",
  "Created successfully": "Created successfully"
}
```

:::warning Внимание

При первом добавлении файла языка нужно перезапустить приложение, чтобы он вступил в силу.

:::

О формате файлов перевода и других способах использования `tExpr()` подробнее см. в [i18n Интернационализация](../component/i18n).

## Шаг 8: зарегистрировать в плагине (клиент)

Отредактируйте `src/client-v2/plugin.tsx`. Нужно сделать две вещи: зарегистрировать модели и зарегистрировать `todoItems` в клиентском источнике данных.

:::warning Внимание

Ручная регистрация таблицы данных через `addCollection` в коде плагина — **редкий приём**, здесь он используется только для демонстрации полного процесса интеграции фронтенда и бэкенда. В реальных проектах таблицы данных обычно создаются и настраиваются пользователем в интерфейсе NocoBase или управляются через API / MCP, и явная регистрация в клиентском коде плагина не нужна.

:::

Таблица, определённая через `defineCollection`, является внутренней серверной таблицей и по умолчанию не появляется в списке выбора таблиц данных в блоке. После ручной регистрации через `addCollection` пользователь сможет выбрать `todoItems` при добавлении блока.

![20260408164023](https://static-docs.nocobase.com/20260408164023.png)

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

const todoItemsCollection = {
  name: 'todoItems',
  title: 'Todo Items',
  // filterTargetKey 必须设置，否则 collection 不会出现在区块的数据表选择列表中
  filterTargetKey: 'id',
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
      interface: 'id',
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Title', 'x-component': 'Input' },
    },
    {
      type: 'boolean',
      name: 'completed',
      interface: 'checkbox',
      uiSchema: { type: 'boolean', title: 'Completed', 'x-component': 'Checkbox' },
    },
    {
      type: 'string',
      name: 'priority',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Priority', 'x-component': 'Input' },
    },
  ],
};

export class PluginCustomTableBlockResourceClientV2 extends Plugin {
  async load() {
    // 注册区块、字段、操作模型
    this.flowEngine.registerModelLoaders({
      TodoBlockModel: {
        loader: () => import('./models/TodoBlockModel'),
      },
      PriorityFieldModel: {
        loader: () => import('./models/PriorityFieldModel'),
      },
      NewTodoActionModel: {
        loader: () => import('./models/NewTodoActionModel'),
      },
    });

    // Register todoItems to the client-side data source.
    // Must listen to 'dataSource:loaded' event because ensureLoaded() runs after load(),
    // and it calls setCollections() which clears all collections before re-setting from server.
    // Re-register in the event callback to ensure addCollection survives reload.
    const addTodoCollection = () => {
      const mainDS = this.flowEngine.dataSourceManager.getDataSource('main');
      if (mainDS && !mainDS.getCollection('todoItems')) {
        mainDS.addCollection(todoItemsCollection);
      }
    };

    this.app.eventBus.addEventListener('dataSource:loaded', (event: Event) => {
      if ((event as CustomEvent).detail?.dataSourceKey === 'main') {
        addTodoCollection();
      }
    });
  }
}

export default PluginCustomTableBlockResourceClientV2;
```

Несколько ключевых моментов:

- **`registerModelLoaders`** — ленивая регистрация трёх моделей: блок, поле, действие
- **`this.app.eventBus`** — шина событий уровня приложения для прослушивания событий жизненного цикла
- **Событие `dataSource:loaded`** — срабатывает после загрузки источника данных. Вызвать `addCollection` нужно именно в обработчике этого события, потому что `ensureLoaded()` выполняется после `load()`, очищая и заново устанавливая все collection — прямой вызов `addCollection` в `load()` будет перезаписан
- **`addCollection()`** — регистрация collection в клиентском источнике данных. Поля должны иметь свойства `interface` и `uiSchema`, чтобы NocoBase знал, как их рендерить
- **`filterTargetKey: 'id'`** — обязательно, указывает поле, уникально идентифицирующее запись (обычно первичный ключ). Без этого collection не появится в списке выбора таблиц данных в блоке
- Серверный `defineCollection` отвечает за создание физической таблицы и ORM-маппинг, клиентский `addCollection` — за то, чтобы UI знал о существовании этой таблицы. Только их совместное применение обеспечивает интеграцию фронтенда и бэкенда

## Шаг 9: включить плагин

```bash
yarn pm enable @my-project/plugin-custom-table-block-resource
```

После включения:

1. Создайте новую страницу, нажмите «Добавить блок», выберите «Todo block», привяжите таблицу `todoItems`
2. Таблица автоматически загрузит данные, отобразит столбцы полей, пагинацию и т.д.
3. В «Настройка действий» добавьте кнопку «New todo» — по клику откроется модальное окно с формой для создания записи
4. В «Компонент поля» столбца priority переключитесь на «Priority tag» — priority будет отображаться цветным Tag

<!-- 需要一张启用后完整功能的截图 -->

## Полный исходный код

- [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource) — полный пример плагина управления данными с интеграцией фронтенда и бэкенда

## Резюме

Возможности, использованные в этом примере:

| Возможность      | Использование                                   | Документация                                            |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------- |
| Определение таблицы данных | `defineCollection()`                  | [Сервер → Collections (Таблицы данных)](../../server/collections) |
| Контроль доступа | `acl.allow()`                                   | [Сервер → ACL Контроль доступа](../../server/acl)       |
| Начальные данные | `install()` + `repo.createMany()`               | [Сервер → Plugin (Плагин)](../../server/plugin)         |
| Блок таблицы     | `TableBlockModel`                               | [FlowEngine → Расширение блоков](../flow-engine/block)  |
| Регистрация таблицы данных на клиенте | `addCollection()` + `eventBus` + `filterTargetKey` | [Plugin (Плагин)](../plugin)             |
| Пользовательское поле | `ClickableFieldModel` + `bindModelToInterface` | [FlowEngine → Расширение полей](../flow-engine/field)   |
| Пользовательское действие | `ActionModel` + `registerFlow({ on: 'click' })` | [FlowEngine → Расширение действий](../flow-engine/action) |
| Модальное окно   | `ctx.viewer.dialog()`                           | [Context → Распространённые возможности](../ctx/common-capabilities) |
| Реактивное состояние | `observable` + `observer`                   | [Разработка Component-компонентов](../component/index.md) |
| Регистрация модели | `this.flowEngine.registerModelLoaders()`      | [Plugin (Плагин)](../plugin)                            |
| Отложенный перевод | `tExpr()`                                     | [i18n Интернационализация](../component/i18n)           |

## Связанные ссылки

- [Написание первого плагина](../../write-your-first-plugin) — создание каркаса плагина с нуля
- [Обзор FlowEngine](../flow-engine/index.md) — базовое использование FlowModel и registerFlow
- [FlowEngine → Расширение блоков](../flow-engine/block) — BlockModel, TableBlockModel
- [FlowEngine → Расширение полей](../flow-engine/field) — ClickableFieldModel, bindModelToInterface
- [FlowEngine → Расширение действий](../flow-engine/action) — ActionModel, ActionSceneEnum
- [Создание пользовательского блока отображения](./custom-block) — базовый пример BlockModel
- [Создание пользовательского компонента поля](./custom-field) — базовый пример FieldModel
- [Создание пользовательской кнопки действия](./custom-action) — базовый пример ActionModel
- [Обзор серверной разработки](../../server) — основы серверных плагинов
- [Сервер → Collections (Таблицы данных)](../../server/collections) — defineCollection и addCollection
- [Шпаргалка по Resource API](../../../api/flow-engine/resource.md) — полные сигнатуры методов MultiRecordResource / SingleRecordResource
- [Plugin (Плагин)](../plugin) — точка входа плагина и жизненный цикл load()
- [i18n Интернационализация](../component/i18n) — формат файлов перевода и использование tExpr
- [Сервер → ACL Контроль доступа](../../server/acl) — настройка прав доступа
- [Сервер → Plugin (Плагин)](../../server/plugin) — жизненный цикл серверного плагина
- [Context → Распространённые возможности](../ctx/common-capabilities) — ctx.viewer, ctx.message и т.д.
- [Разработка Component-компонентов](../component/index.md) — использование Antd Form и других компонентов
- [Полная документация FlowEngine](../../../flow-engine/index.md) — полный справочник FlowModel, Flow, Context
