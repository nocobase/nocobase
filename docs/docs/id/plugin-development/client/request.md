---
title: "Request"
description: "Request client NocoBase: api.request, APIClient, HTTP request, memanggil API backend."
keywords: "Request,api.request,APIClient,HTTP request,panggilan API,NocoBase"
---

# Request

NocoBase menyediakan `APIClient` yang berbasis enkapsulasi [Axios](https://axios-http.com/), untuk melakukan HTTP request di tempat mana pun yang dapat memperoleh `Context`.

Lokasi umum yang dapat memperoleh `Context` termasuk:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` adalah method yang paling sering digunakan untuk membuat request, parameter dan return value-nya sepenuhnya konsisten dengan [axios.request()](https://axios-http.com/docs/req_config).

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

Penggunaan Dasar

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

Anda dapat langsung menggunakan konfigurasi request Axios standar:

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

`ctx.api.axios` adalah instance `AxiosInstance`, dapat digunakan untuk memodifikasi konfigurasi default global atau menambahkan request interceptor.

Memodifikasi Konfigurasi Default

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

Untuk lebih banyak konfigurasi yang tersedia lihat [Konfigurasi Default Axios](https://axios-http.com/docs/config_defaults).

## Request dan Response Interceptor

Melalui interceptor dapat memproses sebelum request dikirim atau setelah response dikembalikan. Misalnya, secara terpadu menambahkan request header, serialize parameter, atau secara terpadu memberikan notifikasi error.

### Contoh Request Interceptor

```ts
// Menggunakan qs untuk serialize parameter params
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// Custom request header
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

### Contoh Response Interceptor

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Saat request error, tampilkan notifikasi terpadu
    ctx.notification.error({
      message: 'Request response error',
    });
    return Promise.reject(error);
  },
);
```

## Custom Request Header NocoBase Server

Berikut adalah custom request header yang didukung NocoBase Server, dapat digunakan untuk skenario multi aplikasi, internasionalisasi, multi role atau multi autentikasi.

| Header | Penjelasan |
|--------|------|
| `X-App` | Menentukan aplikasi yang sedang diakses dalam skenario multi-aplikasi |
| `X-Locale` | Bahasa saat ini (seperti: `zh-CN`, `en-US`) |
| `X-Hostname` | Hostname client |
| `X-Timezone` | Zona waktu client (seperti: `+08:00`) |
| `X-Role` | Role saat ini |
| `X-Authenticator` | Cara autentikasi pengguna saat ini |

> Tips  
> Request header ini biasanya disuntikkan otomatis oleh interceptor, tidak perlu diatur secara manual. Hanya dalam skenario khusus (seperti environment test atau skenario multi instance) perlu ditambahkan secara manual.

## Penggunaan dalam Component

Dalam Component React, dapat memperoleh objek konteks melalui `useFlowContext()`, sehingga dapat memanggil `ctx.api` untuk membuat request.

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

  return <div>Loading...</div>;
};
```

### Menggunakan Bersama useRequest dari ahooks

Dalam pengembangan aktual, dapat dikombinasikan dengan Hook `useRequest` yang disediakan oleh [ahooks](https://ahooks.js.org/hooks/use-request/index), untuk lebih mudah menangani siklus hidup dan status request.

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

Cara ini membuat logika request lebih deklaratif, otomatis mengelola status loading, notifikasi error, dan logika refresh, sangat cocok digunakan dalam Component.
