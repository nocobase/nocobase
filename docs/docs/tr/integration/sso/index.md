:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Tek Oturum Açma (SSO) Entegrasyonu

NocoBase, mevcut kurumsal kimlik sistemlerinizle sorunsuz entegrasyon için çeşitli ana akım kimlik doğrulama protokollerini destekleyen kapsamlı Tek Oturum Açma (SSO) çözümleri sunar.

## Genel Bakış

Tek Oturum Açma, kullanıcıların ilgili ancak bağımsız birden fazla sisteme tek bir kimlik bilgisi setiyle giriş yapmasına olanak tanır. Kullanıcılar yalnızca bir kez oturum açarak, yetkilendirilmiş tüm uygulamalara tekrar tekrar kullanıcı adı ve şifre girmelerine gerek kalmadan erişebilirler. Bu, kullanıcı deneyimini iyileştirmenin yanı sıra sistem güvenliğini ve yönetim verimliliğini de artırır.

## Desteklenen Kimlik Doğrulama Protokolleri

NocoBase, **eklenti**ler aracılığıyla aşağıdaki kimlik doğrulama protokollerini ve yöntemlerini destekler:

### Kurumsal SSO Protokolleri

- **[SAML 2.0](/auth-verification/auth-saml/)**: Kurumsal kimlik doğrulama için yaygın olarak kullanılan, XML tabanlı açık bir standarttır. Kurumsal Kimlik Sağlayıcıları (IdP) ile entegrasyon gerektiren senaryolar için uygundur.

- **[OIDC (OpenID Connect)](/auth-verification/auth-oidc/)**: OAuth 2.0 üzerine kurulu, modern kimlik doğrulama ve yetkilendirme mekanizmaları sunan bir kimlik doğrulama katmanıdır. Başlıca kimlik sağlayıcıları (ör. Google, Azure AD vb.) ile entegrasyonu destekler.

- **[CAS (Central Authentication Service)](/auth-verification/auth-cas/)**: Yale Üniversitesi tarafından geliştirilen ve yükseköğretim kurumlarında yaygın olarak kullanılan bir Tek Oturum Açma protokolüdür.

- **[LDAP](/auth-verification/auth-ldap/)**: Dağıtılmış dizin bilgi hizmetlerine erişmek ve bunları sürdürmek için kullanılan Hafif Dizin Erişim Protokolü'dür. Active Directory veya diğer LDAP sunucularıyla entegrasyon gerektiren senaryolar için uygundur.

### Üçüncü Taraf Platform Kimlik Doğrulaması

- **[WeCom (WeChat Work)](/auth-verification/auth-wecom/)**: WeCom QR kod ile giriş ve uygulama içi sorunsuz kimlik doğrulamayı destekler.

- **[DingTalk](/auth-verification/auth-dingtalk/)**: DingTalk QR kod ile giriş ve uygulama içi sorunsuz kimlik doğrulamayı destekler.

### Diğer Kimlik Doğrulama Yöntemleri

- **[SMS Doğrulaması](/auth-verification/auth-sms/)**: Cep telefonu SMS tabanlı doğrulama kodu ile kimlik doğrulama yöntemidir.

- **[Kullanıcı Adı/Şifre](/auth-verification/auth/)**: NocoBase'in yerleşik temel kimlik doğrulama yöntemidir.

## Entegrasyon Adımları

### 1. Kimlik Doğrulama Eklentisini Kurun

İhtiyaçlarınıza göre, **eklenti** yöneticisinden ilgili kimlik doğrulama **eklenti**sini bulun ve kurun. Çoğu SSO kimlik doğrulama **eklenti**si ayrı olarak satın alınmayı veya abone olunmayı gerektirebilir.

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

Örneğin, SAML 2.0 kimlik doğrulama **eklenti**sini kurmak için:

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

Veya OIDC kimlik doğrulama **eklenti**sini kurmak için:

