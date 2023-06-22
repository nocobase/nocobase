---
group:
  title: Client
  order: 1
---

# APIClient

## APIClient

```ts
class APIClient {
  // axios 实例
  axios: AxiosInstance;
  // 缓存带 uid 的 useRequest({}, {uid}) 的结果，可供其他组件调用
  services: Record<string, Result<any, any>>;
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

// 常规请求
const response = await apiClient.request({ url });

// NocoBase 特有的资源操作
const response = await apiClient.resource('posts').list();

// 请求共享
const { data, loading, run } = apiClient.service('uid');
```

`api.service(uid)` 的例子，ComponentB 里刷新 ComponentA 的请求数据

<code src="./demos/demo3.tsx"></code>

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
const { data, loading, refresh, run, params } = useRequest({ url: '/users' });

// useRequest 里传的是 AxiosRequestConfig，所以 run 里传的也是 AxiosRequestConfig
run({
  params: {
    pageSize: 20,
  }
});
```

例子如下：

<code src="./demos/demo2.tsx"></code>

或者是 NocoBase 的 resource & action 请求：

```ts
const { data, run } = useRequest({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 20,
  },
});

// useRequest 传的是 ResourceActionOptions，所以 run 直接传 action params 就可以了。
run({
  pageSize: 50,
});
```

例子如下：

<code src="./demos/demo1.tsx"></code>

也可以是自定义的异步函数：

```ts
const { data, loading, run, refresh, params } = useRequest((...params) => Promise.resolve({}));

run(...params);
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
