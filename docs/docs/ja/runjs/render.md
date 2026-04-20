:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/render)をご参照ください。
:::

# コンテナ内でのレンダリング

`ctx.render()` を使用して、現在のコンテナ（`ctx.element`）にコンテンツをレンダリングします。以下の3つの形式をサポートしています。

## `ctx.render()`

### JSX のレンダリング

```jsx
ctx.render(<button>Button</button>);
```

### DOM ノードのレンダリング

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### HTML 文字列のレンダリング

```js
ctx.render('<h1>Hello World</h1>');
```

## JSX について

RunJS では JSX を直接レンダリングできます。組み込みの React やコンポーネントライブラリを使用することも、必要に応じて外部依存関係をロードすることも可能です。

### 組み込みの React とコンポーネントライブラリの使用

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### 外部の React とコンポーネントライブラリの使用

`ctx.importAsync()` を使用して、特定のバージョンをオンデマンドでロードします。

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

特定のバージョンやサードパーティ製コンポーネントが必要な場合に適しています。

## ctx.element

非推奨の用法（廃止予定）:

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

推奨される方法:

```js
ctx.render(<h1>Hello World</h1>);
```