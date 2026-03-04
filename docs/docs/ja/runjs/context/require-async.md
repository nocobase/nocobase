:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/require-async)をご参照ください。
:::

# ctx.requireAsync()

URL を指定して **UMD/AMD** またはグローバルにマウントされるスクリプトを非同期で読み込みます。**CSS** の読み込みも可能です。ECharts、Chart.js、FullCalendar（UMD 版）、jQuery プラグインなどの UMD/AMD ライブラリを RunJS で使用する場合に適しています。ライブラリが ESM バージョンも提供している場合は、[ctx.importAsync()](./import-async.md) を優先して使用してください。

## 適用シーン

RunJS 内で UMD/AMD/グローバルスクリプト、または CSS をオンデマンドで読み込む必要があるすべてのシーンで使用できます。例：JSBlock、JSField、JSItem、JSColumn、ワークフロー、JSAction など。典型的な用途：ECharts、Chart.js、FullCalendar (UMD)、dayjs (UMD)、jQuery プラグインなど。

## 型定義

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## パラメータ

| パラメータ | 型 | 説明 |
|-----------|------|-------------|
| `url` | `string` | スクリプトまたは CSS のアドレス。**短縮表記** `<パッケージ名>@<バージョン>/<ファイルパス>`（ESM CDN 経由で解析される際、オリジナルの UMD ファイルを取得するために `?raw` が付与されます）または**フル URL** をサポートします。`.css` が渡された場合は、スタイルを読み込み、注入します。 |

## 戻り値

- 読み込まれたライブラリのオブジェクト（UMD/AMD コールバックの最初のモジュール値）。多くの UMD ライブラリは `window` にアタッチされるため（例：`window.echarts`）、戻り値が `undefined` になる場合があります。その場合は、ライブラリのドキュメントに従ってグローバル変数にアクセスしてください。
- `.css` が渡された場合は、`loadCSS` の結果を返します。

## URL 形式の説明

- **短縮パス**: 例: `echarts@5/dist/echarts.min.js`。デフォルトの ESM CDN (esm.sh) では、`https://esm.sh/echarts@5/dist/echarts.min.js?raw` がリクエストされます。`?raw` は、ESM ラッパーではなくオリジナルの UMD ファイルを取得するために使用されます。
- **フル URL**: `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js` のように、任意の CDN アドレスを直接記述できます。
- **CSS**: `.css` で終わる URL を渡すと、ページに読み込まれ、注入されます。

## ctx.importAsync() との違い

- **ctx.requireAsync()**: **UMD/AMD/グローバル**スクリプトを読み込みます。ECharts、Chart.js、FullCalendar (UMD)、jQuery プラグインなどに適しています。読み込み後、ライブラリは `window` にアタッチされることが多く、戻り値はライブラリのオブジェクトまたは `undefined` になります。
- **ctx.importAsync()**: **ESM モジュール**を読み込み、モジュールの名前空間を返します。ライブラリが ESM を提供している場合は、より優れたモジュールセマンティクスと Tree-shaking を利用できる `ctx.importAsync()` を優先してください。

## 例

### 基本的な使い方

```javascript
// 短縮パス（ESM CDN 経由で ...?raw として解析されます）
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// フル URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// CSS を読み込み、ページに注入する
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### ECharts チャート

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts library not loaded');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('売上概要') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Chart.js 棒グラフ

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js not loaded');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('数量'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs（UMD）

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## 注意事項

- **戻り値の形式**: UMD ライブラリのエクスポート方法は様々です。戻り値がライブラリのオブジェクトである場合もあれば、`undefined` である場合もあります。`undefined` の場合は、ライブラリのドキュメントに従って `window` からアクセスしてください。
- **ネットワーク依存**: CDN へのアクセスが必要です。イントラネット環境では、**ESM_CDN_BASE_URL** を使用して自前で構築したサービスを指すように設定できます。
- **importAsync との選択**: ライブラリが ESM と UMD の両方を提供している場合は、`ctx.importAsync()` を優先してください。

## 関連情報

- [ctx.importAsync()](./import-async.md) - ESM モジュールの読み込み。Vue、dayjs (ESM) などに適しています。
- [ctx.render()](./render.md) - チャートなどをコンテナにレンダリングします。
- [ctx.libs](./libs.md) - React、antd、dayjs などが組み込まれており、非同期読み込みは不要です。