:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Genel Bakış

Tetikleyici, bir iş akışının yürütme giriş noktasıdır. Uygulama çalışırken, tetikleyicinin koşullarını karşılayan bir olay meydana geldiğinde, iş akışı tetiklenir ve yürütülür. Tetikleyici türü aynı zamanda iş akışının türüdür; bu, iş akışı oluşturulurken seçilir ve oluşturulduktan sonra değiştirilemez. Şu anda desteklenen tetikleyici türleri şunlardır:

- [Koleksiyon Olayları](./collection) (Yerleşik)
- [Zamanlanmış Görev](./schedule) (Yerleşik)
- [Eylem Öncesi](./pre-action) (@nocobase/plugin-workflow-request-interceptor eklentisi tarafından sağlanır)
- [Eylem Sonrası](./post-action) (@nocobase/plugin-workflow-action-trigger eklentisi tarafından sağlanır)
- [Özel Eylem](./custom-action) (@nocobase/plugin-workflow-custom-action-trigger eklentisi tarafından sağlanır)
- [Onay](./approval) (@nocobase/plugin-workflow-approval eklentisi tarafından sağlanır)
- [Webhook](./webhook) (@nocobase/plugin-workflow-webhook eklentisi tarafından sağlanır)

Her bir olayın tetiklenme zamanlaması aşağıdaki görselde gösterilmiştir:

![İş Akışı Olayları](https://static-docs.nocobase.com/20251029221709.png)

Örneğin, bir kullanıcı bir form gönderdiğinde, veya bir koleksiyondaki veriler kullanıcı eylemi veya bir program çağrısı nedeniyle değiştiğinde, ya da zamanlanmış bir görevin yürütme zamanı geldiğinde, yapılandırılmış bir iş akışı tetiklenebilir.

Veriyle ilgili tetikleyiciler (örneğin eylemler, koleksiyon olayları) genellikle tetikleyici bağlam verilerini taşır. Bu veriler değişken olarak işlev görür ve iş akışındaki düğümler tarafından işleme parametreleri olarak kullanılarak verilerin otomatik işlenmesini sağlar. Örneğin, bir kullanıcı bir form gönderdiğinde, gönderme düğmesi bir iş akışına bağlıysa, bu iş akışı tetiklenir ve yürütülür. Gönderilen veriler, sonraki düğümlerin değişken olarak kullanması için yürütme planının bağlam ortamına enjekte edilir.

Bir iş akışı oluşturduktan sonra, iş akışı görüntüleme sayfasında, tetikleyici sürecin başlangıcında bir giriş düğümü olarak görüntülenir. Bu karta tıklayarak yapılandırma çekmecesini açabilirsiniz. Tetikleyici türüne bağlı olarak, ilgili koşullarını yapılandırabilirsiniz.

![Tetikleyici_Giriş Düğümü](https://static-docs.nocobase.com/20251029222231.png)