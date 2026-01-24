---
pkg: '@nocobase/plugin-acl'
---

:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# Kullanıcı Arayüzünde Uygulama

## Veri Bloğu İzinleri

Bir **koleksiyondaki** veri bloklarının görünürlüğü, görüntüleme eylemi izinleri tarafından kontrol edilir. Bireysel yapılandırmalar, genel ayarlara göre önceliklidir.

Örneğin, genel izinler altında "admin" rolü tüm yetkilere sahipken, Siparişler **koleksiyonu** için bireysel izinler yapılandırılabilir ve bu da onu görünmez hale getirebilir.

Genel izin yapılandırması:

![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)

Siparişler **koleksiyonu** için bireysel izin yapılandırması:

![](https://static-docs.nocobase.com/a88caba1cad47001c1610bf402a4a2c1.png)

Kullanıcı arayüzünde, Siparişler **koleksiyonundaki** tüm bloklar görüntülenmez.

Tam yapılandırma süreci aşağıdaki gibidir:

![](https://static-docs.nocobase.com/b283c004ffe0b746fddbffcf4f27b1df.gif)

## Alan İzinleri

**Görüntüle**: Belirli alanların alan düzeyinde görünür olup olmadığını belirler. Bu sayede, Siparişler **koleksiyonundaki** hangi alanların belirli rollere görünür olacağını kontrol edebilirsiniz.

![](https://static-docs.nocobase.com/30dea84d984d95039e6f7b180955a6cf.png)

Kullanıcı arayüzünde, Siparişler **koleksiyonu** bloğunda yalnızca yapılandırılmış izinlere sahip alanlar görünür. Sistem alanları (Id, Oluşturulma Tarihi, Son Güncelleme Tarihi) özel bir yapılandırma olmasa bile görüntüleme izinlerini korur.

![](https://static-docs.nocobase.com/40cc49b517efe701147fd2e799e79dcc.png)

- **Düzenle**: Alanların düzenlenip kaydedilebilmesini (güncellenebilmesini) kontrol eder.

  Resimde gösterildiği gibi, Siparişler **koleksiyonu** alanları için düzenleme izinlerini yapılandırın (miktar ve ilişkili ürünler düzenleme iznine sahiptir):

  ![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)

  Kullanıcı arayüzünde, Siparişler **koleksiyonu** içindeki düzenleme eylemi form bloğunda yalnızca düzenleme iznine sahip alanlar gösterilir.

  ![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)

  Tam yapılandırma süreci aşağıdaki gibidir:

  ![](https://static-docs.nocobase.com/1dbe559a9579c2e052e194e50edc74a7.gif)

- **Ekle**: Alanların eklenip (oluşturulup) oluşturulamayacağını belirler.

  Resimde gösterildiği gibi, Siparişler **koleksiyonu** alanları için ekleme izinlerini yapılandırın (sipariş numarası, miktar, ürünler ve sevkiyat ekleme iznine sahiptir).

  ![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)

  Kullanıcı arayüzünde, Siparişler **koleksiyonunun** ekleme eylemi form bloğunda yalnızca ekleme iznine sahip alanlar görüntülenir.

  ![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)

- **Dışa Aktar**: Alanların dışa aktarılıp aktarılamayacağını kontrol eder.
- **İçe Aktar**: Alanların içe aktarmayı destekleyip desteklemediğini kontrol eder.

## Eylem İzinleri

Bireysel olarak yapılandırılmış izinler en yüksek önceliğe sahiptir. Belirli izinler yapılandırılmışsa, bunlar genel ayarları geçersiz kılar; aksi takdirde genel ayarlar uygulanır.

- **Ekle**: Bir blok içinde ekleme eylemi düğmesinin görünür olup olmadığını kontrol eder.

  Resimde gösterildiği gibi, Siparişler **koleksiyonu** için bireysel eylem izinlerini eklemeye izin verecek şekilde yapılandırın:

  ![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)

  Ekleme eylemine izin verildiğinde, kullanıcı arayüzündeki Siparişler **koleksiyonu** bloğunun eylem alanında ekle düğmesi görünür.

  ![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)

- **Görüntüle**: Veri bloğunun görünür olup olmadığını belirler.

  Resimde gösterildiği gibi genel izin yapılandırması (görüntüleme izni yok):

  ![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)

  Siparişler **koleksiyonu** için bireysel izin yapılandırması aşağıdaki gibidir:

  ![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)

  Kullanıcı arayüzünde, diğer tüm **koleksiyonların** veri blokları gizli kalırken, Siparişler **koleksiyonu** bloğu gösterilir.

  Tam örnek yapılandırma süreci aşağıdaki gibidir:

  ![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)

- **Düzenle**: Bir blok içinde düzenleme eylemi düğmesinin görüntülenip görüntülenmediğini kontrol eder.

  ![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)

  Eylem izinleri, veri kapsamı ayarlanarak daha da hassaslaştırılabilir.

  Örneğin, Siparişler **koleksiyonunu** kullanıcıların yalnızca kendi verilerini düzenleyebileceği şekilde ayarlayabilirsiniz:

  ![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)

- **Sil**: Bir blok içinde silme eylemi düğmesinin görünür olup olmadığını kontrol eder.

  ![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)

- **Dışa Aktar**: Bir blok içinde dışa aktarma eylemi düğmesinin görünür olup olmadığını kontrol eder.

- **İçe Aktar**: Bir blok içinde içe aktarma eylemi düğmesinin görünür olup olmadığını kontrol eder.

## İlişki İzinleri

### Alan Olarak

- Bir ilişki alanının izinleri, kaynak **koleksiyonunun** alan izinleri tarafından kontrol edilir. Bu, tüm ilişki alanı bileşeninin görüntülenip görüntülenmediğini belirler.

  Örneğin, Siparişler **koleksiyonunda**, "Müşteri" ilişki alanı yalnızca görüntüleme, içe aktarma ve dışa aktarma izinlerine sahiptir.

  ![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)

  Kullanıcı arayüzünde bu, "Müşteri" ilişki alanının Siparişler **koleksiyonunun** ekleme ve düzenleme eylemi bloklarında görüntülenmeyeceği anlamına gelir.

  Tam örnek yapılandırma süreci aşağıdaki gibidir:

  ![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)

- İlişki alanı bileşeni içindeki (alt tablo veya alt form gibi) alanların izinleri, hedef **koleksiyonun** izinleri tarafından belirlenir.

  İlişki alanı bileşeni bir alt form olduğunda:

  Aşağıda gösterildiği gibi, Siparişler **koleksiyonundaki** "Müşteri" ilişki alanı tüm izinlere sahipken, Müşteriler **koleksiyonu** salt okunur olarak ayarlanmıştır.

  Siparişler **koleksiyonu** için bireysel izin yapılandırması aşağıdaki gibidir; burada "Müşteri" ilişki alanı tüm alan izinlerine sahiptir:

  ![](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)

  Müşteriler **koleksiyonu** için bireysel izin yapılandırması aşağıdaki gibidir; burada alanlar yalnızca görüntüleme izinlerine sahiptir:

  ![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)

  Kullanıcı arayüzünde, "Müşteri" ilişki alanı Siparişler **koleksiyonu** bloğunda görünür. Ancak, bir alt forma geçildiğinde, alt formdaki alanlar detay görünümünde görünürken, ekleme ve düzenleme eylemlerinde görüntülenmez.

  Tam örnek yapılandırma süreci aşağıdaki gibidir:

  ![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)

  Alt formdaki alanlar için izinleri daha da kontrol etmek amacıyla, bireysel alanlara izinler verebilirsiniz.

  Gösterildiği gibi, Müşteriler **koleksiyonu** bireysel alan izinleriyle yapılandırılmıştır (Müşteri Adı görünmez ve düzenlenemez).

  ![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)

  Tam örnek yapılandırma süreci aşağıdaki gibidir:

  ![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)

  İlişki alanı bileşeni bir alt tablo olduğunda, durum alt form ile tutarlıdır:

  Gösterildiği gibi, Siparişler **koleksiyonundaki** "Sevkiyat" ilişki alanı tüm izinlere sahipken, Sevkiyatlar **koleksiyonu** salt okunur olarak ayarlanmıştır.

  Kullanıcı arayüzünde, bu ilişki alanı görünürdür. Ancak, bir alt tabloya geçildiğinde, alt tablodaki alanlar görüntüleme eyleminde görünürken, ekleme ve düzenleme eylemlerinde görünmez.

  ![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)

  Alt tablodaki alanlar için izinleri daha da kontrol etmek amacıyla, bireysel alanlara izinler verebilirsiniz:

  ![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)

### Blok Olarak

- Bir ilişki bloğunun görünürlüğü, ilgili ilişki alanının hedef **koleksiyonunun** izinleri tarafından kontrol edilir ve ilişki alanının izinlerinden bağımsızdır.

  Örneğin, "Müşteri" ilişki bloğunun görüntülenip görüntülenmediği, Müşteriler **koleksiyonunun** izinleri tarafından kontrol edilir.

  ![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)

- Bir ilişki bloğu içindeki alanlar, hedef **koleksiyondaki** alan izinleri tarafından kontrol edilir.

  Gösterildiği gibi, Müşteriler **koleksiyonundaki** bireysel alanlar için görüntüleme izinleri ayarlayabilirsiniz.

  ![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)