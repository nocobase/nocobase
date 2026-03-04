:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/request)をご参照ください。
:::

# ctx.request()

RunJS 内で認証済みの HTTP リクエストを送信します。リクエストには、現在のアプリケーションの `baseURL`、`Token`、`locale`、`role` などが自動的に付与され、アプリケーションのリクエストインターセプトおよびエラー処理ロジックが適用されます。

## 適用シーン

JSBlock、JSField、JSItem、JSColumn、ワークフロー（イベント流）、連動、JSAction など、RunJS 内でリモート HTTP リクエストが必要なあらゆるシーンで使用できます。

## 型定義

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` は Axios の `AxiosRequestConfig` をベースに拡張されています：

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // リクエスト失敗時にグローバルなエラー通知をスキップするかどうか
  skipAuth?: boolean;                                 // 認証リダイレクトをスキップするかどうか（例：401 エラー時にログインページへ遷移させない）
};
```

## 主要なパラメータ

| パラメータ | 型 | 説明 |
|------|------|------|
| `url` | string | リクエスト URL。リソース形式（例：`users:list`、`posts:create`）または完全な URL をサポートします。 |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | HTTP メソッド。デフォルトは `'get'` です。 |
| `params` | object | クエリパラメータ。URL にシリアライズされます。 |
| `data` | any | リクエストボディ。post/put/patch で使用されます。 |
| `headers` | object | カスタムリクエストヘッダー。 |
| `skipNotify` | boolean \| (error) => boolean | true または関数が true を返す場合、失敗時にグローバルなエラー通知を表示しません。 |
| `skipAuth` | boolean | true の場合、401 エラーなどで認証リダイレクト（ログインページへの遷移など）をトリガーしません。 |

## リソース形式の URL

NocoBase リソース API は、`リソース:アクション` という短縮形式をサポートしています：

| 形式 | 説明 | 例 |
|------|------|------|
| `collection:action` | 単一コレクションの CRUD | `users:list`、`users:get`、`users:create`、`posts:update` |
| `collection.relation:action` | 関連リソース（`resourceOf` または URL 経由で主キーを渡す必要があります） | `posts.comments:list` |

相対パスはアプリケーションの baseURL（通常は `/api`）と結合されます。クロスドメインの場合は完全な URL を使用し、ターゲットサービスで CORS を設定する必要があります。

## レスポンス構造

戻り値は Axios のレスポンスオブジェクトです。主なフィールドは以下の通りです：

- `response.data`：レスポンスボディ
- リスト取得 API の場合、通常は `data.data`（レコード配列）+ `data.meta`（ページネーションなど）となります。
- 1件取得/作成/更新 API の場合、多くは `data.data` が単一のレコードとなります。

## 例

### リストクエリ

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // ページネーションなどの情報
```

### データの送信

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: '張三', email: 'zhangsan@example.com' },
});

const newRecord = res?.data?.data;
```

### フィルタリングとソート

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### エラー通知のスキップ

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // 失敗時にグローバルなメッセージを表示しない
});

// またはエラータイプに応じてスキップするかどうかを決定
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### クロスドメインリクエスト

完全な URL を使用して他のドメインにリクエストする場合、ターゲットサービスで現在のアプリケーションのオリジンを許可する CORS 設定が必要です。ターゲット API に独自のトークンが必要な場合は、headers を介して渡すことができます：

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <ターゲットサービスのトークン>',
  },
});
```

### ctx.render と組み合わせた表示

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('ユーザーリスト') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## 注意事項

- **エラー処理**：リクエストが失敗すると例外がスローされ、デフォルトでグローバルなエラー通知が表示されます。`skipNotify: true` を使用することで、独自にキャッチして処理できます。
- **認証**：同一ドメインへのリクエストには、現在のユーザーの Token、locale、role が自動的に付与されます。クロスドメインの場合はターゲット側で CORS のサポートが必要であり、必要に応じて headers でトークンを渡します。
- **リソース権限**：リクエストは ACL（アクセス制御リスト）の制約を受け、現在のユーザーが権限を持つリソースにのみアクセスできます。

## 関連情報

- [ctx.message](./message.md) - リクエスト完了後に軽量なヒントを表示
- [ctx.notification](./notification.md) - リクエスト完了後に通知を表示
- [ctx.render](./render.md) - リクエスト結果をインターフェースにレンダリング
- [ctx.makeResource](./make-resource.md) - リソースオブジェクトを構築し、チェーン形式でデータをロード（直接 `ctx.request` を使用する方法との選択肢）