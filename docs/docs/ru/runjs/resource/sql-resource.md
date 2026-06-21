# Ресурс SQLResource

Ресурс, выполняющий запросы через **сохранённую SQL-конфигурацию** или **динамический SQL**; данные приходят из `flowSql:run` / `flowSql:runById` и т. д. Используется для отчётов, статистики, пользовательских SQL-списков. В отличие от [MultiRecordResource](./multi-record-resource.md), SQLResource не зависит от таблицы данных и выполняет SQL напрямую; поддерживает пагинацию, привязку параметров, шаблонные переменные (`{{ctx.xxx}}`) и управление типом результата.

**Наследование:** `FlowResource` → `APIResource` → `BaseRecordResource` → `SQLResource`.

**Создание:** `ctx.makeResource('SQLResource')` или `ctx.initResource('SQLResource')`. Для запуска по сохранённой конфигурации вызовите `setFilterByTk(uid)` (uid SQL-шаблона); для отладки — `setDebug(true)` и `setSQL(sql)` для прямого выполнения SQL; в RunJS `ctx.api` подставляется автоматически.

---

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **Отчёты и статистика** | Сложные агрегации, межтабличные запросы, пользовательские метрики |
| **Список в JS-блоке** | SQL для особых фильтров, сортировки или соединений; пользовательский рендер |
| **Блок графика** | Сохранённый SQL-шаблон как источник данных графика; поддерживается пагинация |
| **Сравнение с ctx.sql** | SQLResource нужен, когда требуются пагинация, события и реактивные данные; `ctx.sql.run()` / `ctx.sql.runById()` — для простых разовых запросов |

---

## Формат данных

- `getData()` возвращает разные форматы в зависимости от `setSQLType()`:
  - `selectRows` (по умолчанию): **массив** (несколько строк)
  - `selectRow`: **один объект**
  - `selectVar`: **скалярное значение** (например, COUNT, SUM)
- `getMeta()` возвращает метаданные пагинации: `page`, `pageSize`, `count`, `totalPage` и т. д.

---

## Конфигурация SQL и режим выполнения

| Метод | Описание |
|-------|----------|
| `setFilterByTk(uid)` | uid SQL-шаблона для запуска (для `runById`; шаблон должен быть заранее сохранён) |
| `setSQL(sql)` | Произвольный SQL (только в режиме отладки `setDebug(true)` для `runBySQL`) |
| `setSQLType(type)` | Тип результата: `'selectVar'` / `'selectRow'` / `'selectRows'` |
| `setDebug(enabled)` | Если `true`, `refresh` использует `runBySQL()`, иначе — `runById()` |
| `run()` | Вызывает `runBySQL()` или `runById()` в зависимости от режима отладки |
| `runBySQL()` | Запуск текущего SQL из `setSQL` (требует `setDebug(true)`) |
| `runById()` | Запуск сохранённого SQL-шаблона по текущему uid |

---

## Параметры и контекст

| Метод | Описание |
|-------|----------|
| `setBind(bind)` | Привязка параметров; объект с `:name` или массив с `?` |
| `setLiquidContext(ctx)` | Контекст шаблона (Liquid) для `{{ctx.xxx}}` |
| `setFilter(filter)` | Дополнительный фильтр (передаётся в данные запроса) |
| `setDataSourceKey(key)` | Ключ источника данных (для нескольких источников данных) |

---

## Пагинация

| Метод | Описание |
|-------|----------|
| `setPage(page)` / `getPage()` | Текущая страница (по умолчанию 1) |
| `setPageSize(size)` / `getPageSize()` | Размер страницы (по умолчанию 20) |
| `next()` / `previous()` / `goto(page)` | Сменить страницу и запустить refresh |

Для пагинации в SQL используйте `{{ctx.limit}}` и `{{ctx.offset}}`; SQLResource автоматически подставляет `limit` и `offset` в контекст.

---

## Загрузка данных и события

| Метод | Описание |
|-------|----------|
| `refresh()` | Выполняет SQL (runById или runBySQL); записывает результат в `setData(data)` и обновляет meta; генерирует `'refresh'` |
| `runAction(actionName, options)` | Вызов нижележащих API (например, `getBind`, `run`, `runById`) |
| `on('refresh', fn)` / `on('loading', fn)` | Срабатывает после refresh или при старте загрузки |

---

## Примеры

### Запуск по сохранённому шаблону (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // uid сохранённого SQL-шаблона
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count и т. д.
```

### Debug-режим: запуск SQL напрямую (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Пагинация и навигация

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Навигация по страницам
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Типы результата

```js
// Несколько строк (по умолчанию)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Одна строка
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Одно значение (например, COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Использование шаблонных переменных

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### Подписка на событие обновления `refresh`

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Примечания

- **`runById` требует сохранённый шаблон**: `setFilterByTk(uid)` должен указывать на uid сохранённого SQL-шаблона; сохраняется через `ctx.sql.save({ uid, sql })`.
- **Режим отладки требует права**: `setDebug(true)` использует `flowSql:run`, что требует права конфигурации SQL. Для `runById` достаточно обычной авторизации.
- **Дебаунс `refresh`**: несколько вызовов `refresh()` в одном цикле событий выполнят только последний, чтобы избежать дублирующих запросов.
- **Привязка параметров защищает от инъекций**: используйте `setBind()` с плейсхолдерами `:name` / `?`; избегайте конкатенации строк в SQL.

---

## Связанные материалы

- [ctx.sql](../context/sql.md) - выполнение и управление SQL; `ctx.sql.runById` для простых разовых запросов
- [ctx.resource](../context/resource.md) - экземпляр ресурса текущего контекста
- [ctx.initResource()](../context/init-resource.md) - инициализация и привязка к ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - создание ресурса без привязки
- [APIResource](./api-resource.md) - универсальный API-ресурс
- [MultiRecordResource](./multi-record-resource.md) - для таблиц/списков данных