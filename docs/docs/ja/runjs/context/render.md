:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/render)をご参照ください。
:::

# ctx.render()

React 要素、HTML 文字列、または DOM ノードを、指定されたコンテナにレンダリングします。`container` を指定しない場合は、デフォルトで `ctx.element` にレンダリングされ、アプリケーションの ConfigProvider やテーマなどのコンテキストを自動的に継承します。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSBlock** | ブロックのカスタムコンテンツ（チャート、リスト、カードなど）のレンダリング |
| **JSField / JSItem / JSColumn** | 編集可能なフィールドやテーブル列のカスタム表示のレンダリング |
| **詳細ブロック** | 詳細ページにおけるフィールド表示形式のカスタマイズ |

> 注意：`ctx.render()` にはレンダリング先のコンテナが必要です。`container` が渡されず、かつ `ctx.element` が存在しない場合（UI のない純粋なロジックのみのシーンなど）、エラーがスローされます。

## 型定義

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| 引数 | 型 | 説明 |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | レンダリングするコンテンツ |
| `container` | `Element` \| `DocumentFragment`（任意） | レンダリング先のコンテナ。デフォルトは `ctx.element` |

**戻り値**:

- **React 要素** をレンダリングする場合：`ReactDOMClient.Root` を返します。これにより、後続の `root.render()` を呼び出して更新することが容易になります。
- **HTML 文字列** または **DOM ノード** をレンダリングする場合：`null` を返します。

## vnode 型の説明

| 型 | 動作 |
|------|------|
| `React.ReactElement`（JSX） | React の `createRoot` を使用してレンダリングされます。完全な React の機能を備え、アプリケーションのコンテキストを自動的に継承します。 |
| `string` | DOMPurify で洗浄（サニタイズ）された後、コンテナの `innerHTML` に設定されます。既存の React ルートは事前にアンマウントされます。 |
| `Node`（Element、Text など） | コンテナをクリアした後、`appendChild` で追加されます。既存の React ルートは事前にアンマウントされます。 |
| `DocumentFragment` | フラグメントの子ノードがコンテナに追加されます。既存の React ルートは事前にアンマウントされます。 |

## 示例

### React 要素（JSX）をレンダリングする

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('タイトル')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('クリックされました'))}>
      {ctx.t('ボタン')}
    </Button>
  </Card>
);
```

### HTML 文字列をレンダリングする

```ts
ctx.render('<h1>Hello World</h1>');

// ctx.t と組み合わせて国際化対応を行う
ctx.render('<div style="padding:16px">' + ctx.t('コンテンツ') + '</div>');

// 条件付きレンダリング
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('No data') + '</span>');
```

### DOM ノードをレンダリングする

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// 先に空のコンテナをレンダリングし、その後サードパーティライブラリ（ECharts など）に初期化を委ねる
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### カスタムコンテナを指定する

```ts
// 指定した DOM 要素にレンダリングする
const customEl = document.getElementById('my-container');
ctx.render(<div>コンテンツ</div>, customEl);
```

### 複数回の呼び出しは内容を置き換える

```ts
// 2回目の呼び出しにより、コンテナ内の既存の内容が置き換えられます
ctx.render(<div>1回目</div>);
ctx.render(<div>2回目</div>);  // 「2回目」のみが表示されます
```

## 注意事項

- **呼び出しのたびに内容が置き換わる**：`ctx.render()` を呼び出すたびに、コンテナ内の既存の内容は置き換えられ、追加はされません。
- **HTML 文字列の安全性**：渡された HTML は DOMPurify によって洗浄され、XSS リスクを低減しますが、信頼できないユーザー入力を直接結合することは避けることを推奨します。
- **ctx.element を直接操作しない**：`ctx.element.innerHTML` は非推奨です。統一して `ctx.render()` を使用してください。
- **コンテナがない場合は container を渡す**：`ctx.element` が `undefined` になるシーン（`ctx.importAsync` でロードされたモジュール内など）では、明示的に `container` を渡す必要があります。

## 関連情報

- [ctx.element](./element.md) - デフォルトのレンダリングコンテナ。`ctx.render()` に container が渡されない場合に使用されます。
- [ctx.libs](./libs.md) - React や antd などの組み込みライブラリ。JSX レンダリングに使用します。
- [ctx.importAsync()](./import-async.md) - 外部の React/コンポーネントライブラリをオンデマンドでロードした後、`ctx.render()` と組み合わせて使用します。