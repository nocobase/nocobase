:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Yayın Yönetimi

## Giriş

Gerçek dünya uygulamalarında, veri güvenliğini ve uygulamanın kararlı çalışmasını sağlamak amacıyla genellikle birden fazla ortam dağıtmamız gerekir; örneğin bir geliştirme ortamı, bir ön yayın ortamı ve bir üretim ortamı. Bu belge, iki yaygın kodsuz geliştirme sürecini örnek alarak NocoBase'de yayın yönetimini nasıl uygulayacağınızı ayrıntılı olarak açıklayacaktır.

## Kurulum

Yayın yönetimi için gerekli üç eklenti bulunmaktadır. Lütfen aşağıdaki eklentilerin etkinleştirildiğinden emin olun.

### Ortam Değişkenleri ve Anahtarlar

- Yerleşik bir eklentidir, varsayılan olarak yüklü ve etkinleştirilmiştir.
- Hassas veri depolama, yapılandırma verilerinin yeniden kullanımı ve ortama dayalı izolasyon gibi amaçlar için ortam değişkenlerinin ve anahtarların merkezi olarak yapılandırılmasını ve yönetilmesini sağlar. ([Belgeleri Görüntüle](#))

### Yedekleme Yöneticisi

- Bu eklenti yalnızca Profesyonel sürümde veya daha yüksek sürümlerde kullanılabilir. ([Daha fazla bilgi edinin](https://www.nocobase.com/en/commercial))
- Yedekleme ve geri yükleme işlevleri sunar, zamanlanmış yedeklemeleri destekleyerek veri güvenliğini ve hızlı kurtarmayı sağlar. ([Belgeleri Görüntüle](../backup-manager/index.mdx))

### Taşıma Yöneticisi

- Bu eklenti yalnızca Profesyonel sürümde veya daha yüksek sürümlerde kullanılabilir. ([Daha fazla bilgi edinin](https://www.nocobase.com/en/commercial))
- Uygulama yapılandırmalarını bir uygulama ortamından diğerine taşımak için kullanılır. ([Belgeleri Görüntüle](../migration-manager/index.md))

## Yaygın Kodsuz Geliştirme Süreçleri

### Tek Geliştirme Ortamı, Tek Yönlü Yayın

Bu yaklaşım basit geliştirme süreçleri için uygundur. Bir geliştirme ortamı, bir ön yayın ortamı ve bir üretim ortamı bulunur. Değişiklikler geliştirme ortamından ön yayın ortamına sırayla yayınlanır ve son olarak üretim ortamına dağıtılır. Bu süreçte, yalnızca geliştirme ortamı yapılandırmaları değiştirebilir; ne ön yayın ne de üretim ortamı değişiklik yapılmasına izin verir.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

Taşıma kurallarını yapılandırırken, çekirdek ve eklentilerdeki yerleşik tablolar için "Üzerine Yazma Öncelikli" kuralını seçin; diğerleri için özel bir gereksinim yoksa varsayılan ayarları kullanabilirsiniz.

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

### Birden Fazla Geliştirme Ortamı, Birleştirilmiş Yayın

Bu yaklaşım, çoklu kişi işbirliği veya karmaşık proje senaryoları için uygundur. Birkaç paralel geliştirme ortamı bağımsız olarak geliştirme yapabilir ve tüm değişiklikler test ve doğrulama için tek bir ön yayın ortamında birleştirilerek son olarak üretim ortamına yayınlanır. Bu süreçte de yalnızca geliştirme ortamı yapılandırmaları değiştirebilir; ne ön yayın ne de üretim ortamı değişiklik yapılmasına izin verir.

![20250107103829](https://static-docs.nocobase.com/20250107103829.png)

Taşıma kurallarını yapılandırırken, çekirdek ve eklentilerdeki yerleşik tablolar için "Ekleme veya Güncelleme Öncelikli" kuralını seçin; diğerleri için özel bir gereksinim yoksa varsayılan ayarları kullanabilirsiniz.

![20250105194942](https://static-docs.nocobase.com/20250105194942.png)

## Geri Alma

Bir taşıma işlemi gerçekleştirmeden önce, sistem mevcut uygulamanın otomatik olarak bir yedeğini oluşturur. Taşıma işlemi başarısız olursa veya sonuçlar beklenildiği gibi olmazsa, [Yedekleme Yöneticisi](../backup-manager/index.mdx) aracılığıyla geri alabilir ve kurtarabilirsiniz.

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)