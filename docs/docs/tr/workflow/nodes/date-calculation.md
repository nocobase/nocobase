---
pkg: '@nocobase/plugin-workflow-date-calculation'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Tarih Hesaplama

## Giriş

Tarih Hesaplama düğümü; bir zaman dilimi ekleme, bir zaman dilimi çıkarma, zaman dizgesini biçimli olarak çıktı verme ve süre birimi dönüştürme dahil olmak üzere dokuz farklı hesaplama fonksiyonu sunar. Her fonksiyonun belirli giriş ve çıkış değeri tipleri vardır ve diğer düğümlerin sonuçlarını parametre değişkeni olarak alabilir. Yapılandırılmış fonksiyon hesaplama sonuçlarını bir hesaplama boru hattı (pipeline) şeklinde birbirine bağlayarak, sonunda beklenen bir çıktı elde etmenizi sağlar.

## Düğüm Oluşturma

iş akışı yapılandırma arayüzünde, akıştaki artı ("+") düğmesine tıklayarak "Tarih Hesaplama" düğümünü ekleyin:

![Tarih Hesaplama Düğümü_Düğüm Oluşturma](https://static-docs.nocobase.com/[图片].png)

## Düğüm Yapılandırması

![Tarih Hesaplama Düğümü_Düğüm Yapılandırması](https://static-docs.nocobase.com/20240817184423.png)

### Giriş Değeri

Giriş değeri bir değişken veya bir tarih sabiti olabilir. Değişken, bu iş akışını tetikleyen veri veya iş akışındaki önceki düğümlerin sonucu olabilir. Sabit için ise herhangi bir tarih seçebilirsiniz.

### Giriş Değeri Tipi

Giriş değerinin tipini ifade eder. İki olası değeri vardır.

*   Tarih tipi: Giriş değerinin nihayetinde bir tarih-saat tipine dönüştürülebileceği anlamına gelir; örneğin, sayısal bir zaman damgası veya zamanı temsil eden bir dizge (string).
*   Sayı tipi: Giriş değerinin tipi, aşağıdaki zaman hesaplama adımlarının seçimini etkilediği için, giriş değeri tipini doğru seçmek önemlidir.

### Hesaplama Adımları

Her hesaplama adımı, bir hesaplama fonksiyonu ve parametre yapılandırmasından oluşur. Boru hattı (pipeline) tasarımı sayesinde, önceki fonksiyonun hesaplama sonucu bir sonraki fonksiyonun giriş değeri olarak hesaplamaya devam eder. Bu sayede, bir dizi zaman hesaplaması ve dönüşümü tamamlanabilir.

Her hesaplama adımından sonra, çıktı tipi de sabittir ve bir sonraki hesaplama adımında kullanılabilecek fonksiyonları etkiler. Hesaplamaya ancak tipler eşleşirse devam edilebilir. Aksi takdirde, bir adımın sonucu düğümün nihai çıktısı olacaktır.

## Hesaplama Fonksiyonları

### Bir Zaman Dilimi Ekleme

-   Giriş değeri tipi: Tarih
-   Parametreler
    -   Eklenecek miktar; bir sayı olarak girilebilir veya düğümün yerleşik değişkenlerinden seçilebilir.
    -   Zaman birimi.
-   Çıkış değeri tipi: Tarih
-   Örnek: Giriş değeri `2024-7-15 00:00:00`, miktar `1` ve birim "gün" olduğunda, hesaplama sonucu `2024-7-16 00:00:00` olacaktır.

### Bir Zaman Dilimi Çıkarma

-   Giriş değeri tipi: Tarih
-   Parametreler
    -   Çıkarılacak miktar; bir sayı olarak girilebilir veya düğümün yerleşik değişkenlerinden seçilebilir.
    -   Zaman birimi.
-   Çıkış değeri tipi: Tarih
-   Örnek: Giriş değeri `2024-7-15 00:00:00`, miktar `1` ve birim "gün" olduğunda, hesaplama sonucu `2024-7-14 00:00:00` olacaktır.

### Başka Bir Zamanla Farkı Hesaplama

-   Giriş değeri tipi: Tarih
-   Parametreler
    -   Farkı hesaplanacak tarih; bir tarih sabiti veya iş akışı bağlamındaki bir değişken olarak seçilebilir.
    -   Zaman birimi.
    -   Mutlak değer alınsın mı?
    -   Yuvarlama işlemi: Ondalıkları koruma, yuvarlama, yukarı yuvarlama ve aşağı yuvarlama seçenekleri mevcuttur.
-   Çıkış değeri tipi: Sayı
-   Örnek: Giriş değeri `2024-7-15 00:00:00`, karşılaştırma nesnesi `2024-7-16 06:00:00`, birim "gün", mutlak değer alınmadığında ve ondalıklar korunduğunda, hesaplama sonucu `-1.25` olacaktır.

:::info{title=İpucu}
Mutlak değer ve yuvarlama aynı anda yapılandırıldığında, önce mutlak değer alınır, sonra yuvarlama uygulanır.
:::

### Zamanın Belirli Bir Birimdeki Değerini Alma

-   Giriş değeri tipi: Tarih
-   Parametreler
    -   Zaman birimi.
-   Çıkış değeri tipi: Sayı
-   Örnek: Giriş değeri `2024-7-15 00:00:00` ve birim "gün" olduğunda, hesaplama sonucu `15` olacaktır.

### Tarihi Belirli Bir Birimin Başlangıcına Ayarlama

-   Giriş değeri tipi: Tarih
-   Parametreler
    -   Zaman birimi.
-   Çıkış değeri tipi: Tarih
-   Örnek: Giriş değeri `2024-7-15 14:26:30` ve birim "gün" olduğunda, hesaplama sonucu `2024-7-15 00:00:00` olacaktır.

### Tarihi Belirli Bir Birimin Bitişine Ayarlama

-   Giriş değeri tipi: Tarih
-   Parametreler
    -   Zaman birimi.
-   Çıkış değeri tipi: Tarih
-   Örnek: Giriş değeri `2024-7-15 14:26:30` ve birim "gün" olduğunda, hesaplama sonucu `2024-7-15 23:59:59` olacaktır.

### Artık Yıl Kontrolü

-   Giriş değeri tipi: Tarih
-   Parametreler
    -   Parametresiz
-   Çıkış değeri tipi: Mantıksal (Boolean)
-   Örnek: Giriş değeri `2024-7-15 14:26:30` olduğunda, hesaplama sonucu `true` olacaktır.

### Dizge Olarak Biçimlendirme

-   Giriş değeri tipi: Tarih
-   Parametreler
    -   Biçim; [Day.js: Format](https://day.js.org/docs/en/display/format) adresine bakınız.
-   Çıkış değeri tipi: Dizge (String)
-   Örnek: Giriş değeri `2024-7-15 14:26:30` ve biçim `the time is YYYY/MM/DD HH:mm:ss` olduğunda, hesaplama sonucu `the time is 2024/07/15 14:26:30` olacaktır.

### Birim Dönüştürme

-   Giriş değeri tipi: Sayı
-   Parametreler
    -   Dönüştürmeden önceki zaman birimi.
    -   Dönüştürmeden sonraki zaman birimi.
    -   Yuvarlama işlemi; ondalıkları koruma, yuvarlama, yukarı yuvarlama ve aşağı yuvarlama seçenekleri mevcuttur.
-   Çıkış değeri tipi: Sayı
-   Örnek: Giriş değeri `2`, dönüştürmeden önceki birim "hafta", dönüştürmeden sonraki birim "gün" ve ondalıklar korunmadığında, hesaplama sonucu `14` olacaktır.

## Örnek

![Tarih Hesaplama Düğümü_Örnek](https://static-docs.nocobase.com/20240817184137.png)

Bir promosyon etkinliği olduğunu varsayalım. Her ürün oluşturulduğunda, ürünün alanına bir promosyon etkinliğinin bitiş zamanını eklemek istiyoruz. Bu bitiş zamanı, ürünün oluşturulma zamanından sonraki haftanın son gününün akşamı 23:59:59'dur. Bu nedenle, iki zaman fonksiyonu oluşturup bunları bir boru hattı (pipeline) şeklinde çalıştırabiliriz:

-   Bir sonraki haftanın zamanını hesaplama
-   Elde edilen sonucu, ilgili haftanın son gününün 23:59:59'una sıfırlama

Bu şekilde, istediğimiz zaman değerini elde eder ve promosyon etkinliğinin bitiş zamanını koleksiyona eklemek için, örneğin bir koleksiyon değiştirme düğümü gibi, bir sonraki düğüme iletiriz.