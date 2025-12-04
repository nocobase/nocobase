:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# APIClient

## Přehled

`APIClient` je obálka nad knihovnou <a href="https://axios-http.com/" target="_blank">`axios`</a>, která se používá k provádění operací se zdroji NocoBase na straně klienta prostřednictvím HTTP.

### Základní použití

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## Vlastnosti instance

### `axios`

Instance `axios`, která umožňuje přístup k API `axios`, například `apiClient.axios.interceptors`.

### `auth`

Třída pro autentizaci na straně klienta, viz [Auth](./auth.md).

### `storage`

Třída pro ukládání dat na straně klienta, viz [Storage](./auth.md).

## Metody třídy

### `constructor()`

Konstruktor, který vytváří instanci `APIClient`.

#### Signatura

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

Odesílá HTTP požadavek.

#### Signatura

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

#### Podrobnosti

##### AxiosRequestConfig

Obecné parametry požadavku axios. Viz <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

Parametry požadavku pro operace se zdroji NocoBase.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| Vlastnost       | Typ      | Popis                                                                                                                                                            |
| --------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resource`      | `string` | 1. Název zdroje, např. `a`<br />2. Název přidruženého objektu zdroje, např. `a.b`                                                                                |
| `resourceOf`    | `any`    | Pokud je `resource` název přidruženého objektu zdroje, jedná se o hodnotu primárního klíče zdroje. Například pro `a.b` představuje hodnotu primárního klíče `a`. |
| `action`        | `string` | Název akce                                                                                                                                                       |
| `params`        | `any`    | Objekt parametrů požadavku, převážně parametry URL. Tělo požadavku se umisťuje do `params.values`.                                                                |
| `params.values` | `any`    | Objekt těla požadavku                                                                                                                                            |

### `resource()`

Získá objekt metody pro operace se zdroji NocoBase.

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

#### Signatura

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

#### Podrobnosti

| Parametr  | Typ                   | Popis                                                                                                                                                            |
| --------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`              | 1. Název zdroje, např. `a`<br />2. Název přidruženého objektu zdroje, např. `a.b`                                                                                |
| `of`      | `any`                 | Pokud je `name` název přidruženého objektu zdroje, jedná se o hodnotu primárního klíče zdroje. Například pro `a.b` představuje hodnotu primárního klíče `a`. |
| `headers` | `AxiosRequestHeaders` | HTTP hlavičky, které se mají zahrnout do následných požadavků na operace se zdroji.                                                                              |