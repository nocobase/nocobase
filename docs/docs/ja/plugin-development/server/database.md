:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# Database

`Database` は、データベースタイプのデータソース（`DataSource`）の重要な構成要素です。各データベースタイプのデータソースには、対応する `Database` インスタンスがあり、`dataSource.db` を介してアクセスできます。メインのデータソースのデータベースインスタンスは、便利な `app.db` というエイリアスも提供しています。`db` の一般的なメソッドに慣れておくことは、サーバーサイドのプラグインを作成する上で基本となります。

## Database の構成要素

一般的な `Database` は、以下の要素で構成されています。

- **コレクション**：データテーブルの構造を定義します。
- **モデル**：ORM のモデルに対応します（通常、Sequelize によって管理されます）。
- **リポジトリ**：データアクセスロジックをカプセル化するリポジトリ層で、より高度な操作メソッドを提供します。
- **フィールドタイプ**：フィールドの型です。
- **フィルター演算子**：フィルタリングに使用される演算子です。
- **イベント**：ライフサイクルイベントとデータベースイベントです。

## プラグインでの使用タイミング

### `beforeLoad` フェーズで推奨される処理

このフェーズではデータベース操作はできません。静的クラスの登録やイベントリスニングに適しています。

- `db.registerFieldTypes()` — カスタムフィールドタイプ  
- `db.registerModels()` — カスタムモデルクラスの登録  
- `db.registerRepositories()` — カスタムリポジトリクラスの登録  
- `db.registerOperators()` — カスタムフィルター演算子の登録  
- `db.on()` — データベース関連イベントのリスニング  

### `load` フェーズで推奨される処理

このフェーズでは、すべての先行するクラス定義とイベントがロード済みのため、データテーブルをロードしても欠落や漏れが発生することはありません。

- `db.defineCollection()` — 新しいデータテーブルの定義
- `db.extendCollection()` — 既存のデータテーブル設定の拡張

プラグインの組み込みテーブルを定義する場合は、`./src/server/collections` ディレクトリに配置することをお勧めします。詳細については、[コレクション](./collections.md) を参照してください。

## データ操作

`Database` は、データをアクセスおよび操作するための2つの主要な方法を提供します。

### リポジトリを介した操作

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

リポジトリ層は通常、ページネーション、フィルタリング、権限チェックなどのビジネスロジックをカプセル化するために使用されます。

### モデルを介した操作

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

モデル層は ORM エンティティに直接対応しており、より低レベルのデータベース操作の実行に適しています。

## どのフェーズでデータベース操作が可能ですか？

### プラグインのライフサイクル

| フェーズ | データベース操作が可能 |
|------|----------------|
| `staticImport` | 不可 |
| `afterAdd` | 不可 |
| `beforeLoad` | 不可 |
| `load` | 不可 |
| `install` | 可能 |
| `beforeEnable` | 可能 |
| `afterEnable` | 可能 |
| `beforeDisable` | 可能 |
| `afterDisable` | 可能 |
| `remove` | 可能 |
| `handleSyncMessage` | 可能 |

### アプリケーションイベント

| フェーズ | データベース操作が可能 |
|------|----------------|
| `beforeLoad` | 不可 |
| `afterLoad` | 不可 |
| `beforeStart` | 可能 |
| `afterStart` | 可能 |
| `beforeInstall` | 不可 |
| `afterInstall` | 可能 |
| `beforeStop` | 可能 |
| `afterStop` | 不可 |
| `beforeDestroy` | 可能 |
| `afterDestroy` | 不可 |
| `beforeLoadPlugin` | 不可 |
| `afterLoadPlugin` | 不可 |
| `beforeEnablePlugin` | 可能 |
| `afterEnablePlugin` | 可能 |
| `beforeDisablePlugin` | 可能 |
| `afterDisablePlugin` | 可能 |
| `afterUpgrade` | 可能 |

### Database イベント/フック

| フェーズ | データベース操作が可能 |
|------|----------------|
| `beforeSync` | 不可 |
| `afterSync` | 可能 |
| `beforeValidate` | 可能 |
| `afterValidate` | 可能 |
| `beforeCreate` | 可能 |
| `afterCreate` | 可能 |
| `beforeUpdate` | 可能 |
| `afterUpdate` | 可能 |
| `beforeSave` | 可能 |
| `afterSave` | 可能 |
| `beforeDestroy` | 可能 |
| `afterDestroy` | 可能 |
| `afterCreateWithAssociations` | 可能 |
| `afterUpdateWithAssociations` | 可能 |
| `afterSaveWithAssociations` | 可能 |
| `beforeDefineCollection` | 不可 |
| `afterDefineCollection` | 不可 |
| `beforeRemoveCollection` | 不可 |
| `afterRemoveCollection` | 不可 |