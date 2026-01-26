---
pkg: "@nocobase/plugin-ai"
deprecated: true
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Gelişmiş

## Giriş

AI Çalışanı eklentisinde, veri kaynaklarını yapılandırabilir ve bazı koleksiyon sorgularını önceden ayarlayabilirsiniz. Bu sorgular, AI çalışanıyla sohbet ederken uygulama bağlamı olarak gönderilir ve AI çalışanı, koleksiyon sorgu sonuçlarına göre yanıt verir.

## Veri Kaynağı Yapılandırması

AI Çalışanı eklentisi yapılandırma sayfasına gidin, `veri kaynağı` sekmesine tıklayarak AI çalışanı veri kaynağı yönetim sayfasına erişin.

![20251022103526](https://static-docs.nocobase.com/20251022103526.png)

`veri kaynağı ekle` düğmesine tıklayarak veri kaynağı oluşturma sayfasına gidin.

Birinci adım: Temel `koleksiyon` bilgilerini girin:
- `Başlık` giriş kutusuna, veri kaynağı için akılda kalıcı bir ad girin;
- `koleksiyon` giriş kutusunda, kullanılacak veri kaynağını ve koleksiyonu seçin;
- `Açıklama` giriş kutusuna, veri kaynağının açıklamasını girin.
- `Limit` giriş kutusuna, AI sohbet bağlamını aşan çok fazla veri dönmesini önlemek için veri kaynağı için sorgu sınırını girin.

![20251022103935](https://static-docs.nocobase.com/20251022103935.png)

İkinci adım: Sorgulanacak alanları seçin:

`Alanlar` listesinde, sorgulamak istediğiniz alanları işaretleyin.

![20251022104516](https://static-docs.nocobase.com/20251022104516.png)

Üçüncü adım: Sorgu koşullarını ayarlayın:

![20251022104635](https://static-docs.nocobase.com/20251022104635.png)

Dördüncü adım: Sıralama koşullarını ayarlayın:

![20251022104722](https://static-docs.nocobase.com/20251022104722.png)

Son olarak, veri kaynağını kaydetmeden önce veri kaynağı sorgu sonuçlarını önizleyebilirsiniz.

![20251022105012](https://static-docs.nocobase.com/20251022105012.png)

## Sohbetlerde Veri Kaynaklarını Gönderme

AI çalışanı iletişim kutusunda, sol alt köşedeki `iş bağlamı ekle` düğmesine tıklayın, `veri kaynağı`nı seçin; böylece az önce eklediğiniz veri kaynağını göreceksiniz.

![20251022105240](https://static-docs.nocobase.com/20251022105240.png)

Göndermek istediğiniz veri kaynağını işaretleyin; seçilen veri kaynağı iletişim kutusuna eklenecektir.

![20251022105401](https://static-docs.nocobase.com/20251022105401.png)

Sorunuzu girdikten sonra, normal bir mesaj gönderir gibi gönder düğmesine tıklayın; AI çalışanı veri kaynağına göre yanıt verecektir.

Veri kaynağı, mesaj listesinde de görünecektir.

![20251022105611](https://static-docs.nocobase.com/20251022105611.png)

## Notlar

Veri kaynağı, mevcut kullanıcının ACL izinlerine göre verileri otomatik olarak filtreleyerek, yalnızca kullanıcının erişim izni olan verileri gösterecektir.