:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# カスタムインタラクションイベント

イベントエディターでJavaScriptを記述し、EChartsインスタンスの`chart`を通じてインタラクションを登録することで、連携を実現できます。例えば、新しいページへの遷移や、ドリルダウン分析用のダイアログを開くといった操作が可能です。

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## イベントの登録と解除
- 登録：`chart.on(eventName, handler)`
- 解除：`chart.off(eventName, handler)` または `chart.off(eventName)` で同名のイベントをクリアします。

**注意：**
安全上の理由から、イベントを登録する前に必ず解除することをお勧めします！

## ハンドラー関数の引数 `params` のデータ構造

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

よく使われるものとして、`params.data` や `params.name` などがあります。

## 例：クリックで選択をハイライト表示
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // 現在のデータポイントをハイライト表示
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // 他のハイライトを解除
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## 例：クリックでページに遷移
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // 方法1：アプリケーション内部での遷移。ページのリロードを強制しないため、ユーザー体験が向上します（推奨）。相対パスのみでOKです。
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // 方法2：外部ページへの遷移。完全なURLが必要です。
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // 方法3：新しいタブで外部ページを開く。完全なURLが必要です。
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## 例：クリックで詳細ダイアログを表示（ドリルダウン分析）
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // 新しいダイアログで使用するためのコンテキスト変数を登録します。
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

新しく開いたダイアログでは、チャートで宣言されたコンテキスト変数 `ctx.view.inputArgs.XXX` を使用します。

## プレビューと保存
- 「プレビュー」をクリックすると、イベントコードが読み込まれて実行されます。
- 「保存」をクリックすると、現在のイベント設定が保存されます。
- 「キャンセル」をクリックすると、最後に保存された状態に戻ります。

**推奨事項：**
- 複数回のバインドによる重複実行やメモリ増加を防ぐため、バインドする前に必ず `chart.off('event')` を使用してください。
- イベントハンドラー内では、レンダリングのブロックを避けるため、`dispatchAction` や `setOption` のような軽量な操作をできるだけ使用してください。
- イベント処理で扱うフィールドが現在のデータと一致していることを確認するため、チャートオプションやデータクエリと連携して検証してください。