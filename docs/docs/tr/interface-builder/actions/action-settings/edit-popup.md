:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Modal Düzenleme

## Giriş

Tıklanarak bir modal penceresi açan herhangi bir işlem veya alan, modalın açılış şeklini, boyutunu ve diğer ayarlarını yapılandırmanıza olanak tanır.

![20251027212617](https://static-docs.nocobase.com/20251027212617.png)

![20251027212800](https://static-docs.nocobase.com/20251027212800.png)

## Açılış Şekli

- Çekmece

![20251027212832](https://static-docs.nocobase.com/20251027212832.png)

- Diyalog Kutusu

![20251027212905](https://static-docs.nocobase.com/20251027212905.png)

- Alt Sayfa

![20251027212940](https://static-docs.nocobase.com/20251027212940.png)

## Modal Boyutu

- Büyük
- Orta (varsayılan)
- Küçük

## Modal UID'si

“Modal UID'si”, modalı açan bileşenin UID'sidir; aynı zamanda URL'deki `view/:viewUid` kısmındaki `viewUid` bölümüne de karşılık gelir. Bu UID'yi, modalı tetikleyen alanın veya düğmenin ayarlar menüsünden “Modal UID'sini Kopyala” seçeneğine tıklayarak hızlıca edinebilirsiniz. Modal UID'sini ayarlayarak modalın yeniden kullanılmasını sağlayabilirsiniz.

![popup-copy-uid-20251102](https://static-docs.nocobase.com/popup-copy-uid-20251102.png)

### Dahili Modal (varsayılan)
- “Modal UID'si”, mevcut işlem düğmesinin UID'sine eşittir (varsayılan olarak bu düğmenin UID'si kullanılır).

### Harici Modal (modal yeniden kullanımı)
- Başka bir konumdaki tetikleyici düğmenin UID'sini (yani modal UID'sini) “Modal UID'si” alanına girerek o modalı başka bir yerde yeniden kullanabilirsiniz.
- Tipik kullanım: Birden fazla sayfa/blok arasında aynı modal arayüzünü ve mantığını paylaşarak tekrarlayan yapılandırmalardan kaçınmak.
- Harici modal kullanıldığında, bazı yapılandırmalar değiştirilemez hale gelir (aşağıya bakınız).

## Diğer İlgili Yapılandırmalar

- `veri kaynağı / koleksiyon`: Salt okunurdur. Modalın bağlı olduğu veri kaynağını ve koleksiyonu belirtir; varsayılan olarak mevcut bloğun koleksiyonunu kullanır. Harici modal modunda, hedef modalın yapılandırmasını devralır ve bu ayar değiştirilemez.
- `Association name`: İsteğe bağlıdır. Modalı bir “ilişkilendirme alanı” üzerinden açmak için kullanılır; yalnızca varsayılan bir değer mevcut olduğunda gösterilir. Harici modal modunda, hedef modalın yapılandırmasını devralır ve bu ayar değiştirilemez.
- `Source ID`: Yalnızca `Association name` ayarlandığında görünür; varsayılan olarak mevcut bağlamın `sourceId` değerini kullanır; ihtiyaca göre bir değişken veya sabit bir değer olarak değiştirilebilir.
- `filterByTk`: Boş bırakılabilir, isteğe bağlı bir değişken veya sabit bir değer olabilir; modalın yükleyeceği veri kayıtlarını sınırlamak için kullanılır.

![popup-config-20251102](https://static-docs.nocobase.com/popup-config-20251102.png)