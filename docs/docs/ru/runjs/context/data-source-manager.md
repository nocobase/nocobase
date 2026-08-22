# ctx.dataSourceManager

Менеджер источников данных (экземпляр `DataSourceManager`) для управления и доступа к нескольким источникам (например, основной `main`, логирование `logging`). Нужен, когда в приложении используется несколько источников данных или требуется межисточниковый доступ к метаданным.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **Несколько источников данных** | Перечислить все источники данных, получить источник по ключу |
| **Доступ между источниками** | Когда контекст не привязан к одному источнику, доступ по связке «ключ источника данных + имя коллекции» |
| **Поле по полному пути** | Получить определение поля по пути формата `dataSourceKey.collectionName.fieldPath` |

> **Примечание**: если вы работаете только с текущим источником, используйте `ctx.dataSource`; `ctx.dataSourceManager` нужен, когда требуется перечисление или переключение между источниками.

## Тип

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
  getDataSources(): DataSource[];                     // Получить все источники данных  getDataSource(key: string): DataSource | undefined;

  // Прямой доступ к метаданным через источник данных + коллекцию
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Связь с ctx.dataSource

| Задача | Рекомендуемый API |
|--------|-------------------|
| **Один источник для текущего контекста** | `ctx.dataSource` |
| **Точка входа ко всем источникам** | `ctx.dataSourceManager` |
| **Список/переключение источников** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Коллекция в текущем источнике** | `ctx.dataSource.getCollection(name)` |
| **Коллекция в другом источнике** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Поле в текущем источнике** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Поле между источниками** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Примеры

### Получение источника данных

```ts
// Получить источник данных с именем 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Получить все коллекции этого источника данных
const collections = mainDS?.getCollections();
```

### Метаданные коллекций между источниками

```ts
// Получить коллекцию по dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Получить первичный ключ коллекции
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Поле по полному пути

```ts
// Формат: dataSourceKey.collectionName.fieldPath
// Получить определение поля по пути «dataSourceKey.collectionName.fieldPath»
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// Поддержка путей через поля ассоциаций
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Перебор всех источников данных

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Data source: ${ds.key}, display: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Collection: ${col.name}`);
  }
}
```

### Динамический выбор источника из переменной

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

- Формат пути для `getCollectionField`: `dataSourceKey.collectionName.fieldPath`; первый сегмент — ключ источника данных, затем имя коллекции и путь поля.
- `getDataSource(key)` возвращает `undefined`, если источник не найден — проверяйте перед использованием.
- `addDataSource` выбрасывает ошибку, если ключ уже существует; `upsertDataSource` обновляет существующий источник или добавляет новый.

## Связанные материалы

- [ctx.dataSource](./data-source.md): экземпляр текущего источника данных
- [ctx.collection](./collection.md): коллекция текущего контекста
- [ctx.collectionField](./collection-field.md): определение поля коллекции для текущего поля