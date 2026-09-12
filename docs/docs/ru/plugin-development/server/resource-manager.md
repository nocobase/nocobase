# Менеджер ресурсов (ResourceManager)

Функция управления ресурсами в NocoBase автоматически преобразует существующие коллекции и связи в ресурсы, а встроенные типы операций помогают разработчикам быстро строить REST API-операции над ресурсами. В отличие от традиционных REST API, операции с ресурсами в NocoBase не зависят от HTTP-метода запроса, а определяются через явное указание `:action`.

## Автогенерация ресурсов

NocoBase автоматически преобразует `collection` и `association`, определенные в базе данных, в ресурсы. Например, если определить две коллекции — `posts` и `tags`:

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

Будут автоматически созданы следующие ресурсы:

*   ресурс `posts`
*   ресурс `tags`
*   ресурс ассоциации `posts.tags`

Примеры запросов:

| Метод | Путь                   | Операция         |
| ----- | ---------------------- | ---------------- |
| `GET` | `/api/posts:list`      | Запрос списка    |
| `GET` | `/api/posts:get/1`     | Запрос записи    |
| `POST` | `/api/posts:create`   | Добавление       |
| `POST` | `/api/posts:update/1` | Обновление       |
| `POST` | `/api/posts:destroy/1`| Удаление         |

| Метод | Путь                 | Операция         |
| ----- | -------------------- | ---------------- |
| `GET` | `/api/tags:list`     | Запрос списка    |
| `GET` | `/api/tags:get/1`    | Запрос записи    |
| `POST` | `/api/tags:create`  | Добавление       |
| `POST` | `/api/tags:update/1`| Обновление       |
| `POST` | `/api/tags:destroy/1` | Удаление       |

| Метод | Путь                          | Операция                                                  |
| ----- | ----------------------------- | --------------------------------------------------------- |
| `GET` | `/api/posts/1/tags:list`      | Запрос всех `tags`, связанных с `post`                   |
| `GET` | `/api/posts/1/tags:get/1`     | Запрос одного `tag` в рамках `post`                      |
| `POST` | `/api/posts/1/tags:create`   | Создание одного `tag` в рамках `post`                    |
| `POST` | `/api/posts/1/tags:update/1` | Обновление одного `tag` в рамках `post`                  |
| `POST` | `/api/posts/1/tags:destroy/1` | Удаление одного `tag` в рамках `post`                   |
| `POST` | `/api/posts/1/tags:add`      | Добавление связанных `tags` для `post`                   |
| `POST` | `/api/posts/1/tags:remove`   | Удаление связанных `tags` у `post`                       |
| `POST` | `/api/posts/1/tags:set`      | Установка полного набора связанных `tags` для `post`     |
| `POST` | `/api/posts/1/tags:toggle`   | Переключение связей `tags` для `post`                    |

:::tip Подсказка

Операции ресурсов в NocoBase напрямую не зависят от метода запроса; операция определяется через явный `:action`.

:::

## Операции ресурса

NocoBase предоставляет широкий набор встроенных типов операций для разных бизнес-сценариев.

### Базовые CRUD-операции

| Имя операции      | Описание                                     | Применимые типы ресурсов | Метод запроса | Пример пути                 |
| ----------------- | -------------------------------------------- | ------------------------ | ------------- | --------------------------- |
| `list`            | Запрос списка данных                         | Все                      | GET/POST      | `/api/posts:list`           |
| `get`             | Запрос одной записи                          | Все                      | GET/POST      | `/api/posts:get/1`          |
| `create`          | Создание новой записи                        | Все                      | POST          | `/api/posts:create`         |
| `update`          | Обновление записи                            | Все                      | POST          | `/api/posts:update/1`       |
| `destroy`         | Удаление записи                              | Все                      | POST          | `/api/posts:destroy/1`      |
| `firstOrCreate`   | Найти первую запись, иначе создать           | Все                      | POST          | `/api/users:firstOrCreate`  |
| `updateOrCreate`  | Обновить запись, иначе создать               | Все                      | POST          | `/api/users:updateOrCreate` |

### Операции со связями

| Имя операции | Описание                 | Применимые типы связей                            | Пример пути                    |
| ------------ | ------------------------ | ------------------------------------------------- | ------------------------------ |
| `add`        | Добавить связь           | `hasMany`, `belongsToMany`                        | `/api/posts/1/tags:add`        |
| `remove`     | Удалить связь            | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`        | Переустановить связь     | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle`     | Добавить или снять связь | `belongsToMany`                                   | `/api/posts/1/tags:toggle`     |

### Параметры операций

Общие параметры операций:

*   `filter`: условия запроса
*   `values`: устанавливаемые значения
*   `fields`: поля, которые нужно вернуть
*   `appends`: включение связанных данных
*   `except`: исключаемые поля
*   `sort`: правила сортировки
*   `page`, `pageSize`: параметры пагинации
*   `paginate`: включать ли пагинацию
*   `tree`: возвращать ли древовидную структуру
*   `whitelist`, `blacklist`: белый/черный список полей
*   `updateAssociationValues`: обновлять ли значения связей

---

## Пользовательские операции ресурсов

NocoBase позволяет регистрировать дополнительные операции для существующих ресурсов. С помощью `registerActionHandlers` можно настраивать операции как для всех ресурсов, так и для конкретных.

### Регистрация глобальных операций

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Регистрация операций для конкретного ресурса

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

Правило именования: `resourceName:actionName`; при работе со связями используйте точечную нотацию (`posts.comments`).

## Пользовательские ресурсы

Если нужно предоставить ресурсы, не связанные с коллекциями, используйте метод `resourceManager.define`:

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

Методы запроса согласованы с автосгенерированными ресурсами:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (по умолчанию поддерживаются оба: GET/POST)

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

Если запрос дошел до промежуточного ПО или операции на уровне `resourceManager`, значит соответствующий ресурс уже существует.

### ctx.action

*   `ctx.action.actionName`: имя операции
*   `ctx.action.resourceName`: может быть коллекцией или ассоциацией
*   `ctx.action.params`: параметры операции

### ctx.dataSource

Текущий объект источника данных.

### ctx.getCurrentRepository()

Текущий объект репозитория.

## Как получить объект `resourceManager` для разных источников данных

`resourceManager` принадлежит источнику данных, и операции можно регистрировать отдельно для каждого источника.

### Основной источник данных

Для основного источника данных можно напрямую использовать `app.resourceManager`:

```ts
app.resourceManager.registerActionHandlers();
```

### Другие источники данных

Для других источников данных можно получить конкретный экземпляр через `dataSourceManager` и использовать `resourceManager` этого экземпляра:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Обход всех источников данных

Если нужно выполнить одинаковые операции для всех добавленных источников данных, используйте метод `dataSourceManager.afterAddDataSource` для обхода. Это гарантирует, что в `resourceManager` каждого источника можно зарегистрировать соответствующие операции:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```