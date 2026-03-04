:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/interface-builder/blocks/other-blocks/js-block) bakın.
:::

# JS Block Bloğu

## Giriş

JS Block, arayüzler oluşturmak, olayları bağlamak, veri arayüzlerini çağırmak veya üçüncü taraf kütüphaneleri entegre etmek için doğrudan JavaScript betikleri yazmanıza olanak tanıyan son derece esnek bir "özel oluşturma bloğudur". Yerleşik blokların kapsayamadığı kişiselleştirilmiş görselleştirme, geçici denemeler ve hafif genişletme senaryoları için uygundur.

## Çalışma Zamanı Bağlamı API'si

JS Block'un çalışma zamanı bağlamına yaygın yetenekler enjekte edilmiştir ve bunlar doğrudan kullanılabilir:

- `ctx.element`: Bloğun DOM kapsayıcısı (güvenli bir şekilde sarmalanmış ElementProxy); `innerHTML`, `querySelector`, `addEventListener` vb. destekler;
- `ctx.requireAsync(url)`: URL'ye göre AMD/UMD kütüphanelerini eşzamansız olarak yükler;
- `ctx.importAsync(url)`: URL'ye göre ESM modüllerini dinamik olarak içe aktarır;
- `ctx.openView`: Yapılandırılmış görünümü (açılır pencere/çekmece/sayfa) açar;
- `ctx.useResource(...)` + `ctx.resource`: Verilere kaynak yöntemiyle erişir;
- `ctx.i18n.t()` / `ctx.t()`: Yerleşik uluslararasılaştırma yeteneği;
- `ctx.onRefReady(ctx.ref, cb)`: Zamanlama sorunlarını önlemek için kapsayıcı hazır olduktan sonra oluşturur;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: JSX oluşturma, zaman işleme, veri işlemleri ve matematiksel hesaplamalar için yerleşik React / ReactDOM / Ant Design / Ant Design İkonları / dayjs / lodash / math.js / formula.js gibi genel kütüphaneler. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` uyumluluk için hala korunmaktadır.)
- `ctx.render(vnode)`: React öğesini, HTML dizesini veya DOM düğümünü varsayılan kapsayıcı `ctx.element` içine oluşturur; birden fazla çağrı aynı React Root'u yeniden kullanır ve kapsayıcının mevcut içeriğinin üzerine yazar.

## Blok Ekleme

- Sayfalara veya açılır pencerelere JS Block eklenebilir.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Düzenleyici ve Kod Parçacıkları

JS Block betik düzenleyicisi; sözdizimi vurgulama, hata ipuçları ve yerleşik kod parçacıklarını (Snippets) destekler. Grafik oluşturma, düğme olaylarını bağlama, harici kütüphaneleri yükleme, React/Vue bileşenlerini oluşturma, zaman çizelgesi, bilgi kartları gibi yaygın örnekleri hızlıca ekleyebilirsiniz.

- `Snippets`: Yerleşik kod parçacıkları listesini açar; arama yapabilir ve seçilen parçacığı imlecin bulunduğu konuma tek tıklamayla ekleyebilirsiniz.
- `Run`: Düzenleyicideki kodu doğrudan çalıştırır ve çalışma günlüklerini alttaki `Logs` paneline aktarır. `console.log/info/warn/error` görüntülemeyi destekler; hatalar vurgulanır ve ilgili satır/sütuna konumlandırılabilir.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Ayrıca, düzenleyicinin sağ üst köşesinden AI çalışanı "Ön Uç Mühendisi · Nathan"ı doğrudan çağırabilirsiniz. Nathan, mevcut bağlama göre betik yazmanıza veya düzenlemenize yardımcı olur; "Apply to editor" ile tek tıklamayla uygulayıp sonucu görebilirsiniz. Ayrıntılar için bakınız:

- [AI Çalışanı · Nathan: Ön Uç Mühendisi](/ai-employees/features/built-in-employee)

## Çalışma Ortamı ve Güvenlik

- Kapsayıcı: Sistem, betik için güvenli bir DOM kapsayıcısı `ctx.element` (ElementProxy) sağlar; yalnızca mevcut bloğu etkiler, sayfanın diğer alanlarına müdahale etmez.
- Sandbox: Betik kontrollü bir ortamda çalışır; `window`/`document`/`navigator` güvenli proxy nesneleri kullanır, yaygın API'ler kullanılabilir ancak riskli davranışlar kısıtlanmıştır.
- Yeniden Oluşturma: Blok gizlenip tekrar gösterildiğinde otomatik olarak yeniden oluşturulur (ilk montajın tekrarlanmasını önlemek için).

## Yaygın Kullanım (Basitleştirilmiş Örnekler)

### 1) React (JSX) Oluşturma

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </div>
);
```

### 2) API İstek Şablonu

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) ECharts Yükleme ve Oluşturma

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) Görünüm Açma (Çekmece)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) Kaynak Okuma ve JSON Oluşturma

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Notlar

- Harici kütüphaneleri yüklemek için güvenilir CDN'ler kullanmanız önerilir.
- Seçici kullanım önerisi: Öncelikli olarak `class` veya `[name=...]` nitelik seçicilerini kullanın; birden fazla blok/açılır pencerede yinelenen `id`'lerin stil veya olay çakışmalarına yol açmasını önlemek için sabit `id` kullanmaktan kaçının.
- Olay temizliği: Blok birden çok kez yeniden oluşturulabilir, bu nedenle olayları bağlamadan önce temizlenmeli veya yinelenenler kaldırılmalıdır. "Önce kaldır sonra ekle" yaklaşımını, tek seferlik dinleyicileri veya tekrarı önlemek için bir işaret eklemeyi kullanabilirsiniz.

## İlgili Belgeler

- [Değişkenler ve Bağlam](/interface-builder/variables)
- [Bağlantı Kuralları](/interface-builder/linkage-rule)
- [Görünümler ve Açılır Pencereler](/interface-builder/actions/types/view)