:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/context/data-source-manager).
:::

# ctx.dataSourceManager

Менеджер джерел даних (екземпляр `DataSourceManager`), що використовується для керування та доступу до кількох джерел даних (наприклад, основна база даних `main`, база логів `logging` тощо). Використовується при наявності кількох джерел даних або за потреби доступу до метаданих між різними джерелами.

## Сценарії використання

| Сценарій | Опис |
|------|------|
| **Кілька джерел даних** | Перелік усіх джерел даних або отримання конкретного джерела за ключем. |
| **Доступ між джерелами даних** | Доступ до метаданих за форматом «ключ джерела даних + назва колекції», коли джерело даних поточного контексту невідоме. |
| **Отримання полів за повним шляхом** | Використання формату `dataSourceKey.collectionName.fieldPath` для отримання визначень полів у різних джерелах даних. |

> Примітка: Якщо ви працюєте лише з поточним джерелом даних, надавайте перевагу `ctx.dataSource`. Використовуйте `ctx.dataSourceManager` лише тоді, коли потрібно перелічити або перемикатися між джерелами даних.

## Визначення типів

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // Керування джерелами даних
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // Читання джерел даних
  getDataSources(): DataSource[];                     // Отримати всі джерела даних
  getDataSource(key: string): DataSource | undefined;  // Отримати джерело даних за ключем

  // Прямий доступ до метаданих через джерело даних + колекцію
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Зв'язок із ctx.dataSource

| Потреба | Рекомендоване використання |
|------|----------|
| **Єдине джерело даних, прив'язане до поточного контексту** | `ctx.dataSource` (наприклад, джерело даних поточної сторінки/блоку) |
| **Точка входу для всіх джерел даних** | `ctx.dataSourceManager` |
| **Список або перемикання джерел даних** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Отримання колекції в межах поточного джерела даних** | `ctx.dataSource.getCollection(name)` |
| **Отримання колекції між різними джерелами даних** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Отримання поля в межах поточного джерела даних** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Отримання поля між різними джерелами даних** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Приклади

### Отримання конкретного джерела даних

```ts
// Отримати джерело даних з назвою 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Отримати всі колекції цього джерела даних
const collections = mainDS?.getCollections();
```

### Доступ до метаданих колекції між джерелами даних

```ts
// Отримати колекцію за dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Отримати первинний ключ колекції
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Отримання визначення поля за повним шляхом

```ts
// Формат: dataSourceKey.collectionName.fieldPath
// Отримати визначення поля за «ключ джерела даних.назва колекції.шлях до поля»
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// Підтримує шляхи асоціативних полів
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Перебір усіх джерел даних

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Джерело даних: ${ds.key}, Відображуване ім'я: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Колекція: ${col.name}`);
  }
}
```

### Динамічний вибір джерела даних на основі змінних

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## Зауваження

- Формат шляху для `getCollectionField` — `dataSourceKey.collectionName.fieldPath`, де перший сегмент — це ключ джерела даних, за яким слідують назва колекції та шлях до поля.
- `getDataSource(key)` повертає `undefined`, якщо джерело даних не існує; перед використанням рекомендується перевіряти на наявність значення.
- `addDataSource` викине виключення, якщо ключ уже існує; `upsertDataSource` або перезапише існуюче, або додасть нове.

## Пов'язане

- [ctx.dataSource](./data-source.md): Поточний екземпляр джерела даних
- [ctx.collection](./collection.md): Колекція, пов'язана з поточним контекстом
- [ctx.collectionField](./collection-field.md): Визначення поля колекції для поточного поля