:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/interface-builder/fields/specific/sub-table-popup) bakın.
:::

# Alt Tablo (Açılır Pencere Düzenleme)

## Tanıtım

Alt tablo (Açılır Pencere Düzenleme), bir form içindeki çoklu ilişki verilerini (Bire-Çok veya Çoktan-Çoğa gibi) yönetmek için kullanılır. Tablo yalnızca halihazırda ilişkilendirilmiş kayıtları görüntüler. Kayıt ekleme veya düzenleme işlemleri bir açılır pencerede gerçekleştirilir ve veriler, ana form gönderildiğinde toplu olarak veritabanına kaydedilir.

## Kullanım Talimatları

![20260212152204](https://static-docs.nocobase.com/20260212152204.png)

**Uygulama Senaryoları:**

- İlişki alanları: O2M / M2M / MBM
- Tipik kullanım alanları: Sipariş detayları, alt öğe listeleri, ilişkili etiketler/üyeler vb.

## Alan Yapılandırma Seçenekleri

### Mevcut verilerin seçilmesine izin ver (Varsayılan: Etkin)

Mevcut kayıtlardan ilişki seçilmesini destekler.

![20260212152312](https://static-docs.nocobase.com/20260212152312.png)

![20260212152343](https://static-docs.nocobase.com/20260212152343.gif)

### Alan bileşeni

[Alan bileşeni](/interface-builder/fields/association-field): Açılır liste seçimi, koleksiyon seçici vb. gibi diğer ilişki alanı bileşenlerine geçiş yapın.

### Mevcut verilerin bağlantısını kesmeye izin ver (Varsayılan: Etkin)

> Düzenleme formundaki mevcut ilişkili verilerin bağlantısının kesilip kesilemeyeceğini kontrol eder. Yeni eklenen verilerin kaldırılmasına her zaman izin verilir.

![20260212165752](https://static-docs.nocobase.com/20260212165752.gif)

### Ekleme izni ver (Varsayılan: Etkin)

"Ekle" düğmesinin görüntülenip görüntülenmeyeceğini kontrol eder. Kullanıcının hedef tablo için `create` (oluşturma) izni yoksa, düğme devre dışı bırakılır ve yetki olmadığına dair bir ipucu gösterilir.

### Hızlı düzenlemeye izin ver (Varsayılan: Devre Dışı)

Etkinleştirildiğinde, farenizi bir hücrenin üzerine getirdiğinizde bir düzenleme simgesi belirir ve hücre içeriğini hızlıca düzenlemenize olanak tanır.

İlişki alanı bileşeni üzerinden tüm alanlar için hızlı düzenlemeyi etkinleştirebilirsiniz.

![20260212165102](https://static-docs.nocobase.com/20260212165102.png)

Ayrıca tekil sütun alanları için de hızlı düzenleme etkinleştirilebilir.

![20260212165025](https://static-docs.nocobase.com/20260212165025.png)

![20260212165201](https://static-docs.nocobase.com/20260212165201.gif)

### Sayfa boyutu (Varsayılan: 10)

Alt tabloda sayfa başına görüntülenecek kayıt sayısını ayarlar.

## Davranış Açıklamaları

- Mevcut kayıtlar seçilirken, aynı kaydın yinelenen ilişkilerini önlemek için birincil anahtara göre tekilleştirme yapılır.
- Yeni eklenen kayıtlar doğrudan alt tabloya geri doldurulur ve görünüm varsayılan olarak yeni kaydı içeren sayfaya atlar.
- Satır içi düzenleme yalnızca geçerli satırdaki verileri değiştirir.
- Kaldırma işlemi yalnızca mevcut formdaki ilişkiyi keser, kaynak veriyi silmez.
- Veriler, yalnızca ana form gönderildiğinde toplu olarak veritabanına kaydedilir.