:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Genel Bakış

Bir iş akışı genellikle birbirine bağlı çeşitli işlem adımlarından oluşur. Her düğüm, bu adımlardan birini temsil eder ve süreçteki temel mantık birimi olarak işlev görür. Tıpkı bir programlama dilinde olduğu gibi, farklı düğüm türleri de düğümün davranışını belirleyen farklı talimatları temsil eder. İş akışı çalıştığında, sistem her düğüme sırayla girer ve talimatlarını yürütür.

:::info{title=Not}
Bir iş akışının tetikleyicisi bir düğüm değildir. Akış şemasında yalnızca bir giriş düğümü olarak gösterilir, ancak düğümden farklı bir kavramdır. Ayrıntılar için lütfen [Tetikleyiciler](../triggers/index.md) içeriğine bakın.
:::

İşlevsel açıdan bakıldığında, şu anda uygulanan düğümler birkaç ana kategoriye ayrılabilir (toplam 29 düğüm türü):

- Yapay Zeka
  - [Büyük Dil Modeli](../../ai-employees/workflow/nodes/llm/chat.md) (@nocobase/plugin-workflow-llm eklentisi tarafından sağlanır)
- Akış Kontrolü
  - [Koşul](./condition.md)
  - [Çoklu Koşullar](./multi-conditions.md)
  - [Döngü](./loop.md) (@nocobase/plugin-workflow-loop eklentisi tarafından sağlanır)
  - [Değişken](./variable.md) (@nocobase/plugin-workflow-variable eklentisi tarafından sağlanır)
  - [Paralel Dal](./parallel.md) (@nocobase/plugin-workflow-parallel eklentisi tarafından sağlanır)
  - [İş Akışı Çağır](./subflow.md) (@nocobase/plugin-workflow-subflow eklentisi tarafından sağlanır)
  - [İş Akışı Çıktısı](./output.md) (@nocobase/plugin-workflow-subflow eklentisi tarafından sağlanır)
  - [JSON Değişken Eşleme](./json-variable-mapping.md) (@nocobase/plugin-workflow-json-variable-mapping eklentisi tarafından sağlanır)
  - [Gecikme](./delay.md) (@nocobase/plugin-workflow-delay eklentisi tarafından sağlanır)
  - [İş Akışını Sonlandır](./end.md)
- Hesaplama
  - [Hesaplama](./calculation.md)
  - [Tarih Hesaplama](./date-calculation.md) (@nocobase/plugin-workflow-date-calculation eklentisi tarafından sağlanır)
  - [JSON Hesaplama](./json-query.md) (@nocobase/plugin-workflow-json-query eklentisi tarafından sağlanır)
- Koleksiyon İşlemleri
  - [Veri Oluştur](./create.md)
  - [Veri Güncelle](./update.md)
  - [Veri Sil](./destroy.md)
  - [Veri Sorgula](./query.md)
  - [Toplu Sorgu](./aggregate.md) (@nocobase/plugin-workflow-aggregate eklentisi tarafından sağlanır)
  - [SQL İşlemi](./sql.md) (@nocobase/plugin-workflow-sql eklentisi tarafından sağlanır)
- Manuel İşlem
  - [Manuel İşlem](./manual.md) (@nocobase/plugin-workflow-manual eklentisi tarafından sağlanır)
  - [Onay](./approval.md) (@nocobase/plugin-workflow-approval eklentisi tarafından sağlanır)
  - [Bilgi (CC)](./cc.md) (@nocobase/plugin-workflow-cc eklentisi tarafından sağlanır)
- Diğer Uzantılar
  - [HTTP İsteği](./request.md) (@nocobase/plugin-workflow-request eklentisi tarafından sağlanır)
  - [JavaScript](./javascript.md) (@nocobase/plugin-workflow-javascript eklentisi tarafından sağlanır)
  - [E-posta Gönder](./mailer.md) (@nocobase/plugin-workflow-mailer eklentisi tarafından sağlanır)
  - [Bildirim](../../notification-manager/index.md#iş-akışı-bildirim-düğümü) (@nocobase/plugin-workflow-notification eklentisi tarafından sağlanır)
  - [Yanıt](./response.md) (@nocobase/plugin-workflow-webhook eklentisi tarafından sağlanır)
  - [Yanıt Mesajı](./response-message.md) (@nocobase/plugin-workflow-response-message eklentisi tarafından sağlanır)