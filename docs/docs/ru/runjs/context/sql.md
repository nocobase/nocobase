# ctx.sql

`ctx.sql` предоставляет выполнение и управление SQL, часто используется в RunJS (например, JS-блок, поток событий) для прямого доступа к базе данных. Поддерживает произвольный(ad-hoc) SQL, запуск сохранённых SQL-шаблонов по ID, привязку параметров, шаблонные переменные (`{{ctx.xxx}}`) и выбор типа результата.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **JS-блок** | Пользовательские отчёты, сложные выборки с фильтрами, агрегация между таблицами |
| **Блок графика** | Использование сохранённых SQL-шаблонов как источника данных графика |
| **Поток событий / связывание** | Запуск предопределённого SQL и использование результата в логике |
| **SQLResource** | Работа через `ctx.initResource('SQLResource')` для пагинируемых списков и т. д. |

> `ctx.sql` использует API `flowSql` для доступа к базе данных; убедитесь, что у текущего пользователя есть право выполнения SQL для нужного источника данных.

## Права доступа

| Право | Метод | Описание |
|-------|-------|----------|
| **Вошедший пользователь** | `runById` | Запуск SQL по ID сохранённого шаблона |
| **Право конфигурации SQL** | `run`, `save`, `destroy` | Произвольный SQL, сохранение, обновление и удаление SQL-шаблонов |

В клиентской логике обычный пользователь может использовать `ctx.sql.runById(uid, options)`. Для динамического SQL или управления шаблонами у роли должно быть право конфигурации SQL.

## Тип

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

| Метод | Описание | Право |
|-------|----------|-------|
| `ctx.sql.run(sql, options?)` | Запуск произвольного SQL; поддерживает привязку параметров и шаблонные переменные | Конфигурация SQL |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Сохранение или обновление SQL-шаблона по ID для повторного использования | Конфигурация SQL |
| `ctx.sql.runById(uid, options?)` | Запуск сохранённого SQL-шаблона по ID | Любой вошедший пользователь |
| `ctx.sql.destroy(uid)` | Удаление SQL-шаблона по ID | Конфигурация SQL |

Примечание:

- `run`: используется для отладки SQL; требует права конфигурации SQL.
- `save`, `destroy`: управление SQL-шаблонами; требуют права конфигурации SQL.
- `runById`: доступен обычным пользователям; выполняет только сохранённые шаблоны.
- При изменении SQL-шаблона вызывайте `save`.

## Параметры

### Параметры для run / runById

| Параметр | Тип | Описание |
|----------|-----|----------|
| `bind` | `Record<string, any>` | Связанные переменные. Используйте `$name` в SQL и передавайте объект `{ name: value }` |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Тип результата: много строк, одна строка, скаляр; по умолчанию `selectRows` |
| `dataSourceKey` | `string` | Ключ источника данных; по умолчанию основной источник |
| `filter` | `Record<string, any>` | Дополнительный фильтр (если поддерживается) |

### Параметры для save

| Параметр | Тип | Описание |
|----------|-----|----------|
| `uid` | `string` | Уникальный ID шаблона; используется в `runById(uid, ...)` |
| `sql` | `string` | SQL-текст; поддерживает `{{ctx.xxx}}` и плейсхолдеры `$name` |
| `dataSourceKey` | `string` | Необязательный ключ источника данных |

## Шаблонные переменные и привязка параметров

### Шаблонные переменные `{{ctx.xxx}}`

В SQL можно использовать `{{ctx.xxx}}` для обращения к контекстным переменным; они разрешаются перед выполнением:

```js
// Ссылка на ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

Источники переменных такие же, как в `ctx.getVar()` (например, `ctx.user.*`, `ctx.record.*`, пользовательские `ctx.defineProperty` и т. д.).

### Привязка параметров

- **Именованные параметры**: используйте `$name` в SQL и передавайте `bind: { name: value }`
- **Позиционные параметры**: используйте `?` в SQL и передайте массив `[value1, value2]` в `bind`.

```js
// Именованные параметры
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = $status AND age > $minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Позиционные параметры
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Moscow', 'active'], type: 'selectVar' }
);
```

## Примеры

### Произвольный SQL (требуется право конфигурации SQL)

```js
// Несколько строк (по умолчанию)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Одна строка
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = $id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Одно значение (например, COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Шаблонные переменные

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Сохранить шаблон и использовать повторно

```js
// Сохранение (требуется право конфигурации SQL)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = $status ORDER BY created_at DESC',
});

// Любой вошедший пользователь может запускать
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Удаление шаблона (требуется право конфигурации SQL)
await ctx.sql.destroy('active-users-report');
```

### Пагинируемый список (SQLResource)

```js
// Для пагинации и фильтров используйте SQLResource
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID сохранённого SQL-шаблона
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // page, pageSize и т. д.
```

## Связь с ctx.resource и ctx.request

| Задача | Рекомендуемый API |
|--------|-------------------|
| **Запуск SQL** | `ctx.sql.run()` или `ctx.sql.runById()` |
| **SQL-пагинация в блоке** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **Произвольный HTTP** | `ctx.request()` |

`ctx.sql` оборачивает SQL API `flowSql`; `ctx.request` используется для произвольных API-запросов.

## Примечания

- Используйте привязку параметров (`$name`), а не конкатенацию строк, чтобы избежать SQL-инъекций.
- При `type: 'selectVar'` результат возвращается как скаляр (например, для `COUNT`, `SUM`).
- Шаблонные переменные `{{ctx.xxx}}` разрешаются перед выполнением; убедитесь, что нужные переменные определены в контексте.

## Связанные материалы

- [ctx.resource](./resource.md): ресурс данных; SQLResource внутри использует flowSql
- [ctx.initResource()](./init-resource.md): инициализация SQLResource для пагинируемых списков
- [ctx.request()](./request.md): произвольные HTTP-запросы