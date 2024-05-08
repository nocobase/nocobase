# APIClient

## APIClient

```ts
class APIClient {
  // Axios instance
  axios: AxiosInstance;
  // Cache the results of useRequest({}, {uid}) with uid, which can be accessed by other components
  services: Record<string, Result<any, any>>;
  // Constructor
  constructor(instance?: AxiosInstance | AxiosRequestConfig);
  // Client request, supports AxiosRequestConfig and ResourceActionOptions
  request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>;
  // Get resource
  resource<R = IResource>(name: string, of?: any): R;
}
```

Example:

```ts
import axios from 'axios';

// When no parameters are passed, it creates an axios instance internally
const apiClient = new APIClient();

// Provide AxiosRequestConfig configuration parameters
const apiClient = new APIClient({
  baseURL: '',
});

// Provide AxiosInstance
const instance = axios.create({
  baseURL: '',
});
const apiClient = new APIClient(instance);

// Regular request
const response = await apiClient.request({ url });

// NocoBase-specific resource operations
const response = await apiClient.resource('posts').list();

// Request sharing
const { data, loading, run } = apiClient.service('uid');
```

Example of `api.service(uid)`, refreshing the request data in ComponentA from ComponentB

<code src="./demos/demo3.tsx"></code>

## APIClientProvider

Provides the context for the APIClient instance.

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

Supports `axios.request(config)`, for more details on the config, please refer to the [axios documentation](https://github.com/axios/axios#request-config).

```ts
const { data, loading, refresh, run, params } = useRequest({ url: '/users' });

// Since AxiosRequestConfig is passed in useRequest, AxiosRequestConfig should also be passed in run
run({
  params: {
    pageSize: 20,
  }
});
```

例子如下:

<code src="./demos/demo2.tsx"></code>

Or it can be a NocoBase resource & action request:

```ts
const { data, run } = useRequest({
  resource: 'users',
  action: 'list',
  params: {
    pageSize: 20,
  },
});

// Since useRequest is passed ResourceActionOptions, you can directly pass action params to run.
run({
  pageSize: 50,
});
```

Example as follows:

<code src="./demos/demo1.tsx"></code>

It can also be a custom asynchronous function:

```ts
const { data, loading, run, refresh, params } = useRequest((...params) => Promise.resolve({}));

run(...params);
```

For more usage, please refer to [useRequest()](https://ahooks.js.org/hooks/use-request/index) in ahooks.

## useResource

```ts
function useResource(name: string, of?: string | number): IResource;
```

Resources are the core concept of NocoBase, including:

- Independent resources, such as `posts`
- Related resources, such as `posts.tags`, `posts.user`, `posts.comments`

Resource URI

```bash
/api/posts
/api/posts/1/comments
```

Retrieve resources via `APIClient`.

```ts
const api = new APIClient();

api.resource('posts');
api.resource('posts.comments', 1);
```

`useResource` Usage:

```ts
const resource = useResource('posts');
const resource = useResource('posts.comments', 1);
```

For actual use cases of `resource`, please refer to:

- [useCollection()](collection-manager#usecollection)
- [useCollectionField()](collection-manager#usecollectionfield)
