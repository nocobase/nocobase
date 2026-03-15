---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/workflow/triggers/custom-action) bakın.
:::

# Özel İşlem Olayı

## Giriş

NocoBase yerleşik yaygın veri işlemlerine (ekleme, silme, düzenleme, görüntüleme vb.) sahiptir. Bu işlemler karmaşık iş ihtiyaçlarını karşılayamadığında, bir iş akışında özel işlem olayını kullanabilir ve bu olayı bir sayfa bloğundaki "İş Akışını Tetikle" düğmesine bağlayabilirsiniz; kullanıcı tıkladığında özel bir işlem iş akışı tetiklenecektir.

## İş Akışı Oluşturma

Bir iş akışı oluştururken "Özel İşlem Olayı"nı seçin:

![“Özel İşlem Olayı” iş akışı oluşturma](https://static-docs.nocobase.com/20240509091820.png)

## Tetikleyici Yapılandırması

### Bağlam Türü

> v1.6.0+

Bağlam türünün farklı olması, bu iş akışının hangi bloklardaki düğmelere bağlanabileceğini belirler:

*   Bağlamsız: Yani genel olaydır; işlem panellerindeki ve veri bloklarındaki işlem düğmelerine bağlanabilir;
*   Tek kayıt: Tablo veri satırları, formlar, detaylar gibi veri bloklarındaki işlem düğmelerine bağlanabilir;
*   Çoklu kayıt: Tablonun toplu işlem düğmelerine bağlanabilir.

![Tetikleyici Yapılandırması_Bağlam Türü](https://static-docs.nocobase.com/20250215135808.png)

### Koleksiyon

Bağlam türü tek kayıt veya çoklu kayıt olduğunda, veri modelinin bağlanacağı koleksiyonu seçmeniz gerekir:

![Tetikleyici Yapılandırması_Koleksiyon Seçimi](https://static-docs.nocobase.com/20250215135919.png)

### Kullanılacak İlişkisel Veriler

İş akışında tetikleyici veri satırının ilişkisel verilerini kullanmanız gerekiyorsa, buradan derin ilişkisel alanları seçebilirsiniz:

![Tetikleyici Yapılandırması_Kullanılacak İlişkisel Verileri Seçin](https://static-docs.nocobase.com/20250215135955.png)

Bu alanlar, olay tetiklendikten sonra iş akışında kullanılabilmesi için otomatik olarak iş akışı bağlamına önceden yüklenecektir.

## İşlem Yapılandırması

İş akışında yapılandırılan bağlam türüne bağlı olarak, farklı bloklardaki işlem düğmesi yapılandırmaları da farklılık gösterir.

### Bağlamsız

> v1.6.0+

İşlem panellerine ve diğer veri bloklarına "İş Akışını Tetikle" düğmesi eklenebilir:

![Bloğa İşlem Düğmesi Ekle_İşlem Paneli](https://static-docs.nocobase.com/20250215221738.png)

![Bloğa İşlem Düğmesi Ekle_Takvim](https://static-docs.nocobase.com/20250215221942.png)

![Bloğa İşlem Düğmesi Ekle_Gantt Şeması](https://static-docs.nocobase.com/20250215221810.png)

Düğme eklendikten sonra, daha önce oluşturulan bağlamsız iş akışını bağlayın; işlem panelindeki düğmeyi örnek alırsak:

![Düğmeye İş Akışı Bağlama_İşlem Paneli](https://static-docs.nocobase.com/20250215222120.png)

![Bağlanacak İş Akışını Seçin_Bağlamsız](https://static-docs.nocobase.com/20250215222234.png)

### Tek Kayıt

Herhangi bir veri bloğunda, tek kayıt işlemlerinin bulunduğu işlem çubuğuna "İş Akışını Tetikle" düğmesi eklenebilir; örneğin formlar, tablo veri satırları, detaylar vb.:

![Bloğa İşlem Düğmesi Ekle_Form](https://static-docs.nocobase.com/20240509165428.png)

![Bloğa İşlem Düğmesi Ekle_Tablo Satırı](https://static-docs.nocobase.com/20240509165340.png)

![Bloğa İşlem Düğmesi Ekle_Detay](https://static-docs.nocobase.com/20240509165545.png)

Düğme eklendikten sonra daha önce oluşturulan iş akışını bağlayın:

![Düğmeye İş Akışı Bağlama](https://static-docs.nocobase.com/20240509165631.png)

![Bağlanacak İş Akışını Seçin](https://static-docs.nocobase.com/20240509165658.png)

Bundan sonra bu düğmeye tıklandığında ilgili özel işlem olayı tetiklenecektir:

![Düğmeye Tıklamanın Tetikleme Sonucu](https://static-docs.nocobase.com/20240509170453.png)

### Çoklu Kayıt

> v1.6.0+

Tablo bloğunun işlem çubuğuna "İş Akışını Tetikle" düğmesi eklerken ek bir seçenek sunulur; bağlam türünü "Bağlamsız" veya "Çoklu kayıt" olarak seçebilirsiniz:

![Bloğa İşlem Düğmesi Ekle_Tablo](https://static-docs.nocobase.com/20250215222507.png)

"Bağlamsız" seçildiğinde bu bir genel olaydır ve yalnızca bağlamsız türdeki iş akışları bağlanabilir.

"Çoklu kayıt" seçildiğinde, çoklu kayıt türündeki iş akışları bağlanabilir ve veriler çoklu seçildikten sonra toplu işlemler için kullanılabilir (şu anda yalnızca tablolar tarafından desteklenmektedir). Bu durumda seçilebilecek iş akışı kapsamı, yalnızca mevcut veri bloğunun koleksiyonuyla eşleşecek şekilde yapılandırılmış iş akışlarıdır:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Düğmeye tıklandığında tetikleme gerçekleşmesi için tablodaki bazı veri satırlarının seçilmiş olması gerekir, aksi takdirde iş akışı tetiklenmeyecektir:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Örnek

Örneğin, bir "Numune" koleksiyonumuz olsun; "Toplandı" (durum) olan numuneler için bir "İncelemeye Gönder" işlemi sunmamız gerekiyor. İncelemeye gönderme işlemi önce numunenin temel bilgilerini kontrol edecek, ardından bir "İnceleme Kaydı" verisi oluşturacak ve numune durumunu "İncelemeye Gönderildi" olarak değiştirecektir. Bu süreçler dizisi basit "ekle, sil, düzenle, sorgula" düğme tıklamalarıyla tamamlanamaz; bu durumda gerçekleştirmek için özel işlem olayını kullanabiliriz.

Önce bir "Numune" koleksiyonu ve bir "İnceleme Kaydı" koleksiyonu oluşturun ve numune tablosuna temel test verilerini girin:

![Örnek_Numune Koleksiyonu](https://static-docs.nocobase.com/20240509172234.png)

Ardından bir "Özel İşlem Olayı" iş akışı oluşturun; işlem sürecinden zamanında geri bildirim almanız gerekiyorsa senkron modu seçebilirsiniz (senkron modda manuel işlem gibi asenkron türdeki düğümler kullanılamaz):

![Örnek_İş Akışı Oluşturma](https://static-docs.nocobase.com/20240509173106.png)

Tetikleyici yapılandırmasında koleksiyon olarak "Numune"yi seçin:

![Örnek_Tetikleyici Yapılandırması](https://static-docs.nocobase.com/20240509173148.png)

İş ihtiyaçlarına göre süreçteki mantığı düzenleyin; örneğin gösterge parametresi `90`'dan büyük olduğunda incelemeye göndermeye izin verin, aksi takdirde ilgili sorun hakkında uyarı verin:

![Örnek_İş Mantığı Düzenlemesi](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=İpucu}
"[Yanıt Mesajı](../nodes/response-message.md)" düğümü, istemciye geri gönderilecek uyarı bilgileri için senkron özel işlem olaylarında kullanılabilir. Asenkron modda kullanılamaz.
:::

Süreci yapılandırıp etkinleştirdikten sonra tablo arayüzüne dönün ve tablonun işlem sütununa "İş Akışını Tetikle" düğmesini ekleyin:

![Örnek_İşlem Düğmesi Ekleme](https://static-docs.nocobase.com/20240509174525.png)

Ardından düğmenin yapılandırma menüsünden iş akışı bağlamayı seçin ve yapılandırma penceresini açın:

![Örnek_İş Akışı Bağlama Penceresini Açma](https://static-docs.nocobase.com/20240509174633.png)

Daha önce etkinleştirilen iş akışını ekleyin:

![Örnek_İş Akışı Seçimi](https://static-docs.nocobase.com/20240509174723.png)

Gönderdikten sonra düğme metnini "İncelemeye Gönder" gibi işlem adıyla değiştirin; yapılandırma süreci tamamlanmıştır.

Kullanırken, tabloda herhangi bir numune verisini seçin ve "İncelemeye Gönder" düğmesine tıklayarak özel işlem olayını tetikleyin. Daha önce düzenlenen mantığa göre, numune gösterge parametresi 90'dan küçükse tıklandığında aşağıdaki gibi bir uyarı verilecektir:

![Örnek_Gösterge İnceleme Şartını Karşılamıyor](https://static-docs.nocobase.com/20240509175026.png)

Gösterge parametresi 90'dan büyükse süreç normal şekilde yürütülecek, "İnceleme Kaydı" verisi oluşturulacak ve numune durumu "İncelemeye Gönderildi" olarak değiştirilecektir:

![Örnek_İncelemeye Gönderme Başarılı](https://static-docs.nocobase.com/20240509175247.png)

Böylece basit bir özel işlem olayı tamamlanmış olur. Benzer şekilde, sipariş işleme, rapor gönderme gibi karmaşık işlemleri olan işler için de özel işlem olayları aracılığıyla uygulama yapılabilir.

## Harici Çağrı

Özel işlem olaylarının tetiklenmesi yalnızca kullanıcı arayüzü işlemleriyle sınırlı değildir, HTTP API çağrıları aracılığıyla da tetiklenebilir. Özellikle özel işlem olayları, tüm koleksiyon işlemleri için iş akışlarını tetiklemek üzere yeni bir işlem türü sağlar: `trigger`; bu, NocoBase standart işlem API'si kullanılarak çağrılabilir.

:::info{title="İpucu"}
Harici çağrılar da kullanıcı kimliğine dayanması gerektiğinden, HTTP API aracılığıyla çağrı yaparken normal arayüzden gönderilen isteklerle tutarlı olarak; `Authorization` istek başlığı veya `token` parametresi (oturum açarak elde edilen token) ve `X-Role` istek başlığı (kullanıcının mevcut rol adı) dahil olmak üzere kimlik doğrulama bilgilerinin sağlanması gerekir.
:::

### Bağlamsız

Bağlamsız iş akışlarının tetikleme işlemi workflows kaynağına yönelik olmalıdır:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/workflows:trigger?triggerWorkflows=workflowKey"
```

### Tek Kayıt

Örnekteki gibi düğme ile tetiklenen bir iş akışı şu şekilde çağrılabilir:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Bu işlem tek bir veriye yönelik olduğundan, mevcut veriler üzerinde çağrı yaparken veri satırının ID'sini belirtmeniz ve URL'deki `<:id>` kısmını değiştirmeniz gerekir.

Eğer bir form üzerinden çağrılıyorsa (yeni ekleme veya güncelleme gibi), yeni veri ekleme formu için ID iletilmeyebilir ancak yürütme bağlamı verisi olarak gönderilen verilerin iletilmesi gerekir:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Güncelleme formu için hem veri satırının ID'sinin hem de güncellenen verilerin iletilmesi gerekir:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Hem ID hem de veri birlikte iletilirse, önce ID'ye karşılık gelen veri satırı yüklenecek, ardından nihai tetikleyici veri bağlamını elde etmek için iletilen veri nesnesindeki özellikler orijinal veri satırının üzerine yazılacaktır.

:::warning{title="Not"}
İlişkisel veriler iletilirse onlar da üzerine yazılacaktır; özellikle ilişkisel veri öğelerinin önceden yüklenmesi yapılandırılmışsa, ilişkisel verilerin beklenmedik şekilde üzerine yazılmasını önlemek için iletilen verilerin dikkatli bir şekilde işlenmesi gerekir.
:::

Ayrıca, URL parametresi `triggerWorkflows` iş akışının key'idir; birden fazla iş akışı virgülle ayrılır. Bu key, iş akışı tuvalinin üst kısmındaki iş akışı adının üzerine fareyle gelindiğinde elde edilebilir:

![İş Akışı_key_Görüntüleme Yöntemi](https://static-docs.nocobase.com/20240426135108.png)

Yukarıdaki çağrı başarılı olduktan sonra ilgili `samples` koleksiyonunun özel işlem olayı tetiklenecektir.

:::info{title="İpucu"}
HTTP API çağrısı yoluyla bir işlem olayını tetiklerken, iş akışının etkinleştirme durumuna ve koleksiyon yapılandırmasının eşleşip eşleşmediğine de dikkat etmeniz gerekir; aksi takdirde çağrı başarılı olmayabilir veya hata oluşabilir.
:::

### Çoklu Kayıt

Tek kayıt çağrı yöntemine benzer ancak iletilen verilerin yalnızca birden fazla birincil anahtar parametresine (`filterByTk[]`) ihtiyacı vardır ve data kısmının iletilmesine gerek yoktur:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger?filterByTk[]=1&filterByTk[]=2&triggerWorkflows=workflowKey"
```

Bu çağrı, çoklu kayıt modundaki özel işlem olayını tetikleyecek ve id'si 1 ve 2 olan verileri tetikleyici bağlamındaki veriler olarak kullanacaktır.