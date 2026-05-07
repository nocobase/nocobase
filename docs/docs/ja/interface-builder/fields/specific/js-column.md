:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/interface-builder/fields/specific/js-column)をご参照ください。
:::

# JS Column

## はじめに

JS Column は、テーブルの「カスタム列」に使用され、JavaScript を通じて各行のセル内容をレンダリングします。特定のフィールドにバインドされず、派生列、フィールドをまたいだ組み合わせ表示、ステータスバッジ、ボタン操作、リモートデータの集計などのシナリオに適しています。

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## ランタイムコンテキスト API

JS Column の各セルがレンダリングされる際、以下のコンテキスト機能を利用できます：

- `ctx.element`：現在のセルの DOM コンテナ（ElementProxy）。`innerHTML`、`querySelector`、`addEventListener` などをサポートします。
- `ctx.record`：現在の行のレコードオブジェクト（読み取り専用）。
- `ctx.recordIndex`：現在のページ内の行インデックス（0 から開始、ページネーションの影響を受ける可能性があります）。
- `ctx.collection`：テーブルにバインドされたコレクションのメタ情報（読み取り専用）。
- `ctx.requireAsync(url)`：URL に従って AMD/UMD ライブラリを非同期でロードします。
- `ctx.importAsync(url)`：URL に従って ESM モジュールを動的にインポートします。
- `ctx.openView(options)`：設定済みのビュー（ポップアップ/ドロワー/ページ）を開きます。
- `ctx.i18n.t()` / `ctx.t()`：国際化。
- `ctx.onRefReady(ctx.ref, cb)`：コンテナの準備が整ってからレンダリングします。
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`：組み込みの React / ReactDOM / Ant Design / Ant Design アイコン / dayjs / lodash / math.js / formula.js などの共通ライブラリ。JSX レンダリング、時間処理、データ操作、数学演算に使用されます。（`ctx.React` / `ctx.ReactDOM` / `ctx.antd` は互換性のために引き続き保持されます。）
- `ctx.render(vnode)`：React 要素/HTML/DOM をデフォルトコンテナ `ctx.element`（現在のセル）にレンダリングします。複数回レンダリングすると Root が再利用され、コンテナの既存の内容が上書きされます。

## エディタとスニペット

JS Column のスクリプトエディタは、構文ハイライト、エラーヒント、組み込みコードスニペット（Snippets）をサポートしています。

- `Snippets`：組み込みコードスニペットのリストを開き、検索して現在のカーソル位置にワンクリックで挿入できます。
- `Run`：現在のコードを直接実行します。実行ログは下部の `Logs` パネルに出力され、`console.log/info/warn/error` とエラーのハイライト表示に対応しています。

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

AI 従業員と組み合わせてコードを生成できます：

- [AI 従業員 · Nathan：フロントエンドエンジニア](/ai-employees/features/built-in-employee)

## よくある使い方

### 1) 基礎的なレンダリング（現在の行レコードの読み取り）

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) JSX を使用した React コンポーネントのレンダリング

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) セル内でポップアップ/ドロワーを開く（表示/編集）

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>表示</a>
);
```

### 4) サードパーティライブラリのロード（AMD/UMD または ESM）

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## 注意事項

- 外部ライブラリのロードには信頼できる CDN を使用し、失敗した場合のフォールバック（例：`if (!lib) return;`）を準備することをお勧めします。
- セレクタは `class` または `[name=...]` を優先的に使用し、複数のブロック/ポップアップでの重複を避けるために固定の `id` の使用は避けてください。
- イベントのクリーンアップ：テーブルの行はページネーション/リフレッシュによって動的に変化し、セルは複数回レンダリングされます。イベントをバインドする前に、重複トリガーを避けるためにクリーンアップまたは重複排除を行う必要があります。
- パフォーマンスの提案：各セルで大きなライブラリを繰り返しロードすることは避けてください。ライブラリを上位レイヤー（グローバル変数やテーブルレベルの変数など）にキャッシュしてから再利用する必要があります。