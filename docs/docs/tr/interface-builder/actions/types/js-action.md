:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/interface-builder/actions/types/js-action) bakın.
:::

# JS Action

## Tanıtım

JS Action, düğme tıklandığında JavaScript yürütmek ve herhangi bir iş davranışını özelleştirmek için kullanılır. Form araç çubukları, tablo araç çubukları (koleksiyon düzeyi), tablo satırları (kayıt düzeyi) gibi konumlarda doğrulama, ipucu, API çağrısı, açılır pencere/çekmece açma, veri yenileme gibi işlemleri gerçekleştirmek için kullanılabilir.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## Çalışma Zamanı Bağlam API'si (Sık Kullanılanlar)

- `ctx.api.request(options)`: HTTP isteği başlatır;
- `ctx.openView(viewUid, options)`: Yapılandırılmış bir görünümü (çekmece/iletişim kutusu/sayfa) açar;
- `ctx.message` / `ctx.notification`: Global ipuçları ve bildirimler;
- `ctx.t()` / `ctx.i18n.t()`: Uluslararasılaştırma;
- `ctx.resource`: Koleksiyon düzeyi bağlamın veri kaynağı (örneğin tablo araç çubuğu; `getSelectedRows()`, `refresh()` vb. içerir);
- `ctx.record`: Kayıt düzeyi bağlamın mevcut satır kaydı (örneğin tablo satırı düğmesi);
- `ctx.form`: Form düzeyi bağlamın AntD Form örneği (örneğin form araç çubuğu düğmesi);
- `ctx.collection`: Mevcut koleksiyon meta verileri;
- Kod düzenleyici `Snippets` parçacıklarını ve `Run` ön çalıştırmayı destekler (aşağıya bakın).


- `ctx.requireAsync(url)`: URL'ye göre AMD/UMD kütüphanelerini asenkron olarak yükler;
- `ctx.importAsync(url)`: URL'ye göre ESM modüllerini dinamik olarak içe aktarır;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: JSX oluşturma, zaman işleme, veri işlemleri ve matematiksel hesaplamalar için kullanılan yerleşik React / ReactDOM / Ant Design / Ant Design İkonları / dayjs / lodash / math.js / formula.js gibi genel kütüphaneler.

> Gerçekte kullanılabilir değişkenler düğmenin bulunduğu konuma göre farklılık gösterebilir, yukarıdakiler yaygın yeteneklere genel bir bakıştır.

## Düzenleyici ve Parçacıklar

- `Snippets`: Yerleşik kod parçacıkları listesini açar, aranabilir ve mevcut imleç konumuna tek tıkla eklenebilir.
- `Run`: Mevcut kodu doğrudan çalıştırır ve çalışma günlüklerini alttaki `Logs` paneline yazdırır; `console.log/info/warn/error` ve hata vurgulamalı konumlandırmayı destekler.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- AI çalışanı ile betik oluşturulabilir/düzenlenebilir: [AI Çalışanı · Nathan: Ön Uç Mühendisi](/ai-employees/features/built-in-employee)

## Yaygın Kullanım (Basitleştirilmiş Örnekler)

### 1) API İsteği ve İpucu

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
// TODO: İş mantığını yürütün…
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
const popupUid = ctx.model.uid + '-open'; // Kararlılığı korumak için mevcut düğmeye bağlayın
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Gönderim Sonrası Verileri Yenileme

```js
// Genel yenileme: Öncelikle tablo/liste kaynağı, ardından formun bulunduğu blok kaynağı
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## Dikkat Edilmesi Gerekenler

- Davranış İdempotensi: Tekrarlanan tıklamalardan kaynaklanan çoklu gönderimleri önleyin; mantığa bir durum anahtarı eklenebilir veya düğme devre dışı bırakılabilir.
- Hata Yönetimi: API çağrıları için try/catch ekleyin ve kullanıcıya ipuçları verin.
- Görünüm Bağlantısı: `ctx.openView` aracılığıyla bir açılır pencere/çekmece açarken, parametrelerin açıkça iletilmesi ve gerektiğinde gönderim başarılı olduktan sonra üst kaynağın aktif olarak yenilenmesi önerilir.

## İlgili Belgeler

- [Değişkenler ve Bağlam](/interface-builder/variables)
- [Bağlantı Kuralları](/interface-builder/linkage-rule)
- [Görünümler ve Açılır Pencereler](/interface-builder/actions/types/view)