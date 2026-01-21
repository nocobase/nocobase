:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# ICollectionManager

A interface `ICollectionManager` é usada para gerenciar instâncias de `coleção` de uma `fonte de dados`.

## API

### registerFieldTypes()

Registra os tipos de campo em uma `coleção`.

#### Assinatura

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Registra a `Interface` de uma `coleção`.

#### Assinatura

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Registra um `Collection Template`.

#### Assinatura

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Registra um `Model`.

#### Assinatura

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Registra um `Repository`.

#### Assinatura

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Obtém uma instância de `Repository` registrada.

#### Assinatura

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Define uma `coleção`.

#### Assinatura

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Modifica as propriedades de uma `coleção` existente.

#### Assinatura

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Verifica se uma `coleção` existe.

#### Assinatura

- `hasCollection(name: string): boolean`

### getCollection()

Obtém uma instância de `coleção`.

#### Assinatura

- `getCollection(name: string): ICollection`

### getCollections()

Obtém todas as instâncias de `coleção`.

#### Assinatura

- `getCollections(): Array<ICollection>`

### getRepository()

Obtém uma instância de `Repository`.

#### Assinatura

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Sincroniza a `fonte de dados`. A lógica é implementada pelas subclasses.

#### Assinatura

- `sync(): Promise<void>`