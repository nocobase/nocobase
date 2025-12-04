:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Veri Silme

Belirli koşulları karşılayan verileri bir koleksiyondan silmek için kullanılır.

Silme düğümünün temel kullanımı, güncelleme düğümüne benzer. Ancak silme düğümü için alan ataması yapmanız gerekmez; sadece koleksiyonu ve filtreleme koşullarını seçmeniz yeterlidir. Silme düğümünün sonucu, başarıyla silinen veri satırlarının sayısını döndürür. Bu sonuç yalnızca yürütme geçmişinde görüntülenebilir ve sonraki düğümlerde bir değişken olarak kullanılamaz.

:::info{title=Not}
Şu anda silme düğümü, tek tek satır silmeyi desteklememektedir; toplu silme işlemleri yapar. Bu nedenle, her bir veri silme işlemi için diğer olayları tetiklemez.
:::

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, akıştaki artı ("+") düğmesine tıklayarak "Veri Sil" düğümünü ekleyin:

![Veri Sil düğümü oluşturma](https://static-docs.nocobase.com/e1d6b8728251fcdbed6c7f50e5570da2.png)

## Düğüm Yapılandırması

![Silme düğümü_Düğüm yapılandırması](https://static-docs.nocobase.com/580600c2b3ef4e01dfa48b23539648e.png)

### Koleksiyon

Veri silmek istediğiniz koleksiyonu seçin.

### Filtreleme Koşulları

Normal bir koleksiyon sorgusundaki filtreleme koşullarına benzer şekilde, iş akışının bağlam değişkenlerini kullanabilirsiniz.

## Örnek

Örneğin, iptal edilmiş ve geçersiz geçmiş sipariş verilerini düzenli olarak temizlemek için silme düğümünü kullanabilirsiniz:

![Silme düğümü_Örnek_Düğüm yapılandırması](https://static-docs.nocobase.com/b94b75077a17252f8523c3f13ce5f320.png)

İş akışı düzenli olarak tetiklenecek ve tüm iptal edilmiş ve geçersiz geçmiş sipariş verilerinin silinmesini gerçekleştirecektir.