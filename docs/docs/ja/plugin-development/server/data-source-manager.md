:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# DataSourceManager データソース管理

NocoBase は、複数のデータソースを管理するための `DataSourceManager` を提供しています。各 `DataSource` は、それぞれ独自の `Database`、`ResourceManager`、`ACL` インスタンスを持っており、開発者が複数のデータソースを柔軟に管理・拡張できるようになっています。

## 基本概念

各 `DataSource` インスタンスには、以下のものが含まれています。

- **`dataSource.collectionManager`**: コレクション（データテーブル）とフィールドの管理に使用されます。
- **`dataSource.resourceManager`**: リソース関連の操作（作成、読み取り、更新、削除など）を処理します。
- **`dataSource.acl`**: リソース操作のアクセス制御（ACL）です。

簡単にアクセスできるように、メインのデータソースに関連するメンバーのショートカットエイリアスが提供されています。

- `app.db` は `dataSourceManager.get('main').collectionManager.db` と同等です。
- `app.acl` は `dataSourceManager.get('main').acl` と同等です。
- `app.resourceManager` は `dataSourceManager.get('main').resourceManager` と同等です。

## よく使うメソッド

### dataSourceManager.get(dataSourceKey)

このメソッドは、指定された `DataSource` インスタンスを返します。

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

すべてのデータソースにミドルウェアを登録します。これは、すべてのデータソースの操作に影響を与えます。

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

データソースがロードされる前に実行されます。モデルクラスやフィールドタイプの登録など、静的クラスの登録によく使用されます。

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // カスタムフィールドタイプ
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

データソースがロードされた後に実行されます。操作の登録やアクセス制御の設定などによく使用されます。

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // アクセス権限を設定
});
```

## データソースの拡張

データソースの完全な拡張については、データソースの拡張の章を参照してください。