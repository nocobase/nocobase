---
nav:
  path: /client
group:
  path: /client
---

# APIClient

## APIClient

```ts
class APIClient {
  constructor(instance?: AxiosInstance | AxiosRequestConfig);
}
```

示例

```ts
import axios from 'axios';

// 不传参时，内部直接创建 axios 实例
const apiClient = new APIClient();

// 提供 AxiosRequestConfig 配置参数
const apiClient = new APIClient({
  baseURL: '',
});

// 提供 AxiosInstance
const instance = axios.create({
  baseURL: '',
});
const apiClient = new APIClient(instance);
```

## APIClientProvider

提供 APIClient 实例的上下文。

```tsx | pure
const apiClient = new APIClient();

<APIClientProvider apiClient={apiClient}></APIClientProvider>
```

## useAPIClient

获取当前上下文的 APIClient 实例。

```ts
const apiClient = useAPIClient();
```

## useRequest

```ts
function useRequest<P>(
  service: AxiosRequestConfig<P> | ResourceActionOptions<P> | FunctionService,
  options?: Options<any, any>,
);
```

示例

<code src="./demos/demo1.tsx" />

## useResource

```ts
function useResource(name: string, of?: string | number): IResource;
```