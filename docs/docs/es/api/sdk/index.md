---
title: "APIClient"
description: "SDK frontend APIClient de NocoBase: peticiones HTTP, Auth, Storage, llamada a la API del backend."
keywords: "APIClient,SDK,peticiones HTTP,API frontend,Auth,Storage,NocoBase"
---

:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# APIClient

## Visión general

`APIClient` está basado en <a href="https://axios-http.com/" target="_blank">`axios`</a> y se utiliza en el cliente para realizar operaciones de recursos de NocoBase mediante HTTP.

### Uso básico

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## Propiedades de instancia

### `axios`

Instancia de `axios`. Permite acceder a la API de `axios`, por ejemplo `apiClient.axios.interceptors`.

### `auth`

Clase de autenticación del cliente. Consulte [Auth](./auth.md).

### `storage`

Clase de almacenamiento del cliente. Consulte [Storage](./storage.md).

## Métodos de la clase

### `constructor()`

Constructor que crea una instancia de `APIClient`.

#### Firma

- `constructor(instance?: APIClientOptions)`

#### Tipos

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

Realiza una petición HTTP.

#### Firma

- `request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>`

#### Tipos

```ts
type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};
```

#### Detalles

##### AxiosRequestConfig

Parámetros de petición genéricos de axios. Consulte <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

Parámetros de petición para operaciones de recursos de NocoBase.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| Propiedad | Tipo | Descripción |
| --- | --- | --- |
| `resource` | `string` | 1. Nombre del recurso, p. ej. `a`<br />2. Nombre del objeto asociado del recurso, p. ej. `a.b` |
| `resourceOf` | `any` | Cuando `resource` es el nombre de un objeto asociado, valor de la clave primaria del recurso. Por ejemplo en `a.b` representa el valor de la clave primaria de `a` |
| `action` | `string` | Nombre de la operación |
| `params` | `any` | Objeto de parámetros de la petición. Principalmente parámetros de URL; el cuerpo de la petición se coloca en `params.values` |
| `params.values` | `any` | Objeto del cuerpo de la petición |

### `resource()`

Obtiene el objeto con los métodos de operación de un recurso de NocoBase.

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

#### Tipos

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

#### Detalles

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `name` | `string` | 1. Nombre del recurso, p. ej. `a`<br />2. Nombre del objeto asociado del recurso, p. ej. `a.b` |
| `of` | `any` | Cuando `resource` es el nombre de un objeto asociado, valor de la clave primaria del recurso. Por ejemplo en `a.b` representa el valor de la clave primaria de `a` |
| `headers` | `AxiosRequestHeaders` | Cabeceras HTTP que se enviarán en posteriores peticiones de operaciones de recurso |
