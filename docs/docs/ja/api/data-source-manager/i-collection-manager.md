:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ICollectionManager

`ICollectionManager` インターフェースは、データソースの`コレクション` インスタンスを管理するために使用されます。

## API

### registerFieldTypes()

`コレクション` 内のフィールドタイプを登録します。

#### シグネチャ

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

`コレクション` の`インターフェース` を登録します。

#### シグネチャ

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

`コレクションテンプレート` を登録します。

#### シグネチャ

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

`モデル` を登録します。

#### シグネチャ

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

`リポジトリ` を登録します。

#### シグネチャ

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

登録済みの`リポジトリ` インスタンスを取得します。

#### シグネチャ

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

`コレクション` を定義します。

#### シグネチャ

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

既存の`コレクション` のプロパティを変更します。

#### シグネチャ

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

`コレクション` が存在するかどうかを確認します。

#### シグネチャ

- `hasCollection(name: string): boolean`

### getCollection()

`コレクション` インスタンスを取得します。

#### シグネチャ

- `getCollection(name: string): ICollection`

### getCollections()

すべての`コレクション` インスタンスを取得します。

#### シグネチャ

- `getCollections(): Array<ICollection>`

### getRepository()

`リポジトリ` インスタンスを取得します。

#### シグネチャ

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

データソースを同期します。ロジックはサブクラスによって実装されます。

#### シグネチャ

- `sync(): Promise<void>`