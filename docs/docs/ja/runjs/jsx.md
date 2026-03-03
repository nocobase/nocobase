:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/jsx)をご参照ください。
:::

# JSX

RunJSはJSX構文をサポートしており、Reactコンポーネントのようにコードを記述できます。JSXは実行前に自動的にコンパイルされます。

## コンパイルの説明

- [sucrase](https://github.com/alangpierce/sucrase) を使用してJSXを変換します。
- JSXは `ctx.libs.React.createElement` および `ctx.libs.React.Fragment` にコンパイルされます。
- **Reactのインポートは不要**：JSXを直接記述でき、コンパイル後は自動的に `ctx.libs.React` が使用されます。
- `ctx.importAsync('react@x.x.x')` を通じて外部のReactをロードする場合、JSXはそのインスタンスの `createElement` を使用するように変更されます。

## 組み込みのReactとコンポーネントの使用

RunJSにはReactおよび一般的なUIライブラリが組み込まれており、`import` なしで `ctx.libs` から直接使用できます。

- **ctx.libs.React** — React本体
- **ctx.libs.ReactDOM** — ReactDOM（必要に応じて `createRoot` と併用可能）
- **ctx.libs.antd** — Ant Designコンポーネント
- **ctx.libs.antdIcons** — Ant Designアイコン

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>クリック</Button>);
```

JSXを直接記述する場合、Reactを分割代入（destructure）する必要はありません。**Hooks**（`useState`、`useEffect` など）や **Fragment**（`<>...</>`）を使用する場合のみ、`ctx.libs` から分割代入する必要があります。

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};

ctx.render(<Counter />);
```

**注意**：組み込みのReactと `ctx.importAsync()` でインポートした外部のReactを**混在させることはできません**。外部UIライブラリを使用する場合は、Reactも外部から一括してインポートする必要があります。

## 外部のReactとコンポーネントの使用

`ctx.importAsync()` を使用して特定のバージョンのReactやUIライブラリをロードすると、JSXはそのReactインスタンスを使用します。

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>クリック</Button>);
```

antdがreact/react-domに依存している場合、`deps` を介して同一バージョンを指定することで、複数のインスタンスが生成されるのを避けることができます。

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**注意**：外部のReactを使用する場合、antdなどのUIライブラリも `ctx.importAsync()` を通じてインポートする必要があります。`ctx.libs.antd` と混在させないでください。

## JSX構文のポイント

- **コンポーネントと props**：`<Button type="primary">テキスト</Button>`
- **Fragment**：`<>...</>` または `<React.Fragment>...</React.Fragment>`（Fragmentを使用する場合は `const { React } = ctx.libs` の分割代入が必要です）
- **式**：JSX内では `{式}` を使用して変数や演算を挿入します（例：`{ctx.user.name}`、`{count + 1}`）。`{{ }}` のようなテンプレート構文は使用しないでください。
- **条件付きレンダリング**：`{flag && <span>コンテンツ</span>}` または `{flag ? <A /> : <B />}`
- **リストレンダリング**：`array.map()` を使用して要素のリストを返し、各要素に一意の `key` を設定します。

```tsx
const { React } = ctx.libs;
const items = ['a', 'b', 'c'];

ctx.render(
  <ul>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
```