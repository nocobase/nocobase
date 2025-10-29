# APIClient

## 概览

`APIClient` 基于 <a href="https://axios-http.com/" target="_blank">`axios`</a> 封装，用于在客户端通过 HTTP， 请求 NocoBase 的资源操作。

### 基本使用

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## 实例属性

### `axios`

`axios` 实例，可以访问 `axios` API, 比如 `apiClient.axios.interceptors`.

### `auth`

客户端鉴权类，参考 [Auth](./auth.md).

### `storage`

客户端存储类，参考 [Storage](./storage.md).

## 类方法

### `constructor()`

构造函数，创建一个 `APIClient` 实例。

#### 签名

- `constructor(instance?: APIClientOptions)`

#### 类型

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

发起 HTTP 请求。

#### 签名

- `request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>`

#### 类型

```ts
type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};
```

#### 详细信息

##### AxiosRequestConfig

通用的 axios 请求参数。参考 <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

NocoBase 资源操作请求参数。

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| 属性            | 类型     | 描述                                                                                 |
| --------------- | -------- | ------------------------------------------------------------------------------------ |
| `resource`      | `string` | 1. 资源名称，比如 `a`<br />2. 资源的关联对象名称，比如 `a.b`                         |
| `resourceOf`    | `any`    | 当 `resource` 为资源的关联对象名称时，资源的主键值。比如 `a.b` 时，代表 `a` 的主键值 |
| `action`        | `string` | 操作名称                                                                             |
| `params`        | `any`    | 请求参数对象，主要是 URL 参数，请求体放到 `params.values` 中                         |
| `params.values` | `any`    | 请求体对象                                                                           |

### `resource()`

获取 NocoBase 资源操作方法对象。

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

#### 签名

- `resource(name: string, of?: any, headers?: AxiosRequestHeaders): IResource`

#### 类型

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

#### 详细信息

| 参数名    | 类型                  | 描述                                                                                 |
| --------- | --------------------- | ------------------------------------------------------------------------------------ |
| `name`    | `string`              | 1. 资源名称，比如 `a`<br />2. 资源的关联对象名称，比如 `a.b`                         |
| `of`      | `any`                 | 当 `resource` 为资源的关联对象名称时，资源的主键值。比如 `a.b` 时，代表 `a` 的主键值 |
| `headers` | `AxiosRequestHeaders` | 后续要发起资源操作请求时，携带的 HTTP 请求头                                         |
