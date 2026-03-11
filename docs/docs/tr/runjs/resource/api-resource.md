:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/resource/api-resource) bakın.
:::

# APIResource

URL tabanlı istekler başlatmak için kullanılan **genel API kaynağıdır** ve her türlü HTTP arayüzü için uygundur. `FlowResource` temel sınıfından türetilmiştir; istek yapılandırması ve `refresh()` metodu ile genişletilmiştir. [MultiRecordResource](./multi-record-resource.md) ve [SingleRecordResource](./single-record-resource.md) yapılarından farklı olarak, `APIResource` bir kaynak adına (resource name) bağlı değildir; doğrudan URL üzerinden istek yapar. Bu özelliğiyle özel arayüzler, üçüncü taraf API'ler ve benzeri senaryolar için idealdir.

**Oluşturma yöntemi**: `ctx.makeResource('APIResource')` veya `ctx.initResource('APIResource')`. Kullanmadan önce `setURL()` çağrılmalıdır; RunJS bağlamında `ctx.api` (APIClient) otomatik olarak enjekte edilir, bu nedenle manuel olarak `setAPIClient` çağırmanıza gerek yoktur.

---

## Kullanım Senaryoları

| Senaryo | Açıklama |
|------|------|
| **Özel Arayüzler** | Standart olmayan kaynak API'lerini çağırma (örn. `/api/custom/stats`, `/api/reports/summary`). |
| **Üçüncü Taraf API** | Tam URL üzerinden harici servis istekleri (hedefin CORS desteklemesi gerekir). |
| **Tek Seferlik Sorgu** | Geçici veri çekme; verinin `ctx.resource`'a bağlanması gerekmez. |
| **APIResource ve ctx.request Seçimi** | Reaktif veri, olaylar (events) veya hata durumları yönetimi gerektiğinde `APIResource`; basit tek seferlik istekler için `ctx.request()` kullanın. |

---

## Temel Sınıf Yetenekleri (FlowResource)

Tüm Kaynaklar (Resources) şu yeteneklere sahiptir:

| Metot | Açıklama |
|------|------|
| `getData()` | Mevcut veriyi alır. |
| `setData(value)` | Veriyi ayarlar (yalnızca yerel). |
| `hasData()` | Veri olup olmadığını kontrol eder. |
| `getMeta(key?)` / `setMeta(meta)` | Meta verileri okur/yazar. |
| `getError()` / `setError(err)` / `clearError()` | Hata durumu yönetimi. |
| `on(event, callback)` / `once` / `off` / `emit` | Olay aboneliği ve tetikleme. |

---

## İstek Yapılandırması

| Metot | Açıklama |
|------|------|
| `setAPIClient(api)` | APIClient örneğini ayarlar (RunJS'de genellikle bağlam tarafından otomatik enjekte edilir). |
| `getURL()` / `setURL(url)` | İstek URL'si. |
| `loading` | Yükleme durumunu okuma/yazma (get/set). |
| `clearRequestParameters()` | İstek parametrelerini temizler. |
| `setRequestParameters(params)` | İstek parametrelerini birleştirerek ayarlar. |
| `setRequestMethod(method)` | İstek yöntemini ayarlar (örn. `'get'`, `'post'`, varsayılan `'get'`). |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | İstek başlıkları (headers). |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Tekil parametre ekleme, silme veya sorgulama. |
| `setRequestBody(data)` | İstek gövdesi (POST/PUT/PATCH işlemlerinde kullanılır). |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Genel istek seçenekleri. |

---

## URL Formatı

- **Kaynak Stili (Resource Style)**: `users:list` veya `posts:get` gibi NocoBase kaynak kısaltmalarını destekler; bunlar `baseURL` ile birleştirilir.
- **Göreceli Yol (Relative Path)**: Örn. `/api/custom/endpoint`, uygulamanın `baseURL`'i ile birleştirilir.
- **Tam URL (Full URL)**: Alan adları arası (cross-origin) isteklerde tam adresi kullanın; hedef servisin CORS yapılandırması olmalıdır.

---

## Veri Çekme

| Metot | Açıklama |
|------|------|
| `refresh()` | Mevcut URL, yöntem, parametreler, başlıklar ve gövde verisiyle bir istek başlatır. Yanıt verisini (`data`) `setData(data)` içine yazar ve `'refresh'` olayını tetikler. Başarısızlık durumunda `setError(err)` ayarlar ve `ResourceError` fırlatır; bu durumda `'refresh'` olayı tetiklenmez. `api` ve URL'nin önceden ayarlanmış olması gerekir. |

---

## Örnekler

### Temel GET İsteği

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### Kaynak Stili URL

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### POST İsteği (İstek Gövdesi ile)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'test', type: 'report' });
await res.refresh();
const result = res.getData();
```

### refresh Olayını Dinleme

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>İstatistikler: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Hata Yönetimi

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'İstek başarısız oldu');
}
```

### Özel İstek Başlıkları

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'değer');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Dikkat Edilmesi Gerekenler

- **ctx.api Bağımlılığı**: RunJS içinde `ctx.api` çalışma ortamı tarafından enjekte edilir; manuel `setAPIClient` genellikle gerekmez. Bağlam dışı (context-less) bir senaryoda kullanılıyorsa, bunu kendiniz ayarlamalısınız.
- **Refresh İstek Demektir**: `refresh()` metodu mevcut yapılandırmaya göre bir istek başlatır; yöntem, parametreler ve veriler çağrıdan önce yapılandırılmalıdır.
- **Hatalar Veriyi Güncellemez**: İstek başarısız olduğunda `getData()` eski değerini korur; hata bilgilerine `getError()` üzerinden erişilebilir.
- **ctx.request ile Karşılaştırma**: Basit, tek seferlik istekler için `ctx.request()` kullanın; reaktif veri, olaylar ve hata durumu yönetimi gerektiğinde `APIResource` tercih edin.

---

## İlgili Konular

- [ctx.resource](../context/resource.md) - Mevcut bağlamdaki kaynak örneği
- [ctx.initResource()](../context/init-resource.md) - Başlat ve `ctx.resource`'a bağla
- [ctx.makeResource()](../context/make-resource.md) - Bağlamadan yeni bir kaynak örneği oluştur
- [ctx.request()](../context/request.md) - Genel HTTP isteği, basit tek seferlik çağrılar için uygun
- [MultiRecordResource](./multi-record-resource.md) - Koleksiyonlar/listeler için, CRUD ve sayfalama desteği
- [SingleRecordResource](./single-record-resource.md) - Tekil kayıtlar için