:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/libs)をご参照ください。
:::

# ctx.libs

`ctx.libs` は RunJS 内蔵ライブラリの統一ネームスペースであり、React、Ant Design、dayjs、lodash などの常用ライブラリが含まれています。**`import` や非同期読み込みは不要**で、直接 `ctx.libs.xxx` を通じて使用できます。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | React + Ant Design を使用した UI レンダリング、dayjs による日付処理、lodash によるデータ処理 |
| **公式 / 計算** | formula または math を使用した Excel ライクな公式や数学式の演算 |
| **ワークフロー / 連動ルール** | 純粋なロジックシーンにおける lodash、dayjs、formula などのツールライブラリの呼び出し |

## 内蔵ライブラリ一覧

| プロパティ | 説明 | ドキュメント |
|------|------|------|
| `ctx.libs.React` | React 本体。JSX と Hooks に使用 | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | ReactDOM クライアント API（`createRoot` を含む）。React と組み合わせてレンダリングに使用 | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Ant Design コンポーネントライブラリ（Button、Card、Table、Form、Input、Modal など） | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Ant Design アイコンライブラリ（PlusOutlined、UserOutlined など） | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | 日付時刻ツールライブラリ | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | ユーティリティライブラリ（get、set、debounce など） | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Excel ライクな関数ライブラリ（SUM、AVERAGE、IF など） | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | 数学式および計算ライブラリ | [Math.js](https://mathjs.org/docs/) |

## トップレベルの別名

過去のコードとの互換性のため、一部のライブラリは `ctx.React`、`ctx.ReactDOM`、`ctx.antd`、`ctx.dayjs` としてトップレベルでも公開されています。メンテナンスとドキュメント検索のしやすさから、**`ctx.libs.xxx` への統一を推奨します**。

## 遅延読み込み

`lodash`、`formula`、`math` などは**遅延読み込み（Lazy Loading）**を採用しています。最初に `ctx.libs.lodash` にアクセスしたときに動的インポート（dynamic import）が行われ、その後はキャッシュが再利用されます。`React`、`antd`、`dayjs`、`antdIcons` はコンテキストによってプリセットされており、すぐに利用可能です。

## 実行例

### React と Ant Design によるレンダリング

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="タイトル">
    <Button type="primary">クリック</Button>
  </Card>
);
```

### Hooks の使用

```tsx
const { React } = ctx.libs;
const { useState } = React;
const { Button } = ctx.libs.antd;

const App = () => {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount((c) => c + 1)}>{count}</Button>;
};
ctx.render(<App />);
```

### アイコンの使用

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>ユーザー</Button>);
```

### dayjs による日付処理

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### lodash ツール関数

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### formula 公式計算

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### math 数学式

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## 注意事項

- **ctx.importAsync との混用**: `ctx.importAsync('react@19')` を通じて外部の React を読み込んだ場合、JSX はそのインスタンスを使用します。この際、`ctx.libs.antd` と**混用しないでください**。antd はその React バージョンに対応したものを読み込む必要があります（例: `ctx.importAsync('antd@5.x')`、`ctx.importAsync('@ant-design/icons@5.x')`）。
- **複数の React インスタンス**: "Invalid hook call" が発生したり、hook dispatcher が null になったりする場合、通常は複数の React インスタンスが原因です。`ctx.libs.React` の読み込みや Hooks の呼び出し前に、まず `await ctx.importAsync('react@バージョン')` を実行して、ページと同一の React インスタンスを共有するようにしてください。

## 関連情報

- [ctx.importAsync()](./import-async.md) - 外部 ESM モジュールのオンデマンド読み込み（特定バージョンの React、Vue など）
- [ctx.render()](./render.md) - コンテナへのコンテンツのレンダリング