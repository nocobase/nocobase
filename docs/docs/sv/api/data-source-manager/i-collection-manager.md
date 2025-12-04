:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# ICollectionManager

`ICollectionManager`-gränssnittet används för att hantera `samling`-instanser för en `datakälla`.

## API

### registerFieldTypes()

Registrerar fälttyper i en `samling`.

#### Signatur

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Registrerar `gränssnittet` för en `samling`.

#### Signatur

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Registrerar en `samlingsmall`.

#### Signatur

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Registrerar en `modell`.

#### Signatur

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Registrerar ett `repository`.

#### Signatur

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Hämtar en registrerad `repository`-instans.

#### Signatur

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Definierar en `samling`.

#### Signatur

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Ändrar egenskaperna för en befintlig `samling`.

#### Signatur

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Kontrollerar om en `samling` existerar.

#### Signatur

- `hasCollection(name: string): boolean`

### getCollection()

Hämtar en `samling`-instans.

#### Signatur

- `getCollection(name: string): ICollection`

### getCollections()

Hämtar alla `samling`-instanser.

#### Signatur

- `getCollections(): Array<ICollection>`

### getRepository()

Hämtar en `repository`-instans.

#### Signatur

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Synkroniserar `datakällan`. Logiken implementeras av underklasser.

#### Signatur

- `sync(): Promise<void>`