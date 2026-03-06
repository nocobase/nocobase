:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/resource/single-record-resource).
:::

# SingleRecordResource

Ресурс, орієнтований на **окремий запис**: дані є одним об'єктом, підтримується отримання за первинним ключем, створення/оновлення (save) та видалення. Підходить для сценаріїв «окремого запису», таких як деталі, форми тощо. На відміну від [MultiRecordResource](./multi-record-resource.md), метод `getData()` у `SingleRecordResource` повертає один об'єкт. Ви вказуєте первинний ключ за допомогою `setFilterByTk(id)`, а `save()` автоматично викликає `create` або `update` залежно від стану `isNewRecord`.

**Успадкування**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Спосіб створення**: `ctx.makeResource('SingleRecordResource')` або `ctx.initResource('SingleRecordResource')`. Перед використанням необхідно викликати `setResourceName('назва_колекції')`. При виконанні операцій за первинним ключем використовуйте `setFilterByTk(id)`. У RunJS `ctx.api` ін'єктується середовищем виконання.

---

## Сценарії використання

| Сценарій | Опис |
|------|------|
| **Блок деталей** | Блок деталей за замовчуванням використовує `SingleRecordResource` для завантаження одного запису за первинним ключем. |
| **Блок форми** | Форми створення/редагування використовують `SingleRecordResource`, де `save()` автоматично розрізняє `create` та `update`. |
| **Деталі JSBlock** | Завантаження окремого користувача, замовлення тощо в JSBlock та налаштування їх відображення. |
| **Асоційовані ресурси** | Завантаження пов'язаних окремих записів у форматі `users.profile`, що потребує виклику `setSourceId(ID_батьківського_запису)`. |

---

## Формат даних

- `getData()` повертає **об'єкт окремого запису**, що відповідає полю `data` у відповіді API `get`.
- `getMeta()` повертає метаінформацію (якщо вона є).

---

## Назва ресурсу та первинний ключ

| Метод | Опис |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Назва ресурсу, наприклад, `'users'`, `'users.profile'` (асоційований ресурс). |
| `setSourceId(id)` / `getSourceId()` | ID батьківського запису для асоційованих ресурсів (наприклад, для `users.profile` потрібен первинний ключ запису `users`). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Ідентифікатор джерела даних (використовується при роботі з кількома джерелами даних). |
| `setFilterByTk(tk)` / `getFilterByTk()` | Первинний ключ поточного запису; після встановлення `isNewRecord` стає `false`. |

---

## Стан

| Властивість/Метод | Опис |
|----------|------|
| `isNewRecord` | Чи є запис «новим» (true, якщо `filterByTk` не встановлено або запис щойно створено). |

---

## Параметри запиту (фільтр / поля)

| Метод | Опис |
|------|------|
| `setFilter(filter)` / `getFilter()` | Фільтрація (доступно, коли запис не є «новим»). |
| `setFields(fields)` / `getFields()` | Поля запиту. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Розгортання асоціацій (appends). |

---

## CRUD

| Метод | Опис |
|------|------|
| `refresh()` | Виконує запит `get` на основі поточного `filterByTk` та оновлює `getData()`; у стані «нового запису» запит не виконується. |
| `save(data, options?)` | Викликає `create` у стані «нового запису», інакше викликає `update`; опція `{ refresh: false }` запобігає автоматичному оновленню. |
| `destroy(options?)` | Видаляє запис на основі поточного `filterByTk` та очищує локальні дані. |
| `runAction(actionName, options)` | Викликає будь-яку дію (action) ресурсу. |

---

## Конфігурація та події

| Метод | Опис |
|------|------|
| `setSaveActionOptions(options)` | Конфігурація запиту для дії `save`. |
| `on('refresh', fn)` / `on('saved', fn)` | Спрацьовує після завершення оновлення або після збереження. |

---

## Приклади

### Базове отримання та оновлення

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Оновлення
await ctx.resource.save({ name: 'Іван Іванов' });
```

### Створення нового запису

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Марія Ковальчук', email: 'mariya@example.com' });
```

### Видалення запису

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// Після destroy() getData() повертає null
```

### Розгортання асоціацій та поля

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Асоційовані ресурси (наприклад, users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Первинний ключ батьківського запису
res.setFilterByTk(profileId);    // filterByTk можна опустити, якщо profile має зв'язок hasOne
await res.refresh();
const profile = res.getData();
```

### Збереження без автоматичного оновлення

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// getData() зберігає старе значення, оскільки оновлення після збереження не ініційовано
```

### Прослуховування подій refresh / saved

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>Користувач: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Збережено успішно');
});
await ctx.resource?.refresh?.();
```

---

## Примітки

- **setResourceName є обов'язковим**: Перед використанням необхідно викликати `setResourceName('назва_колекції')`, інакше неможливо побудувати URL запиту.
- **filterByTk та isNewRecord**: Якщо `setFilterByTk` не викликано, `isNewRecord` має значення `true`, і `refresh()` не ініціюватиме запит; `save()` виконає дію `create`.
- **Асоційовані ресурси**: Коли назва ресурсу має формат `parent.child` (наприклад, `users.profile`), спочатку потрібно викликати `setSourceId(parentPrimaryKey)`.
- **getData повертає об'єкт**: Поле `data`, що повертається API для одного запису, є об'єктом запису; `getData()` повертає цей об'єкт безпосередньо. Після `destroy()` він стає `null`.

---

## Пов'язане

- [ctx.resource](../context/resource.md) — екземпляр ресурсу в поточному контексті
- [ctx.initResource()](../context/init-resource.md) — ініціалізація та прив'язка до `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) — створення нового екземпляра ресурсу без прив'язки
- [APIResource](./api-resource.md) — загальний API-ресурс, що запитується за URL
- [MultiRecordResource](./multi-record-resource.md) — орієнтований на колекції/списки, підтримує CRUD та пагінацію