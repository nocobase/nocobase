---
pkg: "@nocobase/plugin-ai"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Metin Sohbeti

## Giriş

İş akışındaki LLM düğümünü kullanarak, çevrimiçi bir LLM hizmetiyle sohbet başlatabilir, böylece bir dizi iş sürecini tamamlamanıza yardımcı olmak için büyük dil modellerinin (LLM'lerin) yeteneklerinden faydalanabilirsiniz.

![](https://static-docs.nocobase.com/202503041012091.png)

## LLM Düğümü Oluşturma

LLM hizmetleriyle yapılan sohbetler genellikle zaman alıcı olduğundan, LLM düğümü yalnızca eşzamansız iş akışlarında kullanılabilir.

![](https://static-docs.nocobase.com/202503041013363.png)

## Model Seçimi

Öncelikle, bağlı bir LLM hizmeti seçin. Henüz bir LLM hizmeti bağlı değilse, önce bir LLM hizmeti yapılandırması eklemeniz gerekir. Bakınız: [LLM Hizmet Yönetimi](/ai-employees/quick-start/llm-service)

Bir hizmet seçtikten sonra, uygulama LLM hizmetinden mevcut modellerin bir listesini almayı deneyecektir. Bazı çevrimiçi LLM hizmetlerinin model alma API'leri standart API protokollerine uymayabilir; bu gibi durumlarda, kullanıcılar model kimliğini (ID) manuel olarak da girebilir.

![](https://static-docs.nocobase.com/202503041013084.png)

## Çağrı Parametrelerini Ayarlama

LLM modelini çağırmak için parametreleri ihtiyacınıza göre ayarlayabilirsiniz.

![](https://static-docs.nocobase.com/202503041014778.png)

### Response format

Burada dikkat edilmesi gereken nokta **Response format** (Yanıt biçimi) ayarıdır. Bu ayar, büyük dil modelinin yanıtının içeriğinin biçimini (metin veya JSON olabilir) belirtmek için kullanılır. JSON modunu seçerseniz, şunlara dikkat etmelisiniz:

- İlgili LLM modelinin JSON modunda çağrılmayı desteklemesi gerekir. Ayrıca, kullanıcının Prompt'ta LLM'ye JSON formatında yanıt vermesini açıkça belirtmesi gerekir, örneğin: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". Aksi takdirde, yanıt alınamayabilir ve `400 status code (no body)` hatası oluşabilir.
- Yanıt bir JSON dizesi olacaktır. Kullanıcının, yapılandırılmış içeriğini kullanabilmek için bunu diğer iş akışı düğümlerinin yeteneklerini kullanarak ayrıştırması gerekir. Ayrıca [Yapılandırılmış Çıktı](/ai-employees/workflow/nodes/llm/structured-output) özelliğini de kullanabilirsiniz.

## Mesajlar

LLM modeline gönderilen mesaj dizisi, bir dizi geçmiş mesajı içerebilir. Mesajlar üç türü destekler:

- System (Sistem) - Genellikle LLM modelinin sohbetteki rolünü ve davranışını tanımlamak için kullanılır.
- User (Kullanıcı) - Kullanıcı tarafından girilen içerik.
- Assistant (Asistan) - Model tarafından yanıtlanan içerik.

Kullanıcı mesajları için, modelin desteklemesi koşuluyla, `content` parametresine karşılık gelen birden fazla içeriği tek bir istemde (prompt) ekleyebilirsiniz. Kullandığınız model yalnızca `content` parametresini bir dize (string) olarak destekliyorsa (çok modlu sohbetleri desteklemeyen modellerin çoğu bu kategoriye girer), lütfen mesajı birden fazla isteme bölün ve her istemde yalnızca bir içerik bulundurun. Bu şekilde, düğüm içeriği bir dize olarak gönderecektir.

![](https://static-docs.nocobase.com/202503041016140.png)

Mesaj içeriğinde, iş akışı bağlamını referans almak için değişkenler kullanabilirsiniz.

![](https://static-docs.nocobase.com/202503041017879.png)

## LLM Düğümünün Yanıt İçeriğini Kullanma

LLM düğümünün yanıt içeriğini, diğer düğümlerde bir değişken olarak kullanabilirsiniz.

![](https://static-docs.nocobase.com/202503041018508.png)