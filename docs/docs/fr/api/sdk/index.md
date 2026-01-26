:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# APIClient

## Aperçu

`APIClient` est une surcouche basée sur <a href="https://axios-http.com/" target="_blank">`axios`</a>, utilisée pour effectuer des opérations sur les ressources NocoBase côté client via HTTP.

### Utilisation de base

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## Propriétés d'instance

### `axios`

L'instance `axios`, qui vous permet d'accéder à l'API `axios`, par exemple `apiClient.axios.interceptors`.

### `auth`

Classe d'authentification côté client, voir [Auth](./auth.md).

### `storage`

Classe de stockage côté client, voir [Storage](./storage.md).

## Méthodes de classe

### `constructor()`

Constructeur, crée une instance de `APIClient`.

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

Effectue une requête HTTP.

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

#### Détails

##### AxiosRequestConfig

Paramètres de requête `axios` génériques. Voir <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

Paramètres de requête pour les opérations sur les ressources NocoBase.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| Propriété       | Type     | Description                                                                                                                                              |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resource`      | `string` | 1. Nom de la ressource, par exemple `a`<br />2. Nom de l'objet associé à la ressource, par exemple `a.b`                                                  |
| `resourceOf`    | `any`    | Lorsque `resource` est le nom de l'objet associé à la ressource, il s'agit de la valeur de la clé primaire de la ressource. Par exemple, pour `a.b`, cela représente la valeur de la clé primaire de `a`. |
| `action`        | `string` | Nom de l'action                                                                                                                                          |
| `params`        | `any`    | Objet des paramètres de la requête, principalement les paramètres d'URL. Le corps de la requête est placé dans `params.values`.                           |
| `params.values` | `any`    | Objet du corps de la requête                                                                                                                             |

### `resource()`

Récupère l'objet des méthodes d'opération sur les ressources NocoBase.

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

#### Détails

| Paramètre | Type                  | Description                                                                                                                                              |
| --------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`              | 1. Nom de la ressource, par exemple `a`<br />2. Nom de l'objet associé à la ressource, par exemple `a.b`                                                  |
| `of`      | `any`                 | Lorsque `name` est le nom de l'objet associé à la ressource, il s'agit de la valeur de la clé primaire de la ressource. Par exemple, pour `a.b`, cela représente la valeur de la clé primaire de `a`. |
| `headers` | `AxiosRequestHeaders` | En-têtes HTTP à inclure dans les requêtes d'opération sur les ressources subséquentes.                                                                   |