:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/data-source-manager)をご参照ください。
:::

# ctx.dataSourceManager

データソースマネージャー（`DataSourceManager` インスタンス）は、複数のデータソース（メインデータベース `main`、ログデータベース `logging` など）を管理およびアクセスするために使用されます。複数のデータソースが存在する場合や、データソースを跨いでメタデータにアクセスする必要がある場合に使用します。

## 適用シーン

| シーン | 説明 |
|------|------|
| **多データソース** | すべてのデータソースを列挙する、またはキーを指定して特定のデータソースを取得する。 |
| **データソースを跨いだアクセス** | 現在のコンテキストのデータソースが不明な場合に、「データソースキー + コレクション名」の形式でメタデータにアクセスする。 |
| **フルパスによるフィールド取得** | `dataSourceKey.collectionName.fieldPath` 形式を使用して、異なるデータソース間のフィールド定義を取得する。 |

> 注意：現在のデータソースのみを操作する場合は、`ctx.dataSource` を優先的に使用してください。データソースを列挙したり切り替えたりする必要がある場合にのみ、`ctx.dataSourceManager` を使用します。

## 型定義

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // データソース管理
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // データソースの読み込み
  getDataSources(): DataSource[];                     // すべてのデータソースを取得
  getDataSource(key: string): DataSource | undefined;  // キーでデータソースを取得

  // データソース + コレクションによるメタデータへの直接アクセス
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## ctx.dataSource との関係

| 目的/ニーズ | 推奨される使い方 |
|------|----------|
| **現在のコンテキストに紐付く単一のデータソース** | `ctx.dataSource`（現在のページやブロックのデータソースなど） |
| **すべてのデータソースへのエントリポイント** | `ctx.dataSourceManager` |
| **データソースの列挙または切り替え** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **現在のデータソース内でのコレクション取得** | `ctx.dataSource.getCollection(name)` |
| **データソースを跨いだコレクション取得** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **現在のデータソース内でのフィールド取得** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **データソースを跨いだフィールド取得** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## 例文

### 指定したデータソースの取得

```ts
// 'main' という名前のデータソースを取得
const mainDS = ctx.dataSourceManager.getDataSource('main');

// そのデータソース配下のすべてのコレクションを取得
const collections = mainDS?.getCollections();
```

### データソースを跨いだコレクションメタデータへのアクセス

```ts
// dataSourceKey + collectionName でコレクションを取得
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// コレクションの主キーを取得
const primaryKey = users?.filterTargetKey ?? 'id';
```

### フルパスによるフィールド定義の取得

```ts
// 形式：dataSourceKey.collectionName.fieldPath
// 「データソースキー.コレクション名.フィールドパス」でフィールド定義を取得
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// 関連フィールドのパスにも対応
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### すべてのデータソースの反復処理

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`データソース: ${ds.key}, 表示名: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - コレクション: ${col.name}`);
  }
}
```

### 変数に基づいたデータソースの動的選択

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## 注意事項

- `getCollectionField` のパス形式は `dataSourceKey.collectionName.fieldPath` です。最初のセグメントがデータソースのキーであり、その後にコレクション名とフィールドパスが続きます。
- `getDataSource(key)` は、データソースが存在しない場合に `undefined` を返します。使用前に null チェックを行うことを推奨します。
- `addDataSource` はキーが既に存在する場合に例外をスローします。`upsertDataSource` は既存のものを上書きするか、新しく追加します。

## 関連情報

- [ctx.dataSource](./data-source.md)：現在のデータソースインスタンス
- [ctx.collection](./collection.md)：現在のコンテキストに関連付けられたコレクション
- [ctx.collectionField](./collection-field.md)：現在のフィールドのコレクションフィールド定義