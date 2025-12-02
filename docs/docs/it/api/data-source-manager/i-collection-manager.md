:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# ICollectionManager

L'interfaccia `ICollectionManager` serve a gestire le istanze di `collezione` di una `fonte dati`.

## API

### registerFieldTypes()

Registra i tipi di campo in una `collezione`.

#### Firma

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Registra l'`Interface` di una `collezione`.

#### Firma

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Registra un `Collection Template`.

#### Firma

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Registra un `Model`.

#### Firma

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Registra un `Repository`.

#### Firma

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Recupera un'istanza di repository registrata.

#### Firma

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Definisce una `collezione`.

#### Firma

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Modifica le proprietà di una `collezione` esistente.

#### Firma

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Verifica se una `collezione` esiste.

#### Firma

- `hasCollection(name: string): boolean`

### getCollection()

Recupera un'istanza di `collezione`.

#### Firma

- `getCollection(name: string): ICollection`

### getCollections()

Recupera tutte le istanze di `collezione`.

#### Firma

- `getCollections(): Array<ICollection>`

### getRepository()

Recupera un'istanza di `Repository`.

#### Firma

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Sincronizza la `fonte dati`. La logica è implementata dalle sottoclassi.

#### Firma

- `sync(): Promise<void>`