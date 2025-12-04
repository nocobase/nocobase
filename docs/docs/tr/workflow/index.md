---
pkg: '@nocobase/plugin-workflow'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Genel Bakış

## Giriş

İş akışı eklentisi, NocoBase'de günlük onaylar, veri senkronizasyonu, hatırlatıcılar ve benzeri otomatik iş süreçlerini düzenlemenize yardımcı olur. Bir iş akışında, hiçbir kod yazmadan, sadece görsel bir arayüz aracılığıyla tetikleyicileri ve ilgili düğümleri yapılandırarak karmaşık iş mantığını uygulayabilirsiniz.

### Örnek

Her iş akışı, bir tetikleyici ve birkaç düğümle düzenlenir. Tetikleyici, sistemdeki bir olayı temsil eder ve her düğüm bir yürütme adımını temsil eder. Birlikte, olay gerçekleştikten sonra işlenmesi gereken iş mantığını açıklarlar. Aşağıdaki görsel, bir ürün siparişi verildikten sonraki tipik bir stok düşürme sürecini göstermektedir:

![İş Akışı Örneği](https://static-docs.nocobase.com/20251029222146.png)

Bir kullanıcı sipariş verdiğinde, iş akışı otomatik olarak stoğu kontrol eder. Eğer stok yeterliyse, stoku düşürür ve sipariş oluşturmaya devam eder; aksi takdirde süreç sona erer.

### Kullanım Senaryoları

Daha genel bir bakış açısıyla, NocoBase uygulamalarındaki iş akışları, çeşitli senaryolardaki sorunları çözebilir:

- Tekrarlayan görevleri otomatikleştirme: Sipariş incelemeleri, stok senkronizasyonu, veri temizleme, puan hesaplamaları vb. artık manuel işlem gerektirmez.
- İnsan-makine işbirliğini destekleme: Anahtar düğümlerde onaylar veya incelemeler düzenleyerek, sonuçlara göre sonraki adımlara devam etme.
- Harici sistemlere bağlanma: HTTP istekleri gönderme, harici hizmetlerden bildirimler alma ve sistemler arası otomasyon sağlama.
- İş değişikliklerine hızla uyum sağlama: Süreç yapısını, koşulları veya diğer düğüm yapılandırmalarını ayarlayarak, yeni bir sürüm yayınlamadan canlıya alma.

## Kurulum

İş akışı, NocoBase'in yerleşik bir eklentisidir. Ek kurulum veya yapılandırma gerektirmez.

## Daha Fazla Bilgi Edinin

- [Başlarken](./getting-started)
- [Tetikleyiciler](./triggers/index)
- [Düğümler](./nodes/index)
- [Değişkenleri Kullanma](./advanced/variables)
- [Yürütmeler](./advanced/executions)
- [Sürüm Yönetimi](./advanced/revisions)
- [Gelişmiş Yapılandırma](./advanced/options)
- [Eklenti Geliştirme](./development/index)