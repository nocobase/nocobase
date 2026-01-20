:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Alan Doğrulama
koleksiyonlardaki verilerin doğruluğunu, güvenliğini ve tutarlılığını sağlamak amacıyla NocoBase, alan doğrulama işlevselliği sunar. Bu özellik temel olarak iki ana bölümden oluşur: kural yapılandırması ve kural uygulaması.

## Kural Yapılandırması
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

NocoBase sistem alanları, [Joi](https://joi.dev/api/) kurallarını entegre eder ve aşağıdaki şekilde desteklenir:

### Metin (String) Tipi
Joi metin tipleri, aşağıdaki NocoBase alan tiplerine karşılık gelir: Tek Satır Metin, Çok Satırlı Metin, Telefon Numarası, E-posta, URL, Parola ve UUID.
#### Genel Kurallar
- Minimum uzunluk
- Maksimum uzunluk
- Uzunluk
- Desen
- Zorunlu

#### E-posta
![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)
[Daha fazla seçeneği görüntüleyin](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL
![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)
[Daha fazla seçeneği görüntüleyin](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID
![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)
[Daha fazla seçeneği görüntüleyin](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Sayı Tipi
Joi sayı tipleri, aşağıdaki NocoBase alan tiplerine karşılık gelir: Tam Sayı, Sayı ve Yüzde.
#### Genel Kurallar
- Büyüktür
- Küçüktür
- Maksimum değer
- Minimum değer
- Katı

#### Tam Sayı
Genel kurallara ek olarak, tam sayı alanları ayrıca [tam sayı doğrulamayı](https://joi.dev/api/?v=17.13.3#numberinteger) ve [güvenli olmayan tam sayı doğrulamayı](https://joi.dev/api/?v=17.13.3#numberunsafeenabled) destekler.
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Sayı ve Yüzde
Genel kurallara ek olarak, sayı ve yüzde alanları ayrıca [hassasiyet doğrulamayı](https://joi.dev/api/?v=17.13.3#numberinteger) destekler.
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Tarih Tipi
Joi tarih tipleri, aşağıdaki NocoBase alan tiplerine karşılık gelir: Tarih (saat dilimi ile), Tarih (saat dilimi olmadan), Sadece Tarih ve Unix zaman damgası.

Desteklenen doğrulama kuralları:
- Büyüktür
- Küçüktür
- Maksimum değer
- Minimum değer
- Zaman damgası formatı doğrulaması
- Zorunlu

### İlişki Alanları
İlişki alanları yalnızca zorunlu doğrulamayı destekler. İlişki alanları için zorunlu doğrulamanın, alt form veya alt tablo senaryolarında şu anda desteklenmediğini lütfen unutmayın.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Doğrulama Kurallarının Uygulanması
Alan kurallarını yapılandırdıktan sonra, veri eklerken veya değiştirirken ilgili doğrulama kuralları tetiklenecektir.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Doğrulama kuralları, alt tablo ve alt form bileşenleri için de geçerlidir:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Alt form veya alt tablo senaryolarında, ilişki alanları için zorunlu doğrulamanın geçerli olmadığını lütfen unutmayın.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## İstemci Tarafı Alan Doğrulamasından Farkları
İstemci tarafı ve sunucu tarafı alan doğrulaması farklı uygulama senaryolarında kullanılır. Uygulama yöntemleri ve kural tetikleme zamanlamaları arasında önemli farklılıklar bulunduğundan, bu iki tür doğrulamanın ayrı ayrı yönetilmesi gerekir.

### Yapılandırma Yöntemi Farkları
- **İstemci tarafı doğrulama**: Kuralları düzenleme formlarında yapılandırırsınız (aşağıdaki şekilde gösterildiği gibi).
- **Sunucu tarafı alan doğrulaması**: Alan kurallarını veri kaynağı → koleksiyon yapılandırmasında ayarlarsınız.
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### Doğrulama Tetikleme Zamanlaması Farkları
- **İstemci tarafı doğrulama**: Kullanıcılar alanları doldururken doğrulamayı gerçek zamanlı olarak tetikler ve hata mesajlarını anında gösterir.
- **Sunucu tarafı alan doğrulaması**: Veri gönderildikten sonra, veritabanına kaydedilmeden önce sunucu tarafında doğrulamayı yapar ve hata mesajlarını API yanıtları aracılığıyla döndürür.
- **Uygulama kapsamı**: Sunucu tarafı alan doğrulaması, yalnızca form gönderimi sırasında değil, aynı zamanda iş akışı ve veri içe aktarma gibi veri ekleme veya değiştirme içeren tüm senaryolarda tetiklenir.
- **Hata mesajları**: İstemci tarafı doğrulama, özel hata mesajlarını desteklerken, sunucu tarafı doğrulama şu anda özel hata mesajlarını desteklememektedir.