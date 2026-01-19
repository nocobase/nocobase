---
pkg: "@nocobase/plugin-workflow-response-message"
---

:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# HTTP Yanıtı

## Giriş

Bu düğüm, yalnızca senkron Webhook iş akışlarında desteklenir ve üçüncü taraf sistemlere yanıt döndürmek için kullanılır. Örneğin, bir ödeme geri bildirimi (callback) işlenirken, iş sürecinde beklenmedik bir sonuç (hata veya başarısızlık gibi) oluşursa, yanıt düğümünü kullanarak üçüncü taraf sisteme bir hata yanıtı döndürebilirsiniz. Bu sayede, bazı üçüncü taraf sistemler duruma göre daha sonra tekrar deneme yapabilir.

Ayrıca, yanıt düğümünün yürütülmesi, iş akışının yürütülmesini sonlandırır ve sonraki düğümler yürütülmez. Eğer tüm iş akışında bir yanıt düğümü yapılandırılmamışsa, sistem akışın yürütme durumuna göre otomatik olarak yanıt verir: başarılı yürütme için `200` ve başarısız yürütme için `500` döndürür.

## Yanıt Düğümü Oluşturma

İş akışı yapılandırma arayüzünde, akıştaki artı ("+") düğmesine tıklayarak bir "Yanıt" düğümü ekleyebilirsiniz:

![20241210115120](https://static-docs.nocobase.com/20241210115120.png)

## Yanıt Yapılandırması

![20241210115500](https://static-docs.nocobase.com/20241210115500.png)

Yanıt gövdesinde iş akışı bağlamındaki değişkenleri kullanabilirsiniz.