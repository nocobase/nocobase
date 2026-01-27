:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Varsayılan Değer

## Giriş

Varsayılan değer, bir alanın yeni bir kayıt oluşturulduğunda aldığı başlangıç değeridir. Bir koleksiyondaki alanı yapılandırırken veya bir Ekleme Formu bloğundaki bir alan için varsayılan bir değer belirleyebilirsiniz. Bu değer sabit veya değişken olarak ayarlanabilir.

## Varsayılan Değerleri Nerede Ayarlayabilirsiniz?

### Koleksiyon Alanları

![20240411095933](https://static-docs.nocobase.com/20240411095933.png)

### Ekleme Formundaki Alanlar

Ekleme Formundaki çoğu alan, varsayılan değer ayarlamayı destekler.

![20251028161801](https://static-docs.nocobase.com/20251028161801.png)

### Alt Formda Ekleme

Gerek Ekleme gerekse Düzenleme formlarındaki bir alt form alanı aracılığıyla eklenen alt veriler varsayılan bir değere sahip olacaktır.

Alt formda yeni ekle
![20251028163455](https://static-docs.nocobase.com/20251028163455.png)

Mevcut verileri düzenlerken, boş bir alan varsayılan değerle doldurulmaz. Yalnızca yeni eklenen veriler varsayılan değerle doldurulur.

### İlişki Alanları İçin Varsayılan Değerler

Yalnızca **Çoka-Bir** ve **Çoka-Çok** ilişki türleri, seçici bileşenler (Select, RecordPicker) kullanıldığında varsayılan değerlere sahip olur.

![20251028164128](https://static-docs.nocobase.com/20251028164128.png)

## Varsayılan Değer Değişkenleri

### Hangi Değişkenler Mevcut?

- Mevcut kullanıcı;
- Mevcut kayıt; bu yalnızca mevcut kayıtlar için geçerlidir;
- Mevcut form, ideal olarak yalnızca formdaki alanları listeler;
- Mevcut nesne, alt formlardaki bir kavramdır (alt formdaki her satır için veri nesnesi);
- URL parametreleri
  Değişkenler hakkında daha fazla bilgi için [Değişkenler](/interface-builder/variables) bölümüne bakınız.

### Alan Varsayılan Değer Değişkenleri

İlişki olmayan alanlar ve ilişki alanları olmak üzere iki kategoriye ayrılır.

#### İlişki Alanı Varsayılan Değer Değişkenleri

- Değişken nesnesi bir koleksiyon kaydı olmalıdır;
- Mevcut koleksiyon veya bir üst/alt koleksiyon olabilen, kalıtım zincirindeki bir koleksiyon olmalıdır;
- “Tablo seçili kayıtlar” değişkeni yalnızca “Çoka-Çok” ve “Bire-Çok/Çoka-Bir” ilişki alanlarında kullanılabilir;
- **Çok seviyeli senaryolar için düzleştirilmeli ve yinelenenler kaldırılmalıdır.**

```typescript
// Tablo seçili kayıtlar:
[{id:1},{id:2},{id:3},{id:4}]

// Tablo seçili kayıtlar/bire-bir:
[{toOne: {id:2}}, {toOne: {id:3}}, {toOne: {id:3}}]
// Düzleştir ve yinelenenleri kaldır
[{id: 2}, {id: 3}]

// Tablo seçili kayıtlar/çoka-çok:
[{toMany: [{id: 1}, {id:2}]}, {toMany: {[id:3}, {id:4}]}]
// Düzleştir
[{id:1},{id:2},{id:3},{id:4}]
```

#### İlişki Olmayan Varsayılan Değer Değişkenleri

- Türler tutarlı veya uyumlu olmalıdır, örneğin dizeler sayılarla uyumludur ve toString yöntemi sağlayan tüm nesnelerle de uyumludur;
- JSON alanı özeldir ve her tür veriyi depolayabilir;

### Alan Seviyesi (İsteğe Bağlı Alanlar)

![20240411101157](https://static-docs.nocobase.com/20240411101157.png)

- İlişki olmayan varsayılan değer değişkenleri
  - Çok seviyeli alanlar seçilirken, bire-bir ilişkilerle sınırlıdır ve çoka-çok ilişkileri desteklemez;
  - JSON alanı özeldir ve kısıtlamasız olabilir;

- İlişki varsayılan değer değişkenleri
  - hasOne, yalnızca bire-bir ilişkileri destekler;
  - hasMany, hem bire-bir (dahili dönüşüm) hem de çoka-çok ilişkileri destekler;
  - belongsToMany, hem bire-bir (dahili dönüşüm) hem de çoka-çok ilişkileri destekler;
  - belongsTo, genellikle bire-bir içindir, ancak üst ilişki hasMany olduğunda çoka-çok ilişkileri de destekler (çünkü hasMany/belongsTo aslında bir çoka-çok ilişkisidir);

## Özel Durumlar

### "Çoka-Çok" İlişkisi, "Bire-Çok/Çoka-Bir" Kombinasyonuna Eşdeğerdir

Model

![20240411101558](https://static-docs.nocobase.com/20240411101558.png)

### Neden Bire-Bir ve Bire-Çok İlişkilerinin Varsayılan Değerleri Yoktur?

Örneğin, bir A.B ilişkisinde, b1 a1 ile ilişkilendirilmişse, a2 ile ilişkilendirilemez. Eğer b1, a2 ile ilişkilendirilirse, a1 ile olan ilişkisi kaldırılır. Bu durumda, veriler paylaşılmazken, varsayılan değerler paylaşılan bir mekanizmadır (hepsi ilişkilendirilebilir). Bu nedenle, Bire-Bir ve Bire-Çok ilişkileri varsayılan değerlere sahip olamaz.

### Neden Çoka-Bir ve Çoka-Çok Alt Formları veya Alt Tabloları Varsayılan Değerlere Sahip Olamaz?

Çünkü alt formların ve alt tabloların odak noktası, ilişki verilerini doğrudan düzenlemektir (ekleme ve kaldırma dahil), oysa ilişki varsayılan değeri, hepsinin ilişkilendirilebildiği ancak ilişki verilerinin değiştirilemediği paylaşılan bir mekanizmadır. Bu nedenle, bu senaryoda varsayılan değerler sağlamak uygun değildir.

Ek olarak, alt formların veya alt tabloların alt alanları vardır ve bir alt form veya alt tablo için varsayılan değerin satır varsayılanı mı yoksa sütun varsayılanı mı olduğu belirsiz olurdu.

Tüm faktörler göz önüne alındığında, ilişki türü ne olursa olsun alt formların veya alt tabloların doğrudan varsayılan değerlere sahip olmaması daha uygun olacaktır.