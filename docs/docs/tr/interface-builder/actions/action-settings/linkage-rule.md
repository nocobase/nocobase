:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Eylem Bağlantı Kuralları

## Giriş

Eylem bağlantı kuralları, kullanıcıların belirli koşullara göre bir eylemin durumunu (gösterme, etkinleştirme, gizleme, devre dışı bırakma gibi) dinamik olarak kontrol etmelerini sağlar. Bu kuralları yapılandırarak, kullanıcılar eylem düğmelerinin davranışını mevcut kayıt, kullanıcı rolü veya bağlamsal verilerle ilişkilendirebilirler.

![20251029150224](https://static-docs.nocobase.com/20251029150224.png)

## Nasıl Kullanılır

Koşul karşılandığında (koşul belirtilmezse varsayılan olarak geçer), özellik ayarlarının veya JavaScript'in yürütülmesi tetiklenir. Koşul değerlendirmesinde sabitler ve değişkenler desteklenir.

![20251030224601](https://static-docs.nocobase.com/20251030224601.png)

Bu kural, düğme özelliklerini değiştirmeye olanak tanır.

![20251029150452](https://static-docs.nocobase.com/20251029150452.png)

## Sabitler

Örnek: Ödenmiş siparişler düzenlenemez.

![20251029150638](https://static-docs.nocobase.com/20251029150638.png)

## Değişkenler

### Sistem Değişkenleri

![20251029150014](https://static-docs.nocobase.com/20251029150014.png)

Örnek 1: Mevcut cihaz türüne göre bir düğmenin görünürlüğünü kontrol etme.

![20251029151057](https://static-docs.nocobase.com/20251029151057.png)

Örnek 2: Siparişler bloğu tablosunun başlığındaki toplu güncelleme düğmesi yalnızca Yönetici rolü tarafından kullanılabilir; diğer roller bu eylemi gerçekleştiremez.

![20251029151209](https://static-docs.nocobase.com/20251029151209.png)

### Bağlamsal Değişkenler

Örnek: Sipariş fırsatları (ilişki bloğu) üzerindeki Ekle düğmesi, yalnızca sipariş durumu "Ödeme Bekliyor" veya "Taslak" olduğunda etkinleştirilir. Diğer durumlarda düğme devre dışı bırakılır.

![20251029151520](https://static-docs.nocobase.com/20251029151520.png)

![20251029152200](https://static-docs.nocobase.com/20251029152200.png)

Değişkenler hakkında daha fazla bilgi için [Değişkenler](/interface-builder/variables) bölümüne bakın.