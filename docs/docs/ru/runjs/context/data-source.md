# ctx.dataSource

Экземпляр источника данных (`DataSource`), привязанный к текущему контексту RunJS; используется для доступа к коллекциям, метаданным полей и конфигурации коллекций **в пределах этого источника данных**. Обычно это источник текущей страницы или блока (например, основной `main`).

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **Один источник данных** | Получение коллекций и метаданных полей, когда текущий источник данных известен |
| **Управление коллекциями** | Получение, добавление, обновление и удаление коллекций в текущем источнике |
| **Поле по пути** | Получение определения поля по пути `collectionName.fieldPath` (поддерживаются пути ассоциации) |

> **Примечание**: `ctx.dataSource` — это один источник данных текущего контекста; для перечисления и доступа к другим источникам используйте [ctx.dataSourceManager](./data-source-manager.md).

## Тип

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Свойства только для чтения
  get flowEngine(): FlowEngine;
  get displayName(): string;
  get key(): string;
  get name(): string;

  // Чтение коллекций
  getCollections(): Collection[];
  getCollection(name: string): Collection | undefined;
  getAssociation(associationName: string): CollectionField | undefined;

  // Управление коллекциями
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Метаданные полей
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Основные свойства

| Свойство | Тип | Описание |
|----------|-----|----------|
| `key` | `string` | Ключ источника данных (например, `main`) |
| `name` | `string` | То же, что key |
| `displayName` | `string` | Отображаемое имя (i18n) |
| `flowEngine` | `FlowEngine` | Текущий экземпляр FlowEngine |

## Основные методы

| Метод | Описание |
|-------|----------|
| `getCollections()` | Все коллекции этого источника данных (с сортировкой, скрытые отфильтрованы) |
| `getCollection(name)` | Коллекция по имени; `name` может быть `collectionName.fieldName` для целевой коллекции ассоциации |
| `getAssociation(associationName)` | Поле ассоциации по `collectionName.fieldName` |
| `getCollectionField(fieldPath)` | Поле по `collectionName.fieldPath`; поддерживает пути вида `users.profile.avatar` |

## Связь с ctx.dataSourceManager

| Задача | Рекомендуемый API |
|--------|-------------------|
| **Один источник данных текущего контекста** | `ctx.dataSource` |
| **Точка входа ко всем источникам** | `ctx.dataSourceManager` |
| **Коллекция текущего источника** | `ctx.dataSource.getCollection(name)` |
| **Коллекция другого источника** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Поле текущего источника** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Поле между источниками** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Примеры

### Получение коллекций и полей

```ts
// Получить все коллекции
const collections = ctx.dataSource.getCollections();

// Получить коллекцию по имени
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// Получить определение поля по «имяКоллекции.путьКПолю» (поддерживает ассоциации)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### Получение поля ассоциации

```ts
// Получить определение поля ассоциации по имяКоллекции.имяПоля
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // ...
}
```

### Перебор коллекций

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Валидация или динамический UI по метаданным поля

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // Выполнение логики UI или валидации на основе интерфейса, перечисления, валидации и т. д.
}
```

## Примечания

- `getCollectionField(fieldPath)` использует формат `collectionName.fieldPath`: первый сегмент — имя коллекции, остальное — путь поля (включая ассоциации, например `user.name`).
- `getCollection(name)` поддерживает формат `collectionName.fieldName` и возвращает целевую коллекцию поля ассоциации.
- В RunJS `ctx.dataSource` обычно определяется текущим блоком или страницей; если источник не привязан, значение может быть `undefined` — проверяйте перед использованием.

## Связанные материалы

- [ctx.dataSourceManager](./data-source-manager.md): менеджер всех источников данных
- [ctx.collection](./collection.md): коллекция текущего контекста
- [ctx.collectionField](./collection-field.md): определение поля коллекции для текущего поля