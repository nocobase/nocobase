:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/require-async) bakın.
:::

# ctx.requireAsync()

URL üzerinden **UMD/AMD** veya globale bağlanan betikleri (scripts) ve **CSS** dosyalarını asenkron olarak yükler. ECharts, Chart.js, FullCalendar (UMD sürümü), jQuery eklentileri gibi UMD/AMD kütüphanelerinin kullanılmasını gerektiren RunJS senaryoları için uygundur. Bir kütüphane aynı zamanda ESM sürümü de sunuyorsa, öncelikle [ctx.importAsync()](./import-async.md) kullanmayı tercih edin.

## Uygulama Senaryoları

JSBlock, JSField, JSItem, JSColumn, iş akışı (Workflow), JSAction vb. gibi UMD/AMD/global betiklerin veya CSS'in isteğe bağlı olarak yüklenmesi gereken tüm RunJS senaryolarında kullanılabilir. Tipik kullanım alanları: ECharts grafikleri, Chart.js, FullCalendar (UMD), dayjs (UMD), jQuery eklentileri vb.

## Tür Tanımı

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Parametreler

| Parametre | Tür | Açıklama |
|-----------|------|-------------|
| `url` | `string` | Betik veya CSS adresi. **Kısa yol** `<paket-adı>@<sürüm>/<dosya-yolu>` (ESM CDN üzerinden çözümlendiğinde orijinal UMD dosyasını almak için `?raw` eklenir) veya **tam URL** destekler. Bir `.css` adresi geçildiğinde stili yükler ve sayfaya enjekte eder. |

## Geri Dönüş Değeri

- Yüklenen kütüphane nesnesi (UMD/AMD geri çağırmasının ilk modül değeri). Birçok UMD kütüphanesi kendisini `window` nesnesine bağlar (örneğin `window.echarts`), bu nedenle dönüş değeri `undefined` olabilir. Bu durumda, kütüphane dokümantasyonuna göre küresel değişkene erişin.
- Bir `.css` dosyası geçildiğinde `loadCSS` sonucunu döndürür.

## URL Formatı Açıklaması

- **Kısa yol**: Örneğin `echarts@5/dist/echarts.min.js`. Varsayılan ESM CDN (esm.sh) altında `https://esm.sh/echarts@5/dist/echarts.min.js?raw` isteğinde bulunur. `?raw` parametresi, ESM sarmalayıcısı yerine orijinal UMD dosyasını almak için kullanılır.
- **Tam URL**: `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js` gibi herhangi bir CDN adresi doğrudan yazılabilir.
- **CSS**: `.css` ile biten bir URL yüklenecek ve sayfaya enjekte edilecektir.

## ctx.importAsync() ile Farkı

- **ctx.requireAsync()**: **UMD/AMD/global** betikleri yükler. ECharts, Chart.js, FullCalendar (UMD), jQuery eklentileri vb. için uygundur. Yüklemeden sonra kütüphaneler genellikle `window` nesnesine bağlanır; dönüş değeri kütüphane nesnesi veya `undefined` olabilir.
- **ctx.importAsync()**: **ESM modüllerini** yükler ve modül ad alanını (namespace) döndürür. Bir kütüphane ESM sunuyorsa, daha iyi modül semantiği ve Tree-shaking için `ctx.importAsync()` kullanın.

## Örnekler

### Temel Kullanım

```javascript
// Kısa yol (ESM CDN üzerinden ...?raw olarak çözümlenir)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Tam URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// CSS yükle ve sayfaya enjekte et
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### ECharts Grafiği

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts kütüphanesi yüklenemedi');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Satış Özeti') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Chart.js Sütun Grafiği

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js yüklenemedi');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('Miktar'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs (UMD)

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## Dikkat Edilmesi Gerekenler

- **Dönüş değeri formatı**: UMD dışa aktarma yöntemleri farklılık gösterir; dönüş değeri kütüphane nesnesi veya `undefined` olabilir. Eğer `undefined` ise, kütüphane dokümantasyonuna göre `window` üzerinden erişebilirsiniz.
- **Ağ bağımlılığı**: CDN erişimi gerektirir. İç ağ ortamlarında, **ESM_CDN_BASE_URL** aracılığıyla kendi barındırdığınız bir servise yönlendirme yapabilirsiniz.
- **importAsync seçimi**: Bir kütüphane hem ESM hem de UMD sunuyorsa, `ctx.importAsync()` kullanımına öncelik verin.

## İlgili

- [ctx.importAsync()](./import-async.md) - ESM modüllerini yükler, Vue, dayjs (ESM) vb. için uygundur.
- [ctx.render()](./render.md) - Grafikleri ve diğer bileşenleri bir kapsayıcıya (container) işler.
- [ctx.libs](./libs.md) - Yerleşik React, antd, dayjs vb. kütüphaneler; asenkron yükleme gerektirmez.