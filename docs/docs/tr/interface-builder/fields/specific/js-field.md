:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/interface-builder/fields/specific/js-field) bakın.
:::

# JS Field

## Giriş

JS Field, alan konumunda JavaScript ile içeriği özel olarak oluşturmak (render) için kullanılır; genellikle detay bloklarında, formların salt okunur öğelerinde veya tablo sütunlarındaki "diğer özel öğeler" içinde görülür. Kişiselleştirilmiş gösterim, türetilmiş bilgi kombinasyonu, durum rozetleri, zengin metin veya grafiklerin oluşturulması için uygundur.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Tipler

- Salt okunur tip: Düzenlenemez gösterim için kullanılır, `ctx.value` değerini okuyarak çıktı üretir.
- Düzenlenebilir tip: Özel giriş etkileşimi için kullanılır; form değerleriyle çift yönlü senkronizasyonu kolaylaştırmak için `ctx.getValue()`/`ctx.setValue(v)` ve `js-field:value-change` kapsayıcı olayı sağlar.

## Kullanım Senaryoları

- Salt okunur tip
  - Detay bloğu: Hesaplama sonuçlarını, durum rozetlerini, zengin metin parçacıklarını, grafikleri vb. salt okunur içeriği görüntülemek için;
  - Tablo bloğu: Salt okunur gösterim için "Diğer özel sütun > JS Field" olarak kullanılır (alana bağlı olmayan bir sütun gerekiyorsa, lütfen JS Column kullanın);

- Düzenlenebilir tip
  - Form bloğu (CreateForm/EditForm): Form doğrulaması ve gönderimi ile birlikte özel giriş kontrolleri veya bileşik girişler için kullanılır;
  - Uygun senaryolar: Harici kütüphane giriş bileşenleri, zengin metin/kod düzenleyicileri, karmaşık dinamik bileşenler vb.;

## Çalışma Zamanı Bağlam API'si

JS Field çalışma zamanı kodu aşağıdaki bağlam yeteneklerini doğrudan kullanabilir:

- `ctx.element`: Alanın DOM kapsayıcısı (ElementProxy); `innerHTML`, `querySelector`, `addEventListener` vb. destekler;
- `ctx.value`: Mevcut alan değeri (salt okunur);
- `ctx.record`: Mevcut kayıt nesnesi (salt okunur);
- `ctx.collection`: Alanın ait olduğu koleksiyonun meta bilgileri (salt okunur);
- `ctx.requireAsync(url)`: URL'ye göre AMD/UMD kütüphanesini asenkron olarak yükler;
- `ctx.importAsync(url)`: URL'ye göre ESM modülünü dinamik olarak içe aktarır;
- `ctx.openView(options)`: Yapılandırılmış bir görünümü (açılır pencere/çekmece/sayfa) açar;
- `ctx.i18n.t()` / `ctx.t()`: Uluslararasılaştırma;
- `ctx.onRefReady(ctx.ref, cb)`: Kapsayıcı hazır olduktan sonra oluşturur;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: JSX oluşturma, zaman işleme, veri operasyonları ve matematiksel hesaplamalar için yerleşik React / ReactDOM / Ant Design / Ant Design ikonları / dayjs / lodash / math.js / formula.js gibi genel kütüphaneler. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` uyumluluk için hala korunmaktadır.)
- `ctx.render(vnode)`: React öğesini, HTML dizesini veya DOM düğümünü varsayılan kapsayıcı `ctx.element` içine oluşturur; tekrarlanan oluşturma Root'u yeniden kullanır ve kapsayıcının mevcut içeriğinin üzerine yazar.

Düzenlenebilir tip (JSEditableField) için özel:

- `ctx.getValue()`: Mevcut form değerini alır (öncelikle form durumunu kullanır, ardından alan props'larına geri döner).
- `ctx.setValue(v)`: Çift yönlü senkronizasyonu koruyarak form değerini ve alan props'larını ayarlar.
- Kapsayıcı olayı `js-field:value-change`: Harici değer değiştiğinde tetiklenir, betiğin giriş gösterimini güncellemesini kolaylaştırır.

## Düzenleyici ve Kod Parçacıkları

JS Field betik düzenleyicisi sözdizimi vurgulama, hata ipuçları ve yerleşik kod parçacıklarını (Snippets) destekler.

- `Snippets`: Yerleşik kod parçacıkları listesini açar, aranabilir ve tek tıklamayla mevcut imleç konumuna eklenebilir.
- `Run`: Mevcut kodu doğrudan çalıştırır, çalışma günlükleri alttaki `Logs` paneline yazdırılır; `console.log/info/warn/error` ve hata vurgulama ile konumlandırmayı destekler.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Kod oluşturmak için AI çalışanı ile birleştirilebilir:

- [AI Çalışanı · Nathan: Ön Uç Mühendisi](/ai-employees/features/built-in-employee)

## Yaygın Kullanım

### 1) Temel oluşturma (Alan değerini okuma)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) JSX kullanarak React bileşeni oluşturma

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Üçüncü taraf kütüphaneleri yükleme (AMD/UMD veya ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Tıklama ile açılır pencere/çekmece açma (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Detayları Görüntüle</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) Düzenlenebilir giriş (JSEditableFieldModel)

```js
// JSX kullanarak basit bir giriş oluşturun ve form değerini senkronize edin
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// Harici değer değiştiğinde girişi senkronize edin (isteğe bağlı)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## 注意事项 (Notlar)

- Harici kütüphane yüklemeleri için güvenilir CDN kullanılması ve başarısızlık senaryoları için önlem alınması önerilir (örneğin `if (!lib) return;`).
- Seçiciler için `class` veya `[name=...]` tercih edilmesi, birden fazla blok veya açılır pencerede `id` çakışmasını önlemek için sabit `id` kullanımından kaçınılması önerilir.
- Olay temizliği: Alan, veri değişikliği veya görünüm geçişi nedeniyle birden çok kez yeniden oluşturulabilir; olayları bağlamadan önce mükerrer tetiklemeyi önlemek için temizleme veya tekilleştirme yapılmalıdır. "Önce remove, sonra add" yapılabilir.