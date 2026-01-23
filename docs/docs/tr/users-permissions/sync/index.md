---
pkg: '@nocobase/plugin-user-data-sync'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Kullanıcı Verisi Senkronizasyonu

## Giriş

Bu özellik, kullanıcı verisi senkronizasyon kaynaklarını kaydetmenize ve yönetmenize olanak tanır. Varsayılan olarak bir HTTP API'si sunulur, ancak eklentiler aracılığıyla başka veri kaynakları da desteklenebilir. Varsayılan olarak **Kullanıcılar** ve **Departmanlar** koleksiyonlarına veri eşitlemeyi destekler; eklentiler kullanarak senkronizasyonu diğer hedef kaynaklara da genişletebilirsiniz.

## Veri Kaynağı Yönetimi ve Senkronizasyonu

![](https://static-docs.nocobase.com/202412041043465.png)

:::info
Kullanıcı verisi senkronizasyon kaynakları sağlayan hiçbir eklenti kurulu değilse, kullanıcı verilerini HTTP API'sini kullanarak senkronize edebilirsiniz. [Veri Kaynağı - HTTP API](./sources/api.md) bölümüne bakın.
:::

## Veri Kaynağı Ekleme

Kullanıcı verisi senkronizasyon kaynağı sağlayan bir eklenti kurduktan sonra, ilgili veri kaynağını ekleyebilirsiniz. Yalnızca etkinleştirilmiş veri kaynakları "Senkronize Et" ve "Görev" düğmelerini gösterecektir.

> Örnek: WeCom

![](https://static-docs.nocobase.com/202412041053785.png)

## Veri Senkronizasyonu

Veri senkronizasyonunu başlatmak için "Senkronize Et" düğmesine tıklayın.

![](https://static-docs.nocobase.com/202412041055022.png)

Senkronizasyon durumunu görüntülemek için "Görev" düğmesine tıklayın. Başarılı bir senkronizasyonun ardından verileri Kullanıcılar ve Departmanlar listelerinde görüntüleyebilirsiniz.

![](https://static-docs.nocobase.com/202412041202337.png)

Başarısız senkronizasyon görevleri için "Yeniden Dene" düğmesine tıklayabilirsiniz.

![](https://static-docs.nocobase.com/202412041058337.png)

Senkronizasyon hataları durumunda, sorunu sistem günlükleri aracılığıyla giderebilirsiniz. Ayrıca, ham senkronizasyon kayıtları uygulama günlükleri klasörünün altındaki `user-data-sync` dizininde saklanır.

![](https://static-docs.nocobase.com/202412041205655.png)