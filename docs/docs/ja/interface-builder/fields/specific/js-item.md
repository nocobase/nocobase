:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# JS Item

## 概要

JS Item は、フォーム内で「カスタム項目」（フィールドにバインドされていない項目）として利用できます。JavaScript/JSX を使って、ヒント、統計、プレビュー、ボタンなど、あらゆるコンテンツをレンダリングし、フォームやレコードのコンテキストと連携させることが可能です。リアルタイムプレビュー、説明表示、小さなインタラクティブコンポーネントといったシナリオに最適です。

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## ランタイムコンテキスト API（よく使うもの）

- `ctx.element`: 現在の項目のDOMコンテナ（ElementProxy）です。`innerHTML`、`querySelector`、`addEventListener` などに対応しています。
- `ctx.form`: AntD Formのインスタンスです。`getFieldValue / getFieldsValue / setFieldsValue / validateFields` などの操作が可能です。
- `ctx.blockModel`: 所属するフォームブロックのモデルです。`formValuesChange` をリッスンして連携を実装できます。
- `ctx.record` / `ctx.collection`: 現在のレコードとコレクションのメタ情報です（一部のシナリオで利用可能）。
- `ctx.requireAsync(url)`: URLを指定してAMD/UMDライブラリを非同期でロードします。
- `ctx.importAsync(url)`: URLを指定してESMモジュールを動的にインポートします。
- `ctx.openView(viewUid, options)`: 設定済みのビュー（ドロワー/ダイアログ/ページ）を開きます。
- `ctx.message` / `ctx.notification`: グローバルなメッセージと通知機能です。
- `ctx.t()` / `ctx.i18n.t()`: 国際化機能です。
- `ctx.onRefReady(ctx.ref, cb)`: コンテナの準備ができてからレンダリングします。
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: JSXレンダリングや時間処理に利用できる、React、ReactDOM、Ant Design、Ant Designアイコン、dayjsなどの汎用ライブラリが組み込まれています。（`ctx.React` / `ctx.ReactDOM` / `ctx.antd` は互換性のために引き続き利用可能です。）
- `ctx.render(vnode)`: React要素/HTML/DOMをデフォルトのコンテナ `ctx.element` にレンダリングします。複数回レンダリングする場合、Rootは再利用され、コンテナの既存コンテンツは上書きされます。

## エディターとスニペット

- `Snippets`: 組み込みのコードスニペットリストを開き、検索して現在のカーソル位置にワンクリックで挿入できます。
- `Run`: 現在のコードを直接実行し、実行ログを下部の `Logs` パネルに出力します。`console.log/info/warn/error` に対応しており、エラーのハイライト表示と位置特定が可能です。

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- AI従業員と連携してスクリプトを生成・修正することも可能です：[AI従業員・Nathan：フロントエンドエンジニア](/ai-employees/built-in/ai-coding)

## よくある使い方（簡易例）

### 1) リアルタイムプレビュー（フォーム値の読み取り）

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) ビュー（ドロワー）を開く

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) 外部ライブラリのロードとレンダリング

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## 注意事項

- 外部ライブラリのロードには信頼できるCDNの利用をお勧めします。失敗するシナリオに備え、フォールバック処理（例: `if (!lib) return;`）を実装してください。
- セレクターは `class` または `[name=...]` を優先し、固定 `id` の使用は避けることをお勧めします。これにより、複数のブロックやポップアップでの `id` の重複を防ぐことができます。
- イベントのクリーンアップ: フォームの値が頻繁に変更されると、複数回のレンダリングがトリガーされます。イベントをバインドする前に、クリーンアップまたは重複排除を行う必要があります（例: `remove` してから `add` する、`{ once: true }` を使用する、または `dataset` 属性で重複防止のマークを付けるなど）。

## 関連ドキュメント

- [変数とコンテキスト](/interface-builder/variables)
- [連携ルール](/interface-builder/linkage-rule)
- [ビューとポップアップ](/interface-builder/actions/types/view)