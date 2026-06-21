# ICollectionManager - Интерфейс менеджера коллекций

Интерфейс `ICollectionManager` используется для управления экземплярами `Collection` источника данных.

## API

### registerFieldTypes()

Регистрирует типы полей в `Collection`.

#### Сигнатура

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Регистрирует `Interface` для `Collection`.

#### Сигнатура

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Регистрирует `Collection Template`.

#### Сигнатура

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Регистрирует `Model`.

#### Сигнатура

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Регистрирует `Repository`.

#### Сигнатура

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Возвращает зарегистрированный экземпляр репозитория.

#### Сигнатура

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Определяет `Collection`.

#### Сигнатура

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Изменяет свойства существующего `Collection`.

#### Сигнатура

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Проверяет, существует ли `Collection`.

#### Сигнатура

- `hasCollection(name: string): boolean`

### getCollection()

Возвращает экземпляр `Collection`.

#### Сигнатура

- `getCollection(name: string): ICollection`

### getCollections()

Возвращает все экземпляры `Collection`.

#### Сигнатура

- `getCollections(): Array<ICollection>`

### getRepository()

Возвращает экземпляр `Repository`.

#### Сигнатура

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Синхронизирует источник данных. Логика реализуется подклассами.

#### Сигнатура

- `sync(): Promise<void>`