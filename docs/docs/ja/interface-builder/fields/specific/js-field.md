:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/interface-builder/fields/specific/js-field)をご参照ください。
:::

# JS Field

## 介绍

JS Field は、フィールドの位置で JavaScript を使用してコンテンツをカスタムレンダリングするために使用されます。詳細ブロック、フォームの読み取り専用項目、またはテーブル列の「その他のカスタム項目」などでよく見られます。パーソナライズされた表示、派生情報の組み合わせ、ステータスバッジ、リッチテキスト、またはチャートなどのレンダリングに適しています。

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## 类型

- 読み取り専用型：編集不可の表示に使用され、`ctx.value` を読み取って出力をレンダリングします。
- 編集可能型：カスタム入力インタラクションに使用され、`ctx.getValue()` / `ctx.setValue(v)` とコンテナイベント `js-field:value-change` を提供し、フォーム値との双方向同期を容易にします。

## 使用场景

- 読み取り専用型
  - 詳細ブロック：計算結果、ステータスバッジ、リッチテキストのスニペット、チャートなどの読み取り専用コンテンツを表示します。
  - テーブルブロック：「その他のカスタム列 > JS Field」として読み取り専用表示に使用されます（フィールドにバインドされていない列が必要な場合は、JS Column を使用してください）。

- 編集可能型
  - フォームブロック（CreateForm/EditForm）：カスタム入力コントロールや複合入力に使用され、フォームのバリデーションや送信に付随します。
  - 適したシーン：外部ライブラリの入力コンポーネント、リッチテキスト/コードエディタ、複雑な動的コンポーネントなど。

## 运行时上下文 API

JS Field のランタイムコードは、以下のコンテキスト機能を直接使用できます。

- `ctx.element`：フィールドの DOM コンテナ（ElementProxy）。`innerHTML`、`querySelector`、`addEventListener` などをサポートしています。
- `ctx.value`：現在のフィールド値（読み取り専用）。
- `ctx.record`：現在のレコードオブジェクト（読み取り専用）。
- `ctx.collection`：フィールドが属するコレクションのメタ情報（読み取り専用）。
- `ctx.requireAsync(url)`：URL に基づいて AMD/UMD ライブラリを非同期でロードします。
- `ctx.importAsync(url)`：URL に基づいて ESM モジュールを動的にインポートします。
- `ctx.openView(options)`：設定済みのビュー（ポップアップ/ドロワー/ページ）を開きます。
- `ctx.i18n.t()` / `ctx.t()`：国際化。
- `ctx.onRefReady(ctx.ref, cb)`：コンテナの準備が整ってからレンダリングします。
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`：組み込みの React / ReactDOM / Ant Design / Ant Design アイコン / dayjs / lodash / math.js / formula.js などの共通ライブラリで、JSX のレンダリング、時間処理、データ操作、数学演算に使用されます。（`ctx.React` / `ctx.ReactDOM` / `ctx.antd` は互換性のために引き続き保持されます。）
- `ctx.render(vnode)`：React 要素、HTML 文字列、または DOM ノードをデフォルトコンテナ `ctx.element` にレンダリングします。繰り返しレンダリングすると Root が再利用され、コンテナの既存のコンテンツが上書きされます。

編集可能型（JSEditableField）特有の機能：

- `ctx.getValue()`：現在のフォーム値を取得します（フォームの状態を優先し、次にフィールドの props にフォールバックします）。
- `ctx.setValue(v)`：フォーム値とフィールドの props を設定し、双方向同期を維持します。
- コンテナイベント `js-field:value-change`：外部の値が変化したときにトリガーされ、スクリプトが入力表示を更新しやすくなります。

## 编辑器与片段

JS Field のスクリプトエディタは、構文ハイライト、エラーヒント、および組み込みコードスニペット（Snippets）をサポートしています。

- `Snippets`：組み込みコードスニペットのリストを開き、検索して現在のカーソル位置にワンクリックで挿入できます。
- `Run`：現在のコードを直接実行します。実行ログは下部の `Logs` パネルに出力され、`console.log/info/warn/error` とエラーのハイライト表示による位置特定をサポートしています。

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

AI 従業員と連携してコードを生成することもできます：

- [AI 従業員 · Nathan：フロントエンドエンジニア](/ai-employees/features/built-in-employee)

## 常见用法

### 1) 基础渲染（读取字段值）

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) 使用 JSX 渲染 React 组件

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) 加载第三方库（AMD/UMD 或 ESM）

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) 点击打开弹窗/抽屉（openView）

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

### 5) 可编辑输入（JSEditableFieldModel）

```js
// JSX でシンプルな入力をレンダリングし、フォーム値を同期します
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

// 外部の値が変化したときに入力に同期します（オプション）
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## 注意事项

- 外部ライブラリのロードには信頼できる CDN を使用することを推奨し、失敗シナリオに備えてフォールバック（例：`if (!lib) return;`）を用意してください。
- セレクタは `class` または `[name=...]` を優先的に使用し、固定 `id` の使用は避けてください。これにより、複数のブロックやポップアップでの `id` の重複を防ぎます。
- イベントのクリーンアップ：フィールドはデータの変更やビューの切り替えにより複数回再レンダリングされる可能性があるため、イベントをバインドする前にクリーンアップまたは重複排除を行い、重複トリガーを避けてください。「先に remove してから add する」ことが可能です。