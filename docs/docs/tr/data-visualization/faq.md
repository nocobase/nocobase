:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Sıkça Sorulan Sorular

## Grafik Seçimi
### Hangi grafiği seçmeliyim?
Cevap: Veri hedeflerinize göre seçim yapın:
- Trend veya değişim: Çizgi veya alan grafiği
- Değer karşılaştırması: Sütun veya çubuk grafiği
- Oransal yapı: Pasta veya halka grafiği
- Korelasyon veya dağılım: Dağılım grafiği
- Hiyerarşik yapı ve ilerleme: Huni grafiği

Daha fazla grafik türü için [ECharts örneklerini](https://echarts.apache.org/examples) inceleyebilirsiniz.

### NocoBase hangi grafik türlerini destekler?
Cevap: Görsel mod, yaygın grafik türlerini (çizgi, alan, sütun, çubuk, pasta, halka, huni, dağılım vb.) içerir. Özel mod ise tüm ECharts grafik türlerini kullanmanıza olanak tanır.

## Veri Sorgulama Sorunları
### Görsel mod ve SQL mod yapılandırmaları ortak mı?
Cevap: Hayır, ortak değildirler. Yapılandırmalar ayrı ayrı depolanır. Son kaydettiğinizdeki yapılandırma modu geçerli olur.

## Grafik Seçenekleri
### Grafik alanları nasıl yapılandırılır?
Cevap: Görsel modda, grafik türüne göre ilgili veri alanlarını seçin. Örneğin, çizgi/sütun grafikler için X ve Y ekseni alanlarını, pasta grafikler için ise kategori ve değer alanlarını yapılandırmanız gerekir.
Önce "`Sorguyu Çalıştır`" düğmesine tıklayarak verilerin beklentilerinizi karşılayıp karşılamadığını kontrol etmeniz önerilir; alan eşleştirmesi varsayılan olarak otomatik yapılır.

## Önizleme ve Kaydetme
### Yapılandırma değişikliklerinden sonra manuel önizleme yapmam gerekiyor mu?
Cevap: Görsel modda, yapılandırmayı değiştirdikten sonra otomatik olarak önizleme yapılır. SQL ve özel modlarda ise sık sık yenilemeyi önlemek için, düzenlemeyi bitirdikten sonra "`Önizle`" düğmesine manuel olarak tıklamanız gerekir.

### Açılır pencereyi kapattıktan sonra grafik önizlemesi neden kayboldu?
Cevap: Önizleme yalnızca geçici görüntüleme içindir. Yapılandırmayı değiştirdikten sonra lütfen önce kaydedin, sonra kapatın; kaydedilmeyen değişiklikler korunmaz.