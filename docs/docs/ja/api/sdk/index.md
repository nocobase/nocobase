:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# APIClient

## 概要

`APIClient` は、<a href="https://axios-http.com/" target="_blank">`axios`</a> をベースにラップされており、クライアント側でHTTP経由でNocoBaseの**リソース操作**をリクエストするために使用されます。

### 基本的な使い方

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## インスタンスプロパティ

### `axios`

`axios` インスタンスです。`apiClient.axios.interceptors` のように、`axios` API にアクセスできます。

### `auth`

クライアント認証クラスです。[Auth](./auth.md) を参照してください。

### `storage`

クライアントストレージクラスです。[Storage](./storage.md) を参照してください。

## クラスメソッド

### `constructor()`

コンストラクタです。`APIClient` インスタンスを作成します。

#### シグネチャ

- `constructor(instance?: APIClientOptions)`

#### 型

```ts
interface ExtendedOptions {
  authClass?: any;
  storageClass?: any;
}

export type APIClientOptions =
  | AxiosInstance
  | (AxiosRequestConfig & ExtendedOptions);
```

### `request()`

HTTP リクエストを送信します。

#### シグネチャ

- `request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>`

#### 型

```ts
type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};
```

#### 詳細

##### AxiosRequestConfig

一般的な `axios` のリクエストパラメータです。<a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a> を参照してください。

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

NocoBase の**リソース操作**リクエストパラメータです。

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| プロパティ        | 型     | 説明                                                                                                 |
| --------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `resource`      | `string` | 1. リソース名 (例: `a`)<br />2. リソースの関連オブジェクト名 (例: `a.b`)                             |
| `resourceOf`    | `any`    | `resource` がリソースの関連オブジェクト名の場合、そのリソースの主キー値です。例えば `a.b` の場合、`a` の主キー値を表します。 |
| `action`        | `string` | アクション名                                                                                         |
| `params`        | `any`    | リクエストパラメータオブジェクトです。主にURLパラメータで、リクエストボディは `params.values` に格納されます。 |
| `params.values` | `any`    | リクエストボディオブジェクト                                                                         |

### `resource()`

NocoBase の**リソース操作**メソッドオブジェクトを取得します。

```ts
const resource = apiClient.resource('users');

await resource.create({
  values: {
    username: 'admin',
  },
});

const res = await resource.list({
  page: 2,
  pageSize: 20,
});
```

#### シグネチャ

- `resource(name: string, of?: any, headers?: AxiosRequestHeaders): IResource`

#### 型

```ts
export interface ActionParams {
  filterByTk?: any;
  [key: string]: any;
}

type ResourceAction = (params?: ActionParams) => Promise<any>;

export type IResource = {
  [key: string]: ResourceAction;
};
```

#### 詳細

| パラメータ名    | 型                  | 説明                                                                                                 |
| --------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `name`    | `string`              | 1. リソース名 (例: `a`)<br />2. リソースの関連オブジェクト名 (例: `a.b`)                             |
| `of`      | `any`                 | `name` がリソースの関連オブジェクト名の場合、そのリソースの主キー値です。例えば `a.b` の場合、`a` の主キー値を表します。 |
| `headers` | `AxiosRequestHeaders` | 後続の**リソース操作**リクエストを送信する際に付加するHTTPリクエストヘッダーです。                     |