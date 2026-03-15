:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/location) bakın.
:::

# ctx.location

Mevcut rota konum bilgisi, React Router'ın `location` nesnesine eşdeğerdir. Genellikle mevcut yolu, sorgu dizesini (query string), hash'i ve rota üzerinden iletilen durumu (state) okumak için `ctx.router` ve `ctx.route` ile birlikte kullanılır.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSBlock / JSField** | Mevcut yola, sorgu parametrelerine veya hash'e göre koşullu oluşturma (rendering) veya mantıksal dallanma yapın. |
| **Bağlantı Kuralları / Olay Akışı** | Bağlantı filtrelemesi için URL sorgu parametrelerini okuyun veya `location.state` üzerinden kaynağı belirleyin. |
| **Yönlendirme Sonrası İşlemler** | Hedef sayfada `ctx.location.state` kullanarak önceki sayfadan `ctx.router.navigate` aracılığıyla iletilen verileri alın. |

> Not: `ctx.location` yalnızca bir rota bağlamı olan RunJS ortamlarında (sayfa içindeki JSBlock, olay akışları vb.) kullanılabilir; saf arka uçta veya rota bulunmayan bağlamlarda (örneğin iş akışları) boş olabilir.

## Tür Tanımı

```ts
location: Location;
```

`Location`, `react-router-dom` kütüphanesinden gelir ve React Router'ın `useLocation()` dönüş değeri ile aynıdır.

## Sık Kullanılan Alanlar

| Alan | Tür | Açıklama |
|------|------|------|
| `pathname` | `string` | Mevcut yol, `/` ile başlar (örneğin `/admin/users`) |
| `search` | `string` | Sorgu dizesi, `?` ile başlar (örneğin `?page=1&status=active`) |
| `hash` | `string` | Hash parçası, `#` ile başlar (örneğin `#section-1`) |
| `state` | `any` | `ctx.router.navigate(path, { state })` aracılığıyla iletilen, URL'de görünmeyen rastgele veriler |
| `key` | `string` | Bu konumun benzersiz tanımlayıcısı; başlangıç sayfası `"default"` değerini alır |

## ctx.router ve ctx.urlSearchParams ile İlişkisi

| Kullanım | Önerilen Yöntem |
|------|----------|
| **Yol, hash ve state okuma** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Sorgu parametrelerini okuma (nesne formatında)** | `ctx.urlSearchParams`, ayrıştırılmış nesneyi doğrudan verir |
| **Search dizesini ayrıştırma** | `new URLSearchParams(ctx.location.search)` veya doğrudan `ctx.urlSearchParams` kullanın |

`ctx.urlSearchParams`, `ctx.location.search` üzerinden ayrıştırılır. Yalnızca sorgu parametrelerine ihtiyacınız varsa, `ctx.urlSearchParams` kullanmak daha pratiktir.

## Örnekler

### Yola Göre Dallanma Yapma

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('Şu anda kullanıcı yönetim sayfasındasınız');
}
```

### Sorgu Parametrelerini Ayrıştırma

```ts
// Yöntem 1: ctx.urlSearchParams kullanımı (Önerilen)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Yöntem 2: search dizesini ayrıştırmak için URLSearchParams kullanımı
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Rota Yönlendirmesi ile İletilen State'i Alma

```ts
// Önceki sayfadan yönlendirme yaparken: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Panelden (dashboard) yönlendirildi');
}
```

### Hash ile Çapa (Anchor) Konumu Belirleme

```ts
const hash = ctx.location.hash; // örneğin "#edit"
if (hash === '#edit') {
  // Düzenleme alanına kaydırın veya ilgili mantığı çalıştırın
}
```

## İlgili Konular

- [ctx.router](./router.md): Rota navigasyonu; `ctx.router.navigate` içindeki `state`, hedef sayfada `ctx.location.state` üzerinden alınabilir.
- [ctx.route](./route.md): Mevcut rota eşleşme bilgileri (parametreler, yapılandırma vb.), genellikle `ctx.location` ile birlikte kullanılır.