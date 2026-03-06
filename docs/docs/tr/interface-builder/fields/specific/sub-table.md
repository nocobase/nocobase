:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/interface-builder/fields/specific/sub-table) bakın.
:::

# Alt Tablo (Satır İçi Düzenleme)

## Giriş

Alt tablo, çoklu ilişki alanlarını yönetmek için idealdir. Hedef koleksiyonda yeni verileri toplu olarak oluşturup ilişkilendirmeyi veya mevcut verilerden seçip ilişkilendirmeyi destekler.

## Kullanım Talimatları

![20251027223350](https://static-docs.nocobase.com/20251027223350.png)

Alt tablodaki farklı türdeki alanlar, farklı alan bileşenleri gösterir. Büyük alanlar (Rich Text, JSON, Long Text gibi) ise açılır bir pencere aracılığıyla düzenlenir.

![20251027223426](https://static-docs.nocobase.com/20251027223426.png)

Alt tablodaki ilişki alanları.

Siparişler (One-to-Many) > Order Products (One-to-One) > Opportunity

![20251027223530](https://static-docs.nocobase.com/20251027223530.png)

İlişki alanı bileşeni varsayılan olarak bir Single select bileşenidir (Single select/Collection selector destekler).

![20251027223754](https://static-docs.nocobase.com/20251027223754.png)

## Alan Yapılandırma Seçenekleri

### Mevcut Verileri Seçmeye İzin Ver (varsayılan olarak etkindir)

Mevcut verileri seçip ilişkilendirmeyi destekler.
![20251027224008](https://static-docs.nocobase.com/20251027224008.png)

![20251027224023](https://static-docs.nocobase.com/20251027224023.gif)

### Alan Bileşeni

[Alan Bileşeni](/interface-builder/fields/association-field): Single select, Collection selector gibi diğer ilişki alanı bileşenlerine geçiş yapın;

### Mevcut Verilerin İlişiğini Kesmeye İzin Ver

> Düzenleme formundaki ilişki alanı verileri için mevcut verilerin ilişiğinin kesilmesine izin verilip verilmeyeceği.

![20251028153425](https://static-docs.nocobase.com/20251028153425.gif)