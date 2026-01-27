---
pkg: '@nocobase/plugin-workflow-webhook'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Webhook

## Giriş

Webhook tetikleyicisi, üçüncü taraf sistemlerin HTTP istekleri aracılığıyla çağırabileceği bir URL sunar. Üçüncü taraf bir olay gerçekleştiğinde, bu URL'ye bir HTTP isteği gönderilir ve iş akışının çalışması tetiklenir. Ödeme geri bildirimleri veya mesajlar gibi harici sistemlerden gelen bildirimler için idealdir.

## İş Akışı Oluşturma

Bir iş akışı oluştururken, tür olarak “Webhook olayı”nı seçin:

![20241210105049](https://static-docs.nocobase.com/20241210105049.png)

:::info{title="Not"}
Senkron ve asenkron iş akışları arasındaki temel fark şudur: Senkron bir iş akışı, yanıtı döndürmeden önce iş akışının tamamlanmasını bekler. Asenkron bir iş akışı ise, tetikleyici yapılandırmasında belirlenen yanıtı hemen döndürür ve iş akışını arka planda sıraya alarak yürütür.
:::

## Tetikleyici Yapılandırması

![20241210105441](https://static-docs.nocobase.com/20241210105441.png)

### Webhook URL

Webhook tetikleyicisinin URL'si sistem tarafından otomatik olarak oluşturulur ve bu iş akışına bağlanır. Sağdaki düğmeye tıklayarak kopyalayabilir ve üçüncü taraf sisteminize yapıştırabilirsiniz.

Yalnızca POST HTTP yöntemi desteklenir; diğer yöntemler `405` hatası döndürür.

### Güvenlik

Şu anda HTTP Temel Kimlik Doğrulaması desteklenmektedir. Bu seçeneği etkinleştirip bir kullanıcı adı ve parola belirleyerek, üçüncü taraf sistemin Webhook URL'sine kullanıcı adı ve parola bilgilerini dahil edebilir ve böylece Webhook için güvenli kimlik doğrulamasını sağlayabilirsiniz (standart detayları için bkz: [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#basic_authentication_scheme)).

Bir kullanıcı adı ve parola ayarlandığında, sistem istekteki kullanıcı adı ve parolanın eşleşip eşleşmediğini doğrular. Sağlanmaması veya eşleşmemesi durumunda `401` hatası döndürülür.

### İstek Verilerini Ayrıştırma

Üçüncü taraf bir Webhook'u çağırdığında, istekte taşınan verilerin iş akışında kullanılabilmesi için ayrıştırılması gerekir. Ayrıştırma işleminden sonra bu veriler bir tetikleyici değişkeni olarak kullanılabilir ve sonraki düğümlerde referans alınabilir.

HTTP isteğinin ayrıştırılması üç bölümden oluşur:

1.  İstek Başlıkları

    İstek başlıkları genellikle basit dize türünde anahtar-değer çiftleridir. Kullanmanız gereken başlık alanlarını doğrudan yapılandırabilirsiniz; örneğin `Date`, `X-Request-Id` vb.

2.  İstek Parametreleri

    İstek parametreleri, URL'deki sorgu parametreleri kısmıdır; örneğin `http://localhost:13000/api/webhook:trigger/1hfmkioou0d?query=1` adresindeki `query` parametresi. Tam bir örnek URL'yi veya sadece sorgu parametreleri kısmını yapıştırarak, ayrıştırma düğmesine tıklayarak anahtar-değer çiftlerini otomatik olarak ayrıştırabilirsiniz.

    ![20241210111155](https://static-docs.nocobase.com/20241210111155.png)

    Otomatik ayrıştırma, URL'deki parametre kısmını bir JSON yapısına dönüştürür ve parametre hiyerarşisine göre `query[0]`, `query[0].a` gibi yollar oluşturur. Bu yol adları, ihtiyaçlarınızı karşılamadığında manuel olarak değiştirilebilir, ancak genellikle buna gerek yoktur. Takma ad (alias), değişken olarak kullanıldığında değişkenin görünen adıdır ve isteğe bağlıdır. Ayrıştırma aynı zamanda örnekteki tüm parametreleri içeren bir tablo oluşturur; kullanmak istemediğiniz parametreleri silebilirsiniz.

3.  İstek Gövdesi

    İstek gövdesi, HTTP isteğinin Body kısmıdır. Şu anda yalnızca `Content-Type` formatı `application/json` olan istek gövdeleri desteklenmektedir. Ayrıştırılması gereken yolları doğrudan yapılandırabilir veya bir JSON örneği girip ayrıştırma düğmesine tıklayarak otomatik ayrıştırma yapabilirsiniz.

    ![20241210112529](https://static-docs.nocobase.com/20241210112529.png)

    Otomatik ayrıştırma, JSON yapısındaki anahtar-değer çiftlerini yollara dönüştürür. Örneğin, `{"a": 1, "b": {"c": 2}}` yapısı `a`, `b` ve `b.c` gibi yollar oluşturacaktır. Takma ad (alias), değişken olarak kullanıldığında değişkenin görünen adıdır ve isteğe bağlıdır. Ayrıştırma aynı zamanda örnekteki tüm parametreleri içeren bir tablo oluşturur; kullanmak istemediğiniz parametreleri silebilirsiniz.

### Yanıt Ayarları

Webhook yanıtının yapılandırması, senkron ve asenkron iş akışlarında farklılık gösterir. Asenkron iş akışları için yanıt doğrudan tetikleyicide yapılandırılır. Bir Webhook isteği alındığında, tetikleyicide yapılandırılan yanıt hemen üçüncü taraf sisteme döndürülür ve ardından iş akışı yürütülür. Senkron iş akışları ise, iş gereksinimlerine göre akışa bir yanıt düğümü eklenerek ele alınmalıdır (ayrıntılar için bkz: [Yanıt Düğümü](#yanıt-düğümü)).

Genellikle, asenkron olarak tetiklenen bir Webhook olayının yanıt durumu kodu `200` ve yanıt gövdesi `ok` olur. Duruma göre yanıt durumu kodunu, başlıklarını ve gövdesini de özelleştirebilirsiniz.

![20241210114312](https://static-docs.nocobase.com/20241210114312.png)

## Yanıt Düğümü

Referans: [Yanıt Düğümü](../nodes/response.md)

## Örnek

Bir Webhook iş akışında, farklı iş koşullarına göre farklı yanıtlar döndürebilirsiniz, aşağıdaki şekilde gösterildiği gibi:

![20241210120655](https://static-docs.nocobase.com/20241210120655.png)

Koşullu dallanma düğümünü kullanarak belirli bir iş durumunun karşılanıp karşılanmadığını belirleyebilirsiniz. Karşılanırsa başarı yanıtı, aksi takdirde hata yanıtı döndürülür.