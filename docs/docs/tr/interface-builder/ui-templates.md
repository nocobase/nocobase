---
pkg: "@nocobase/plugin-ui-templates"
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/interface-builder/ui-templates) bakın.
:::

# UI Şablonları

## Giriş

Arayüz şablonları, arayüz oluşturma sürecindeki yapılandırmaları yeniden kullanmak, tekrarlanan kurulumları azaltmak ve gerektiğinde birden fazla yerdeki yapılandırmayı senkronize tutmak için kullanılır.

Şu anda desteklenen şablon türleri şunlardır:

- **Blok Şablonu**: Tüm blok yapılandırmasını yeniden kullanır.
- **Alan Şablonu**: Form/Detay bloklarındaki "alan bölgesi" yapılandırmasını yeniden kullanır.
- **Açılır Pencere Şablonu**: İşlemler veya alanlar tarafından tetiklenen açılır pencere yapılandırmalarını yeniden kullanır.

## Temel Kavramlar

### Referans ve Kopyalama

Şablonları kullanırken genellikle iki yöntem vardır:

- `Referans`: Birden fazla yer aynı şablon yapılandırmasını paylaşır; şablonu veya herhangi bir referans noktasını değiştirdiğinizde, diğer tüm referans noktaları eş zamanlı olarak güncellenir.
- `Kopyala`: Bağımsız bir yapılandırma olarak kopyalanır; sonrasındaki değişiklikler birbirini etkilemez.

### Şablon Olarak Kaydet

Bir blok veya açılır pencere yapılandırıldığında, ayarlar menüsündeki `Şablon olarak kaydet` seçeneğini kullanabilir ve kayıt yöntemini seçebilirsiniz:

- `Mevcut olanı şablona dönüştür`: Kaydettikten sonra, mevcut konum bu şablona referans verecek şekilde değişir.
- `Mevcut olanı şablon olarak kopyala`: Sadece şablonu oluşturur, mevcut konum değişmeden kalır.

## Blok Şablonu

### Bloğu Şablon Olarak Kaydetme

1) Hedef bloğun ayarlar menüsünü açın ve `Şablon olarak kaydet` seçeneğine tıklayın.  
2) `Şablon adı` / `Şablon açıklaması` alanlarını doldurun ve kayıt modunu seçin:
   - `Mevcut bloğu şablona dönüştür`: Kaydettikten sonra, mevcut konum bir `Blok şablonu` bloğu ile değiştirilir (yani o şablona referans verilir).
   - `Mevcut bloğu şablon olarak kopyala`: Sadece şablon oluşturulur, mevcut blok değişmeden kalır.

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

### Blok Şablonu Kullanma

1) Blok ekle → "Diğer bloklar" → `Blok Şablonu` yolunu izleyin.  
2) Yapılandırmada şunları seçin:
   - `Şablon`: Bir şablon seçin.
   - `Mod`: `Referans` veya `Kopyala`.

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### Referansı Kopyaya Dönüştürme

Bir blok bir şablona referans veriyorsa, blok ayarları menüsündeki `Referansı kopyaya dönüştür` seçeneğini kullanarak mevcut bloğu normal bir bloğa dönüştürebilirsiniz (referans bağlantısını keser). Sonraki değişiklikler birbirini etkilemez.

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

### Dikkat Edilmesi Gerekenler

- `Kopyala` modu, blok ve alt düğümleri için UID'leri yeniden oluşturur; UID'lere bağlı bazı yapılandırmaların yeniden ayarlanması gerekebilir.

## Alan Şablonu

Alan şablonları, birden fazla sayfa veya blokta tekrar tekrar alan eklemekten kaçınmak için **form bloklarında** ve **detay bloklarında** alan bölgesi yapılandırmalarını (alan seçimi, düzen ve alan ayarları) yeniden kullanmak için kullanılır.

> Alan şablonları yalnızca "alan bölgesini" etkiler, tüm bloğu değiştirmez. Tüm bloğu yeniden kullanmak istiyorsanız, lütfen yukarıda açıklanan Blok Şablonunu kullanın.

### Form/Detay Bloklarında Alan Şablonu Kullanma

1) Yapılandırma moduna girin, bir form veya detay bloğunda "Alanlar" menüsünü açın.  
2) `Alan Şablonu` seçeneğini belirleyin.  
3) Bir şablon seçin ve modu belirleyin: `Referans` veya `Kopyala`.

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

![use-field-template-config-20251228](https://static-docs.nocobase.com/use-field-template-config-20251228.png)

#### Üzerine Yazma Uyarısı

Blokta zaten alanlar mevcutsa, **Referans** modunu kullanmak genellikle bir onay uyarısı verir (çünkü referans alınan alanlar mevcut alan bölgesinin yerini alacaktır).

### Referans Verilen Alanları Kopyaya Dönüştürme

Bir blok bir alan şablonuna referans veriyorsa, blok ayarları menüsündeki `Referans verilen alanları kopyaya dönüştür` seçeneğini kullanarak mevcut alan bölgesini bağımsız bir yapılandırma haline getirebilirsiniz (referans bağlantısını keser).

![convert-field-template-duplicate-20251228](https://static-docs.nocobase.com/convert-field-template-duplicate-20251228.png)

### Dikkat Edilmesi Gerekenler

- Alan şablonları yalnızca **form blokları** ve **detay blokları** için geçerlidir.
- Şablon ve mevcut blok farklı veri tablolarına bağlı olduğunda, şablon seçicide kullanılamaz olarak görünür ve nedeni belirtilir.
- Mevcut bloktaki alanlarda "kişiselleştirilmiş ayarlamalar" yapmak istiyorsanız, doğrudan `Kopyala` modunu kullanmanız veya önce "Referans verilen alanları kopyaya dönüştür" işlemini yapmanız önerilir.

## Açılır Pencere Şablonu

Açılır pencere şablonları, bir dizi açılır pencere arayüzünü ve etkileşim mantığını yeniden kullanmak için kullanılır. Açılır pencere açma yöntemi ve boyutu gibi genel yapılandırmalar için [Açılır Pencereyi Düzenle](/interface-builder/actions/action-settings/edit-popup) bölümüne bakınız.

### Açılır Pencereyi Şablon Olarak Kaydetme

1) Açılır pencereyi tetikleyebilen bir butonun veya alanın ayarlar menüsünü açın, `Şablon olarak kaydet` seçeneğine tıklayın.  
2) Şablon adını/açıklamasını doldurun ve kayıt modunu seçin:
   - `Mevcut açılır pencereyi şablona dönüştür`: Kaydettikten sonra, mevcut açılır pencere bu şablona referans verecek şekilde değişir.
   - `Mevcut açılır pencereyi şablon olarak kopyala`: Sadece şablon oluşturulur, mevcut açılır pencere değişmeden kalır.

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### Açılır Pencere Yapılandırmasında Şablon Kullanma

