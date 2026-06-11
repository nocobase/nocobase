---
title: "APIClient"
description: "APIClient SDK frontend NocoBase: HTTP request, Auth, Storage, memanggil API backend."
keywords: "APIClient,SDK,HTTP request,API frontend,Auth,Storage,NocoBase"
---

# APIClient

## Ikhtisar

`APIClient` di-wrap berdasarkan <a href="https://axios-http.com/" target="_blank">`axios`</a>, digunakan untuk melakukan request operasi resource NocoBase melalui HTTP di sisi client.

### Penggunaan Dasar

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## Properti Instance

### `axios`

Instance `axios`, dapat mengakses API `axios`, contoh `apiClient.axios.interceptors`.

### `auth`

Class autentikasi client, lihat [Auth](./auth.md).

### `storage`

Class storage client, lihat [Storage](./storage.md).

## Method Class

### `constructor()`

Constructor, membuat instance `APIClient`.

#### Signature

- `constructor(instance?: APIClientOptions)`

#### Tipe

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

Melakukan HTTP request.

#### Signature

- `request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>`

#### Tipe

```ts
type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};
```

#### Detail

##### AxiosRequestConfig

Parameter request axios umum. Lihat <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

Parameter request operasi resource NocoBase.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| Properti | Tipe | Deskripsi |
| --------------- | -------- | ------------------------------------------------------------------------------------ |
| `resource` | `string` | 1. Nama resource, contoh `a`<br />2. Nama objek asosiasi resource, contoh `a.b` |
| `resourceOf` | `any` | Saat `resource` adalah nama objek asosiasi, primary key dari resource. Contoh saat `a.b`, mewakili primary key dari `a` |
| `action` | `string` | Nama operasi |
| `params` | `any` | Objek parameter request, terutama parameter URL, request body diletakkan di `params.values` |
| `params.values` | `any` | Objek request body |

### `resource()`

Mendapatkan objek method operasi resource NocoBase.

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

#### Tipe

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

#### Detail

| Nama Parameter | Tipe | Deskripsi |
| --------- | --------------------- | ------------------------------------------------------------------------------------ |
| `name` | `string` | 1. Nama resource, contoh `a`<br />2. Nama objek asosiasi resource, contoh `a.b` |
| `of` | `any` | Saat `resource` adalah nama objek asosiasi, primary key dari resource. Contoh saat `a.b`, mewakili primary key dari `a` |
| `headers` | `AxiosRequestHeaders` | HTTP request header yang dibawa saat melakukan request operasi resource selanjutnya |
