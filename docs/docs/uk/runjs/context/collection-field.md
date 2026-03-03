:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/context/collection-field).
:::

# ctx.collectionField

Екземпляр поля колекції (`CollectionField`), пов'язаний з поточним контекстом виконання RunJS, який використовується для доступу до метаданих поля, типів, правил валідації та інформації про асоціації. Він існує лише тоді, коли поле прив'язане до визначення колекції; для кастомних або віртуальних полів він може мати значення `null`.

## Сценарії використання

| Сценарій | Опис |
|------|------|
| **JSField** | Виконання зв'язків або валідації у полях форми на основі `interface`, `enum`, `targetCollection` тощо. |
| **JSItem** | Доступ до метаданих поля, що відповідає поточному стовпцю в елементах підтаблиці. |
| **JSColumn** | Вибір методів рендерингу на основі `collectionField.interface` або доступ до `targetCollection` у стовпцях таблиці. |

> **Примітка:** `ctx.collectionField` доступний лише тоді, коли поле прив'язане до визначення колекції (Collection); у таких сценаріях, як незалежні блоки JSBlock або події дій без прив'язки до поля, він зазвичай має значення `undefined`. Перед використанням рекомендується перевіряти наявність значення.

## Визначення типу

```ts
collectionField: CollectionField | null | undefined;
```

## Основні властивості

| Властивість | Тип | Опис |
|------|------|------|
| `name` | `string` | Назва поля (наприклад, `status`, `userId`) |
| `title` | `string` | Заголовок поля (включаючи інтернаціоналізацію) |
| `type` | `string` | Тип даних поля (`string`, `integer`, `belongsTo` тощо) |
| `interface` | `string` | Тип інтерфейсу поля (`input`, `select`, `m2o`, `o2m`, `m2m` тощо) |
| `collection` | `Collection` | Колекція, якій належить поле |
| `targetCollection` | `Collection` | Цільова колекція поля асоціації (тільки для типів асоціацій) |
| `target` | `string` | Назва цільової колекції (для полів асоціацій) |
| `enum` | `array` | Варіанти перерахування (select, radio тощо) |
| `defaultValue` | `any` | Значення за замовчуванням |
| `collectionName` | `string` | Назва колекції, якій належить поле |
| `foreignKey` | `string` | Назва поля зовнішнього ключа (belongsTo тощо) |
| `sourceKey` | `string` | Ключ джерела асоціації (hasMany тощо) |
| `targetKey` | `string` | Ключ цілі асоціації |
| `fullpath` | `string` | Повний шлях (наприклад, `main.users.status`), використовується для API або посилань на змінні |
| `resourceName` | `string` | Назва ресурсу (наприклад, `users.status`) |
| `readonly` | `boolean` | Чи є поле тільки для читання |
| `titleable` | `boolean` | Чи може поле відображатися як заголовок |
| `validation` | `object` | Конфігурація правил валідації |
| `uiSchema` | `object` | Конфігурація UI |
| `targetCollectionTitleField` | `CollectionField` | Поле заголовка цільової колекції (для полів асоціацій) |

## Основні методи

| Метод | Опис |
|------|------|
| `isAssociationField(): boolean` | Чи є поле полем асоціації (belongsTo, hasMany, hasOne, belongsToMany тощо) |
| `isRelationshipField(): boolean` | Чи є поле полем зв'язку (включаючи o2o, m2o, o2m, m2m тощо) |
| `getComponentProps(): object` | Отримати стандартні props компонента поля |
| `getFields(): CollectionField[]` | Отримати список полів цільової колекції (тільки для полів асоціацій) |
| `getFilterOperators(): object[]` | Отримати оператори фільтрації, що підтримуються цим полем (наприклад, `$eq`, `$ne` тощо) |

## Приклади

### Рендеринг розгалуження на основі типу поля

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // Поле асоціації: відображення пов'язаних записів
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Визначення, чи є поле асоціативним, та доступ до цільової колекції

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Обробка відповідно до структури цільової колекції
}
```

### Отримання варіантів перерахування (enum)

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Умовний рендеринг на основі режиму "тільки для читання"

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Отримання поля заголовка цільової колекції

```ts
// При відображенні поля асоціації використовуйте targetCollectionTitleField, щоб отримати назву поля заголовка
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Зв'язок із ctx.collection

| Потреба | Рекомендоване використання |
|------|----------|
| **Колекція поточного поля** | `ctx.collectionField?.collection` або `ctx.collection` |
| **Метадані поля (назва, тип, інтерфейс, enum тощо)** | `ctx.collectionField` |
| **Цільова колекція асоціації** | `ctx.collectionField?.targetCollection` |

`ctx.collection` зазвичай представляє колекцію, прив'язану до поточного блоку; `ctx.collectionField` представляє визначення поточного поля в колекції. У таких сценаріях, як підтаблиці або поля асоціацій, вони можуть відрізнятися.

## Зауваження

- У сценаріях, таких як **JSBlock** або **JSAction (без прив'язки до поля)**, `ctx.collectionField` зазвичай має значення `undefined`. Перед доступом рекомендується використовувати опціональний ланцюжок (optional chaining).
- Якщо кастомне JS-поле не прив'язане до поля колекції, `ctx.collectionField` може бути `null`.
- `targetCollection` існує лише для полів типу асоціації (наприклад, m2o, o2m, m2m); `enum` існує лише для полів з варіантами вибору, таких як select або radioGroup.

## Пов'язане

- [ctx.collection](./collection.md): Колекція, пов'язана з поточним контекстом
- [ctx.model](./model.md): Модель, у якій знаходиться поточний контекст виконання
- [ctx.blockModel](./block-model.md): Батьківський блок, що містить поточний JS
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): Читання та запис значення поточного поля