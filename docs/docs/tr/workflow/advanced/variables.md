:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Değişkenleri Kullanma

## Temel Kavramlar

Tıpkı programlama dillerindeki değişkenler gibi, bir iş akışında **değişkenler** de süreçleri birbirine bağlamak ve düzenlemek için önemli bir araçtır.

Bir iş akışı tetiklendikten sonra her bir düğüm çalıştırıldığında, bazı yapılandırma öğeleri değişkenleri kullanabilir. Bu değişkenlerin kaynağı, mevcut düğümün yukarı akış düğümlerinden gelen verilerdir ve aşağıdaki kategorileri içerir:

- Tetikleyici bağlam verileri: Eylem tetikleyicileri veya koleksiyon tetikleyicileri gibi durumlarda, tek bir satır veri nesnesi tüm düğümler tarafından değişken olarak kullanılabilir. Ayrıntılar, her bir tetikleyicinin uygulamasına göre farklılık gösterir.
- Yukarı akış düğüm verileri: Süreç herhangi bir düğüme ulaştığında, daha önce tamamlanmış düğümlerin sonuç verileridir.
- Yerel değişkenler: Bir düğüm bazı özel dallanma yapıları içinde yer aldığında, o dala özgü yerel değişkenleri kullanabilir. Örneğin, bir döngü yapısında her bir yinelemenin veri nesnesi kullanılabilir.
- Sistem değişkenleri: Mevcut zaman gibi bazı yerleşik sistem parametreleridir.

[Hızlı Başlangıç](../getting-started.md) bölümünde değişken özelliğini birçok kez kullandık. Örneğin, bir hesaplama düğümünde, hesaplamalar yapmak için tetikleyici bağlam verilerine referans vermek amacıyla değişkenleri kullanabiliriz:

![Fonksiyonları ve değişkenleri kullanan hesaplama düğümü](https://static-docs.nocobase.com/837e4851a4c70a1932542caadef3431b.png)

Bir güncelleme düğümünde, filtre koşulu için tetikleyici bağlam verilerini değişken olarak kullanabilir ve hesaplama düğümünün sonucunu güncellenecek veri alanının değeri için bir değişken olarak referans alabiliriz:

![Veri güncelleme düğümü değişkenleri](https://static-docs.nocobase.com/2e147c93643e7ebc709b9b7ab4f3af8c.png)

## Veri Yapısı

Bir değişken, dahili olarak bir JSON yapısıdır ve genellikle verinin belirli bir bölümünü JSON yoluyla kullanabilirsiniz. Birçok değişken NocoBase'in koleksiyon yapısına dayandığından, ilişki verileri nesne özellikleriyle hiyerarşik olarak ağaç benzeri bir yapı oluşturacaktır. Örneğin, sorgulanan verinin ilişki verilerinden belirli bir alanın değerini seçebiliriz. Ayrıca, ilişki verileri çoktan çoğa bir yapıya sahip olduğunda, değişken bir dizi olabilir.

Bir değişken seçerken, çoğu zaman son seviye değer özelliğini seçmeniz gerekecektir; bu genellikle sayı veya metin gibi basit bir veri türüdür. Ancak, değişken hiyerarşisinde bir dizi bulunduğunda, son seviye özellik de bir diziye eşlenecektir. Dizi verileri ancak ilgili düğüm dizileri destekliyorsa doğru şekilde işlenebilir. Örneğin, bir hesaplama düğümünde, bazı hesaplama motorlarının dizileri işlemek için özel fonksiyonları vardır. Başka bir örnek olarak, bir döngü düğümünde, döngü nesnesi doğrudan bir dizi de olabilir.

Örneğin, bir sorgu düğümü birden fazla veri sorguladığında, düğüm sonucu birden çok satır homojen veri içeren bir dizi olacaktır:

```json
[
  {
    "id": 1,
    "title": "Başlık 1"
  },
  {
    "id": 2,
    "title": "Başlık 2"
  }
]
```

Ancak, sonraki düğümlerde bunu bir değişken olarak kullandığınızda, seçilen değişken `Düğüm verisi/Sorgu düğümü/Başlık` şeklinde ise, ilgili alan değerlerine eşlenmiş bir dizi elde edersiniz:

```json
["Başlık 1", "Başlık 2"]
```

Eğer çok boyutlu bir dizi ise (çoktan çoğa ilişki alanı gibi), ilgili alanın düzleştirilmiş tek boyutlu bir dizisini elde edersiniz.

## Sistem Yerleşik Değişkenleri

### Sistem Saati

Çalıştırılan düğüme göre, yürütme anındaki sistem saatini alır. Bu saatin saat dilimi, sunucuda ayarlanan saat dilimidir.

### Tarih Aralığı Parametreleri

Sorgu, güncelleme ve silme düğümlerinde tarih alanı filtre koşullarını yapılandırırken kullanılabilir. Yalnızca "eşittir" karşılaştırmaları için desteklenir. Tarih aralığının başlangıç ve bitiş zamanları, sunucuda ayarlanan saat dilimine göredir.

![Tarih aralığı parametreleri](https://static-docs.nocobase.com/20240817175354.png)