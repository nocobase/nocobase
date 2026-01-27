# APIClient

## Overview

`APIClient` is a wrapper based on <a href="https://axios-http.com/" target="_blank">`axios`</a>, used to request NocoBase resource actions on the client side via HTTP.

### Basic Usage

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## Instance Properties

### `axios`

The `axios` instance, which can be used to access the `axios` API, for example, `apiClient.axios.interceptors`.

### `auth`

Client-side authentication class, see [Auth](./auth.md).

### `storage`

Client-side storage class, see [Storage](./storage.md).

## Class Methods

### `constructor()`

Constructor, creates an `APIClient` instance.

#### Signature

- `constructor(instance?: APIClientOptions)`

#### Type

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

Initiates an HTTP request.

#### Signature

- `request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>`

#### Type

```ts
type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};
```

#### Details

##### AxiosRequestConfig

General axios request parameters. See <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

NocoBase resource action request parameters.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| Property        | Type     | Description                                                                                                                                              |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resource`      | `string` | 1. Resource name, e.g., `a`<br />2. Name of the resource's associated object, e.g., `a.b`                                                                |
| `resourceOf`    | `any`    | When `resource` is the name of the resource's associated object, it is the primary key value of the resource. For example, for `a.b`, it represents the primary key value of `a`. |
| `action`        | `string` | Action name                                                                                                                                              |
| `params`        | `any`    | Request parameter object, mainly URL parameters. The request body is placed in `params.values`.                                                          |
| `params.values` | `any`    | Request body object                                                                                                                                      |

### `resource()`

Gets the NocoBase resource action method object.

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

#### Signature

- `resource(name: string, of?: any, headers?: AxiosRequestHeaders): IResource`

#### Type

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

#### Details

| Parameter | Type                  | Description                                                                                                                                              |
| --------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`              | 1. Resource name, e.g., `a`<br />2. Name of the resource's associated object, e.g., `a.b`                                                                |
| `of`      | `any`                 | When `name` is the name of the resource's associated object, it is the primary key value of the resource. For example, for `a.b`, it represents the primary key value of `a`. |
| `headers` | `AxiosRequestHeaders` | HTTP headers to include in subsequent resource action requests.                                                                                          |