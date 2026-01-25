---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Kimlik Doğrulama: CAS

## Giriş

Kimlik Doğrulama: CAS eklentisi, CAS (Central Authentication Service) protokol standardına uyarak, kullanıcıların üçüncü taraf kimlik doğrulama hizmeti sağlayıcıları (IdP) tarafından sağlanan hesapları kullanarak NocoBase'e giriş yapmalarını sağlar.

## Kurulum

## Kullanım Kılavuzu

### Eklentiyi Etkinleştirme

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### CAS Kimlik Doğrulama Ekleme

Kullanıcı kimlik doğrulama yönetimi sayfasını ziyaret edin:

http://localhost:13000/admin/settings/auth/authenticators

CAS kimlik doğrulama yöntemini ekleyin:

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

CAS'ı yapılandırın ve etkinleştirin:

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### Giriş Sayfasını Ziyaret Edin

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)