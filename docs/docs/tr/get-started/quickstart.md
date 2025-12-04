---
versions:
  - label: Latest (Stabil Sürüm)
    features: Özellikleri stabil, iyi test edilmiş ve yalnızca hata düzeltmeleri içerir.
    audience: Stabil bir deneyim arayan kullanıcılar ve üretim ortamı dağıtımları için.
    stability: ★★★★★
    production_recommendation: Önerilir
  - label: Beta (Test Sürümü)
    features: Yaklaşan yeni özellikleri içerir, ilk testlerden geçmiştir ancak bazı sorunlar barındırabilir.
    audience: Yeni özellikleri erken deneyimlemek ve geri bildirim sağlamak isteyen kullanıcılar için.
    stability: ★★★★☆
    production_recommendation: Dikkatli Kullanın
  - label: Alpha (Geliştirme Sürümü)
    features: Geliştirme aşamasındaki sürümdür, en yeni özelliklere sahiptir ancak eksik veya kararsız olabilir.
    audience: Son teknoloji geliştirmelerle ilgilenen teknik kullanıcılar ve katkıda bulunanlar için.
    stability: ★★☆☆☆
    production_recommendation: Dikkatli Kullanın

install_methods:
  - label: Docker Kurulumu (Önerilen)
    features: Kod yazmaya gerek yoktur, kurulumu basittir ve hızlı denemeler için uygundur.
    scenarios: Kodsuz kullanıcılar ve sunucuya hızlıca dağıtım yapmak isteyen kullanıcılar için.
    technical_requirement: ★☆☆☆☆
    upgrade_method: En son imajı çekin ve kapsayıcıyı yeniden başlatın.
  - label: create-nocobase-app Kurulumu
    features: Bağımsız uygulama kod tabanı; eklenti uzantılarını ve arayüz özelleştirmeyi destekler.
    scenarios: Ön uç/tam yığın geliştiriciler, ekip projeleri ve düşük kodlu geliştirme için.
    technical_requirement: ★★★☆☆
    upgrade_method: Bağımlılıkları yarn ile güncelleyin.
  - label: Git Kaynak Kodundan Kurulum
    features: En son kaynak kodunu doğrudan edinin; katkıda bulunmak ve hata ayıklamak için uygundur.
    scenarios: Teknik geliştiriciler ve yayınlanmamış sürümleri denemek isteyen kullanıcılar için.
    technical_requirement: ★★★★★
    upgrade_method: Git süreçleri aracılığıyla güncellemeleri senkronize edin.
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# Kurulum Yöntemleri ve Sürüm Karşılaştırması

NocoBase'i farklı yöntemlerle kurabilirsiniz.

## Sürüm Karşılaştırması

| Kriter | **Latest (Stabil Sürüm)** | **Beta (Test Sürümü)** | **Alpha (Geliştirme Sürümü)** |
|------|------------------------|----------------------|-----------------------|
| **Özellikler** | Özellikleri stabil, iyi test edilmiş ve yalnızca hata düzeltmeleri içerir. | Yaklaşan yeni özellikleri içerir, ilk testlerden geçmiştir ancak bazı sorunlar barındırabilir. | Geliştirme aşamasındaki sürümdür, en yeni özelliklere sahiptir ancak eksik veya kararsız olabilir. |
| **Hedef Kitle** | Stabil bir deneyim arayan kullanıcılar ve üretim ortamı dağıtımları için. | Yeni özellikleri erken deneyimlemek ve geri bildirim sağlamak isteyen kullanıcılar için. | Son teknoloji geliştirmelerle ilgilenen teknik kullanıcılar ve katkıda bulunanlar için. |
| **Stabilite** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Üretim Ortamında Kullanım Önerisi** | Önerilir | Dikkatli Kullanın | Dikkatli Kullanın |

## Kurulum Yöntemleri Karşılaştırması

| Kriter | **Docker Kurulumu (Önerilen)** | **create-nocobase-app Kurulumu** | **Git Kaynak Kodundan Kurulum** |
|------|--------------------------|------------------------------|------------------|
| **Özellikler** | Kod yazmaya gerek yoktur, kurulumu basittir ve hızlı denemeler için uygundur. | Bağımsız uygulama kod tabanı; eklenti uzantılarını ve arayüz özelleştirmeyi destekler. | En son kaynak kodunu doğrudan edinin; katkıda bulunmak ve hata ayıklamak için uygundur. |
| **Kullanım Senaryoları** | Kodsuz kullanıcılar ve sunucuya hızlıca dağıtım yapmak isteyen kullanıcılar için. | Ön uç/tam yığın geliştiriciler, ekip projeleri ve düşük kodlu geliştirme için. | Teknik geliştiriciler ve yayınlanmamış sürümleri denemek isteyen kullanıcılar için. |
| **Teknik Gereksinim** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Yükseltme Yöntemi** | En son imajı çekin ve kapsayıcıyı yeniden başlatın. | Bağımlılıkları yarn ile güncelleyin. | Git süreçleri aracılığıyla güncellemeleri senkronize edin. |
| **Eğitimler** | [<code>Kurulum</code>](#) [<code>Yükseltme</code>](#) [<code>Dağıtım</code>](#) | [<code>Kurulum</code>](#) [<code>Yükseltme</code>](#) [<code>Dağıtım</code>](#) | [<code>Kurulum</code>](#) [<code>Yükseltme</code>](#) [<code>Dağıtım</code>](#) |