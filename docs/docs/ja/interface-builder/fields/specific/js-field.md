:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# JS フィールド

## はじめに

JS フィールドは、フィールドの位置でJavaScriptを使ってコンテンツをカスタマイズして表示するために利用されます。これは、詳細ブロック、フォームの読み取り専用項目、またはテーブル列の「その他のカスタム項目」などでよく使われます。パーソナライズされた表示、派生情報の組み合わせ、ステータスバッジ、リッチテキスト、グラフなどのレンダリングに適しています。

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## タイプ

- 読み取り専用タイプ：編集できない表示に利用され、`ctx.value` を読み取って出力がレンダリングされます。
- 編集可能タイプ：カスタム入力インタラクションに利用され、`ctx.getValue()`/`ctx.setValue(v)` とコンテナイベント `js-field:value-change` を提供することで、フォームの値との双方向同期を容易にします。

## ユースケース

- 読み取り専用タイプ
  - 詳細ブロック：計算結果、ステータスバッジ、リッチテキストのスニペット、グラフなどの読み取り専用コンテンツを表示します。
  - テーブルブロック：「その他のカスタム列 > JS Field」として読み取り専用表示に利用されます（フィールドにバインドされていない列が必要な場合は、JS Column を使用してください）。

- 編集可能タイプ
  - フォームブロック（CreateForm/EditForm）：カスタム入力コントロールや複合入力に利用され、フォームの検証と送信に伴って処理されます。
  - 適したシナリオ：外部ライブラリの入力コンポーネント、リッチテキスト/コードエディタ、複雑な動的コンポーネントなど。

## ランタイムコンテキスト API

JS フィールドのランタイムコードは、以下のコンテキスト機能を直接利用できます。

- `ctx.element`：フィールドの DOM コンテナ（ElementProxy）で、`innerHTML`、`querySelector`、`addEventListener` などに対応しています。
- `ctx.value`：現在のフィールド値（読み取り専用）。
- `ctx.record`：現在のレコードオブジェクト（読み取り専用）。
- `ctx.collection`：フィールドが属するコレクションのメタ情報（読み取り専用）。
- `ctx.requireAsync(url)`：URL に基づいて AMD/UMD ライブラリを非同期でロードします。
- `ctx.importAsync(url)`：URL に基づいて ESM モジュールを動的にインポートします。
- `ctx.openView(options)`：設定済みのビュー（ポップアップ/ドロワー/ページ）を開きます。
- `ctx.i18n.t()` / `ctx.t()`：国際化機能。
- `ctx.onRefReady(ctx.ref, cb)`：コンテナの準備ができてからレンダリングします。
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`：JSX レンダリングと時間処理のための、React、ReactDOM、Ant Design、Ant Design アイコン、dayjs などの組み込み汎用ライブラリです。（`ctx.React` / `ctx.ReactDOM` / `ctx.antd` は互換性のために引き続き利用可能です。）
- `ctx.render(vnode)`：React 要素、HTML 文字列、または DOM ノードをデフォルトコンテナ `ctx.element` にレンダリングします。繰り返しレンダリングする場合、Root を再利用し、コンテナの既存コンテンツを上書きします。

編集可能タイプ（JSEditableField）に特有の機能：

- `ctx.getValue()`：現在のフォーム値を取得します（フォームの状態を優先し、次にフィールドの props にフォールバックします）。
- `ctx.setValue(v)`：フォーム値とフィールドの props を設定し、双方向同期を維持します。
- コンテナイベント `js-field:value-change`：外部の値が変更されたときにトリガーされ、スクリプトが入力表示を更新しやすくなります。

## エディタとスニペット

JS フィールドのスクリプトエディタは、シンタックスハイライト、エラーヒント、および組み込みコードスニペット（Snippets）に対応しています。

- `Snippets`：組み込みコードスニペットのリストを開き、検索して現在のカーソル位置にワンクリックで挿入できます。
- `Run`：現在のコードを直接実行します。実行ログは下部の `Logs` パネルに出力され、`console.log/info/warn/error` やエラーのハイライト表示による位置特定に対応しています。

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

AI 従業員と連携してコードを生成することもできます。

- [AI 従業員・Nathan：フロントエンドエンジニア](/ai-employees/built-in/ai-coding)

## よくある使い方

### 1) 基本的なレンダリング（フィールド値の読み取り）

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) JSX を使用した React コンポーネントのレンダリング

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) サードパーティライブラリのロード（AMD/UMD または ESM）

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) クリックでポップアップ/ドロワーを開く（openView）

```js
ctx.element.innerHTML = `<a class="open-detail">詳細を表示</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) 編集可能な入力（JSEditableFieldModel）

```js
// JSX を使用してシンプルな入力をレンダリングし、フォーム値を同期します
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// 外部の値が変更されたときに、入力に同期します（オプション）
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## 注意事項

- 外部ライブラリのロードには信頼できる CDN の利用を推奨し、失敗シナリオに備えてフォールバック（例: `if (!lib) return;`）を用意してください。
- セレクタには `class` または `[name=...]` を優先的に使用し、固定 `id` の使用は避けてください。これにより、複数のブロックやポップアップでの `id` の重複を防ぎます。
- イベントのクリーンアップ：フィールドはデータ変更やビューの切り替えにより複数回再レンダリングされる可能性があります。イベントをバインドする前に、重複トリガーを避けるためにクリーンアップまたは重複排除を行う必要があります。「remove してから add する」といった方法が考えられます。