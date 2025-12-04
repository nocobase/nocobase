---
pkg: '@nocobase/plugin-workflow-cc'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Bilgilendirme Kopyası <Badge>v1.8.2+</Badge>

## Giriş

Bilgilendirme Kopyası düğümü, bir iş akışı yürütülürken belirli bağlamsal içeriği, kullanıcıların bilgi edinmesi ve incelemesi amacıyla belirlenen kullanıcılara göndermek için kullanılır. Örneğin, bir onay veya başka bir süreçte, ilgili bilgileri diğer katılımcılara CC olarak gönderebilirsiniz, böylece işin ilerleyişi hakkında zamanında bilgi sahibi olabilirler.

Bir iş akışında birden fazla Bilgilendirme Kopyası düğümü ayarlayabilirsiniz. İş akışı bu düğüme ulaştığında, ilgili bilgiler belirlenen alıcılara gönderilecektir.

Bilgilendirme kopyası olarak gönderilen içerik, Yapılacaklar Merkezi'nin "Bana CC'lenenler" menüsünde görüntülenecektir. Kullanıcılar burada kendilerine CC olarak gönderilen tüm içerikleri görebilirler. Ayrıca, okunmamış durumuna göre kullanıcılara henüz görüntülemedikleri CC içerikleri hakkında bildirimde bulunulur. Kullanıcılar içeriği görüntüledikten sonra manuel olarak okundu olarak işaretleyebilirler.

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, akıştaki artı ('+') düğmesine tıklayarak bir "Bilgilendirme Kopyası" düğümü ekleyin:

![抄送_添加](https://static-docs.nocobase.com/20250710222842.png)

## Düğüm Yapılandırması

![节点配置](https://static-docs.nocobase.com/20250710224041.png)

Düğüm yapılandırma arayüzünde aşağıdaki parametreleri ayarlayabilirsiniz:

### Alıcılar

Alıcılar, bilgi kopyasının (CC) hedef kullanıcı koleksiyonudur ve bir veya daha fazla kullanıcıdan oluşabilir. Kaynak, kullanıcı listesinden seçilen statik bir değer, bir değişken tarafından belirtilen dinamik bir değer veya kullanıcılar koleksiyonunda yapılan bir sorgunun sonucu olabilir.

![接收者配置](https://static-docs.nocobase.com/20250710224421.png)

### Kullanıcı Arayüzü

Alıcıların, Yapılacaklar Merkezi'nin "Bana CC'lenenler" menüsünde bilgi kopyası içeriğini görüntülemesi gerekir. İş akışı bağlamındaki tetikleyicinin ve herhangi bir düğümün sonuçlarını içerik blokları olarak yapılandırabilirsiniz.

![用户界面](https://static-docs.nocobase.com/20250710225400.png)

### Görev Başlığı

Görev başlığı, Yapılacaklar Merkezi'nde görüntülenen başlıktır. Başlığı dinamik olarak oluşturmak için iş akışı bağlamındaki değişkenleri kullanabilirsiniz.

![任务标题](https://static-docs.nocobase.com/20250710225603.png)

## Yapılacaklar Merkezi

Kullanıcılar, Yapılacaklar Merkezi'nde kendilerine CC olarak gönderilen tüm içerikleri görüntüleyebilir ve yönetebilir, ayrıca okuma durumuna göre filtreleyip inceleyebilirler.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Görüntüledikten sonra okundu olarak işaretleyebilirsiniz ve okunmamış sayısı buna göre azalacaktır.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)