![](https://static-docs.nocobase.com/202411122358790.png)

### 2. Kimlik Doğrulama Yöntemini Yapılandırın

1. **Sistem Ayarları > Kullanıcı Kimlik Doğrulaması** sayfasına gidin.

![](https://static-docs.nocobase.com/202411130004459.png)

2. **Kimlik Doğrulama Yöntemi Ekle**'ye tıklayın.
3. Kurulmuş kimlik doğrulama türünü seçin (örneğin, SAML).

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

Veya OIDC'yi seçin:

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

4. İstenen ilgili parametreleri yapılandırın.

### 3. Kimlik Sağlayıcıyı Yapılandırın

Her kimlik doğrulama protokolü, ilgili Kimlik Sağlayıcı bilgilerinin yapılandırılmasını gerektirir:

- **SAML**: IdP meta verilerini, sertifikalarını vb. yapılandırın.

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- **OIDC**: İstemci Kimliği (Client ID), İstemci Gizliliği (Client Secret), keşif uç noktası (discovery endpoint) vb. yapılandırın.

![](https://static-docs.nocobase.com/202411130006341.png)

- **CAS**: CAS sunucu adresini yapılandırın.
- **LDAP**: LDAP sunucu adresini, Bağlama DN'sini (Bind DN) vb. yapılandırın.
- **WeCom/DingTalk**: Uygulama kimlik bilgilerini, Kurumsal Kimliği (Corp ID) vb. yapılandırın.

### 4. Oturum Açmayı Test Edin

Yapılandırma tamamlandıktan sonra, önce bir test yapmanız önerilir:

1. Mevcut oturumunuzdan çıkış yapın.
2. Giriş sayfasında yapılandırılmış SSO yöntemini seçin.

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)

3. Kimlik Sağlayıcının kimlik doğrulama akışını tamamlayın.
4. NocoBase'e başarılı bir şekilde giriş yapabildiğinizi doğrulayın.

## Kullanıcı Eşleme ve Rol Ataması

Başarılı SSO kimlik doğrulamasının ardından, NocoBase kullanıcı hesaplarını otomatik olarak yönetir:

- **İlk Giriş**: Otomatik olarak yeni bir kullanıcı hesabı oluşturulur ve Kimlik Sağlayıcıdan temel bilgiler (takma ad, e-posta vb.) senkronize edilir.
- **Sonraki Girişler**: Mevcut hesap kullanılır; kullanıcı bilgilerinin güncellenip güncellenmeyeceği isteğe bağlıdır.
- **Rol Ataması**: Varsayılan roller yapılandırılabilir veya Kimlik Sağlayıcıdan gelen kullanıcı bilgilerindeki rol alanına göre roller otomatik olarak atanabilir.

## Güvenlik Önerileri

1. **HTTPS Kullanın**: Kimlik doğrulama veri aktarım güvenliğini korumak için NocoBase'in HTTPS ortamında dağıtıldığından emin olun.
2. **Sertifikaları Düzenli Olarak Güncelleyin**: SAML sertifikaları gibi güvenlik kimlik bilgilerini zamanında güncelleyin ve değiştirin.
3. **Geri Çağırma URL'si Beyaz Listesini Yapılandırın**: Kimlik Sağlayıcıda NocoBase'in geri çağırma URL'lerini doğru şekilde yapılandırın.
4. **En Az Ayrıcalık Prensibi**: SSO kullanıcılarına uygun rol ve izinleri atayın.
5. **Denetim Günlüğünü Etkinleştirin**: SSO oturum açma etkinliklerini kaydedin ve izleyin.

## Sıkça Sorulan Sorular

### SSO Oturum Açma Başarısız mı Oldu?

1. Kimlik Sağlayıcı yapılandırmasının doğru olup olmadığını kontrol edin.
2. Geri çağırma URL'lerinin doğru yapılandırıldığından emin olun.
3. Ayrıntılı hata mesajları için NocoBase günlüklerini inceleyin.
4. Sertifikaların ve anahtarların geçerli olduğunu doğrulayın.

### Kullanıcı Bilgileri Senkronize Olmuyor mu?

1. Kimlik Sağlayıcı tarafından döndürülen kullanıcı niteliklerini kontrol edin.
2. Alan eşleme yapılandırmasının doğru olup olmadığını doğrulayın.
3. Kullanıcı bilgileri senkronizasyon seçeneğinin etkinleştirildiğini onaylayın.

### Birden Fazla Kimlik Doğrulama Yöntemi Nasıl Desteklenir?

NocoBase, birden fazla kimlik doğrulama yöntemini aynı anda yapılandırmayı destekler. Kullanıcılar, giriş sayfasında tercih ettikleri yöntemi seçerek oturum açabilirler.

## İlgili Kaynaklar

- [Kimlik Doğrulama Belgeleri](/auth-verification/auth/)
- [API Anahtarı Kimlik Doğrulaması](/integration/api-keys/)
- [Kullanıcı ve İzin Yönetimi](/plugins/@nocobase/plugin-users/)