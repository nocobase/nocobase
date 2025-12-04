---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Özel İşlem Olayı

## Giriş

NocoBase, yaygın veri işlemlerini (ekleme, silme, güncelleme, görüntüleme vb.) bünyesinde barındırır. Bu işlemler karmaşık iş gereksinimlerinizi karşılamadığında, bir iş akışında özel işlem olaylarını kullanabilirsiniz. Bu olayı bir sayfa bloğundaki "İş Akışını Tetikle" düğmesine bağladığınızda, kullanıcı tıkladığında özel bir işlem iş akışı tetiklenir.

## İş Akışı Oluşturma

Bir iş akışı oluştururken "Özel İşlem Olayı"nı seçin:

![Özel İşlem Olayı iş akışı oluşturma](https://static-docs.nocobase.com/20240509091820.png)

## Tetikleyici Yapılandırması

### Bağlam Türü

> v.1.6.0+

Bağlam türü, iş akışının hangi blok düğmelerine bağlanabileceğini belirler:

*   Bağlamsız: Yani, genel bir olaydır. İşlem Çubuğu ve veri bloklarındaki işlem düğmelerine bağlanabilir.
*   Tek Kayıt: Tablo veri satırları, formlar ve detaylar gibi veri bloklarındaki işlem düğmelerine bağlanabilir.
*   Çoklu Kayıt: Bir tablodaki toplu işlem düğmelerine bağlanabilir.

![Tetikleyici Yapılandırması_Bağlam Türü](https://static-docs.nocobase.com/20250215135808.png)

### Koleksiyon

Bağlam türü Tek Kayıt veya Çoklu Kayıt olduğunda, veri modelini bağlamak istediğiniz koleksiyonu seçmeniz gerekir:

![Tetikleyici Yapılandırması_Koleksiyon Seçimi](https://static-docs.nocobase.com/20250215135919.png)

### Kullanılacak İlişkisel Veriler

İş akışında tetikleyici veri satırının ilişkisel verilerini kullanmanız gerekiyorsa, burada derin ilişkisel alanları seçebilirsiniz:

![Tetikleyici Yapılandırması_Kullanılacak İlişkisel Verileri Seçin](https://static-docs.nocobase.com/20250215135955.png)

Bu alanlar, olay tetiklendikten sonra iş akışı bağlamına otomatik olarak önceden yüklenir ve iş akışında kullanılabilir hale gelir.

## İşlem Yapılandırması

Farklı bloklardaki işlem düğmelerinin yapılandırması, iş akışında yapılandırılan bağlam türüne göre değişiklik gösterir.

### Bağlamsız

> v.1.6.0+

İşlem Çubuğu'na ve diğer veri bloklarına "İş Akışını Tetikle" düğmesi ekleyebilirsiniz:

![Bloğa İşlem Düğmesi Ekle_İşlem Çubuğu](https://static-docs.nocobase.com/20250215221738.png)

![Bloğa İşlem Düğmesi Ekle_Takvim](https://static-docs.nocobase.com/20250215221942.png)

![Bloğa İşlem Düğmesi Ekle_Gantt Şeması](https://static-docs.nocobase.com/20250215221810.png)

Düğmeyi ekledikten sonra, daha önce oluşturduğunuz bağlamsız iş akışını bağlayın. İşlem Çubuğu'ndaki bir düğmeyi örnek olarak inceleyelim:

![Düğmeye İş Akışı Bağlama_İşlem Çubuğu](https://static-docs.nocobase.com/20250215222120.png)

![Bağlanacak İş Akışını Seçin_Bağlamsız](https://static-docs.nocobase.com/20250215222234.png)

### Tek Kayıt

Herhangi bir veri bloğunda, tek bir kayıt için işlem çubuğuna "İş Akışını Tetikle" düğmesi eklenebilir; örneğin formlarda, tablo satırlarında veya detay görünümlerinde:

![Bloğa İşlem Düğmesi Ekle_Form](https://static-docs.nocobase.com/20240509165428.png)

![Bloğa İşlem Düğmesi Ekle_Tablo Satırı](https://static-docs.nocobase.com/20240509165340.png)

![Bloğa İşlem Düğmesi Ekle_Detay](https://static-docs.nocobase.com/20240509165545.png)

Düğmeyi ekledikten sonra, daha önce oluşturduğunuz iş akışını bağlayın:

![Düğmeye İş Akışı Bağlama](https://static-docs.nocobase.com/20240509165631.png)

![Bağlanacak İş Akışını Seçin](https://static-docs.nocobase.com/20240509165658.png)

Ardından, bu düğmeye tıklamak özel işlem olayını tetikleyecektir:

![Düğmeye Tıklamanın Sonucu](https://static-docs.nocobase.com/20240509170453.png)

### Çoklu Kayıt

> v.1.6.0+

Bir tablo bloğunun işlem çubuğuna "İş Akışını Tetikle" düğmesi eklerken, bağlam türünü "Bağlamsız" veya "Çoklu Kayıt" olarak seçmek için ek bir seçenek bulunur:

![Bloğa İşlem Düğmesi Ekle_Tablo](https://static-docs.nocobase.com/20250215222507.png)

"Bağlamsız" seçildiğinde, bu genel bir olaydır ve yalnızca bağlamsız iş akışlarına bağlanabilir.

"Çoklu Kayıt" seçildiğinde, birden fazla kayıt seçildikten sonra toplu işlemler için kullanılabilecek çoklu kayıt iş akışını bağlayabilirsiniz (şu anda yalnızca tablolar tarafından desteklenmektedir). Bu durumda, mevcut iş akışları, mevcut veri bloğunun koleksiyonuyla eşleşecek şekilde yapılandırılmış olanlarla sınırlıdır:

![Çoklu Kayıt İş Akışı Seçimi](https://static-docs.nocobase.com/20250215224436.png)

Tetiklemek için düğmeye tıklandığında, tablodaki bazı veri satırlarının işaretlenmiş olması gerekir; aksi takdirde iş akışı tetiklenmez:

![Çoklu Kayıt Tetikleme Koşulu](https://static-docs.nocobase.com/20250215224736.png)

## Örnek

Örneğin, bir "Numuneler" koleksiyonumuz olsun. "Toplandı" durumundaki numuneler için "İncelemeye Gönder" adında bir işlem sağlamamız gerekiyor. Bu işlem, önce numunenin temel bilgilerini kontrol edecek, ardından bir "İnceleme Kaydı" oluşturacak ve son olarak numunenin durumunu "İncelemeye Gönderildi" olarak değiştirecektir. Bu süreçler dizisi basit "ekle, sil, güncelle, görüntüle" düğme tıklamalarıyla tamamlanamayacağından, bunu özel bir işlem olayı kullanarak uygulayabiliriz.

Öncelikle bir "Numuneler" koleksiyonu ve bir "İnceleme Kayıtları" koleksiyonu oluşturun ve Numuneler koleksiyonuna bazı temel test verileri girin:

![Örnek_Numuneler Koleksiyonu](https://static-docs.nocobase.com/20240509172234.png)

Ardından, bir "Özel İşlem Olayı" iş akışı oluşturun. İşlem sürecinden hızlı geri bildirim almanız gerekiyorsa, senkron modu seçebilirsiniz (senkron modda, manuel işlem gibi eşzamansız düğümler kullanamazsınız):

![Örnek_İş Akışı Oluşturma](https://static-docs.nocobase.com/20240509173106.png)

Tetikleyici yapılandırmasında, koleksiyon için "Numuneler"i seçin:

![Örnek_Tetikleyici Yapılandırması](https://static-docs.nocobase.com/20240509173148.png)

İş gereksinimlerinize göre süreçteki mantığı düzenleyin. Örneğin, gösterge parametresi `90`'dan büyük olduğunda incelemeye göndermeye izin verin; aksi takdirde ilgili bir mesaj görüntüleyin:

![Örnek_İş Mantığı Düzenlemesi](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=İpucu}
"[Yanıt Mesajı](../nodes/response-message.md)" düğümü, istemciye bir uyarı mesajı döndürmek için senkron özel işlem olaylarında kullanılabilir. Eşzamansız modda kullanılamaz.
:::

İş akışını yapılandırıp etkinleştirdikten sonra, tablo arayüzüne geri dönün ve tablonun işlem sütununa "İş Akışını Tetikle" düğmesini ekleyin:

![Örnek_İşlem Düğmesi Ekleme](https://static-docs.nocobase.com/20240509174525.png)

Ardından, düğmenin yapılandırma menüsünden bir iş akışı bağlamayı seçin ve yapılandırma açılır penceresini açın:

![Örnek_İş Akışı Bağlama Açılır Penceresini Açma](https://static-docs.nocobase.com/20240509174633.png)

Daha önce etkinleştirilen iş akışını ekleyin:

![Örnek_İş Akışı Seçimi](https://static-docs.nocobase.com/20240509174723.png)

Gönderdikten sonra, düğme metnini "İncelemeye Gönder" gibi işlem adıyla değiştirin. Yapılandırma süreci tamamlanmıştır.

Kullanmak için, tablodan herhangi bir numune verisi seçin ve "İncelemeye Gönder" düğmesine tıklayarak özel işlem olayını tetikleyin. Daha önce düzenlediğimiz mantığa göre, numunenin gösterge parametresi 90'dan küçükse, tıkladıktan sonra aşağıdaki uyarı görüntülenir:

![Örnek_Gösterge İnceleme Kriterlerini Karşılamıyor](https://static-docs.nocobase.com/20240509175026.png)

Gösterge parametresi 90'dan büyükse, süreç normal şekilde yürütülür, bir "İnceleme Kaydı" oluşturulur ve numunenin durumu "İncelemeye Gönderildi" olarak değiştirilir:

![Örnek_İncelemeye Gönderme Başarılı](https://static-docs.nocobase.com/20240509175247.png)

Böylece, basit bir özel işlem olayı tamamlanmış olur. Benzer şekilde, sipariş işleme, rapor gönderme gibi karmaşık işlemleri olan işler için de özel işlem olayları kullanılabilir.

## Harici Çağrı

Özel işlem olaylarının tetiklenmesi yalnızca kullanıcı arayüzü işlemleriyle sınırlı değildir; HTTP API çağrıları aracılığıyla da tetiklenebilir. Özellikle, özel işlem olayları tüm koleksiyon işlemleri için iş akışlarını tetiklemek üzere yeni bir işlem türü sunar: `trigger`. Bu, NocoBase'in standart işlem API'si kullanılarak çağrılabilir.

Örnekteki gibi bir düğmeyle tetiklenen bir iş akışı şu şekilde çağrılabilir:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Bu işlem tek bir kayıt için olduğundan, mevcut veriler üzerinde çağrı yaparken, URL'deki `<:id>` kısmını değiştirerek veri satırının kimliğini belirtmeniz gerekir.

Bir form için çağrılıyorsa (örneğin yeni bir kayıt oluşturma veya güncelleme için), yeni veri oluşturan bir form için kimliği (ID) atlayabilirsiniz, ancak yürütme bağlamı olarak gönderilen verileri iletmeniz gerekir:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Bir güncelleme formu için, hem veri satırının kimliğini (ID) hem de güncellenmiş verileri iletmeniz gerekir:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Hem bir kimlik (ID) hem de veri iletilirse, önce kimliğe karşılık gelen veri satırı yüklenir ve ardından iletilen veri nesnesindeki özellikler, orijinal veri satırının üzerine yazmak için kullanılır ve nihai tetikleyici veri bağlamı elde edilir.

:::warning{title="Uyarı"}
İlişkisel veri iletilirse, bu da üzerine yazılır. Özellikle ilişkisel veri öğelerinin önceden yüklenmesi yapılandırılmışsa, ilişkisel verilerin beklenmedik şekilde üzerine yazılmasını önlemek için gelen verileri dikkatli bir şekilde işlemeniz gerekir.
:::

Ek olarak, URL parametresi `triggerWorkflows`, iş akışının anahtarıdır; birden fazla iş akışı anahtarı virgülle ayrılır. Bu anahtar, iş akışı tuvalinin üst kısmındaki iş akışı adının üzerine fareyle gelindiğinde elde edilebilir:

![İş Akışı_Anahtar_Görüntüleme Yöntemi](https://static-docs.nocobase.com/20240426135108.png)

Yukarıdaki çağrı başarılı olduktan sonra, ilgili `samples` koleksiyonu için özel işlem olayı tetiklenecektir.

:::info{title="İpucu"}
Harici çağrılar da kullanıcı kimliğine dayanması gerektiğinden, HTTP API aracılığıyla çağrı yaparken, normal arayüzden gönderilen isteklerle aynı şekilde kimlik doğrulama bilgileri sağlamanız gerekir. Bu, `Authorization` istek başlığını veya `token` parametresini (oturum açma sırasında elde edilen token) ve `X-Role` istek başlığını (kullanıcının mevcut rol adı) içerir.
:::

Bu işlemde bire-bir ilişkisel veri (bire-çok şu anda desteklenmemektedir) için bir olayı tetiklemeniz gerekiyorsa, ilişkisel alanın tetikleyici verilerini belirtmek için parametrede `!` kullanabilirsiniz:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/posts:trigger/<:id>?triggerWorkflows=workflowKey!category"
```

Yukarıdaki çağrı başarılı olduktan sonra, ilgili `categories` koleksiyonu için özel işlem olayı tetiklenecektir.

:::info{title="İpucu"}
HTTP API çağrısı aracılığıyla bir işlem olayını tetiklerken, iş akışının etkinleştirme durumuna ve koleksiyon yapılandırmasının eşleşip eşleşmediğine de dikkat etmeniz gerekir; aksi takdirde çağrı başarılı olmayabilir veya bir hatayla sonuçlanabilir.
:::