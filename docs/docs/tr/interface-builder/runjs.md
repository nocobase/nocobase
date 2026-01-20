:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# JS'i Çevrimiçi Yazma ve Çalıştırma

NocoBase'de, **RunJS** hızlı denemeler ve geçici mantık işlemleri gerektiren durumlar için ideal, hafif bir genişletme yöntemi sunar. Eklenti oluşturmanıza veya kaynak kodunu değiştirmenize gerek kalmadan, JavaScript aracılığıyla arayüzleri veya etkileşimleri kişiselleştirebilirsiniz.

Bu sayede, arayüz tasarımcısında doğrudan JS kodu girerek şunları gerçekleştirebilirsiniz:

- İçerik render'ını özelleştirme (alanlar, bloklar, sütunlar, öğeler vb.)
- Özel etkileşim mantığı (düğme tıklamaları, olay tetiklemeleri)
- Bağlamsal verileri kullanarak dinamik davranışlar sergileme

## Desteklenen Senaryolar

### JS Bloğu

JS aracılığıyla blok render'ını özelleştirerek, bloğun yapısı ve stilleri üzerinde tam kontrol sağlayabilirsiniz. Özel bileşenler, istatistiksel grafikler, üçüncü taraf içerikler ve diğer yüksek derecede esnek senaryoları görüntülemek için idealdir.

![20250916105031](https://static-docs.nocobase.com/20250916105031.png)

Dokümantasyon: [JS Bloğu](/interface-builder/blocks/other-blocks/js-block)

### JS İşlemi

JS aracılığıyla işlem düğmelerinin tıklama mantığını özelleştirerek, herhangi bir ön uç veya API isteği işlemini yürütebilirsiniz. Örneğin: değerleri dinamik olarak hesaplama, özel veri gönderme, açılır pencereleri tetikleme vb.

![20250916105123](https://static-docs.nocobase.com/20250916105123.png)

Dokümantasyon: [JS İşlemi](/interface-builder/actions/types/js-action)

### JS Alanı

JS aracılığıyla alan render mantığını özelleştirin. Alan değerlerine göre farklı stiller, içerikler veya durumlar dinamik olarak görüntüleyebilirsiniz.

![20250916105354](https://static-docs.nocobase.com/20250916105354.png)

Dokümantasyon: [JS Alanı](/interface-builder/fields/specific/js-field)

### JS Öğesi

JS aracılığıyla bağımsız öğeleri render edin, belirli alanlara bağlı kalmadan. Genellikle özel bilgi bloklarını görüntülemek için kullanılır.

![20250916104848](https://static-docs.nocobase.com/20250916104848.png)

Dokümantasyon: [JS Öğesi](/interface-builder/fields/specific/js-item)

### JS Tablo Sütunu

JS aracılığıyla tablo sütunu render'ını özelleştirin. İlerleme çubukları, durum etiketleri vb. gibi karmaşık hücre görüntüleme mantıklarını uygulayabilirsiniz.

![20250916105443](https://static-docs.nocobase.com/20250916105443.png)

Dokümantasyon: [JS Tablo Sütunu](/interface-builder/fields/specific/js-column)

### Bağlantı Kuralları

Formlarda veya sayfalarda JS aracılığıyla alanlar arasındaki bağlantı mantığını kontrol edin. Örneğin: bir alan değiştiğinde, başka bir alanın değerini veya görünürlüğünü dinamik olarak değiştirebilirsiniz.

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

Dokümantasyon: [Bağlantı Kuralları](/interface-builder/linkage-rule)

### Olay Akışı

JS aracılığıyla olay akışı tetikleme koşullarını ve yürütme mantığını özelleştirerek, daha karmaşık ön uç etkileşim zincirleri oluşturabilirsiniz.

![](https://static-docs.nocobase.com/20251031092755.png)

Dokümantasyon: [Olay Akışı](/interface-builder/event-flow)