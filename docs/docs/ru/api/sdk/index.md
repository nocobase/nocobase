:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# APIClient

## Обзор

`APIClient` — это обёртка, основанная на <a href="https://axios-http.com/" target="_blank">`axios`</a>, предназначенная для выполнения HTTP-запросов к операциям с ресурсами NocoBase на стороне клиента.

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

Экземпляр `axios`, который предоставляет доступ к API `axios`, например, `apiClient.axios.interceptors`.

### `auth`

Класс для клиентской аутентификации, см. [Auth](./auth.md).

### `storage`

Класс для клиентского хранилища, см. [Storage](./storage.md).

## Методы класса

### `constructor()`

Конструктор, создаёт экземпляр `APIClient`.

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

Общие параметры запроса `axios`. См. <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

Параметры запроса для операций с ресурсами NocoBase.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```
