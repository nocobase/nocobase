---
pkg: '@nocobase/plugin-audit-logger'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Denetim Günlüğü

## Giriş

Denetim günlüğü, sistem içindeki kullanıcı etkinliklerini ve kaynak işlem geçmişini kaydetmek ve izlemek için kullanılır.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

## Parametre Açıklamaları

| Parametre                   | Açıklama                                                                                                                               |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| **Resource**                | İşlemin hedef kaynak türü                                                                                                              |
| **Action**                  | Gerçekleştirilen işlem türü                                                                                                            |
| **User**                    | İşlemi gerçekleştiren kullanıcı                                                                                                        |
| **Role**                    | Kullanıcının işlem sırasındaki rolü                                                                                                    |
| **Data source**             | veri kaynağı                                                                                                                           |
| **Target collection**       | Hedef koleksiyon                                                                                                                       |
| **Target record UK**        | Hedef koleksiyonun benzersiz tanımlayıcısı                                                                                             |
| **Source collection**       | İlişki alanının kaynak koleksiyonu                                                                                                     |
| **Source record UK**        | Kaynak koleksiyonun benzersiz tanımlayıcısı                                                                                            |
| **Status**                  | İşlem isteği yanıtının HTTP durum kodu                                                                                                 |
| **Created at**              | İşlem zamanı                                                                                                                           |
| **UUID**                    | İşlemin benzersiz tanımlayıcısı, işlem isteğinin İstek Kimliği (Request ID) ile tutarlıdır ve uygulama günlüklerini almak için kullanılabilir. |
| **IP**                      | Kullanıcının IP adresi                                                                                                                 |
| **UA**                      | Kullanıcının UA bilgisi                                                                                                                |
| **Metadata**                | İşlem isteğinin parametreleri, istek gövdesi ve yanıt içeriği gibi meta veriler                                                        |

## Denetlenen Kaynak Açıklamaları

Şu anda, aşağıdaki kaynak işlemleri denetim günlüğüne kaydedilecektir:

### Ana Uygulama

| İşlem            | Açıklama                   |
| :--------------- | :------------------------- |
| `app:resart`     | Uygulama yeniden başlatma  |
| `app:clearCache` | Uygulama önbelleğini temizleme |

### Eklenti Yöneticisi

| İşlem        | Açıklama            |
| :----------- | :------------------ |
| `pm:add`     | eklenti ekle        |
| `pm:update`  | eklenti güncelle    |
| `pm:enable`  | eklenti etkinleştir |
| `pm:disable` | eklenti devre dışı bırak |
| `pm:remove`  | eklenti kaldır      |

### Kullanıcı Kimlik Doğrulaması

| İşlem                 | Açıklama      |
| :-------------------- | :------------ |
| `auth:signIn`         | Giriş yap     |
| `auth:signUp`         | Kaydol        |
| `auth:signOut`        | Çıkış yap     |
| `auth:changePassword` | Şifre değiştir |

### Kullanıcı

| İşlem                 | Açıklama      |
| :-------------------- | :------------ |
| `users:updateProfile` | Profil güncelle |

### UI Yapılandırması

| İşlem                      | Açıklama         |
| :------------------------- | :--------------- |
| `uiSchemas:insertAdjacent` | UI Şeması ekle   |
| `uiSchemas:patch`          | UI Şeması değiştir |
| `uiSchemas:remove`         | UI Şeması kaldır |

### Koleksiyon İşlemleri

| İşlem            | Açıklama                  |
| :--------------- | :------------------------ |
| `create`         | Kayıt oluştur             |
| `update`         | Kayıt güncelle            |
| `destroy`        | Kayıt sil                 |
| `updateOrCreate` | Kayıt güncelle veya oluştur |
| `firstOrCreate`  | Kayıt sorgula veya oluştur |
| `move`           | Kayıt taşı                |
| `set`            | İlişki alanı kaydını ayarla |
| `add`            | İlişki alanı kaydı ekle   |
| `remove`         | İlişki alanı kaydını kaldır |
| `export`         | Kayıt dışa aktar          |
| `import`         | Kayıt içe aktar           |

## Diğer Denetim Kaynaklarını Ekleme

Eklentiler aracılığıyla başka kaynak işlemleri eklediyseniz ve bu kaynak işlem davranışlarını denetim günlüğüne kaydetmek istiyorsanız, lütfen [API](/api/server/audit-manager.md) bölümüne bakın.