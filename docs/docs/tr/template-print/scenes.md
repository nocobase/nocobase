
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# "Şablon Yazdırma" Özelliğini Kullanarak Tedarik ve Satın Alma Sözleşmeleri Oluşturma

Tedarik zinciri veya ticaret senaryolarında, standart bir "Tedarik ve Satın Alma Sözleşmesi"ni hızlıca oluşturmak ve veri kaynaklarındaki alıcı, satıcı, ürün detayları gibi bilgilere göre içeriği dinamik olarak doldurmak sıkça karşılaşılan bir ihtiyaçtır. Aşağıda, basitleştirilmiş bir "Sözleşme" kullanım örneği üzerinden, "Şablon Yazdırma" özelliğini nasıl yapılandıracağınızı ve kullanacağınızı göstereceğiz. Bu sayede, veri bilgilerini sözleşme şablonlarındaki yer tutuculara eşleyerek nihai sözleşme belgesini otomatik olarak oluşturabileceksiniz.

---

## 1. Arka Plan ve Veri Yapısına Genel Bakış

Örneğimizde, kabaca aşağıdaki ana koleksiyonlar bulunmaktadır (diğer alakasız alanlar atlanmıştır):

- **parties**: Taraf A/Taraf B birim veya kişisel bilgilerini (ad, adres, ilgili kişi, telefon vb.) saklar.
- **contracts**: Sözleşme numarası, alıcı/satıcı yabancı anahtarları, imza sahibi bilgileri, başlangıç/bitiş tarihleri, banka hesabı vb. dahil olmak üzere belirli sözleşme kayıtlarını saklar.
- **contract_line_items**: Sözleşme kapsamındaki birden fazla öğeyi (ürün adı, özellik, miktar, birim fiyat, teslimat tarihi vb.) saklamak için kullanılır.

