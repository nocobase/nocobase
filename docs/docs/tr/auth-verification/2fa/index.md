---
pkg: '@nocobase/plugin-two-factor-authentication'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# İki Faktörlü Kimlik Doğrulama (2FA)

## Giriş

İki Faktörlü Kimlik Doğrulama (2FA), bir uygulamaya giriş yaparken kullanılan ek bir güvenlik önlemidir. Uygulamada 2FA etkinleştirildiğinde, kullanıcıların şifreleriyle giriş yaparken OTP kodu veya TOTP gibi ek bir kimlik doğrulama yöntemi sunmaları gerekir.

:::info{title=Not}
Şu anda, 2FA süreci yalnızca şifre tabanlı girişler için geçerlidir. Eğer uygulamanız SSO veya başka kimlik doğrulama yöntemlerini etkinleştirdiyse, lütfen ilgili Kimlik Sağlayıcının (IdP) sunduğu çok faktörlü kimlik doğrulama (MFA) koruma önlemlerini kullanın.
:::

## Eklentiyi Etkinleştirme

![](https://static-docs.nocobase.com/202502282108145.png)

## Yönetici Yapılandırması

Eklentiyi etkinleştirdikten sonra, Kimlik Doğrulayıcı yönetimi sayfasına bir 2FA yapılandırma alt sayfası eklenecektir.

Yöneticilerin "Tüm kullanıcılar için İki Faktörlü Kimlik Doğrulamayı (2FA) zorunlu kıl" seçeneğini işaretlemesi ve bağlanacak uygun bir kimlik doğrulayıcı türü seçmesi gerekir. Eğer hiç kimlik doğrulayıcı yoksa, öncelikle doğrulama yönetimi sayfasına giderek yeni bir kimlik doğrulayıcı oluşturmanız gerekir. Ayrıntılar için: [Doğrulama](../verification/index.md)

![](https://static-docs.nocobase.com/202502282109802.png)

## Kullanıcı Girişi

2FA etkinleştirildiğinde, kullanıcılar şifreleriyle giriş yaptıklarında 2FA doğrulama sürecine gireceklerdir.

Eğer bir kullanıcı henüz belirtilen kimlik doğrulayıcılardan herhangi birini bağlamadıysa, birini bağlaması istenecektir. Bağlama işlemi başarılı olduktan sonra uygulamaya erişebilirler.

![](https://static-docs.nocobase.com/202502282110829.png)

Eğer bir kullanıcı belirtilen kimlik doğrulayıcılardan birini zaten bağladıysa, kimliğini bağlı kimlik doğrulayıcıyı kullanarak doğrulaması istenecektir. Doğrulama başarılı olduktan sonra uygulamaya erişebilirler.

![](https://static-docs.nocobase.com/202502282110148.png)

Giriş yaptıktan sonra, kullanıcılar kişisel merkezlerindeki doğrulama yönetimi sayfasında ek kimlik doğrulayıcılar bağlayabilirler.

![](https://static-docs.nocobase.com/202502282110024.png)