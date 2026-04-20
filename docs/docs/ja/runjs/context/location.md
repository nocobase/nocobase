:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/location)をご参照ください。
:::

# ctx.location

現在のルートの位置情報です。React Router の `location` オブジェクトと等価です。通常、`ctx.router` や `ctx.route` と組み合わせて使用し、現在のパス、クエリ文字列、ハッシュ、およびルート経由で渡された `state` を読み取るために使用されます。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSBlock / JSField** | 現在のパス、クエリパラメータ、またはハッシュに基づいて、条件付きレンダリングやロジックの分岐を行います。 |
| **連動ルール / イベントフロー** | URL クエリパラメータを読み取って連動フィルタリングを行ったり、`location.state` に基づいて遷移元を判断したりします。 |
| **ルート遷移後の処理** | 遷移先のページで `ctx.location.state` を使用して、前のページから `ctx.router.navigate` 経由で渡されたデータを受け取ります。 |

> 注意：`ctx.location` は、ルートコンテキストが存在する RunJS 環境（ページ内の JSBlock、イベントフローなど）でのみ利用可能です。純粋なバックエンドやルートのないコンテキスト（ワークフローなど）では空になる可能性があります。

## 型定義

```ts
location: Location;
```

`Location` は `react-router-dom` 由来で、React Router の `useLocation()` の戻り値と一致します。

## 主要なフィールド

| フィールド | 型 | 説明 |
|------|------|------|
| `pathname` | `string` | 現在のパス。`/` で始まります（例: `/admin/users`）。 |
| `search` | `string` | クエリ文字列。`?` で始まります（例: `?page=1&status=active`）。 |
| `hash` | `string` | ハッシュフラグメント。`#` で始まります（例: `#section-1`）。 |
| `state` | `any` | `ctx.router.navigate(path, { state })` を通じて渡される任意のデータ。URL には表示されません。 |
| `key` | `string` | この location の一意識別子。初期ページは `"default"` です。 |

## ctx.router、ctx.urlSearchParams との関係

| 用途 | 推奨される使い方 |
|------|----------|
| **パス、ハッシュ、state の読み取り** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **クエリパラメータの読み取り（オブジェクト形式）** | `ctx.urlSearchParams`。解析済みのオブジェクトを直接取得できます。 |
| **search 文字列の解析** | `new URLSearchParams(ctx.location.search)` または直接 `ctx.urlSearchParams` を使用します。 |

`ctx.urlSearchParams` は `ctx.location.search` から解析されます。クエリパラメータのみが必要な場合は、`ctx.urlSearchParams` を使用するのがより便利です。

## 例

### パスによる分岐

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('現在、ユーザー管理ページにいます');
}
```

### クエリパラメータの解析

```ts
// 方法 1：ctx.urlSearchParams を使用（推奨）
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// 方法 2：URLSearchParams を使用して search を解析
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### ルート遷移で渡された state の受け取り

```ts
// 前のページからの遷移時：ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('ダッシュボードから遷移しました');
}
```

### ハッシュによるアンカーの特定

```ts
const hash = ctx.location.hash; // 例: "#edit"
if (hash === '#edit') {
  // 編集エリアへスクロール、または対応するロジックを実行
}
```

## 関連情報

- [ctx.router](./router.md)：ルートナビゲーション。`ctx.router.navigate` の `state` は遷移先ページで `ctx.location.state` から取得できます。
- [ctx.route](./route.md)：現在のルート一致情報（パラメータ、設定など）。通常 `ctx.location` と組み合わせて使用します。