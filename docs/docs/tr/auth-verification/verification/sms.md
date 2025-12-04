---
pkg: '@nocobase/plugin-verification'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Doğrulama: SMS

## Giriş

SMS doğrulama kodu, tek kullanımlık dinamik bir parola (OTP) oluşturmak ve bunu kullanıcılara SMS yoluyla göndermek için kullanılan yerleşik bir doğrulama türüdür.

## SMS Doğrulayıcı Ekleme

Doğrulama yönetimi sayfasına gidin.

![](https://static-docs.nocobase.com/202502271726791.png)

Ekle - SMS OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## Yönetici Yapılandırması

![](https://static-docs.nocobase.com/202502271727711.png)

Şu anda desteklenen SMS servis sağlayıcıları şunlardır:

- <a href="https://www.aliyun.com/product/sms" target="_blank">Aliyun SMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">Tencent Cloud SMS</a>

Servis sağlayıcının yönetim panelinde SMS şablonunu yapılandırırken, doğrulama kodu için bir parametre ayırmanız gerekir.

- Aliyun yapılandırma örneği: `Doğrulama kodunuz: ${code}`

- Tencent Cloud yapılandırma örneği: `Doğrulama kodunuz: {1}`

Geliştiriciler, diğer SMS servis sağlayıcıları için de eklenti (plugin) şeklinde destek sağlayabilirler. Bakınız: [SMS Servis Sağlayıcılarını Genişletme](./dev/sms-type)

## Kullanıcı Bağlama

Doğrulayıcıyı ekledikten sonra, kullanıcılar kişisel doğrulama yönetimlerinde bir telefon numarası bağlayabilirler.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

Bağlama işlemi başarılı olduktan sonra, bu doğrulayıcının kullanıldığı herhangi bir doğrulama senaryosunda kimlik doğrulaması yapılabilir.

![](https://static-docs.nocobase.com/202502271739607.png)

## Kullanıcı Bağlantısını Kaldırma

Bir telefon numarasının bağlantısını kaldırmak için, mevcut bağlı doğrulama yöntemiyle doğrulama yapılması gerekir.

![](https://static-docs.nocobase.com/202502282103205.png)