---
pkg: '@nocobase/plugin-workflow-manual'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Manuel İşlem

## Giriş

İş süreçleri tamamen otomatik olarak karar veremediğinde, bazı karar alma yetkilerini bir kişiye devretmek için manuel bir düğüm kullanabilirsiniz.

Manuel bir düğüm çalıştığında, tüm iş akışının yürütülmesini duraklatır ve ilgili kullanıcı için bir yapılacaklar görevi oluşturur. Kullanıcı görevi gönderdikten sonra, seçilen duruma göre iş akışı devam eder, beklemeye alınır veya sonlandırılır. Onay süreçleri gibi senaryolarda oldukça kullanışlıdır.

## Kurulum

Dahili bir eklentidir, kurulum gerektirmez.

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, iş akışındaki artı ("+") düğmesine tıklayarak "Manuel İşlem" düğümünü ekleyebilirsiniz:

![创建人工节点](https://static-docs.nocobase.com/4dd259f1aceeaf9b825abb4b257df909.png)

## Düğümü Yapılandırma

### Sorumlu

Manuel bir düğüm, yapılacaklar görevinin yürütücüsü olarak bir kullanıcı belirtmelidir. Yapılacaklar görevlerinin listesi, sayfaya bir blok eklenirken eklenebilir ve her düğümün görev açılır penceresi içeriği, düğümün arayüz yapılandırmasında ayarlanmalıdır.

Bir kullanıcı seçin veya bir değişken aracılığıyla bağlamdaki kullanıcı verilerinin birincil veya yabancı anahtarını seçin.

![人工节点_配置_负责人_选择变量](https://static-docs.nocobase.com/22fbca3b8e21fda319037001445.png)

:::info{title=İpucu}
Şu anda, manuel düğümler için sorumlu seçeneği birden fazla kullanıcıyı desteklememektedir. Bu özellik gelecekteki sürümlerde desteklenecektir.
:::

### Kullanıcı Arayüzünü Yapılandırma

Yapılacaklar öğesinin arayüz yapılandırması, manuel düğümün temel içeriğidir. "Kullanıcı arayüzünü yapılandır" düğmesine tıklayarak ayrı bir yapılandırma açılır penceresi açabilir ve tıpkı normal bir sayfa gibi, gördüğünüzü aldığınız şekilde (WYSIWYG) yapılandırabilirsiniz:

![人工节点_节点配置_界面配置](https://static-docs.nocobase.com/fd360168c879743cf22d57440cd2590f.png)

#### Sekmeler

Sekmeler, farklı içerikleri ayırmak için kullanılabilir. Örneğin, bir sekme onaylanmış bir form gönderimi için, diğeri reddedilmiş bir form gönderimi için veya ilgili verilerin ayrıntılarını görüntülemek için kullanılabilir. Serbestçe yapılandırılabilirler.

#### Bloklar

Desteklenen blok türleri temel olarak iki ana kategoriye ayrılır: veri blokları ve form blokları. Ayrıca, Markdown genellikle bilgilendirme mesajları gibi statik içerikler için kullanılır.

##### Veri Bloğu

Veri blokları, tetikleyici verileri veya herhangi bir düğümün işlem sonuçlarını gösterebilir ve yapılacaklar sorumlusuna ilgili bağlamsal bilgileri sağlayabilir. Örneğin, iş akışı bir form olayı tarafından tetikleniyorsa, tetikleyici veriler için bir ayrıntı bloğu oluşturabilirsiniz. Bu, normal bir sayfanın ayrıntı yapılandırmasıyla tutarlıdır ve tetikleyici verilerdeki herhangi bir alanı görüntülemek için seçmenize olanak tanır:

![人工节点_节点配置_界面配置_数据区块_触发器](https://static-docs.nocobase.com/675c3e58a1a4f45db310a72c2d0a404c.png)

Düğüm veri blokları da benzerdir; ayrıntı olarak görüntülemek üzere yukarı akış bir düğümden gelen veri sonucunu seçebilirsiniz. Örneğin, yukarı akış bir hesaplama düğümünün sonucu, sorumlunun yapılacaklar görevi için bağlamsal referans bilgisi olarak hizmet edebilir:

![人工节点_节点配置_界面配置_数据区块_节点数据](https://static-docs.nocobase.com/a583e26e508e954b47e5ddff80d998c4.png)

:::info{title=İpucu}
Arayüz yapılandırması sırasında iş akışı yürütülmemiş durumda olduğundan, veri bloklarında belirli bir veri görüntülenmez. Belirli bir iş akışı örneğine ait ilgili veriler, iş akışı tetiklenip yürütüldükten sonra yalnızca yapılacaklar açılır pencere arayüzünde görülebilir.
:::

##### Form Bloğu

Yapılacaklar arayüzünde, iş akışının devam edip etmeyeceğine dair nihai karar işleme için en az bir form bloğu yapılandırılmalıdır. Bir form yapılandırılmazsa, iş akışı kesintiye uğradıktan sonra devam edemez. Üç tür form bloğu vardır:

- Özel form
- Kayıt oluşturma formu
- Kayıt güncelleme formu

![人工节点_节点配置_界面配置_表单类型](https://static-docs.nocobase.com/2d068f3012ab07e32a265405492104a8.png)

Kayıt oluşturma formları ve kayıt güncelleme formları, temel bir koleksiyon seçmeyi gerektirir. Yapılacaklar kullanıcısı gönderimi yaptıktan sonra, formdaki değerler belirtilen koleksiyondaki verileri oluşturmak veya güncellemek için kullanılacaktır. Özel bir form, bir koleksiyona bağlı olmayan geçici bir formu serbestçe tanımlamanıza olanak tanır. Yapılacaklar kullanıcısı tarafından gönderilen alan değerleri, sonraki düğümlerde kullanılabilir.

Formun gönderme düğmeleri üç türe göre yapılandırılabilir:

- Gönder ve iş akışına devam et
- Gönder ve iş akışını sonlandır
- Yalnızca form değerlerini kaydet

![人工节点_节点配置_界面配置_表单按钮](https://static-docs.nocobase.com/6b45995b14152e85a821dff6f6e3189a.png)

Bu üç düğme, iş akışı sürecindeki üç düğüm durumunu temsil eder. Gönderimden sonra, düğümün durumu "Tamamlandı", "Reddedildi" olarak değişir veya "Beklemede" kalır. Tüm iş akışının sonraki akışını belirlemek için bir formda ilk ikisinden en az biri yapılandırılmalıdır.

"İş akışına devam et" düğmesinde, form alanları için atamalar yapılandırabilirsiniz:

![人工节点_节点配置_界面配置_表单按钮_设置表单值](https://static-docs.nocobase.com/2cec2d4e2957f068877e616dec3b56dd.png)

![人工节点_节点配置_界面配置_表单按钮_设置表单值弹窗](https://static-docs.nocobase.com/5ff51b60c76cdb76e6f1cc95dc3d8640.png)

Açılır pencereyi açtıktan sonra, herhangi bir form alanına değer atayabilirsiniz. Form gönderildikten sonra, bu değer alanın nihai değeri olacaktır. Bu, özellikle verileri incelerken kullanışlıdır. Bir formda birden fazla farklı "İş akışına devam et" düğmesi kullanabilir, her düğme durum gibi alanlar için farklı numaralandırma değerleri ayarlayarak, sonraki iş akışı yürütmesini farklı veri değerleriyle devam ettirme etkisini elde edebilirsiniz.

## Yapılacaklar Bloğu

Manuel işlem için, yapılacaklar görevlerini görüntülemek üzere bir sayfaya bir yapılacaklar listesi de eklemeniz gerekir. Bu, ilgili personelin bu liste aracılığıyla manuel düğümün belirli görev işlemlerine erişmesini ve bunları yönetmesini sağlar.

### Blok Ekleme

Bir sayfadaki bloklardan "İş Akışı Yapılacaklar" seçeneğini belirleyerek bir yapılacaklar listesi bloğu ekleyebilirsiniz:

![人工节点_添加待办区块](https://static-docs.nocobase.com/198b41754cd73b704267bf30fe5e647.png)

Yapılacaklar listesi bloğu örneği:

![人工节点_待办列表](https://static-docs.nocobase.com/cfefb06a91c5c9dfa550d6b220f34.png)

### Yapılacaklar Ayrıntıları

Daha sonra, ilgili personel ilgili yapılacaklar görevine tıklayarak yapılacaklar açılır penceresini açabilir ve manuel işlemi gerçekleştirebilir:

![人工节点_待办详情](https://static-docs.nocobase.com/ccfd0533deebff6b3f6ef4408066e688.png)

## Örnek

### Yazı İncelemesi

Normal bir kullanıcının gönderdiği bir yazının, yayınlanmış duruma güncellenmeden önce bir yönetici tarafından onaylanması gerektiğini varsayalım. İş akışı reddedilirse, yazı taslak durumunda (herkese açık değil) kalacaktır. Bu süreç, manuel bir düğümdeki güncelleme formu kullanılarak uygulanabilir.

"Yazı Oluştur" tarafından tetiklenen bir iş akışı oluşturun ve bir manuel düğüm ekleyin:

<figure>
  <img alt="人工节点_示例_文章审核_流程编排" src="https://github.com/nocobase/nocobase/assets/525658/2021bf42-f372-4f69-9c84-5a786c061e0e" width="360" />
</figure>

Manuel düğümde, sorumlu olarak bir yöneticiyi yapılandırın. Arayüz yapılandırmasında, yeni yazının ayrıntılarını görüntülemek için tetikleyici verilere dayalı bir blok ekleyin:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_详情区块" src="https://github.com/nocobase/nocobase/assets/525658/c61d0aac-23cb-4387-b60e-ce3cc7bf1c24" width="680" />
</figure>

Arayüz yapılandırmasında, bir kayıt güncelleme formuna dayalı bir blok ekleyin, yönetici tarafından onaylanıp onaylanmayacağına karar vermek için yazı koleksiyonunu seçin. Onaydan sonra, ilgili yazı diğer sonraki yapılandırmalara göre güncellenecektir. Formu ekledikten sonra, varsayılan olarak "İş akışına devam et" düğmesi olacaktır, bu düğme tıklanınca onay olarak kabul edilebilir. Ardından, reddetme durumu için kullanılmak üzere bir "İş akışını sonlandır" düğmesi ekleyin:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_表单和操作" src="https://github.com/nocobase/nocobase/assets/525658/4baaf41e-3d81-4ee8-a038-29db05e0d99f" width="673" />
</figure>

İş akışına devam ederken, yazının durumunu güncellememiz gerekiyor. Bunu yapılandırmanın iki yolu vardır. Birincisi, yazının durum alanını doğrudan formda operatörün seçmesi için görüntülemektir. Bu yöntem, geri bildirim sağlama gibi aktif form doldurma gerektiren durumlar için daha uygundur:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_表单字段" src="https://github.com/nocobase/nocobase/assets/525658/82ea4e0e-25fc-4921-841e-e1a2782a87d1" width="668" />
</figure>

Operatörün görevini basitleştirmek için başka bir yol, "İş akışına devam et" düğmesinde form değeri ataması yapılandırmaktır. Atamada, değeri "Yayınlandı" olan bir "Durum" alanı ekleyin. Bu, operatör düğmeye tıkladığında yazının yayınlanmış duruma güncelleneceği anlamına gelir:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_表单赋值" src="https://github.com/nocobase/nocobase/assets/525658/0340bd9f-8323-4e4f-bc5a-8f81be3d6736" width="711" />
</figure>

Ardından, form bloğunun sağ üst köşesindeki yapılandırma menüsünden güncellenecek veriler için filtre koşulunu seçin. Burada "Yazılar" koleksiyonunu seçin ve filtre koşulu "ID `eşittir` Tetikleyici değişkeni / Tetikleyici verisi / ID" şeklindedir:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_表单条件" src="https://github.com/nocobase/nocobase/assets/525658/da004055-0262-49ae-88dd-3844f3c92e28" width="1020" />
</figure>

Son olarak, arayüzü daha kullanıcı dostu hale getirmek için her bir bloğun başlıklarını, ilgili düğmelerin metinlerini ve form alanlarının ipucu metinlerini değiştirebilirsiniz:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_最终表单" src="https://github.com/nocobase/nocobase/assets/525658/21db5f6b-690b-49c1-8259-4f7b8874620d" width="678" />
</figure>

Yapılandırma panelini kapatın ve düğüm yapılandırmasını kaydetmek için gönder düğmesine tıklayın. İş akışı artık yapılandırılmıştır. Bu iş akışı etkinleştirildikten sonra, yeni bir yazı oluşturulduğunda otomatik olarak tetiklenecektir. Yönetici, bu iş akışının yapılacaklar görev listesinden işlenmesi gerektiğini görebilir. Görüntülemek için tıkladığında, yapılacaklar görevinin ayrıntılarını görebilir:

<figure>
  <img alt="人工节点_示例_文章审核_待办列表" src="https://github.com/nocobase/nocobase/assets/525658/4e1748cd-6a07-4045-82e5-286826607826" width="1363" />
</figure>

<figure>
  <img alt="人工节点_示例_文章审核_待办详情" src="https://github.com/nocobase/nocobase/assets/525658/65f01fb1-8cb0-45f8-ac21-ec8ab59be449" width="680" />
</figure>

Yönetici, yazı ayrıntılarına göre yazının yayınlanıp yayınlanamayacağına dair manuel bir karar verebilir. Eğer yayınlanabilirse, "Onayla" düğmesine tıklamak yazıyı yayınlanmış duruma güncelleyecektir. Eğer yayınlanamazsa, "Reddet" düğmesine tıklamak yazıyı taslak durumunda tutacaktır.

## İzin Onayı

Bir çalışanın izin alması gerektiğini ve bu iznin yürürlüğe girmesi için bir amir tarafından onaylanması gerektiğini ve ilgili çalışanın izin verilerinin düşülmesi gerektiğini varsayalım. Onaylansın veya reddedilsin, bir HTTP isteği düğümü aracılığıyla bir SMS API'si çağrılarak çalışana ilgili bildirim SMS'i gönderilecektir ([HTTP İsteği](#_HTTP_请求) bölümüne bakın). Bu senaryo, manuel bir düğümdeki özel bir form kullanılarak uygulanabilir.

"İzin Talebi Oluştur" tarafından tetiklenen bir iş akışı oluşturun ve bir manuel düğüm ekleyin. Bu, önceki yazı inceleme sürecine benzer, ancak burada sorumlu amirdir. Arayüz yapılandırmasında, yeni izin talebinin ayrıntılarını görüntülemek için tetikleyici verilere dayalı bir blok ekleyin. Ardından, amirin onayı verip vermeyeceğine karar vermesi için özel bir forma dayalı başka bir blok ekleyin. Özel formda, onay durumu için bir alan ve reddetme nedeni için bir alan ekleyin:

<figure>
  <img alt="人工节点_示例_请假审批_节点配置" src="https://github.com/nocobase/nocobase/assets/525658/ef3bc7b8-56e8-4a4e-826e-ffd0b547d1b6" width="675" />
</figure>

Yazı inceleme sürecinden farklı olarak, amirin onay sonucuna göre sonraki süreci devam ettirmemiz gerektiğinden, burada "İş akışını sonlandır" düğmesini kullanmak yerine, gönderim için yalnızca bir "İş akışına devam et" düğmesi yapılandırıyoruz.

Aynı zamanda, manuel düğümden sonra, amirin izin talebini onaylayıp onaylamadığını belirlemek için bir koşul düğümü kullanabiliriz. Onay dalında, izin düşme veri işlemini ekleyin ve dallar birleştikten sonra, çalışana SMS bildirimi göndermek için bir istek düğümü ekleyin. Bu, aşağıdaki eksiksiz iş akışını sağlar:

<figure>
  <img alt="人工节点_示例_请假审批_流程编排" src="https://github.com/nocobase/nocobase/assets/525658/733f68da-e44f-4172-9772-a287ac2724f2" width="593" />
</figure>

Koşul düğümündeki koşul yapılandırması şu şekildedir: "Manuel düğüm / Özel form verileri / Onay alanının değeri 'Onaylandı' mı?":

<figure>
  <img alt="人工节点_示例_请假审批_条件判断" src="https://github.com/nocobase/nocobase/assets/525658/57b972f0-a3ce-4f33-8d40-4272ad205c20" width="678" />
</figure>

İstek gönderme düğümündeki veriler, onay ve ret SMS içeriklerini ayırt etmek için manuel düğümdeki ilgili form değişkenlerini de kullanabilir. Böylece tüm iş akışı yapılandırması tamamlanmış olur. İş akışı etkinleştirildikten sonra, bir çalışan izin talep formunu gönderdiğinde, amir yapılacaklar görevlerinde onayı işleyebilir. İşlem temel olarak yazı inceleme sürecine benzer.