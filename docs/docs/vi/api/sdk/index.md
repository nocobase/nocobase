---
title: "APIClient"
description: "APIClient trong SDK frontend của NocoBase: HTTP request, Auth, Storage, gọi API backend."
keywords: "APIClient,SDK,HTTP request,API frontend,Auth,Storage,NocoBase"
---

# APIClient

## Tổng quan

`APIClient` được đóng gói trên nền <a href="https://axios-http.com/" target="_blank">`axios`</a>, dùng để gửi các thao tác tài nguyên đến NocoBase qua HTTP từ phía client.

### Cách dùng cơ bản

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## Thuộc tính của instance

### `axios`

Instance `axios`, có thể truy cập API của `axios`, ví dụ `apiClient.axios.interceptors`.

### `auth`

Lớp xác thực phía client, tham khảo [Auth](./auth.md).

### `storage`

Lớp lưu trữ phía client, tham khảo [Storage](./storage.md).

## Phương thức của lớp

### `constructor()`

Constructor, tạo một instance `APIClient`.

#### Chữ ký

- `constructor(instance?: APIClientOptions)`

#### Kiểu

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

Gửi HTTP request.

#### Chữ ký

- `request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>`

#### Kiểu

```ts
type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};
```

#### Thông tin chi tiết

##### AxiosRequestConfig

Tham số request thông thường của axios. Tham khảo <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

Tham số request thao tác tài nguyên của NocoBase.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| Thuộc tính      | Kiểu     | Mô tả                                                                                                       |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `resource`      | `string` | 1. Tên tài nguyên, ví dụ `a`<br />2. Tên đối tượng quan hệ của tài nguyên, ví dụ `a.b`                       |
| `resourceOf`    | `any`    | Khi `resource` là tên đối tượng quan hệ của tài nguyên, đây là khóa chính của tài nguyên. Ví dụ với `a.b`, đây là khóa chính của `a` |
| `action`        | `string` | Tên thao tác                                                                                                 |
| `params`        | `any`    | Đối tượng tham số request, chủ yếu là tham số URL. Body request đặt trong `params.values`                   |
| `params.values` | `any`    | Đối tượng body request                                                                                      |

### `resource()`

Lấy đối tượng phương thức thao tác tài nguyên của NocoBase.

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

#### Chữ ký

- `resource(name: string, of?: any, headers?: AxiosRequestHeaders): IResource`

#### Kiểu

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

#### Thông tin chi tiết

| Tên tham số | Kiểu                  | Mô tả                                                                                                       |
| ----------- | --------------------- | ----------------------------------------------------------------------------------------------------------- |
| `name`      | `string`              | 1. Tên tài nguyên, ví dụ `a`<br />2. Tên đối tượng quan hệ của tài nguyên, ví dụ `a.b`                       |
| `of`        | `any`                 | Khi `resource` là tên đối tượng quan hệ của tài nguyên, đây là khóa chính của tài nguyên. Ví dụ với `a.b`, đây là khóa chính của `a` |
| `headers`   | `AxiosRequestHeaders` | HTTP request header sẽ được mang theo trong các request thao tác tài nguyên sau này                          |
