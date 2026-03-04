:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/context/data-source).
:::

# ctx.dataSource

Екземпляр джерела даних (`DataSource`), прив'язаний до поточного контексту виконання RunJS, який використовується для доступу до колекцій, метаданих полів та керування конфігураціями колекцій **у межах поточного джерела даних**. Зазвичай відповідає джерелу даних, вибраному для поточної сторінки або блоку (наприклад, основна база даних `main`).

## Сценарії застосування

| Сценарій | Опис |
|------|------|
| **Операції з одним джерелом даних** | Отримання метаданих колекцій та полів, коли поточне джерело даних відоме. |
| **Керування колекціями** | Отримання, додавання, оновлення або видалення колекцій у поточному джерелі даних. |
| **Отримання полів за шляхом** | Використання формату `collectionName.fieldPath` для отримання визначень полів (підтримує шляхи асоціацій). |

> Примітка: `ctx.dataSource` представляє одне джерело даних для поточного контексту. Щоб перелічити або отримати доступ до інших джерел даних, використовуйте [ctx.dataSourceManager](./data-source-manager.md).

## Визначення типу

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Властивості тільки для читання
  get flowEngine(): FlowEngine;   // Поточний екземпляр FlowEngine
  get displayName(): string;      // Відображувана назва (підтримує i18n)
  get key(): string;              // Ключ джерела даних, наприклад, 'main'
  get name(): string;             // Те саме, що й key

  // Читання колекцій
  getCollections(): Collection[];                      // Отримати всі колекції
  getCollection(name: string): Collection | undefined; // Отримати колекцію за назвою
  getAssociation(associationName: string): CollectionField | undefined; // Отримати поле асоціації (наприклад, users.roles)

  // Керування колекціями
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Метадані полів
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Основні властивості

| Властивість | Тип | Опис |
|------|------|------|
| `key` | `string` | Ключ джерела даних, наприклад, `'main'` |
| `name` | `string` | Те саме, що й key |
| `displayName` | `string` | Відображувана назва (підтримує i18n) |
| `flowEngine` | `FlowEngine` | Поточний екземпляр FlowEngine |

## Основні методи

| Метод | Опис |
|------|------|
| `getCollections()` | Отримує всі колекції в поточному джерелі даних (відсортовані, з відфільтрованими прихованими). |
| `getCollection(name)` | Отримує колекцію за назвою; `name` може бути у форматі `collectionName.fieldName` для отримання цільової колекції асоціації. |
| `getAssociation(associationName)` | Отримує визначення поля асоціації за `collectionName.fieldName`. |
| `getCollectionField(fieldPath)` | Отримує визначення поля за `collectionName.fieldPath`, підтримуючи шляхи асоціацій, як-от `users.profile.avatar`. |

## Зв'язок із ctx.dataSourceManager

| Потреба | Рекомендоване використання |
|------|----------|
| **Єдине джерело даних, прив'язане до поточного контексту** | `ctx.dataSource` |
| **Точка входу для всіх джерел даних** | `ctx.dataSourceManager` |
| **Отримання колекції в межах поточного джерела даних** | `ctx.dataSource.getCollection(name)` |
| **Отримання колекції між різними джерелами даних** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Отримання поля в межах поточного джерела даних** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Отримання поля між різними джерелами даних** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Приклади

### Отримання колекцій та полів

```ts
// Отримати всі колекції
const collections = ctx.dataSource.getCollections();

// Отримати колекцію за назвою
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// Отримати визначення поля за "collectionName.fieldPath" (підтримує асоціації)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### Отримання полів асоціації

```ts
// Отримати визначення поля асоціації за collectionName.fieldName
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // Обробити на основі структури цільової колекції
}
```

### Перебір колекцій для динамічної обробки

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Валідація або динамічний UI на основі метаданих полів

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // Виконати логіку UI або валідацію на основі інтерфейсу, переліку (enum), валідації тощо.
}
```

## Примітки

- Формат шляху для `getCollectionField(fieldPath)` — `collectionName.fieldPath`, де перший сегмент — це назва колекції, а наступні сегменти — шлях до поля (підтримує асоціації, наприклад, `user.name`).
- `getCollection(name)` підтримує формат `collectionName.fieldName`, повертаючи цільову колекцію поля асоціації.
- У контексті RunJS `ctx.dataSource` зазвичай визначається джерелом даних поточного блоку або сторінки. Якщо до контексту не прив'язано жодного джерела даних, воно може бути `undefined`; перед використанням рекомендується виконувати перевірку на пусте значення.

## Пов'язане

- [ctx.dataSourceManager](./data-source-manager.md): Менеджер джерел даних, керує всіма джерелами даних.
- [ctx.collection](./collection.md): Колекція, пов'язана з поточним контекстом.
- [ctx.collectionField](./collection-field.md): Визначення поля колекції для поточного поля.