:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Hesaplama

Hesaplama düğümü, bir ifadeyi değerlendirerek sonucunu ilgili düğümde saklar ve bu sonuç, sonraki düğümler tarafından kullanılabilir. Bu düğüm, verileri hesaplamak, işlemek ve dönüştürmek için güçlü bir araçtır. Bir bakıma, programlama dillerinde bir değer üzerinde fonksiyon çağırıp sonucu bir değişkene atama işlevini karşılar.

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, akıştaki artı ("+") düğmesine tıklayarak bir "Hesaplama" düğümü ekleyebilirsiniz:

![Hesaplama Düğümü_Ekle](https://static-docs.nocobase.com/58a455540d26945251cd143eb4b16579.png)

## Düğüm Yapılandırması

![Hesaplama Düğümü_Yapılandırma](https://static-docs.nocobase.com/6a155de3f6a883d8cd1881b2d9c33874.png)

### Hesaplama Motoru

Hesaplama motoru, ifadenin desteklediği sözdizimini tanımlar. Şu anda desteklenen hesaplama motorları [Math.js](https://mathjs.org/) ve [Formula.js](https://formulajs.info/)'dir. Her motor, çok sayıda yerleşik yaygın fonksiyon ve veri işleme yöntemine sahiptir. Ayrıntılı kullanım için ilgili motorların resmi belgelerine başvurabilirsiniz.

:::info{title=İpucu}
Farklı motorların dizi indeks erişiminde farklılık gösterdiğini unutmamak önemlidir. Math.js'de indeksler `1`'den başlarken, Formula.js'de `0`'dan başlar.
:::

Ayrıca, basit bir dize birleştirmesine ihtiyacınız varsa, doğrudan "Dize Şablonu"nu kullanabilirsiniz. Bu motor, ifadedeki değişkenleri karşılık gelen değerlerle değiştirir ve ardından birleştirilmiş dizeyi döndürür.

### İfade

Bir ifade, değişkenler, sabitler, operatörler ve desteklenen fonksiyonlardan oluşabilen bir hesaplama formülünün dize gösterimidir. Akış bağlamındaki değişkenleri, örneğin hesaplama düğümünün önceki düğümünün sonucunu veya bir döngünün yerel değişkenlerini kullanabilirsiniz.

İfade girişi sözdizimine uymadığında, düğüm yapılandırmasında bir hata uyarısı gösterilir. Eğer yürütme sırasında bir değişken mevcut değilse, türü eşleşmiyorsa veya var olmayan bir fonksiyon kullanılmışsa, hesaplama düğümü bir hata durumuyla erken sonlanır.

## Örnek

### Sipariş Toplam Fiyatını Hesaplama

Genellikle bir sipariş birden fazla ürün içerebilir ve her ürünün fiyatı ile miktarı farklıdır. Siparişin toplam fiyatı, tüm ürünlerin fiyat ve miktar çarpımlarının toplamı olarak hesaplanmalıdır. Sipariş detayları listesini (çoklu ilişkili bir veri kümesi) yükledikten sonra, siparişin toplam fiyatını hesaplamak için bir hesaplama düğümü kullanabilirsiniz:

![Hesaplama Düğümü_Örnek_Yapılandırma](https://static-docs.nocobase.com/85966b0116afb49aa966eeaa85e78dae.png)

Burada, Formula.js'in `SUMPRODUCT` fonksiyonu, aynı uzunluktaki iki dizinin her satırının çarpımlarının toplamını hesaplayarak siparişin toplam fiyatını elde etmenizi sağlar.