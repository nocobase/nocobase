:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# JSカラム

## はじめに

JSカラムは、テーブルの「カスタム列」として使用され、JavaScriptを使って各行のセル内容をレンダリングします。特定のフィールドにはバインドされず、派生列、複数フィールドを組み合わせた表示、ステータスバッジ、ボタン操作、リモートデータの集計などのシナリオに適しています。

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## ランタイムコンテキストAPI

JSカラムの各セルがレンダリングされる際、以下のコンテキストAPIを利用できます。

- `ctx.element`: 現在のセルのDOMコンテナ（ElementProxy）です。`innerHTML`、`querySelector`、`addEventListener` などに対応しています。
- `ctx.record`: 現在の行のレコードオブジェクト（読み取り専用）です。
- `ctx.recordIndex`: 現在のページ内の行インデックス（0から始まり、ページネーションの影響を受ける場合があります）です。
- `ctx.collection`: テーブルにバインドされているコレクションのメタ情報（読み取り専用）です。
- `ctx.requireAsync(url)`: URLを指定してAMD/UMDライブラリを非同期でロードします。
- `ctx.importAsync(url)`: URLを指定してESMモジュールを動的にインポートします。
- `ctx.openView(options)`: 設定済みのビュー（モーダル/ドロワー/ページ）を開きます。
- `ctx.i18n.t()` / `ctx.t()`: 国際化（i18n）機能です。
- `ctx.onRefReady(ctx.ref, cb)`: コンテナの準備ができてからレンダリングします。
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: JSXレンダリングや時間処理に使用できる、React、ReactDOM、Ant Design、Ant Design Icons、dayjsなどの組み込み共通ライブラリです。（`ctx.React` / `ctx.ReactDOM` / `ctx.antd` は互換性のために残されています。）
- `ctx.render(vnode)`: React要素/HTML/DOMをデフォルトコンテナである`ctx.element`（現在のセル）にレンダリングします。複数回レンダリングする場合、Rootは再利用され、コンテナの既存コンテンツは上書きされます。

## エディタとスニペット

JSカラムのスクリプトエディタは、シンタックスハイライト、エラーヒント、および組み込みのコードスニペットに対応しています。

- `Snippets`: 組み込みコードスニペットのリストを開き、検索して現在のカーソル位置にワンクリックで挿入できます。
- `Run`: 現在のコードを直接実行します。実行ログは下部の`Logs`パネルに出力され、`console.log/info/warn/error`やエラーのハイライト表示に対応しています。

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

AI従業員と連携してコードを生成することも可能です。

- [AI従業員・Nathan：フロントエンドエンジニア](/ai-employees/built-in/ai-coding)

## よくある使い方

### 1) 基本的なレンダリング（現在の行レコードの読み取り）

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) JSXを使ったReactコンポーネントのレンダリング

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

### 3) セルからモーダル/ドロワーを開く（表示/編集）

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

### 4) サードパーティライブラリのロード（AMD/UMDまたはESM）

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

- 外部ライブラリのロードには信頼できるCDNの使用をお勧めします。また、失敗シナリオに備えてフォールバック処理（例: `if (!lib) return;`）を実装してください。
- セレクタには固定の`id`ではなく、`class`または`[name=...]`を優先して使用することをお勧めします。これにより、複数のブロックやモーダルで`id`が重複するのを防ぎます。
- イベントのクリーンアップ: テーブルの行はページネーションや更新によって動的に変化し、セルが複数回レンダリングされることがあります。イベントをバインドする前に、重複トリガーを避けるためにクリーンアップまたは重複排除を行う必要があります。
- パフォーマンスに関するヒント: 各セルで大規模なライブラリを繰り返しロードすることは避けてください。ライブラリは上位レベル（グローバル変数やテーブルレベルの変数など）にキャッシュして再利用するようにしてください。