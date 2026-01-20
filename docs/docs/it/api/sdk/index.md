:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# APIClient

## Panoramica

`APIClient` è un wrapper basato su <a href="https://axios-http.com/" target="_blank">`axios`</a>, utilizzato per effettuare richieste HTTP per le operazioni sulle risorse di NocoBase lato client.

### Utilizzo di base

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## Proprietà dell'istanza

### `axios`

L'istanza di `axios`, che può essere utilizzata per accedere all'API di `axios`, ad esempio `apiClient.axios.interceptors`.

### `auth`

Classe di autenticazione lato client, vedere [Auth](./auth.md).

### `storage`

Classe di storage lato client, vedere [Storage](./auth.md).

## Metodi di classe

### `constructor()`

Costruttore, crea un'istanza di `APIClient`.

#### Firma

- `constructor(instance?: APIClientOptions)`

#### Tipo

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

Inizia una richiesta HTTP.

#### Firma

- `request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>`

#### Tipo

```ts
type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};
```

#### Dettagli

##### AxiosRequestConfig

Parametri di richiesta generici di axios. Vedere <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

Parametri di richiesta per le operazioni sulle risorse di NocoBase.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| Proprietà       | Tipo     | Descrizione                                                                                                                                              |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resource`      | `string` | 1. Nome della risorsa, ad es. `a`<br />2. Nome dell'oggetto associato alla risorsa, ad es. `a.b`                                                        |
| `resourceOf`    | `any`    | Quando `resource` è il nome dell'oggetto associato alla risorsa, rappresenta il valore della chiave primaria della risorsa. Ad esempio, per `a.b`, rappresenta il valore della chiave primaria di `a`. |
| `action`        | `string` | Nome dell'azione                                                                                                                                              |
| `params`        | `any`    | Oggetto dei parametri della richiesta, principalmente parametri URL. Il corpo della richiesta viene inserito in `params.values`.                           |
| `params.values` | `any`    | Oggetto del corpo della richiesta                                                                                                                                      |

### `resource()`

Ottiene l'oggetto del metodo per le operazioni sulle risorse di NocoBase.

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

#### Firma

- `resource(name: string, of?: any, headers?: AxiosRequestHeaders): IResource`

#### Tipo

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

#### Dettagli

| Parametro | Tipo                  | Descrizione                                                                                                                                              |
| --------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`              | 1. Nome della risorsa, ad es. `a`<br />2. Nome dell'oggetto associato alla risorsa, ad es. `a.b`                                                        |
| `of`      | `any`                 | Quando `name` è il nome dell'oggetto associato alla risorsa, rappresenta il valore della chiave primaria della risorsa. Ad esempio, per `a.b`, rappresenta il valore della chiave primaria di `a`. |
| `headers` | `AxiosRequestHeaders` | Header HTTP da includere nelle successive richieste di operazioni sulle risorse.                                                                                          |