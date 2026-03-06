:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/open-view) bakın.
:::

# ctx.openView()

Belirtilen bir görünümü (çekmece, iletişim kutusu, gömülü sayfa vb.) programlı olarak açar. `FlowModelContext` tarafından sağlanır; `JSBlock`, tablo hücreleri ve iş akışları gibi senaryolarda yapılandırılmış `ChildPage` veya `PopupAction` görünümlerini açmak için kullanılır.

## Kullanım Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSBlock** | Bir buton tıklandığında detay/düzenleme iletişim kutusunu açar ve geçerli satırın `filterByTk` değerini iletir. |
| **Tablo Hücresi** | Hücre içinde bir buton oluşturur ve tıklandığında satır detayı iletişim kutusunu açar. |
| **İş Akışı / JSAction** | Başarılı bir işlemden sonra bir sonraki görünümü veya iletişim kutusunu açar. |
| **İlişki Alanı** | `ctx.runAction('openView', params)` aracılığıyla seçim/düzenleme iletişim kutusunu açar. |

> Not: `ctx.openView`, bir `FlowModel` bağlamının bulunduğu RunJS ortamında kullanılabilir. Eğer `uid` değerine karşılık gelen model mevcut değilse, otomatik olarak bir `PopupActionModel` oluşturulur ve kalıcı hale getirilir.

## İmza

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Parametre Açıklamaları

### uid

Görünüm modelinin benzersiz kimliği. Mevcut değilse otomatik olarak oluşturulur ve kaydedilir. Aynı iletişim kutusu birden fazla kez açıldığında yapılandırmanın yeniden kullanılabilmesi için `${ctx.model.uid}-detail` gibi kararlı bir UID kullanılması önerilir.

### Sık Kullanılan options Alanları

| Alan | Tip | Açıklama |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | Açılış yöntemi: çekmece (drawer), iletişim kutusu (dialog) veya gömülü (embed). Varsayılan: `drawer`. |
| `size` | `small` / `medium` / `large` | İletişim kutusu veya çekmece boyutu. Varsayılan: `medium`. |
| `title` | `string` | Görünüm başlığı. |
| `params` | `Record<string, any>` | Görünüme iletilen rastgele parametreler. |
| `filterByTk` | `any` | Birincil anahtar değeri; tekli kayıt detayı/düzenleme senaryoları için kullanılır. |
| `sourceId` | `string` | Kaynak kayıt kimliği; ilişki senaryolarında kullanılır. |
| `dataSourceKey` | `string` | Veri kaynağı. |
| `collectionName` | `string` | Koleksiyon adı. |
| `associationName` | `string` | İlişki alanı adı. |
| `navigation` | `boolean` | Rota navigasyonunun kullanılıp kullanılmayacağı. `defineProperties` veya `defineMethods` iletildiğinde bu değer zorunlu olarak `false` yapılır. |
| `preventClose` | `boolean` | Kapatmanın engellenip engellenmeyeceği. |
| `defineProperties` | `Record<string, PropertyOptions>` | Görünüm içindeki modele dinamik olarak özellikler enjekte eder. |
| `defineMethods` | `Record<string, Function>` | Görünüm içindeki modele dinamik olarak yöntemler enjekte eder. |

## Örnekler

### Temel Kullanım: Çekmece Açma

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('Detaylar'),
});
```

### Geçerli Satır Bağlamını İletme

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('Satır Detayları'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### runAction Aracılığıyla Açma

Bir model `openView` eylemiyle (ilişki alanları veya tıklanabilir alanlar gibi) yapılandırıldığında şunu çağırabilirsiniz:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### Özel Bağlam Enjekte Etme

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## ctx.viewer ve ctx.view ile İlişkisi

| Kullanım Amacı | Önerilen Yöntem |
|------|----------|
| **Yapılandırılmış bir akış görünümünü açmak** | `ctx.openView(uid, options)` |
| **Özel içerik açmak (akışsız)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **Şu an açık olan görünümü yönetmek** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView`, dahili olarak tam bir akış sayfası oluşturan bir `FlowPage` (`ChildPageModel`) açar; `ctx.viewer` ise herhangi bir React içeriğini açar.

## Dikkat Edilmesi Gerekenler

- Bloklar arası çakışmaları önlemek için `uid` değerinin `ctx.model.uid` ile ilişkilendirilmesi önerilir (örneğin: `${ctx.model.uid}-xxx`).
- `defineProperties` veya `defineMethods` iletildiğinde, sayfa yenilendikten sonra bağlam kaybını önlemek için `navigation` zorunlu olarak `false` yapılır.
- İletişim kutusu içinde `ctx.view`, mevcut görünüm örneğine atıfta bulunur; `ctx.view.inputArgs` ise açılış sırasında iletilen parametreleri okumak için kullanılabilir.

## İlgili Konular

- [ctx.view](./view.md): Şu an açık olan görünüm örneği.
- [ctx.model](./model.md): Kararlı bir `popupUid` oluşturmak için kullanılan mevcut model.