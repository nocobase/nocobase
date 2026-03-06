:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/context/collection).
:::

# ctx.collection

Екземпляр колекції (Collection), пов'язаний з поточним контекстом виконання RunJS, який використовується для доступу до метаданих колекції, визначень полів, первинних ключів та інших конфігурацій. Зазвичай походить з `ctx.blockModel.collection` або `ctx.collectionField?.collection`.

## Сценарії використання

| Сценарій | Опис |
|------|------|
| **JSBlock** | Колекція, прив'язана до блоку; можна отримати доступ до `name`, `getFields`, `filterTargetKey` тощо. |
| **JSField / JSItem / JSColumn** | Колекція, до якої належить поточне поле (або колекція батьківського блоку), використовується для отримання списків полів, первинних ключів тощо. |
| **Стовпець таблиці / Блок деталей** | Використовується для рендерингу на основі структури колекції або передачі `filterByTk` при відкритті спливаючих вікон. |

> **Примітка:** `ctx.collection` доступний у сценаріях, де блок даних, блок форми або блок таблиці прив'язаний до колекції. У незалежному JSBlock, який не прив'язаний до колекції, він може бути `null`. Рекомендується перевіряти на порожнє значення перед використанням.

## Визначення типу

```ts
collection: Collection | null | undefined;
```

## Основні властивості

| Властивість | Тип | Опис |
|------|------|------|
| `name` | `string` | Назва колекції (наприклад, `users`, `orders`) |
| `title` | `string` | Заголовок колекції (з урахуванням інтернаціоналізації) |
| `filterTargetKey` | `string \| string[]` | Назва поля первинного ключа, використовується для `filterByTk` та `getFilterByTK` |
| `dataSourceKey` | `string` | Ключ джерела даних (наприклад, `main`) |
| `dataSource` | `DataSource` | Екземпляр джерела даних, якому належить колекція |
| `template` | `string` | Шаблон колекції (наприклад, `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Список полів, які можуть відображатися як заголовки |
| `titleCollectionField` | `CollectionField` | Екземпляр поля заголовка |

## Основні методи

| Метод | Опис |
|------|------|
| `getFields(): CollectionField[]` | Отримати всі поля (включаючи успадковані) |
| `getField(name: string): CollectionField \| undefined` | Отримати одне поле за його назвою |
| `getFieldByPath(path: string): CollectionField \| undefined` | Отримати поле за шляхом (підтримує асоціації, наприклад, `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Отримати асоціативні поля; `types` може бути `['one']`, `['many']` тощо. |
| `getFilterByTK(record): any` | Витягти значення первинного ключа із запису, використовується для `filterByTk` в API |

## Зв'язок із ctx.collectionField та ctx.blockModel

| Потреба | Рекомендоване використання |
|------|----------|
| **Колекція, пов'язана з поточним контекстом** | `ctx.collection` (еквівалентно `ctx.blockModel?.collection` або `ctx.collectionField?.collection`) |
| **Визначення колекції поточного поля** | `ctx.collectionField?.collection` (колекція, якій належить поле) |
| **Цільова колекція асоціації** | `ctx.collectionField?.targetCollection` (цільова колекція асоціативного поля) |

У таких сценаріях, як підтаблиці, `ctx.collection` може бути цільовою колекцією асоціації; у звичайних формах/таблицях це зазвичай колекція, прив'язана до блоку.

## Приклади

### Отримання первинного ключа та відкриття спливаючого вікна

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Перебір полів для валідації або зв'язку

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} є обов'язковим для заповнення`);
    return;
  }
}
```

### Отримання асоціативних полів

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Використовується для побудови підтаблиць, пов'язаних ресурсів тощо.
```

## Зауваження

- `filterTargetKey` — це назва поля первинного ключа колекції. Деякі колекції можуть використовувати складені первинні ключі типу `string[]`. Якщо конфігурація відсутня, зазвичай використовується `'id'` як резервний варіант.
- У сценаріях із **підтаблицями або асоціативними полями** `ctx.collection` може вказувати на цільову колекцію асоціації, що відрізняється від `ctx.blockModel.collection`.
- `getFields()` об'єднує поля з успадкованих колекцій; локальні поля перевизначають успадковані поля з такою самою назвою.

## Пов'язано

- [ctx.collectionField](./collection-field.md): Визначення поля колекції для поточного поля
- [ctx.blockModel](./block-model.md): Батьківський блок, що містить поточний JS, включаючи `collection`
- [ctx.model](./model.md): Поточна модель, яка може містити `collection`