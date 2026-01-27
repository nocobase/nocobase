:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Detay Bloğu

## Giriş

Detay bloğu, her bir veri kaydının alan değerlerini göstermek için kullanılır. Esnek alan düzenlerini destekler ve kullanıcıların bilgileri kolayca görüntülemesi ve yönetmesi için çeşitli yerleşik veri işlem işlevlerine sahiptir.

## Blok Ayarları

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### Blok Bağlantı Kuralları

Blok davranışını (örneğin, gösterilip gösterilmeyeceğini veya JavaScript çalıştırılıp çalıştırılmayacağını) bağlantı kuralları aracılığıyla kontrol edebilirsiniz.

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
Daha fazla bilgi için [Bağlantı Kuralları](/interface-builder/linkage-rule) bölümüne bakabilirsiniz.

### Veri Kapsamını Ayarlama

Örnek: Yalnızca ödenmiş siparişleri gösterin.

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

Daha fazla bilgi için [Veri Kapsamını Ayarlama](/interface-builder/blocks/block-settings/data-scope) bölümüne bakabilirsiniz.

### Alan Bağlantı Kuralları

Detay bloğundaki bağlantı kuralları, alanların dinamik olarak gösterilmesini/gizlenmesini destekler.

Örnek: Sipariş durumu "İptal Edildi" olduğunda tutarı göstermeyin.

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

Daha fazla bilgi için [Bağlantı Kuralları](/interface-builder/linkage-rule) bölümüne bakabilirsiniz.

## Alanları Yapılandırma

### Bu koleksiyondaki alanlar

> **Not**: Devralınan koleksiyonlardaki alanlar (yani üst koleksiyon alanları) otomatik olarak birleştirilir ve mevcut alan listesinde gösterilir.

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### İlişkili koleksiyonlardaki alanlar

> **Not**: İlişkili koleksiyonlardaki alanların gösterilmesi desteklenir (şu anda yalnızca bire bir ilişkiler için).

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)

### Diğer Alanlar
- JS Field
- JS Item
- Ayırıcı
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **İpucu**: Özel görüntüleme içeriği oluşturmak için JavaScript yazabilir, böylece daha karmaşık bilgileri gösterebilirsiniz.  
> Örneğin, farklı veri türlerine, koşullara veya mantığa göre farklı görüntüleme efektleri oluşturabilirsiniz.

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

## Eylemleri Yapılandırma

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [Düzenle](/interface-builder/actions/types/edit)
- [Sil](/interface-builder/actions/types/delete)
- [Bağlantı](/interface-builder/actions/types/link)
- [Açılır Pencere](/interface-builder/actions/types/pop-up)
- [Kaydı Güncelle](/interface-builder/actions/types/update-record)
- [İş Akışını Tetikle](/interface-builder/actions/types/trigger-workflow)
- [JS Eylemi](/interface-builder/actions/types/js-action)
- [Yapay Zeka Çalışanı](/interface-builder/actions/types/ai-employee)