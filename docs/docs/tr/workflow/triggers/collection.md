:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Koleksiyon Olayları

## Giriş

Koleksiyon olayı türündeki tetikleyiciler, bir koleksiyon üzerindeki oluşturma, güncelleme ve silme olaylarını dinler. Bu koleksiyon üzerinde bir veri işlemi gerçekleştiğinde ve yapılandırılan koşulları karşıladığında, ilgili iş akışını tetikler. Örneğin, yeni bir sipariş oluşturulduktan sonra ürün envanterini düşürme veya yeni bir yorum eklendikten sonra manuel inceleme bekleme gibi senaryolarda kullanılır.

## Temel Kullanım

Koleksiyon değişiklikleri birkaç farklı durumda gerçekleşebilir:

1. Veri oluşturulduktan sonra.
2. Veri güncellendikten sonra.
3. Veri oluşturulduktan veya güncellendikten sonra.
4. Veri silindikten sonra.

![Koleksiyon Olayı_Tetikleme Zamanı Seçimi](https://static-docs.nocobase.com/81275602742deb71e0c830eb97aa612c.png)

Farklı iş ihtiyaçlarınıza göre tetikleme zamanını seçebilirsiniz. Seçilen değişiklikler koleksiyonu güncellemeyi içeriyorsa, değişen alanları da belirtebilirsiniz. Tetikleme koşulu yalnızca seçilen alanlar değiştiğinde karşılanır. Hiçbir alan seçilmezse, herhangi bir alandaki bir değişiklik iş akışını tetikleyebilir.

![Koleksiyon Olayı_Değişen Alanları Seçme](https://static-docs.nocobase.com/874a1475f01298b3c00267b2b4674611.png)

Daha detaylı olarak, tetikleyici veri satırının her alanı için koşul kuralları yapılandırabilirsiniz. Tetikleyici, yalnızca alanlar ilgili koşulları karşıladığında çalışır.

![Koleksiyon Olayı_Veri Koşullarını Yapılandırma](https://static-docs.nocobase.com/264ae3835dcd75cee0eef7812c11fe0c.png)

Bir koleksiyon olayı tetiklendiğinde, olayı oluşturan veri satırı, iş akışındaki sonraki düğümler tarafından değişken olarak kullanılmak üzere tetikleyici bağlam verisi olarak yürütme planına enjekte edilir. Ancak, sonraki düğümler bu verinin ilişki alanlarını kullanmak istediğinde, öncelikle ilişki verilerinin ön yüklemesini yapılandırmanız gerekir. Seçilen ilişki verileri, tetikleyiciyle birlikte bağlama enjekte edilecek ve hiyerarşik olarak seçilip kullanılabilecektir.

## İlgili İpuçları

### Toplu Veri İşlemleriyle Tetikleme Şu Anda Desteklenmemektedir

Koleksiyon olayları şu anda toplu veri işlemleriyle tetiklemeyi desteklememektedir. Örneğin, bir makale oluştururken aynı anda o makaleye birden fazla etiket eklediğinizde (bire çok ilişki verisi), yalnızca makale oluşturma iş akışı tetiklenecektir. Aynı anda oluşturulan birden fazla etiket, etiket oluşturma iş akışını tetiklemeyecektir. Çoka çok ilişki verileri ilişkilendirilirken veya eklenirken, ara koleksiyon için iş akışı da tetiklenmeyecektir.

### Uygulama Dışındaki Veri İşlemleri Olayları Tetiklemez

Uygulamanın arayüzüne yapılan HTTP API çağrıları aracılığıyla koleksiyonlar üzerindeki işlemler de ilgili olayları tetikleyebilir. Ancak, veri değişiklikleri NocoBase uygulaması aracılığıyla değil de doğrudan veritabanı işlemleriyle yapılıyorsa, ilgili olaylar tetiklenemez. Örneğin, yerel veritabanı tetikleyicileri, uygulamadaki iş akışlarıyla ilişkilendirilmeyecektir.

Ek olarak, veritabanı üzerinde işlem yapmak için SQL eylem düğümünü kullanmak, doğrudan veritabanı işlemleriyle eşdeğerdir ve koleksiyon olaylarını tetiklemez.

### Harici Veri Kaynakları

İş akışları, `0.20` sürümünden itibaren harici veri kaynaklarını desteklemektedir. Harici bir veri kaynağı eklentisi kullanıyorsanız ve koleksiyon olayı harici bir veri kaynağı için yapılandırılmışsa, o veri kaynağı üzerindeki veri işlemleri uygulama içinde (kullanıcı oluşturma, güncellemeler ve iş akışı veri işlemleri gibi) yapıldığı sürece, ilgili koleksiyon olayları tetiklenebilir. Ancak, veri değişiklikleri başka sistemler aracılığıyla veya doğrudan harici veritabanında yapılıyorsa, koleksiyon olayları tetiklenemez.

## Örnek

Yeni bir sipariş oluşturulduktan sonra toplam fiyatı hesaplama ve envanteri düşürme senaryosunu örnek olarak ele alalım.

Öncelikle, aşağıdaki veri modellerine sahip bir Ürünler koleksiyonu ve bir Siparişler koleksiyonu oluşturalım:

| Alan Adı     | Alan Tipi      |
| ------------ | -------------- |
| Ürün Adı     | Tek Satır Metin |
| Fiyat        | Sayı           |
| Stok         | Tam Sayı       |

| Alan Adı       | Alan Tipi          |
| -------------- | ------------------ |
| Sipariş Kimliği | Otomatik Numaralandırma |
| Sipariş Ürünü  | Çoka Bir (Ürünler) |
| Sipariş Toplamı | Sayı               |

Ve bazı temel ürün verileri ekleyelim:

| Ürün Adı      | Fiyat | Stok |
| ------------- | ----- | ---- |
| iPhone 14 Pro | 7999  | 10   |
| iPhone 13 Pro | 5999  | 0    |

Ardından, Siparişler koleksiyonu olayına dayalı bir iş akışı oluşturalım:

![Koleksiyon Olayı_Örnek_Yeni Sipariş Tetikleyicisi](https://static-docs.nocobase.com/094392a870dddc65aeb20357f62ddc08.png)

İşte bazı yapılandırma seçenekleri:

- Koleksiyon: "Siparişler" koleksiyonunu seçin.
- Tetikleme zamanı: "Veri oluşturulduktan sonra" seçeneğini belirleyin.
- Tetikleme koşulları: Boş bırakın.
- İlişki verilerini ön yükle: "Ürünler"i işaretleyin.

Ardından, iş akışı mantığına göre diğer düğümleri yapılandırın: ürün stoğunun 0'dan büyük olup olmadığını kontrol edin. Eğer büyükse, stoğu düşürün; aksi takdirde, sipariş geçersizdir ve silinmelidir:

![Koleksiyon Olayı_Örnek_Yeni Sipariş İş Akışı Düzenlemesi](https://static-docs.nocobase.com/7713ea1aaa0f52a0dc3c92aba5e58f05.png)

Düğümlerin yapılandırması, belirli düğüm türleri için hazırlanan belgelerde ayrıntılı olarak açıklanacaktır.

Bu iş akışını etkinleştirin ve arayüz üzerinden yeni bir sipariş oluşturarak test edin. "iPhone 14 Pro" için sipariş verdikten sonra, ilgili ürünün stoğu 9'a düşecektir. Eğer "iPhone 13 Pro" için sipariş verilirse, stok yetersizliği nedeniyle sipariş silinecektir.

![Koleksiyon Olayı_Örnek_Yeni Sipariş Yürütme Sonucu](https://static-docs.nocobase.com/24cbe31e24ba4804b3bd48d99415c54f.png)