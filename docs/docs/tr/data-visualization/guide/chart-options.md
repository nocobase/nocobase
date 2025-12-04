:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Grafik Seçenekleri

Grafiklerin nasıl görüntüleneceğini yapılandırın. İki mod desteklenmektedir: Temel (görsel) ve Özel (JS). Temel mod, hızlı eşleme ve sık kullanılan özellikler için idealdir; Özel mod ise karmaşık senaryolar ve gelişmiş özelleştirmeler için uygundur.

## Panel Yapısı

![clipboard-image-1761473695](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> İpucu: Daha kolay yapılandırmak için diğer panelleri önce daraltabilirsiniz.

En üstte işlem çubuğu bulunur.
Mod seçimi:
- Temel: Görsel yapılandırma. Bir tür seçin ve alan eşlemesini tamamlayın; sık kullanılan özellikleri anahtarlarla doğrudan ayarlayabilirsiniz.
- Özel: Editörde JS yazın ve bir ECharts `option` döndürün.

## Temel Mod

![20251026190615](https://static-docs.nocobase.com/20251026190615.png)

### Grafik Türü Seçimi
- Desteklenenler: çizgi, alan, sütun, çubuk, pasta, halka, huni, dağılım grafiği vb.
- Gerekli alanlar grafik türüne göre değişebilir. Öncelikle “Veri sorgusu → Verileri görüntüle” bölümündeki sütun adlarını ve türlerini kontrol edin.

### Alan Eşleme
- Çizgi/Alan/Sütun/Çubuk:
  - `xField`: boyut (tarih, kategori, bölge gibi)
  - `yField`: ölçü (toplanmış sayısal değer)
  - `seriesField` (isteğe bağlı): seri gruplama (birden çok çizgi/grup için)
- Pasta/Halka:
  - `Category`: kategorik boyut
  - `Value`: ölçü
- Huni:
  - `Category`: aşama/kategori
  - `Value`: değer (genellikle sayı veya yüzde)
- Dağılım:
  - `xField`, `yField`: eksenler için iki ölçü veya boyut

> Daha fazla grafik seçeneği yapılandırması için ECharts belgelerine başvurabilirsiniz: [Eksen](https://echarts.apache.org/handbook/en/concepts/axis) ve [Örnekler](https://echarts.apache.org/examples/en/index.html)

**Notlar:**
- Boyutları veya ölçüleri değiştirdikten sonra, boş veya yanlış hizalanmış grafiklerden kaçınmak için eşlemeyi yeniden kontrol edin.
- Pasta/halka ve huni grafikleri mutlaka “kategori + değer” kombinasyonu sağlamalıdır.

### Sık Kullanılan Özellikler

![20251026191332](https://static-docs.nocobase.com/20251026191332.png)

- Yığınlama, yumuşatma (çizgi/alan)
- Etiketler, araç ipucu (tooltip), gösterge (legend)
- Eksen etiketi döndürme, ayırıcı çizgiler
- Pasta/halka yarıçapı ve iç yarıçapı, huni sıralama şekli

**Öneriler:**
- Zaman serileri için çizgi/alan grafikleri kullanın ve orta düzeyde yumuşatma uygulayın; kategori karşılaştırmaları için sütun/çubuk grafikleri kullanın.
- Yoğun verilerde, çakışmayı önlemek için tüm etiketleri göstermenize gerek yoktur.

## Özel Mod

Tam bir ECharts `option` döndürmek için kullanılır. Birden çok seriyi birleştirme, karmaşık araç ipuçları ve dinamik stiller gibi gelişmiş özelleştirmeler için uygundur. Önerilen yaklaşım: verileri `dataset.source` içinde birleştirmektir. Ayrıntılar için ECharts belgelerine bakın: [Veri Kümesi (Dataset)](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

![20251026191728](https://static-docs.nocobase.com/20251026191728.png)

### Veri Bağlamı
- `ctx.data.objects`: nesne dizisi (her satır bir nesne olarak, önerilir)
- `ctx.data.rows`: 2B dizi (başlık dahil)
- `ctx.data.columns`: sütunlara göre gruplandırılmış 2B dizi

### Örnek: Aylık Siparişler Çizgi Grafiği
```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
    },
  ],
}
```

### Önizleme ve Kaydetme
- Özel modda düzenlemeyi bitirdikten sonra, grafik önizlemesini güncellemek için sağdaki Önizle düğmesine tıklayabilirsiniz.
- Altta, yapılandırmayı uygulamak ve kaydetmek için “Kaydet”e tıklayın; bu sefer yapılan tüm yapılandırma değişikliklerini geri almak için “İptal”e tıklayın.

![20251026192816](https://static-docs.nocobase.com/20251026192816.png)

> [!İPUCU]
> Grafik seçenekleri hakkında daha fazla bilgi için Gelişmiş Kullanım — Özel grafik yapılandırması bölümüne bakınız.