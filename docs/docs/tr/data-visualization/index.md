---
pkg: "@nocobase/plugin-data-visualization"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Genel Bakış

NocoBase'in veri görselleştirme eklentisi, görsel veri sorgulama ve zengin grafik bileşenleri sunar. Basit yapılandırmalarla, hızlıca görselleştirme panelleri oluşturabilir, veri içgörülerini sergileyebilir ve çok boyutlu veri analizi ile gösterimini destekleyebilirsiniz.

![clipboard-image-1761749573](https://static-docs.nocobase.com/clipboard-image-1761749573.png)

## Temel Kavramlar
- Grafik bloğu: Bir sayfadaki yapılandırılabilir bir grafik bileşenidir; veri sorgulama, grafik seçenekleri ve etkileşim olaylarını destekler.
- Veri sorgulama (Builder / SQL): Builder ile görsel olarak yapılandırarak veya SQL yazarak veri alabilirsiniz.
- Ölçütler (Measures) ve Boyutlar (Dimensions): Ölçütler sayısal toplama için, boyutlar ise verileri gruplamak için kullanılır (örneğin, tarih, kategori, bölge).
- Alan eşleme: Sorgu sonuç sütunlarını `xField`, `yField`, `seriesField` veya `Category / Value` gibi temel grafik alanlarına eşlemektir.
- Grafik seçenekleri (Temel / Özel): Temel, yaygın özellikleri görsel olarak yapılandırır; Özel ise JS aracılığıyla tam bir ECharts `option` nesnesi döndürür.
- Sorguyu çalıştırma: Yapılandırma panelinde sorguyu çalıştırıp veri alabilir, döndürülen verileri incelemek için Tablo / JSON arasında geçiş yapabilirsiniz.
- Önizleme ve kaydetme: Önizleme geçici bir etkidir; "Kaydet"e tıkladıktan sonra yapılandırma veritabanına yazılır ve resmi olarak etkinleşir.
- Bağlam değişkenleri: Sorgularda ve grafik yapılandırmasında sayfa, kullanıcı ve filtre gibi bağlam bilgilerini (örneğin, `{{ ctx.user.id }}`) yeniden kullanabilirsiniz.
- Sayfa filtreleri ve bağlantı: Sayfa düzeyindeki "filtre blokları" birleşik koşulları toplar, otomatik olarak grafik sorgularına birleştirilir ve bağlantılı grafikleri yeniler.
- Etkileşim olayları: Vurgulama, gezinme ve detaya inme gibi davranışları etkinleştirmek için `chart.on` aracılığıyla olayları kaydedebilirsiniz.

## Kurulum
Veri görselleştirme, NocoBase'in yerleşik bir eklentisidir; kutudan çıktığı gibi çalışır ve ayrı bir kuruluma ihtiyaç duymaz.