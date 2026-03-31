:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# ICollectionManager

Интерфейс `ICollectionManager` используется для управления экземплярами `коллекций` источника данных.

## API

### registerFieldTypes()

Регистрирует типы полей в `коллекции`.

#### Сигнатура

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Регистрирует `интерфейс` `коллекции`.

#### Сигнатура

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Регистрирует `шаблон коллекции`.

#### Сигнатура

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Регистрирует `модель`.

#### Сигнатура

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Регистрирует `репозиторий`.

#### Сигнатура

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Получает зарегистрированный экземпляр репозитория.

#### Сигнатура

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Определяет `коллекцию`.

#### Сигнатура

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Изменяет свойства существующей `коллекции`.

#### Сигнатура

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Проверяет, существует ли `коллекция`.

#### Сигнатура

- `hasCollection(name: string): boolean`

### getCollection()

Получает экземпляр `коллекции`.

#### Сигнатура

- `getCollection(name: string): ICollection`

### getCollections()

Получает все экземпляры `коллекций`.

#### Сигнатура

- `getCollections(): Array<ICollection>`

### getRepository()

Получает экземпляр `репозитория`.

#### Сигнатура

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Синхронизирует источник данных. Логика синхронизации реализуется в подклассах.

#### Сигнатура

- `sync(): Promise<void>`