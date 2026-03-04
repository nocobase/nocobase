:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/route) bakın.
:::

# ctx.route

Mevcut rota eşleşme bilgileri, React Router'daki `route` kavramına karşılık gelir. Mevcut eşleşen rota yapılandırmasını, parametreleri ve daha fazlasını almak için kullanılır. Genellikle `ctx.router` ve `ctx.location` ile birlikte kullanılır.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSBlock / JSField** | `route.pathname` veya `route.params` değerine göre koşullu oluşturma (rendering) yapın veya mevcut sayfa tanımlayıcısını görüntüleyin. |
| **Bağlantı Kuralları / İş Akışı** | Mantıksal dallanma veya alt bileşenlere veri aktarımı için rota parametrelerini (örneğin `params.name`) okuyun. |
| **Görünüm Navigasyonu** | `ctx.router.navigate` işlemini tetikleyip tetiklememeye karar vermek için dahili olarak `ctx.route.pathname` ile hedef yolu karşılaştırın. |

> **Not:** `ctx.route` yalnızca bir rota bağlamı içeren RunJS ortamlarında (sayfa içindeki JSBlock'lar, İş Akışı sayfaları vb.) kullanılabilir. Saf arka uç veya rota bulunmayan bağlamlarda (arka plan iş akışları gibi) boş (null) olabilir.

## Tür Tanımı

```ts
type RouteOptions = {
  name?: string;   // Rota benzersiz tanımlayıcısı
  path?: string;   // Rota şablonu (örneğin /admin/:name)
  params?: Record<string, any>;  // Rota parametreleri (örneğin { name: 'users' })
  pathname?: string;  // Mevcut rotanın tam yolu (örneğin /admin/users)
};
```

## Yaygın Kullanılan Alanlar

| Alan | Tür | Açıklama |
|------|------|------|
| `pathname` | `string` | Mevcut rotanın tam yolu, `ctx.location.pathname` ile tutarlıdır. |
| `params` | `Record<string, any>` | Rota şablonundan çözümlenen dinamik parametreler, örneğin `{ name: 'users' }`. |
| `path` | `string` | Rota şablonu, örneğin `/admin/:name`. |
| `name` | `string` | Rota benzersiz tanımlayıcısı, genellikle çoklu Sekme veya çoklu görünüm senaryolarında kullanılır. |

## ctx.router ve ctx.location ile İlişkisi

| Kullanım Amacı | Önerilen Kullanım |
|------|----------|
| **Mevcut yolu okuma** | `ctx.route.pathname` veya `ctx.location.pathname`; eşleşme sırasında her ikisi de tutarlıdır. |
| **Rota parametrelerini okuma** | `ctx.route.params`, örneğin mevcut sayfa UID'sini temsil eden `params.name`. |
| **Navigasyon (Yönlendirme)** | `ctx.router.navigate(path)` |
| **Sorgu parametrelerini (query) ve state'i okuma** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` "eşleşen rota yapılandırmasına" odaklanırken, `ctx.location` "mevcut URL konumuna" odaklanır. İkisi birlikte mevcut rota durumunun tam bir tanımını sağlar.

## Örnekler

### pathname Okuma

```ts
// Mevcut yolu görüntüle
ctx.message.info('Mevcut Sayfa: ' + ctx.route.pathname);
```

### params Değerine Göre Dallanma

```ts
// params.name genellikle mevcut sayfa UID'sidir (örneğin bir iş akışı sayfası tanımlayıcısı)
if (ctx.route.params?.name === 'users') {
  // Kullanıcı yönetim sayfasında belirli bir mantığı çalıştır
}
```

### Bir İş Akışı Sayfasında Görüntüleme

```tsx
<div>
  <h1>Mevcut Sayfa - {ctx.route.pathname}</h1>
  <p>Rota Tanımlayıcı: {ctx.route.params?.name}</p>
</div>
```

## İlgili Sayfalar

- [ctx.router](./router.md): Rota navigasyonu. `ctx.router.navigate()` yolu değiştirdiğinde, `ctx.route` buna göre güncellenir.
- [ctx.location](./location.md): Mevcut URL konumu (pathname, search, hash, state), `ctx.route` ile birlikte kullanılır.