:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Veri Güncelle

Belirli koşulları karşılayan bir `koleksiyon`daki verileri güncellemek için kullanılır.

`koleksiyon` ve alan atama bölümleri, "Kayıt Oluştur" düğümüyle aynıdır. "Veri Güncelle" düğümünün temel farkı, filtre koşullarının eklenmesi ve bir güncelleme modu seçme gerekliliğidir. Ayrıca, "Veri Güncelle" düğümünün sonucu, başarıyla güncellenen satır sayısını döndürür. Bu bilgi yalnızca yürütme geçmişinde görüntülenebilir ve sonraki düğümlerde bir değişken olarak kullanılamaz.

## Düğüm Oluşturma

`iş akışı` yapılandırma arayüzünde, akıştaki artı ("+") düğmesine tıklayarak "Veri Güncelle" düğümünü ekleyin:

![Veri Güncelle Düğümü Ekle](https://static-docs.nocobase.com/9ff24d7bc173b3a71decc1f70ca9fb66.png)

## Düğüm Yapılandırması

![Veri Güncelle Düğümü Yapılandırması](https://static-docs.nocobase.com/98e0f41c57275fc835f08260d0b2e86.png)

### Koleksiyon

Verilerin güncelleneceği `koleksiyon`u seçin.

### Güncelleme Modu

İki farklı güncelleme modu bulunmaktadır:

*   **Toplu Güncelleme**: Her güncellenen kayıt için `koleksiyon` olaylarını tetiklemez. Daha iyi performans sunar ve büyük hacimli güncelleme işlemleri için uygundur.
*   **Tek Tek Güncelle**: Her güncellenen kayıt için `koleksiyon` olaylarını tetikler. Ancak, büyük veri hacimlerinde performans sorunlarına neden olabilir ve dikkatli kullanılmalıdır.

Seçim genellikle güncellenecek hedef verilere ve başka `iş akışı` olaylarının tetiklenip tetiklenmeyeceğine bağlıdır. Eğer birincil anahtara göre tek bir kayıt güncelliyorsanız, "Tek Tek Güncelle" modunu kullanmanız önerilir. Eğer koşullara göre birden fazla kayıt güncelliyorsanız, "Toplu Güncelleme" modunu kullanmanız tavsiye edilir.

### Filtre Koşulları

Normal bir `koleksiyon` sorgusundaki filtre koşullarına benzer şekilde, `iş akışı`nın bağlam değişkenlerini kullanabilirsiniz.

### Alan Değerleri

"Kayıt Oluştur" düğümündeki alan atamasına benzer şekilde, `iş akışı` bağlam değişkenlerini kullanabilir veya statik değerleri manuel olarak girebilirsiniz.

Not: Bir `iş akışı`ndaki "Veri Güncelle" düğümü tarafından güncellenen veriler, "Son Düzenleyen" verisini otomatik olarak işlemez. Bu alanın değerini ihtiyaca göre kendiniz yapılandırmanız gerekir.

## Örnek

Örneğin, yeni bir "Makale" oluşturulduğunda, "Makale Kategorisi" `koleksiyon`undaki "Makale Sayısı" alanını otomatik olarak güncellemeniz gerekebilir. Bu, "Veri Güncelle" düğümü kullanılarak gerçekleştirilebilir:

![Veri Güncelle Düğümü Örnek Yapılandırması](https://static-docs.nocobase.com/98e0f41c57275fc835f08260d0b2e86.png)

`iş akışı` tetiklendiğinde, "Makale Kategorisi" `koleksiyon`unun "Makale Sayısı" alanı otomatik olarak mevcut makale sayısı + 1 olarak güncellenecektir.