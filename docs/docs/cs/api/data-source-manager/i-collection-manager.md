:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# ICollectionManager

Rozhraní `ICollectionManager` slouží ke správě instancí `kolekce` zdroje dat.

## API

### registerFieldTypes()

Registruje typy polí v `kolekci`.

#### Podpis

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Registruje `Interface` `kolekce`.

#### Podpis

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Registruje `Collection Template`.

#### Podpis

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Registruje `Model`.

#### Podpis

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Registruje `Repository`.

#### Podpis

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Získá registrovanou instanci `Repository`.

#### Podpis

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Definuje `kolekci`.

#### Podpis

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Upravuje vlastnosti existující `kolekce`.

#### Podpis

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Zkontroluje, zda `kolekce` existuje.

#### Podpis

- `hasCollection(name: string): boolean`

### getCollection()

Získá instanci `kolekce`.

#### Podpis

- `getCollection(name: string): ICollection`

### getCollections()

Získá všechny instance `kolekce`.

#### Podpis

- `getCollections(): Array<ICollection>`

### getRepository()

Získá instanci `Repository`.

#### Podpis

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Synchronizuje zdroj dat. Logika je implementována v podtřídách.

#### Podpis

- `sync(): Promise<void>`