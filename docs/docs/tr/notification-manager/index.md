---
pkg: '@nocobase/plugin-notification-manager'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Bildirim Yönetimi

## Giriş

Bildirim Yönetimi, birden fazla bildirim kanalını bir araya getiren merkezi bir hizmettir. Kanalların yapılandırılması, gönderimlerin yönetimi ve günlük kaydı için tek bir arayüz sağlar ve esnek bir şekilde yeni kanallarla genişletilebilir.

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- **Mor kısım**: Bildirim Yönetimi, kanal yapılandırması ve günlük kaydı gibi özellikleri içeren kapsamlı bir hizmet sunar. Bildirim kanalları genişletilebilir.
- **Yeşil kısım**: Uygulama İçi Mesajlar (In-App Message), kullanıcıların doğrudan uygulama içinde bildirim almasını sağlayan yerleşik bir kanaldır.
- **Kırmızı kısım**: E-posta (Email), kullanıcıların e-posta yoluyla bildirim almasını sağlayan genişletilebilir bir kanaldır.

## Kanal Yönetimi

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

Şu anda desteklenen kanallar:

- [Uygulama İçi Mesajlar](/notification-manager/notification-in-app-message)
- [E-posta](/notification-manager/notification-email) (yerleşik SMTP aktarım yöntemi kullanır)

Daha fazla kanal bildirimini de genişletebilirsiniz. Bunun için [Kanal Genişletme](/notification-manager/development/extension) belgesine başvurabilirsiniz.

## Bildirim Günlükleri

Sistem, her bildirimin gönderim detaylarını ve durumunu ayrıntılı olarak kaydeder. Bu sayede analiz ve sorun giderme işlemleri kolaylaşır.

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## İş Akışı Bildirim Düğümü

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)