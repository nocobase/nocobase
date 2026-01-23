:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# JS Field

## Giriş

JS Field, bir alanın konumunda JavaScript kullanarak içeriği özel olarak oluşturmak için kullanılır. Genellikle detay bloklarında, formlardaki salt okunur öğelerde veya tablo sütunlarındaki "Diğer özel öğeler" olarak karşımıza çıkar. Kişiselleştirilmiş gösterimler, türetilmiş bilgi kombinasyonları, durum rozetleri, zengin metin veya grafikler gibi içeriklerin oluşturulması için uygundur.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Tipler

- **Salt Okunur Tip**: Düzenlenemeyen gösterimler için kullanılır, `ctx.value` değerini okuyarak çıktı oluşturur.
- **Düzenlenebilir Tip**: Özel giriş etkileşimleri için kullanılır. `ctx.getValue()`/`ctx.setValue(v)` ve `js-field:value-change` kapsayıcı olayını sağlar, bu sayede form değerleriyle çift yönlü senkronizasyon kolaylaşır.

## Kullanım Senaryoları

- **Salt Okunur Tip**
  - **Detay blokları**: Hesaplama sonuçları, durum rozetleri, zengin metin parçacıkları, grafikler gibi salt okunur içerikleri görüntülemek için;
  - **Tablo blokları**: "Diğer özel sütun > JS Field" olarak salt okunur gösterim için kullanılır (bir alana bağlı olmayan bir sütuna ihtiyacınız varsa, lütfen JS Column kullanın).

- **Düzenlenebilir Tip**
  - **Form blokları (Oluşturma Formu/Düzenleme Formu)**: Form doğrulaması ve gönderimiyle birlikte özel giriş kontrolleri veya bileşik girişler için kullanılır;
  - **Uygun senaryolar**: Harici kütüphane giriş bileşenleri, zengin metin/kod düzenleyicileri, karmaşık dinamik bileşenler vb.

## Çalışma Zamanı Bağlam API'si

JS Field çalışma zamanı kodu aşağıdaki bağlam yeteneklerini doğrudan kullanabilir:

- `ctx.element`: Alanın DOM kapsayıcısı (ElementProxy), `innerHTML`, `querySelector`, `addEventListener` vb. destekler;
- `ctx.value`: Mevcut alan değeri (salt okunur);
- `ctx.record`: Mevcut kayıt nesnesi (salt okunur);
- `ctx.collection`: Alanın ait olduğu koleksiyonun meta bilgileri (salt okunur);
- `ctx.requireAsync(url)`: URL'ye göre AMD/UMD kütüphanesini eşzamansız olarak yükler;
- `ctx.importAsync(url)`: URL'ye göre ESM modülünü dinamik olarak içe aktarır;
- `ctx.openView(options)`: Yapılandırılmış bir görünümü açar (açılır pencere/çekmece/sayfa);
- `ctx.i18n.t()` / `ctx.t()`: Uluslararasılaştırma;
- `ctx.onRefReady(ctx.ref, cb)`: Kapsayıcı hazır olduktan sonra yeniden oluşturur;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: JSX oluşturma ve zaman işleme için yerleşik React, ReactDOM, Ant Design, Ant Design ikonları ve dayjs gibi genel kütüphaneler. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` uyumluluk için hala korunmaktadır.)
- `ctx.render(vnode)`: Bir React öğesini, HTML dizesini veya DOM düğümünü varsayılan kapsayıcı `ctx.element` içine oluşturur; tekrarlanan oluşturma Root'u yeniden kullanır ve kapsayıcının mevcut içeriğini üzerine yazar.

Düzenlenebilir tipe (JSEditableField) özel:

- `ctx.getValue()`: Mevcut form değerini alır (öncelik form durumundadır, ardından alan özelliklerine geri döner).
- `ctx.setValue(v)`: Form değerini ve alan özelliklerini ayarlar, çift yönlü senkronizasyonu sürdürür.
- Kapsayıcı olayı `js-field:value-change`: Harici bir değer değiştiğinde tetiklenir, bu da betiğin giriş gösterimini güncellemesini kolaylaştırır.

## Düzenleyici ve Kod Parçacıkları

JS Field betik düzenleyicisi, sözdizimi vurgulama, hata ipuçları ve yerleşik kod parçacıklarını (Snippets) destekler.

- `Snippets`: Yerleşik kod parçacıkları listesini açar, aranabilir ve tek tıklamayla mevcut imleç konumuna eklenebilir.
- `Run`: Mevcut kodu doğrudan çalıştırır. Çalıştırma günlüğü alttaki `Logs` paneline çıktı olarak verilir, `console.log/info/warn/error` ve hata vurgulama konumlandırmasını destekler.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

AI Çalışanı ile kod oluşturabilirsiniz:

- [AI Çalışanı · Nathan: Frontend Mühendisi](/ai-employees/built-in/ai-coding)

## Yaygın Kullanım

### 1) Temel Oluşturma (Alan Değerini Okuma)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) JSX Kullanarak React Bileşeni Oluşturma

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Üçüncü Taraf Kütüphaneleri Yükleme (AMD/UMD veya ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Açılır Pencere/Çekmece Açmak İçin Tıklama (openView)

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

### 5) Düzenlenebilir Giriş (JSEditableFieldModel)

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

## Dikkat Edilmesi Gerekenler

- Harici kütüphaneleri yüklerken güvenilir CDN'ler kullanmanız ve başarısızlık senaryoları için bir yedekleme (örneğin `if (!lib) return;`) sağlamanız önerilir.
- Seçiciler için `class` veya `[name=...]` kullanmanız, sabit `id`'lerden kaçınmanız önerilir. Bu, birden fazla blok/açılır pencerede `id` tekrarlarını önler.
- **Olay Temizliği**: Alan, veri değişiklikleri veya görünüm geçişleri nedeniyle birden çok kez yeniden oluşturulabilir. Olayları bağlamadan önce, tekrar tetiklenmeyi önlemek için temizlemeli veya tekilleştirmelisiniz. "Önce kaldırıp sonra ekleyebilirsiniz".