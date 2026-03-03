:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/api/sdk/index).
:::

# APIClient

## סקירה כללית

`APIClient` מבוסס על מעטפת של <a href="https://axios-http.com/" target="_blank">`axios`</a>, ומשמש לביצוע בקשות HTTP עבור פעולות על משאבי NocoBase בצד הלקוח.

### שימוש בסיסי

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## מאפייני מופע (Instance Properties)

### `axios`

מופע `axios`, המאפשר גישה ל-API של `axios`, לדוגמה `apiClient.axios.interceptors`.

### `auth`

מחלקת אימות (Authentication) בצד הלקוח, עיינו ב-[Auth](./auth.md).

### `storage`

מחלקת אחסון בצד הלקוח, עיינו ב-[Storage](./storage.md).

## מתודות מחלקה (Class Methods)

### `constructor()`

בנאי (Constructor), יוצר מופע של `APIClient`.

#### חתימה

- `constructor(instance?: APIClientOptions)`

#### סוג

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

מבצע בקשת HTTP.

#### חתימה

- `request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>`

#### סוג

```ts
type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};
```

#### פרטים נוספים

##### AxiosRequestConfig

פרמטרים כלליים לבקשת axios. עיינו ב-<a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

פרמטרים לבקשת פעולה על משאב ב-NocoBase.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| מאפיין          | סוג      | תיאור                                                                                                                                              |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resource`      | `string` | 1. שם המשאב, לדוגמה `a`<br />2. שם האובייקט המקושר של המשאב, לדוגמה `a.b`                                                                          |
| `resourceOf`    | `any`    | כאשר `resource` הוא שם של אובייקט מקושר, זהו ערך המפתח הראשי (Primary Key) של המשאב. לדוגמה, עבור `a.b`, הוא מייצג את ערך המפתח הראשי של `a`. |
| `action`        | `string` | שם הפעולה                                                                                                                                          |
| `params`        | `any`    | אובייקט פרמטרים לבקשה, בעיקר פרמטרי URL. גוף הבקשה (Request body) מוכנס לתוך `params.values`.                                                      |
| `params.values` | `any`    | אובייקט גוף הבקשה                                                                                                                                  |

### `resource()`

מקבל אובייקט של מתודות לביצוע פעולות על משאבי NocoBase.

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

#### חתימה

- `resource(name: string, of?: any, headers?: AxiosRequestHeaders): IResource`

#### סוג

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

#### פרטים נוספים

| שם הפרמטר | סוג                  | תיאור                                                                                                                                              |
| --------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`              | 1. שם המשאב, לדוגמה `a`<br />2. שם האובייקט המקושר של המשאב, לדוגמה `a.b`                                                                          |
| `of`      | `any`                 | כאשר `name` הוא שם של אובייקט מקושר, זהו ערך המפתח הראשי של המשאב. לדוגמה, עבור `a.b`, הוא מייצג את ערך המפתח הראשי של `a`. |
| `headers` | `AxiosRequestHeaders` | כותרות HTTP שייכללו בבקשות הבאות לביצוע פעולות על המשאב.                                                                                           |