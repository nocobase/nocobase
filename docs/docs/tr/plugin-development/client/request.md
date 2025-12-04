:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# İstekler

NocoBase, [Axios](https://axios-http.com/) tabanlı bir `APIClient` sunar. Bu `APIClient`'ı, `Context`'e erişebildiğiniz her yerden HTTP istekleri yapmak için kullanabilirsiniz.

`Context`'e erişebileceğiniz yaygın yerler şunlardır:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()`, istek yapmak için en sık kullanılan yöntemdir. Parametreleri ve dönüş değerleri, [axios.request()](https://axios-http.com/docs/req_config) ile tamamen aynıdır.

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

Temel Kullanım

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

Standart Axios istek yapılandırmalarını doğrudan kullanabilirsiniz:

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

`ctx.api.axios`, global varsayılan yapılandırmaları değiştirebileceğiniz veya istek kesicileri ekleyebileceğiniz bir `AxiosInstance` örneğidir.

Varsayılan Yapılandırmayı Değiştirme

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

Daha fazla yapılandırma seçeneği için [Axios Varsayılan Yapılandırması](https://axios-http.com/docs/config_defaults) sayfasına bakabilirsiniz.

## İstek ve Yanıt Kesicileri

Kesiciler aracılığıyla, istekler gönderilmeden önce veya yanıtlar döndükten sonra işlem yapabilirsiniz. Örneğin, istek başlıklarını tutarlı bir şekilde ekleyebilir, parametreleri serileştirebilir veya birleşik hata mesajları gösterebilirsiniz.

### İstek Kesici Örneği

```ts
// params parametrelerini qs kullanarak serileştirin
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// Özel istek başlıkları
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

### Yanıt Kesici Örneği

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // İstek başarısız olduğunda birleşik bir bildirim gösterin
    ctx.notification.error({
      message: 'İstek yanıt hatası',
    });
    return Promise.reject(error);
  },
);
```

## NocoBase Sunucusu Özel İstek Başlıkları

Aşağıda, NocoBase Sunucusu tarafından desteklenen ve çoklu uygulama, uluslararasılaştırma, çoklu rol veya çoklu kimlik doğrulama senaryolarında kullanılabilecek özel istek başlıkları yer almaktadır.

| Başlık | Açıklama |
|--------|----------|
| `X-App` | Çoklu uygulama senaryolarında erişilen mevcut uygulamayı belirtir |
| `X-Locale` | Mevcut dil (örn: `zh-CN`, `en-US`) |
| `X-Hostname` | İstemci ana bilgisayar adı |
| `X-Timezone` | İstemcinin saat dilimi (örn: `+08:00`) |
| `X-Role` | Mevcut rol |
| `X-Authenticator` | Mevcut kullanıcı kimlik doğrulama yöntemi |

> 💡 **İpucu**  
> Bu istek başlıkları genellikle kesiciler tarafından otomatik olarak enjekte edilir ve manuel olarak ayarlamanıza gerek yoktur. Yalnızca özel senaryolarda (örneğin test ortamları veya çoklu örnek senaryoları) bunları manuel olarak eklemeniz gerekir.

## Bileşenlerde Kullanım

React bileşenlerinde, `useFlowContext()` aracılığıyla bağlam nesnesini alabilir ve ardından `ctx.api`'yi çağırarak istekler yapabilirsiniz.

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

  return <div>Yükleniyor...</div>;
};
```

### ahooks'un useRequest Hook'u ile Kullanım

Gerçek geliştirme ortamında, istek yaşam döngüsünü ve durumunu daha rahat yönetmek için [ahooks](https://ahooks.js.org/hooks/use-request/index) tarafından sağlanan `useRequest` Hook'unu kullanabilirsiniz.

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

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>İstek hatası: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Yenile</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

Bu yaklaşım, istek mantığını daha bildirimsel hale getirir, yükleme durumlarını, hata yönetimini ve yenileme mantığını otomatik olarak yönetir; bu da bileşenlerde kullanım için oldukça uygundur.