![template_print-2025-11-01-16-34-04](https://static-docs.nocobase.com/template_print-2025-11-01-16-34-04.png)

Mevcut sistem yalnızca tek kayıt yazdırmayı desteklediği için, "Sözleşme Detayları" sayfasında "Yazdır" düğmesine tıklayacağız. Sistem, ilgili sözleşme kaydını ve ilişkili taraflar gibi diğer bilgileri otomatik olarak alacak ve bunları Word veya PDF belgelerine dolduracaktır.

## 2. Hazırlık

### 2.1 Eklenti Hazırlığı

"Şablon Yazdırma" özelliğimizin ticari bir eklenti olduğunu ve yazdırma işlemlerini gerçekleştirebilmek için satın alınıp etkinleştirilmesi gerektiğini lütfen unutmayın.

![template_print-2025-11-01-17-31-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-51.png)

**Eklenti Etkinleştirmesini Onaylayın:**

Herhangi bir sayfada, bir detay bloğu (örneğin kullanıcılar için) oluşturun ve işlem yapılandırmasında ilgili şablon yapılandırma seçeneğinin olup olmadığını kontrol edin:

![template_print-2025-11-01-17-32-09](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-09.png)

![template_print-2025-11-01-17-32-30](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-30.png)

### 2.2 Koleksiyon Oluşturma

Yukarıda tasarlanan ana varlık koleksiyonunu, sözleşme koleksiyonunu ve ürün öğesi koleksiyonunu oluşturun (yalnızca temel alanları seçmeniz yeterlidir).

#### Sözleşmeler Koleksiyonu

| Alan Kategorisi | Alan Görünen Adı | Alan Adı | Alan Arayüzü |
|-----------------|-------------------|------------|-----------------|
| **Birincil ve Yabancı Anahtar Alanları** | | | |
| | Kimlik | id | Integer |
| | Alıcı Kimliği | buyer_id | Integer |
| | Satıcı Kimliği | seller_id | Integer |
| **İlişkilendirme Alanları** | | | |
| | Sözleşme Öğeleri | contract_items | One to many |
| | Alıcı (Taraf A) | buyer | Many to one |
| | Satıcı (Taraf B) | seller | Many to one |
| **Genel Alanlar** | | | |
| | Sözleşme Numarası | contract_no | Single line text |
| | Teslimat Başlangıç Tarihi | start_date | Datetime (with time zone) |
| | Teslimat Bitiş Tarihi | end_date | Datetime (with time zone) |
| | Depozito Oranı (%) | deposit_ratio | Percent |
| | Teslimattan Sonraki Ödeme Günleri | payment_days_after | Integer |
| | Banka Hesap Adı (Lehtar) | bank_account_name | Single line text |
| | Banka Adı | bank_name | Single line text |
| | Banka Hesap Numarası (Lehtar) | bank_account_number | Single line text |
| | Toplam Tutar | total_amount | Number |
| | Para Birimi Kodları | currency_codes | Single select |
| | Bakiye Oranı (%) | balance_ratio | Percent |
| | Teslimattan Sonraki Bakiye Günleri | balance_days_after | Integer |
| | Teslimat Yeri | delivery_place | Long text |
| | Taraf A İmza Sahibi Adı | party_a_signatory_name | Single line text |
| | Taraf A İmza Sahibi Unvanı | party_a_signatory_title | Single line text |
| | Taraf B İmza Sahibi Adı | party_b_signatory_name | Single line text |
| | Taraf B İmza Sahibi Unvanı | party_b_signatory_title | Single line text |
| **Sistem Alanları** | | | |
| | Oluşturulma Tarihi | createdAt | Created at |
| | Oluşturan | createdBy | Created by |
| | Son Güncelleme Tarihi | updatedAt | Last updated at |
| | Son Güncelleyen | updatedBy | Last updated by |

#### Taraflar Koleksiyonu

| Alan Kategorisi | Alan Görünen Adı | Alan Adı | Alan Arayüzü |
|-----------------|-------------------|------------|-----------------|
| **Birincil ve Yabancı Anahtar Alanları** | | | |
| | Kimlik | id | Integer |
| **Genel Alanlar** | | | |
| | Taraf Adı | party_name | Single line text |
| | Adres | address | Single line text |
| | İlgili Kişi | contact_person | Single line text |
| | İlgili Kişi Telefonu | contact_phone | Phone |
| | Pozisyon | position | Single line text |
| | E-posta | email | Email |
| | Web Sitesi | website | URL |
| **Sistem Alanları** | | | |
| | Oluşturulma Tarihi | createdAt | Created at |
| | Oluşturan | createdBy | Created by |
| | Son Güncelleme Tarihi | updatedAt | Last updated at |
| | Son Güncelleyen | updatedBy | Last updated by |

#### Sözleşme Kalemleri Koleksiyonu

| Alan Kategorisi | Alan Görünen Adı | Alan Adı | Alan Arayüzü |
|-----------------|-------------------|------------|-----------------|
| **Birincil ve Yabancı Anahtar Alanları** | | | |
| | Kimlik | id | Integer |
| | Sözleşme Kimliği | contract_id | Integer |
| **İlişkilendirme Alanları** | | | |
| | Sözleşme | contract | Many to one |
| **Genel Alanlar** | | | |
| | Ürün Adı | product_name | Single line text |
| | Özellik / Model | spec | Single line text |
| | Miktar | quantity | Integer |
| | Birim Fiyat | unit_price | Number |
| | Toplam Tutar | total_amount | Number |
| | Teslimat Tarihi | delivery_date | Datetime (with time zone) |
| | Açıklama | remark | Long text |
| **Sistem Alanları** | | | |
| | Oluşturulma Tarihi | createdAt | Created at |
| | Oluşturan | createdBy | Created by |
| | Son Güncelleme Tarihi | updatedAt | Last updated at |
| | Son Güncelleyen | updatedBy | Last updated by |

### 2.3 Arayüz Yapılandırması

**Örnek Veri Girişi:**

![template_print-2025-11-01-17-32-59](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-59.png)

![template_print-2025-11-01-17-33-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-11.png)

**Toplam fiyatı ve bakiye ödemesini otomatik olarak hesaplamak için bağlantı kuralları aşağıdaki gibi yapılandırılmıştır:**

![template_print-2025-11-01-17-33-21](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-21.png)

**Bir görüntüleme bloğu oluşturun, verileri onayladıktan sonra "Şablon Yazdırma" işlemini etkinleştirin:**

![template_print-2025-11-01-17-33-33](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-33.png)

### 2.4 Şablon Yazdırma Eklentisi Yapılandırması

![template_print-2025-11-01-17-33-45](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-45.png)

"Tedarik ve Satın Alma Sözleşmesi" gibi bir şablon yapılandırması ekleyin:

![template_print-2025-11-01-17-33-57](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-57.png)

![template_print-2025-11-01-17-34-08](https://static-docs.nocobase.com/template_print-2025-11-01-17-34-08.png)

Ardından, Alanlar Listesi sekmesine gidin. Burada mevcut nesnenin tüm alanlarını görebilirsiniz. "Kopyala"ya tıkladıktan sonra şablonu doldurmaya başlayabiliriz.

![template_print-2025-11-01-17-35-19](https://static-docs.nocobase.com/template_print-2025-11-01-17-35-19.png)

### 2.5 Sözleşme Dosyası Hazırlığı

**Word Sözleşme Şablon Dosyası**

Sözleşme şablonunu (.docx dosyası) önceden hazırlayın, örneğin: `SUPPLY AND PURCHASE CONTRACT.docx`

Bu örnekte, örnek yer tutucular içeren basitleştirilmiş bir "Tedarik ve Satın Alma Sözleşmesi" versiyonu sunuyoruz:

- `{d.contract_no}`: Sözleşme numarası
- `{d.buyer.party_name}`、`{d.seller.party_name}`: Alıcı ve satıcı adları
- `{d.total_amount}`: Toplam sözleşme tutarı
- Ve "ilgili kişi", "adres", "telefon" gibi diğer yer tutucular

Ardından, koleksiyonunuzdaki alanları kopyalayıp Word belgenize yapıştırabilirsiniz.

---

## 3. Şablon Değişkenleri Eğitimi

### 3.1 Temel Değişkenler ve İlişkili Nesne Özelliği Doldurma

**Temel Alan Doldurma:**

Örneğin, en üstteki sözleşme numarası veya sözleşmeyi imzalayan varlık nesnesi. Kopyala'ya tıklayarak doğrudan sözleşmedeki ilgili boş alana yapıştırabilirsiniz.

![template_print-2025-11-01-17-31-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-11.gif)

![template_print-2025-11-01-17-30-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-30-51.png)

### 3.2 Veri Biçimlendirme

#### Tarih Biçimlendirme

Şablonlarda, özellikle tarih alanlarını sıkça biçimlendirmemiz gerekir. Doğrudan kopyalanan tarih formatı genellikle uzundur (örneğin Wed Jan 01 2025 00:00:00 GMT) ve istediğimiz şekilde görüntülemek için biçimlendirilmesi gerekir.

Tarih alanları için, çıktı formatını belirtmek üzere `formatD()` fonksiyonunu kullanabilirsiniz:

```
{alan_adı:formatD(biçimlendirme_stili)}
```

**Örnek:**

Örneğin, kopyaladığımız orijinal alan `{d.created_at}` ise ve tarihi `2025-01-01` formatına biçimlendirmek istiyorsak, bu alanı şöyle değiştirebiliriz:

```
{d.created_at:formatD(YYYY-MM-DD)}  // Çıktı: 2025-01-01
```

**Yaygın Tarih Biçimlendirme Stilleri:**

- `YYYY` - Yıl (dört basamaklı)
- `MM` - Ay (iki basamaklı)
- `DD` - Gün (iki basamaklı)
- `HH` - Saat (24 saat formatı)
- `mm` - Dakika
- `ss` - Saniye

**Örnek 2:**

```
{d.created_at:formatD(YYYY-MM-DD HH:mm:ss)}  // Çıktı: 2025-01-01 14:30:00
```

#### Sayı Biçimlendirme (Tutar Biçimlendirme)

Sözleşmedeki `{d.total_amount}` gibi bir tutar alanı olduğunu varsayalım. Sayıları biçimlendirmek, ondalık basamakları ve binlik ayırıcıyı belirtmek için `formatN()` fonksiyonunu kullanabiliriz.

**Sözdizimi:**

```
{alan_adı:formatN(ondalık_basamaklar, binlik_ayırıcı)}
```

- **ondalık_basamaklar**: Kaç ondalık basamak tutulacağını belirtebilirsiniz. Örneğin, `2` iki ondalık basamak anlamına gelir.
- **binlik_ayırıcı**: Binlik ayırıcı kullanılıp kullanılmayacağını belirtir, genellikle `true` veya `false` olur.

**Örnek 1: Tutarı binlik ayırıcı ve iki ondalık basamakla biçimlendirme**

```
{d.amount:formatN(2, true)}  // Çıktı: 1.234,56
```

Bu, `d.amount` değerini iki ondalık basamakla biçimlendirir ve binlik ayırıcı ekler.

**Örnek 2: Tutarı ondalık basamaksız tam sayıya biçimlendirme**

```
{d.amount:formatN(0, true)}  // Çıktı: 1.235
```

Bu, `d.amount` değerini bir tam sayıya biçimlendirir ve binlik ayırıcı ekler.

**Örnek 3: Tutarı iki ondalık basamakla ancak binlik ayırıcı olmadan biçimlendirme**

```
{d.amount:formatN(2, false)}  // Çıktı: 1234.56
```

Burada binlik ayırıcı devre dışı bırakılır ve yalnızca iki ondalık basamak korunur.

**Diğer Tutar Biçimlendirme İhtiyaçları:**

- **Para Birimi Sembolü**: Carbone'un kendisi doğrudan para birimi sembolü biçimlendirme işlevleri sunmaz, ancak bunu doğrudan veriye veya şablona para birimi sembolü ekleyerek gerçekleştirebilirsiniz. Örneğin:
  ```
  {d.amount:formatN(2, true)} TL  // Çıktı: 1.234,56 TL
  ```

#### Metin Biçimlendirme

Metin alanları için, metnin formatını (örneğin büyük/küçük harf dönüşümü) belirtmek üzere `:upperCase` kullanabilirsiniz.

**Sözdizimi:**

```
{alan_adı:upperCase:diğer_komutlar}
```

**Yaygın Dönüşüm Yöntemleri:**

- `upperCase` - Tamamı büyük harfe dönüştürür
- `lowerCase` - Tamamı küçük harfe dönüştürür
- `upperCase:ucFirst` - İlk harfi büyük yapar

**Örnek:**

```
{d.party_a_signatory_name:upperCase}  // Çıktı: JOHN DOE
```

### 3.3 Döngüsel Yazdırma

#### Alt Nesne Listelerini (Ürün Detayları gibi) Nasıl Yazdırılır?

Birden fazla alt öğe (örneğin ürün detayları) içeren bir tabloyu yazdırmamız gerektiğinde, genellikle döngüsel yazdırma yöntemini kullanırız. Bu sayede sistem, listedeki her bir öğe için bir satır içerik oluşturur ve tüm öğeler taranana kadar devam eder.

Birden fazla ürün nesnesi içeren bir ürün listemiz (örneğin `contract_items`) olduğunu varsayalım. Her ürün nesnesinin ürün adı, özellik, miktar, birim fiyat, toplam tutar ve açıklama gibi birden fazla özelliği vardır.

**Adım 1: Tablonun İlk Satırındaki Alanları Doldurun**

Öncelikle, tablonun ilk satırına (başlık satırı değil) doğrudan şablon değişkenlerini kopyalayıp doldururuz. Bu değişkenler, ilgili verilerle değiştirilecek ve çıktıda görüntülenecektir.

Örneğin, tablonun ilk satırı aşağıdaki gibidir:

| Ürün Adı | Özellik / Model | Miktar | Birim Fiyat | Toplam Tutar | Açıklama |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i].product_name} | {d.contract_items[i].spec} | {d.contract_items[i].quantity} | {d.contract_items[i].unit_price} | {d.contract_items[i].total_amount} | {d.contract_items[i].remark} |

Burada, `d.contract_items[i]` ürün listesindeki i'inci öğeyi temsil eder ve `i` mevcut ürünün sırasını temsil eden bir indekstir.

**Adım 2: İkinci Satırdaki İndeksi Değiştirin**

Ardından, tablonun ikinci satırında, alanın indeksini `i+1` olarak değiştiririz ve yalnızca ilk özelliği doldururuz. Bunun nedeni, döngüsel yazdırma sırasında listeden bir sonraki veri öğesini alıp bir sonraki satırda görüntülememiz gerekmesidir.

Örneğin, ikinci satır aşağıdaki gibi doldurulur:
| Ürün Adı | Özellik / Model | Miktar | Birim Fiyat | Toplam Tutar | Açıklama |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i+1].product_name} | | |  | |  |

