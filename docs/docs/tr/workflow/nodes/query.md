:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Veri Sorgulama

Belirli koşulları karşılayan veri kayıtlarını bir **koleksiyon** içinden sorgulamak ve almak için kullanılır.

Tek bir kayıt veya birden fazla kayıt sorgulamak üzere yapılandırabilirsiniz. Sorgu sonucu, sonraki düğümlerde bir değişken olarak kullanılabilir. Birden fazla kayıt sorguladığınızda, sonuç bir dizi olacaktır. Sorgu sonucu boşsa, sonraki düğümlerin çalışmaya devam edip etmeyeceğini seçebilirsiniz.

## Düğüm Oluşturma

**İş akışı** yapılandırma arayüzünde, akıştaki artı ("+") düğmesine tıklayarak "Veri Sorgulama" düğümünü ekleyin:

![Veri Sorgulama Düğümü Ekle](https://static-docs.nocobase.com/c1ef2b851b437806faf7a39c6ab9d33a.png)

## Düğüm Yapılandırması

![Sorgu Düğümü Yapılandırması](https://static-docs.nocobase.com/20240520131324.png)

### Koleksiyon

Veri sorgulamak istediğiniz **koleksiyonu** seçin.

### Sonuç Türü

Sonuç türü "Tek Kayıt" ve "Birden Fazla Kayıt" olmak üzere ikiye ayrılır:

- Tek Kayıt: Sonuç, yalnızca ilk eşleşen kaydı veya `null` değerini içeren bir nesnedir.
- Birden Fazla Kayıt: Sonuç, koşullarla eşleşen kayıtları içeren bir dizi olacaktır. Hiçbir kayıt eşleşmezse, boş bir dizi döner. Bunları bir Döngü düğümü kullanarak tek tek işleyebilirsiniz.

### Filtre Koşulları

Normal bir **koleksiyon** sorgusundaki filtre koşullarına benzer şekilde, **iş akışının** bağlam değişkenlerini kullanabilirsiniz.

### Sıralama

Tek veya birden fazla kayıt sorgularken, istediğiniz sonucu kontrol etmek için sıralama kurallarını kullanabilirsiniz. Örneğin, en son kaydı sorgulamak için "Oluşturma Zamanı" alanına göre azalan sırada sıralayabilirsiniz.

### Sayfalandırma

Sonuç kümesi çok büyük olabileceği durumlarda, sorgu sonuçlarının sayısını kontrol etmek için sayfalandırma kullanabilirsiniz. Örneğin, en son 10 kaydı sorgulamak için "Oluşturma Zamanı" alanına göre azalan sırada sıralayabilir ve ardından sayfalandırmayı 1 sayfa ve 10 kayıt olarak ayarlayabilirsiniz.

### Boş Sonuçları Yönetme

Tek kayıt modunda, koşulları karşılayan veri yoksa sorgu sonucu `null` olacaktır. Birden fazla kayıt modunda ise boş bir dizi (`[]`) olacaktır. İhtiyacınıza göre "Sorgu sonucu boşsa iş akışından çık" seçeneğini işaretleyebilirsiniz. Bu seçenek işaretlendiğinde ve sorgu sonucu boş olduğunda, sonraki düğümler yürütülmeyecek ve **iş akışı** başarısız bir durumla erken sonlanacaktır.