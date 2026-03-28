:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/get-var)をご参照ください。
:::

# ctx.getVar()

現在の実行コンテキストから変数の値を**非同期**で読み取ります。変数のソースは SQL やテンプレート内の `{{ctx.xxx}}` の解析ルールと一致しており、通常は現在のユーザー、現在のレコード、ビューのパラメータ、ポップアップのコンテキストなどから取得されます。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSブロック / JSフィールド** | 現在のレコード、ユーザー、リソースなどの情報を取得し、レンダリングやロジックの判定に使用します。 |
| **連携ルール / イベントフロー** | `ctx.record` や `ctx.formValues` などを読み取り、条件判断を行います。 |
| **数式 / テンプレート** | `{{ctx.xxx}}` と同じ変数解析ルールを使用します。 |

## 型定義

```ts
getVar(path: string): Promise<any>;
```

| パラメータ | 型 | 説明 |
|------|------|------|
| `path` | `string` | 変数のパス。**必ず `ctx.` で始まる必要があります**。ドット記法や配列のインデックス指定をサポートしています。 |

**戻り値**: `Promise<any>`。解析後の値を取得するには `await` を使用する必要があります。変数が存在しない場合は `undefined` を返します。

> `ctx.` で始まらないパスを渡すと、エラーがスローされます：`ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`。

## よく使われる変数のパス

| パス | 説明 |
|------|------|
| `ctx.record` | 現在のレコード（フォームや詳細ブロックがレコードに紐付いている場合に使用可能） |
| `ctx.record.id` | 現在のレコードの主キー |
| `ctx.formValues` | 現在のフォームの値（連携ルールやイベントフローでよく使われます。フォームのコンテキストでは、リアルタイムな読み取りのために `ctx.form.getFieldsValue()` を優先して使用してください） |
| `ctx.user` | 現在のログインユーザー |
| `ctx.user.id` | 現在のユーザー ID |
| `ctx.user.nickname` | 現在のユーザーのニックネーム |
| `ctx.user.roles.name` | 現在のユーザーのロール名（配列） |
| `ctx.popup.record` | ポップアップ内のレコード |
| `ctx.popup.record.id` | ポップアップ内のレコードの主キー |
| `ctx.urlSearchParams` | URL クエリパラメータ（`?key=value` から解析されたもの） |
| `ctx.token` | 現在の API トークン |
| `ctx.role` | 現在のロール |

## ctx.getVarInfos()

現在のコンテキストで解析可能な変数の**構造情報**（型、タイトル、子プロパティなど）を取得し、利用可能なパスを確認しやすくします。戻り値は `meta` に基づく静的な記述であり、実際の実行時の値は含まれません。

### 型定義

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

戻り値の各キーは変数のパスであり、値はそのパスに対応する構造情報（`type`、`title`、`properties` などを含む）です。

### パラメータ

| パラメータ | 型 | 説明 |
|------|------|------|
| `path` | `string \| string[]` | 抽出パス。指定したパス配下の変数構造のみを収集します。`'record'`、`'record.id'`、`'ctx.record'`、`'{{ ctx.record }}'` をサポートしています。配列を指定した場合は複数のパスが統合されます。 |
| `maxDepth` | `number` | 最大展開階層。デフォルトは `3` です。path を渡さない場合、トップレベルの属性の depth は 1 となります。path を渡した場合、そのパスに対応するノードの depth が 1 となります。 |

### 実行例

```ts
// record 配下の変数構造を取得（最大 3 階層まで展開）
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// popup.record の構造を取得
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// すべてのトップレベル変数の構造を取得（デフォルト maxDepth=3）
const vars = await ctx.getVarInfos();
```

## ctx.getValue との違い

| メソッド | 適用シーン | 説明 |
|------|----------|------|
| `ctx.getValue()` | JSフィールド、JSアイテムなどの編集可能なフィールド | **現在のフィールド**の値を同期的に取得します。フォームへのバインドが必要です。 |
| `ctx.getVar(path)` | 任意の RunJS コンテキスト | **任意の ctx 変数**を非同期で取得します。パスは `ctx.` で始まる必要があります。 |

JSフィールド内で自身のフィールドを読み書きする場合は `getValue`/`setValue` を使用し、他のコンテキスト変数（record、user、formValues など）にアクセスする場合は `getVar` を使用します。

## 注意事項

- **パスは必ず `ctx.` で始まる必要があります**: `ctx.record.id` のように指定してください。そうでない場合はエラーがスローされます。
- **非同期メソッド**: 結果を取得するには必ず `await` を使用してください。例: `const id = await ctx.getVar('ctx.record.id')`。
- **変数が存在しない場合**: `undefined` を返します。結果に対して `??` を使用してデフォルト値を設定できます: `(await ctx.getVar('ctx.user.nickname')) ?? 'ゲスト'`。
- **フォームの値**: `ctx.formValues` は `await ctx.getVar('ctx.formValues')` を通じて取得する必要があります。`ctx.formValues` として直接公開されているわけではありません。フォームのコンテキストでは、最新の値をリアルタイムで読み取るために `ctx.form.getFieldsValue()` を優先的に使用してください。

## 実行例

### 現在のレコード ID を取得する

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`現在のレコード：${recordId}`);
}
```

### ポップアップ内のレコードを取得する

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`現在のポップアップレコード：${recordId}`);
}
```

### 配列フィールドのサブアイテムを読み取る

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// ロール名の配列を返します。例: ['admin', 'member']
```

### デフォルト値を設定する

```ts
// getVar には defaultValue パラメータがないため、結果の後に ?? を使用します
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'ゲスト';
```

### フォームのフィールド値を読み取る

```ts
// ctx.formValues と ctx.form はどちらもフォームシーンで使用されます。getVar を使用してネストされたフィールドを読み取れます
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### URL クエリパラメータを読み取る

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // ?id=xxx に対応
```

### 利用可能な変数を探索する

```ts
// record 配下の変数構造を取得（最大 3 階層まで展開）
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars の形式: { 'record.id': { type: 'string', title: 'id' }, ... }
```

## 関連情報

- [ctx.getValue()](./get-value.md) - 現在のフィールド値を同期的に取得（JSフィールド/JSアイテムなど限定）
- [ctx.form](./form.md) - フォームインスタンス。`ctx.form.getFieldsValue()` でフォームの値をリアルタイムに読み取り可能
- [ctx.model](./model.md) - 現在の実行コンテキストが属するモデル
- [ctx.blockModel](./block-model.md) - 現在の JS が配置されている親ブロック
- [ctx.resource](./resource.md) - 現在のコンテキストにおけるリソースインスタンス
- SQL / テンプレート内の `{{ctx.xxx}}` - `ctx.getVar('ctx.xxx')` と同じ解析ルールを使用します