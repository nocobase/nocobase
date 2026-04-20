:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/index)をご参照ください。
:::

# RunJS 概要

RunJSは、NocoBaseの**JSブロック**、**JSフィールド**、**JSアクション**などのシナリオで使用されるJavaScript実行環境です。コードは制限されたサンドボックス内で実行され、`ctx`（コンテキストAPI）に安全にアクセスでき、以下の機能を備えています：

- トップレベルの `await`（Top-level `await`）
- 外部モジュールのインポート
- コンテナ内でのレンダリング
- グローバル変数

## トップレベルの `await`（Top-level `await`）

RunJSはトップレベルの `await` をサポートしており、コードをIIFE（即時実行関数式）で囲む必要はありません。

**非推奨**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**推奨**

```js
async function test() {}
await test();
```

## 外部モジュールのインポート

- ESMモジュールには `ctx.importAsync()` を使用します（推奨）
- UMD/AMDモジュールには `ctx.requireAsync()` を使用します

## コンテナ内でのレンダリング

`ctx.render()` を使用して、現在のコンテナ（`ctx.element`）にコンテンツをレンダリングします。以下の3つの形式をサポートしています：

### JSXのレンダリング

```jsx
ctx.render(<button>Button</button>);
```

### DOMノードのレンダリング

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### HTML文字列のレンダリング

```js
ctx.render('<h1>Hello World</h1>');
```

## グローバル変数

- `window`
- `document`
- `navigator`
- `ctx`