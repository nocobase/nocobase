# ICollectionManager

The `ICollectionManager` interface is used to manage `Collection` instances of a data source.

## API

### registerFieldTypes()

Registers field types in a `Collection`.

#### Signature

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Registers the `Interface` of a `Collection`.

#### Signature

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Registers a `Collection Template`.

#### Signature

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Registers a `Model`.

#### Signature

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Registers a `Repository`.

#### Signature

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Gets a registered repository instance.

#### Signature

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Defines a `Collection`.

#### Signature

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Modifies the properties of an existing `Collection`.

#### Signature

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Checks if a `Collection` exists.

#### Signature


- `hasCollection(name: string): boolean`

### getCollection()

Gets a `Collection` instance.

#### Signature

- `getCollection(name: string): ICollection`

### getCollections()

Gets all `Collection` instances.

#### Signature

- `getCollections(): Array<ICollection>`

### getRepository()

Gets a `Repository` instance.

#### Signature

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Synchronizes the data source. The logic is implemented by subclasses.

#### Signature

- `sync(): Promise<void>`