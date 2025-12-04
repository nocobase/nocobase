:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Sayfa Filtreleri ve Etkileşim

Sayfa filtresi (Filtre Bloğu), sayfa düzeyinde filtre koşullarını tek bir yerden girmenizi sağlar ve bu koşulları grafik sorgularına dahil ederek birden fazla grafiğin tutarlı bir şekilde filtrelenmesini ve etkileşimli çalışmasını mümkün kılar.

## Özelliklere Genel Bakış
- Sayfaya bir filtre bloğu ekleyerek, o sayfadaki tüm grafikler için tek tip bir filtreleme girişi sağlarsınız.
- "Filtrele", "Sıfırla" ve "Daralt" butonlarını kullanarak filtreleri uygulayabilir, temizleyebilir ve filtre bloğunu daraltabilirsiniz.
- Filtre bloğunda bir grafikle ilişkili alanlar seçilirse, bu alanların değerleri otomatik olarak grafik sorgusuna dahil edilir ve grafiğin yenilenmesini tetikler.
- Filtreler ayrıca özel alanlar tanımlayabilir ve bu alanları bağlam değişkenlerine kaydedebilir, böylece grafikler, tablolar, formlar ve diğer veri bloklarında referans olarak kullanılabilirler.

![clipboard-image-1761487702](https://static-docs.nocobase.com/clipboard-image-1761487702.png)

Sayfa filtrelerinin kullanımı ve grafikler gibi diğer veri bloklarıyla etkileşimi hakkında daha fazla bilgi için lütfen [Sayfa Filtreleri](#) belgesine bakın.

## Grafik Sorgularında Sayfa Filtre Değerlerini Kullanma
- Builder Modu (Önerilen)
  - Otomatik Birleştirme: Veri kaynağı ve koleksiyon eşleştiğinde, grafik sorgusuna ek değişkenler yazmanıza gerek kalmaz; sayfa filtreleri `$and` operatörüyle birleştirilir.
  - Manuel Seçim: Grafik filtre koşullarında, filtre bloğunun özel alanlarından değerleri manuel olarak da seçebilirsiniz.

- SQL Modu (Değişken Enjeksiyonu ile)
  - SQL sorgusunda, “Değişken Seç” seçeneğini kullanarak filtre bloğunun özel alanlarından değerleri ekleyebilirsiniz.