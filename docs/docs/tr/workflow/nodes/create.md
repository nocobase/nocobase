:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Yeni Kayıt Ekle

Bir koleksiyona yeni bir kayıt eklemek için kullanılır.

Yeni kaydın alan değerleri, iş akışı bağlamındaki değişkenleri kullanabilir. İlişki alanlarına değer atamak isterseniz, bağlamdaki ilgili veri değişkenlerini doğrudan referans alabilirsiniz; bu bir nesne veya bir dış anahtar değeri olabilir. Değişken kullanmıyorsanız, dış anahtar değerlerini manuel olarak girmeniz gerekir. Çoklu ilişki (to-many) durumundaki birden fazla dış anahtar değeri için, bunları virgülle ayırmalısınız.

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, akıştaki artı ("+") düğmesine tıklayarak "Yeni Kayıt Ekle" düğümünü ekleyebilirsiniz:

![Yeni Kayıt Ekle düğümü oluşturma](https://static-docs.nocobase.com/386c8c01c89b1eeab848510e77f4841a.png)

## Düğüm Yapılandırması

![Yeni Kayıt Ekle Düğümü_Örnek_Düğüm Yapılandırması](https://static-docs.nocobase.com/5f7b97a51b64a1741cf82a4d4455b610.png)

### Koleksiyon

Yeni kayıt eklemek istediğiniz koleksiyonu seçin.

### Alan Değerleri

Koleksiyonun alanlarına değer atayın. İş akışı bağlamındaki değişkenleri kullanabilir veya statik değerleri manuel olarak girebilirsiniz.

:::info{title="Not"}
Bir iş akışındaki "Yeni Kayıt Ekle" düğümü tarafından oluşturulan veriler, "Oluşturan" ve "Son Düzenleyen" gibi kullanıcı verilerini otomatik olarak işlemez. Bu alanların değerlerini ihtiyaca göre kendiniz yapılandırmanız gerekir.
:::

### İlişki Verilerini Önceden Yükleme

Yeni kaydın alanları ilişki alanları içeriyorsa ve sonraki iş akışı adımlarında ilgili ilişki verilerini kullanmak istiyorsanız, ön yükleme yapılandırmasında ilgili ilişki alanlarını işaretleyebilirsiniz. Bu sayede, yeni kayıt oluşturulduktan sonra, ilgili ilişki verileri otomatik olarak yüklenir ve düğümün sonuç verilerinde birlikte saklanır.

## Örnek

Örneğin, "Makaleler" koleksiyonundaki bir kayıt oluşturulduğunda veya güncellendiğinde, makalenin bir değişiklik geçmişini kaydetmek için otomatik olarak bir "Makale Versiyonları" kaydı oluşturulması gerekebilir. Bunu başarmak için "Yeni Kayıt Ekle" düğümünü kullanabilirsiniz:

![Yeni Kayıt Ekle Düğümü_Örnek_İş Akışı Yapılandırması](https://static-docs.nocobase.com/dfd4820d49c145fa331883fc09c9161f.png)

![Yeni Kayıt Ekle Düğümü_Örnek_Düğüm Yapılandırması](https://static-docs.nocobase.com/1a0992e66170be12a068da6503298868.png)

Bu yapılandırma ile iş akışını etkinleştirdikten sonra, "Makaleler" koleksiyonundaki bir kayıt değiştiğinde, makalenin değişiklik geçmişini kaydetmek için otomatik olarak bir "Makale Versiyonları" kaydı oluşturulacaktır.