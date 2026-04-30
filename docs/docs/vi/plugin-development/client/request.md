---
title: "Request - Yêu cầu"
description: "Yêu cầu phía client của NocoBase: api.request, APIClient, HTTP request, gọi API backend."
keywords: "Request,api.request,APIClient,HTTP request,Gọi API,NocoBase"
---

# Request - Yêu cầu

NocoBase cung cấp một `APIClient` được đóng gói dựa trên [Axios](https://axios-http.com/), dùng để gửi HTTP request tại bất kỳ nơi nào có thể lấy được `Context`.

Các vị trí phổ biến có thể lấy `Context` bao gồm:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` là phương thức gửi yêu cầu phổ biến nhất, các tham số và giá trị trả về hoàn toàn nhất quán với [axios.request()](https://axios-http.com/docs/req_config).

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

Cách dùng cơ bản

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

Bạn có thể sử dụng trực tiếp cấu hình request chuẩn của Axios:

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

`ctx.api.axios` là một instance `AxiosInstance`, bạn có thể dùng nó để sửa cấu hình mặc định toàn cục hoặc thêm interceptor cho request.

Sửa cấu hình mặc định

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

Xem thêm các cấu hình khả dụng tại [Cấu hình mặc định Axios](https://axios-http.com/docs/config_defaults).

## Interceptor request và response

Thông qua interceptor, bạn có thể xử lý trước khi request được gửi đi hoặc sau khi response trả về. Ví dụ, thống nhất thêm header request, serialize tham số hoặc hiển thị thông báo lỗi thống nhất.

### Ví dụ interceptor request

```ts
// Sử dụng qs để serialize tham số params
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// Header request tùy chỉnh
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

### Ví dụ interceptor response

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Khi request gặp lỗi, hiển thị thông báo thống nhất
    ctx.notification.error({
      message: 'Lỗi phản hồi yêu cầu',
    });
    return Promise.reject(error);
  },
);
```

## Header tùy chỉnh của NocoBase Server

Dưới đây là các header tùy chỉnh mà NocoBase Server hỗ trợ, có thể dùng cho các tình huống đa ứng dụng, đa ngôn ngữ, đa role hoặc đa phương thức xác thực.

| Header | Mô tả |
|--------|------|
| `X-App` | Chỉ định ứng dụng đang truy cập trong tình huống đa ứng dụng |
| `X-Locale` | Ngôn ngữ hiện tại (ví dụ: `zh-CN`, `en-US`) |
| `X-Hostname` | Tên host của client |
| `X-Timezone` | Múi giờ của client (ví dụ: `+08:00`) |
| `X-Role` | Role hiện tại |
| `X-Authenticator` | Phương thức xác thực hiện tại |

> 💡 **Mẹo**  
> Các header này thường được tự động chèn vào bởi interceptor, không cần thiết lập thủ công. Chỉ cần thêm thủ công trong các tình huống đặc biệt (như môi trường kiểm thử hoặc đa instance).

## Sử dụng trong Component

Trong Component React, bạn có thể lấy đối tượng context thông qua `useFlowContext()`, từ đó gọi `ctx.api` để gửi request.

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

  return <div>Đang tải...</div>;
};
```

### Kết hợp với useRequest của ahooks

Trong phát triển thực tế, bạn có thể kết hợp với Hook `useRequest` do [ahooks](https://ahooks.js.org/hooks/use-request/index) cung cấp để xử lý vòng đời và trạng thái của request một cách tiện lợi hơn.

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

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>Yêu cầu lỗi: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Làm mới</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

Cách này giúp logic request trở nên khai báo hơn, tự động quản lý trạng thái loading, thông báo lỗi và logic làm mới, rất phù hợp khi sử dụng trong component.
