:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# İşlem İzinleri

## Giriş

NocoBase 2.0'da işlem izinleri, şu anda temel olarak koleksiyon kaynak izinleri tarafından kontrol edilmektedir:

- **Koleksiyon Kaynak İzni**: Farklı rollerin bir koleksiyon üzerindeki Oluşturma (Create), Görüntüleme (View), Güncelleme (Update) ve Silme (Delete) gibi temel işlem izinlerini tek tip bir şekilde kontrol etmek için kullanılır. Bu izin, veri kaynağı altındaki tüm koleksiyon için geçerlidir ve bir rolün ilgili koleksiyon üzerindeki işlem izinlerinin farklı sayfalarda, açılır pencerelerde ve bloklarda tutarlı kalmasını sağlar.
<!-- - **Bağımsız İşlem İzni**: Farklı rollerin görebileceği işlemleri ayrıntılı bir şekilde kontrol etmek için kullanılır; İş Akışı Tetikleme, Özel İstek, Harici Bağlantı gibi belirli işlemlerin izin yönetimleri için uygundur. Bu tür bir izin, işlem düzeyinde izin kontrolü için uygundur ve farklı rollerin tüm koleksiyonun izin yapılandırmasını etkilemeden belirli işlemleri gerçekleştirmesine olanak tanır. -->

### Koleksiyon Kaynak İzni

NocoBase izin sisteminde, koleksiyon işlem izinleri, izin yönetiminde tutarlılık ve standardizasyon sağlamak amacıyla temel olarak CRUD boyutlarına göre ayrılmıştır. Örneğin:

- **Oluşturma İzni (Create)**: Bu koleksiyonla ilgili tüm oluşturma işlemlerini kontrol eder; buna ekleme ve kopyalama işlemleri de dahildir. Bir rolün bu koleksiyon için oluşturma izni olduğu sürece, ekleme, kopyalama ve diğer oluşturma işlemleri tüm sayfalarda veya açılır pencerelerde görünür olacaktır.
- **Silme İzni (Delete)**: Bu koleksiyonun silme işlemini kontrol eder. İster bir tablo bloğundaki toplu silme işlemi, ister bir detay bloğundaki tek bir kaydın silme işlemi olsun, izin tutarlı kalır.
- **Güncelleme İzni (Update)**: Bu koleksiyonun güncelleme türündeki işlemlerini kontrol eder; örneğin düzenleme ve kayıt güncelleme işlemleri.
- **Görüntüleme İzni (View)**: Bu koleksiyonun veri görünürlüğünü kontrol eder. İlgili veri blokları (Tablo, Liste, Detaylar vb.) yalnızca rolün bu koleksiyon için görüntüleme izni olduğunda görünür olur.

Bu evrensel izin yönetimi yöntemi, standartlaştırılmış veri izin kontrolü için uygundur. `Aynı koleksiyon` üzerindeki `aynı işlem` için `farklı sayfalarda, açılır pencerelerde ve bloklarda` `tutarlı` izin kuralları olmasını sağlayarak tekdüzelik ve sürdürülebilirlik sunar.

#### Genel İzinler

Genel işlem izinleri, veri kaynağı altındaki tüm koleksiyonlar için geçerlidir ve kaynak türüne göre aşağıdaki gibi sınıflandırılmıştır:

![20250306204756](https://static-docs.nocobase.com/20250306204756.png)

#### Belirli Koleksiyon İşlem İzinleri

Belirli koleksiyon işlem izinleri, veri kaynağının genel izinlerinden daha önceliklidir ve işlem izinlerini daha da detaylandırarak belirli bir koleksiyonun kaynak erişimi için özel izin yapılandırmalarına olanak tanır. Bu izinler iki ana başlık altında incelenir:

1. İşlem İzinleri: İşlem izinleri; ekleme, görüntüleme, düzenleme, silme, dışa aktarma ve içe aktarma işlemlerini kapsar. Bu izinler, veri kapsamı boyutuna göre yapılandırılır:

   - Tüm kayıtlar: Kullanıcıların koleksiyondaki tüm kayıtlar üzerinde işlem yapmasına izin verir.
   - Kendi kayıtları: Kullanıcıları yalnızca kendi oluşturdukları veri kayıtları üzerinde işlem yapmaya sınırlar.

2. Alan İzinleri: Alan izinleri, her bir alan için farklı işlemlerde izin yapılandırmasına olanak tanır. Örneğin, bazı alanlar yalnızca görüntülenebilir ancak düzenlenemez olarak yapılandırılabilir.

![20250306205042](https://static-docs.nocobase.com/20250306205042.png)

<!-- ### Bağımsız İşlem İzinleri

> **Not**: Bu özellik **v1.6.0-beta.13 sürümünden itibaren desteklenmektedir**.

Tek tip işlem izinlerinden farklı olarak, bağımsız işlem izinleri yalnızca işlemin kendisini kontrol eder ve aynı işlemin farklı konumlarda farklı izin yapılandırmalarına sahip olmasına olanak tanır.

Bu izin yöntemi, kişiselleştirilmiş işlemler için uygundur, örneğin:

İş akışı tetikleme işlemleri, farklı sayfalarda veya bloklarda farklı iş akışlarını çağırmayı gerektirebilir, bu nedenle bağımsız izin kontrolüne ihtiyaç duyar.
Farklı konumlardaki özel işlemler, belirli iş mantığını yürütür ve ayrı izin yönetimi için uygundur.

Şu anda aşağıdaki işlemler için bağımsız izinler yapılandırılabilir:

- Açılır Pencere (açılır pencere işleminin görünürlüğünü ve işlem izinlerini kontrol eder)
- Bağlantı (bir rolün harici veya dahili bağlantılara erişip erişemeyeceğini kısıtlar)
- İş Akışı Tetikleme (farklı sayfalarda farklı iş akışlarını çağırmak için)
- İşlem panelindeki işlemler (örn. QR kod tarama, açılır pencere işlemi, iş akışı tetikleme, harici bağlantı)
- Özel İstek (üçüncü bir tarafa istek gönderir)

Bağımsız işlem izinleri yapılandırması aracılığıyla, farklı rollerin işlem izinlerini daha ayrıntılı bir şekilde yönetebilir, izin kontrolünü daha esnek hale getirebilirsiniz.

![20250306215749](https://static-docs.nocobase.com/20250306215749.png)

Eğer bir rol ayarlanmazsa, varsayılan olarak tüm roller için görünürdür.

![20250306215854](https://static-docs.nocobase.com/20250306215854.png) -->

## İlgili Belgeler

[İzinleri Yapılandırma]
<!-- (/users-and-permissions) -->