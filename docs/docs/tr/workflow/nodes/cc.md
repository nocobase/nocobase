---
pkg: '@nocobase/plugin-workflow-cc'
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/workflow/nodes/cc) bakın.
:::

# Bilgilendirme Kopyası (CC) <Badge>v1.8.2+</Badge>

## Giriş

Bilgilendirme kopyası (CC) düğümü, iş akışı yürütme sürecindeki belirli bağlamsal içeriği, bilgi edinmeleri ve incelemeleri için belirtilen kullanıcılara göndermek amacıyla kullanılır. Örneğin, bir onay veya başka bir süreçte, ilgili bilgiler diğer katılımcılara CC olarak gönderilebilir, böylece işin ilerleyişinden zamanında haberdar olabilirler.

İş akışında birden fazla CC düğümü ayarlayabilirsiniz; böylece iş akışı bu düğüme ulaştığında ilgili bilgiler belirlenen alıcılara gönderilir.

CC içeriği, Yapılacaklar Merkezi'ndeki "Bana CC'lenenler" menüsünde görüntülenir; kullanıcılar kendilerine gönderilen tüm içerikleri buradan görebilirler. Ayrıca, okunmamış durumuna göre henüz incelenmemiş içerikler vurgulanır ve kullanıcılar bunları görüntüledikten sonra manuel olarak okundu olarak işaretleyebilirler.

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, akıştaki artı ("+") düğmesine tıklayarak "Bilgilendirme Kopyası" düğümünü ekleyin:

![抄送_添加](https://static-docs.nocobase.com/20250710222842.png)

## Düğüm Yapılandırması

![节点配置](https://static-docs.nocobase.com/20250710224041.png)

Düğüm yapılandırma arayüzünde aşağıdaki parametreleri ayarlayabilirsiniz:

### Alıcılar

Alıcılar, CC yapılacak hedef kullanıcıların bir koleksiyonudur ve bir veya daha fazla kullanıcıdan oluşabilir. Kaynak; kullanıcı listesinden seçilen statik bir değer, bir değişken tarafından belirtilen dinamik bir değer veya kullanıcılar koleksiyonundaki bir sorgunun sonucu olabilir.

![接收者配置](https://static-docs.nocobase.com/20250710224421.png)

### Kullanıcı Arayüzü

Alıcıların, Yapılacaklar Merkezi'ndeki "Bana CC'lenenler" menüsünde CC içeriğini görüntülemesi gerekir. İş akışı bağlamındaki tetikleyici ve herhangi bir düğümün sonuçlarını içerik blokları olarak yapılandırabilirsiniz.

![用户界面](https://static-docs.nocobase.com/20250710225400.png)

### Görev Kartı <Badge>2.0+</Badge>

Yapılacaklar Merkezi'ndeki "Bana CC'lenenler" listesinde yer alan görev kartlarını yapılandırmak için kullanılır.

![20260213010947](https://static-docs.nocobase.com/20260213010947.png)

Kart üzerinde, görüntülenmesini istediğiniz iş alanlarını (ilişki alanları hariç) serbestçe yapılandırabilirsiniz.

İş akışı CC görevi oluşturulduktan sonra, özelleştirilmiş görev kartı Yapılacaklar Merkezi listesinde görülebilir:

![20260214124325](https://static-docs.nocobase.com/20260214124325.png)

### Görev Başlığı

Görev başlığı, Yapılacaklar Merkezi'nde görüntülenen başlıktır; başlığı dinamik olarak oluşturmak için iş akışı bağlamındaki değişkenleri kullanabilirsiniz.

![任务标题](https://static-docs.nocobase.com/20250710225603.png)

## Yapılacaklar Merkezi

Kullanıcılar, Yapılacaklar Merkezi'nde kendilerine CC olarak gönderilen tüm içerikleri görüntüleyebilir, yönetebilir ve okuma durumuna göre filtreleyebilirler.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Görüntüledikten sonra okundu olarak işaretleyebilirsiniz, böylece okunmamış sayısı azalacaktır.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)