:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# DataSource (抽象)

`DataSource` は、データベースやAPIなど、様々な種類のデータソースを表すための抽象クラスです。

## メンバー

### collectionManager

データソースのコレクションマネージャーインスタンスです。[`ICollectionManager`](/api/data-source-manager/i-collection-manager) インターフェースを実装している必要があります。

### resourceManager

データソースのresourceManagerインスタンスです。

### acl

データソースのACLインスタンスです。

## API

### constructor()

コンストラクターです。`DataSource` インスタンスを作成します。

#### シグネチャ

- `constructor(options: DataSourceOptions)`

### init()

初期化関数です。`constructor` の直後に呼び出されます。

#### シグネチャ

- `init(options: DataSourceOptions)`

### name

#### シグネチャ

- `get name()`

データソースのインスタンス名を返します。

### middleware()

DataSource のミドルウェアを取得します。これは、サーバーにマウントしてリクエストを受け取るために使用されます。

### testConnection()

静的メソッドです。接続テスト操作時に呼び出され、パラメーターの検証に使用できます。具体的なロジックはサブクラスによって実装されます。

#### シグネチャ

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### シグネチャ

- `async load(options: any = {})`

データソースのロード操作です。ロジックはサブクラスによって実装されます。

### createCollectionManager()

#### シグネチャ
- `abstract createCollectionManager(options?: any): ICollectionManager`

データソースのコレクションマネージャーインスタンスを作成します。ロジックはサブクラスによって実装されます。

### createResourceManager()

データソースのResourceManagerインスタンスを作成します。サブクラスで実装をオーバーライドできます。デフォルトでは、`@nocobase/resourcer` の `ResourceManager` が作成されます。

### createACL()

- DataSource のACLインスタンスを作成します。サブクラスで実装をオーバーライドできます。デフォルトでは、`@nocobase/acl` の `ACL` が作成されます。