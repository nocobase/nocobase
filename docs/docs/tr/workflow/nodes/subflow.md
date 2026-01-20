---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# İş Akışı Çağırma

## Giriş

Bir iş akışı içinde başka iş akışlarını çağırmak için kullanılır. Mevcut iş akışındaki değişkenleri alt iş akışının girişi olarak kullanabilir, alt iş akışının çıktısını ise mevcut iş akışında sonraki düğümlerde kullanılacak değişkenler olarak değerlendirebilirsiniz.

Bir iş akışını çağırma süreci aşağıdaki görselde gösterilmiştir:

![20241230134634](https://static-docs.nocobase.com/20241230134634.png)

İş akışlarını çağırarak, e-posta veya SMS gönderme gibi yaygın süreç mantıklarını yeniden kullanabilir veya karmaşık bir iş akışını yönetimi ve bakımı kolaylaştırmak amacıyla birden fazla alt iş akışına bölebilirsiniz.

Esasen, bir iş akışı bir sürecin alt iş akışı olup olmadığını ayırt etmez. Herhangi bir iş akışı, başka iş akışları tarafından alt iş akışı olarak çağrılabilir veya kendisi başka iş akışlarını çağırabilir. Tüm iş akışları eşittir; yalnızca çağırma ve çağrılma ilişkisi mevcuttur.

Benzer şekilde, bir iş akışını çağırma işlemi iki farklı yerde gerçekleşir:

1.  Ana iş akışında: Çağıran taraf olarak, "İş Akışı Çağır" düğümü aracılığıyla diğer iş akışlarını çağırır.
2.  Alt iş akışında: Çağrılan taraf olarak, "İş Akışı Çıktısı" düğümü aracılığıyla mevcut iş akışından dışarı aktarılması gereken değişkenleri kaydeder; bu değişkenler, kendisini çağıran iş akışındaki sonraki düğümler tarafından kullanılabilir.

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, iş akışındaki artı ("+") düğmesine tıklayarak bir "İş Akışı Çağır" düğümü ekleyin:

![Add Invoke Workflow Node](https://static-docs.nocobase.com/20241230001323.png)

## Düğümü Yapılandırma

### İş Akışı Seçimi

Çağırmak istediğiniz iş akışını seçin. Hızlı arama için arama kutusunu kullanabilirsiniz:

![Select Workflow](https://static-docs.nocobase.com/20241230001534.png)

:::info{title=İpucu}
*   Devre dışı bırakılmış iş akışları da alt iş akışı olarak çağrılabilir.
*   Mevcut iş akışı senkron moddayken, yalnızca senkron moddaki alt iş akışlarını çağırabilir.
:::

### İş Akışı Tetikleyici Değişkenlerini Yapılandırma

Bir iş akışı seçtikten sonra, alt iş akışını tetiklemek için giriş verisi olarak tetikleyicinin değişkenlerini de yapılandırmanız gerekir. Doğrudan statik verileri seçebilir veya mevcut iş akışındaki değişkenleri kullanabilirsiniz:

![Configure Trigger Variables](https://static-docs.nocobase.com/20241230162722.png)

Farklı tetikleyici türleri farklı değişkenler gerektirir; bunları form üzerinde ihtiyacınıza göre yapılandırabilirsiniz.

## İş Akışı Çıktı Düğümü

Alt iş akışının çıktı değişkenlerini yapılandırmak için [İş Akışı Çıktısı](./output.md) düğümünün içeriğine başvurun.

## İş Akışı Çıktısını Kullanma

Ana iş akışına geri döndüğünüzde, "İş Akışı Çağır" düğümünün altındaki diğer düğümlerde, alt iş akışının çıktı değerini kullanmak istediğinizde, "İş Akışı Çağır" düğümünün sonucunu seçebilirsiniz. Eğer alt iş akışı bir dize, sayı, mantıksal değer, tarih (tarih UTC formatında bir dizedir) gibi basit bir değer döndürüyorsa, doğrudan kullanılabilir. Eğer karmaşık bir nesne (örneğin bir koleksiyondaki nesne) ise, özelliklerini kullanabilmek için önce bir JSON Ayrıştırma düğümü aracılığıyla eşlenmesi gerekir; aksi takdirde yalnızca tüm nesne olarak kullanılabilir.

Eğer alt iş akışında bir "İş Akışı Çıktısı" düğümü yapılandırılmamışsa veya herhangi bir çıktı değeri yoksa, ana iş akışında "İş Akışı Çağır" düğümünün sonucunu kullandığınızda yalnızca boş bir değer (`null`) elde edersiniz.