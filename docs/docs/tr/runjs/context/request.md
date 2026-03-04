:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/request) bakın.
:::

# ctx.request()

RunJS içinde kimlik doğrulamalı bir HTTP isteği başlatın. İstek, mevcut uygulamanın `baseURL`, `Token`, `locale`, `role` vb. bilgilerini otomatik olarak taşır ve uygulamanın istek durdurma (interception) ve hata işleme mantığını izler.

## Uygulama Senaryoları

RunJS içinde uzak bir HTTP isteği başlatılması gereken her senaryoda kullanılabilir; örneğin JSBlock, JSField, JSItem, JSColumn, iş akışı (Workflow), bağlantı (Linkage), JSAction vb.

## Tür Tanımı

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions`, Axios'un `AxiosRequestConfig` yapısını genişletir:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // İstek başarısız olduğunda küresel hata uyarılarının atlanıp atlanmayacağı
  skipAuth?: boolean;                                 // Kimlik doğrulama yönlendirmesinin atlanıp atlanmayacağı (örneğin, 401 hatasında giriş sayfasına yönlendirmeme)
};
```

## Yaygın Parametreler

| Parametre | Tür | Açıklama |
|------|------|------|
| `url` | string | İstek URL'si. Kaynak stilini (örneğin `users:list`, `posts:create`) veya tam bir URL'yi destekler |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | HTTP yöntemi, varsayılan `'get'` |
| `params` | object | URL'ye serileştirilen sorgu parametreleri |
| `data` | any | İstek gövdesi, post/put/patch için kullanılır |
| `headers` | object | Özel istek başlıkları |
| `skipNotify` | boolean \| (error) => boolean | true ise veya fonksiyon true dönerse, hata durumunda küresel hata uyarısı gösterilmez |
| `skipAuth` | boolean | true ise, 401 vb. hatalar kimlik doğrulama yönlendirmesini (örneğin giriş sayfasına yönlendirme) tetiklemez |

## Kaynak Stili URL

NocoBase Kaynak API'si, kısa `kaynak:eylem` formatını destekler:

| Format | Açıklama | Örnek |
|------|------|------|
| `koleksiyon:eylem` | Tek koleksiyon CRUD işlemleri | `users:list`, `users:get`, `users:create`, `posts:update` |
| `koleksiyon.ilişki:eylem` | İlişkili kaynaklar (`resourceOf` veya URL üzerinden birincil anahtarın iletilmesini gerektirir) | `posts.comments:list` |

Göreceli yollar, uygulamanın `baseURL` (genellikle `/api`) adresiyle birleştirilir; alanlar arası (cross-origin) istekler için tam URL kullanılmalıdır ve hedef servis CORS yapılandırmasına sahip olmalıdır.

## Yanıt Yapısı

Dönüş değeri bir Axios yanıt nesnesidir. Yaygın alanlar:

- `response.data`: Yanıt gövdesi
- Liste arayüzleri genellikle `data.data` (kayıt dizisi) + `data.meta` (sayfalama vb.) döndürür
- Tek kayıt/oluşturma/güncelleme arayüzleri genellikle kaydı `data.data` içinde döndürür

## Örnekler

### Liste Sorgulama

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // Sayfalama vb. bilgiler
```

### Veri Gönderme

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'Ahmet Yılmaz', email: 'ahmet@example.com' },
});

const newRecord = res?.data?.data;
```

### Filtreleme ve Sıralama ile

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### Hata Bildirimini Atla

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // Başarısızlık durumunda küresel mesajı gösterme
});

// Veya hata türüne göre atlanıp atlanmayacağına karar verin
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Alanlar Arası (Cross-Origin) İstek

Diğer alan adlarına istekte bulunmak için tam URL kullanıldığında, hedef servisin mevcut uygulamanın kaynağına (origin) izin verecek şekilde CORS yapılandırılmış olması gerekir. Hedef arayüz kendi token'ını gerektiriyorsa, bu headers üzerinden iletilebilir:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <hedef_servis_token>',
  },
});
```

### ctx.render ile Görüntüleme

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('Kullanıcı Listesi') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Notlar

- **Hata İşleme**: İstek başarısız olduğunda bir istisna (exception) fırlatılır ve varsayılan olarak küresel bir hata uyarısı açılır. Bunu kendiniz yakalayıp işlemek için `skipNotify: true` kullanın.
- **Kimlik Doğrulama**: Aynı kaynaklı (same-origin) istekler mevcut kullanıcının Token, locale ve role bilgilerini otomatik olarak taşır; alanlar arası istekler için hedefin CORS desteklemesi ve gerektiğinde token'ın başlıklarda iletilmesi gerekir.
- **Kaynak Yetkileri**: İstekler ACL (Erişim Kontrol Listesi) kısıtlamalarına tabidir ve yalnızca mevcut kullanıcının yetkisi olan kaynaklara erişebilir.

## İlgili

- [ctx.message](./message.md) - İstek tamamlandıktan sonra hafif ipuçları görüntüleyin
- [ctx.notification](./notification.md) - İstek tamamlandıktan sonra bildirimler görüntüleyin
- [ctx.render](./render.md) - İstek sonuçlarını arayüze işleyin (render)
- [ctx.makeResource](./make-resource.md) - Zincirleme veri yükleme için bir kaynak nesnesi oluşturun (`ctx.request` kullanımına alternatif)