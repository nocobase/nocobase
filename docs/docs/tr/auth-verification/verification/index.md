---
pkg: "@nocobase/plugin-verification"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# Doğrulama

:::info{title=Not}
`1.6.0-alpha.30` sürümünden itibaren, orijinal **doğrulama kodu** özelliği **Doğrulama Yönetimi** olarak güncellenmiştir. Bu özellik, farklı kullanıcı kimlik doğrulama yöntemlerini yönetmeyi ve entegre etmeyi destekler. Kullanıcılar ilgili doğrulama yöntemini bağladıktan sonra, gerekli senaryolarda kimlik doğrulama yapabilirler. Bu özelliğin `1.7.0` sürümünden itibaren kararlı bir şekilde desteklenmesi planlanmaktadır.
:::

## Giriş

**Doğrulama Yönetim Merkezi, farklı kullanıcı kimlik doğrulama yöntemlerini yönetmeyi ve entegre etmeyi destekler.** Örneğin:

- SMS Doğrulama Kodu – Doğrulama eklentisi tarafından varsayılan olarak sağlanır. Bakınız: [Doğrulama: SMS](./sms)
- TOTP Kimlik Doğrulayıcı – Bakınız: [Doğrulama: TOTP Kimlik Doğrulayıcı](../verification-totp/)

Geliştiriciler, eklenti şeklinde başka doğrulama türlerini de genişletebilirler. Bakınız: [Doğrulama Türlerini Genişletme](./dev/type)

**Kullanıcılar, ilgili doğrulama yöntemini bağladıktan sonra, gerekli senaryolarda kimlik doğrulama yapabilirler.** Örneğin:

- SMS Doğrulama ile Giriş – Bakınız: [Kimlik Doğrulama: SMS](./sms)
- İki Faktörlü Kimlik Doğrulama (2FA) – Bakınız: [İki Faktörlü Kimlik Doğrulama (2FA)](../2fa)
- Riskli İşlemler için İkincil Doğrulama – Gelecekte desteklenecektir.

Geliştiriciler, kimlik doğrulamayı eklentileri genişleterek diğer gerekli senaryolara da entegre edebilirler. Bakınız: [Doğrulama Senaryolarını Genişletme](./dev/scene)

**Doğrulama Modülü ve Kullanıcı Kimlik Doğrulama Modülü Arasındaki Farklar ve İlişkiler:** Kullanıcı Kimlik Doğrulama Modülü, esas olarak kullanıcı giriş senaryolarındaki kimlik doğrulamasından sorumludur. SMS ile giriş ve iki faktörlü kimlik doğrulama gibi süreçler, Doğrulama Modülü tarafından sağlanan doğrulayıcılara bağlıdır. Doğrulama Modülü ise çeşitli riskli işlemler için kimlik doğrulamasını yönetir ve kullanıcı girişi de bu riskli işlem senaryolarından biridir.

![](https://static-docs.nocobase.com/202502262315404.png)

![](https://static-docs.nocobase.com/202502262315966.png)