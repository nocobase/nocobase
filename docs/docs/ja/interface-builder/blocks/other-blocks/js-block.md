:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# JS Block ブロック

## 導入

JS Blockは、非常に柔軟な「カスタムレンダリングブロック」です。JavaScriptスクリプトを直接記述することで、インターフェースの生成、イベントのバインド、データAPIの呼び出し、サードパーティライブラリの統合が可能です。組み込みブロックでは対応が難しい、パーソナライズされた可視化、一時的な試行、軽量な拡張といったシナリオに適しています。

## ランタイムコンテキストAPI

JS Blockのランタイムコンテキストには一般的な機能が注入されており、直接使用できます。

- `ctx.element`：ブロックのDOMコンテナ（ElementProxyとして安全にラップされています）で、`innerHTML`、`querySelector`、`addEventListener`などをサポートしています。
- `ctx.requireAsync(url)`：URLを指定してAMD/UMDライブラリを非同期でロードします。
- `ctx.importAsync(url)`：URLを指定してESMモジュールを動的にインポートします。
- `ctx.openView`：設定済みのビュー（ポップアップ/ドロワー/ページ）を開きます。
- `ctx.useResource(...)` + `ctx.resource`：リソースとしてデータにアクセスします。
- `ctx.i18n.t()` / `ctx.t()`：組み込みの国際化機能です。
- `ctx.onRefReady(ctx.ref, cb)`：コンテナの準備ができてからレンダリングすることで、タイミングの問題を回避します。
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`：React、ReactDOM、Ant Design、Ant Design Icons、dayjsなどの汎用ライブラリが組み込まれており、JSXレンダリングや時間処理に使用できます。（`ctx.React` / `ctx.ReactDOM` / `ctx.antd`は互換性のために残されています。）
- `ctx.render(vnode)`：React要素、HTML文字列、またはDOMノードをデフォルトコンテナ`ctx.element`にレンダリングします。複数回呼び出しても同じReact Rootが再利用され、コンテナの既存コンテンツは上書きされます。

## ブロックの追加

- ページやポップアップにJS Blockを追加できます。
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## エディターとスニペット

JS Blockのスクリプトエディターは、構文ハイライト、エラーヒント、組み込みのコードスニペット（Snippets）をサポートしており、チャートのレンダリング、ボタンイベントのバインド、外部ライブラリのロード、React/Vueコンポーネントのレンダリング、タイムライン、情報カードなどの一般的な例を素早く挿入できます。

- `Snippets`：組み込みのコードスニペットリストを開きます。検索して、選択したスニペットをコード編集エリアの現在のカーソル位置にワンクリックで挿入できます。
- `Run`：現在エディター内のコードを直接実行し、実行ログを下部の`Logs`パネルに出力します。`console.log/info/warn/error`の表示をサポートしており、エラーはハイライトされ、特定の行と列に移動できます。

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

さらに、エディターの右上からAI従業員「フロントエンドエンジニア・Nathan」を直接呼び出すことができます。Nathanは現在のコンテキストに基づいてスクリプトの作成や修正をサポートしてくれます。ワンクリックで「Apply to editor」を適用し、実行して効果を確認できます。詳細は以下をご覧ください。

- [AI 従業員・Nathan：フロントエンドエンジニア](/ai-employees/built-in/ai-coding)

## 実行環境とセキュリティ

- **コンテナ**：システムはスクリプトに安全なDOMコンテナ`ctx.element`（ElementProxy）を提供します。これは現在のブロックのみに影響し、ページの他の領域には干渉しません。
- **サンドボックス**：スクリプトは制御された環境で実行されます。`window`/`document`/`navigator`は安全なプロキシオブジェクトを使用し、一般的なAPIは利用可能ですが、リスクのある動作は制限されます。
- **再レンダリング**：ブロックが非表示になった後、再度表示されると自動的に再レンダリングされます（初回マウント時の重複実行を回避するためです）。

## 一般的な使用方法（簡略化された例）

### 1) React（JSX）のレンダリング

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </div>
);
```

### 2) APIリクエストのテンプレート

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) EChartsのロードとレンダリング

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) ビュー（ドロワー）を開く

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) リソースの読み込みとJSONのレンダリング

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## 注意事項

- 外部ライブラリのロードには、信頼できるCDNを使用することをお勧めします。
- セレクターの使用に関するアドバイス：`class`または`[name=...]`属性セレクターを優先してください。複数のブロックやポップアップで`id`が重複し、スタイルやイベントの競合が発生するのを避けるため、固定の`id`の使用は避けてください。
- イベントのクリーンアップ：ブロックは複数回再レンダリングされる可能性があります。イベントをバインドする前に、重複トリガーを避けるためにクリーンアップまたは重複排除を行う必要があります。「まず削除してから追加する」方法、ワンタイムリスナー、または重複防止のためのフラグを追加する方法が考えられます。

## 関連ドキュメント

- [変数とコンテキスト](/interface-builder/variables)
- [連携ルール](/interface-builder/linkage-rule)
- [ビューとポップアップ](/interface-builder/actions/types/view)