---
pkg: '@nocobase/plugin-workflow-request-interceptor'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# İşlem Öncesi Olayı

## Giriş

İşlem Öncesi Olayı eklentisi, işlemler için bir engelleme mekanizması sağlar. Bu mekanizma, yeni kayıt oluşturma, güncelleme veya silme işlemlerine yönelik bir istek gönderildikten ancak işlenmeden önce tetiklenebilir.

Tetiklenen iş akışında bir "İş akışını sonlandır" düğümü yürütülürse veya başka bir düğüm yürütülemezse (bir hata nedeniyle veya tamamlanamama durumu), ilgili form işlemi engellenecektir. Aksi takdirde, planlanan işlem normal şekilde yürütülür.

"Yanıt mesajı" düğümüyle birlikte kullanarak, istemciye döndürülecek bir yanıt mesajı yapılandırabilir ve bu sayede istemciye uygun bildirimler sunabilirsiniz. İşlem Öncesi Olayları, istemci tarafından gönderilen oluşturma, güncelleme ve silme gibi işlem isteklerini onaylamak veya engellemek amacıyla iş doğrulama veya mantık kontrolleri için kullanılabilir.

## Tetikleyici Yapılandırması

### Tetikleyici Oluşturma

Bir iş akışı oluştururken, tür olarak "İşlem Öncesi Olayı"nı seçin:

