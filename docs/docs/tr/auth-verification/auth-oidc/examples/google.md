:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Google ile Oturum Açma

> https://developers.google.com/identity/openid-connect/openid-connect

## Google OAuth 2.0 Kimlik Bilgilerini Edinin

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) - Kimlik Bilgileri Oluştur - OAuth İstemci Kimliği

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

Yapılandırma arayüzüne gidin ve yetkilendirilmiş yönlendirme URL'sini doldurun. Yönlendirme URL'si, NocoBase'de bir kimlik doğrulayıcı eklerken alınabilir; genellikle `http(s)://host:port/api/oidc:redirect` şeklindedir. Bkz. [Kullanım Kılavuzu - Yapılandırma](../index.md#configuration) bölümü.

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## NocoBase Üzerinde Yeni Bir Kimlik Doğrulayıcı Ekleyin

Eklenti Ayarları - Kullanıcı Kimlik Doğrulaması - Ekle - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Kimlik doğrulayıcı yapılandırmasını tamamlamak için [Kullanım Kılavuzu - Yapılandırma](../index.md#configuration) bölümünde tanıtılan parametrelere başvurun.