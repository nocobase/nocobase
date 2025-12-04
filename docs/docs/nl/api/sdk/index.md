:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# APIClient

## Overzicht

`APIClient` is een wrapper gebaseerd op <a href="https://axios-http.com/" target="_blank">`axios`</a>. U gebruikt deze om NocoBase `collectie` acties aan te vragen via HTTP aan de clientzijde.

### Basisgebruik

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## Instantie-eigenschappen

### `axios`

De `axios`-instantie, waarmee u toegang krijgt tot de `axios` API, bijvoorbeeld `apiClient.axios.interceptors`.

### `auth`

De client-side authenticatieklasse, zie [Auth](./auth.md).

### `storage`

De client-side opslagklasse, zie [Storage](./storage.md).

## Klassemethoden

### `constructor()`

De constructor, die een `APIClient`-instantie aanmaakt.

#### Signatuur

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

Start een HTTP-verzoek.

#### Signatuur

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

#### Details

##### AxiosRequestConfig

Algemene `axios`-verzoekparameters. Zie <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

NocoBase `collectie` actie-verzoekparameters.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| Eigenschap      | Type     | Beschrijving                                                                                                                                              |
| --------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resource`      | `string` | 1. `Collectie`naam, bijv. `a`<br />2. Naam van het gekoppelde object van de `collectie`, bijv. `a.b`                                                       |
| `resourceOf`    | `any`    | Wanneer `resource` de naam is van het gekoppelde object van de `collectie`, is dit de primaire sleutelwaarde van de `collectie`. Bijvoorbeeld, voor `a.b` vertegenwoordigt het de primaire sleutelwaarde van `a`. |
| `action`        | `string` | Actienaam                                                                                                                                                 |
| `params`        | `any`    | Verzoekparameterobject, voornamelijk URL-parameters. De verzoekbody wordt in `params.values` geplaatst.                                                  |
| `params.values` | `any`    | Verzoekbody-object                                                                                                                                        |

### `resource()`

Haalt het NocoBase `collectie` actiemethode-object op.

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

#### Signatuur

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

#### Details

| Parameter | Type                  | Beschrijving                                                                                                                                              |
| --------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`              | 1. `Collectie`naam, bijv. `a`<br />2. Naam van het gekoppelde object van de `collectie`, bijv. `a.b`                                                       |
| `of`      | `any`                 | Wanneer `name` de naam is van het gekoppelde object van de `collectie`, is dit de primaire sleutelwaarde van de `collectie`. Bijvoorbeeld, voor `a.b` vertegenwoordigt het de primaire sleutelwaarde van `a`. |
| `headers` | `AxiosRequestHeaders` | HTTP-headers die moeten worden meegestuurd bij volgende `collectie` actie-verzoeken.                                                                      |