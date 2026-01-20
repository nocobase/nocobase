:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# APIClient

## Översikt

`APIClient` är en inkapsling baserad på <a href="https://axios-http.com/" target="_blank">`axios`</a>, som används för att begära NocoBase resursåtgärder på klientsidan via HTTP.

### Grundläggande användning

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## Instansegenskaper

### `axios`

`axios`-instansen, som ger åtkomst till `axios`-API:et, till exempel `apiClient.axios.interceptors`.

### `auth`

Klientsidans autentiseringsklass, se [Auth](./auth.md).

### `storage`

Klientsidans lagringsklass, se [Storage](./storage.md).

## Klassmetoder

### `constructor()`

Konstruktor, skapar en `APIClient`-instans.

#### Signatur

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

Skickar en HTTP-förfrågan.

#### Signatur

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

#### Detaljer

##### AxiosRequestConfig

Allmänna `axios`-förfrågningsparametrar. Se <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

Parametrar för NocoBase resursåtgärdsförfrågningar.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| Egenskap        | Typ     | Beskrivning                                                                                                                                              |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resource`      | `string` | 1. Resursnamn, t.ex. `a`<br />2. Namn på resursens associerade objekt, t.ex. `a.b`                                                                       |
| `resourceOf`    | `any`    | När `resource` är namnet på resursens associerade objekt, är det resursens primärnyckelvärde. Till exempel, för `a.b` representerar det primärnyckelvärdet för `a`. |
| `action`        | `string` | Åtgärdsnamn                                                                                                                                              |
| `params`        | `any`    | Förfrågningsparameterobjekt, främst URL-parametrar. Förfrågningskroppen placeras i `params.values`.                                                      |
| `params.values` | `any`    | Förfrågningskroppsobjekt                                                                                                                                 |

### `resource()`

Hämtar NocoBase resursåtgärdsmetodobjektet.

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

#### Signatur

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

#### Detaljer

| Parameter | Typ                  | Beskrivning                                                                                                                                              |
| --------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`             | 1. Resursnamn, t.ex. `a`<br />2. Namn på resursens associerade objekt, t.ex. `a.b`                                                                       |
| `of`      | `any`                | När `name` är namnet på resursens associerade objekt, är det resursens primärnyckelvärde. Till exempel, för `a.b` representerar det primärnyckelvärdet för `a`. |
| `headers` | `AxiosRequestHeaders`| HTTP-huvuden att inkludera i efterföljande resursåtgärdsförfrågningar.                                                                                   |