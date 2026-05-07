:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/resource/api-resource)をご参照ください。
:::

# APIResource

URLに基づいてリクエストを発行する**汎用 API リソース**です。あらゆる HTTP インターフェースに適しています。`FlowResource` 基底クラスを継承し、リクエスト設定と `refresh()` を拡張しています。[MultiRecordResource](./multi-record-resource.md) や [SingleRecordResource](./single-record-resource.md) とは異なり、APIResource はリソース名に依存せず、URL で直接リクエストを行うため、カスタムインターフェースやサードパーティ API などのシナリオに適しています。

**作成方法**: `ctx.makeResource('APIResource')` または `ctx.initResource('APIResource')`。使用前に `setURL()` を設定する必要があります。RunJS コンテキストでは `ctx.api` (APIClient) が自動的に注入されるため、手動で `setAPIClient` を呼び出す必要はありません。

---

## 適用シーン

| シナリオ | 説明 |
|------|------|
| **カスタムインターフェース** | 非標準のリソース API（例：`/api/custom/stats`、`/api/reports/summary`）の呼び出し |
| **サードパーティ API** | 完全な URL を介した外部サービスへのリクエスト（ターゲット側で CORS のサポートが必要） |
| **使い捨てのクエリ** | データを一時的に取得し、使い終わったら破棄する場合。`ctx.resource` にバインドする必要がない |
| **ctx.request との使い分け** | リアクティブなデータ、イベント、エラー状態が必要な場合は APIResource を使用し、単純な一回限りのリクエストには `ctx.request()` を使用します |

---

## 基底クラスの機能（FlowResource）

すべての Resource は以下の機能を備えています：

| メソッド | 説明 |
|------|------|
| `getData()` | 現在のデータを取得 |
| `setData(value)` | データを設定（ローカルのみ） |
| `hasData()` | データが存在するかどうか |
| `getMeta(key?)` / `setMeta(meta)` | メタデータの読み書き |
| `getError()` / `setError(err)` / `clearError()` | エラー状態の管理 |
| `on(event, callback)` / `once` / `off` / `emit` | イベントの購読と発行 |

---

## リクエスト設定

| メソッド | 説明 |
|------|------|
| `setAPIClient(api)` | APIClient インスタンスを設定（RunJS では通常、コンテキストから自動注入されます） |
| `getURL()` / `setURL(url)` | リクエスト URL |
| `loading` | ローディング状態の読み書き（get/set） |
| `clearRequestParameters()` | リクエストパラメータをクリア |
| `setRequestParameters(params)` | リクエストパラメータをマージして設定 |
| `setRequestMethod(method)` | リクエストメソッドを設定（例：`'get'`、`'post'`。デフォルトは `'get'`） |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | リクエストヘッダー |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | 単一パラメータの追加・削除・取得 |
| `setRequestBody(data)` | リクエストボディ（POST/PUT/PATCH 時に使用） |
| `setRequestOptions(key, value)` / `getRequestOptions()` | 共通のリクエストオプション |

---

## URL 形式

- **リソーススタイル**: NocoBase のリソース短縮表記（例：`users:list`、`posts:get`）をサポートしており、baseURL と結合されます。
- **相対パス**: 例：`/api/custom/endpoint`。アプリケーションの baseURL と結合されます。
- **完全な URL**: クロスドメインの場合は完全なアドレスを使用します。ターゲット側で CORS の設定が必要です。

---

## データ取得

| メソッド | 説明 |
|------|------|
| `refresh()` | 現在の URL、メソッド、パラメータ、ヘッダー、データに基づいてリクエストを発行し、レスポンスの `data` を `setData(data)` に書き込み、`'refresh'` イベントをトリガーします。失敗した場合は `setError(err)` を設定して `ResourceError` をスローし、`refresh` イベントはトリガーしません。`api` と URL が設定されている必要があります。 |

---

## 実行例

### 基本的な GET リクエスト

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### リソーススタイルの URL

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### POST リクエスト（リクエストボディ付き）

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'テスト', type: 'report' });
await res.refresh();
const result = res.getData();
```

### refresh イベントのリスニング

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>統計: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### エラーハンドリング

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'リクエストに失敗しました');
}
```

### カスタムリクエストヘッダー

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## 注意事項

- **ctx.api への依存**: RunJS では `ctx.api` が実行環境によって注入されるため、通常は手動で `setAPIClient` を行う必要はありません。コンテキストのない環境で使用する場合は、自身で設定する必要があります。
- **refresh はリクエストの実行**: `refresh()` は現在の設定に従ってリクエストを 1 回発行します。メソッド、パラメータ、データなどは呼び出し前に設定しておく必要があります。
- **エラー時はデータを更新しない**: リクエスト失敗時、`getData()` は元の値を保持します。エラー情報は `getError()` で取得できます。
- **ctx.request との比較**: 単純な一回限りのリクエストには `ctx.request()` を使用できます。リアクティブなデータ、イベント、エラー状態の管理が必要な場合は APIResource を使用してください。

---

## 関連情報

- [ctx.resource](../context/resource.md) - 現在のコンテキストにおける resource インスタンス
- [ctx.initResource()](../context/init-resource.md) - 初期化して ctx.resource にバインドする
- [ctx.makeResource()](../context/make-resource.md) - 新しい resource インスタンスを作成する（バインドしない）
- [ctx.request()](../context/request.md) - 汎用 HTTP リクエスト。単純な一回限りの呼び出しに適しています
- [MultiRecordResource](./multi-record-resource.md) - データテーブル/リスト向け。CRUD やページネーションをサポート
- [SingleRecordResource](./single-record-resource.md) - 単一レコード向け