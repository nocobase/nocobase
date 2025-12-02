:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# APIClient

## Visão Geral

O `APIClient` é um *wrapper* baseado no <a href="https://axios-http.com/" target="_blank">`axios`</a>, utilizado para realizar requisições de ações de recursos do NocoBase via HTTP no lado do cliente.

### Uso Básico

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## Propriedades da Instância

### `axios`

A instância do `axios`, que você pode usar para acessar a API do `axios`, por exemplo, `apiClient.axios.interceptors`.

### `auth`

Classe de autenticação do lado do cliente, veja [Auth](./auth.md).

### `storage`

Classe de armazenamento do lado do cliente, veja [Storage](./storage.md).

## Métodos da Classe

### `constructor()`

Construtor, cria uma instância de `APIClient`.

#### Assinatura

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

Inicia uma requisição HTTP.

#### Assinatura

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

#### Detalhes

##### AxiosRequestConfig

Parâmetros gerais de requisição do axios. Veja <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

Parâmetros de requisição para ações de recursos do NocoBase.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| Propriedade     | Tipo     | Descrição                                                                                                                                                                                                                                |
| --------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resource`      | `string` | 1. Nome do recurso, por exemplo, `a`<br />2. Nome do objeto associado ao recurso, por exemplo, `a.b`                                                                                                                                     |
| `resourceOf`    | `any`    | Quando `resource` é o nome do objeto associado ao recurso, este é o valor da chave primária do recurso. Por exemplo, para `a.b`, representa o valor da chave primária de `a`.                                                              |
| `action`        | `string` | Nome da ação                                                                                                                                                                                                                             |
| `params`        | `any`    | Objeto de parâmetros da requisição, principalmente parâmetros de URL. O corpo da requisição é colocado em `params.values`.                                                                                                                |
| `params.values` | `any`    | Objeto do corpo da requisição                                                                                                                                                                                                            |

### `resource()`

Obtém o objeto de método de ação de recurso do NocoBase.

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

#### Assinatura

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

#### Detalhes

| Parâmetro | Tipo                  | Descrição                                                                                                                                                                                                                                |
| --------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`              | 1. Nome do recurso, por exemplo, `a`<br />2. Nome do objeto associado ao recurso, por exemplo, `a.b`                                                                                                                                     |
| `of`      | `any`                 | Quando `name` é o nome do objeto associado ao recurso, este é o valor da chave primária do recurso. Por exemplo, para `a.b`, representa o valor da chave primária de `a`.                                                              |
| `headers` | `AxiosRequestHeaders` | Cabeçalhos HTTP a serem incluídos nas requisições de ação de recurso subsequentes.                                                                                                                                                       |