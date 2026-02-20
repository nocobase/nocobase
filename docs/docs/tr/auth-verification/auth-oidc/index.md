---
pkg: '@nocobase/plugin-auth-oidc'
---

:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# Kimlik Doğrulama: OIDC

## Giriş

Kimlik Doğrulama: OIDC eklentisi, OIDC (Open ConnectID) protokol standardına uyar ve Yetkilendirme Kodu Akışı'nı (Authorization Code Flow) kullanarak kullanıcıların üçüncü taraf kimlik doğrulama hizmet sağlayıcıları (IdP) tarafından sağlanan hesapları kullanarak NocoBase'e giriş yapmasını sağlar.

## Eklentiyi Etkinleştirme

![](https://static-docs.nocobase.com/202411122358790.png)

## OIDC Kimlik Doğrulama Ekleme

Kullanıcı kimlik doğrulama eklentisi yönetim sayfasına gidin.

![](https://static-docs.nocobase.com/202411130004459.png)

Ekle - OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## Yapılandırma

### Temel Yapılandırma

![](https://static-docs.nocobase.com/202411130006341.png)

| Konfigürasyon                                      | Açıklama                                                                                                                                                                | Sürüm          |
| :------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| Sign up automatically when the user does not exist | Eşleşen mevcut bir kullanıcı bulunamadığında otomatik olarak yeni bir kullanıcı oluşturulup oluşturulmayacağı.                                                              | -              |
| Issuer                                             | IdP tarafından sağlanır, genellikle `/.well-known/openid-configuration` ile biter.                                                                                          | -              |
| Client ID                                          | İstemci Kimliği                                                                                                                                                             | -              |
| Client Secret                                      | İstemci Gizli Anahtarı                                                                                                                                                      | -              |
| scope                                              | İsteğe bağlıdır, varsayılan olarak `openid email profile` değerindedir.                                                                                                     | -              |
| id_token signed response algorithm                 | `id_token` için imzalama algoritması, varsayılan olarak `RS256` değerindedir.                                                                                               | -              |
| Enable RP-initiated logout                         | RP-initiated logout'u etkinleştirir. Kullanıcı oturumu kapattığında IdP oturumunu da kapatır. IdP oturum kapatma geri çağrısı için [Kullanım](#kullanım) bölümünde belirtilen Post logout redirect URL'ini kullanın. | `v1.3.44-beta` |

### Alan Eşleme

![](https://static-docs.nocobase.com/92d3c8f6f4082b50d9f475674cb5650.png)

| Konfigürasyon                   | Açıklama                                                                                                                                                      |
| :------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field Map                       | Alan eşleme. NocoBase şu anda takma ad, e-posta ve telefon numarası gibi alanları eşlemeyi destekler. Varsayılan takma ad `openid` kullanır.                     |
| Use this field to bind the user | Mevcut kullanıcılarla eşleştirmek ve bağlamak için kullanılır. E-posta veya kullanıcı adı seçilebilir, varsayılan olarak e-postadır. IdP'nin `email` veya `username` alanlarını içeren kullanıcı bilgilerini sağlaması gerekir. |

### Gelişmiş Yapılandırma

![](https://static-docs.nocobase.com/202411130013306.png)

| Konfigürasyon                                                     | Açıklama                                                                                                                                                                                                                                                         | Sürüm          |
| :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| HTTP                                                              | NocoBase geri çağrı URL'sinin HTTP protokolünü kullanıp kullanmayacağı, varsayılan `https`'dir.                                                                                                                                                                       | -              |
| Port                                                              | NocoBase geri çağrı URL'si için port, varsayılan `443/80`'dir.                                                                                                                                                                                                           | -              |
| State token                                                       | İstek kaynağını doğrulamak ve CSRF saldırılarını önlemek için kullanılır. Sabit bir değer girebilirsiniz, ancak **boş bırakmanız şiddetle tavsiye edilir, bu durumda varsayılan olarak rastgele bir değer oluşturulur. Sabit bir değer kullanmak isterseniz, lütfen kullanım ortamınızı ve güvenlik risklerini dikkatlice değerlendirin.** | -              |
| Pass parameters in the authorization code grant exchange          | Bir kodu bir token ile değiştirirken, bazı IdP'ler İstemci Kimliği veya İstemci Gizli Anahtarı'nın parametre olarak geçirilmesini isteyebilir. Bu seçeneği işaretleyebilir ve ilgili parametre adlarını belirtebilirsiniz.                                                               | -              |
| Method to call the user info endpoint                             | Kullanıcı bilgileri API'sini çağırırken kullanılan HTTP yöntemi.                                                                                                                                                                                                             | -              |
| Where to put the access token when calling the user info endpoint | Kullanıcı bilgileri API'sini çağırırken erişim token'ının nasıl iletileceği:<br/>- Header - İstek başlığında (varsayılan).<br />- Body - İstek gövdesinde, `POST` yöntemiyle kullanılır.<br />- Query parameters - Sorgu parametreleri olarak, `GET` yöntemiyle kullanılır.                   | -              |
| Skip SSL verification                                             | IdP API'sine istek gönderirken SSL doğrulamasını atlar. **Bu seçenek sisteminizi ortadaki adam saldırısı risklerine maruz bırakır. Bu seçeneğin amacını ve sonuçlarını açıkça anladığınızda etkinleştirin. Üretim ortamlarında kullanılması kesinlikle önerilmez.**        | `v1.3.40-beta` |

### Kullanım

![](https://static-docs.nocobase.com/202411130019570.png)

| Konfigürasyon            | Açıklama                                                                                    |
| :----------------------- | :---------------------------------------------------------------------------------------------- |
| Redirect URL             | IdP'deki geri çağrı URL'sini yapılandırmak için kullanılır.                                                 |
| Post logout redirect URL | RP-initiated logout etkinleştirildiğinde IdP'deki Post logout redirect URL'sini yapılandırmak için kullanılır. |

:::info
Yerel test yaparken, URL için `localhost` yerine `127.0.0.1` kullanın, çünkü OIDC giriş yöntemi güvenlik doğrulaması için istemci çerezine (cookie) bir `state` yazılmasını gerektirir. Giriş sırasında pencere bir anlığına görünüp kayboluyor ancak başarılı bir şekilde giriş yapılamıyorsa, sunucu günlüklerinde `state` uyuşmazlığı olup olmadığını ve istek çerezinde `state` parametresinin bulunup bulunmadığını kontrol edin. Bu durum genellikle istemci çerezindeki `state` ile istekte taşınan `state`'in eşleşmemesinden kaynaklanır.
:::

## Giriş Yapma

Giriş sayfasını ziyaret edin ve üçüncü taraf girişi başlatmak için giriş formunun altındaki düğmeye tıklayın.

![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)