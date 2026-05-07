:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/resource/sql-resource).
:::

# SQLResource

Ресурс для выполнения запросов на основе **сохраненных конфигураций SQL** или **динамического SQL**. Данные поступают через интерфейсы `flowSql:run` / `flowSql:runById` и другие. Подходит для отчетов, статистики, пользовательских списков на основе SQL и других сценариев. В отличие от [MultiRecordResource](./multi-record-resource.md), SQLResource не зависит от коллекций; он выполняет SQL-запросы напрямую и поддерживает пагинацию, привязку параметров, шаблонные переменные (`{{ctx.xxx}}`) и управление типом результата.

**Наследование**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Способ создания**: `ctx.makeResource('SQLResource')` или `ctx.initResource('SQLResource')`. Для выполнения на основе сохраненной конфигурации используйте `setFilterByTk(uid)` (UID шаблона SQL); для отладки можно использовать `setDebug(true)` + `setSQL(sql)` для прямого выполнения SQL. В RunJS `ctx.api` внедряется средой выполнения.

---

## Сценарии использования

| Сценарий | Описание |
|------|------|
| **Отчеты / Статистика** | Сложные агрегации, межтабличные запросы и пользовательские статистические показатели. |
| **Пользовательские списки JSBlock** | Реализация специальной фильтрации, сортировки или связей с помощью SQL с кастомным рендерингом. |
| **Блоки диаграмм** | Использование сохраненных шаблонов SQL в качестве источников данных для диаграмм с поддержкой пагинации. |
| **Выбор между SQLResource и ctx.sql** | Используйте SQLResource, когда требуются пагинация, события или реактивные данные; используйте `ctx.sql.run()` / `ctx.sql.runById()` для простых разовых запросов. |

---

## Формат данных

- `getData()` возвращает данные в разных форматах в зависимости от `setSQLType()`:
  - `selectRows` (по умолчанию): **Массив**, результаты в виде нескольких строк.
  - `selectRow`: **Один объект**.
  - `selectVar`: **Скалярное значение** (например, COUNT, SUM).
- `getMeta()` возвращает метаданные, такие как информация о пагинации: `page`, `pageSize`, `count`, `totalPage` и т. д.

---

## Конфигурация SQL и режимы выполнения

| Метод | Описание |
|------|------|
| `setFilterByTk(uid)` | Устанавливает UID шаблона SQL для выполнения (соответствует `runById`; шаблон должен быть предварительно сохранен в интерфейсе администратора). |
| `setSQL(sql)` | Устанавливает необработанный SQL (используется для `runBySQL` только при включенном режиме отладки `setDebug(true)`). |
| `setSQLType(type)` | Тип результата: `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | Если `true`, метод `refresh` вызывает `runBySQL()`; в противном случае — `runById()`. |
| `run()` | Вызывает `runBySQL()` или `runById()` в зависимости от состояния отладки. |
| `runBySQL()` | Выполняет SQL, заданный в `setSQL` (требуется `setDebug(true)`). |
| `runById()` | Выполняет сохраненный шаблон SQL, используя текущий UID. |

---

## Параметры и контекст

| Метод | Описание |
|------|------|
| `setBind(bind)` | Привязывает переменные. Используйте объект для плейсхолдеров `:name` или массив для плейсхолдеров `?`. |
| `setLiquidContext(ctx)` | Контекст шаблона (Liquid), используемый для парсинга `{{ctx.xxx}}`. |
| `setFilter(filter)` | Дополнительные условия фильтрации (передаются в данные запроса). |
| `setDataSourceKey(key)` | Идентификатор источника данных (используется в средах с несколькими источниками данных). |

---

## Пагинация

| Метод | Описание |
|------|------|
| `setPage(page)` / `getPage()` | Текущая страница (по умолчанию 1). |
| `setPageSize(size)` / `getPageSize()` | Количество элементов на странице (по умолчанию 20). |
| `next()` / `previous()` / `goto(page)` | Переход по страницам и запуск `refresh`. |

В SQL вы можете использовать `{{ctx.limit}}` и `{{ctx.offset}}` для ссылки на параметры пагинации. SQLResource автоматически внедряет `limit` и `offset` в контекст.

---

## Получение данных и события

| Метод | Описание |
|------|------|
| `refresh()` | Выполняет SQL (`runById` или `runBySQL`), записывает результат в `setData(data)`, обновляет метаданные и инициирует событие `'refresh'`. |
| `runAction(actionName, options)` | Вызывает базовые действия (например, `getBind`, `run`, `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | Срабатывает при завершении обновления или при начале загрузки. |

---

## Примеры

### Выполнение через сохраненный шаблон (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // UID сохраненного шаблона SQL
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count и т. д.
```

### Режим отладки: прямое выполнение SQL (runBySQL)

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

// Навигация
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Типы результатов

```js
// Несколько строк (по умолчанию)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Одна строка
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Одиночное значение (например, COUNT)
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

### Прослушивание события refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Примечания

- **runById требует предварительного сохранения шаблона**: UID, используемый в `setFilterByTk(uid)`, должен быть ID шаблона SQL, уже сохраненного в интерфейсе администратора. Вы можете сохранить его через `ctx.sql.save({ uid, sql })`.
- **Режим отладки требует прав доступа**: `setDebug(true)` использует `flowSql:run`, что требует наличия у текущей роли прав на настройку SQL. Для `runById` достаточно быть авторизованным пользователем.
- **Устранение дребезга (Debouncing) при обновлении**: Несколько вызовов `refresh()` в рамках одного цикла событий приведут к выполнению только последнего из них, чтобы избежать избыточных запросов.
- **Привязка параметров для предотвращения инъекций**: Используйте `setBind()` с плейсхолдерами `:name` или `?` вместо конкатенации строк, чтобы предотвратить SQL-инъекции.

---

## Связанные разделы

- [ctx.sql](../context/sql.md) — Выполнение и управление SQL; `ctx.sql.runById` подходит для простых разовых запросов.
- [ctx.resource](../context/resource.md) — Экземпляр ресурса в текущем контексте.
- [ctx.initResource()](../context/init-resource.md) — Инициализирует и привязывает к `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) — Создает новый экземпляр ресурса без привязки.
- [APIResource](./api-resource.md) — Общий ресурс API.
- [MultiRecordResource](./multi-record-resource.md) — Предназначен для коллекций и списков.