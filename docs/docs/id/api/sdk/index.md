:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# APIClient

## Gambaran Umum

`APIClient` adalah *wrapper* berbasis <a href="https://axios-http.com/" target="_blank">`axios`</a>, yang digunakan untuk meminta tindakan sumber daya NocoBase di sisi klien melalui HTTP.

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

## Properti Instans

### `axios`

Instans `axios`, yang dapat digunakan untuk mengakses API `axios`, contohnya `apiClient.axios.interceptors`.

### `auth`

Kelas autentikasi sisi klien, lihat [Auth](./auth.md).

### `storage`

Kelas penyimpanan sisi klien, lihat [Storage](./storage.md).

## Metode Kelas

### `constructor()`

*Constructor*, membuat sebuah instans `APIClient`.

#### Tanda Tangan

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

Memulai permintaan HTTP.

#### Tanda Tangan

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

Parameter permintaan axios umum. Lihat <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

Parameter permintaan tindakan sumber daya NocoBase.

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
| `resource` | `string` | 1. Nama sumber daya, contohnya `a`<br />2. Nama objek terkait dari sumber daya, contohnya `a.b` |
| `resourceOf` | `any` | Ketika `resource` adalah nama objek terkait dari sumber daya, ini adalah nilai *primary key* dari sumber daya tersebut. Contohnya, untuk `a.b`, ini mewakili nilai *primary key* dari `a`. |
| `action` | `string` | Nama tindakan |
| `params` | `any` | Objek parameter permintaan, terutama parameter URL. *Request body* ditempatkan di `params.values`. |
| `params.values` | `any` | Objek *request body* |

### `resource()`

Mendapatkan objek metode tindakan sumber daya NocoBase.

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

#### Tanda Tangan

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

| Parameter | Tipe | Deskripsi |
| --------- | --------------------- | ------------------------------------------------------------------------------------ |
| `name` | `string` | 1. Nama sumber daya, contohnya `a`<br />2. Nama objek terkait dari sumber daya, contohnya `a.b` |
| `of` | `any` | Ketika `name` adalah nama objek terkait dari sumber daya, ini adalah nilai *primary key* dari sumber daya tersebut. Contohnya, untuk `a.b`, ini mewakili nilai *primary key* dari `a`. |
| `headers` | `AxiosRequestHeaders` | *Header* HTTP yang akan disertakan dalam permintaan tindakan sumber daya berikutnya. |