:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Bağlantı Kuralları

## Giriş

NocoBase'de Bağlantı Kuralları, ön uç arayüz öğelerinin etkileşimli davranışlarını yönetmek için kullanılan bir mekanizmadır. Bu mekanizma, kullanıcıların farklı koşullara bağlı olarak arayüzdeki blokların, alanların ve eylemlerin görüntülenme ve davranış mantığını ayarlamasına olanak tanır. Böylece esnek ve düşük kodlu bir etkileşim deneyimi elde edilir. Bu özellik sürekli olarak geliştirilmekte ve optimize edilmektedir.

Bağlantı kurallarını yapılandırarak şunları gerçekleştirebilirsiniz:

- Mevcut kullanıcı rolüne göre belirli blokları gizleyebilir veya gösterebilirsiniz. Örneğin, yöneticiler tüm bilgileri içeren blokları görürken, normal kullanıcılar yalnızca temel bilgileri içeren blokları görebilir; farklı roller, farklı veri kapsamlarına sahip blokları görüntüleyebilir.
- Bir formda bir seçenek belirlendiğinde, diğer alan değerlerini otomatik olarak doldurma veya sıfırlama.
- Bir formda bir seçenek belirlendiğinde, belirli giriş öğelerini devre dışı bırakma.
- Bir formda bir seçenek belirlendiğinde, belirli giriş öğelerini zorunlu hale getirme.
- Belirli koşullar altında eylem düğmelerinin görünür veya tıklanabilir olup olmadığını kontrol etme.

## Koşul Yapılandırması

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

### Sol Taraftaki Değişken

Koşulun sol tarafındaki değişken, bağlantı kuralında "değerlendirilecek nesneyi" tanımlar. Koşul, bu değişkenin değerine göre değerlendirilerek bağlantı eyleminin tetiklenip tetiklenmeyeceğine karar verilir.

Seçilebilecek değişkenler şunlardır:

- `「Mevcut Form/xxx」`, `「Mevcut Kayıt/xxx」`, `「Mevcut Açılır Pencere Kaydı/xxx」` gibi bağlamdaki alanlar.
- `Mevcut Kullanıcı`, `Mevcut Rol` gibi sistem genel değişkenleri; kullanıcı kimliği, izinler ve diğer bilgilere göre dinamik kontrol için uygundur.
  > ✅ Sol taraftaki değişken için mevcut seçenekler, bloğun bağlamına göre belirlenir. İş ihtiyaçlarınıza göre sol taraftaki değişkeni uygun şekilde kullanın:
  >
  > - `「Mevcut Kullanıcı」` mevcut oturum açmış kullanıcının bilgilerini temsil eder.
  > - `「Mevcut Form」` formdaki gerçek zamanlı giriş değerlerini temsil eder.
  > - `「Mevcut Kayıt」` bir tablodaki satır kaydı gibi kaydedilmiş kayıt değerini temsil eder.

### Operatör

Operatör, koşul değerlendirmesi için mantığı belirlemek, yani sol taraftaki değişkeni sağ taraftaki değerle nasıl karşılaştıracağınızı tanımlamak için kullanılır. Farklı sol taraftaki değişken türleri farklı operatörleri destekler. Yaygın operatör türleri şunlardır:

- **Metin türü**: `$includes`, `$eq`, `$ne`, `$empty`, `$notEmpty` vb.
- **Sayı türü**: `$eq`, `$gt`, `$lt`, `$gte`, `$lte` vb.
- **Boole türü**: `$isTruly`, `$isFalsy`
- **Dizi türü**: `$match`, `$anyOf`, `$empty`, `$notEmpty` vb.

> ✅ Sistem, sol taraftaki değişkenin türüne göre mevcut operatörlerin bir listesini otomatik olarak önerir ve yapılandırma mantığının tutarlı olmasını sağlar.

### Sağ Taraftaki Değer

Sol taraftaki değişkenle karşılaştırmak için kullanılır; koşulun karşılanıp karşılanmadığını belirlemek için bir referans değeridir.

Desteklenen içerikler şunlardır:

- Sabit değerler: Sabit sayılar, metinler, tarihler vb. girin.
- Bağlam değişkenleri: Mevcut formdaki diğer alanlar, mevcut kayıt vb. gibi.
- Sistem değişkenleri: Mevcut kullanıcı, mevcut zaman, mevcut rol vb. gibi.

> ✅ Sistem, sol taraftaki değişkenin türüne göre sağ taraftaki giriş yöntemini otomatik olarak uyarlar, örneğin:
>
> - Sol taraf "Seçim alanı" olduğunda, ilgili seçenek seçici görüntülenir.
> - Sol taraf "Tarih alanı" olduğunda, bir tarih seçici görüntülenir.
> - Sol taraf "Metin alanı" olduğunda, bir metin giriş kutusu görüntülenir.

