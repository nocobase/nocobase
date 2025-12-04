---
pkg: '@nocobase/plugin-acl'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# İzinleri Yapılandırma

## Genel İzin Ayarları

![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)

### Yapılandırma İzinleri

1.  **Arayüzü yapılandırmaya izin verir**: Bu izin, bir kullanıcının arayüzü yapılandırma yetkisini kontrol eder. Etkinleştirildiğinde, bir kullanıcı arayüzü yapılandırma düğmesi görünür. "admin" rolü için bu izin varsayılan olarak etkindir.
2.  **Eklentileri kurmaya, etkinleştirmeye, devre dışı bırakmaya izin verir**: Bu izin, bir kullanıcının **eklentileri** etkinleştirme veya devre dışı bırakma yetkisini belirler. Etkinleştirildiğinde, kullanıcı **eklenti** yöneticisi arayüzüne erişebilir. "admin" rolü için bu izin varsayılan olarak etkindir.
3.  **Eklentileri yapılandırmaya izin verir**: Bu izin, kullanıcının **eklenti** parametrelerini yapılandırmasına veya **eklenti** arka uç verilerini yönetmesine olanak tanır. "admin" rolü için bu izin varsayılan olarak etkindir.
4.  **Önbelleği temizlemeye, uygulamayı yeniden başlatmaya izin verir**: Bu izin, önbelleği temizleme ve uygulamayı yeniden başlatma gibi sistem bakım görevlerini kontrol eder. Etkinleştirildiğinde, ilgili işlem düğmeleri kişisel merkezde görünür. Bu izin varsayılan olarak devre dışıdır.
5.  **Yeni menü öğelerine varsayılan olarak erişime izin verilir**: Yeni oluşturulan menülere varsayılan olarak erişilebilir ve bu ayar varsayılan olarak etkindir.

### Global İşlem İzinleri

Global işlem izinleri, tüm **koleksiyonlar** için geçerlidir ve işlem türüne göre sınıflandırılır. Bu izinler, veri kapsamı boyutuna göre yapılandırılabilir: tüm veriler veya kullanıcının kendi verileri. Tüm veriler seçeneği, tüm **koleksiyon** üzerinde işlem yapılmasına izin verirken, kendi verileri seçeneği yalnızca kullanıcıyla ilgili veriler üzerinde işlem yapmayı kısıtlar.

## Koleksiyon İşlem İzinleri

![](https://static-docs.nocobase.com/6a6e0281391cecdea5b5218e6173c5d7.png)

![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)

**Koleksiyon** işlem izinleri, global işlem izinlerini daha da detaylandırarak her bir **koleksiyon** içindeki kaynaklara erişim için bireysel izin yapılandırmasına olanak tanır. Bu izinler iki ana başlığa ayrılır:

1.  **İşlem izinleri**: Bunlar; ekleme, görüntüleme, düzenleme, silme, dışa aktarma ve içe aktarma işlemlerini içerir. İzinler, veri kapsamı boyutuna göre ayarlanır:
    -   **Tüm kayıtlar**: Kullanıcının **koleksiyon** içindeki tüm kayıtlar üzerinde işlem yapmasına olanak tanır.
    -   **Kendi kayıtları**: Kullanıcının yalnızca kendi oluşturduğu kayıtlar üzerinde işlem yapmasını kısıtlar.

2.  **Alan İzinleri**: Alan izinleri, farklı işlemler sırasında her bir alan için belirli izinler ayarlamanıza olanak tanır. Örneğin, bazı alanlar yalnızca görüntüleme için yapılandırılabilir ve düzenleme ayrıcalıkları verilmez.

## Menü Erişim İzinleri

Menü erişim izinleri, menü öğelerine göre erişimi kontrol eder.

![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)

## Eklenti Yapılandırma İzinleri

**Eklenti** yapılandırma izinleri, belirli **eklenti** parametrelerini yapılandırma yeteneğini kontrol eder. Etkinleştirildiğinde, yönetim merkezinde ilgili **eklenti** yönetim arayüzü görünür.

![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)