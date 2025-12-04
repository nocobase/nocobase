:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Sunucu Günlükleri, Denetim Günlükleri ve Kayıt Geçmişi

## Sunucu Günlükleri

### Sistem Günlükleri

> Daha fazla bilgi için bkz. [Sistem Günlükleri](./logger/index.md#sistem-günlükleri)

- Uygulama sisteminin çalışma bilgilerini kaydeder, kod yürütme zincirlerini izler ve istisnaları veya çalışma zamanı hatalarını takip eder.
- Günlükler, önem derecelerine ve işlevsel modüllere göre sınıflandırılır.
- Terminal aracılığıyla çıktı verir veya dosya olarak saklanır.
- Esas olarak, sistemin çalışması sırasında ortaya çıkan hataları teşhis etmek ve gidermek için kullanılır.

### İstek Günlükleri

> Daha fazla bilgi için bkz. [İstek Günlükleri](./logger/index.md#istek-günlükleri)

- HTTP API istek ve yanıt ayrıntılarını kaydeder; istek kimliği, API yolu, başlıklar, yanıt durum kodu ve süre gibi bilgilere odaklanır.
- Terminal aracılığıyla çıktı verir veya dosya olarak saklanır.
- Esas olarak, API çağrılarını ve yürütme performansını izlemek için kullanılır.

## Denetim Günlükleri

> Daha fazla bilgi için bkz. [Denetim Günlükleri](../security/audit-logger/index.md)

- Kullanıcıların (veya API'lerin) sistem kaynakları üzerindeki eylemlerini kaydeder; kaynak türü, hedef nesne, işlem türü, kullanıcı bilgileri ve işlem durumu gibi bilgilere odaklanır.
- Kullanıcıların ne yaptığını ve hangi sonuçların üretildiğini daha iyi takip etmek için, istek parametreleri ve yanıtları meta veri olarak saklanır. Bu durum, istek günlükleriyle kısmen örtüşse de tamamen aynı değildir; örneğin, istek günlükleri genellikle tam istek gövdelerini içermez.
- İstek parametreleri ve yanıtları, veri anlık görüntüleriyle **eşdeğer değildir**. Ne tür işlemlerin gerçekleştiğini ortaya çıkarabilirler, ancak değişiklik öncesindeki kesin veriyi göstermezler, bu nedenle sürüm kontrolü veya hatalı işlemlerden sonra veriyi geri yüklemek için kullanılamazlar.
- Hem dosya hem de veritabanı tabloları olarak saklanır.

![](https://static-docs.nocobase.com/202501031627922.png)

## Kayıt Geçmişi

> Daha fazla bilgi için bkz. [Kayıt Geçmişi](/record-history/index.md)

- Veri içeriğinin **değişiklik geçmişini** kaydeder.
- Kaynak türü, kaynak nesne, işlem türü, değişen alanlar ve önceki/sonraki değerler gibi bilgileri izler.
- **Veri karşılaştırması ve denetimi** için kullanışlıdır.
- Veritabanı tablolarında saklanır.

![](https://static-docs.nocobase.com/202511011338499.png)