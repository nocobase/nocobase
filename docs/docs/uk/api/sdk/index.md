:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# APIClient

## Огляд

`APIClient` є обгорткою над <a href="https://axios-http.com/" target="_blank">`axios`</a>, яка використовується для виконання операцій з ресурсами NocoBase на стороні клієнта через HTTP.

### Базове використання

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## Властивості екземпляра

### `axios`

Екземпляр `axios`, який надає доступ до API `axios`, наприклад, `apiClient.axios.interceptors`.

### `auth`

Клас для автентифікації на стороні клієнта, дивіться [Auth](./auth.md).

### `storage`

Клас для зберігання даних на стороні клієнта, дивіться [Storage](./storage.md).

## Методи класу

### `constructor()`

Конструктор, створює екземпляр `APIClient`.

#### Підпис

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

Ініціює HTTP-запит.

#### Підпис

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

#### Деталі

##### AxiosRequestConfig

Загальні параметри запиту `axios`. Дивіться <a href="https://axios-http.com/docs/req_config" target="_blank">Конфігурація запиту</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

Параметри запиту для операцій з ресурсами NocoBase.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| Властивість     | Тип      | Опис                                                                                                                                                             |
| --------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resource`      | `string` | 1. Назва ресурсу, наприклад, `a`<br />2. Назва пов'язаного об'єкта ресурсу, наприклад, `a.b`                                                                     |
| `resourceOf`    | `any`    | Коли `resource` є назвою пов'язаного об'єкта ресурсу, це значення первинного ключа ресурсу. Наприклад, для `a.b` це представляє значення первинного ключа `a`. |
| `action`        | `string` | Назва дії                                                                                                                                                        |
| `params`        | `any`    | Об'єкт параметрів запиту, переважно параметри URL. Тіло запиту розміщується в `params.values`.                                                                    |
| `params.values` | `any`    | Об'єкт тіла запиту                                                                                                                                               |

### `resource()`

Отримує об'єкт методів для операцій з ресурсами NocoBase.

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

#### Підпис

- `resource(name: string, of?: any, headers?: AxiosRequestHeaders): IResource`

#### Тип

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

#### Деталі

| Параметр  | Тип                   | Опис                                                                                                                                                             |
| --------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`              | 1. Назва ресурсу, наприклад, `a`<br />2. Назва пов'язаного об'єкта ресурсу, наприклад, `a.b`                                                                     |
| `of`      | `any`                 | Коли `name` є назвою пов'язаного об'єкта ресурсу, це значення первинного ключа ресурсу. Наприклад, для `a.b` це представляє значення первинного ключа `a`. |
| `headers` | `AxiosRequestHeaders` | HTTP-заголовки, які будуть включені в подальші запити на операції з ресурсами.                                                                                    |