---
pkg: '@nocobase/plugin-auth-saml'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Kimlik Doğrulama: SAML 2.0

## Giriş

SAML 2.0 Kimlik Doğrulama eklentisi, SAML 2.0 (Security Assertion Markup Language 2.0) protokol standardına uygun olarak, kullanıcıların üçüncü taraf kimlik doğrulama hizmet sağlayıcıları (IdP) tarafından sağlanan hesapları kullanarak NocoBase'e giriş yapmasına olanak tanır.

## Eklentiyi Etkinleştirme

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

## SAML Kimlik Doğrulaması Ekleme

Kullanıcı kimlik doğrulama eklentisi yönetim sayfasına girin.

![](https://static-docs.nocobase.com/202411130004459.png)

Ekle - SAML

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

## Yapılandırma

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- SSO URL - IdP tarafından sağlanan, tek oturum açma (SSO) için kullanılan URL.
- Genel Sertifika (Public Certificate) - IdP tarafından sağlanır.
- Varlık Kimliği (IdP Issuer) - İsteğe bağlı, IdP tarafından sağlanır.
- http - NocoBase uygulamanız HTTP protokolünü kullanıyorsa lütfen işaretleyin.
- Kullanıcıyı bağlamak için bu alanı kullanın - Mevcut kullanıcılarla eşleştirmek ve bağlamak için kullanılan alandır. E-posta veya kullanıcı adı seçilebilir, varsayılan olarak e-postadır. IdP tarafından iletilen kullanıcı bilgilerinin `email` veya `username` alanını içermesi gerekmektedir.
- Kullanıcı mevcut değilse otomatik olarak kaydol - Eşleşen mevcut bir kullanıcı bulunamadığında otomatik olarak yeni bir kullanıcı oluşturulup oluşturulmayacağı.
- Kullanım - `SP Issuer / EntityID` ve `ACS URL`, IdP'deki ilgili yapılandırmaya kopyalanıp doldurulmak için kullanılır.

## Alan Eşleme

Alan eşleme, IdP'nin yapılandırma platformunda yapılması gerekir. [Örneği](./examples/google.md) inceleyebilirsiniz.

NocoBase'de eşlenebilecek alanlar şunlardır:

- email (gerekli)
- phone (yalnızca kapsamlarında `phone` desteği olan platformlar için geçerlidir, örn. Alibaba Cloud, Feishu)
- nickname
- username
- firstName
- lastName

`nameID`, SAML protokolü tarafından taşınır ve eşlenmesine gerek yoktur; benzersiz bir kullanıcı tanımlayıcısı olarak kaydedilecektir.
Yeni kullanıcı takma adı kullanım kuralının önceliği şöyledir: `nickname` > `firstName lastName` > `username` > `nameID`
Şu anda kullanıcı organizasyonu ve rol eşlemesi desteklenmemektedir.

## Oturum Açma

Giriş sayfasını ziyaret edin ve giriş formunun altındaki düğmeye tıklayarak üçüncü taraf oturum açmayı başlatın.

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)