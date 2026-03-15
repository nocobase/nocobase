:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/context/data-source-manager).
:::

# ctx.dataSourceManager

Менеджер источников данных (экземпляр `DataSourceManager`), используемый для управления и доступа к нескольким источникам данных (например, основная база данных `main`, база данных логов `logging` и т. д.). Он применяется при наличии нескольких источников данных или при необходимости доступа к метаданным между различными источниками данных.

## Сценарии использования

| Сценарий | Описание |
|------|------|
| **Несколько источников данных** | Перечисление всех источников данных или получение конкретного источника по ключу. |
| **Доступ между источниками данных** | Доступ к метаданным с использованием формата «ключ источника данных + имя коллекции», когда источник данных текущего контекста неизвестен. |
| **Получение полей по полному пути** | Использование формата `dataSourceKey.collectionName.fieldPath` для получения определений полей в разных источниках данных. |

> Примечание: Если вы работаете только с текущим источником данных, отдавайте приоритет использованию `ctx.dataSource`. Используйте `ctx.dataSourceManager` только тогда, когда вам нужно перечислить источники данных или переключиться между ними.

## Определение типа

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // Управление источниками данных
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // Чтение источников данных
  getDataSources(): DataSource[];                     // Получить все источники данных
  getDataSource(key: string): DataSource | undefined;  // Получить источник данных по ключу

  // Прямой доступ к метаданным через источник данных + коллекцию
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Связь с ctx.dataSource

| Потребность | Рекомендуемое использование |
|------|----------|
| **Один источник данных, привязанный к текущему контексту** | `ctx.dataSource` (например, источник данных текущей страницы или блока) |
| **Точка входа для всех источников данных** | `ctx.dataSourceManager` |
| **Список или переключение источников данных** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Получение коллекции в текущем источнике данных** | `ctx.dataSource.getCollection(name)` |
| **Получение коллекции между источниками данных** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Получение поля в текущем источнике данных** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Получение поля между источниками данных** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Примеры

### Получение конкретного источника данных

```ts
// Получить источник данных с именем 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Получить все коллекции этого источника данных
const collections = mainDS?.getCollections();
```

### Доступ к метаданным коллекции между источниками данных

```ts
// Получить коллекцию по dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Получить первичный ключ коллекции
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Получение определения поля по полному пути

```ts
// Формат: dataSourceKey.collectionName.fieldPath
// Получить определение поля по пути «ключ источника данных.имя коллекции.путь к полю»
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// Поддержка путей через поля ассоциаций
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Перебор всех источников данных

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Источник данных: ${ds.key}, Отображаемое имя: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Коллекция: ${col.name}`);
  }
}
```

### Динамический выбор источника данных на основе переменных

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## Примечания

- Формат пути для `getCollectionField` — `dataSourceKey.collectionName.fieldPath`, где первый сегмент — это ключ источника данных, за которым следуют имя коллекции и путь к полю.
- `getDataSource(key)` возвращает `undefined`, если источник данных не существует; перед использованием рекомендуется выполнить проверку на пустое значение.
- `addDataSource` выдаст исключение, если ключ уже существует; `upsertDataSource` либо перезапишет существующий, либо добавит новый.

## Связанные разделы

- [ctx.dataSource](./data-source.md): Текущий экземпляр источника данных
- [ctx.collection](./collection.md): Коллекция, связанная с текущим контекстом
- [ctx.collectionField](./collection-field.md): Определение поля коллекции для текущего поля