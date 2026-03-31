:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# APIClient

## 개요

`APIClient`는 <a href="https://axios-http.com/" target="_blank">`axios`</a>를 기반으로 하는 래퍼(wrapper)입니다. 클라이언트 측에서 HTTP를 통해 NocoBase 리소스 작업을 요청하는 데 사용됩니다.

### 기본 사용법

```ts
class PluginSampleAPIClient extends Plugin {
  async load() {
    const res = await this.app.apiClient.request({
      // ...
    });
  }
}
```

## 인스턴스 속성

### `axios`

`axios` 인스턴스로, `apiClient.axios.interceptors`와 같이 `axios` API에 접근할 수 있습니다.

### `auth`

클라이언트 측 인증 클래스입니다. [Auth](./auth.md)를 참고하세요.

### `storage`

클라이언트 측 스토리지 클래스입니다. [Storage](./storage.md)를 참고하세요.

## 클래스 메서드

### `constructor()`

생성자 함수로, `APIClient` 인스턴스를 생성합니다.

#### 시그니처

- `constructor(instance?: APIClientOptions)`

#### 타입

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

HTTP 요청을 시작합니다.

#### 시그니처

- `request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>`

#### 타입

```ts
type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};
```

#### 상세 정보

##### AxiosRequestConfig

일반적인 axios 요청 파라미터입니다. <a href="https://axios-http.com/docs/req_config" target="_blank">Request Config</a>를 참고하세요.

```ts
const res = await apiClient.request({ url: '' });
```

##### ResourceActionOptions

NocoBase 리소스 작업 요청 파라미터입니다.

```ts
const res = await apiClient.request({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 10,
  },
});
```

| 속성            | 타입     | 설명                                                                                 |
| --------------- | -------- | ------------------------------------------------------------------------------------ |
| `resource`      | `string` | 1. 리소스 이름 (예: `a`)<br />2. 리소스의 연결된 객체 이름 (예: `a.b`)             |
| `resourceOf`    | `any`    | `resource`가 리소스의 연결된 객체 이름일 때, 해당 리소스의 기본 키(primary key) 값입니다. 예를 들어, `a.b`일 경우 `a`의 기본 키 값을 나타냅니다. |
| `action`        | `string` | 작업 이름                                                                            |
| `params`        | `any`    | 요청 파라미터 객체로, 주로 URL 파라미터에 사용됩니다. 요청 본문(request body)은 `params.values`에 포함됩니다. |
| `params.values` | `any`    | 요청 본문(request body) 객체                                                         |

### `resource()`

NocoBase 리소스 작업 메서드 객체를 가져옵니다.

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

#### 시그니처

- `resource(name: string, of?: any, headers?: AxiosRequestHeaders): IResource`

#### 타입

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

#### 상세 정보

| 파라미터  | 타입                  | 설명                                                                                 |
| --------- | --------------------- | ------------------------------------------------------------------------------------ |
| `name`    | `string`              | 1. 리소스 이름 (예: `a`)<br />2. 리소스의 연결된 객체 이름 (예: `a.b`)             |
| `of`      | `any`                 | `name`이 리소스의 연결된 객체 이름일 때, 해당 리소스의 기본 키(primary key) 값입니다. 예를 들어, `a.b`일 경우 `a`의 기본 키 값을 나타냅니다. |
| `headers` | `AxiosRequestHeaders` | 이후 리소스 작업 요청 시 포함될 HTTP 헤더입니다.                                     |