:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/interface-builder/actions/types/js-action)をご参照ください。
:::

# JS Action

## はじめに

JS Actionは、ボタンクリック時にJavaScriptを実行し、任意のビジネスアクションをカスタマイズするために使用します。フォームツールバー、テーブルツールバー（コレクションレベル）、テーブル行（レコードレベル）などの場所で使用でき、バリデーション、通知、インターフェース呼び出し、ポップアップ/ドロワーの表示、データの更新などの操作を実現します。

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## ランタイムコンテキスト API（よく使われるもの）

- `ctx.api.request(options)`：HTTPリクエストを発行します。
- `ctx.openView(viewUid, options)`：設定済みのビュー（ドロワー/ダイアログ/ページ）を開きます。
- `ctx.message` / `ctx.notification`：グローバルな通知とメッセージ。
- `ctx.t()` / `ctx.i18n.t()`：国際化。
- `ctx.resource`：コレクションレベルのコンテキストのデータリソース（テーブルツールバーなど、`getSelectedRows()`、`refresh()` などを含みます）。
- `ctx.record`：レコードレベルのコンテキストの現在の行レコード（テーブル行ボタンなど）。
- `ctx.form`：フォームレベルのコンテキストの AntD Form インスタンス（フォームツールバーボタンなど）。
- `ctx.collection`：現在のコレクションのメタ情報。
- コードエディタは `Snippets` スニペットと `Run` 実行（後述）をサポートしています。


- `ctx.requireAsync(url)`：URLからAMD/UMDライブラリを非同期でロードします。
- `ctx.importAsync(url)`：URLからESMモジュールを動的にインポートします。
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`：組み込みの React / ReactDOM / Ant Design / Ant Design アイコン / dayjs / lodash / math.js / formula.js などの共通ライブラリ。JSXのレンダリング、時間処理、データ操作、数学演算に使用されます。

> 実際の利用可能な変数はボタンの配置場所によって異なります。上記は一般的な機能の概要です。

## エディタとスニペット

- `Snippets`：組み込みのコードスニペットリストを開き、検索して現在のカーソル位置にワンクリックで挿入できます。
- `Run`：現在のコードを直接実行し、実行ログを下部の `Logs` パネルに出力します。`console.log/info/warn/error` とエラーのハイライト表示をサポートしています。

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- AI従業員と連携してスクリプトを生成/修正できます：[AI従業員 · Nathan：フロントエンドエンジニア](/ai-employees/features/built-in-employee)

## 一般的な使い方（簡略化された例）

### 1) インターフェースリクエストと通知

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) コレクションボタン：選択のバリデーションと処理

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: ビジネスロジックを実行…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) レコードボタン：現在の行レコードの読み取り

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) ビューを開く（ドロワー/ダイアログ）

```js
const popupUid = ctx.model.uid + '-open'; // 現在のボタンにバインドし、安定性を保ちます
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) 送信後にデータを更新

```js
// 一般的な更新：テーブル/リストリソースを優先し、次にフォームを含むブロックのリソースを更新します
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## 注意事項

- べき等性：繰り返しクリックによる複数回の送信を避けるため、ロジックに状態フラグを追加するか、ボタンを無効にしてください。
- エラー処理：インターフェース呼び出しに try/catch を追加し、ユーザーに通知を提供してください。
- ビュー連携：`ctx.openView` でポップアップ/ドロワーを開く際は、明示的にパラメータを渡すことを推奨します。必要に応じて、送信成功後に親リソースをアクティブに更新してください。

## 関連ドキュメント

- [変数とコンテキスト](/interface-builder/variables)
- [連動ルール](/interface-builder/linkage-rule)
- [ビューとポップアップ](/interface-builder/actions/types/view)