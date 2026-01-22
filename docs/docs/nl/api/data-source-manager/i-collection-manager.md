:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# ICollectionManager

De `ICollectionManager`-interface gebruikt u om `collectie`-instanties van een gegevensbron te beheren.

## API

### registerFieldTypes()

Registreert veldtypen in een `collectie`.

#### Signatuur

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Registreert de `Interface` van een `collectie`.

#### Signatuur

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Registreert een `collectie` sjabloon.

#### Signatuur

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Registreert een `Model`.

#### Signatuur

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Registreert een `Repository`.

#### Signatuur

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Haalt een geregistreerde repository-instantie op.

#### Signatuur

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Definieert een `collectie`.

#### Signatuur

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Wijzigt de eigenschappen van een bestaande `collectie`.

#### Signatuur

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Controleert of een `collectie` bestaat.

#### Signatuur

- `hasCollection(name: string): boolean`

### getCollection()

Haalt een `collectie`-instantie op.

#### Signatuur

- `getCollection(name: string): ICollection`

### getCollections()

Haalt alle `collectie`-instanties op.

#### Signatuur

- `getCollections(): Array<ICollection>`

### getRepository()

Haalt een `Repository`-instantie op.

#### Signatuur

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Synchroniseert de gegevensbron. De logica wordt geïmplementeerd door subklassen.

#### Signatuur

- `sync(): Promise<void>`