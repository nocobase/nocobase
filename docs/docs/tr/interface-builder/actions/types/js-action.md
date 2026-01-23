:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# JS Action

## Giriş

JS Action, bir düğmeye tıklandığında JavaScript çalıştırmak ve her türlü iş mantığını özelleştirmeye olanak tanır. Doğrulama, bildirim gösterme, API çağrıları yapma, açılır pencereler/çekmeceler açma ve verileri yenileme gibi işlemleri gerçekleştirmek için form araç çubukları, tablo araç çubukları (koleksiyon düzeyinde), tablo satırları (kayıt düzeyinde) ve benzeri yerlerde kullanılabilir.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## Çalışma Zamanı Bağlam API'si (Sık Kullanılanlar)

- `ctx.api.request(options)`: HTTP isteği yapar;
- `ctx.openView(viewUid, options)`: Yapılandırılmış bir görünümü (çekmece/iletişim kutusu/sayfa) açar;
- `ctx.message` / `ctx.notification`: Genel mesajlar ve bildirimler;
- `ctx.t()` / `ctx.i18n.t()`: Uluslararasılaştırma;
- `ctx.resource`: Koleksiyon düzeyindeki bağlam için veri kaynağı (örn. tablo araç çubuğu), `getSelectedRows()` ve `refresh()` gibi yöntemleri içerir;
- `ctx.record`: Kayıt düzeyindeki bağlam için mevcut satır kaydı (örn. tablo satırı düğmesi);
- `ctx.form`: Form düzeyindeki bağlam için AntD Form örneği (örn. form araç çubuğu düğmesi);
- `ctx.collection`: Mevcut koleksiyonun meta bilgileri;
- Kod düzenleyici, `Snippets` (kod parçacıkları) ve `Run` (ön çalıştırma) özelliklerini destekler (aşağıya bakın).

- `ctx.requireAsync(url)`: Bir URL'den AMD/UMD kütüphanesini eşzamansız olarak yükler;
- `ctx.importAsync(url)`: Bir URL'den ESM modülünü dinamik olarak içe aktarır;

> Düğmenin konumuna bağlı olarak kullanılabilir değişkenler farklılık gösterebilir. Yukarıdaki liste, sık kullanılan yeteneklere genel bir bakıştır.

## Düzenleyici ve Kod Parçacıkları

- `Snippets`: Dahili kod parçacıkları listesini açar. Bu listede arama yapabilir ve tek tıklamayla mevcut imleç konumuna ekleyebilirsiniz.
- `Run`: Mevcut kodu doğrudan çalıştırır ve çalıştırma günlüklerini alttaki `Logs` paneline aktarır. `console.log/info/warn/error` komutlarını destekler ve hataları kolayca bulmak için vurgular.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Betikleri oluşturmak/değiştirmek için yapay zeka çalışanlarını kullanabilirsiniz: [Yapay Zeka Çalışanı · Nathan: Ön Uç Mühendisi](/ai-employees/built-in/ai-coding)

## Yaygın Kullanım (Basitleştirilmiş Örnekler)

### 1) API İsteği ve Bildirim

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Koleksiyon Düğmesi: Seçimi Doğrulama ve İşleme

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: İş mantığını uygulayın…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Kayıt Düğmesi: Mevcut Satır Kaydını Okuma

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) Görünüm Açma (Çekmece/İletişim Kutusu)

```js
const popupUid = ctx.model.uid + '-open'; // Mevcut düğmeye bağlayarak kararlılığı sağlayın
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Gönderim Sonrası Verileri Yenileme

```js
// Genel yenileme: Öncelikle tablo/liste kaynakları, ardından formu içeren bloğun kaynağı önceliklidir.
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```

## Dikkat Edilmesi Gerekenler

- **Eylemlerin İdempotent Olması**: Tekrarlanan tıklamaların neden olduğu çoklu gönderimleri önlemek için mantığınıza bir durum anahtarı ekleyebilir veya düğmeyi devre dışı bırakabilirsiniz.
- **Hata Yönetimi**: API çağrıları için `try/catch` blokları ekleyin ve kullanıcıya bilgilendirici geri bildirim sağlayın.
- **Görünüm Etkileşimi**: `ctx.openView` ile bir açılır pencere/çekmece açarken, parametreleri açıkça iletmeniz ve gerekirse başarılı bir gönderimden sonra üst kaynağı aktif olarak yenilemeniz önerilir.

## İlgili Belgeler

- [Değişkenler ve Bağlam](/interface-builder/variables)
- [Bağlantı Kuralları](/interface-builder/linkage-rule)
- [Görünümler ve Açılır Pencereler](/interface-builder/actions/types/view)