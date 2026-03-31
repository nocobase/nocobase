:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# ICollectionManager

La interfaz `ICollectionManager` se utiliza para gestionar las instancias de `colección` de una `fuente de datos`.

## API

### registerFieldTypes()

Registra los tipos de campo en una `colección`.

#### Firma

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Registra la `Interface` de una `colección`.

#### Firma

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Registra una `plantilla de colección`.

#### Firma

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Registra un `Modelo`.

#### Firma

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Registra un `Repositorio`.

#### Firma

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Obtiene una instancia de repositorio registrada.

#### Firma

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Define una `colección`.

#### Firma

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Modifica las propiedades de una `colección` existente.

#### Firma

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Comprueba si una `colección` existe.

#### Firma

- `hasCollection(name: string): boolean`

### getCollection()

Obtiene una instancia de `colección`.

#### Firma

- `getCollection(name: string): ICollection`

### getCollections()

Obtiene todas las instancias de `colección`.

#### Firma

- `getCollections(): Array<ICollection>`

### getRepository()

Obtiene una instancia de `Repositorio`.

#### Firma

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Sincroniza la `fuente de datos`. La lógica la implementan las subclases.

#### Firma

- `sync(): Promise<void>`