# Request

NocoBase provides an `APIClient` based on [Axios](https://axios-http.com/) for making HTTP requests anywhere you can get the `Context`.

Common places where you can get the `Context` include:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` is the most common method for making requests. Its parameters and return value are identical to [axios.request()](https://axios-http.com/docs/req_config).

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

You can directly use the standard Axios request configuration:

```ts
await ctx.api.request({
  url: 'users:create',
  method: 'post',
  data: {
    name: 'Alice',
  },
});
```

## ctx.api.axios

`ctx.api.axios` is an `AxiosInstance` instance that you can use to modify global default configurations or add request interceptors.

Modify Default Configuration

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

For more available configurations, see [Axios Default Config](https://axios-http.com/docs/config_defaults).

## Request and Response Interceptors

Interceptors allow you to process requests before they are sent or after a response is received. For example, you can uniformly add request headers, serialize parameters, or handle errors consistently.

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
  config.headers['X-Locale'] = 'en-US';
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
    // Display a unified notification for request errors
    ctx.notification.error({
      message: 'Request failed',
    });
    return Promise.reject(error);
  },
);
```

## NocoBase Server Custom Request Headers

The following are custom request headers supported by NocoBase Server, which can be used in multi-app, internationalization, multi-role, or multi-authentication scenarios.

| Header | Description |
|--------|------|
| `X-App` | Specifies the current application being accessed in a multi-app scenario. |
| `X-Locale` | The current language (e.g., `zh-CN`, `en-US`). |
| `X-Hostname` | Client hostname. |
| `X-Timezone` | Client's timezone (e.g., `+08:00`). |
| `X-Role` | The current role. |
| `X-Authenticator` | The current user's authentication method. |

> 💡 **Tip**  
> These headers are usually injected automatically by interceptors and do not need to be set manually. You only need to add them manually in special scenarios, such as in a testing environment or a multi-instance setup.

## Usage in Components

In React components, you can get the context object via `useFlowContext()` to make requests with `ctx.api`.

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

In actual development, you can use the `useRequest` hook from [ahooks](https://ahooks.js.org/hooks/use-request/index) to more conveniently handle the request lifecycle and state.

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

This approach makes the request logic more declarative, automatically managing loading states, error handling, and refresh logic, making it very suitable for use in components.