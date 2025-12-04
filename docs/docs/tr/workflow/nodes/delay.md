:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Gecikme

## Giriş

Gecikme düğümü, bir iş akışına gecikme eklemenizi sağlar. Gecikme sona erdiğinde, yapılandırmaya bağlı olarak sonraki düğümlerin yürütülmesine devam edebilir veya iş akışını erken sonlandırabilir.

Bu düğüm genellikle Paralel Dal düğümü ile birlikte kullanılır. Zaman aşımı sonrası işlemleri yönetmek amacıyla dallardan birine bir Gecikme düğümü ekleyebilirsiniz. Örneğin, paralel bir dalda bir taraf manuel bir işlem içerirken, diğer taraf bir Gecikme düğümü içerebilir. Manuel işlem zaman aşımına uğradığında, eğer "zaman aşımında başarısız ol" şeklinde ayarlanmışsa, manuel işlemin belirli bir süre içinde tamamlanması gerekir. Eğer "zaman aşımında devam et" şeklinde ayarlanmışsa, süre dolduktan sonra manuel işlem göz ardı edilebilir.

## Kurulum

Dahili bir eklentidir, kurulum gerektirmez.

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, akıştaki artı ("+") düğmesine tıklayarak bir "Gecikme" düğümü ekleyebilirsiniz:

![Gecikme Düğümü Oluştur](https://static-docs.nocobase.com/d0816999c9f7acaec1c409bd8fb6cc36.png)

## Düğüm Yapılandırması

![Gecikme Düğümü_Düğüm Yapılandırması](https://static-docs.nocobase.com/5fe8a36535f20a087a0148ffa1cd2aea.png)

### Gecikme Süresi

Gecikme süresi için bir sayı girebilir ve bir zaman birimi seçebilirsiniz. Desteklenen zaman birimleri şunlardır: saniye, dakika, saat, gün ve hafta.

### Zaman Aşımı Durumu

Zaman aşımı durumu için "Geç ve devam et" veya "Başarısız ol ve çık" seçeneklerini belirleyebilirsiniz. "Geç ve devam et" seçeneği, gecikme sona erdikten sonra iş akışının sonraki düğümleri yürütmeye devam edeceği anlamına gelir. "Başarısız ol ve çık" seçeneği ise, gecikme sona erdiğinde iş akışının başarısız bir durumla erken sonlanacağı anlamına gelir.

## Örnek

Bir iş emrinin başlatıldıktan sonra belirli bir süre içinde yanıtlanması gereken bir senaryoyu ele alalım. Bu durumda, iki paralel daldan birine manuel bir düğüm, diğerine ise bir Gecikme düğümü eklememiz gerekir. Eğer manuel işleme 10 dakika içinde yanıt verilmezse, iş emrinin durumu "zaman aşımına uğradı ve işlenmedi" olarak güncellenir.

![Gecikme Düğümü_Örnek_Akış Organizasyonu](https://static-docs.nocobase.com/898c84adc376dc211b003a62e16e8e5b.png)