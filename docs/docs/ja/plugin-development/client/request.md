:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# リクエスト

NocoBase は、[Axios](https://axios-http.com/) をベースにした `APIClient` を提供しており、`Context` を取得できるあらゆる場所から HTTP リクエストを発行できます。

`Context` を取得できる一般的な場所は以下の通りです。

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` は、最もよく使われるリクエスト発行メソッドです。その引数と戻り値は、[axios.request()](https://axios-http.com/docs/req_config) と完全に同じです。

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

基本的な使い方

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

標準的な Axios のリクエスト設定をそのまま使用できます。

```ts
await ctx.api.request({
  url: 'users:create',
  method: 'post',
  data: {
    name: 'Tao Tao',
  },
});
```

## ctx.api.axios

`ctx.api.axios` は `AxiosInstance` のインスタンスで、これを使ってグローバルなデフォルト設定を変更したり、リクエストインターセプターを追加したりできます。

デフォルト設定の変更

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

利用可能な設定の詳細については、[Axios のデフォルト設定](https://axios-http.com/docs/config_defaults) を参照してください。

## リクエストとレスポンスのインターセプター

インターセプターを使用すると、リクエストが送信される前やレスポンスが返された後に処理を実行できます。例えば、リクエストヘッダーの一括追加、パラメーターのシリアライズ、エラー通知の一元化などが可能です。

### リクエストインターセプターの例

```ts
// qs を使用して params パラメーターをシリアライズ
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// カスタムリクエストヘッダー
axios.interceptors.request.use((config) => {
  config.headers['Authorization'] = `Bearer token123`;
  config.headers['X-Hostname'] = 'localhost';
  config.headers['X-Timezone'] = '+08:00';
  config.headers['X-Locale'] = 'zh-CN';
  config.headers['X-Role'] = 'admin';
  config.headers['X-Authenticator'] = 'basic';
  config.headers['X-App'] = 'sub1';
  return config;
});
```

### レスポンスインターセプターの例

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // リクエストエラー発生時に、統一された通知を表示
    ctx.notification.error({
      message: 'リクエスト応答エラー',
    });
    return Promise.reject(error);
  },
);
```

## NocoBase Server のカスタムリクエストヘッダー

NocoBase Server がサポートするカスタムリクエストヘッダーは以下の通りで、マルチアプリケーション、国際化、多ロール、または多認証のシナリオで使用できます。

| Header | 説明 |
|--------|------|
| `X-App` | マルチアプリケーションシナリオで現在アクセスしているアプリケーションを指定します |
| `X-Locale` | 現在の言語（例：`zh-CN`、`en-US`） |
| `X-Hostname` | クライアントのホスト名 |
| `X-Timezone` | クライアントのタイムゾーン（例：`+08:00`） |
| `X-Role` | 現在のロール |
| `X-Authenticator` | 現在のユーザー認証方式 |

> 💡 **ヒント**  
> これらのリクエストヘッダーは通常、インターセプターによって自動的に注入されるため、手動で設定する必要はありません。テスト環境やマルチインスタンスシナリオなどの特殊な場合にのみ、手動で追加する必要があります。

## コンポーネントでの使用

React コンポーネントでは、`useFlowContext()` を介してコンテキストオブジェクトを取得し、`ctx.api` を呼び出してリクエストを発行できます。

```ts
import { useFlowContext } from '@nocobase/client';

const MyComponent = () => {
  const ctx = useFlowContext();

  const fetchData = async () => {
    const response = await ctx.api.request({
      url: '/api/posts',
      method: 'get',
    });
    console.log(response.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return <div>読み込み中...</div>;
};
```

### ahooks の `useRequest` と組み合わせて使用する

実際の開発では、[ahooks](https://ahooks.js.org/hooks/use-request/index) が提供する `useRequest` Hook と組み合わせることで、リクエストのライフサイクルと状態をより便利に処理できます。

```ts
import { useFlowContext } from '@nocobase/client';
import { useRequest } from 'ahooks';

const MyComponent = () => {
  const ctx = useFlowContext();

  const { data, loading, error, refresh } = useRequest(() =>
    ctx.api.request({
      url: 'posts:list',
      method: 'get',
    }),
  );

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>リクエストエラー: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>更新</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

このアプローチにより、リクエストロジックがより宣言的になり、読み込み状態、エラー処理、更新ロジックが自動的に管理されます。これはコンポーネントでの使用に非常に適しています。