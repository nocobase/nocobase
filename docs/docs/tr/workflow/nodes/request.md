---
pkg: '@nocobase/plugin-workflow-request'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# HTTP İsteği

## Giriş

Başka bir web sistemiyle etkileşim kurmanız gerektiğinde, HTTP İsteği düğümünü kullanabilirsiniz. Bu düğüm, yürütüldüğünde yapılandırmasına göre belirtilen adrese bir HTTP isteği gönderir. Harici sistemlerle veri alışverişi yapmak için JSON veya `application/x-www-form-urlencoded` formatında veri taşıyabilir.

Postman gibi istek gönderme araçlarına aşina iseniz, HTTP İsteği düğümünün kullanımına hızla hakim olabilirsiniz. Bu araçlardan farklı olarak, HTTP İsteği düğümündeki tüm parametreler mevcut iş akışındaki bağlam değişkenlerini kullanabilir, bu da sistemin iş süreçleriyle organik bir entegrasyon sağlar.

## Kurulum

Yerleşik bir eklentidir, kurulum gerektirmez.

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, akıştaki artı ("+") düğmesine tıklayarak bir "HTTP İsteği" düğümü ekleyin:

![HTTP Request_Add](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

## Düğüm Yapılandırması

![HTTP Request Node_Configuration](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

### İstek Yöntemi

İsteğe bağlı HTTP istek yöntemleri: `GET`, `POST`, `PUT`, `PATCH` ve `DELETE`.

### İstek Adresi

HTTP hizmetinin URL'si, protokol kısmını (`http://` veya `https://`) içermelidir. `https://` kullanılması önerilir.

### İstek Veri Formatı

Bu, istek başlığındaki `Content-Type`'tır. Desteklenen formatlar için "[İstek Gövdesi](#istek-gövdesi)" bölümüne bakın.

### İstek Başlığı Yapılandırması

İstek Başlığı bölümündeki anahtar-değer çiftleri. Değerler, iş akışı bağlamındaki değişkenleri kullanabilir.

:::info{title=İpucu}
`Content-Type` istek başlığı, istek veri formatı aracılığıyla yapılandırılır. Buraya doldurmanıza gerek yoktur ve herhangi bir geçersiz kılma etkisiz olacaktır.
:::

### İstek Parametreleri

İstek sorgu bölümündeki anahtar-değer çiftleri. Değerler, iş akışı bağlamındaki değişkenleri kullanabilir.

### İstek Gövdesi

İsteğin Gövde kısmı. Seçilen `Content-Type`'a bağlı olarak farklı formatlar desteklenir.

#### `application/json`

Standart JSON formatlı metni destekler. Metin düzenleyicinin sağ üst köşesindeki değişken düğmesini kullanarak iş akışı bağlamındaki değişkenleri ekleyebilirsiniz.

:::info{title=İpucu}
Değişkenler bir JSON dizesi içinde kullanılmalıdır, örneğin: `{ "a": "{{$context.data.a}}" }`.
:::

#### `application/x-www-form-urlencoded`

Anahtar-değer çifti formatı. Değerler, iş akışı bağlamındaki değişkenleri kullanabilir. Değişkenler dahil edildiğinde, bir dize şablonu olarak ayrıştırılacak ve nihai dize değerine birleştirilecektir.

#### `application/xml`

Standart XML formatlı metni destekler. Metin düzenleyicinin sağ üst köşesindeki değişken düğmesini kullanarak iş akışı bağlamındaki değişkenleri ekleyebilirsiniz.

#### `multipart/form-data` <Badge>v1.8.0+</Badge>

Form verileri için anahtar-değer çiftlerini destekler. Veri türü bir dosya nesnesi olarak ayarlandığında dosyalar yüklenebilir. Dosyalar yalnızca bağlamda mevcut dosya nesnelerinden (örneğin, bir dosya koleksiyonu üzerindeki sorgunun sonuçları veya ilişkili bir dosya koleksiyonundan gelen ilişkili veriler) değişkenler aracılığıyla seçilebilir.

:::info{title=İpucu}
Dosya verilerini seçerken, değişkenin tek bir dosya nesnesine karşılık geldiğinden emin olun, bir dosya listesine değil (çoktan çoğa veya bire çok ilişki sorgularında, ilişki alanının değeri bir dizi olacaktır).
:::

### Zaman Aşımı Ayarları

Bir istek uzun süre yanıt vermediğinde, zaman aşımı ayarı yürütmesini iptal etmek için kullanılabilir. İstek zaman aşımına uğrarsa, mevcut iş akışı başarısız bir durumla erken sonlandırılacaktır.

### Başarısızlıkları Yoksay

İstek düğümü, `200` ile `299` (dahil) arasındaki standart HTTP durum kodlarını başarılı, diğerlerini ise başarısız olarak kabul eder. Eğer "Başarısız istekleri yoksay ve iş akışına devam et" seçeneği işaretlenirse, istek başarısız olsa bile iş akışındaki sonraki düğümler yürütülmeye devam edecektir.

## Yanıt Sonucunu Kullanma

Bir HTTP isteğinin yanıt sonucu, sonraki düğümlerde kullanılmak üzere [JSON Sorgusu](./json-query.md) düğümü tarafından ayrıştırılabilir.

`v1.0.0-alpha.16` sürümünden bu yana, istek düğümünün yanıt sonucunun üç bölümü ayrı değişkenler olarak kullanılabilir:

*   Yanıt durum kodu
*   Yanıt başlıkları
*   Yanıt verileri

![HTTP Request Node_Using Response Result](https://static-docs.nocobase.com/20240529110610.png)

Yanıt durum kodu genellikle `200`, `403` gibi sayısal biçimde standart bir HTTP durum kodudur (hizmet sağlayıcı tarafından verilir).

Yanıt başlıkları JSON formatındadır. Hem başlıklar hem de JSON formatlı yanıt verileri, kullanılmadan önce bir JSON düğümü kullanılarak ayrıştırılmalıdır.

## Örnek

Örneğin, bildirim SMS'leri göndermek için bir bulut platformuyla bağlantı kurmak amacıyla istek düğümünü kullanabiliriz. Bir bulut SMS API'si için yapılandırma aşağıdaki gibi görünebilir (parametreleri uyarlamak için ilgili API'nin belgelerine başvurmanız gerekecektir):

![HTTP Request Node_Configuration](https://static-docs.nocobase.com/20240515124004.png)

İş akışı bu düğümü tetiklediğinde, yapılandırılmış içerikle SMS API'sini çağıracaktır. İstek başarılı olursa, bulut SMS hizmeti aracılığıyla bir SMS gönderilecektir.