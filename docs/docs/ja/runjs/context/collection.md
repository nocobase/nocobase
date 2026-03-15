:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/collection)をご参照ください。
:::

# ctx.collection

現在の RunJS 実行コンテキストに関連付けられたコレクション（Collection）インスタンスです。コレクションのメタデータ、フィールド定義、主キーなどの設定にアクセスするために使用されます。通常、`ctx.blockModel.collection` または `ctx.collectionField?.collection` から取得されます。

## 适用シーン

| シーン | 説明 |
|------|------|
| **JSBlock** | ブロックにバインドされたコレクション。`name`、`getFields`、`filterTargetKey` などにアクセス可能です。 |
| **JSField / JSItem / JSColumn** | 現在のフィールドが属するコレクション（または親ブロックのコレクション）。フィールドリストや主キーなどの取得に使用されます。 |
| **テーブル列 / 詳細ブロック** | コレクション構造に基づいたレンダリングや、ポップアップを開く際の `filterByTk` の受け渡しなどに使用されます。 |

> 注意：`ctx.collection` は、データブロック、フォームブロック、テーブルブロックなど、コレクションがバインドされているシーンで利用可能です。コレクションがバインドされていない独立した JSBlock では `null` になる可能性があるため、使用前に空値チェックを行うことを推奨します。

## 型定義

```ts
collection: Collection | null | undefined;
```

## 常用プロパティ

| プロパティ | 型 | 説明 |
|------|------|------|
| `name` | `string` | コレクション名（例：`users`、`orders`） |
| `title` | `string` | コレクションのタイトル（国際化対応を含む） |
| `filterTargetKey` | `string \| string[]` | 主キーのフィールド名。`filterByTk` や `getFilterByTK` で使用されます。 |
| `dataSourceKey` | `string` | データソースのキー（例：`main`） |
| `dataSource` | `DataSource` | 所属するデータソースのインスタンス |
| `template` | `string` | コレクションテンプレート（例：`general`、`file`、`tree`） |
| `titleableFields` | `CollectionField[]` | タイトルとして表示可能なフィールドのリスト |
| `titleCollectionField` | `CollectionField` | タイトルフィールドのインスタンス |

## 常用メソッド

| メソッド | 説明 |
|------|------|
| `getFields(): CollectionField[]` | すべてのフィールドを取得します（継承されたものを含む） |
| `getField(name: string): CollectionField \| undefined` | フィールド名で単一のフィールドを取得します |
| `getFieldByPath(path: string): CollectionField \| undefined` | パスでフィールドを取得します（`user.name` のような関連フィールドもサポート） |
| `getAssociationFields(types?): CollectionField[]` | 関連フィールドを取得します。`types` には `['one']` や `['many']` などを指定できます。 |
| `getFilterByTK(record): any` | レコードから主キーの値を抽出します。API の `filterByTk` で使用されます。 |

## ctx.collectionField、ctx.blockModel との関係

| ニーズ | 推奨される使い方 |
|------|----------|
| **現在のコンテキストに関連付けられたコレクション** | `ctx.collection`（`ctx.blockModel?.collection` または `ctx.collectionField?.collection` と等価） |
| **現在のフィールドのコレクション定義** | `ctx.collectionField?.collection`（フィールドが属するコレクション） |
| **関連先のコレクション** | `ctx.collectionField?.targetCollection`（関連フィールドのターゲットコレクション） |

子テーブルなどのシーンでは、`ctx.collection` は関連先のコレクションを指す場合があります。通常のフォームやテーブルでは、一般的にブロックにバインドされたコレクションを指します。

## 示例

### 主キーを取得してポップアップを開く

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### フィールドをループしてバリデーションや連動を行う

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} は必須です`);
    return;
  }
}
```

### 関連フィールドを取得する

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// 子テーブルや関連リソースの構築などに使用
```

## 注意事項

- `filterTargetKey` はコレクションの主キーフィールド名です。一部のコレクションでは `string[]` 型の複合主キーになる場合があります。設定されていない場合は、一般的に `'id'` がフォールバックとして使用されます。
- 子テーブルや関連フィールドなどのシーンでは、`ctx.collection` は関連先のコレクションを指すことがあり、`ctx.blockModel.collection` とは異なる場合があります。
- `getFields()` は継承されたコレクションのフィールドをマージします。自身のフィールドは、同名の継承フィールドを上書きします。

## 関連情報

- [ctx.collectionField](./collection-field.md)：現在のフィールドのコレクションフィールド定義
- [ctx.blockModel](./block-model.md)：現在の JS を保持する親ブロック（`collection` を含む）
- [ctx.model](./model.md)：現在のモデル（`collection` を含む場合がある）