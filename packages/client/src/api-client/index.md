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
  // axios 实例
  axios: AxiosInstance;
  // 构造器
  constructor(instance?: AxiosInstance | AxiosRequestConfig);
  // 客户端请求，支持 AxiosRequestConfig 和 ResourceActionOptions
  request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>;
  // 获取资源
  resource<R = IResource>(name: string, of?: any): R;
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

支持 `axios.request(config)`，config 详情查看 [axios](https://github.com/axios/axios#request-config)

```ts
const { data, loading, refresh } = useRequest({ url: '/users' });
```

或者是 NocoBase 的 resource & action 请求：

```ts
const { data } = useRequest({
  resource: 'users',
  action: 'get',
  params: {},
});
```

例子如下：

<code src="./demos/demo1.tsx" />

也可以是自定义的异步函数：

```ts
const { data, loading, refresh } = useRequest(() => Promise.resolve({}));
```

更多用法查看 ahooks 的 [useRequest()](https://ahooks.js.org/hooks/use-request/index)

## useResource

```ts
function useResource(name: string, of?: string | number): IResource;
```

资源是 NocoBase 的核心概念，包括：

- 独立资源，如 `posts`
- 关系资源，如 `posts.tags` `posts.user` `posts.comments`

资源 URI

```bash
# 独立资源，文章
/api/posts
# 关系资源，文章 ID=1 的评论
/api/posts/1/comments
```

通过 APIClient 获取资源

```ts
const api = new APIClient();

api.resource('posts');
api.resource('posts.comments', 1);
```

useResource 用法：

```ts
const resource = useResource('posts');
const resource = useResource('posts.comments', 1);
```

resource 的实际场景用例参见：

- [useCollection()](collection-manager#usecollection)
- [useCollectionField()](collection-manager#usecollectionfield)
