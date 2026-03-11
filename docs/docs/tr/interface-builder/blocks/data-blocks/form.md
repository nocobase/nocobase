:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/interface-builder/blocks/data-blocks/form) bakın.
:::

# Form Bloğu

## Giriş

Form bloğu, veri girişi ve düzenleme arayüzleri oluşturmak için kullanılan önemli bir bloktur. Veri modeline dayalı olarak ilgili bileşenleri kullanarak gerekli alanları görüntülemek için yüksek düzeyde özelleştirilebilirliğe sahiptir. Bağlantı kuralları gibi olay akışları aracılığıyla form bloğu, alanları dinamik olarak görüntüleyebilir. Ayrıca, iş akışı ile birleştirilerek otomatik süreç tetikleme ve veri işleme gerçekleştirilebilir, bu da iş verimliliğini daha da artırır veya mantıksal düzenleme sağlar.

## Form Bloğu Ekleme

- **Formu düzenle**: Mevcut verileri düzenlemek için kullanılır.
- **Form ekle**: Yeni veri kayıtları oluşturmak için kullanılır.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Blok Yapılandırma Öğeleri

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Blok Bağlantı Kuralları

Bağlantı kuralları aracılığıyla blok davranışını kontrol edin (görüntülenip görüntülenmeyeceği veya JavaScript yürütülüp yürütülmeyeceği gibi).

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Daha fazla bilgi için [Blok Bağlantı Kuralları](/interface-builder/blocks/block-settings/block-linkage-rule) bölümüne bakınız.

### Alan Bağlantı Kuralları

Bağlantı kuralları aracılığıyla form alanı davranışını kontrol edin.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Daha fazla bilgi için [Alan Bağlantı Kuralları](/interface-builder/blocks/block-settings/field-linkage-rule) bölümüne bakınız.

### Yerleşim

Form bloğu, `layout` özelliği aracılığıyla ayarlanan iki yerleşim yöntemini destekler:

- **horizontal** (yatay yerleşim): Bu yerleşim, etiket içeriğinin tek bir satırda görüntülenmesini sağlayarak dikey alandan tasarruf sağlar; basit formlar veya az bilgi içeren durumlar için uygundur.
- **vertical** (dikey yerleşim) (varsayılan): Etiket alanın üzerinde yer alır; bu yerleşim, özellikle birden fazla alan veya karmaşık giriş öğeleri içeren formlar için formun okunmasını ve doldurulmasını kolaylaştırır.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Alanları Yapılandırma

### Bu Koleksiyonun Alanları

> **Not**: Devralınan koleksiyonlardaki alanlar (yani üst koleksiyon alanları), mevcut alan listesinde otomatik olarak birleştirilir ve görüntülenir.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### İlişkili Koleksiyon Alanları

> İlişkili koleksiyon alanları formda salt okunurdur; genellikle ilişkili verilerin birden fazla alan değerini görüntülemek için ilişki alanlarıyla birlikte kullanılır.

![20260212161035](https://static-docs.nocobase.com/20260212161035.png)

- Şu anda yalnızca bire-bir ilişkileri (belongsTo / hasOne vb.) desteklemektedir.
- Genellikle ilişki alanlarıyla (ilgili kayıtları seçmek için kullanılır) birlikte kullanılır: ilişki alanı bileşeni ilgili kaydı seçmekten/değiştirmekten sorumludur, ilişkili koleksiyon alanı ise o kaydın daha fazla bilgisini görüntülemekten sorumludur (salt okunur).

**Örnek**: "Sorumlu" seçildikten sonra, o sorumlunun telefon numarası, e-posta adresi gibi bilgiler formda görüntülenir.

> Düzenleme formunda "Sorumlu" ilişki alanı yapılandırılmamış olsa bile, ilgili ilişki bilgileri görüntülenebilir. "Sorumlu" ilişki alanı yapılandırıldığında, sorumlu değiştirildiğinde ilgili ilişki bilgileri ilgili kayda göre güncellenir.

![20260212160748](https://static-docs.nocobase.com/20260212160748.gif)

### Diğer Alanlar

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- JavaScript yazarak özel görüntüleme içeriği oluşturabilir ve karmaşık içeriklerin sunumunu sağlayabilirsiniz.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

### Alan Şablonu

Alan şablonları, form bloklarındaki alan alanı yapılandırmalarını yeniden kullanmak için kullanılır. Ayrıntılar için bkz. [Alan Şablonu](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

## Eylemleri Yapılandırma

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Gönder](/interface-builder/actions/types/submit)
- [İş akışını tetikle](/interface-builder/actions/types/trigger-workflow)
- [JS Eylemi](/interface-builder/actions/types/js-action)
- [AI Çalışanı](/interface-builder/actions/types/ai-employee)