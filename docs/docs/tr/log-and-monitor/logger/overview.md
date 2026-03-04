:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/log-and-monitor/logger/overview) bakın.
:::

# Sunucu Günlükleri, Denetim Günlükleri ve Kayıt Geçmişi

## Sunucu Günlükleri

### Sistem Günlükleri

> Bkz. [Sistem Günlükleri](./index.md#system-logs)

- Uygulama sisteminin çalışma bilgilerini kaydeder, kod yürütme zincirlerini izler ve çalışma zamanı hataları gibi istisnai durumları takip eder.
- Günlük seviyeleri mevcuttur ve fonksiyonel modüllere göre sınıflandırılır.
- Terminal çıktısı olarak verilir veya dosya biçiminde saklanır.
- Esas olarak sistemin çalışması sırasında ortaya çıkan anormal durumları gidermek için kullanılır.

### İstek Günlükleri

> Bkz. [İstek Günlükleri](./index.md#request-logs)

- HTTP API istek ve yanıt bilgilerini kaydeder; istek kimliği (ID), API yolu, başlıklar, yanıt durum kodu ve süre gibi bilgilere odaklanır.
- Terminal çıktısı olarak verilir veya dosya biçiminde saklanır.
- Esas olarak API çağrılarını ve yürütme performansını izlemek için kullanılır.

## Denetim Günlükleri

> Bkz. [Denetim Günlükleri](/security/audit-logger/index.md)

- Kullanıcıların (veya API'lerin) sistem kaynakları üzerindeki işlemlerini kaydeder; kaynak türü, hedef nesne, işlem türü, kullanıcı bilgileri ve işlem durumu gibi bilgilere odaklanır.
- Kullanıcı işlemlerinin içeriğini ve sonuçlarını daha iyi takip edebilmek için istek parametreleri ve yanıtlar meta veri (metadata) olarak kaydedilir. Bu bilgiler istek günlükleriyle kısmen örtüşse de tamamen aynı değildir; örneğin, mevcut istek günlüklerinde genellikle tam istek gövdesi (request body) kaydedilmez.
- İstek parametreleri ve yanıtlar, kaynak anlık görüntüleri (snapshots) ile eş değer değildir. Parametreler ve kod mantığı aracılığıyla ne tür değişikliklerin yapıldığı anlaşılabilir ancak veri tabanı kaydının değişiklikten önceki tam içeriği bilinemez; bu nedenle sürüm kontrolü veya hatalı işlemlerden sonra veri kurtarma amacıyla kullanılamazlar.
- Hem dosya hem de veri tabanı tablosu biçiminde saklanır.

![](https://static-docs.nocobase.com/202501031627922.png)

## Kayıt Geçmişi

> Bkz. [Kayıt Geçmişi](/record-history/index.md)

- Veri içeriğinin değişiklik geçmişini kaydeder.
- Temel olarak kaynak türü, kaynak nesnesi, işlem türü, değiştirilen alanlar ve değişiklik öncesi/sonrası değerleri kaydeder.
- Veri karşılaştırması için kullanılabilir.
- Veri tabanı tablosu biçiminde saklanır.

![](https://static-docs.nocobase.com/202511011338499.png)