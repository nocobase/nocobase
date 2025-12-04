:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# APIClient

## Genel Bakış

`APIClient`, <a href="https://axios-http.com/" target="_blank">`axios`</a> üzerine kurulu bir sarmalayıcıdır ve istemci tarafında HTTP aracılığıyla NocoBase kaynak işlemlerini talep etmek için kullanılır.

### Temel Kullanım

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## Örnek Özellikleri

### `axios`

`axios` örneğidir. `axios` API'sine, örneğin `apiClient.axios.interceptors` üzerinden erişebilirsiniz.

### `auth`

İstemci tarafı kimlik doğrulama sınıfıdır, [Auth](./auth.md) bölümüne bakın.

### `storage`

İstemci tarafı depolama sınıfıdır, [Storage](./storage.md) bölümüne bakın.

## Sınıf Metotları

### `constructor()`

Yapıcı fonksiyondur, bir `APIClient` örneği oluşturur.

#### İmza

- `constructor(instance?: APIClientOptions)`

#### Tip

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

Bir HTTP isteği başlatır.

#### İmza

- `request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>`

#### Tip

```ts
type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};
```

#### Detaylar

##### AxiosRequestConfig

Genel axios istek parametreleridir. <a href="https://axios-http.com/docs/req_config" target="_blank">İstek Yapılandırması</a> bölümüne bakın.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

NocoBase kaynak işlem istek parametreleridir.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| Özellik         | Tip      | Açıklama                                                                                                                                                 |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resource`      | `string` | 1. Kaynak adı, örneğin `a`<br />2. Kaynağın ilişkili nesnesinin adı, örneğin `a.b`                                                                        |
| `resourceOf`    | `any`    | `resource` bir kaynağın ilişkili nesnesinin adı olduğunda, kaynağın birincil anahtar değeridir. Örneğin, `a.b` için `a`'nın birincil anahtar değerini temsil eder. |
| `action`        | `string` | İşlem adı                                                                                                                                                |
| `params`        | `any`    | İstek parametre nesnesi, çoğunlukla URL parametreleri. İstek gövdesi `params.values` içine yerleştirilir.                                                |
| `params.values` | `any`    | İstek gövdesi nesnesi                                                                                                                                    |

### `resource()`

NocoBase kaynak işlem metodu nesnesini döndürür.

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

#### İmza

- `resource(name: string, of?: any, headers?: AxiosRequestHeaders): IResource`

#### Tip

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

#### Detaylar

| Parametre | Tip                   | Açıklama                                                                                                                                                 |
| --------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`              | 1. Kaynak adı, örneğin `a`<br />2. Kaynağın ilişkili nesnesinin adı, örneğin `a.b`                                                                        |
| `of`      | `any`                 | `name` bir kaynağın ilişkili nesnesinin adı olduğunda, kaynağın birincil anahtar değeridir. Örneğin, `a.b` için `a`'nın birincil anahtar değerini temsil eder. |
| `headers` | `AxiosRequestHeaders` | Sonraki kaynak işlem isteklerine dahil edilecek HTTP başlıkları.                                                                                         |