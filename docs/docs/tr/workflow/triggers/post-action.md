---
pkg: '@nocobase/plugin-workflow-action-trigger'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# İşlem Sonrası Olay

## Giriş

Sistemdeki tüm kullanıcı kaynaklı veri değişiklikleri genellikle bir işlem aracılığıyla gerçekleştirilir. Bu işlem genellikle bir düğmeye tıklama şeklinde olur; bu düğme bir formdaki gönder düğmesi veya bir veri bloğundaki bir işlem düğmesi olabilir. İşlem sonrası olaylar, bu düğme işlemlerine ilgili iş akışlarını bağlamak için kullanılır, böylece kullanıcı işlemi başarıyla tamamladığında belirli bir sürecin tetiklenmesi sağlanır.

Örneğin, veri eklerken veya güncellerken, kullanıcılar bir düğmenin "İş akışı bağla" seçeneğini yapılandırabilirler. İşlem tamamlandıktan sonra, bağlı iş akışı tetiklenir.

Uygulama düzeyinde, işlem sonrası olayların işlenmesi ara katman yazılımı (Koa'nın ara katman yazılımı) seviyesinde gerçekleştiği için, NocoBase'e yapılan HTTP API çağrıları da tanımlanmış işlem sonrası olayları tetikleyebilir.

## Kurulum

Bu, yerleşik bir eklentidir, kurulum gerektirmez.

## Tetikleyici Yapılandırması

### İş Akışı Oluşturma

Bir iş akışı oluştururken, tür olarak "İşlem Sonrası Olay" seçeneğini belirleyin:

![创建工作流_操作后事件触发器](https://static-docs.nocobase.com/13c87035ec1bb7332514676d3e896007.png)

### Çalıştırma Modu

İşlem sonrası olaylar için, oluştururken çalıştırma modunu "Senkron" veya "Asenkron" olarak da seçebilirsiniz:

![创建工作流_选择同步或异步](https://static-docs.nocobase.com/bc83525c7e539d578f9e2e20baf9ab69.png)

Kullanıcı işlemi sonrasında hemen yürütülmesi ve sonuç döndürmesi gereken bir süreçse senkron modu kullanabilirsiniz; aksi takdirde varsayılan olarak asenkron mod kullanılır. Asenkron modda, iş akışı tetiklendikten hemen sonra işlem tamamlanır ve iş akışı uygulamanın arka planında bir kuyrukta sırayla yürütülür.

### Koleksiyon Yapılandırması

İş akışı tuvaline girin, yapılandırma açılır penceresini açmak için tetikleyiciye tıklayın ve öncelikle bağlanacak koleksiyonu seçmeniz gerekir:

![工作流配置_选择数据表](https://static-docs.nocobase.com/35c49a71eba731127edcf76719c97634.png)

### Tetikleme Modunu Seçme

Ardından, yerel veya global olmak üzere iki tetikleme modundan birini seçin:

![工作流配置_选择触发模式](https://static-docs.nocobase.com/317809c48b2f2a2d38aedc7d08abdadc.png)

Bunlar:

*   Yerel mod, yalnızca bu iş akışının bağlı olduğu işlem düğmelerinde tetiklenir. Bu iş akışının bağlı olmadığı düğmelere tıklamak tetiklemeyecektir. Farklı amaçlara sahip formların aynı süreci tetikleyip tetiklemeyeceği göz önünde bulundurularak bu iş akışının bağlanıp bağlanmayacağına karar verebilirsiniz.
*   Global mod ise koleksiyonun tüm yapılandırılmış işlem düğmelerinde tetiklenir; hangi formdan geldiğine bakılmaksızın ve ilgili iş akışını bağlamaya gerek kalmadan çalışır.

Yerel modda, şu anda bağlanmayı destekleyen işlem düğmeleri şunlardır:

*   Yeni ekleme formundaki "Gönder" ve "Kaydet" düğmeleri.
*   Güncelleme formundaki "Gönder" ve "Kaydet" düğmeleri.
*   Veri satırlarındaki (tablo, liste, kanban vb.) "Veriyi Güncelle" düğmesi.

### İşlem Türünü Seçme

Global modu seçtiyseniz, işlem türünü de seçmeniz gerekir. Şu anda "Veri oluşturma işlemi" ve "Veri güncelleme işlemi" desteklenmektedir. Her iki işlem de başarılı olduktan sonra iş akışını tetikler.

### Ön Yüklenecek İlişkisel Veriyi Seçme

Tetikleyici verinin ilişkili verilerini sonraki süreçlerde kullanmanız gerekiyorsa, ön yüklenmesi gereken ilişkisel alanları seçebilirsiniz:

![工作流配置_预加载关系](https://static-docs.nocobase.com/5cded063509c7ba1d34f49bec8d68227.png)

Tetiklendikten sonra, bu ilişkili verileri süreç içinde doğrudan kullanabilirsiniz.

## İşlem Yapılandırması

Yerel tetikleme modundaki işlemler için, iş akışı yapılandırıldıktan sonra kullanıcı arayüzüne geri dönmeniz ve ilgili veri bloğunun form işlem düğmesine bu iş akışını bağlamanız gerekir.

"Gönder" düğmesi (ve "Veriyi kaydet" düğmesi dahil) için yapılandırılan iş akışları, kullanıcı ilgili formu gönderdikten ve veri işlemi tamamlandıktan sonra tetiklenecektir.

![操作后事件_提交按钮](https://static-docs.nocobase.com/ae12d219b8400d75b395880ec4cb2bda.png)

Düğme yapılandırma menüsünden "İş akışı bağla" seçeneğini seçerek bağlama yapılandırma açılır penceresini açabilirsiniz. Bu pencerede, tetiklenecek istediğiniz sayıda iş akışını yapılandırabilirsiniz; hiçbiri yapılandırılmazsa, tetiklemeye gerek olmadığı anlamına gelir. Her bir iş akışı için, öncelikle tetiklenecek verinin tüm form verisi mi yoksa formdaki belirli bir ilişkisel alanın verisi mi olduğunu belirtmeniz gerekir. Ardından, seçilen veri modeline karşılık gelen koleksiyona göre, bu koleksiyon modeline uygun olarak yapılandırılmış form iş akışını seçin.

![操作后事件_绑定工作流配置_上下文选择](https://static-docs.nocobase.com/358315fc175849a7fbadbe3276ac6fed.png)

![操作后事件_绑定工作流配置_工作流选择](https://static-docs.nocobase.com/175a71a61b93540cce62a1cb124eb0b5.png)

:::info{title="Not"}
İş akışının yukarıdaki arayüzde seçilebilmesi için etkinleştirilmiş olması gerekir.
:::

## Örnek

Burada, bir oluşturma işlemi aracılığıyla bir gösterim yapılacaktır.

Bir "Masraf Talep" senaryosu düşünelim. Bir çalışanın masraf talebini göndermesinin ardından, tutarın otomatik olarak incelenmesi ve limitin üzerindeki tutarlar için manuel inceleme yapılması gerekmektedir. Yalnızca incelemeyi geçen talepler onaylanır ve ardından finans departmanına işlenmek üzere iletilir.

Öncelikle, aşağıdaki alanlara sahip bir "Masraf Talebi" koleksiyonu oluşturabiliriz:

- Proje Adı: Tek Satırlık Metin
- Başvuran: Çoktan-Bire (Kullanıcı)
- Tutar: Sayı
- Durum: Tek Seçim ("Onaylandı", "İşlem Tamamlandı")

Ardından, "İşlem Sonrası Olay" türünde bir iş akışı oluşturun ve tetikleyicideki koleksiyon modelini "Masraf Talebi" koleksiyonu olarak yapılandırın:

![示例_触发器配置_选择数据表](https://static-docs.nocobase.com/6e1abb5c3e1198038676115943714f07.png)

İş akışını etkin duruma getirdikten sonra, sürecin belirli işlem düğümlerini daha sonra yapılandırmak üzere geri döneceğiz.

Daha sonra arayüzde "Masraf Talebi" koleksiyonu için bir tablo bloğu oluşturur, araç çubuğuna bir "Ekle" düğmesi ekler ve ilgili form alanlarını yapılandırırız. Formun "Gönder" işlem düğmesinin yapılandırma seçeneklerinde, düğmenin "İş akışı bağla" yapılandırma iletişim kutusunu açar, tüm form verisini bağlam olarak seçer ve daha önce oluşturduğumuz iş akışını belirleriz:

![示例_表单按钮配置_绑定工作流](https://static-docs.nocobase.com/fc00bdcdb975bb8850e5cab235f854f3.png)

Form yapılandırması tamamlandıktan sonra, iş akışının mantık düzenlemesine geri dönün. Örneğin, tutar 500 TL'den fazla olduğunda bir yöneticinin manuel inceleme yapmasını isteriz, aksi takdirde doğrudan onaylanır. Onaylandıktan sonra bir masraf talebi kaydı oluşturulur ve finans departmanı tarafından daha fazla işlenir (atlandı).

![示例_处理流程](https://static-docs.nocobase.com/059e8e3d5ffb34cc2da6880fa3dc490b.png)

Finans departmanının sonraki işlemlerini göz ardı edersek, masraf talebi sürecinin yapılandırması tamamlanmış olur. Bir çalışan masraf talebini doldurup gönderdiğinde, ilgili iş akışı tetiklenecektir. Eğer masraf tutarı 500'den az ise, otomatik olarak bir kayıt oluşturulacak ve finansın daha fazla işlem yapması beklenecektir. Aksi takdirde, bir yönetici tarafından incelenecek ve onaylandıktan sonra yine bir kayıt oluşturularak finans departmanına teslim edilecektir.

Bu örnekteki süreç, normal bir "Gönder" düğmesi üzerinde de yapılandırılabilir. Belirli iş senaryosuna göre, sonraki süreçleri yürütmeden önce bir kayıt oluşturmanın gerekip gerekmediğine karar verebilirsiniz.

## Harici Çağrı

İşlem sonrası olayların tetiklenmesi yalnızca kullanıcı arayüzü işlemleriyle sınırlı değildir; HTTP API çağrıları aracılığıyla da tetiklenebilir.

:::info{title="Not"}
Bir HTTP API çağrısı aracılığıyla işlem sonrası bir olayı tetiklerken, iş akışının etkin durumda olup olmadığına ve koleksiyon yapılandırmasının eşleşip eşleşmediğine dikkat etmeniz gerekir, aksi takdirde çağrı başarılı olmayabilir veya bir hata oluşabilir.
:::

Bir işlem düğmesine yerel olarak bağlı iş akışları için, aşağıdaki gibi çağrı yapabilirsiniz (`posts` koleksiyonunun oluşturma düğmesini örnek alarak):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Burada URL parametresi `triggerWorkflows`, iş akışının anahtarıdır ve birden fazla iş akışı virgülle ayrılır. Bu anahtar, iş akışı tuvalinin üst kısmındaki iş akışı adının üzerine fareyle gelindiğinde elde edilebilir:

![工作流_key_查看方式](https://static-docs.nocobase.com/20240426135108.png)

Yukarıdaki çağrı başarılı olduktan sonra, ilgili `posts` koleksiyonunun işlem sonrası olayı tetiklenecektir.

:::info{title="Not"}
Harici çağrılar da kullanıcı kimliğine dayanması gerektiğinden, HTTP API aracılığıyla çağrı yaparken, normal arayüzden gönderilen isteklerle aynı şekilde kimlik doğrulama bilgilerinin sağlanması gerekir. Buna `Authorization` istek başlığı veya `token` parametresi (giriş yapıldığında elde edilen token) ve `X-Role` istek başlığı (kullanıcının mevcut rol adı) dahildir.
:::

Bu işlemde bire-bir ilişkisel veriler için bir olayı tetiklemeniz gerekiyorsa (bire-çok henüz desteklenmemektedir), ilişkisel alanın tetikleyici verisini belirtmek için parametrede `!` kullanabilirsiniz:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

Yukarıdaki çağrı başarılı olduktan sonra, ilgili `categories` koleksiyonunun işlem sonrası olayı tetiklenecektir.

:::info{title="Not"}
Eğer olay global modda yapılandırılmışsa, ilgili iş akışını belirtmek için `triggerWorkflows` URL parametresini kullanmanıza gerek yoktur. İlgili koleksiyon işlemini doğrudan çağırmanız tetikleme için yeterlidir.
:::

## Sıkça Sorulan Sorular

### İşlem Öncesi Olaydan Farkı

*   İşlem Öncesi Olay: Bir işlem (ekleme, güncelleme vb.) yürütülmeden önce tetiklenir. İşlem yürütülmeden önce, iş akışında istenen veriler doğrulanabilir veya işlenebilir. Eğer iş akışı sonlandırılırsa (istek engellenirse), bu işlem (ekleme, güncelleme vb.) yürütülmeyecektir.
*   İşlem Sonrası Olay: Bir kullanıcının işlemi başarılı olduktan sonra tetiklenir. Bu noktada, veriler başarıyla gönderilmiş ve veritabanına kaydedilmiş olup, başarılı sonuca göre ilgili süreçler işlenmeye devam edebilir.

Aşağıdaki şekilde gösterildiği gibi:

![操作执行顺序](https://static-docs.nocobase.com/7c901be2282067d785205b70391332b7.png)

### Koleksiyon Olayından Farkı

İşlem sonrası olaylar ve koleksiyon olayları benzerlik gösterir; her ikisi de veri değişikliklerinden sonra tetiklenen süreçlerdir, ancak uygulama düzeyleri farklıdır. İşlem sonrası olaylar API düzeyine odaklanırken, koleksiyon olayları koleksiyondaki veri değişikliklerine yöneliktir.

Koleksiyon olayları sistemin daha alt katmanlarına yakındır. Bazı durumlarda, bir olayın neden olduğu bir veri değişikliği başka bir olayı tetikleyerek zincirleme bir reaksiyon yaratabilir. Özellikle, bazı ilişkili koleksiyonlardaki veriler mevcut koleksiyonun işlemi sırasında değiştiğinde, ilişkili koleksiyonlarla ilgili olaylar da tetiklenebilir.

Koleksiyon olaylarının tetiklenmesi kullanıcıyla ilgili bilgi içermez. Buna karşılık, işlem sonrası olaylar kullanıcı tarafına daha yakındır ve kullanıcı eylemlerinin bir sonucudur. İş akışının bağlamı da kullanıcıyla ilgili bilgileri içereceğinden, kullanıcı eylemleriyle ilgili süreçleri işlemek için daha uygundur. NocoBase'in gelecekteki tasarımında, tetikleme için kullanılabilecek daha fazla işlem sonrası olay genişletilebilir, bu nedenle kullanıcı eylemlerinin neden olduğu veri değişiklikleri süreçlerini yönetmek için **işlem sonrası olayları kullanmanız daha çok tavsiye edilir**.

Diğer bir fark ise, işlem sonrası olayların belirli form düğmelerine yerel olarak bağlanabilmesidir. Birden fazla form varsa, bazı form gönderimleri bu olayı tetikleyebilirken diğerleri tetiklemeyebilir. Koleksiyon olayları ise tüm koleksiyondaki veri değişiklikleri için geçerlidir ve yerel olarak bağlanamaz.