> 💡 Sağ taraftaki değerleri (özellikle dinamik değişkenleri) esnek bir şekilde kullanarak, mevcut kullanıcıya, mevcut veri durumuna ve bağlam ortamına dayalı bağlantı mantığı oluşturabilir, böylece daha güçlü bir etkileşim deneyimi elde edebilirsiniz.

## Kural Yürütme Mantığı

### Koşul Tetikleyicisi

Bir kuraldaki koşul karşılandığında (isteğe bağlı), altındaki özellik değiştirme eylemi otomatik olarak yürütülür. Eğer bir koşul belirlenmemişse, kural varsayılan olarak her zaman karşılanmış kabul edilir ve özellik değiştirme eylemi otomatik olarak yürütülür.

### Birden Fazla Kural

Bir forma birden fazla bağlantı kuralı tanımlayabilirsiniz. Birden fazla kuralın koşulları aynı anda karşılandığında, sistem sonuçları kuralların öncelik sırasına göre baştan sona yürütür ve son sonuç nihai standart olarak kabul edilir.
Örnek: Kural 1 bir alanı "Devre Dışı" olarak ayarlar ve Kural 2 alanı "Düzenlenebilir" olarak ayarlar. Her iki kuralın koşulları da karşılanırsa, alan "Düzenlenebilir" duruma gelir.

> Birden fazla kuralın yürütme sırası çok önemlidir. Kural tasarlarken, çakışmaları önlemek için önceliklerini ve karşılıklı ilişkilerini netleştirdiğinizden emin olun.

## Kural Yönetimi

Her bir kural üzerinde aşağıdaki işlemleri gerçekleştirebilirsiniz:

- Özel Adlandırma: Yönetim ve tanımlama kolaylığı için kurala anlaşılması kolay bir ad verin.
- Sıralama: Kuralların yürütme önceliğine göre sırayı ayarlayın, böylece sistemin kuralları doğru sırada işlemesini sağlayın.
- Silme: Artık ihtiyaç duyulmayan kuralları kaldırın.
- Etkinleştirme/Devre Dışı Bırakma: Bir kuralı silmeden geçici olarak devre dışı bırakın; bu, belirli durumlarda bir kuralın geçici olarak devre dışı bırakılması gereken senaryolar için uygundur.
- Kuralı Kopyalama: Mevcut bir kuralı kopyalayarak yeni bir kural oluşturun, böylece tekrarlayan yapılandırmadan kaçının.

## Değişkenler Hakkında

Alan değeri atamasında ve koşul yapılandırmasında, yalnızca sabit değerler değil, değişkenler de desteklenir. Değişken listesi, bloğun konumuna göre değişiklik gösterecektir. Değişkenleri doğru seçmek ve kullanmak, iş ihtiyaçlarını daha esnek bir şekilde karşılayabilir. Değişkenler hakkında daha fazla bilgi için lütfen [Değişkenler](/interface-builder/variables) bölümüne bakın.

## Blok Bağlantı Kuralları

Blok bağlantı kuralları, sistem değişkenlerine (mevcut kullanıcı, rol gibi) veya bağlam değişkenlerine (mevcut açılır pencere kaydı gibi) göre bir bloğun görüntülenmesini dinamik olarak kontrol etmenizi sağlar. Örneğin, bir yönetici tüm sipariş bilgilerini görüntüleyebilirken, bir müşteri hizmetleri rolü yalnızca belirli sipariş verilerini görebilir. Blok bağlantı kuralları aracılığıyla, rollere göre ilgili blokları yapılandırabilir ve bu bloklarda farklı alanlar, eylem düğmeleri ve veri kapsamları ayarlayabilirsiniz. Oturum açan rol hedef rol olduğunda, sistem ilgili bloğu görüntüler. Blokların varsayılan olarak görüntülendiğini ve genellikle bloğu gizleme mantığını tanımlamanız gerektiğini unutmamak önemlidir.

👉 Ayrıntılar için bakınız: [Blok/Blok Bağlantı Kuralları](/interface-builder/blocks/block-settings/block-linkage-rule)

## Alan Bağlantı Kuralları

Alan bağlantı kuralları, kullanıcı eylemlerine göre bir formdaki veya detay bloğundaki alanların durumunu dinamik olarak ayarlamak için kullanılır ve başlıca şunları içerir:

- Bir alanın **Görünür/Gizli** durumunu kontrol etme
- Bir alanın **Zorunlu** olup olmadığını ayarlama
- **Değer atama**
- Özel iş mantığını işlemek için JavaScript yürütme

👉 Ayrıntılar için bakınız: [Blok/Alan Bağlantı Kuralları](/interface-builder/blocks/block-settings/field-linkage-rule)

## Eylem Bağlantı Kuralları

Eylem bağlantı kuralları, mevcut kayıt değeri ve mevcut form gibi bağlam değişkenleri ile genel değişkenlere dayanarak eylem davranışlarını (gizleme/devre dışı bırakma gibi) kontrol etmeyi destekler.

👉 Ayrıntılar için bakınız: [Eylem/Bağlantı Kuralları](/interface-builder/actions/action-settings/linkage-rule)