1) Butonun veya alanın açılır pencere yapılandırmasını açın.  
2) Yeniden kullanmak için `Açılır pencere şablonu` kısmından bir şablon seçin.

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### Kullanım Koşulları (Şablon Kullanılabilirlik Kapsamı)

Açılır pencere şablonları, açılır pencereyi tetikleyen işlem senaryosu ile ilgilidir. Seçici, mevcut senaryoya göre uyumsuz şablonları otomatik olarak filtreler veya devre dışı bırakır (koşullar karşılanmadığında nedenini gösterir).

| Mevcut İşlem Türü | Kullanılabilir Açılır Pencere Şablonları |
| --- | --- |
| **Koleksiyon İşlemi** | Aynı koleksiyonun Koleksiyon işlemleri tarafından oluşturulan açılır pencere şablonları |
| **İlişkisiz Kayıt İşlemi** | Aynı koleksiyonun Koleksiyon işlemleri veya ilişkisiz Kayıt işlemleri tarafından oluşturulan açılır pencere şablonları |
| **İlişkili Kayıt İşlemi** | Aynı koleksiyonun Koleksiyon işlemleri veya ilişkisiz Kayıt işlemleri tarafından oluşturulan açılır pencere şablonları; veya aynı ilişki alanının ilişkili Kayıt işlemleri tarafından oluşturulan açılır pencere şablonları |

### İlişkili Veri Açılır Pencereleri

İlişkili veriler (ilişki alanları) tarafından tetiklenen açılır pencere şablonlarının özel eşleşme kuralları vardır:

#### İlişki Açılır Pencere Şablonları İçin Sıkı Eşleşme

Bir açılır pencere şablonu bir **İlişkili Kayıt işleminden** oluşturulduğunda (şablon bir `associationName` içerir), bu şablon yalnızca **tam olarak aynı ilişki alanına** sahip işlemler/alanlar tarafından kullanılabilir.

Örneğin: `Sipariş.Müşteri` ilişki alanında oluşturulan bir açılır pencere şablonu, yalnızca diğer `Sipariş.Müşteri` ilişki alanı işlemleri tarafından kullanılabilir. `Sipariş.Referans` ilişki alanı tarafından kullanılamaz (her ikisinin hedef veri tablosu `Müşteri` olsa bile).

Bunun nedeni, ilişki açılır pencere şablonlarının dahili değişkenlerinin ve yapılandırmalarının belirli bir ilişki bağlamına dayanmasıdır.

#### İlişki İşlemlerinin Hedef Koleksiyon Şablonlarını Yeniden Kullanması

İlişki alanları/işlemleri, veri tabanı eşleştiği sürece **hedef veri tabanının ilişkisiz açılır pencere şablonlarını** (Koleksiyon işlemleri veya ilişkisiz Kayıt işlemleri tarafından oluşturulan şablonlar) yeniden kullanabilir.

Örneğin: `Sipariş.Müşteri` ilişki alanı, `Müşteri` veri tabanına ait açılır pencere şablonlarını kullanabilir. Bu yaklaşım, aynı açılır pencere yapılandırmasını birden fazla ilişki alanı arasında paylaşmak için uygundur (örneğin, birleşik bir müşteri detayları açılır penceresi).

### Referansı Kopyaya Dönüştürme

Bir açılır pencere bir şablona referans veriyorsa, ayarlar menüsündeki `Referansı kopyaya dönüştür` seçeneğini kullanarak mevcut açılır pencereyi bağımsız bir yapılandırma haline getirebilirsiniz (referans bağlantısını keser).

![convert-popup-to-duplicate-20251228](https://static-docs.nocobase.com/convert-popup-to-duplicate-20251228.png)


## Şablon Yönetimi

Sistem ayarları → `UI Şablonları` bölümünden tüm şablonları görüntüleyebilir ve yönetebilirsiniz:

- **Blok Şablonları (v2)**: Blok şablonlarını yönetin.
- **Açılır Pencere Şablonları (v2)**: Açılır pencere şablonlarını yönetin.

> Alan şablonları blok şablonlarından türetilir ve blok şablonları içinden yönetilir.

![block-template-list-20251228](https://static-docs.nocobase.com/block-template-list-20251228.png)

Desteklenen işlemler: Görüntüleme, Filtreleme, Düzenleme, Silme.

> **Not**: Bir şablon şu anda referans veriliyorsa doğrudan silinemez. Lütfen önce şablona referans veren konumlarda `Referansı kopyaya dönüştür` işlemini yaparak bağlantıyı kesin, ardından şablonu silin.