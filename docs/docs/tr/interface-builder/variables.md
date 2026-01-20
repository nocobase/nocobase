:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Değişkenler

## Giriş

Değişkenler, mevcut bağlamdaki bir değeri tanımlamak için kullanılan belirteçlerdir. Blok veri kapsamlarını, alan varsayılan değerlerini, bağlantı kurallarını ve iş akışlarını yapılandırma gibi çeşitli senaryolarda bunları kullanabilirsiniz.

![20251030114458](https://static-docs.nocobase.com/20251030114458.png)

## Desteklenen Değişkenler

### Mevcut Kullanıcı

Mevcut oturum açmış kullanıcının verilerini temsil eder.

![20240416154950](https://static-docs.nocobase.com/20240416154950.png)

### Mevcut Rol

Mevcut oturum açmış kullanıcının rol tanımlayıcısını (rol adını) temsil eder.

![20240416155100](https://static-docs.nocobase.com/20240416155100.png)

### Mevcut Form

Mevcut formun değerleri, yalnızca form bloklarında kullanılır. Kullanım senaryoları şunlardır:

- Mevcut form için bağlantı kuralları
- Form alanları için varsayılan değerler (yalnızca yeni veri eklerken geçerlidir)
- İlişki alanları için veri kapsamı ayarları
- Gönderme eylemleri için alan değeri atama yapılandırması

#### Mevcut Form için Bağlantı Kuralları

![20251027114920](https://static-docs.nocobase.com/20251027114920.png)

#### Form Alanları için Varsayılan Değerler (Yalnızca Yeni Form Ekleme)

![20251027115016](https://static-docs.nocobase.com/20251027115016.png)

#### İlişki Alanları için Veri Kapsamı Ayarları

Veri girişinin doğruluğunu sağlamak için, yukarı akış alanına göre aşağı akış alanının seçeneklerini dinamik olarak filtrelemek amacıyla kullanılır.

**Örnek:**

1. Kullanıcı **Owner** alanı için bir değer seçer.
2. Sistem, seçilen Owner'ın **userName**'ine göre **Account** alanı seçeneklerini otomatik olarak filtreler.

![20251030151928](https://static-docs.nocobase.com/20251030151928.png)

### Mevcut Kayıt

Kayıt, bir koleksiyondaki bir satırı ifade eder; her satır tek bir kaydı temsil eder. Görüntüleme türündeki blokların **satır eylemleri için bağlantı kurallarında** "Mevcut Kayıt" değişkeni bulunur.

Örnek: "Ödenmiş" belgeler için silme düğmesini devre dışı bırakın.

![20251027120217](https://static-docs.nocobase.com/20251027120217.png)

### Mevcut Açılır Pencere Kaydı

Açılır pencere eylemleri, NocoBase arayüz yapılandırmasında çok önemli bir rol oynar.

- Satır eylemleri için açılır pencereler: Her açılır pencerede, mevcut satır kaydını temsil eden bir "Mevcut Açılır Pencere Kaydı" değişkeni bulunur.
- İlişki alanları için açılır pencereler: Her açılır pencerede, mevcut tıklanan ilişki kaydını temsil eden bir "Mevcut Açılır Pencere Kaydı" değişkeni bulunur.

Açılır pencere içindeki bloklar "Mevcut Açılır Pencere Kaydı" değişkenini kullanabilir. İlgili kullanım senaryoları şunlardır:

- Bir bloğun veri kapsamını yapılandırma
- Bir ilişki alanının veri kapsamını yapılandırma
- Alanlar için varsayılan değerleri yapılandırma (yeni veri ekleme formu)
- Eylemler için bağlantı kurallarını yapılandırma

### URL Sorgu Parametreleri

Bu değişken, mevcut sayfa URL'sindeki sorgu parametrelerini temsil eder. Yalnızca sayfa URL'sinde bir sorgu dizesi bulunduğunda bu değişken kullanılabilir durumdadır. [Bağlantı eylemi](/interface-builder/actions/types/link) ile birlikte kullanmak daha kolaydır.

![20251027173017](https://static-docs.nocobase.com/20251027173017.png)

![20251027173121](https://static-docs.nocobase.com/20251027173121.png)

### API belirteci

Bu değişkenin değeri bir dizedir ve NocoBase API'ye erişim için bir kimlik bilgisidir. Kullanıcının kimliğini doğrulamak için kullanılabilir.

### Mevcut Cihaz Türü

Örnek: Masaüstü olmayan cihazlarda "Şablon yazdırma" eylemini göstermeyin.

![20251029215303](https://static-docs.nocobase.com/20251029215303.png)