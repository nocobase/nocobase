:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Yêu cầu

NocoBase cung cấp một `APIClient` được đóng gói dựa trên [Axios](https://axios-http.com/), cho phép bạn gửi các yêu cầu HTTP từ bất kỳ đâu có thể truy cập `Context`.

Các vị trí phổ biến mà bạn có thể truy cập `Context` bao gồm:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` là phương thức phổ biến nhất để gửi yêu cầu. Các tham số và giá trị trả về của nó hoàn toàn giống với [axios.request()](https://axios-http.com/docs/req_config).

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

### Cách sử dụng cơ bản

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

Bạn có thể sử dụng trực tiếp các cấu hình yêu cầu Axios tiêu chuẩn:

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

`ctx.api.axios` là một thể hiện của `AxiosInstance`, cho phép bạn sửa đổi cấu hình mặc định toàn cục hoặc thêm các bộ chặn yêu cầu.

### Sửa đổi cấu hình mặc định

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

Để biết thêm các cấu hình có sẵn, vui lòng xem [Cấu hình mặc định của Axios](https://axios-http.com/docs/config_defaults).

## Bộ chặn yêu cầu và phản hồi

Thông qua các bộ chặn, bạn có thể xử lý yêu cầu trước khi chúng được gửi hoặc phản hồi sau khi chúng được trả về. Ví dụ, bạn có thể thống nhất thêm tiêu đề yêu cầu, tuần tự hóa tham số hoặc hiển thị thông báo lỗi chung.

### Ví dụ về bộ chặn yêu cầu

```ts
// Sử dụng qs để tuần tự hóa tham số params
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// Tiêu đề yêu cầu tùy chỉnh
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

### Ví dụ về bộ chặn phản hồi

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Khi yêu cầu gặp lỗi, hiển thị thông báo lỗi chung
    ctx.notification.error({
      message: 'Lỗi phản hồi yêu cầu',
    });
    return Promise.reject(error);
  },
);
```

## Tiêu đề yêu cầu tùy chỉnh của NocoBase Server

Dưới đây là các tiêu đề yêu cầu tùy chỉnh được NocoBase Server hỗ trợ, có thể được sử dụng trong các tình huống đa ứng dụng, quốc tế hóa, đa vai trò hoặc đa xác thực.

| Tiêu đề           | Mô tả                                                      |
| ----------------- | ---------------------------------------------------------- |
| `X-App`           | Chỉ định ứng dụng hiện tại được truy cập trong các tình huống đa ứng dụng |
| `X-Locale`        | Ngôn ngữ hiện tại (ví dụ: `zh-CN`, `en-US`)               |
| `X-Hostname`      | Tên máy chủ của client                                     |
| `X-Timezone`      | Múi giờ của client (ví dụ: `+08:00`)                      |
| `X-Role`          | Vai trò hiện tại                                           |
| `X-Authenticator` | Phương thức xác thực người dùng hiện tại                  |

> 💡 **Mẹo**  
> Các tiêu đề yêu cầu này thường được các bộ chặn tự động thêm vào và không cần thiết lập thủ công. Bạn chỉ cần thêm chúng thủ công trong các trường hợp đặc biệt (như môi trường kiểm thử hoặc tình huống đa thể hiện).

## Sử dụng trong các thành phần

Trong các thành phần React, bạn có thể lấy đối tượng ngữ cảnh thông qua `useFlowContext()` và sau đó gọi `ctx.api` để gửi yêu cầu.

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

  return <div>Đang tải...</div>;
};
```

### Sử dụng cùng với useRequest của ahooks

Trong quá trình phát triển thực tế, bạn có thể kết hợp với Hook `useRequest` do [ahooks](https://ahooks.js.org/hooks/use-request/index) cung cấp để xử lý vòng đời và trạng thái của yêu cầu một cách thuận tiện hơn.

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

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>Lỗi yêu cầu: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Làm mới</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

Cách tiếp cận này giúp logic yêu cầu trở nên khai báo hơn, tự động quản lý trạng thái tải, thông báo lỗi và logic làm mới, rất phù hợp để sử dụng trong các thành phần.