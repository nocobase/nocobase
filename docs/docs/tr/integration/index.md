:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Entegrasyon

## Genel Bakış

NocoBase, harici sistemler, üçüncü taraf hizmetler ve çeşitli veri kaynakları ile sorunsuz bağlantı kurmanızı sağlayan kapsamlı entegrasyon yetenekleri sunar. Esnek entegrasyon yöntemleri sayesinde, NocoBase'in işlevselliğini farklı iş ihtiyaçlarınızı karşılayacak şekilde genişletebilirsiniz.

## Entegrasyon Yöntemleri

### API Entegrasyonu

NocoBase, harici uygulamalar ve hizmetlerle entegrasyon için güçlü API yetenekleri sunar:

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

- **[API Anahtarları](/integration/api-keys/)**: NocoBase kaynaklarına programatik erişim için API anahtarlarını kullanarak güvenli kimlik doğrulama.
- **[API Dokümantasyonu](/integration/api-doc/)**: Uç noktaları keşfetmek ve test etmek için yerleşik API dokümantasyonu.

### Tek Oturum Açma (SSO)

Birleşik kimlik doğrulama için kurumsal kimlik sistemleriyle entegre olun:

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

- **[SSO Entegrasyonu](/integration/sso/)**: SAML, OIDC, CAS, LDAP ve üçüncü taraf platform kimlik doğrulamasını destekler.
- Merkezi kullanıcı yönetimi ve erişim kontrolü.
- Sistemler arası sorunsuz kimlik doğrulama deneyimi.

### İş Akışı Entegrasyonu

NocoBase iş akışlarını harici sistemlerle bağlayın:

![auth_sso-2025-11-24-12-02-01](https://static-docs.nocobase.com/auth_sso-2025-11-24-12-02-01.png)

- **[İş Akışı Webhook'u](/integration/workflow-webhook/)**: İş akışlarını tetiklemek için harici sistemlerden olaylar alın.
- **[İş Akışı HTTP İsteği](/integration/workflow-http-request/)**: İş akışlarından harici API'lere HTTP istekleri gönderin.
- Platformlar arası iş süreçlerini otomatikleştirin.

### Harici Veri Kaynakları

Harici veritabanlarına ve veri sistemlerine bağlanın:

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

- **[Harici Veritabanları](/data-sources/)**: MySQL, PostgreSQL, MariaDB, MSSQL, Oracle ve KingbaseES veritabanlarına doğrudan bağlanın.
- Harici veritabanı tablo yapılarını tanıyın ve NocoBase içinde harici veriler üzerinde doğrudan CRUD (Oluşturma, Okuma, Güncelleme, Silme) işlemleri gerçekleştirin.
- Birleşik veri yönetimi arayüzü.

### Gömülü İçerik

NocoBase içine harici içerik gömün:

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

- **[Iframe Bloğu](/integration/block-iframe/)**: Harici web sayfalarını ve uygulamalarını gömün.
- **JS Blokları**: Gelişmiş entegrasyonlar için özel JavaScript kodu çalıştırın.

## Yaygın Entegrasyon Senaryoları

### Kurumsal Sistem Entegrasyonu

- NocoBase'i ERP, CRM veya diğer kurumsal sistemlerle bağlayın.
- Verileri çift yönlü senkronize edin.
- Sistemler arası iş akışlarını otomatikleştirin.

### Üçüncü Taraf Hizmet Entegrasyonu

- Ödeme ağ geçitlerinden ödeme durumunu sorgulayın, mesajlaşma hizmetlerini veya bulut platformlarını entegre edin.
- İşlevselliği genişletmek için harici API'lerden yararlanın.
- Webhook'lar ve HTTP istekleri kullanarak özel entegrasyonlar oluşturun.

### Veri Entegrasyonu

- Birden fazla veri kaynağına bağlanın.
- Farklı sistemlerden verileri bir araya getirin.
- Birleşik panolar ve raporlar oluşturun.

## Güvenlik Hususları

NocoBase'i harici sistemlerle entegre ederken aşağıdaki güvenlik en iyi uygulamalarını göz önünde bulundurun:

1.  **HTTPS Kullanın**: Veri iletimi için her zaman şifreli bağlantılar kullanın.
2.  **API Anahtarlarını Güvende Tutun**: API anahtarlarını güvenli bir şekilde saklayın ve düzenli olarak değiştirin.
3.  **En Az Ayrıcalık Prensibi**: Entegrasyonlar için yalnızca gerekli izinleri verin.
4.  **Denetim Kaydı**: Entegrasyon faaliyetlerini izleyin ve kaydedin.
5.  **Veri Doğrulama**: Harici kaynaklardan gelen tüm verileri doğrulayın.