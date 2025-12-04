:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# APIClient

## Tổng quan

`APIClient` là một lớp bao bọc (wrapper) dựa trên <a href="https://axios-http.com/" target="_blank">`axios`</a>, được sử dụng để gửi các yêu cầu thao tác tài nguyên của NocoBase từ phía client thông qua HTTP.

### Cách sử dụng cơ bản

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## Thuộc tính của thể hiện (Instance Properties)

### `axios`

Thể hiện `axios`, cho phép truy cập các API của `axios`, ví dụ như `apiClient.axios.interceptors`.

### `auth`

Lớp xác thực phía client, tham khảo [Auth](./auth.md).

### `storage`

Lớp lưu trữ phía client, tham khảo [Storage](./storage.md).

## Phương thức của lớp (Class Methods)

### `constructor()`

Hàm khởi tạo, dùng để tạo một thể hiện `APIClient`.

#### Chữ ký

- `constructor(instance?: APIClientOptions)`

#### Kiểu dữ liệu

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

Gửi một yêu cầu HTTP.

#### Chữ ký

- `request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>`

#### Kiểu dữ liệu

```ts
type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};
```

#### Chi tiết

##### AxiosRequestConfig

Các tham số yêu cầu `axios` chung. Tham khảo <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

Các tham số yêu cầu thao tác tài nguyên của NocoBase.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| Thuộc tính      | Kiểu dữ liệu | Mô tả