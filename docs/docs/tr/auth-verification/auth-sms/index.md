---
pkg: '@nocobase/plugin-auth-sms'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# SMS Kimlik Doğrulama

## Giriş

SMS kimlik doğrulama eklentisi, kullanıcıların SMS ile kaydolmasına ve NocoBase'e giriş yapmasına olanak tanır.

> Bu eklentiyi kullanabilmek için [`@nocobase/plugin-verification` eklentisi](/auth-verification/verification/) tarafından sunulan SMS doğrulama kodu özelliğinden faydalanmanız gerekir.

## SMS Kimlik Doğrulama Ekleme

Kullanıcı kimlik doğrulama eklentisi yönetim sayfasına gidin.

![](https://static-docs.nocobase.com/202502282112517.png)

Ekle - SMS

![](https://static-docs.nocobase.com/202502282113553.png)

## Yeni Sürüm Yapılandırması

:::info{title=Not}
Yeni yapılandırma `1.6.0-alpha.30` sürümünde tanıtıldı ve `1.7.0` sürümünden itibaren kararlı destekle sunulması planlanıyor.
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**Doğrulayıcı:** SMS doğrulama kodları göndermek için bir SMS doğrulayıcı bağlayın. Eğer kullanılabilir bir doğrulayıcı yoksa, öncelikle Doğrulama yönetim sayfasına giderek bir SMS doğrulayıcı oluşturmanız gerekir.
Referanslar:

- [Doğrulama](../verification/index.md)
- [Doğrulama: SMS](../verification/sms/index.md)

**Kullanıcı mevcut değilse otomatik kaydol (Sign up automatically when the user does not exist):** Bu seçenek işaretlendiğinde, kullanıcının telefon numarası sistemde kayıtlı değilse, telefon numarası takma ad olarak kullanılarak yeni bir kullanıcı otomatik olarak kaydedilir.

## Eski Sürüm Yapılandırması

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

SMS giriş kimlik doğrulama özelliği, yapılandırılmış ve varsayılan olarak belirlenmiş SMS doğrulama kodu Sağlayıcısını kullanarak kısa mesajlar gönderir.

**Kullanıcı mevcut değilse otomatik kaydol (Sign up automatically when the user does not exist):** Bu seçenek işaretlendiğinde, kullanıcının telefon numarası sistemde kayıtlı değilse, telefon numarası takma ad olarak kullanılarak yeni bir kullanıcı otomatik olarak kaydedilir.

## Giriş Yapma

Kullanmak için giriş sayfasını ziyaret edin.

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)