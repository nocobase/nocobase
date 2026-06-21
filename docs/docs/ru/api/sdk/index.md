# APIClient - API-клиент

## Обзор

`APIClient` — это оболочка на основе <a href="https://axios-http.com/" target="_blank">`axios`</a>, используемая для запроса действий ресурсов NocoBase на стороне клиента через HTTP.

### Базовое использование

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## Свойства экземпляра

### `axios`

Экземпляр `axios`, который можно использовать для доступа к API `axios`, например `apiClient.axios.interceptors`.

### `auth`

Класс клиентской аутентификации, см. [Auth](./auth.md).

### `storage`

Класс клиентского хранилища, см. [Storage](./storage.md).

## Методы класса

### `constructor()`

Конструктор, создает экземпляр `APIClient`.

#### Сигнатура

- `constructor(instance?: APIClientOptions)`

#### Тип

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

Инициирует HTTP-запрос.

#### Сигнатура

- `request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>`

#### Тип

```ts
type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};
```

#### Подробности

##### AxiosRequestConfig

Общие параметры запроса axios. См. <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

Параметры запроса действий ресурса NocoBase.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```
