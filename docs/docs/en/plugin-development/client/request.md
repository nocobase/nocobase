# Request

NocoBase provides an `APIClient` based on [Axios](https://axios-http.com/) that can be used to make HTTP requests from anywhere you can get a `Context`.

Common locations where you can get `Context` include:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` is the most commonly used method to make requests. Its parameters and return values are identical to [axios.request()](https://axios-http.com/docs/req_config).

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

Basic Usage

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

You can use standard Axios request configurations directly:

```ts
await ctx.api.request({
  url: 'users:create',
  method: 'post',
  data: {
    name: 'Tao Tao',
  },
});
```

## ctx.api.axios

`ctx.api.axios` is an `AxiosInstance` instance through which you can modify global default configurations or add request interceptors.

Modify Default Configuration

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

For more available configurations, see [Axios Default Config](https://axios-http.com/docs/config_defaults).

## Request and Response Interceptors

Interceptors can process requests before they are sent or responses after they return. For example, consistently adding request headers, serializing parameters, or displaying unified error messages.

### Request Interceptor Example

```ts
// Use qs to serialize params
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// Custom request headers
axios.interceptors.request.use((config) => {
  config.headers['Authorization'] = `Bearer token123`;
  config.headers['X-Hostname'] = 'localhost';
  config.headers['X-Timezone'] = '+08:00';
  config.headers['X-Locale'] = 'zh-CN';
  config.headers['X-Role'] = 'admin';
  config.headers['X-Authenticator'] = 'basic';
  config.headers['X-App'] = 'sub1';
  return config;
});
```

### Response Interceptor Example

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Show unified notification when request fails
    ctx.notification.error({
      message: 'Request response error',
    });
    return Promise.reject(error);
  },
);
```

## NocoBase Server Custom Request Headers

The following are custom request headers supported by NocoBase Server, which can be used for multi-app, internationalization, multi-role, or multi-authentication scenarios.

| Header            | Description |
| ----------------- | ----------- |
| `X-App`           | Specify the current accessed app in multi-app scenarios |
| `X-Locale`         | Current language (e.g., `zh-CN`, `en-US`) |
| `X-Hostname`       | Client hostname |
| `X-Timezone`       | Client timezone (e.g., `+08:00`) |
| `X-Role`           | Current role |
| `X-Authenticator`  | Current user authentication method |

> 💡 **Tip**  
> These request headers are usually automatically injected by interceptors and don't need to be set manually. Only in special scenarios (such as test environments or multi-instance scenarios) do you need to add them manually.

## Usage in Components

In React components, you can get the context object through `useFlowContext()` and then call `ctx.api` to make requests.

```ts
import { useFlowContext } from '@nocobase/client';

const MyComponent = () => {
  const ctx = useFlowContext();

  const fetchData = async () => {
    const response = await ctx.api.request({
      url: '/api/posts',
      method: 'get',
    });
    console.log(response.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return <div>Loading...</div>;
};
```

### Using with ahooks' useRequest

In actual development, you can use [ahooks](https://ahooks.js.org/hooks/use-request/index)' `useRequest` Hook to more conveniently handle the request lifecycle and state.

```ts
import { useFlowContext } from '@nocobase/client';
import { useRequest } from 'ahooks';

const MyComponent = () => {
  const ctx = useFlowContext();

  const { data, loading, error, refresh } = useRequest(() =>
    ctx.api.request({
      url: 'posts:list',
      method: 'get',
    }),
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Request error: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

This approach makes request logic more declarative, automatically managing loading states, error handling, and refresh logic, which is very suitable for use in components.

