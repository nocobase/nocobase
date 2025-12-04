:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# JS Bloğu

## Giriş

JS Bloğu, arayüzler oluşturmak, olayları bağlamak, veri API'lerini çağırmak veya üçüncü taraf kütüphaneleri entegre etmek için doğrudan JavaScript betikleri yazmanıza olanak tanıyan son derece esnek bir "özel oluşturma bloğudur". Yerleşik bloklarla kapsanması zor olan kişiselleştirilmiş görselleştirmeler, geçici denemeler ve hafif genişletme senaryoları için idealdir.

## Çalışma Zamanı Bağlamı API'si

JS Bloğu'nun çalışma zamanı bağlamına yaygın yetenekler enjekte edilmiştir ve doğrudan kullanılabilir:

- `ctx.element`: Bloğun DOM kapsayıcısı (ElementProxy olarak güvenli bir şekilde sarmalanmıştır), `innerHTML`, `querySelector`, `addEventListener` vb. destekler;
- `ctx.requireAsync(url)`: Bir AMD/UMD kütüphanesini URL'ye göre eşzamansız olarak yükler;
- `ctx.importAsync(url)`: Bir ESM modülünü URL'ye göre dinamik olarak içe aktarır;
- `ctx.openView`: Yapılandırılmış bir görünümü (açılır pencere/çekmece/sayfa) açar;
- `ctx.useResource(...)` + `ctx.resource`: Verilere bir kaynak olarak erişir;
- `ctx.i18n.t()` / `ctx.t()`: Yerleşik uluslararasılaştırma yeteneği;
- `ctx.onRefReady(ctx.ref, cb)`: Zamanlama sorunlarını önlemek için kapsayıcı hazır olduktan sonra oluşturur;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: JSX oluşturma ve zaman işleme için yerleşik React, ReactDOM, Ant Design, Ant Design ikonları ve dayjs gibi genel kütüphaneler. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` uyumluluk için hala korunmaktadır.)
- `ctx.render(vnode)`: Bir React öğesini, HTML dizesini veya DOM düğümünü varsayılan kapsayıcı `ctx.element`'e oluşturur; birden fazla çağrı aynı React Root'u yeniden kullanır ve kapsayıcının mevcut içeriğini üzerine yazar.

## Blok Ekleme

Bir sayfaya veya açılır pencereye bir JS Bloğu ekleyebilirsiniz.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Düzenleyici ve Kod Parçacıkları

JS Bloğu'nun betik düzenleyicisi; sözdizimi vurgulama, hata ipuçları ve yerleşik kod parçacıklarını (Snippets) destekler. Bu sayede grafik oluşturma, düğme olaylarını bağlama, harici kütüphaneleri yükleme, React/Vue bileşenlerini oluşturma, zaman çizelgeleri, bilgi kartları gibi yaygın örnekleri hızlıca ekleyebilirsiniz.

- `Snippets`: Yerleşik kod parçacıkları listesini açar. Seçilen parçacığı arayabilir ve tek tıklamayla kod düzenleme alanındaki mevcut imleç konumuna ekleyebilirsiniz.
- `Run`: Mevcut düzenleyicideki kodu doğrudan çalıştırır ve çalışma günlüklerini alttaki `Logs` paneline çıkarır. `console.log/info/warn/error` mesajlarını görüntülemeyi destekler; hatalar vurgulanır ve belirli satır ve sütunlara konumlandırılabilir.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Ayrıca, düzenleyicinin sağ üst köşesinden yapay zeka çalışanı "Ön Uç Mühendisi · Nathan"ı doğrudan çağırabilirsiniz. Nathan, mevcut bağlama göre betik yazmanıza veya değiştirmenize yardımcı olabilir. Tek tıklamayla "Apply to editor" (Düzenleyiciye Uygula) seçeneğiyle düzenleyiciye uyguladıktan sonra çalıştırıp etkisini görebilirsiniz. Ayrıntılar için bakınız:

- [Yapay Zeka Çalışanı · Nathan: Ön Uç Mühendisi](/ai-employees/built-in/ai-coding)

## Çalışma Ortamı ve Güvenlik

- **Kapsayıcı**: Sistem, betik için güvenli bir DOM kapsayıcısı (`ctx.element`, ElementProxy) sağlar. Bu kapsayıcı yalnızca mevcut bloğu etkiler ve sayfanın diğer alanlarına müdahale etmez.
- **Korumalı Alan (Sandbox)**: Betik kontrollü bir ortamda çalışır. `window`/`document`/`navigator` güvenli proxy nesneleri kullanır, bu sayede yaygın API'ler kullanılabilirken riskli davranışlar kısıtlanmıştır.
- **Yeniden Oluşturma**: Blok gizlendikten sonra tekrar gösterildiğinde otomatik olarak yeniden oluşturulur (ilk bağlamanın tekrar çalıştırılmasını önlemek için).

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
- **Seçici Kullanım Önerisi**: Öncelikli olarak `class` veya `[name=...]` nitelik seçicilerini kullanın; birden fazla blok/açılır pencerede yinelenen `id`'lerin stil veya olay çakışmalarına yol açmasını önlemek için sabit `id`'ler kullanmaktan kaçının.
- **Olay Temizliği**: Blok birden çok kez yeniden oluşturulabilir, bu nedenle olayları bağlamadan önce temizlenmeli veya yinelenenler kaldırılmalıdır. Tekrarlanan tetiklemeleri önlemek için "önce kaldır sonra ekle" yaklaşımını, tek seferlik dinleyicileri veya tekrarı önlemek için bir işaret eklemeyi kullanabilirsiniz.

## İlgili Belgeler

- [Değişkenler ve Bağlam](/interface-builder/variables)
- [Bağlantı Kuralları](/interface-builder/linkage-rule)
- [Görünümler ve Açılır Pencereler](/interface-builder/actions/types/view)