---
pkg: '@nocobase/plugin-workflow-loop'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Döngü

## Giriş

Döngü, programlama dillerindeki `for`/`while`/`forEach` gibi yapısal ifadelerle eşdeğerdir. Belirli sayıda veya belirli bir veri koleksiyonu (dizi) üzerinde işlemleri tekrarlamanız gerektiğinde döngü düğümünü kullanabilirsiniz.

## Kurulum

Bu, yerleşik bir eklentidir ve kurulum gerektirmez.

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, akıştaki artı ("+") düğmesine tıklayarak bir "Döngü" düğümü ekleyin:

![Döngü Düğümü Oluşturma](https://static-docs.nocobase.com/b3c8061a66bfff037f4b9509ab0aad75.png)

Bir döngü düğümü oluşturduktan sonra, döngü içinde bir dal oluşturulacaktır. Bu dala istediğiniz sayıda düğüm ekleyebilirsiniz. Bu düğümler, iş akışı bağlamındaki değişkenleri kullanmanın yanı sıra, döngü bağlamındaki yerel değişkenleri de kullanabilir. Örneğin, döngü koleksiyonunda her döngüde işlenen veri nesnesi veya döngü sayısının indeksi (indeks `0`'dan başlar). Yerel değişkenlerin kapsamı yalnızca döngü içindedir. Eğer iç içe geçmiş birden fazla döngü varsa, her katmandaki belirli döngünün yerel değişkenlerini kullanabilirsiniz.

## Düğüm Yapılandırması

![20241016135326](https://static-docs.nocobase.com/20241016135326.png)

### Döngü Nesnesi

Döngü, döngü nesnesinin farklı veri tiplerini farklı şekillerde işler:

1.  **Dizi**: En yaygın durumdur. Genellikle iş akışı bağlamından bir değişken seçebilirsiniz; örneğin, bir sorgu düğümünden gelen birden fazla veri sonucu veya önceden yüklenmiş bire çok ilişki verileri. Eğer bir dizi seçilirse, döngü düğümü dizideki her bir öğeyi dolaşır ve her yinelemede mevcut öğeyi döngü bağlamındaki yerel bir değişkene atar.

2.  **Sayı**: Seçilen değişken bir sayı olduğunda, bu sayı yineleme sayısı olarak kullanılır. Sayı değeri yalnızca pozitif tam sayıları destekler; negatif sayılar döngüye girmez ve ondalık kısmın ondalık bölümü göz ardı edilir. Yerel değişkendeki döngü sayısının indeksi aynı zamanda döngü nesnesinin değeridir. Bu değer **0**'dan başlar. Örneğin, döngü nesnesi sayısı 5 ise, her döngüdeki nesne ve indeks sırasıyla: 0, 1, 2, 3, 4 olacaktır.

3.  **Metin (String)**: Seçilen değişken bir metin olduğunda, metnin uzunluğu yineleme sayısı olarak kullanılır ve metindeki her karakter indeksine göre işlenir.

4.  **Diğer**: Diğer değer türleri (nesne türleri dahil) yalnızca tek bir öğe olarak işlenen döngü nesnesi olarak kabul edilir ve yalnızca bir kez döngüye girer. Bu durum genellikle döngü kullanımını gerektirmez.

Değişken seçmenin yanı sıra, sayı ve metin türleri için doğrudan sabit değerler de girebilirsiniz. Örneğin, `5` (sayı türü) girildiğinde, döngü düğümü 5 kez yineler. `abc` (metin türü) girildiğinde, döngü düğümü 3 kez yineler ve sırasıyla `a`, `b` ve `c` karakterlerini işler. Değişken seçim aracında, kullanmak istediğiniz sabit değerin türünü seçin.

### Döngü Koşulu

`v1.4.0-beta` sürümünden itibaren, döngü koşullarıyla ilgili yeni seçenekler eklenmiştir. Döngü koşullarını düğüm yapılandırmasında etkinleştirebilirsiniz.

**Koşul**

Koşul düğümündeki koşul yapılandırmasına benzer şekilde, yapılandırmaları birleştirebilir ve mevcut döngüdeki değişkenleri (örneğin, döngü nesnesi, döngü indeksi vb.) kullanabilirsiniz.

**Kontrol Zamanlaması**

Programlama dillerindeki `while` ve `do/while` yapılarına benzer şekilde, yapılandırılan koşulun hesaplanmasını her döngü başlamadan önce veya her döngü bittikten sonra seçebilirsiniz. Koşulun sonradan hesaplanması, koşul kontrolünden önce döngü gövdesindeki diğer düğümlerin bir kez çalışmasına olanak tanır.

**Koşul Sağlanmadığında**

Programlama dillerindeki `break` ve `continue` ifadelerine benzer şekilde, döngüden çıkmayı veya bir sonraki yinelemeye devam etmeyi seçebilirsiniz.

### Döngü İçindeki Düğümlerde Hata Oluştuğunda İşlem

`v1.4.0-beta` sürümünden itibaren, döngü içindeki bir düğümün yürütülmesi başarısız olduğunda (koşullar karşılanmadığında, hata oluştuğunda vb.), sonraki akışı yapılandırma yoluyla belirleyebilirsiniz. Üç farklı işleme yöntemi desteklenir:

*   İş akışından çık (programlamadaki `throw` gibi)
*   Döngüden çık ve iş akışına devam et (programlamadaki `break` gibi)
*   Bir sonraki döngü nesnesine devam et (programlamadaki `continue` gibi)

Varsayılan olarak "İş akışından çık" seçeneği belirlidir. İhtiyacınıza göre değiştirebilirsiniz.

## Örnek

Örneğin, bir sipariş verildiğinde, siparişteki her ürün için stok kontrolü yapılması gerekir. Eğer stok yeterliyse, stok düşülür. Aksi takdirde, sipariş detayındaki ürün geçersiz olarak güncellenir.

1.  Üç adet koleksiyon oluşturun: Ürünler <-(1:Ç)-- Sipariş Detayları --(Ç:1)-> Siparişler. Veri modeli aşağıdaki gibidir:

    **Siparişler Koleksiyonu**
    | Alan Adı            | Alan Türü                |
    | ------------------- | ------------------------ |
    | Sipariş Detayları   | Bire Çok (Sipariş Detayları) |
    | Sipariş Toplam Fiyatı | Sayı                     |

    **Sipariş Detayları Koleksiyonu**
    | Alan Adı | Alan Türü           |
    | -------- | ------------------- |
    | Ürün     | Çoka Bir (Ürün)     |
    | Miktar   | Sayı                |

    **Ürünler Koleksiyonu**
    | Alan Adı | Alan Türü       |
    | -------- | --------------- |
    | Ürün Adı | Tek Satır Metin |
    | Fiyat    | Sayı            |
    | Stok     | Tam Sayı        |

2.  Bir iş akışı oluşturun. Tetikleyici olarak "Koleksiyon Olayı"nı seçin ve "Siparişler" koleksiyonunu "Kayıt eklendikten sonra" tetiklenecek şekilde ayarlayın. Ayrıca, "Sipariş Detayları" koleksiyonunun ve detaylar altındaki "Ürünler" koleksiyonunun ilişki verilerini önceden yüklemek için yapılandırmanız gerekir:

    ![Döngü Düğümü_Örnek_Tetikleyici Yapılandırması](https://static-docs.nocobase.com/0086601c2fc0e17a64d046a4c86b49b7.png)

3.  Bir döngü düğümü oluşturun ve döngü nesnesi olarak "Tetikleyici veri / Sipariş Detayları"nı seçin. Bu, Sipariş Detayları koleksiyonundaki her bir kaydı işleyeceği anlamına gelir:

    ![Döngü Düğümü_Örnek_Döngü Düğümü Yapılandırması](https://static-docs.nocobase.com/2507becc32db5a9a0641c198605a20da.png)

4.  Döngü düğümünün içine, ürünün stokunun yeterli olup olmadığını kontrol etmek için bir "Koşul" düğümü oluşturun:

    ![Döngü Düğümü_Örnek_Koşul Düğümü Yapılandırması](https://static-docs.nocobase.com/a6d08d15786841e1a3512b38e4629852.png)

5.  Eğer stok yeterliyse, "Evet" dalında bir "Hesaplama düğümü" ve bir "Kayıt güncelle" düğümü oluşturun. Hesaplanan düşülmüş stoğu ilgili ürün kaydına güncelleyin:

    ![Döngü Düğümü_Örnek_Hesaplama Düğümü Yapılandırması](https://static-docs.nocobase.com/8df3604c71f8f8705b1552d3ebfe3b50.png)

    ![Döngü Düğümü_Örnek_Stok Güncelleme Düğümü Yapılandırması](https://static-docs.nocobase.com/2d84baa9b3b01bd85fccda9eec992378.png)

6.  Aksi takdirde, "Hayır" dalında bir "Kayıt güncelle" düğümü oluşturun ve sipariş detayının durumunu "geçersiz" olarak güncelleyin:

    ![Döngü Düğümü_Örnek_Sipariş Detayı Güncelleme Düğümü Yapılandırması](https://static-docs.nocobase.com/4996613090c254c69a1d80f3b3a7fae2.png)

Genel iş akışı yapısı aşağıdaki gibidir:

![Döngü Düğümü_Örnek_İş Akışı Yapısı](https://static-docs.nocobase.com/6f59ef246c1f19976344a7624c4c4151.png)

Bu iş akışını yapılandırıp etkinleştirdikten sonra, yeni bir sipariş oluşturulduğunda, sipariş detaylarındaki ürün stokları otomatik olarak kontrol edilecektir. Eğer stok yeterliyse, stok düşülür; aksi takdirde, sipariş detayındaki ürün geçersiz olarak güncellenir (geçerli bir sipariş toplam fiyatı hesaplanabilmesi için).