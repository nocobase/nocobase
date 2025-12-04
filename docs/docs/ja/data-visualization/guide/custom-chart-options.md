:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# カスタムチャート設定

カスタムモードでは、コードエディタでJavaScript（JS）を記述してチャートを設定します。`ctx.data` を基に、完全なEChartsの `option` を返します。これは、複数のシリーズの結合、複雑なツールチップ、動的なスタイル設定に適しています。理論的には、EChartsの全機能とすべてのチャートタイプに対応しています。

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## データコンテキスト
- `ctx.data.objects`：オブジェクトの配列（各行がオブジェクトとして扱われます）
- `ctx.data.rows`：2次元配列（ヘッダーを含む）
- `ctx.data.columns`：列ごとにグループ化された2次元配列

**推奨される使い方：**
データを `dataset.source` に集約することをお勧めします。詳細な使い方は、EChartsのドキュメントをご参照ください。

 [データセット](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [軸](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [例](https://echarts.apache.org/examples/en/index.html)

まずは簡単な例を見てみましょう。

## 例1：月別注文数棒グラフ

![20251027082816](https://static-docs.nocobase.com/20251027082816.png)

```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'bar',
      showSymbol: false,
    },
  ],
}
```

## 例2：売上トレンドチャート

![clipboard-image-1761525188](https://static-docs.nocobase.com/clipboard-image-1761525188.png)

```js
return {
  dataset: {
    source: ctx.data.objects.reverse()
  },
  title: {
    text: "Monthly Sales Trend",
    subtext: "Last 12 Months",
    left: "center"
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross"
    }
  },
  legend: {
    data: ["Revenue", "Order Count", "Avg Order Value"],
    bottom: 0
  },
  grid: {
    left: "5%",
    right: "5%",
    bottom: "60",
    top: "80",
    containLabel: true
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    axisLabel: {
      rotate: 45
    }
  },
  yAxis: [
    {
      type: "value",
      name: "Amount(¥)",
      position: "left",
      axisLabel: {
        formatter: (value) => {
          return (value/10000).toFixed(0) + '0k';
        }
      }
    },
    {
      type: "value",
      name: "Order Count",
      position: "right"
    }
  ],
  series: [
    {
      name: "Revenue",
      type: "line",
      smooth: true,
      encode: {
        x: "month",
        y: "monthly_revenue"
      },
      areaStyle: {
        opacity: 0.3
      },
      itemStyle: {
        color: "#5470c6"
      }
    },
    {
      name: "Order Count",
      type: "bar",
      yAxisIndex: 1,
      encode: {
        x: "month",
        y: "order_count"
      },
      itemStyle: {
        color: "#91cc75",
        opacity: 0.6
      }
    },
    {
      name: "Avg Order Value",
      type: "line",
      encode: {
        x: "month",
        y: "avg_order_value"
      },
      itemStyle: {
        color: "#fac858"
      },
      lineStyle: {
        type: "dashed"
      }
    }
  ]
}
```

**推奨事項：**
- 純粋関数スタイルを維持し、`ctx.data` のみから `option` を生成して、副作用を避けてください。
- クエリの列名を変更するとインデックスに影響が出るため、名前を統一し、「データ表示」で確認してからコードを修正してください。
- データ量が多い場合は、JSでの複雑な同期計算を避け、必要に応じてクエリ段階で集計してください。

## その他の例

より多くの使用例については、NocoBaseの[デモアプリケーション](https://demo3.sg.nocobase.com/admin/5xrop8s0bui)をご参照ください。

また、EChartsの公式[例](https://echarts.apache.org/examples/en/index.html)を閲覧し、希望するチャート効果を選択して、JS設定コードを参照・コピーすることもできます。 

## プレビューと保存

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- 右側または下部の「プレビュー」をクリックすると、チャートが更新され、JS設定内容を検証できます。
- 「保存」をクリックすると、現在のJS設定内容がデータベースに保存されます。
- 「キャンセル」をクリックすると、最後に保存された状態に戻ります。