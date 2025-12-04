---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Onay

## Giriş

Bir onay iş akışında, onaylayanların başlatılan onayı işlemesi (onaylaması, reddetmesi veya iade etmesi) için operasyonel mantığı yapılandırmak amacıyla özel bir 'Onay' düğümü kullanılması gerekir. 'Onay' düğümü sadece onay süreçlerinde kullanılabilir.

:::info{title=İpucu}
Normal 'Manuel İşlem' düğümünden farkı: Normal 'Manuel İşlem' düğümü, manuel veri girişi veya sürecin devam edip etmeyeceğine dair manuel kararlar gibi daha genel senaryolar için tasarlanmıştır. 'Onay düğümü' ise sadece başlatılan onayın verilerini işleyen, onay süreçlerine özel, özelleştirilmiş bir işlem düğümüdür ve diğer iş akışlarında kullanılamaz.
:::

## Düğüm Oluşturma

İş akışındaki artı ('+') düğmesine tıklayarak bir 'Onay' düğümü ekleyin ve ardından onay düğümünü oluşturmak için geçiş modlarından birini seçin:

![Onay Düğümü Oluşturma](https://static-docs.nocobase.com/20251107000938.png)

## Düğüm Yapılandırması

### Geçiş Modu

İki farklı geçiş modu bulunmaktadır:

1.  **Doğrudan Geçiş Modu**: Genellikle daha basit süreçler için kullanılır. Onay düğümünün geçip geçmemesi sadece sürecin sona erip ermeyeceğini belirler. Geçmezse, süreç doğrudan sonlanır.

    ![Onay Düğümü_Geçiş Modu_Doğrudan Geçiş Modu](https://static-docs.nocobase.com/20251107001043.png)

2.  **Dallanma Modu**: Genellikle daha karmaşık veri mantığı için kullanılır. Onay düğümü herhangi bir sonuç ürettikten sonra, sonuç dalı içinde diğer düğümlerin yürütülmesine devam edilebilir.

    ![Onay Düğümü_Geçiş Modu_Dallanma Modu](https://static-docs.nocobase.com/20251107001234.png)

    Bu düğüm 'Onaylandıktan' sonra, onay dalını yürütmenin yanı sıra, sonraki süreç de devam edecektir. 'Reddet' işleminden sonra varsayılan olarak sonraki süreç de devam edebilir veya düğümde dalı yürüttükten sonra süreci sonlandırmak üzere yapılandırabilirsiniz.

:::info{title=İpucu}
Geçiş modu, düğüm oluşturulduktan sonra değiştirilemez.
:::

### Onaylayan

Onaylayan, bu düğümün onay eyleminden sorumlu kullanıcı kümesidir. Bir veya daha fazla kullanıcı olabilir. Seçim kaynağı, kullanıcı listesinden seçilen statik bir değer veya bir değişken tarafından belirtilen dinamik bir değer olabilir:

![Onay Düğümü_Onaylayan](https://static-docs.nocobase.com/20251107001433.png)

Bir değişken seçerken, sadece bağlamdaki ve düğüm sonuçlarındaki kullanıcı verilerinin birincil anahtarını veya yabancı anahtarını seçebilirsiniz. Seçilen değişken yürütme sırasında bir dizi (çoktan çoğa ilişki) ise, dizideki her kullanıcı, tüm onaylayan kümesine dahil edilecektir.

Doğrudan kullanıcı veya değişken seçmenin yanı sıra, kullanıcı koleksiyonunun sorgu koşullarına göre uygun kullanıcıları dinamik olarak filtreleyerek onaylayan olarak belirleyebilirsiniz:

![20251107001703](https://static-docs.nocobase.com/20251107001703.png)

### Anlaşma Modu

Nihai yürütme sırasında sadece bir onaylayan varsa (birden fazla değişkenin yinelenenleri kaldırıldıktan sonraki durum dahil), seçilen anlaşma modu ne olursa olsun, onay işlemini sadece o kullanıcı gerçekleştirecek ve sonuç sadece o kullanıcı tarafından belirlenecektir.

Onaylayan kümesinde birden fazla kullanıcı olduğunda, farklı anlaşma modları seçmek, farklı işleme yöntemlerini temsil eder:

1.  **Herhangi Biri**: Sadece bir kişi onaylarsa, düğüm onaylanmış sayılır. Düğüm ancak herkes reddederse reddedilmiş sayılır.
2.  **Ortak İmza**: Düğümün onaylanması için herkesin onaylaması gerekir. Sadece bir kişi reddederse, düğüm reddedilmiş sayılır.
3.  **Oylama**: Düğümün onaylanması için belirlenen oranın üzerinde kişinin onaylaması gerekir; aksi takdirde düğüm reddedilmiş sayılır.

İade işlemi için, herhangi bir modda, onaylayan kümesindeki herhangi bir kullanıcı işlemi iade olarak işaretlerse, düğüm doğrudan süreçten çıkar.

### İşlem Sırası

Benzer şekilde, onaylayan kümesinde birden fazla kullanıcı olduğunda, farklı işlem sıraları seçmek, farklı işleme yöntemlerini temsil eder:

1.  **Paralel**: Tüm onaylayanlar herhangi bir sırada işlem yapabilir; işlem sırası önemli değildir.
2.  **Sıralı**: Onaylayanlar, onaylayan kümesindeki sıraya göre ardışık olarak işlem yapar. Bir önceki onaylayan gönderdikten sonra bir sonraki işlem yapabilir.

'Sıralı' işlem olarak ayarlanmış olsun ya da olmasın, gerçek işlem sırasına göre üretilen sonuç, yukarıda belirtilen 'Anlaşma Modu'ndaki kurallara da uyacaktır. İlgili koşullar karşılandığında düğüm yürütmesini tamamlar.

### Reddetme Dalı Sonlandıktan Sonra İş Akışından Çık

'Geçiş Modu' 'Dallanma Modu' olarak ayarlandığında, reddetme dalı sona erdikten sonra iş akışından çıkmayı seçebilirsiniz. Bu seçenek işaretlendikten sonra, reddetme dalının sonunda bir '✗' işareti görüntülenecektir; bu da bu dal sona erdikten sonra sonraki düğümlerin devam etmeyeceğini gösterir:

![Onay Düğümü_Reddettikten Sonra Çık](https://static-docs.nocobase.com/20251107001839.png)

### Onaylayan Arayüzü Yapılandırması

Onaylayan arayüzü yapılandırması, onay iş akışı bu düğüme ulaştığında onaylayan için bir işlem arayüzü sağlamak amacıyla kullanılır. Yapılandır düğmesine tıklayarak açılır pencereyi açın:

![Onay Düğümü_Arayüz Yapılandırması_Açılır Pencere](https://static-docs.nocobase.com/20251107001958.png)

Yapılandırma açılır penceresinde, orijinal gönderim içeriği, onay bilgileri, işlem formu ve özel ipucu metni gibi bloklar ekleyebilirsiniz:

![Onay Düğümü_Arayüz Yapılandırması_Blok Ekle](https://static-docs.nocobase.com/20251107002604.png)

#### Orijinal Gönderim İçeriği

Onay içeriği detayları bloğu, başlatıcı tarafından gönderilen veri bloğudur. Normal bir veri bloğuna benzer şekilde, veri koleksiyonundan alan bileşenlerini istediğiniz gibi ekleyebilir ve onaylayanın görmesi gereken içeriği düzenlemek için bunları istediğiniz gibi sıralayabilirsiniz:

![Onay Düğümü_Arayüz Yapılandırması_Detay Bloğu](https://static-docs.nocobase.com/20251107002925.png)

#### İşlem Formu

İşlem formu bloğunda, bu düğüm tarafından desteklenen 'Onayla', 'Reddet', 'İade Et', 'Devret' ve 'Ek İmzalayan Ekle' gibi işlem düğmelerini ekleyebilirsiniz:

![Onay Düğümü_Arayüz Yapılandırması_İşlem Formu Bloğu](https://static-docs.nocobase.com/20251107003015.png)

Ayrıca, işlem formuna onaylayan tarafından değiştirilebilecek alanlar da eklenebilir. Bu alanlar, onaylayan onayı işlerken işlem formunda görüntülenecektir. Onaylayan bu alanların değerlerini değiştirebilir ve gönderildiğinde, hem onay için kullanılan veriler hem de onay sürecindeki ilgili verilerin anlık görüntüsü eş zamanlı olarak güncellenecektir.

![Onay Düğümü_Arayüz Yapılandırması_İşlem Formu_Onay İçeriği Alanlarını Değiştir](https://static-docs.nocobase.com/20251107003206.png)

#### "Onayla" ve "Reddet"

Onay işlem düğmeleri arasında, 'Onayla' ve 'Reddet' belirleyici işlemlerdir. Gönderildikten sonra, onaylayanın bu düğümdeki işlemi tamamlanmış olur. Gönderim sırasında doldurulması gereken ek alanlar, 'Yorum' gibi, işlem düğmesinin 'İşlem Yapılandırması' açılır penceresinde eklenebilir.

![Onay Düğümü_Arayüz Yapılandırması_İşlem Formu_İşlem Yapılandırması](https://static-docs.nocobase.com/20251107003314.png)

#### "İade Et"

'İade Et' de belirleyici bir işlemdir. Yorumları yapılandırmanın yanı sıra, iade edilebilir düğümleri de yapılandırabilirsiniz:

![20251107003555](https://static-docs.nocobase.com/20251107003555.png)

#### "Devret" ve "Ek İmzalayan Ekle"

'Devret' ve 'Ek İmzalayan Ekle' belirleyici olmayan işlemlerdir. Onay sürecindeki onaylayanları dinamik olarak ayarlamak için kullanılır. 'Devret', mevcut kullanıcının onay görevini başka bir kullanıcıya devretmektir. 'Ek İmzalayan Ekle' ise mevcut onaylayandan önce veya sonra bir onaylayan eklemektir ve yeni eklenen onaylayanlar birlikte onaya devam eder.

'Devret' veya 'Ek İmzalayan Ekle' işlem düğmeleri etkinleştirildikten sonra, yeni onaylayan olarak atanabilecek kullanıcıların aralığını belirlemek için düğmenin yapılandırma menüsünde 'Atama Kapsamı'nı seçmeniz gerekir:

![Onay Düğümü_Arayüz Yapılandırması_İşlem Formu_Atama Kapsamı](https://static-docs.nocobase.com/20241226232321.png)

Düğümün orijinal onaylayan yapılandırmasıyla aynı şekilde, atama kapsamı doğrudan seçilen onaylayanlar olabilir veya kullanıcı koleksiyonunun sorgu koşullarına dayanabilir. Sonunda bir küme halinde birleştirilecektir ve zaten onaylayan kümesinde bulunan kullanıcıları içermeyecektir.

:::warning{title=Önemli}
Bir işlem düğmesi etkinleştirilir veya devre dışı bırakılırsa ya da atama kapsamı değiştirilirse, işlem arayüzü yapılandırma açılır penceresini kapattıktan sonra bu düğümün yapılandırmasını kaydetmeniz gerekir. Aksi takdirde, işlem düğmesindeki değişiklikler geçerli olmayacaktır.
:::

## Düğüm Sonucu

Onay tamamlandıktan sonra, ilgili durum ve veriler düğüm sonucunda kaydedilecek ve sonraki düğümler tarafından değişken olarak kullanılabilir.

![Düğüm Sonucu](https://static-docs.nocobase.com/20250614095052.png)

### Düğüm Onay Durumu

Mevcut onay düğümünün işlem durumunu temsil eder. Sonuç bir numaralandırılmış değerdir.

### Onay Sonrası Veriler

Onaylayan işlem formunda onay içeriğini değiştirirse, değiştirilen veriler sonraki düğümler tarafından kullanılmak üzere düğüm sonucunda kaydedilecektir. İlişki alanlarını kullanmak isterseniz, tetikleyicide ilişki alanları için ön yükleme yapılandırmanız gerekir.

### Onay Kayıtları

> v1.8.0+

Onay işlem kaydı, bu düğümdeki tüm onaylayanların işlem kayıtlarını içeren bir dizidir. Her işlem kaydı aşağıdaki alanları içerir:

| Alan      | Tür    | Açıklama                                   |
| --------- | ------ | ------------------------------------------ |
| id        | number | İşlem kaydının benzersiz tanımlayıcısı     |
| userId    | number | Bu kaydı işleyen kullanıcı ID'si           |
| status    | number | İşlem durumu                               |
| comment   | string | İşlem sırasındaki yorum                    |
| updatedAt | string | İşlem kaydının güncelleme zamanı           |

İhtiyacınıza göre bu alanları sonraki düğümlerde değişken olarak kullanabilirsiniz.