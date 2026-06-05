:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# JSアクション

## 概要

JSアクションは、ボタンクリック時にJavaScriptを実行し、任意のビジネスロジックをカスタマイズするために使用します。フォームのツールバー、テーブルのツールバー（コレクションレベル）、テーブルの行（レコードレベル）など、さまざまな場所で利用でき、検証、通知の表示、API呼び出し、ポップアップ/ドロワーの開閉、データの更新といった操作を実現します。

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## ランタイムコンテキストAPI（よく使われるもの）

- `ctx.api.request(options)`: HTTPリクエストを送信します。
- `ctx.openView(viewUid, options)`: 設定済みのビュー（ドロワー/ダイアログ/ページ）を開きます。
- `ctx.message` / `ctx.notification`: グローバルなメッセージと通知。
- `ctx.t()` / `ctx.i18n.t()`: 国際化。
- `ctx.resource`: コレクションレベルのコンテキストにおけるデータリソース（例：テーブルのツールバー。`getSelectedRows()`、`refresh()` などを含みます）。
- `ctx.record`: レコードレベルのコンテキストにおける現在の行レコード（例：テーブルの行ボタン）。
- `ctx.form`: フォームレベルのコンテキストにおけるAntD Formインスタンス（例：フォームのツールバーボタン）。
- `ctx.collection`: 現在のコレクションのメタ情報。
- コードエディターは`Snippets`（スニペット）と`Run`（プレ実行）をサポートしています（下記参照）。

- `ctx.requireAsync(url)`: URLを指定してAMD/UMDライブラリを非同期でロードします。
- `ctx.importAsync(url)`: URLを指定してESMモジュールを動的にインポートします。

> 実際に利用可能な変数は、ボタンの配置場所によって異なります。上記は一般的な機能の概要です。

## エディターとスニペット

- `Snippets`: 組み込みのコードスニペットリストを開き、検索して、現在のカーソル位置にワンクリックで挿入できます。
- `Run`: 現在のコードを直接実行し、実行ログを下部の`Logs`パネルに出力します。`console.log/info/warn/error`をサポートし、エラーのハイライト表示と位置特定が可能です。

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- AI従業員と連携してスクリプトを生成・修正できます：[AI従業員・Nathan：フロントエンドエンジニア](/ai-employees/built-in/ai-coding)

## 一般的な使い方（簡略化された例）

### 1) APIリクエストと通知

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) コレクションボタン：選択の検証と処理

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

### 5) 送信後のデータ更新

```js
// 一般的な更新：テーブル/リストリソースを優先し、次にフォームを含むブロックのリソースを更新します。
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```

## 注意事項

- **アクションの冪等性**: 繰り返しクリックによる複数回の送信を防ぐため、ロジックに状態フラグを追加するか、ボタンを無効にすることができます。
- **エラー処理**: API呼び出しにはtry/catchブロックを追加し、ユーザーに分かりやすいフィードバックを提供してください。
- **ビュー連携**: `ctx.openView`でポップアップ/ドロワーを開く際は、明示的にパラメータを渡すことをお勧めします。必要に応じて、送信成功後に親リソースを積極的に更新してください。

## 関連ドキュメント

- [変数とコンテキスト](/interface-builder/variables)
- [連携ルール](/interface-builder/linkage-rule)
- [ビューとポップアップ](/interface-builder/actions/types/view)