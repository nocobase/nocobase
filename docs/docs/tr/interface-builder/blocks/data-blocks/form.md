:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Form Bloğu

## Giriş

Form bloğu, veri girişi ve düzenleme arayüzleri oluşturmak için önemli bir bloktur. Yüksek düzeyde özelleştirilebilir olup, veri modeline göre ilgili bileşenleri kullanarak gerekli alanları görüntüler. Bağlantı kuralları gibi olay akışları sayesinde, Form bloğu alanları dinamik olarak gösterebilir. Ayrıca, otomatik süreçleri tetiklemek ve verileri işlemek için iş akışları ile birleştirilebilir, bu da iş verimliliğini daha da artırır veya mantık düzenlemesi sağlar.

## Form Bloğu Ekleme

- **Formu Düzenle**: Mevcut verileri değiştirmek için kullanılır.
- **Form Ekle**: Yeni veri girişleri oluşturmak için kullanılır.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Blok Ayarları

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Blok Bağlantı Kuralı

Bağlantı kuralları aracılığıyla blok davranışını (örneğin, görüntülenip görüntülenmeyeceğini veya JavaScript çalıştırıp çalıştırmayacağını) kontrol edin.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Daha fazla bilgi için [Blok Bağlantı Kuralı](/interface-builder/blocks/block-settings/block-linkage-rule) bölümüne bakınız.

### Alan Bağlantı Kuralı

Bağlantı kuralları aracılığıyla form alanı davranışını kontrol edin.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Daha fazla bilgi için [Alan Bağlantı Kuralı](/interface-builder/blocks/block-settings/field-linkage-rule) bölümüne bakınız.

### Yerleşim

Form bloğu, `layout` özelliği aracılığıyla ayarlanabilen iki yerleşim modunu destekler:

- **horizontal** (yatay yerleşim): Bu yerleşim, etiket içeriğini tek bir satırda göstererek dikey alanı korur ve basit formlar veya daha az bilgi içeren durumlar için uygundur.
- **vertical** (dikey yerleşim) (varsayılan): Etiket alanın üzerinde yer alır. Bu yerleşim, özellikle birden fazla alan veya karmaşık giriş öğeleri içeren formlar için formu okumayı ve doldurmayı kolaylaştırır.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Alanları Yapılandırma

### Bu koleksiyonun Alanları

> **Not**: Devralınan koleksiyonlardaki alanlar (yani üst koleksiyon alanları) otomatik olarak birleştirilir ve mevcut alan listesinde görüntülenir.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Diğer Alanlar

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- JavaScript yazarak özel görüntüleme içeriği oluşturabilir ve karmaşık bilgileri gösterebilirsiniz.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

## Eylemleri Yapılandırma

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Gönder](/interface-builder/actions/types/submit)
- [iş akışı Tetikle](/interface-builder/actions/types/trigger-workflow)
- [JS Eylemi](/interface-builder/actions/types/js-action)
- [Yapay Zeka Çalışanı](/interface-builder/actions/types/ai-employee)