:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/data-source)をご参照ください。
:::

# ctx.dataSource

現在の RunJS 実行コンテキストにバインドされているデータソースインスタンス（`DataSource`）です。**現在のデータソース内**でのコレクションやフィールドのメタデータへのアクセス、およびコレクション設定の管理に使用されます。通常、現在のページやブロックで選択されているデータソース（例：メインデータベース `main`）に対応します。

## 適用シーン

| シーン | 説明 |
|------|------|
| **単一データソースの操作** | 現在のデータソースが既知である場合に、コレクションやフィールドのメタデータを取得します。 |
| **コレクション管理** | 現在のデータソース配下のコレクションを取得、追加、更新、削除します。 |
| **パスによるフィールド取得** | `collectionName.fieldPath` 形式を使用してフィールド定義を取得します（関連パスをサポート）。 |

> 注意：`ctx.dataSource` は現在のコンテキストにおける単一のデータソースを表します。他のデータソースを列挙またはアクセスする必要がある場合は、[ctx.dataSourceManager](./data-source-manager.md) を使用してください。

## 型定義

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // 読み取り専用プロパティ
  get flowEngine(): FlowEngine;   // 現在の FlowEngine インスタンス
  get displayName(): string;      // 表示名（i18n 対応）
  get key(): string;              // データソースのキー（例: 'main'）
  get name(): string;             // key と同じ

  // コレクションの読み取り
  getCollections(): Collection[];                      // すべてのコレクションを取得
  getCollection(name: string): Collection | undefined; // 名前でコレクションを取得
  getAssociation(associationName: string): CollectionField | undefined; // 関連フィールドを取得（例: users.roles）

  // コレクション管理
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // フィールドメタデータ
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## 主要なプロパティ

| プロパティ | 型 | 説明 |
|------|------|------|
| `key` | `string` | データソースのキー（例: `'main'`） |
| `name` | `string` | key と同じ |
| `displayName` | `string` | 表示名（i18n 対応） |
| `flowEngine` | `FlowEngine` | 現在の FlowEngine インスタンス |

## 主要なメソッド

| メソッド | 説明 |
|------|------|
| `getCollections()` | 現在のデータソース配下のすべてのコレクションを取得します（ソート済み、非表示はフィルタリング済み）。 |
| `getCollection(name)` | 名前でコレクションを取得します。`name` に `collectionName.fieldName` を指定して、関連先のターゲットコレクションを取得することも可能です。 |
| `getAssociation(associationName)` | `collectionName.fieldName` 形式で関連フィールドの定義を取得します。 |
| `getCollectionField(fieldPath)` | `collectionName.fieldPath` 形式でフィールド定義を取得します。`users.profile.avatar` のような関連パスをサポートしています。 |

## ctx.dataSourceManager との関係

| ニーズ | 推奨される使用法 |
|------|----------|
| **現在のコンテキストにバインドされた単一のデータソース** | `ctx.dataSource` |
| **すべてのデータソースへのエントリポイント** | `ctx.dataSourceManager` |
| **現在のデータソース内でコレクションを取得** | `ctx.dataSource.getCollection(name)` |
| **データソースをまたいでコレクションを取得** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **現在のデータソース内でフィールドを取得** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **データソースをまたいでフィールドを取得** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## 例

### コレクションおよびフィールドの取得

```ts
// すべてのコレクションを取得
const collections = ctx.dataSource.getCollections();

// 名前でコレクションを取得
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// 「コレクション名.フィールドパス」でフィールド定義を取得（関連をサポート）
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### 関連フィールドの取得

```ts
// collectionName.fieldName 形式で関連フィールドの定義を取得
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // ターゲットコレクションの構造に基づいて処理を行う
}
```

### コレクションをループして動的に処理する

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### フィールドのメタデータに基づいたバリデーションや動的 UI

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // interface、enum、validation などに基づいて UI やバリデーションを制御
}
```

## 注意事項

- `getCollectionField(fieldPath)` のパス形式は `collectionName.fieldPath` です。最初のセグメントがコレクション名で、それ以降がフィールドパス（`user.name` のような関連を含むパス）となります。
- `getCollection(name)` は `collectionName.fieldName` 形式をサポートしており、関連フィールドのターゲットコレクションを返します。
- RunJS コンテキストにおける `ctx.dataSource` は、通常現在のブロックまたはページのデータソースによって決定されます。コンテキストにデータソースがバインドされていない場合は `undefined` になる可能性があるため、使用前に null チェックを行うことをお勧めします。

## 関連情報

- [ctx.dataSourceManager](./data-source-manager.md)：すべてのデータソースを管理するデータソースマネージャー
- [ctx.collection](./collection.md)：現在のコンテキストに関連付けられたコレクション
- [ctx.collectionField](./collection-field.md)：現在のフィールドのコレクションフィールド定義