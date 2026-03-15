:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/resource/sql-resource).
:::

# SQLResource

Resource для виконання запитів на основі **збережених конфігурацій SQL** або **динамічного SQL**, де джерелом даних є інтерфейси `flowSql:run` / `flowSql:runById` тощо. Підходить для звітів, статистики, кастомних списків SQL та інших сценаріїв. На відміну від [MultiRecordResource](./multi-record-resource.md), SQLResource не залежить від колекцій; він виконує SQL-запити безпосередньо та підтримує пагінацію, прив'язку параметрів, змінні шаблонів (`{{ctx.xxx}}`) та контроль типу результату.

**Успадкування**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Спосіб створення**: `ctx.makeResource('SQLResource')` або `ctx.initResource('SQLResource')`. Для виконання на основі збереженої конфігурації використовуйте `setFilterByTk(uid)` (UID SQL-шаблону); для налагодження можна використовувати `setDebug(true)` + `setSQL(sql)` для безпосереднього виконання SQL; у RunJS `ctx.api` ін'єктується середовищем виконання.

---

## Сценарії застосування

| Сценарій | Опис |
|------|------|
| **Звіти / Статистика** | Складні агрегації, запити між таблицями, кастомні статистичні показники. |
| **Кастомні списки JSBlock** | Реалізація спеціальної фільтрації, сортування або зв'язків за допомогою SQL з кастомним рендерингом. |
| **Блоки діаграм** | Використання збережених SQL-шаблонів як джерел даних для діаграм із підтримкою пагінації. |
| **Вибір між SQLResource та ctx.sql** | Використовуйте SQLResource, коли потрібна пагінація, події або реактивні дані; використовуйте `ctx.sql.run()` / `ctx.sql.runById()` для простих одноразових запитів. |

---

## Формат даних

- `getData()` повертає різні формати залежно від `setSQLType()`:
  - `selectRows` (за замовчуванням): **Масив**, результати з кількома рядками.
  - `selectRow`: **Один об'єкт**.
  - `selectVar`: **Скалярне значення** (наприклад, COUNT, SUM).
- `getMeta()` повертає метаінформацію, таку як пагінація: `page`, `pageSize`, `count`, `totalPage` тощо.

---

## Конфігурація SQL та режими виконання

| Метод | Опис |
|------|------|
| `setFilterByTk(uid)` | Встановлює UID SQL-шаблону для виконання (відповідає runById, спочатку потрібно зберегти в адмін-панелі). |
| `setSQL(sql)` | Встановлює сирий SQL (використовується для runBySQL лише в режимі налагодження `setDebug(true)`). |
| `setSQLType(type)` | Тип результату: `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | Якщо true, `refresh` викликає `runBySQL()`, інакше — `runById()`. |
| `run()` | Викликає `runBySQL()` або `runById()` залежно від стану налагодження. |
| `runBySQL()` | Виконує SQL, встановлений через `setSQL` (потребує `setDebug(true)`). |
| `runById()` | Виконує збережений SQL-шаблон за поточним UID. |

---

## Параметри та контекст

| Метод | Опис |
|------|------|
| `setBind(bind)` | Прив'язка змінних. Об'єктна форма для плейсхолдерів `:name`, масив — для `?`. |
| `setLiquidContext(ctx)` | Контекст шаблону (Liquid), використовується для парсингу `{{ctx.xxx}}`. |
| `setFilter(filter)` | Додаткові умови фільтрації (передаються в дані запиту). |
| `setDataSourceKey(key)` | Ідентифікатор джерела даних (використовується при наявності кількох джерел даних). |

---

## Пагінація

| Метод | Опис |
|------|------|
| `setPage(page)` / `getPage()` | Поточна сторінка (за замовчуванням 1). |
| `setPageSize(size)` / `getPageSize()` | Кількість елементів на сторінці (за замовчуванням 20). |
| `next()` / `previous()` / `goto(page)` | Перехід по сторінках та запуск `refresh`. |

У SQL можна використовувати `{{ctx.limit}}` та `{{ctx.offset}}` для посилання на параметри пагінації. SQLResource автоматично ін'єктує `limit` та `offset` у контекст.

---

## Отримання даних та події

| Метод | Опис |
|------|------|
| `refresh()` | Виконує SQL (runById або runBySQL), записує результат у `setData(data)`, оновлює meta та викликає подію `'refresh'`. |
| `runAction(actionName, options)` | Викликає базові дії (наприклад, `getBind`, `run`, `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | Спрацьовує після завершення оновлення або на початку завантаження. |

---

## Приклади

### Виконання за збереженим шаблоном (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // UID збереженого SQL-шаблону
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count тощо.
```

### Режим налагодження: пряме виконання SQL (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Пагінація та навігація

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Навігація
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Типи результатів

```js
// Кілька рядків (за замовчуванням)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Один рядок
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Одне значення (наприклад, COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Використання змінних шаблону

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### Прослуховування події refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Зауваження

- **runById потребує попереднього збереження шаблону**: UID у `setFilterByTk(uid)` має бути ідентифікатором SQL-шаблону, вже збереженого в адмін-панелі. Його можна зберегти через `ctx.sql.save({ uid, sql })`.
- **Режим налагодження потребує прав доступу**: `setDebug(true)` використовує `flowSql:run`, що вимагає наявності у поточної ролі прав на конфігурацію SQL; `runById` потребує лише авторизації користувача.
- **Усунення брязкоту (debouncing) refresh**: Кілька викликів `refresh()` в межах одного циклу подій виконають лише останній виклик, щоб уникнути дублювання запитів.
- **Прив'язка параметрів для запобігання ін'єкціям**: Використовуйте `setBind()` з плейсхолдерами `:name` / `?` замість конкатенації рядків, щоб уникнути SQL-ін'єкцій.

---

## Пов'язане

- [ctx.sql](../context/sql.md) — виконання та управління SQL; `ctx.sql.runById` підходить для простих одноразових запитів.
- [ctx.resource](../context/resource.md) — екземпляр ресурсу в поточному контексті.
- [ctx.initResource()](../context/init-resource.md) — ініціалізація та прив'язка до `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) — створення нового екземпляра ресурсу без прив'язки.
- [APIResource](./api-resource.md) — загальний API-ресурс.
- [MultiRecordResource](./multi-record-resource.md) — орієнтований на колекції та списки.