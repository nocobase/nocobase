:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# ICollectionManager

L'interface `ICollectionManager` sert à gérer les instances de `collection` d'une source de données.

## API

### registerFieldTypes()

Enregistre les types de champs dans une `collection`.

#### Signature

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Enregistre l'`Interface` d'une `collection`.

#### Signature

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Enregistre un `Collection Template`.

#### Signature

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Enregistre un `Model`.

#### Signature

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Enregistre un `Repository`.

#### Signature

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Récupère une instance de `Repository` enregistrée.

#### Signature

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Définit une `collection`.

#### Signature

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Modifie les propriétés d'une `collection` existante.

#### Signature

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Vérifie si une `collection` existe.

#### Signature

- `hasCollection(name: string): boolean`

### getCollection()

Récupère une instance de `collection`.

#### Signature

- `getCollection(name: string): ICollection`

### getCollections()

Récupère toutes les instances de `collection`.

#### Signature

- `getCollections(): Array<ICollection>`

### getRepository()

Récupère une instance de `Repository`.

#### Signature

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Synchronise la source de données. La logique est implémentée par les sous-classes.

#### Signature

- `sync(): Promise<void>`