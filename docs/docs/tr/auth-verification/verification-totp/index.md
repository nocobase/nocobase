---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Doğrulama: TOTP Kimlik Doğrulayıcı

## Giriş

TOTP Kimlik Doğrulayıcı, kullanıcıların TOTP (Zaman Tabanlı Tek Kullanımlık Şifre) standardına (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>) uygun herhangi bir doğrulayıcıyı bağlamasına ve zaman tabanlı tek kullanımlık şifre (TOTP) kullanarak kimlik doğrulama yapmasına olanak tanır.

## Yönetici Yapılandırması

Doğrulama Yönetimi sayfasına gidin.

![](https://static-docs.nocobase.com/202502271726791.png)

Ekle - TOTP Kimlik Doğrulayıcı

![](https://static-docs.nocobase.com/202502271745028.png)

Benzersiz bir tanımlayıcı ve başlık dışında, TOTP kimlik doğrulayıcı için başka bir yapılandırma gerekmez.

![](https://static-docs.nocobase.com/202502271746034.png)

## Kullanıcı Bağlama

Doğrulayıcıyı ekledikten sonra, kullanıcılar kişisel doğrulama yönetimi alanlarında TOTP kimlik doğrulayıcıyı bağlayabilirler.

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
Eklenti şu anda bir kurtarma kodu mekanizması sunmamaktadır. TOTP kimlik doğrulayıcıyı bağladıktan sonra, kullanıcıların onu güvenli bir şekilde saklamaları önerilir. Doğrulayıcıyı yanlışlıkla kaybederseniz, kimliğinizi doğrulamak için alternatif bir doğrulama yöntemi kullanabilir, doğrulayıcıyı çözebilir ve ardından yeniden bağlayabilirsiniz.
:::

## Kullanıcı Bağlantısını Kaldırma

Kimlik doğrulayıcının bağlantısını kaldırmak için, zaten bağlı olan doğrulama yöntemini kullanarak doğrulama yapmanız gerekir.

![](https://static-docs.nocobase.com/202502282103205.png)