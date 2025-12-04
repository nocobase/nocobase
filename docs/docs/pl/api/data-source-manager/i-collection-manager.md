:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# ICollectionManager

Interfejs `ICollectionManager` służy do zarządzania instancjami `kolekcji` dla `źródła danych`.

## API

### registerFieldTypes()

Rejestruje typy pól w `kolekcji`.

#### Sygnatura

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Rejestruje `Interface` `kolekcji`.

#### Sygnatura

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Rejestruje `Collection Template`.

#### Sygnatura

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Rejestruje `Model`.

#### Sygnatura

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Rejestruje `Repository`.

#### Sygnatura

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Pobiera zarejestrowaną instancję `Repository`.

#### Sygnatura

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Definiuje `kolekcję`.

#### Sygnatura

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Modyfikuje właściwości istniejącej `kolekcji`.

#### Sygnatura

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Sprawdza, czy `kolekcja` istnieje.

#### Sygnatura

- `hasCollection(name: string): boolean`

### getCollection()

Pobiera instancję `kolekcji`.

#### Sygnatura

- `getCollection(name: string): ICollection`

### getCollections()

Pobiera wszystkie instancje `kolekcji`.

#### Sygnatura

- `getCollections(): Array<ICollection>`

### getRepository()

Pobiera instancję `Repository`.

#### Sygnatura

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Synchronizuje `źródło danych`. Logika jest implementowana przez podklasy.

#### Sygnatura

- `sync(): Promise<void>`