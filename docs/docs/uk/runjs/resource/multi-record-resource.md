:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/resource/multi-record-resource).
:::

# MultiRecordResource

Ресурс, орієнтований на колекції: запити повертають масив і підтримують пагінацію, фільтрацію, сортування та операції CRUD. Він підходить для сценаріїв з «кількома записами», таких як таблиці та списки. На відміну від [APIResource](./api-resource.md), MultiRecordResource визначає назву ресурсу за допомогою `setResourceName()`, автоматично створює URL-адреси на зразок `users:list` та `users:create`, а також має вбудовані можливості для пагінації, фільтрації та вибору рядків.

**Ієрархія успадкування**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Спосіб створення**: `ctx.makeResource('MultiRecordResource')` або `ctx.initResource('MultiRecordResource')`. Перед використанням необхідно викликати `setResourceName('назва_колекції')` (наприклад, `'users'`); у RunJS `ctx.api` ін'єктується середовищем виконання.

---

## Сценарії використання

| Сценарій | Опис |
|------|------|
| **Блоки таблиць** | Блоки таблиць та списків за замовчуванням використовують MultiRecordResource, що підтримує пагінацію, фільтрацію та сортування. |
| **Списки JSBlock** | Завантаження даних із колекцій, таких як користувачі або замовлення, у JSBlock та виконання власного рендерингу. |
| **Групові операції** | Використання `getSelectedRows()` для отримання вибраних рядків та `destroySelectedRows()` для масового видалення. |
| **Асоційовані ресурси** | Завантаження пов'язаних колекцій у форматі `users.tags`, що потребує виклику `setSourceId(parentRecordId)`. |

---

## Формат даних

- `getData()` повертає **масив записів**, тобто поле `data` з відповіді API списку.
- `getMeta()` повертає метадані пагінації та іншу інформацію: `page`, `pageSize`, `count`, `totalPage` тощо.

---

## Назва ресурсу та джерело даних

| Метод | Опис |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Назва ресурсу, наприклад, `'users'`, `'users.tags'` (асоційований ресурс). |
| `setSourceId(id)` / `getSourceId()` | ID батьківського запису для асоційованих ресурсів (наприклад, для `users.tags` потрібно передати первинний ключ користувача). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Ідентифікатор джерела даних (використовується в сценаріях з кількома джерелами даних). |

---

## Параметри запиту (Фільтрація / Поля / Сортування)

| Метод | Опис |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Фільтрація за первинним ключем (для отримання одного запису `get` тощо). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Умови фільтрації, що підтримують оператори `$eq`, `$ne`, `$in` тощо. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Групи фільтрів (для комбінування кількох умов). |
| `setFields(fields)` / `getFields()` | Запитувані поля (білий список). |
| `setSort(sort)` / `getSort()` | Сортування, наприклад, `['-createdAt']` для сортування за часом створення у зворотному порядку. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Завантаження асоціацій (наприклад, `['user', 'tags']`). |

---

## Пагінація

| Метод | Опис |
|------|------|
| `setPage(page)` / `getPage()` | Поточна сторінка (починаючи з 1). |
| `setPageSize(size)` / `getPageSize()` | Кількість елементів на сторінці, за замовчуванням 20. |
| `getTotalPage()` | Загальна кількість сторінок. |
| `getCount()` | Загальна кількість записів (із метаданих сервера). |
| `next()` / `previous()` / `goto(page)` | Перехід по сторінках із викликом `refresh`. |

---

## Вибрані рядки (сценарії з таблицями)

| Метод | Опис |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Дані поточних вибраних рядків, що використовуються для масового видалення та інших операцій. |

---

## CRUD та операції зі списками

| Метод | Опис |
|------|------|
| `refresh()` | Запитує список із поточними параметрами, оновлює `getData()` та метадані пагінації, а також викликає подію `'refresh'`. |
| `get(filterByTk)` | Запитує один запис і повертає його (не записує в `getData`). |
| `create(data, options?)` | Створює запис. Опція `{ refresh: false }` запобігає автоматичному оновленню. Викликає подію `'saved'`. |
| `update(filterByTk, data, options?)` | Оновлює запис за його первинним ключем. |
| `destroy(target)` | Видаляє записи; `target` може бути первинним ключем, об'єктом рядка або масивом первинних ключів чи об'єктів (масове видалення). |
| `destroySelectedRows()` | Видаляє поточні вибрані рядки (викидає помилку, якщо нічого не вибрано). |
| `setItem(index, item)` | Локально замінює певний рядок даних (не ініціює запит). |
| `runAction(actionName, options)` | Викликає будь-яку дію ресурсу (наприклад, власні дії). |

---

## Конфігурація та події

| Метод | Опис |
|------|------|
| `setRefreshAction(name)` | Дія, що викликається під час оновлення, за замовчуванням `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Конфігурація запиту для створення/оновлення. |
| `on('refresh', fn)` / `on('saved', fn)` | Спрацьовує після завершення оновлення або після збереження. |

---

## Приклади

### Базовий список

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Фільтрація та сортування

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Завантаження асоціацій

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Створення та пагінація

```js
await ctx.resource.create({ name: 'Іван Іваненко', email: 'ivan.ivanenko@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Масове видалення вибраних рядків

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Будь ласка, спочатку виберіть дані');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Видалено'));
```

### Прослуховування події refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Асоційований ресурс (підтаблиця)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Примітки

- **setResourceName є обов'язковим**: Ви повинні викликати `setResourceName('назва_колекції')` перед використанням, інакше URL-адреса запиту не зможе бути побудована.
- **Асоційовані ресурси**: Коли назва ресурсу має формат `parent.child` (наприклад, `users.tags`), необхідно спочатку викликати `setSourceId(parentPrimaryKey)`.
- **Усунення брязкоту (debouncing) оновлення**: Кілька викликів `refresh()` в межах одного циклу подій виконають лише останній виклик, щоб уникнути зайвих запитів.
- **getData повертає масив**: Поле `data`, що повертається API списку, є масивом записів, і `getData()` повертає цей масив безпосередньо.

---

## Пов'язане

- [ctx.resource](../context/resource.md) — екземпляр ресурсу в поточному контексті
- [ctx.initResource()](../context/init-resource.md) — ініціалізація та прив'язка до ctx.resource
- [ctx.makeResource()](../context/make-resource.md) — створення нового екземпляра ресурсу без прив'язки
- [APIResource](./api-resource.md) — загальний API-ресурс, що запитується за URL
- [SingleRecordResource](./single-record-resource.md) — орієнтований на один запис