:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/context/data-source).
:::

# ctx.dataSource

Экземпляр источника данных (`DataSource`), привязанный к текущему контексту выполнения RunJS. Используется для доступа к коллекциям, метаданным полей и управления конфигурациями **внутри текущего источника данных**. Обычно соответствует источнику данных, выбранному для текущей страницы или блока (например, основной базе данных `main`).

## Применимые сценарии

| Сценарий | Описание |
|------|------|
| **Операции с одним источником данных** | Получение метаданных коллекций и полей, когда текущий источник данных известен. |
| **Управление коллекциями** | Получение, добавление, обновление или удаление коллекций в текущем источнике данных. |
| **Получение полей по пути** | Использование формата `имяКоллекции.путьКПолю` для получения определений полей (поддерживает пути ассоциаций). |

> Примечание: `ctx.dataSource` представляет собой один источник данных для текущего контекста. Чтобы перечислить или получить доступ к другим источникам данных, используйте [ctx.dataSourceManager](./data-source-manager.md).

## Определение типа

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Свойства только для чтения
  get flowEngine(): FlowEngine;   // Текущий экземпляр FlowEngine
  get displayName(): string;      // Отображаемое имя (поддерживает i18n)
  get key(): string;              // Ключ источника данных, например, 'main'
  get name(): string;             // То же, что и key

  // Чтение коллекций
  getCollections(): Collection[];                      // Получить все коллекции
  getCollection(name: string): Collection | undefined; // Получить коллекцию по имени
  getAssociation(associationName: string): CollectionField | undefined; // Получить поле ассоциации (например, users.roles)

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

## Общие свойства

| Свойство | Тип | Описание |
|------|------|------|
| `key` | `string` | Ключ источника данных, например, `'main'` |
| `name` | `string` | То же, что и key |
| `displayName` | `string` | Отображаемое имя (поддерживает i18n) |
| `flowEngine` | `FlowEngine` | Текущий экземпляр FlowEngine |

## Общие методы

| Метод | Описание |
|------|------|
| `getCollections()` | Возвращает все коллекции в текущем источнике данных (отсортированные, скрытые отфильтрованы). |
| `getCollection(name)` | Возвращает коллекцию по имени; `name` может быть в формате `имяКоллекции.имяПоля` для получения целевой коллекции ассоциации. |
| `getAssociation(associationName)` | Возвращает определение поля ассоциации по `имяКоллекции.имяПоля`. |
| `getCollectionField(fieldPath)` | Возвращает определение поля по `имяКоллекции.путьКПолю`, поддерживая пути ассоциаций, такие как `users.profile.avatar`. |

## Связь с ctx.dataSourceManager

| Потребность | Рекомендуемое использование |
|------|----------|
| **Одиночный источник данных, привязанный к текущему контексту** | `ctx.dataSource` |
| **Точка входа для всех источников данных** | `ctx.dataSourceManager` |
| **Получение коллекции в текущем источнике данных** | `ctx.dataSource.getCollection(name)` |
| **Получение коллекции между разными источниками данных** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Получение поля в текущем источнике данных** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Получение поля между разными источниками данных** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

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

### Получение полей ассоциации

```ts
// Получить определение поля ассоциации по имяКоллекции.имяПоля
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // Обработка на основе структуры целевой коллекции
}
```

### Перебор коллекций для динамической обработки

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Выполнение валидации или динамического UI на основе метаданных поля

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // Выполнение логики UI или валидации на основе интерфейса, перечисления, валидации и т. д.
}
```

## Примечания

- Формат пути для `getCollectionField(fieldPath)` — `имяКоллекции.путьКПолю`, где первый сегмент — это имя коллекции, а последующие — путь к полю (поддерживает ассоциации, например, `user.name`).
- `getCollection(name)` поддерживает формат `имяКоллекции.имяПоля`, возвращая целевую коллекцию поля ассоциации.
- В контексте RunJS `ctx.dataSource` обычно определяется источником данных текущего блока или страницы. Если к контексту не привязан источник данных, значение может быть `undefined`; перед использованием рекомендуется выполнить проверку на пустое значение.

## Связанные разделы

- [ctx.dataSourceManager](./data-source-manager.md): Менеджер источников данных, управляет всеми источниками данных.
- [ctx.collection](./collection.md): Коллекция, связанная с текущим контекстом.
- [ctx.collectionField](./collection-field.md): Определение поля коллекции для текущего поля.