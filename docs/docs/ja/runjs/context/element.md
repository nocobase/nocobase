:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/element)をご参照ください。
:::

# ctx.element

サンドボックス内の DOM コンテナを指す `ElementProxy` インスタンスであり、`ctx.render()` のデフォルトのレンダリング先として機能します。`JSBlock`、`JSField`、`JSItem`、`JSColumn` など、レンダリングコンテナが存在するシーンで使用可能です。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSBlock** | ブロックの DOM コンテナ。ブロックのカスタムコンテンツをレンダリングします。 |
| **JSField / JSItem / FormJSFieldItem** | フィールド/フォーム項目のレンダリングコンテナ（通常は `<span>`）。 |
| **JSColumn** | テーブルセルの DOM コンテナ。カスタム列のコンテンツをレンダリングします。 |

> 注意：`ctx.element` は、レンダリングコンテナが存在する RunJS コンテキストでのみ利用可能です。UI コンテキストがないシーン（純粋なバックエンドロジックなど）では `undefined` になる可能性があるため、使用前に null チェックを行うことを推奨します。

## 型定義

```typescript
element: ElementProxy | undefined;

// ElementProxy は生の HTMLElement に対するプロキシであり、安全な API を公開します
class ElementProxy {
  __el: HTMLElement;  // 内部で保持されている生の DOM 要素（特定のシーンでのみアクセスが必要）
  innerHTML: string;  // 読み書き時に DOMPurify で洗浄されます
  outerHTML: string; // 同上
  appendChild(child: HTMLElement | string): void;
  // その他の HTMLElement メソッドは透過的に渡されます（直接の使用は推奨されません）
}
```

## セキュリティ要件

**推奨：すべてのレンダリングは `ctx.render()` を通じて行ってください。** `ctx.element` の DOM API（`innerHTML`、`appendChild`、`querySelector` など）を直接使用しないでください。

### なぜ ctx.render() が推奨されるのか

| 利点 | 説明 |
|------|------|
| **安全** | セキュリティ制御を集中させ、XSS や不適切な DOM 操作を防止します。 |
| **React サポート** | JSX、React コンポーネント、およびライフサイクルを完全にサポートします。 |
| **コンテキストの継承** | アプリケーションの `ConfigProvider` やテーマなどを自動的に継承します。 |
| **競合処理** | React ルートの作成/アンマウントを自動的に管理し、複数インスタンスによる競合を回避します。 |

### ❌ 非推奨：ctx.element の直接操作

```ts
// ❌ 非推奨：ctx.element の API を直接使用する
ctx.element.innerHTML = '<div>コンテンツ</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` は非推奨です。代わりに `ctx.render()` を使用してください。

### ✅ 推奨：ctx.render() の使用

```ts
// ✅ React コンポーネントをレンダリングする
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('ようこそ')}>
    <Button type="primary">クリック</Button>
  </Card>
);

// ✅ HTML 文字列をレンダリングする
ctx.render('<div style="padding:16px;">' + ctx.t('コンテンツ') + '</div>');

// ✅ DOM ノードをレンダリングする
const div = document.createElement('div');
div.textContent = ctx.t('こんにちは');
ctx.render(div);
```

## 特例：ポップオーバーのアンカーとして使用する場合

現在の要素をアンカーとして Popover を開く必要がある場合、`ctx.element?.__el` にアクセスして生の DOM を `target` として取得できます。

```ts
// ctx.viewer.popover は target として生の DOM を必要とします
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>ポップアップ内容</div>,
});
```

> 「現在のコンテナをアンカーとして使用する」といった特定のシーンでのみ `__el` を使用してください。それ以外のケースでは DOM を直接操作しないでください。

## ctx.render との関係

- `ctx.render(vnode)` に `container` が渡されない場合、デフォルトで `ctx.element` コンテナ内にレンダリングされます。
- `ctx.element` が存在せず、かつ `container` も渡されない場合は、エラーがスローされます。
- コンテナを明示的に指定することも可能です：`ctx.render(vnode, customContainer)`

## 注意事項

- `ctx.element` は `ctx.render()` の内部コンテナとしてのみ使用することを想定しており、そのプロパティやメソッドに直接アクセスしたり変更したりすることは推奨されません。
- レンダリングコンテナのないコンテキストでは `ctx.element` は `undefined` になります。`ctx.render()` を呼び出す前に、コンテナが利用可能であることを確認するか、手動で `container` を渡す必要があります。
- ElementProxy の `innerHTML`/`outerHTML` は DOMPurify で洗浄されますが、レンダリング管理を統一するため、引き続き `ctx.render()` の使用を推奨します。

## 関連情報

- [ctx.render](./render.md)：コンテンツをコンテナにレンダリングする
- [ctx.view](./view.md)：現在のビューコントローラー
- [ctx.modal](./modal.md)：モーダル用のショートカット API