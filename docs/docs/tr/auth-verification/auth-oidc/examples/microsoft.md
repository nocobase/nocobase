:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## NocoBase'e Kimlik Doğrulayıcı Ekleme

Öncelikle NocoBase'e yeni bir kimlik doğrulayıcı eklemelisiniz: Eklenti Ayarları - Kullanıcı Kimlik Doğrulaması - Ekle - OIDC.

Geri arama URL'sini kopyalayın.

![](https://static-docs.nocobase.com/202412021504114.png)

## Uygulamayı Kaydetme

Microsoft Entra yönetim merkezini açın ve yeni bir uygulama kaydedin.

![](https://static-docs.nocobase.com/202412021506837.png)

Az önce kopyaladığınız geri arama URL'sini buraya yapıştırın.

![](https://static-docs.nocobase.com/202412021520696.png)

## İlgili Bilgileri Alma ve Doldurma

Az önce kaydettiğiniz uygulamaya tıklayın ve genel bakış sayfasından **Uygulama (istemci) Kimliği** ile **Dizin (kiracı) Kimliği**'ni kopyalayın.

![](https://static-docs.nocobase.com/202412021522063.png)

`Certificates & secrets` (Sertifikalar ve gizli diziler) seçeneğine tıklayın, yeni bir istemci gizli dizisi oluşturun ve **Değer**'i kopyalayın.

![](https://static-docs.nocobase.com/202412021522846.png)

Yukarıdaki Microsoft Entra bilgileri ile NocoBase kimlik doğrulayıcı yapılandırması arasındaki eşleşme aşağıdaki gibidir:

| Microsoft Entra Bilgisi     | NocoBase Kimlik Doğrulayıcı Alanı                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application (client) ID     | Client ID                                                                                                                                        |
| Client secrets - Value      | Client secret                                                                                                                                    |
| Directory (tenant) ID       | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, burada `{tenant}` kısmını ilgili Directory (tenant) ID ile değiştirmeniz gerekmektedir. |