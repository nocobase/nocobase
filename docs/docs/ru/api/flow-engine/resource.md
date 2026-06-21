---
title: "Resource API"
description: "Справочник Resource API NocoBase FlowEngine: полные сигнатуры методов MultiRecordResource и SingleRecordResource, форматы параметров, синтаксис filter."
keywords: "Resource,MultiRecordResource,SingleRecordResource,FlowResource,CRUD,filter,NocoBase"
---

# Resource API

NocoBase FlowEngine предоставляет два класса Resource для работы с данными на стороне клиента: `MultiRecordResource` — для списков и таблиц (несколько записей), `SingleRecordResource` — для форм и страниц подробностей (одна запись). Они инкапсулируют вызовы REST API и обеспечивают реактивное управление данными.

Цепочка наследования: `FlowResource` → `APIResource` → `BaseRecordResource` → `MultiRecordResource` / `SingleRecordResource`

## MultiRecordResource

Используется для списков, таблиц, канбан-досок и других сценариев с несколькими записями. Импортируется из `@nocobase/flow-engine`.

### Операции с данными

| Метод | Параметры | Описание |
|------|------|------|
| `getData()` | - | Возвращает `TDataItem[]`, начальное значение — `[]` |
| `hasData()` | - | Не пуст ли массив данных |
| `create(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | Создать запись. По умолчанию после создания автоматически вызывается refresh |
| `get(filterByTk)` | `filterByTk: string \| number` | Получить одну запись по первичному ключу |
| `update(filterByTk, data, options?)` | `filterByTk: string \| number`, `data: object` | Обновить запись. После завершения автоматически вызывается refresh |
| `destroy(filterByTk, options?)` | `filterByTk: string \| number \| Array` | Удалить запись. Поддерживает пакетное удаление |
| `destroySelectedRows()` | - | Удалить все выделенные строки |
| `refresh()` | - | Обновить данные (вызов action `list`). Несколько вызовов в одном цикле событий объединяются |

### Постраничная навигация

| Метод | Описание |
|------|------|
| `getPage()` | Получить текущий номер страницы |
| `setPage(page)` | Установить номер страницы |
| `getPageSize()` | Получить количество записей на странице (по умолчанию 20) |
| `setPageSize(pageSize)` | Установить количество записей на странице |
| `getCount()` | Получить общее количество записей |
| `getTotalPage()` | Получить общее количество страниц |
| `next()` | Перейти на следующую страницу и обновить данные |
| `previous()` | Перейти на предыдущую страницу и обновить данные |
| `goto(page)` | Перейти на указанную страницу и обновить данные |

### Выделенные строки

| Метод | Описание |
|------|------|
| `setSelectedRows(rows)` | Установить выделенные строки |
| `getSelectedRows()` | Получить выделенные строки |

### Пример: использование в CollectionBlockModel

При наследовании от `CollectionBlockModel` необходимо создать resource через `createResource()`, а затем читать данные в `renderComponent()`:

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class ManyRecordBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;

  // Объявляем использование MultiRecordResource для управления данными
  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData();   // TDataItem[]
    const count = this.resource.getCount(); // Общее количество записей

    return (
      <div>
        <h3>Всего {count} записей (страница {this.resource.getPage()})</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records block'),
});
```

Полный пример см. в [FlowEngine → Расширение Block](../../plugin-development/client/flow-engine/block.md).

### Пример: вызов CRUD из кнопки действия

В обработчике `registerFlow` модели `ActionModel` через `ctx.blockModel?.resource` можно получить resource текущего Block и вызывать CRUD-методы:

```tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps = {
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
  on: 'click',
  steps: {
    openForm: {
      async handler(ctx) {
        // Получаем resource текущего Block
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        ctx.viewer.dialog({
          title: ctx.t('New todo'),
          content: (view) => (
            <MyForm
              onSubmit={async (values) => {
                // Создаём запись; resource автоматически обновится после создания
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

Полный пример см. в [Создание полнофункционального плагина управления данными](../../plugin-development/client/examples/fullstack-plugin.md).

### Пример: краткий справочник CRUD-операций

```ts
async handler(ctx) {
  const resource = ctx.blockModel?.resource as MultiRecordResource;

  // --- Создание ---
  await resource.create({ title: 'New item', completed: false });
  // Без автоматического обновления
  await resource.create({ title: 'Draft' }, { refresh: false });

  // --- Чтение ---
  const items = resource.getData();     // TDataItem[]
  const count = resource.getCount();    // Общее количество записей
  const item = await resource.get(1);   // Получение по первичному ключу

  // --- Обновление ---
  await resource.update(1, { title: 'Updated' });

  // --- Удаление ---
  await resource.destroy(1);            // Удаление одной записи
  await resource.destroy([1, 2, 3]);    // Пакетное удаление

  // --- Постраничная навигация ---
  resource.setPage(2);
  resource.setPageSize(50);
  await resource.refresh();
  // Или используйте сокращённые методы
  await resource.goto(3);
  await resource.next();
  await resource.previous();

  // --- Обновление ---
  await resource.refresh();
}
```

## SingleRecordResource

Используется для форм, страниц подробностей и других сценариев с одной записью. Импортируется из `@nocobase/flow-engine`.

### Операции с данными

| Метод | Параметры | Описание |
|------|------|------|
| `getData()` | - | Возвращает `TData` (один объект), начальное значение — `null` |
| `save(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | Умное сохранение: при `isNewRecord = true` вызывается create, иначе — update |
| `destroy(options?)` | - | Удалить текущую запись (используя установленный ранее filterByTk) |
| `refresh()` | - | Обновить данные (вызов action `get`); пропускается, если `isNewRecord = true` |

### Ключевые свойства

| Свойство | Описание |
|------|------|
| `isNewRecord` | Признак того, что запись новая. Метод `setFilterByTk()` автоматически устанавливает его в `false` |

### Пример: сценарий с формой подробностей

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { SingleRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DetailBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.one;

  createResource() {
    return this.context.makeResource(SingleRecordResource);
  }

  get resource() {
    return this.context.resource as SingleRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData(); // Один объект или null
    if (!data) return <div>Загрузка...</div>;

    return (
      <div>
        <h3>{data.title}</h3>
        <p>{data.content}</p>
      </div>
    );
  }
}

DetailBlockModel.define({
  label: tExpr('Detail block'),
});
```

### Пример: создание и редактирование записи

```ts
async handler(ctx) {
  const resource = ctx.model.context.resource as SingleRecordResource;

  // --- Создание новой записи ---
  resource.isNewRecord = true;
  await resource.save({ name: 'John', age: 30 });
  // Внутри save вызывается action create, после чего автоматически выполняется refresh

  // --- Редактирование существующей записи ---
  resource.setFilterByTk(1);  // Автоматически устанавливает isNewRecord = false
  await resource.refresh();   // Сначала загружаем актуальные данные
  const data = resource.getData();
  await resource.save({ ...data, name: 'Jane' });
  // Внутри save вызывается action update

  // --- Удаление текущей записи ---
  await resource.destroy();   // Используется ранее установленный filterByTk
}
```

## Общие методы

Следующие методы доступны как у `MultiRecordResource`, так и у `SingleRecordResource`:

### Фильтрация

| Метод | Описание |
|------|------|
| `setFilter(filter)` | Напрямую установить объект filter |
| `addFilterGroup(key, filter)` | Добавить именованную группу фильтров (рекомендуется: можно объединять и удалять) |
| `removeFilterGroup(key)` | Удалить именованную группу фильтров |
| `getFilter()` | Получить итоговый filter; несколько групп автоматически объединяются через `$and` |

### Управление полями

| Метод | Описание |
|------|------|
| `setFields(fields)` | Установить возвращаемые поля |
| `setAppends(appends)` | Установить appends для связанных полей |
| `addAppends(appends)` | Добавить appends (с удалением дубликатов) |
| `setSort(sort)` | Установить сортировку, например `['-createdAt', 'name']` |
| `setFilterByTk(value)` | Установить фильтрацию по первичному ключу |

### Конфигурация ресурса

| Метод | Описание |
|------|------|
| `setResourceName(name)` | Установить имя ресурса, например `'users'` или связанного ресурса `'users.tags'` |
| `setSourceId(id)` | Установить ID родительской записи для связанного ресурса |
| `setDataSourceKey(key)` | Установить источник данных (добавляет заголовок запроса `X-Data-Source`) |

### Метаданные и состояние

| Метод | Описание |
|------|------|
| `getMeta(key?)` | Получить метаданные. Если ключ не передан, возвращается весь объект meta |
| `loading` | Идёт ли загрузка (getter) |
| `getError()` | Получить информацию об ошибке |
| `clearError()` | Очистить ошибку |

### События

| Событие | Время срабатывания |
|------|----------|
| `'refresh'` | После успешного получения данных через `refresh()` |
| `'saved'` | После успешных операций `create` / `update` / `save` |

```ts
resource.on('saved', (data) => {
  console.log('Запись сохранена:', data);
});
```

## Синтаксис Filter

NocoBase использует JSON-подобный синтаксис фильтров, в котором операторы начинаются с `$`:

```ts
// Равно
{ status: { $eq: 'active' } }

// Не равно
{ status: { $ne: 'deleted' } }

// Больше
{ age: { $gt: 18 } }

// Содержит (нечёткий поиск)
{ name: { $includes: 'test' } }

// Составное условие
{
  $and: [
    { status: { $eq: 'active' } },
    { age: { $gt: 18 } },
  ]
}

// Условие ИЛИ
{
  $or: [
    { status: { $eq: 'active' } },
    { role: { $eq: 'admin' } },
  ]
}
```

Для управления условиями фильтрации в Resource рекомендуется использовать `addFilterGroup`:

```ts
// Добавляем несколько групп фильтров
resource.addFilterGroup('status', { status: { $eq: 'active' } });
resource.addFilterGroup('age', { age: { $gt: 18 } });
// getFilter() автоматически объединяет в: { $and: [...] }

// Удаляем группу фильтра
resource.removeFilterGroup('status');

// Применяем фильтрацию через обновление
await resource.refresh();
```

## Сравнение MultiRecordResource и SingleRecordResource

| Характеристика | MultiRecordResource | SingleRecordResource |
|------|-------|-------|
| Что возвращает getData() | `TDataItem[]` (массив) | `TData` (один объект) |
| Action для refresh по умолчанию | `list` | `get` |
| Постраничная навигация | Поддерживается | Не поддерживается |
| Выделенные строки | Поддерживаются | Не поддерживаются |
| Создание | `create(data)` | `save(data)` + `isNewRecord=true` |
| Обновление | `update(filterByTk, data)` | `save(data)` + `setFilterByTk(id)` |
| Удаление | `destroy(filterByTk)` | `destroy()` |
| Типичные сценарии | Списки, таблицы, канбан | Формы, страницы подробностей |

## Связанные ссылки

- [Создание полнофункционального плагина управления данными](../../plugin-development/client/examples/fullstack-plugin.md) — полный пример: реальное использование `resource.create()` в кнопке кастомного действия
- [FlowEngine → Расширение Block](../../plugin-development/client/flow-engine/block.md) — использование `createResource()` и `resource.getData()` в CollectionBlockModel
- [ResourceManager — управление ресурсами (сервер)](../../plugin-development/server/resource-manager.md) — описание ресурсов REST API на сервере; именно эти интерфейсы вызывает клиентский Resource
- [FlowContext API](./flow-context.md) — описание методов `ctx.makeResource()`, `ctx.initResource()` и других
