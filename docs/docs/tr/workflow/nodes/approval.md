---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/workflow/nodes/approval) bakın.
:::

# Onay

## Giriş

Bir onay iş akışında, onaylayanların başlatılan onayı işlemesi (onaylaması, reddetmesi veya iade etmesi) için operasyonel mantığı yapılandırmak amacıyla özel bir "Onay" düğümü kullanılması gerekir. "Onay" düğümü yalnızca onay süreçlerinde kullanılabilir.

:::info{title=İpucu}
Normal "Manuel İşlem" düğümünden farkı: Normal "Manuel İşlem" düğümü, manuel veri girişi veya sürecin devam edip etmeyeceğine dair manuel kararlar gibi daha genel senaryolar için tasarlanmıştır. "Onay düğümü" ise yalnızca başlatılan onayın verilerini işleyen, onay süreçlerine özel, özelleştirilmiş bir işlem düğümüdür ve diğer iş akışlarında kullanılamaz.
:::

## Düğüm Oluşturma

Süreçteki artı ("+") düğmesine tıklayın, bir "Onay" düğümü ekleyin ve ardından onay düğümünü oluşturmak için geçiş modlarından birini seçin:

![Onay düğümü_oluşturma](https://static-docs.nocobase.com/20251107000938.png)

## Düğüm Yapılandırması

### Geçiş Modu

İki geçiş modu vardır:

1.  Doğrudan geçiş modu: Genellikle daha basit süreçler için kullanılır. Onay düğümünün geçip geçmemesi yalnızca sürecin sona erip ermeyeceğini belirler. Geçmemesi durumunda süreçten doğrudan çıkılır.

    ![Onay düğümü_geçiş modu_doğrudan geçiş modu](https://static-docs.nocobase.com/20251107001043.png)

2.  Dallanma modu: Genellikle daha karmaşık veri mantığı için kullanılır. Onay düğümü herhangi bir sonuç ürettikten sonra, sonuç dalı içinde diğer düğümlerin yürütülmesine devam edilebilir.

    ![Onay düğümü_geçiş modu_dallanma modu](https://static-docs.nocobase.com/20251107001234.png)

    Bu düğüm "Onaylandıktan" sonra, onay dalını yürütmenin yanı sıra sonraki süreç de devam edecektir. "Reddet" işleminden sonra varsayılan olarak sonraki süreç de devam edebilir veya düğümde dalı yürüttükten sonra süreci sonlandırmak üzere yapılandırabilirsiniz.

:::info{title=İpucu}
Geçiş modu, düğüm oluşturulduktan sonra değiştirilemez.
:::

### Onaylayan

Onaylayan, bu düğümün onay eyleminden sorumlu kullanıcı kümesidir. Bir veya daha fazla kullanıcı olabilir. Seçim kaynağı, kullanıcı listesinden seçilen statik bir değer veya bir değişken tarafından belirtilen dinamik bir değer olabilir:

![Onay düğümü_onaylayan](https://static-docs.nocobase.com/20251107001433.png)

Bir değişken seçerken, yalnızca bağlamdaki ve düğüm sonuçlarındaki kullanıcı verilerinin birincil anahtarını veya yabancı anahtarını seçebilirsiniz. Seçilen değişken yürütme sırasında bir dizi (çoklu ilişki) ise, dizideki her kullanıcı tüm onaylayan kümesine dahil edilecektir.

Doğrudan kullanıcı veya değişken seçmenin yanı sıra, kullanıcı koleksiyonunun sorgu koşullarına göre uygun kullanıcıları dinamik olarak filtreleyerek onaylayan olarak belirleyebilirsiniz:

![20251107001703](https://static-docs.nocobase.com/20251107001703.png)

### Anlaşma Modu

Nihai yürütme sırasında yalnızca bir onaylayan varsa (birden fazla değişkenin yinelenenleri kaldırıldıktan sonraki durum dahil), seçilen anlaşma modu ne olursa olsun, onay işlemini yalnızca o kullanıcı gerçekleştirecek ve sonuç yalnızca o kullanıcı tarafından belirlenecektir.

Onaylayan kümesinde birden fazla kullanıcı olduğunda, farklı anlaşma modları seçmek farklı işleme yöntemlerini temsil eder:

1. Herhangi biri: Yalnızca bir kişinin onaylaması düğümün onaylanması için yeterlidir. Düğüm ancak herkes reddederse reddedilmiş sayılır.
2. Ortak imza: Düğümün onaylanması için herkesin onaylaması gerekir. Yalnızca bir kişinin reddetmesi düğümün reddedilmesi için yeterlidir.
3. Oylama: Düğümün onaylanması için belirlenen oranın üzerinde kişinin onaylaması gerekir; aksi takdirde düğüm reddedilmiş sayılır.

İade işlemi için, herhangi bir modda, onaylayan kümesindeki herhangi bir kullanıcı işlemi iade olarak işaretlerse düğüm doğrudan süreçten çıkar.

### İşlem Sırası

Benzer şekilde, onaylayan kümesinde birden fazla kullanıcı olduğunda, farklı işlem sıraları seçmek farklı işleme yöntemlerini temsil eder:

1. Paralel: Tüm onaylayanlar herhangi bir sırada işlem yapabilir; işlem sırası önemli değildir.
2. Sıralı: Onaylayanlar, onaylayan kümesindeki sıraya göre ardışık olarak işlem yapar. Bir önceki onaylayan gönderdikten sonra bir sonraki işlem yapabilir.

"Sıralı" işlem olarak ayarlanmış olsun ya da olmasın, gerçek işlem sırasına göre üretilen sonuç yukarıda belirtilen "Anlaşma Modu"ndaki kurallara da uyacaktır. İlgili koşullar karşılandığında düğüm yürütmesini tamamlar.

### Reddetme dalı sonlandıktan sonra iş akışından çık

"Geçiş Modu" "Dallanma modu" olarak ayarlandığında, reddetme dalı sona erdikten sonra iş akışından çıkmayı seçebilirsiniz. Bu seçenek işaretlendikten sonra, reddetme dalının sonunda bir "✗" işareti görüntülenecektir; bu da bu dal sona erdikten sonra sonraki düğümlerin devam etmeyeceğini gösterir:

![Onay düğümü_reddetme sonrası çıkış](https://static-docs.nocobase.com/20251107001839.png)

### Onaylayan arayüzü yapılandırması

Onaylayan arayüzü yapılandırması, onay iş akışı bu düğüme ulaştığında onaylayan için bir işlem arayüzü sağlamak amacıyla kullanılır. Yapılandır düğmesine tıklayarak açılır pencereyi açın:

![Onay düğümü_arayüz yapılandırması_açılır pencere](https://static-docs.nocobase.com/20251107001958.png)

Yapılandırma açılır penceresinde; orijinal gönderim içeriği, onay bilgileri, işlem formu ve özel ipucu metni gibi bloklar ekleyebilirsiniz:

![Onay düğümü_arayüz yapılandırması_blok ekle](https://static-docs.nocobase.com/20251107002604.png)

#### Orijinal gönderim içeriği

Onay içeriği detayları bloğu, başlatıcı tarafından gönderilen veri bloğudur. Normal bir veri bloğuna benzer şekilde, koleksiyondan alan bileşenlerini istediğiniz gibi ekleyebilir ve onaylayanın görmesi gereken içeriği düzenlemek için bunları istediğiniz gibi sıralayabilirsiniz:

![Onay düğümü_arayüz yapılandırması_detay bloğu](https://static-docs.nocobase.com/20251107002925.png)

#### İşlem formu

İşlem formu bloğunda, bu düğüm tarafından desteklenen "Onayla", "Reddet", "İade Et", "Devret" ve "Ek İmzalayan Ekle" gibi işlem düğmelerini ekleyebilirsiniz:

![Onay düğümü_arayüz yapılandırması_işlem formu bloğu](https://static-docs.nocobase.com/20251107003015.png)

Ayrıca, işlem formuna onaylayan tarafından değiştirilebilecek alanlar da eklenebilir. Bu alanlar, onaylayan onayı işlerken işlem formunda görüntülenecektir. Onaylayan bu alanların değerlerini değiştirebilir ve gönderildiğinde hem onay için kullanılan veriler hem de onay sürecindeki ilgili verilerin anlık görüntüsü eş zamanlı olarak güncellenecektir.

![Onay düğümü_arayüz yapılandırması_işlem formu_onay içeriği alanlarını değiştir](https://static-docs.nocobase.com/20251107003206.png)

#### "Onayla" ve "Reddet"

Onay işlem düğmeleri arasında "Onayla" ve "Reddet" belirleyici işlemlerdir. Gönderildikten sonra onaylayanın bu düğümdeki işlemi tamamlanmış olur. Gönderim sırasında doldurulması gereken ek alanlar (örneğin "Yorum"), işlem düğmesinin "İşlem Yapılandırması" açılır penceresinde eklenebilir.

![Onay düğümü_arayüz yapılandırması_işlem formu_işlem yapılandırması](https://static-docs.nocobase.com/20251107003314.png)

#### "İade Et"

"İade Et" de belirleyici bir işlemdir. Yorumları yapılandırmanın yanı sıra, iade edilebilir düğümleri de yapılandırabilirsiniz:

![20251107003555](https://static-docs.nocobase.com/20251107003555.png)

#### "Devret" ve "Ek İmzalayan Ekle"

"Devret" ve "Ek İmzalayan Ekle" belirleyici olmayan işlemlerdir ve onay sürecindeki onaylayanları dinamik olarak ayarlamak için kullanılır. "Devret", mevcut kullanıcının onay görevini başka bir kullanıcıya devretmektir. "Ek İmzalayan Ekle" ise mevcut onaylayandan önce veya sonra bir onaylayan eklemektir ve yeni eklenen onaylayan birlikte onaya devam eder.

"Devret" veya "Ek İmzalayan Ekle" işlem düğmeleri etkinleştirildikten sonra, yeni onaylayan olarak atanabilecek kullanıcıların aralığını belirlemek için düğmenin yapılandırma menüsünde "Atama Kapsamı"nı seçmeniz gerekir:

![Onay düğümü_arayüz yapılandırması_işlem formu_atama kapsamı](https://static-docs.nocobase.com/20241226232321.png)

Düğümün orijinal onaylayan yapılandırmasıyla aynı şekilde, atama kapsamı doğrudan seçilen onaylayanlar olabilir veya kullanıcı koleksiyonunun sorgu koşullarına dayanabilir. Sonunda bir küme halinde birleştirilecektir ve zaten onaylayan kümesinde bulunan kullanıcıları içermeyecektir.

:::warning{title=Önemli}
Bir işlem düğmesi etkinleştirilir veya devre dışı bırakılırsa ya da atama kapsamı değiştirilirse, işlem arayüzü yapılandırma açılır penceresini kapattıktan sonra bu düğümün yapılandırmasını kaydetmeniz gerekir. Aksi takdirde, işlem düğmesindeki değişiklikler geçerli olmayacaktır.
:::

### "Onaylarım" Kartı <Badge>2.0+</Badge>

Yapılacaklar Merkezi'ndeki "Onaylarım" listesindeki görev kartını yapılandırmak için kullanılabilir.

![20260214141554](https://static-docs.nocobase.com/20260214141554.png)

Kartta, görüntülenmesi istenen iş alanları (ilişki alanları hariç) veya onayla ilgili bilgiler serbestçe yapılandırılabilir.

Onay bu düğüme ulaştıktan sonra, Yapılacaklar Merkezi listesinde özelleştirilmiş görev kartı görülebilir:

![20260214141722](https://static-docs.nocobase.com/20260214141722.png)

## Düğüm Sonucu

Onay tamamlandıktan sonra, ilgili durum ve veriler düğüm sonucunda kaydedilecek ve sonraki düğümler tarafından değişken olarak kullanılabilir.

![20250614095052](https://static-docs.nocobase.com/20250614095052.png)

### Düğüm onay durumu

Mevcut onay düğümünün işlem durumunu temsil eder. Sonuç bir numaralandırılmış değerdir.

### Onay sonrası veriler

Onaylayan işlem formunda onay içeriğini değiştirirse, değiştirilen veriler sonraki düğümler tarafından kullanılmak üzere düğüm sonucunda kaydedilecektir. İlişki alanlarını kullanmak isterseniz, tetikleyicide ilişki alanları için ön yükleme yapılandırmanız gerekir.

### Onay kayıtları

> v1.8.0+

Onay işlem kaydı, bu düğümdeki tüm onaylayanların işlem kayıtlarını içeren bir dizidir. Her işlem kaydı aşağıdaki alanları içerir:

| Alan | Tür | Açıklama |
| --- | --- | --- |
| id | number | İşlem kaydının benzersiz tanımlayıcısı |
| userId | number | Bu kaydı işleyen kullanıcı ID'si |
| status | number | İşlem durumu |
| comment | string | İşlem sırasındaki yorum |
| updatedAt | string | İşlem kaydının güncelleme zamanı |

İhtiyaca göre bu alanlar sonraki düğümlerde değişken olarak kullanılabilir.