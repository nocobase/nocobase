:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Permintaan

NocoBase menyediakan `APIClient` yang dibangun di atas [Axios](https://axios-http.com/). Anda bisa menggunakannya untuk membuat permintaan HTTP dari mana saja Anda bisa mendapatkan `Context`.

Lokasi umum di mana Anda bisa mendapatkan `Context` meliputi:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` adalah metode yang paling sering digunakan untuk membuat permintaan. Parameter dan nilai kembaliannya sama persis dengan [axios.request()](https://axios-http.com/docs/req_config).

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

Anda bisa langsung menggunakan konfigurasi permintaan Axios standar:

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

`ctx.api.axios` adalah sebuah instans `AxiosInstance`. Melalui instans ini, Anda dapat mengubah konfigurasi default global atau menambahkan *interceptor* permintaan.

Mengubah Konfigurasi Default

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

Untuk konfigurasi yang lebih lengkap, lihat [Konfigurasi Default Axios](https://axios-http.com/docs/config_defaults).

## Interceptor Permintaan dan Respons

*Interceptor* dapat memproses permintaan sebelum dikirim atau respons setelah diterima. Misalnya, untuk menambahkan *header* permintaan secara seragam, melakukan serialisasi parameter, atau menampilkan notifikasi kesalahan yang terpadu.

### Contoh Interceptor Permintaan

```ts
// Menggunakan qs untuk melakukan serialisasi parameter
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// Header permintaan kustom
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

### Contoh Interceptor Respons

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Menampilkan notifikasi terpadu saat permintaan gagal
    ctx.notification.error({
      message: 'Permintaan respons error',
    });
    return Promise.reject(error);
  },
);
```

## Header Permintaan Kustom NocoBase Server

Berikut adalah *header* permintaan kustom yang didukung oleh NocoBase Server, yang dapat digunakan untuk skenario multi-aplikasi, internasionalisasi, multi-peran, atau multi-autentikasi.

| Header | Deskripsi |
|--------|-----------|
| `X-App` | Menentukan aplikasi yang sedang diakses dalam skenario multi-aplikasi |
| `X-Locale` | Bahasa saat ini (misalnya: `zh-CN`, `en-US`) |
| `X-Hostname` | *Hostname* klien |
| `X-Timezone` | Zona waktu klien (misalnya: `+08:00`) |
| `X-Role` | Peran saat ini |
| `X-Authenticator` | Metode autentikasi pengguna saat ini |

> 💡 **Tips**  
> *Header* permintaan ini biasanya disuntikkan secara otomatis oleh *interceptor* dan tidak perlu diatur secara manual. Anda hanya perlu menambahkannya secara manual dalam skenario khusus (seperti lingkungan pengujian atau skenario multi-instans).

## Penggunaan dalam Komponen

Dalam komponen React, Anda bisa mendapatkan objek konteks melalui `useFlowContext()` dan kemudian memanggil `ctx.api` untuk membuat permintaan.

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

  return <div>Memuat...</div>;
};
```

### Menggunakan dengan `useRequest` dari ahooks

Dalam pengembangan nyata, Anda dapat menggunakan *Hook* `useRequest` yang disediakan oleh [ahooks](https://ahooks.js.org/hooks/use-request/index) untuk menangani siklus hidup dan status permintaan dengan lebih mudah.

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

  if (loading) return <div>Memuat...</div>;
  if (error) return <div>Permintaan gagal: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Segarkan</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

Pendekatan ini membuat logika permintaan lebih deklaratif, secara otomatis mengelola status pemuatan, penanganan kesalahan, dan logika penyegaran, sehingga sangat cocok untuk digunakan dalam komponen.