:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Alan Bağlantı Kuralları

## Giriş

Alan bağlantı kuralları, kullanıcı eylemlerine göre Form/Detay bloklarındaki alanların durumunu dinamik olarak ayarlamanıza olanak tanır. Şu anda alan bağlantı kurallarını destekleyen bloklar şunlardır:

- [Form Bloğu](/interface-builder/blocks/data-blocks/form)
- [Detay Bloğu](/interface-builder/blocks/data-blocks/details)
- [Alt Form](/interface-builder/fields/specific/sub-form)

## Kullanım Talimatları

### **Form Bloğu**

Bir Form bloğunda, bağlantı kuralları belirli koşullara göre alanların davranışını dinamik olarak ayarlayabilir:

- **Alan görünürlüğünü kontrol etme (göster/gizle)**: Mevcut alanın diğer alanların değerlerine göre gösterilip gösterilmeyeceğine karar verin.
- **Alanı zorunlu olarak ayarlama**: Belirli koşullar altında bir alanı dinamik olarak zorunlu veya isteğe bağlı olarak ayarlayın.
- **Değer atama**: Koşullara göre bir alana otomatik olarak değer atayın.
- **Belirtilen JavaScript'i yürütme**: İş gereksinimlerine göre JavaScript yazın.

### **Detay Bloğu**

Bir Detay bloğunda, bağlantı kuralları esas olarak bloktaki alanların görünürlüğünü (göster/gizle) dinamik olarak kontrol etmek için kullanılır.

![20251029114859](https://static-docs.nocobase.com/20251029114859.png)

## Özellik Bağlantısı

### Değer Atama

Örnek: Bir sipariş ek sipariş olarak işaretlendiğinde, sipariş durumu otomatik olarak "İncelemede Bekliyor" olarak atanır.

![20251029115348](https://static-docs.nocobase.com/20251029115348.png)

### Zorunlu

Örnek: Sipariş durumu "Ödendi" olduğunda, sipariş tutarı alanı zorunlu olur.

![20251029115031](https://static-docs.nocobase.com/20251029115031.png)

### Göster/Gizle

Örnek: Ödeme hesabı ve toplam tutar yalnızca sipariş durumu "Ödeme Bekliyor" olduğunda görüntülenir.

![20251030223710](https://static-docs.nocobase.com/20251030223710.png)

![20251030223801](https://static-docs.nocobase.com/20251030223801.gif)