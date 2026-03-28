:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/route)をご参照ください。
:::

# ctx.route

現在のルートマッチング情報です。React Router の `route` コンセプトに対応しており、現在マッチしているルート設定やパラメータなどを取得するために使用されます。通常、`ctx.router` や `ctx.location` と組み合わせて使用します。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSBlock / JSField** | `route.pathname` または `route.params` に基づいて、条件付きレンダリングや現在のページ識別子の表示を行います。 |
| **連動ルール / イベント流** | ルートパラメータ（例：`params.name`）を読み取り、ロジックの分岐や子コンポーネントへの受け渡しを行います。 |
| **ビューナビゲーション** | 内部的に `ctx.route.pathname` とターゲットパスを比較し、`ctx.router.navigate` を実行するかどうかを決定します。 |

> 注意：`ctx.route` は、ルートコンテキストが存在する RunJS 環境（ページ内の JSBlock やワークフローページなど）でのみ利用可能です。純粋なバックエンドやルートのないコンテキスト（ワークフローなど）では空になる場合があります。

## 型定義

```ts
type RouteOptions = {
  name?: string;   // ルートの一意識別子
  path?: string;   // ルートテンプレート（例：/admin/:name）
  params?: Record<string, any>;  // ルートパラメータ（例：{ name: 'users' }）
  pathname?: string;  // 現在のルートのフルパス（例：/admin/users）
};
```

## 常用フィールド

| フィールド | 型 | 説明 |
|------|------|------|
| `pathname` | `string` | 現在のルートのフルパス。`ctx.location.pathname` と一致します。 |
| `params` | `Record<string, any>` | ルートテンプレートから解析された動的パラメータ。例：`{ name: 'users' }` |
| `path` | `string` | ルートテンプレート。例：`/admin/:name` |
| `name` | `string` | ルートの一意識別子。マルチタブやマルチビューのシナリオでよく使用されます。 |

## ctx.router、ctx.location との関係

| 用途 | 推奨される使い方 |
|------|----------|
| **現在のパスを読み取る** | `ctx.route.pathname` または `ctx.location.pathname`。マッチング時は両者で一致します。 |
| **ルートパラメータを読み取る** | `ctx.route.params`。例：`params.name` は現在のページの UID を表します。 |
| **ナビゲーション（遷移）** | `ctx.router.navigate(path)` |
| **クエリパラメータ、state を読み取る** | `ctx.location.search`、`ctx.location.state` |

`ctx.route` は「マッチしたルート設定」に重点を置き、`ctx.location` は「現在の URL 位置」に重点を置いています。両者を組み合わせることで、現在のルート状態を完全に記述できます。

## 実行例

### pathname の読み取り

```ts
// 現在のパスを表示
ctx.message.info('現在のページ: ' + ctx.route.pathname);
```

### params に基づく分岐

```ts
// params.name は通常、現在のページの UID（ワークフローページの識別子など）です
if (ctx.route.params?.name === 'users') {
  // ユーザー管理ページで特定のロジックを実行
}
```

### ワークフローページでの表示

```tsx
<div>
  <h1>現在のページ - {ctx.route.pathname}</h1>
  <p>ルート識別子: {ctx.route.params?.name}</p>
</div>
```

## 関連情報

- [ctx.router](./router.md)：ルートナビゲーション。`ctx.router.navigate()` でパスを変更すると、`ctx.route` も随時更新されます。
- [ctx.location](./location.md)：現在の URL 位置（pathname、search、hash、state）。`ctx.route` と組み合わせて使用します。