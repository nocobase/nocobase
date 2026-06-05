:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# APIClient

## Überblick

`APIClient` basiert auf <a href="https://axios-http.com/" target="_blank">`axios`</a> und wird verwendet, um clientseitig über HTTP NocoBase-Ressourcenoperationen anzufordern.

### Grundlegende Verwendung

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## Instanzeigenschaften

### `axios`

Die `axios`-Instanz, über die Sie auf die `axios`-API zugreifen können, zum Beispiel `apiClient.axios.interceptors`.

### `auth`

Die clientseitige Authentifizierungsklasse, siehe [Auth](./auth.md).

### `storage`

Die clientseitige Speicherklasse, siehe [Storage](./storage.md).

## Klassenmethoden

### `constructor()`

Der Konstruktor erstellt eine `APIClient`-Instanz.

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

Startet eine HTTP-Anfrage.

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

#### Details

##### AxiosRequestConfig

Allgemeine `axios`-Anfrageparameter. Siehe <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

NocoBase-Ressourcenoperations-Anfrageparameter.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| Eigenschaft       | Typ      | Beschreibung                                                                                                                                              |
| :---------------- | :------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resource`        | `string` | 1. Ressourcenname, z. B. `a`<br />2. Name des verknüpften Objekts der Ressource, z. B. `a.b`                                                                |
| `resourceOf`      | `any`    | Wenn `resource` der Name des verknüpften Objekts der Ressource ist, ist dies der Primärschlüsselwert der Ressource. Zum Beispiel bei `a.b` repräsentiert es den Primärschlüsselwert von `a`. |
| `action`          | `string` | Name der Operation                                                                                                                                        |
| `params`          | `any`    | Anfrageparameterobjekt, hauptsächlich URL-Parameter. Der Anfragekörper wird in `params.values` platziert.                                                 |
| `params.values`   | `any`    | Anfragekörperobjekt                                                                                                                                       |

### `resource()`

Ruft das NocoBase-Ressourcenoperationsmethodenobjekt ab.

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

#### Details

| Parameter | Typ                   | Beschreibung                                                                                                                                              |
| :-------- | :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`              | 1. Ressourcenname, z. B. `a`<br />2. Name des verknüpften Objekts der Ressource, z. B. `a.b`                                                                |
| `of`      | `any`                 | Wenn `name` der Name des verknüpften Objekts der Ressource ist, ist dies der Primärschlüsselwert der Ressource. Zum Beispiel bei `a.b` repräsentiert es den Primärschlüsselwert von `a`. |
| `headers` | `AxiosRequestHeaders` | HTTP-Header, die in nachfolgenden Ressourcenoperationsanfragen mitgesendet werden sollen.                                                                 |