Bu örnekte, `[i]` değerini `[i+1]` olarak değiştirdik, böylece listedeki bir sonraki ürün verisini alabiliriz.

**Adım 3: Şablon Oluşturma Sırasında Otomatik Döngüsel Yazdırma**

Sistem bu şablonu işlediğinde, aşağıdaki mantığa göre çalışacaktır:

1. İlk satır, şablonda belirlediğiniz alanlara göre doldurulacaktır.
2. Ardından, sistem otomatik olarak ikinci satırı silecek ve `d.contract_items` içindeki verileri çıkarmaya başlayarak, tüm ürün detayları yazdırılana kadar tablodaki formata göre her satırı döngüsel olarak dolduracaktır.

Her satırdaki `i` değeri artırılacak ve böylece her satırın farklı ürün bilgilerini göstermesi sağlanacaktır.

---

## 4. Sözleşme Şablonunu Yükleme ve Yapılandırma

### 4.1 Şablon Yükleme

1. "Şablon ekle" düğmesine tıklayın ve "Tedarik ve Satın Alma Sözleşmesi Şablonu" gibi bir şablon adı girin.
2. Tüm yer tutucuları içeren hazırlanmış [Word sözleşme dosyasını (.docx)](https://static-docs.nocobase.com/template_print-2025-11-01-17-37-11.docx) yükleyin.

![template_print-2025-11-01-17-36-06](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-06.png)

3. Tamamlandıktan sonra, sistem bu şablonu gelecekte kullanılmak üzere isteğe bağlı şablon listesinde gösterecektir.
4. Bu şablonu etkinleştirmek için "Kullan" düğmesine tıklayın.

![template_print-2025-11-01-17-36-13](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-13.png)

Bu noktada, mevcut açılır pencereden çıkın ve oluşturulan tam şablonu almak için "Şablonu indir" düğmesine tıklayın.

**İpuçları:**

- Şablon `.doc` veya başka formatlar kullanıyorsa, eklenti desteğine bağlı olarak `.docx` formatına dönüştürülmesi gerekebilir.
- Word dosyalarında, yer tutucuları birden fazla paragrafa veya metin kutusuna ayırmamaya dikkat edin, aksi takdirde oluşturma hataları meydana gelebilir.

---

"Şablon Yazdırma" özelliği ile sözleşme yönetiminde tekrarlayan işleri büyük ölçüde azaltabilir, manuel kopyala-yapıştır hatalarından kaçınabilir ve sözleşmelerin standartlaştırılmış ve otomatik çıktısını sağlayabilirsiniz.