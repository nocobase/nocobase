# ICollectionManager

`ICollectionManager` 接口，用于管理数据源的 `Collection` 实例。

## API

### registerFieldTypes()

注册 `Collection` 中的字段类型。

#### 签名

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

注册 `Collection` 的 `Interface` 。

#### 签名

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

注册 `Collection Template`。

#### 签名

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

注册 `Model`。

#### 签名

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

注册 `Repository`。

#### 签名

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

获取已注册的仓库实例。

#### 签名

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

定义一个 `Collection`。

#### 签名

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

修改一个已存在的 `Collection` 属性。

#### 签名

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

判断 `Collection` 是否存在。

#### 签名


- `hasCollection(name: string): boolean`

### getCollection()

获取 `Collection` 实例。

#### 签名

- `getCollection(name: string): ICollection`

### getCollections()

获取所有的 `Collection` 实例。

#### 签名

- `getCollections(): Array<ICollection>`

### getRepository()

获取 `Repository` 实例。

#### 签名

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

同步数据源，逻辑由子类实现。

#### 签名

- `sync(): Promise<void>`


