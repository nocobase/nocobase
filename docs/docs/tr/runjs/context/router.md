:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/router) bakın.
:::

# ctx.router

RunJS içinde kod aracılığıyla navigasyon yapmak için kullanılan, React Router tabanlı bir yönlendirici (router) örneğidir. Genellikle `ctx.route` ve `ctx.location` ile birlikte kullanılır.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSBlock / JSField** | Bir butona tıklandıktan sonra detay sayfalarına, liste sayfalarına veya harici bağlantılara yönlendirme yapın. |
| **Bağlantı Kuralları / Olay Akışı** | Başarılı bir gönderimden sonra liste veya detay sayfasına `navigate` işlemini yürütün veya hedef sayfaya `state` aktarın. |
| **JSAction / Olay İşleme** | Form gönderimleri veya bağlantı tıklamaları gibi mantıksal işlemler içinde rota navigasyonunu gerçekleştirin. |
| **Görünüm Navigasyonu** | Dahili görünüm yığını (view stack) geçişleri sırasında `navigate` aracılığıyla URL'yi güncelleyin. |

> Not: `ctx.router` yalnızca bir yönlendirme bağlamı (routing context) bulunan RunJS ortamlarında kullanılabilir (örneğin sayfa içindeki JSBlock, Akış sayfaları, olay akışları vb.); saf arka uç veya yönlendirme bulunmayan bağlamlarda (örneğin İş Akışları) boş (null) olabilir.

## Tür Tanımı

```typescript
router: Router
```

`Router`, `@remix-run/router` paketinden türetilmiştir. RunJS'de yönlendirme, geri gitme ve yenileme gibi navigasyon işlemleri `ctx.router.navigate()` aracılığıyla uygulanır.

## Yöntemler

### ctx.router.navigate()

Hedef yola yönlendirir veya geri gitme/yenileme işlemini yürütür.

**İmza:**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Parametreler:**

- `to`: Hedef yol (string), göreceli geçmiş konumu (sayı, örneğin geri gitmek için `-1`) veya `null` (mevcut sayfayı yenilemek için).
- `options`: İsteğe bağlı yapılandırma.
  - `replace?: boolean`: Mevcut geçmiş kaydının değiştirilip değiştirilmeyeceği (varsayılan `false`'tur, yani yeni bir kayıt ekler).
  - `state?: any`: Hedef rotaya aktarılacak durum (state). Bu veri URL'de görünmez ve hedef sayfada `ctx.location.state` üzerinden erişilebilir. Hassas bilgiler, geçici veriler veya URL'de yer almaması gereken bilgiler için uygundur.

## Örnekler

### Temel Navigasyon

```ts
// Kullanıcı listesine yönlendir (yeni geçmiş kaydı ekler, geri gidilebilir)
ctx.router.navigate('/admin/users');

// Bir detay sayfasına yönlendir
ctx.router.navigate(`/admin/users/${recordId}`);
```

### Geçmişi Değiştirme (Yeni kayıt eklemeden)

```ts
// Giriş yaptıktan sonra ana sayfaya yönlendir; kullanıcı geri gittiğinde giriş sayfasına dönmez
ctx.router.navigate('/admin', { replace: true });

// Başarılı form gönderiminden sonra mevcut sayfayı detay sayfasıyla değiştir
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### State Aktarma

```ts
// Navigasyon sırasında veri taşı; hedef sayfa bu veriyi ctx.location.state üzerinden alır
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### Geri Gitme ve Yenileme

```ts
// Bir sayfa geri git
ctx.router.navigate(-1);

// İki sayfa geri git
ctx.router.navigate(-2);

// Mevcut sayfayı yenile
ctx.router.navigate(null);
```

## ctx.route ve ctx.location ile İlişkisi

| Kullanım Amacı | Önerilen Kullanım |
|------|----------|
| **Navigasyon/Yönlendirme** | `ctx.router.navigate(path)` |
| **Mevcut yolu okuma** | `ctx.route.pathname` veya `ctx.location.pathname` |
| **Navigasyon sırasında aktarılan state'i okuma** | `ctx.location.state` |
| **Rota parametrelerini okuma** | `ctx.route.params` |

`ctx.router` "navigasyon eylemlerinden", `ctx.route` ve `ctx.location` ise "mevcut rota durumundan" sorumludur.

## Notlar

- `navigate(path)` varsayılan olarak yeni bir geçmiş kaydı ekler, böylece kullanıcılar tarayıcının geri butonuyla geri dönebilir.
- `replace: true`, yeni bir kayıt eklemeden mevcut geçmiş kaydını değiştirir; bu, oturum açma sonrası yönlendirme veya başarılı gönderim sonrası navigasyon gibi senaryolar için uygundur.
- **`state` parametresi hakkında**:
  - `state` aracılığıyla aktarılan veriler URL'de görünmez, bu da onu hassas veya geçici veriler için uygun kılar.
  - Hedef sayfada `ctx.location.state` üzerinden erişilebilir.
  - `state` tarayıcı geçmişinde saklanır ve ileri/geri navigasyon sırasında erişilebilir kalır.
  - Sayfa tamamen yenilendiğinde (hard refresh) `state` kaybolur.

## İlgili

- [ctx.route](./route.md): Mevcut rota eşleşme bilgileri (pathname, params vb.).
- [ctx.location](./location.md): Mevcut URL konumu (pathname, search, hash, state); navigasyon sonrası `state` buradan okunur.