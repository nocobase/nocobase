:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Tablo Bloğu

## Giriş

Tablo bloğu, **NocoBase**'in yerleşik temel veri bloklarından biridir ve esas olarak yapılandırılmış verileri tablo biçiminde görüntülemek ve yönetmek için kullanılır. Esnek yapılandırma seçenekleri sunarak, kullanıcıların tablo sütunlarını, sütun genişliklerini, sıralama kurallarını ve veri kapsamını ihtiyaçlarına göre özelleştirmesine olanak tanır. Bu sayede görüntülenen verilerin belirli iş gereksinimlerini karşılaması sağlanır.

#### Temel Özellikler:
- **Esnek Sütun Yapılandırması**: Tablonun sütunlarını ve sütun genişliklerini farklı veri görüntüleme gereksinimlerine uyacak şekilde özelleştirebilirsiniz.
- **Sıralama Kuralları**: Tablo verilerini sıralamayı destekler. Kullanıcılar, farklı alanlara göre verileri artan veya azalan sırada düzenleyebilirler.
- **Veri Kapsamı Ayarı**: Veri kapsamını ayarlayarak, kullanıcılar görüntülenen veri aralığını kontrol edebilir ve ilgisiz verilerin karışmasını önleyebilirler.
- **İşlem Yapılandırması**: Tablo bloğu, çeşitli yerleşik işlem seçeneklerine sahiptir. Kullanıcılar, verileri hızlı bir şekilde yönetmek için Filtrele, Yeni Ekle, Düzenle ve Sil gibi işlemleri kolayca yapılandırabilirler.
- **Hızlı Düzenleme**: Doğrudan tablo içinde veri düzenlemeyi destekler, böylece işlem sürecini basitleştirir ve iş verimliliğini artırır.

## Blok Ayarları

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### Blok Bağlantı Kuralları

Blok davranışını (örneğin, JavaScript'in görüntülenip görüntülenmeyeceği veya yürütülüp yürütülmeyeceği) bağlantı kuralları aracılığıyla kontrol edin.

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

Daha fazla bilgi için bakınız [Bağlantı Kuralları](/interface-builder/linkage-rule)

### Veri Kapsamını Ayarla

Örnek: Varsayılan olarak, "Durum"u "Ödendi" olan siparişleri filtreleyin.

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

Daha fazla bilgi için bakınız [Veri Kapsamını Ayarla](/interface-builder/blocks/block-settings/data-scope)

### Sıralama Kurallarını Ayarla

Örnek: Siparişleri tarihe göre azalan sırada görüntüleyin.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

Daha fazla bilgi için bakınız [Sıralama Kurallarını Ayarla](/interface-builder/blocks/block-settings/sorting-rule)

### Hızlı Düzenlemeyi Etkinleştir

Hızlı düzenlenebilecek sütunları özelleştirmek için blok ayarlarında ve tablo sütun ayarlarında "Hızlı Düzenlemeyi Etkinleştir" seçeneğini aktif hale getirin.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### Ağaç Tablosunu Etkinleştir

Veri tablosu hiyerarşik (ağaç) bir tablo olduğunda, tablo bloğu "Ağaç Tablosunu Etkinleştir" özelliğini açmayı seçebilir. Varsayılan olarak bu seçenek kapalıdır. Etkinleştirildiğinde, blok verileri bir ağaç yapısında görüntüler ve ilgili yapılandırma seçeneklerini ve işlem fonksiyonlarını destekler.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### Tüm Satırları Varsayılan Olarak Genişlet

Ağaç tablosu etkinleştirildiğinde, blok yüklendiğinde tüm alt satırların varsayılan olarak genişletilmesini destekler.

## Alanları Yapılandır

### Bu Koleksiyonun Alanları

> **Not**: Miras alınan koleksiyonlardaki alanlar (yani üst koleksiyon alanları) otomatik olarak birleştirilir ve mevcut alan listesinde görüntülenir.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### İlişkili Koleksiyonların Alanları

> **Not**: İlişkili koleksiyonlardaki alanların görüntülenmesini destekler (şu anda yalnızca bire bir ilişkileri destekler).

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### Diğer Özel Sütunlar

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [JS Field](/interface-builder/fields/specific/js-field)
- [JS Column](/interface-builder/fields/specific/js-column)

## İşlemleri Yapılandır

### Genel İşlemler

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

- [Filtrele](/interface-builder/actions/types/filter)
- [Yeni Ekle](/interface-builder/actions/types/add-new)
- [Sil](/interface-builder/actions/types/delete)
- [Yenile](/interface-builder/actions/types/refresh)
- [İçe Aktar](/interface-builder/actions/types/import)
- [Dışa Aktar](/interface-builder/actions/types/export)
- [Şablon Yazdırma](/template-print/index)
- [Toplu Güncelleme](/interface-builder/actions/types/bulk-update)
- [Ekleri Dışa Aktar](/interface-builder/actions/types/export-attachments)
- [İş Akışını Tetikle](/interface-builder/actions/types/trigger-workflow)
- [JS Eylemi](/interface-builder/actions/types/js-action)
- [Yapay Zeka Çalışanı](/interface-builder/actions/types/ai-employee)

### Satır İşlemleri

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [Görüntüle](/interface-builder/actions/types/view)
- [Düzenle](/interface-builder/actions/types/edit)
- [Sil](/interface-builder/actions/types/delete)
- [Açılır Pencere](/interface-builder/actions/types/pop-up)
- [Bağlantı](/interface-builder/actions/types/link)
- [Kaydı Güncelle](/interface-builder/actions/types/update-record)
- [Şablon Yazdırma](/template-print/index)
- [İş Akışını Tetikle](/interface-builder/actions/types/trigger-workflow)
- [JS Eylemi](/interface-builder/actions/types/js-action)
- [Yapay Zeka Çalışanı](/interface-builder/actions/types/ai-employee)