![İşlem Öncesi Olayı Oluştur](https://static-docs.nocobase.com/2add03f2bdb0a836baae5fe9864fc4b6.png)

### Koleksiyon Seçimi

Engelleme iş akışının tetikleyicisinde ilk olarak yapılandırılması gereken, işlemin karşılık geldiği koleksiyondur:

![Engelleme Olayı Yapılandırması_Koleksiyon](https://static-docs.nocobase.com/8f7122caca8159d334cf776f838d53d6.png)

Ardından engelleme modunu seçin. Bu iş akışına bağlı olan işlem düğmesini engellemeyi seçebileceğiniz gibi, bu koleksiyon için seçilen tüm işlemleri engellemeyi de seçebilirsiniz (hangi formdan geldiğine bakılmaksızın ve ilgili iş akışını bağlamaya gerek kalmadan):

### Engelleme Modu

![Engelleme Olayı Yapılandırması_Engelleme Modu](https://static-docs.nocobase.com/145a7f7c3ba440bb6ca93a5ee84f16e2.png)

Şu anda desteklenen işlem türleri "Oluştur", "Güncelle" ve "Sil"dir. Aynı anda birden fazla işlem türü seçilebilir.

## İşlem Yapılandırması

Tetikleyici yapılandırmasında "Engellemeyi yalnızca bu iş akışına bağlı bir form gönderildiğinde tetikle" modu seçiliyse, form arayüzüne geri dönerek ilgili işlem düğmesine bu iş akışını bağlamanız gerekir:

![Sipariş Ekle_İş Akışı Bağla](https://static-docs.nocobase.com/bae3931e60f9bcc51bbc222e40e891e5.png)

İş akışı bağlama yapılandırmasında, ilgili iş akışını seçin. Genellikle, tetikleyici veri için varsayılan bağlam seçimi olan "Tüm form verileri" yeterlidir:

![Bağlanacak İş Akışını Seçin](https://static-docs.nocobase.com/78e2f023029bd570c91ee4cd19b7a0a7.png)

:::info{title=Not}
İşlem Öncesi Olayı'na bağlanabilecek düğmeler şu anda yalnızca yeni kayıt oluşturma veya güncelleme formlarındaki "Gönder" (veya "Kaydet"), "Veriyi güncelle" ve "Sil" düğmelerini desteklemektedir. "İş akışını tetikle" düğmesi desteklenmez (bu düğme yalnızca "İşlem Sonrası Olayı"na bağlanabilir).
:::

## Engelleme Koşulları

"İşlem Öncesi Olayı"nda, ilgili işlemin engellenmesine neden olacak iki koşul vardır:

1.  İş akışı herhangi bir "İş akışını sonlandır" düğümüne ulaştığında. Önceki talimatlara benzer şekilde, iş akışını tetikleyen veriler bir "Koşul" düğümündeki önceden belirlenmiş koşulları karşılamadığında, "Hayır" dalına girer ve "İş akışını sonlandır" düğümünü yürütür. Bu noktada iş akışı sona erer ve istenen işlem engellenir.
2.  İş akışındaki herhangi bir düğümün yürütülmesi başarısız olursa, buna yürütme hataları veya diğer istisnai durumlar da dahildir. Bu durumda, iş akışı ilgili bir durumla sona erer ve istenen işlem de engellenir. Örneğin, iş akışı bir "HTTP isteği" aracılığıyla harici veri çağırır ve istek başarısız olursa, iş akışı başarısız bir durumla sona ererken, ilgili işlem isteğini de engeller.

Engelleme koşulları karşılandıktan sonra, ilgili işlem artık yürütülmez. Örneğin, bir sipariş gönderimi engellenirse, ilgili sipariş verileri oluşturulmaz.

## İlgili İşlemin Parametreleri

"İşlem Öncesi Olayı" türündeki bir iş akışında, farklı işlemler için tetikleyiciden gelen farklı veriler iş akışında değişken olarak kullanılabilir:

| İşlem Türü \ Değişken | "Operatör" | "Operatör rolü tanımlayıcısı" | İşlem parametresi: "ID" | İşlem parametresi: "Gönderilen veri nesnesi" |
| ---------------------- | ---------- | -------------------------- | ---------------------- | ----------------------------------------- |
| Bir kayıt oluştur | ✓ | ✓ | - | ✓ |
| Bir kaydı güncelle | ✓ | ✓ | ✓ | ✓ |
| Tek veya çoklu kayıtları sil | ✓ | ✓ | ✓ | - |

:::info{title=Not}
İşlem Öncesi Olayı'ndaki "Tetikleyici verisi / İşlem parametreleri / Gönderilen veri nesnesi" değişkeni, veritabanındaki gerçek veri değil, işlemin gönderilmesiyle ilgili parametrelerdir. Veritabanındaki gerçek verilere ihtiyacınız varsa, bunları iş akışı içinde bir "Veri sorgula" düğümü kullanarak sorgulamanız gerekir.

Ayrıca, silme işlemi için, işlem parametrelerindeki "ID" tek bir kaydı hedeflerken basit bir değerdir, ancak birden fazla kaydı hedeflerken bir dizidir.
:::

## Yanıt Mesajı Çıktısı

Tetikleyiciyi yapılandırdıktan sonra, iş akışında ilgili karar mantığını özelleştirebilirsiniz. Genellikle, belirli iş koşullarının sonuçlarına göre "İş akışını sonlandır"ıp sonlandırmayacağınıza karar vermek ve önceden ayarlanmış bir "Yanıt mesajı" döndürmek için "Koşul" düğümünün dallanma modunu kullanırsınız:

![Engelleme İş Akışı Yapılandırması](https://static-docs.nocobase.com/cfddda5d8012fd3d0ca09f04ea610539.png)

Bu noktada, ilgili iş akışının yapılandırması tamamlanmıştır. Artık iş akışının koşul düğümünde yapılandırılan koşulları karşılamayan verileri göndermeyi deneyerek engelleme mantığını tetikleyebilirsiniz. Bu durumda döndürülen yanıt mesajını göreceksiniz:

![Hata Yanıt Mesajı](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

### Yanıt Mesajı Durumu

"İş akışını sonlandır" düğümü "Başarılı" durumuyla çıkacak şekilde yapılandırılmışsa ve bu düğüm yürütüldüğünde, işlem isteği yine de engellenecektir, ancak döndürülen yanıt mesajı "Başarılı" (hata yerine) durumuyla görüntülenecektir:

![Başarılı Durum Yanıt Mesajı](https://static-docs.nocobase.com/9559bbf56067144759451294b18c790e.png)

## Örnek

Yukarıdaki temel talimatları birleştirerek, bir "Sipariş Gönderimi" senaryosunu örnek alalım. Kullanıcı bir sipariş gönderdiğinde, seçilen tüm ürünlerin stoklarını kontrol etmemiz gerektiğini varsayalım. Seçilen herhangi bir ürünün stoğu yetersizse, sipariş gönderimi engellenir ve ilgili bir uyarı mesajı döndürülür. İş akışı, tüm ürünlerin stoğu yeterli olana kadar her ürünü döngüsel olarak kontrol edecek, bu noktada devam edecek ve kullanıcı için sipariş verilerini oluşturacaktır.

Diğer adımlar talimatlardakiyle aynıdır. Ancak, bir sipariş birden fazla ürün içerdiğinden, veri modelinde "Sipariş" <-- M:1 -- "Sipariş Kalemi" -- 1:M --> "Ürün" şeklinde çoktan çoğa bir ilişki eklemenin yanı sıra, "İşlem Öncesi Olayı" iş akışına, her ürünün stoğunun yeterli olup olmadığını yinelemeli olarak kontrol etmek için bir "Döngü" düğümü eklemeniz gerekir:

![Örnek_Döngü Kontrol İş Akışı](https://static-docs.nocobase.com/8307de47d5629595ab6cf00f8aa898e3.png)

Döngü için nesne, gönderilen sipariş verilerindeki "Sipariş Kalemi" dizisi olarak seçilir:

![Örnek_Döngü Nesnesi Yapılandırması](https://static-docs.nocobase.com/ed662b54cc1f5425e2b472053f89baba.png)

Döngü içindeki koşul düğümü, döngüdeki mevcut ürün nesnesinin stoğunun yeterli olup olmadığını belirlemek için kullanılır:

![Örnek_Döngüdeki Koşul](https://static-docs.nocobase.com/4af91112934b0a04a4ce55e657c0833b.png)

Diğer yapılandırmalar temel kullanımdaki yapılandırmalarla aynıdır. Sipariş nihayet gönderildiğinde, herhangi bir ürünün stoğu yetersizse, sipariş gönderimi engellenecek ve ilgili bir uyarı mesajı döndürülecektir. Test sırasında, birinin stoğu yetersiz, diğerinin stoğu yeterli olan birden fazla ürün içeren bir sipariş göndermeyi deneyin. Döndürülen yanıt mesajını görebilirsiniz:

![Örnek_Gönderim Sonrası Yanıt Mesajı](https://static-docs.nocobase.com/dd9e81084aa237bda0241d399ac19270.png)

Gördüğünüz gibi, yanıt mesajı ilk ürün olan "iPhone 15 pro"nun stoğunun yetersiz olduğunu belirtmezken, yalnızca ikinci ürün olan "iPhone 14 pro"nun stoğunun yetersiz olduğunu belirtmiştir. Bunun nedeni, döngüde ilk ürünün stoğunun yeterli olması nedeniyle engellenmemesi, ikinci ürünün stoğunun yetersiz olması nedeniyle sipariş gönderiminin engellenmesidir.

## Harici Çağrı

İşlem Öncesi Olayı, istek işleme aşamasında enjekte edildiği için HTTP API çağrıları aracılığıyla da tetiklenmeyi destekler.

İşlem düğmelerine yerel olarak bağlı iş akışları için, bunları şu şekilde çağırabilirsiniz (`posts` koleksiyonunun oluşturma düğmesini örnek alarak):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

URL parametresi `triggerWorkflows`, iş akışının anahtarıdır; birden fazla iş akışı anahtarı virgülle ayrılır. Bu anahtar, iş akışı tuvalinin üst kısmındaki iş akışı adının üzerine fareyle gelindiğinde elde edilebilir:

![İş Akışı_Anahtar_Görüntüleme_Yöntemi](https://static-docs.nocobase.com/20240426135108.png)

Yukarıdaki çağrı yapıldıktan sonra, ilgili `posts` koleksiyonunun İşlem Öncesi Olayı tetiklenecektir. İlgili iş akışı senkronize olarak işlendikten sonra, veriler normal şekilde oluşturulacak ve döndürülecektir.

Yapılandırılan iş akışı bir "Son düğüm"e ulaşırsa, mantık arayüz işlemiyle aynıdır: istek engellenecek ve hiçbir veri oluşturulmayacaktır. Son düğümün durumu başarısız olarak yapılandırılırsa, döndürülen yanıt durum kodu `400` olacaktır; başarılı olursa `200` olacaktır.

Son düğümden önce bir "Yanıt mesajı" düğümü de yapılandırılırsa, oluşturulan mesaj yanıt sonucunda da döndürülecektir. Hata durumundaki yapı şöyledir:

```json
{
  "errors": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

"Son düğüm" başarılı olarak yapılandırıldığında mesaj yapısı şöyledir:

```json
{
  "messages": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

:::info{title=Not}
Bir iş akışına birden fazla "Yanıt mesajı" düğümü eklenebildiği için, döndürülen mesaj veri yapısı bir dizidir.
:::

İşlem Öncesi Olayı global modda yapılandırılmışsa, HTTP API'yi çağırırken ilgili iş akışını belirtmek için `triggerWorkflows` URL parametresini kullanmanıza gerek yoktur. İlgili koleksiyon işlemini doğrudan çağırmanız tetikleyecektir.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create"
```

:::info{title="Not"}
HTTP API çağrısı aracılığıyla bir işlem öncesi olayını tetiklerken, iş akışının etkinleştirme durumuna ve koleksiyon yapılandırmasının eşleşip eşleşmediğine de dikkat etmeniz gerekir, aksi takdirde çağrı başarılı olmayabilir veya bir hata oluşabilir.
:::