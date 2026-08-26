---
title: "Request 请求"
description: "NocoBase 客户端请求：api.request、APIClient、HTTP 请求、调用后端 API。"
keywords: "Request,api.request,APIClient,HTTP 请求,API 调用,NocoBase"
---

# Request 请求

NocoBase 提供了一个基于 [Axios](https://axios-http.com/) 封装的 `APIClient`，用于在任意能够获取 `Context` 的地方都可以发起 HTTP 请求。

常见可获取到 `Context` 的位置包括：

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` 是最常用的发起请求方法，其参数和返回值与 [axios.request()](https://axios-http.com/docs/req_config) 完全一致。

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

基本用法

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

你可以直接使用标准的 Axios 请求配置：

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

`ctx.api.axios` 是一个 `AxiosInstance` 实例，可以通过它修改全局默认配置或添加请求拦截器。

修改默认配置

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

更多可用配置详见 [Axios 默认配置](https://axios-http.com/docs/config_defaults)。

## 请求与响应拦截器

通过拦截器可以在请求发送前或响应返回后进行处理。例如，统一添加请求头、序列化参数、或统一错误提示。

### 请求拦截器示例

```ts
// 使用 qs 序列化 params 参数
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// 自定义请求头
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

### 响应拦截器示例

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // 请求出错时，统一显示通知提示
    ctx.notification.error({
      message: '请求响应错误',
    });
    return Promise.reject(error);
  },
);
```

## NocoBase Server 自定义请求头

以下是 NocoBase Server 支持的自定义请求头，可用于多应用、国际化、多角色或多认证场景。

| Header | 说明 |
|--------|------|
| `X-App` | 多应用场景下指定当前访问的应用 |
| `X-Locale` | 当前语言（如：`zh-CN`、`en-US`） |
| `X-Hostname` | 客户端主机名 |
| `X-Timezone` | 客户端所在时区（如：`+08:00`） |
| `X-Role` | 当前角色 |
| `X-Authenticator` | 当前用户认证方式 |

> 💡 **提示**  
> 这些请求头通常由拦截器自动注入，无需手动设置。仅在特殊场景下（如测试环境或多实例场景）需要手动添加。

## 在组件中使用

在 React 组件中，可通过 `useFlowContext()` 获取上下文对象，从而调用 `ctx.api` 发起请求。

```ts
import { useFlowContext } from '@nocobase/flow-engine';

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

  return <div>加载中...</div>;
};
```

### 搭配 ahooks 的 useRequest 使用

在实际开发中，可以配合 [ahooks](https://ahooks.js.org/hooks/use-request/index) 提供的 `useRequest` Hook，更方便地处理请求的生命周期与状态。

```ts
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';

const MyComponent = () => {
  const ctx = useFlowContext();

  const { data, loading, error, refresh } = useRequest(() =>
    ctx.api.request({
      url: 'posts:list',
      method: 'get',
    }),
  );

  if (loading) return <div>加载中...</div>;
  if (error) return <div>请求出错: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>刷新</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

这种方式可以让请求逻辑更加声明化，自动管理加载状态、错误提示与刷新逻辑，非常适合在组件中使用。
