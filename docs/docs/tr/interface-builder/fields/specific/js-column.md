:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/interface-builder/fields/specific/js-column) bakın.
:::

# JS Kolonu

## Tanıtım

JS Kolonu, tablolardaki "özel sütunlar" için kullanılır ve her satırın hücre içeriğini JavaScript aracılığıyla oluşturur. Belirli bir alana bağlı değildir; türetilmiş sütunlar, alanlar arası birleşik gösterimler, durum rozetleri, düğme işlemleri ve uzaktan veri özeti gibi senaryolar için uygundur.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## Çalışma Zamanı Bağlam API'si

JS Kolonu'nun her hücresi oluşturulurken aşağıdaki bağlam yeteneklerini kullanabilirsiniz:

- `ctx.element`: Mevcut hücrenin DOM kapsayıcısı (ElementProxy); `innerHTML`, `querySelector`, `addEventListener` vb. destekler;
- `ctx.record`: Mevcut satır kayıt nesnesi (salt okunur);
- `ctx.recordIndex`: Mevcut sayfa içindeki satır dizini (0'dan başlar, sayfalama tarafından etkilenebilir);
- `ctx.collection`: Tabloya bağlı koleksiyonun meta bilgileri (salt okunur);
- `ctx.requireAsync(url)`: URL'ye göre AMD/UMD kütüphanesini asenkron olarak yükler;
- `ctx.importAsync(url)`: URL'ye göre ESM modülünü dinamik olarak içe aktarır;
- `ctx.openView(options)`: Yapılandırılmış bir görünümü açar (açılır pencere/çekmece/sayfa);
- `ctx.i18n.t()` / `ctx.t()`: Uluslararasılaştırma;
- `ctx.onRefReady(ctx.ref, cb)`: Kapsayıcı hazır olduktan sonra oluşturur;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: JSX oluşturma, zaman işleme, veri işlemleri ve matematiksel hesaplamalar için yerleşik React / ReactDOM / Ant Design / Ant Design İkonları / dayjs / lodash / math.js / formula.js gibi genel kütüphaneler. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` uyumluluk için hala korunmaktadır.)
- `ctx.render(vnode)`: React öğesini/HTML'yi/DOM'u varsayılan kapsayıcı `ctx.element`'e (mevcut hücre) oluşturur; birden fazla oluşturma işlemi Root'u yeniden kullanır ve kapsayıcının mevcut içeriğinin üzerine yazar.

## Düzenleyici ve Kod Parçacıkları

JS Kolonu'nun betik düzenleyicisi sözdizimi vurgulama, hata ipuçları ve yerleşik kod parçacıklarını (Snippets) destekler.

- `Snippets`: Yerleşik kod parçacıkları listesini açar, arama yapabilir ve tek tıklamayla mevcut imleç konumuna ekleyebilirsiniz.
- `Run`: Mevcut kodu doğrudan çalıştırır, çalışma günlükleri alttaki `Logs` paneline çıktı olarak verilir, `console.log/info/warn/error` ve hata vurgulama konumlandırmayı destekler.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Kod oluşturmak için AI Çalışanı ile birleştirilebilir:

- [AI Çalışanı · Nathan: Ön Uç Mühendisi](/ai-employees/features/built-in-employee)

## Yaygın Kullanım

### 1) Temel Oluşturma (Mevcut satır kaydını okuma)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) JSX Kullanarak React Bileşenleri Oluşturma

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) Hücrede Açılır Pencere/Çekmece Açma (Görüntüleme/Düzenleme)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>Görüntüle</a>
);
```

### 4) Üçüncü Taraf Kütüphaneleri Yükleme (AMD/UMD veya ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## 注意事项

- Harici kütüphane yüklemeleri için güvenilir CDN'lerin kullanılması ve başarısızlık senaryoları için önlem alınması (örneğin `if (!lib) return;`) önerilir.
- Seçiciler için öncelikle `class` veya `[name=...]` kullanılması, birden fazla blok/açılır pencerede yinelenen `id`'leri önlemek için sabit `id` kullanımından kaçınılması önerilir.
- Olay Temizliği: Tablo satırları sayfalama/yenileme ile dinamik olarak değişebilir ve hücreler birden çok kez oluşturulabilir. Tekrarlanan tetiklemeleri önlemek için olayları bağlamadan önce temizlemeli veya tekilleştirmelisiniz.
- Performans Önerisi: Her hücrede büyük kütüphaneleri tekrar tekrar yüklemekten kaçının; kütüphaneyi üst katmanda (örneğin küresel değişkenler veya tablo düzeyindeki değişkenler aracılığıyla) önbelleğe almalı ve ardından yeniden kullanmalısınız.