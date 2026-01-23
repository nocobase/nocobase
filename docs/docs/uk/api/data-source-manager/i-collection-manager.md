:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# ICollectionManager

Інтерфейс `ICollectionManager` використовується для керування екземплярами `колекції` джерела даних.

## API

### registerFieldTypes()

Реєструє типи полів у `колекції`.

#### Підпис

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Реєструє `інтерфейс` `колекції`.

#### Підпис

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Реєструє `шаблон колекції`.

#### Підпис

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Реєструє `модель`.

#### Підпис

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Реєструє `репозиторій`.

#### Підпис

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Отримує зареєстрований екземпляр репозиторію.

#### Підпис

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Визначає `колекцію`.

#### Підпис

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Змінює властивості існуючої `колекції`.

#### Підпис

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Перевіряє, чи існує `колекція`.

#### Підпис

- `hasCollection(name: string): boolean`

### getCollection()

Отримує екземпляр `колекції`.

#### Підпис

- `getCollection(name: string): ICollection`

### getCollections()

Отримує всі екземпляри `колекцій`.

#### Підпис

- `getCollections(): Array<ICollection>`

### getRepository()

Отримує екземпляр `репозиторію`.

#### Підпис

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Синхронізує джерело даних. Логіка реалізується підкласами.

#### Підпис

- `sync(): Promise<void>`