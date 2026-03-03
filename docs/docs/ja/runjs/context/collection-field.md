:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/collection-field)をご参照ください。
:::

# ctx.collectionField

現在の RunJS 実行コンテキストに関連付けられたデータ表フィールド（CollectionField）のインスタンスです。フィールドのメタデータ、タイプ、バリデーションルール、および関連情報にアクセスするために使用されます。フィールドがデータ表の定義にバインドされている場合にのみ存在し、カスタムフィールドや仮想フィールドの場合は `null` になる可能性があります。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSField** | フォームフィールドにおいて `interface`、`enum`、`targetCollection` などに基づいた連動やバリデーションを行います。 |
| **JSItem** | サブテーブルの項目内で、現在の列に対応するフィールドのメタデータにアクセスします。 |
| **JSColumn** | テーブルの列において `collectionField.interface` に応じたレンダリング方式の選択や、`targetCollection` へのアクセスを行います。 |

> 注意：`ctx.collectionField` は、フィールドがデータ表（Collection）の定義にバインドされている場合にのみ利用可能です。JSBlock（独立したブロック）やフィールドバインドのないアクションイベントなどのシーンでは、通常 `undefined` となるため、使用前に空値チェックを行うことを推奨します。

## 型定義

```ts
collectionField: CollectionField | null | undefined;
```

## 主要なプロパティ

| プロパティ | 型 | 説明 |
|------|------|------|
| `name` | `string` | フィールド名（例: `status`、`userId`） |
| `title` | `string` | フィールドのタイトル（国際化対応を含む） |
| `type` | `string` | フィールドのデータ型（`string`、`integer`、`belongsTo` など） |
| `interface` | `string` | フィールドのインターフェース型（`input`、`select`、`m2o`、`o2m`、`m2m` など） |
| `collection` | `Collection` | フィールドが属するコレクション |
| `targetCollection` | `Collection` | 関連フィールドのターゲットコレクション（関連タイプの場合のみ値を持つ） |
| `target` | `string` | ターゲットコレクション名（関連フィールド） |
| `enum` | `array` | 列挙型の選択肢（select、radio など） |
| `defaultValue` | `any` | デフォルト値 |
| `collectionName` | `string` | 所属するコレクション名 |
| `foreignKey` | `string` | 外部キーフィールド名（belongsTo など） |
| `sourceKey` | `string` | 関連ソースキー（hasMany など） |
| `targetKey` | `string` | 関連ターゲットキー |
| `fullpath` | `string` | 完全パス（例: `main.users.status`）。API や変数参照に使用 |
| `resourceName` | `string` | リソース名（例: `users.status`） |
| `readonly` | `boolean` | 読み取り専用かどうか |
| `titleable` | `boolean` | タイトルとして表示可能かどうか |
| `validation` | `object` | バリデーションルールの設定 |
| `uiSchema` | `object` | UI 設定 |
| `targetCollectionTitleField` | `CollectionField` | ターゲットコレクションのタイトルフィールド（関連フィールド） |

## 主要なメソッド

| メソッド | 説明 |
|------|------|
| `isAssociationField(): boolean` | 関連フィールド（belongsTo、hasMany、hasOne、belongsToMany など）かどうかを判定します。 |
| `isRelationshipField(): boolean` | リレーションシップ型フィールド（o2o、m2o、o2m、m2m などを含む）かどうかを判定します。 |
| `getComponentProps(): object` | フィールドコンポーネントのデフォルト props を取得します。 |
| `getFields(): CollectionField[]` | ターゲットコレクションのフィールドリストを取得します（関連フィールドのみ）。 |
| `getFilterOperators(): object[]` | このフィールドがサポートするフィルター演算子（`$eq`、`$ne` など）を取得します。 |

## 例

### フィールドタイプに応じた条件付きレンダリング

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // 関連フィールド：関連レコードを表示
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### 関連フィールドかどうかの判定とターゲットコレクションへのアクセス

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // ターゲットコレクションの構造に従って処理
}
```

### 列挙型の選択肢の取得

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### 読み取り専用/表示モードに応じた条件付きレンダリング

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### ターゲットコレクションのタイトルフィールドの取得

```ts
// 関連フィールドを表示する際、ターゲットコレクションの titleCollectionField を使用してタイトルフィールド名を取得できます
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## ctx.collection との関係

| 目的 | 推奨される使用法 |
|------|----------|
| **現在のフィールドが属するコレクション** | `ctx.collectionField?.collection` または `ctx.collection` |
| **フィールドのメタデータ（名前、タイプ、インターフェース、列挙型など）** | `ctx.collectionField` |
| **関連先のターゲットコレクション** | `ctx.collectionField?.targetCollection` |

`ctx.collection` は通常、現在のブロックにバインドされているコレクションを表します。`ctx.collectionField` は、データ表内での現在のフィールドの定義を表します。サブテーブルや関連フィールドなどのシーンでは、両者が異なる場合があります。

## 注意事項

- **JSBlock** や **JSAction（フィールドバインドなし）** などのシーンでは、`ctx.collectionField` は通常 `undefined` です。アクセス前にオプショナルチェイニングを使用することを推奨します。
- カスタム JS フィールドがデータ表フィールドにバインドされていない場合、`ctx.collectionField` は `null` になる可能性があります。
- `targetCollection` は関連タイプのフィールド（m2o、o2m、m2m など）にのみ存在します。`enum` は select や radioGroup などの選択肢を持つフィールドにのみ存在します。

## 関連情報

- [ctx.collection](./collection.md)：現在のコンテキストに関連付けられたコレクション
- [ctx.model](./model.md)：現在の実行コンテキストが属するモデル
- [ctx.blockModel](./block-model.md)：現在の JS を保持する親ブロック
- [ctx.getValue()](./get-value.md)、[ctx.setValue()](./set-value.md)：現在のフィールド値の読み書き