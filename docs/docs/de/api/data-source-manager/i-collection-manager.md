:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# ICollectionManager

Das `ICollectionManager` Interface dient zur Verwaltung von `Sammlung`-Instanzen einer `Datenquelle`.

## API

### registerFieldTypes()

Registriert Feldtypen in einer `Sammlung`.

#### Signatur

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Registriert das `Interface` einer `Sammlung`.

#### Signatur

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Registriert ein `Sammlung Template`.

#### Signatur

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Registriert ein `Model`.

#### Signatur

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Registriert ein `Repository`.

#### Signatur

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Ruft eine registrierte Repository-Instanz ab.

#### Signatur

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Definiert eine `Sammlung`.

#### Signatur

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Erweitert die Eigenschaften einer bestehenden `Sammlung`.

#### Signatur

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Prüft, ob eine `Sammlung` existiert.

#### Signatur

- `hasCollection(name: string): boolean`

### getCollection()

Ruft eine `Sammlung`-Instanz ab.

#### Signatur

- `getCollection(name: string): ICollection`

### getCollections()

Ruft alle `Sammlung`-Instanzen ab.

#### Signatur

- `getCollections(): Array<ICollection>`

### getRepository()

Ruft eine `Repository`-Instanz ab.

#### Signatur

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Synchronisiert die `Datenquelle`. Die Logik wird von Unterklassen implementiert.

#### Signatur

- `sync(): Promise<void>`