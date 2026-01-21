:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# APIClient

## Przegląd

`APIClient` to klasa opakowująca, oparta na bibliotece <a href="https://axios-http.com/" target="_blank">`axios`</a>, służąca do wykonywania operacji na zasobach NocoBase po stronie klienta, za pośrednictwem protokołu HTTP.

### Podstawowe użycie

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## Właściwości instancji

### `axios`

Instancja `axios`, umożliwiająca dostęp do API `axios`, na przykład `apiClient.axios.interceptors`.

### `auth`

Klasa do uwierzytelniania po stronie klienta, zobacz [Uwierzytelnianie](./auth.md).

### `storage`

Klasa do przechowywania danych po stronie klienta, zobacz [Przechowywanie Danych](./storage.md).

## Metody klasy

### `constructor()`

Konstruktor, tworzy instancję `APIClient`.

#### Sygnatura

- `constructor(instance?: APIClientOptions)`

#### Typ

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

Wykonuje żądanie HTTP.

#### Sygnatura

- `request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>`

#### Typ

```ts
type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};
```

#### Szczegóły

##### AxiosRequestConfig

Ogólne parametry żądania axios. Zobacz <a href="https://axios-http.com/docs/req_config" target="_blank">Konfiguracja Żądania</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

Parametry żądania operacji na zasobach NocoBase.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| Właściwość      | Typ      | Opis                                                                                                                                              |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resource`      | `string` | 1. Nazwa zasobu, np. `a`<br />2. Nazwa powiązanego obiektu zasobu, np. `a.b`                                                                |
| `resourceOf`    | `any`    | Gdy `resource` jest nazwą powiązanego obiektu zasobu, jest to wartość klucza podstawowego zasobu. Na przykład, dla `a.b`, reprezentuje wartość klucza podstawowego `a`. |
| `action`        | `string` | Nazwa akcji                                                                                                                                              |
| `params`        | `any`    | Obiekt parametrów żądania, głównie parametry URL. Treść żądania umieszczana jest w `params.values`.                                                          |
| `params.values` | `any`    | Obiekt treści żądania                                                                                                                                      |

### `resource()`

Pobiera obiekt metod operacji na zasobach NocoBase.

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

#### Sygnatura

- `resource(name: string, of?: any, headers?: AxiosRequestHeaders): IResource`

#### Typ

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

#### Szczegóły

| Parametr  | Typ                   | Opis                                                                                                                                              |
| --------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`              | 1. Nazwa zasobu, np. `a`<br />2. Nazwa powiązanego obiektu zasobu, np. `a.b`                                                                |
| `of`      | `any`                 | Gdy `name` jest nazwą powiązanego obiektu zasobu, jest to wartość klucza podstawowego zasobu. Na przykład, dla `a.b`, reprezentuje wartość klucza podstawowego `a`. |
| `headers` | `AxiosRequestHeaders` | Nagłówki HTTP do dołączenia do kolejnych żądań operacji na zasobach.                                                                                          |