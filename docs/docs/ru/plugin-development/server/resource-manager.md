:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# ResourceManager

Функция управления ресурсами NocoBase позволяет автоматически преобразовывать существующие таблицы данных (коллекции) и связи (ассоциации) в ресурсы. Она включает встроенные типы операций, которые помогают разработчикам быстро создавать операции с ресурсами REST API. В отличие от традиционных REST API, операции с ресурсами NocoBase не зависят от методов HTTP-запросов. Вместо этого они определяют конкретную операцию для выполнения через явное определение `:action`.

## Автоматическая генерация ресурсов

NocoBase автоматически преобразует `коллекции` и `ассоциации`, определённые в базе данных, в ресурсы. Например, если вы определите две коллекции, `posts` и `tags`:

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

Это автоматически сгенерирует следующие ресурсы:

*   ресурс `posts`
*   ресурс `tags`
*   ресурс ассоциации `posts.tags`

Примеры запросов:

| Метод    | Путь                     | Операция          |
| -------- | ---------------------- | ----------------- |
| `GET`  | `/api/posts:list`      | Запрос списка     |
| `GET`  | `/api/posts:get/1`     | Запрос одной записи |
| `POST` | `/api/posts:create`    | Создание          |
| `POST` | `/api/posts:update/1`  | Обновление        |
| `POST` | `/api/posts:destroy/1` | Удаление          |

| Метод    | Путь                     | Операция          |
| -------- | ---------------------- | ----------------- |
| `GET`  | `/api/tags:list`       | Запрос списка     |
| `GET`  | `/api/tags:get/1`      | Запрос одной записи |
| `POST` | `/api/tags:create`     | Создание          |
| `POST` | `/api/tags:update/1`   | Обновление        |
| `POST` | `/api/tags:destroy/1`  | Удаление          |

| Метод    | Путь                             | Операция                                  |
| -------- | ------------------------------ | ----------------------------------------- |
| `GET`  | `/api/posts/1/tags:list`       | Запрос всех `tags`, связанных с `post`      |
| `GET`  | `/api/posts/1/tags:get/1`      | Запрос одной `tag` для `post`             |
| `POST` | `/api/posts/1/tags:create`     | Создание одной `tag` для `post`           |
| `POST` | `/api/posts/1/tags:update/1`   | Обновление одной `tag` для `post`         |
| `POST` | `/api/posts/1/tags:destroy/1`  | Удаление одной `tag` для `post`           |
| `POST` | `/api/posts/1/tags:add`        | Добавление связанных `tags` к `post`        |
| `POST` | `/api/posts/1/tags:remove`     | Удаление связанных `tags` из `post`         |
| `POST` | `/api/posts/1/tags:set`        | Установка всех связанных `tags` для `post`  |
| `POST` | `/api/posts/1/tags:toggle`     | Переключение связи `tags` для `post`        |

:::tip Подсказка

Операции с ресурсами NocoBase не зависят напрямую от методов запросов, а определяют действия через явное указание `:action`.

:::

## Операции с ресурсами

NocoBase предоставляет обширный набор встроенных типов операций для удовлетворения различных бизнес-требований.

### Базовые CRUD-операции

| Название операции | Описание                                  | Применимые типы ресурсов | Метод запроса | Пример пути                 |
| ----------------- | ----------------------------------------- | ------------------------ | ------------- | --------------------------- |
| `list`            | Запрос данных списка                      | Все                      | GET/POST      | `/api/posts:list`           |
| `get`             | Запрос одной записи                       | Все                      | GET/POST      | `/api/posts:get/1`          |
| `create`          | Создание новой записи                     | Все                      | POST          | `/api/posts:create`         |
| `update`          | Обновление записи                         | Все                      | POST          | `/api/posts:update/1`       |
| `destroy`         | Удаление записи                           | Все                      | POST          | `/api/posts:destroy/1`      |
| `firstOrCreate`   | Найти первую запись, создать, если не существует | Все                      | POST          | `/api/users:firstOrCreate`  |
| `updateOrCreate`  | Обновить запись, создать, если не существует    | Все                      | POST          | `/api/users:updateOrCreate` |

### Операции со связями

| Название операции | Описание             | Применимые типы связей                            | Пример пути                    |
| ----------------- | -------------------- | ------------------------------------------------- | ------------------------------ |
| `add`             | Добавить связь       | `hasMany`, `belongsToMany`                        | `/api/posts/1/tags:add`        |
| `remove`          | Удалить связь        | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`             | Сбросить связь       | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle`          | Добавить или удалить связь | `belongsToMany`                                   | `/api/posts/1/tags:toggle`     |

### Параметры операций

К распространённым параметрам операций относятся:

*   `filter`: Условия запроса
*   `values`: Устанавливаемые значения
*   `fields`: Указанные возвращаемые поля
*   `appends`: Включение связанных данных
*   `except`: Исключаемые поля
*   `sort`: Правила сортировки
*   `page`, `pageSize`: Параметры пагинации
*   `paginate`: Включить ли пагинацию
*   `tree`: Возвращать ли древовидную структуру
*   `whitelist`, `blacklist`: Белый/чёрный список полей
*   `updateAssociationValues`: Обновлять ли значения связей

---

## Пользовательские операции с ресурсами

NocoBase позволяет регистрировать дополнительные операции для существующих ресурсов. Вы можете использовать `registerActionHandlers` для настройки операций как для всех, так и для конкретных ресурсов.

### Регистрация глобальных операций

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Регистрация операций для конкретных ресурсов

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

Примеры запросов:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Правило именования: `resourceName:actionName`. При включении связей используйте точечную нотацию (`posts.comments`).

## Пользовательские ресурсы

Если вам нужно предоставить ресурсы, не связанные с коллекциями, вы можете определить их с помощью метода `resourceManager.define`:

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

Методы запросов соответствуют автоматически сгенерированным ресурсам:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (по умолчанию поддерживает как GET, так и POST)

## Пользовательское промежуточное ПО

Используйте метод `resourceManager.use()` для регистрации глобального промежуточного ПО. Например:

Глобальное промежуточное ПО для логирования

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Специальные свойства контекста

Возможность использования промежуточного ПО или действий на уровне `resourceManager` означает, что ресурс обязательно существует.

### ctx.action

*   `ctx.action.actionName`: Название операции
*   `ctx.action.resourceName`: Может быть коллекцией или ассоциацией
*   `ctx.action.params`: Параметры операции

### ctx.dataSource

Текущий объект источника данных.

### ctx.getCurrentRepository()

Текущий объект репозитория.

## Как получить объекты resourceManager для разных источников данных

`resourceManager` принадлежит к источнику данных, и операции могут быть зарегистрированы отдельно для каждого источника данных.

### Основной источник данных

Для основного источника данных вы можете напрямую использовать `app.resourceManager`:

```ts
app.resourceManager.registerActionHandlers();
```

### Другие источники данных

Для других источников данных вы можете получить конкретный экземпляр источника данных через `dataSourceManager` и использовать `resourceManager` этого экземпляра:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Итерация по всем источникам данных

Если вам нужно выполнить одни и те же операции для всех добавленных источников данных, вы можете использовать метод `dataSourceManager.afterAddDataSource` для итерации, гарантируя, что `resourceManager` каждого источника данных сможет зарегистрировать соответствующие операции:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```