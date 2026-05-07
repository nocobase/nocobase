:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/context/sql).
:::

# ctx.sql

`ctx.sql` предоставляет возможности выполнения и управления SQL-запросами. Он часто используется в RunJS (например, в JS-блоках или рабочих процессах) для прямого доступа к базе данных. Поддерживается выполнение временных SQL-запросов, выполнение сохраненных SQL-шаблонов по ID, привязка параметров, шаблонные переменные (`{{ctx.xxx}}`), а также управление типом возвращаемого результата.

## Области применения

| Сценарий | Описание |
|------|------|
| **JS-блок** | Пользовательские статистические отчеты, сложные фильтры списков, агрегированные запросы между таблицами. |
| **Блок диаграммы** | Сохранение SQL-шаблонов для формирования источников данных диаграмм. |
| **Рабочий процесс / Взаимодействия** | Выполнение предустановленных SQL-запросов для получения данных и их использования в последующей логике. |
| **SQLResource** | Использование совместно с `ctx.initResource('SQLResource')` для таких сценариев, как списки с пагинацией. |

> Примечание: `ctx.sql` обращается к базе данных через API `flowSql`. Убедитесь, что у текущего пользователя есть права на выполнение запросов в соответствующем источнике данных.

## Права доступа

| Права | Метод | Описание |
|------|------|------|
| **Авторизованный пользователь** | `runById` | Выполнение на основе настроенного ID SQL-шаблона. |
| **Права на настройку SQL** | `run`, `save`, `destroy` | Выполнение временного SQL, сохранение, обновление или удаление SQL-шаблонов. |

Для логики фронтенда, предназначенной для обычных пользователей, следует использовать `ctx.sql.runById(uid, options)`. Если требуется динамический SQL или управление шаблонами, убедитесь, что текущая роль обладает правами на настройку SQL.

## Определение типов

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## Основные методы

| Метод | Описание | Требования к правам |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Выполняет временный SQL; поддерживает привязку параметров и шаблонные переменные. | Права на настройку SQL |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Сохраняет или обновляет SQL-шаблон по ID для повторного использования. | Права на настройку SQL |
| `ctx.sql.runById(uid, options?)` | Выполняет ранее сохраненный SQL-шаблон по его ID. | Любой авторизованный пользователь |
| `ctx.sql.destroy(uid)` | Удаляет указанный SQL-шаблон по ID. | Права на настройку SQL |

Примечание:

- `run` используется для отладки SQL и требует прав на настройку.
- `save` и `destroy` используются для управления SQL-шаблонами и требуют прав на настройку.
- `runById` открыт для обычных пользователей; он позволяет только выполнять сохраненные шаблоны без возможности отладки или изменения SQL.
- При изменении SQL-шаблона необходимо вызвать `save` для сохранения изменений.

## Описание параметров

### options для run / runById

| Параметр | Тип | Описание |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | Переменные привязки. Используйте объект для плейсхолдеров `:name` или массив для плейсхолдеров `?`. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Тип результата: несколько строк, одна строка или одно значение. По умолчанию `selectRows`. |
| `dataSourceKey` | `string` | Идентификатор источника данных. По умолчанию используется основной источник данных. |
| `filter` | `Record<string, any>` | Дополнительные условия фильтрации (в зависимости от поддержки интерфейсом). |

### options для save

| Параметр | Тип | Описание |
|------|------|------|
| `uid` | `string` | Уникальный идентификатор шаблона. После сохранения его можно выполнить через `runById(uid, ...)`. |
| `sql` | `string` | Содержимое SQL. Поддерживает шаблонные переменные `{{ctx.xxx}}` и плейсхолдеры `:name` / `?`. |
| `dataSourceKey` | `string` | Необязательно. Идентификатор источника данных. |

## Шаблонные переменные SQL и привязка параметров

### Шаблонные переменные `{{ctx.xxx}}`

В SQL можно использовать `{{ctx.xxx}}` для ссылки на переменные контекста. Перед выполнением они преобразуются в фактические значения:

```js
// Ссылка на ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

Источники доступных переменных такие же, как в `ctx.getVar()` (например, `ctx.user.*`, `ctx.record.*`, пользовательские `ctx.defineProperty` и т. д.).

### Привязка параметров

- **Именованные параметры**: используйте `:name` в SQL и передайте объект `{ name: value }` в `bind`.
- **Позиционные параметры**: используйте `?` в SQL и передайте массив `[value1, value2]` в `bind`.

```js
// Именованные параметры
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Позиционные параметры
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Moscow', 'active'], type: 'selectVar' }
);
```

## Примеры

### Выполнение временного SQL (требуются права на настройку SQL)

```js
// Несколько строк (по умолчанию)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Одна строка
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Одиночное значение (например, COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Использование шаблонных переменных

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Сохранение и повторное использование шаблонов

```js
// Сохранение (требуются права на настройку SQL)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// Любой авторизованный пользователь может выполнить это
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Удаление шаблона (требуются права на настройку SQL)
await ctx.sql.destroy('active-users-report');
```

### Список с пагинацией (SQLResource)

```js
// Используйте SQLResource, когда необходима пагинация или фильтрация
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID сохраненного SQL-шаблона
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // Содержит page, pageSize и т. д.
```

## Связь с ctx.resource и ctx.request

| Назначение | Рекомендуемое использование |
|------|----------|
| **Выполнение SQL-запроса** | `ctx.sql.run()` или `ctx.sql.runById()` |
| **SQL-список с пагинацией (блок)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **Общий HTTP-запрос** | `ctx.request()` |

`ctx.sql` является оберткой над API `flowSql` и специализируется на сценариях SQL; `ctx.request` можно использовать для вызова любого API.

## Примечания

- Используйте привязку параметров (`:name` / `?`) вместо конкатенации строк, чтобы избежать SQL-инъекций.
- `type: 'selectVar'` возвращает скалярное значение, обычно используется для `COUNT`, `SUM` и т. д.
- Шаблонные переменные `{{ctx.xxx}}` разрешаются перед выполнением; убедитесь, что соответствующие переменные определены в контексте.

## Связанные разделы

- [ctx.resource](./resource.md): Ресурсы данных; SQLResource внутренне вызывает API `flowSql`.
- [ctx.initResource()](./init-resource.md): Инициализация SQLResource для списков с пагинацией и т. д.
- [ctx.request()](./request.md): Общие HTTP-запросы.