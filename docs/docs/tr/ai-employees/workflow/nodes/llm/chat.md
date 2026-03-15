---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/ai-employees/workflow/nodes/llm/chat) bakın.
:::

# Metin Sohbeti

## Giriş

İş akışının LLM düğümünü kullanarak çevrimiçi LLM servisleriyle bir sohbet başlatabilir, bir dizi iş akışını tamamlamaya yardımcı olması için büyük modellerin yeteneklerinden yararlanabilirsiniz.

![](https://static-docs.nocobase.com/202503041012091.png)

## Yeni LLM Düğümü

LLM servisleriyle sohbet etmek genellikle zaman aldığından, LLM düğümü yalnızca asenkron iş akışlarında kullanılabilir.

![](https://static-docs.nocobase.com/202503041013363.png)

## Model Seçimi

Öncelikle bağlı olan LLM servisini seçin; henüz bir LLM servisi bağlanmamışsa, önce bir LLM servisi yapılandırması eklemeniz gerekir. Referans: [LLM Servis Yönetimi](/ai-employees/features/llm-service)

Servisi seçtikten sonra uygulama, seçim yapabilmeniz için LLM servisinden kullanılabilir modellerin listesini almaya çalışacaktır. Bazı çevrimiçi LLM servislerinin model alma arayüzleri standart API protokollerine uymayabilir, bu durumda kullanıcılar model kimliğini manuel olarak da girebilir.

![](https://static-docs.nocobase.com/202503041013084.png)

## Çağrı Parametrelerini Ayarlama

LLM modelini çağırma parametrelerini ihtiyaca göre ayarlayabilirsiniz.

![](https://static-docs.nocobase.com/202503041014778.png)

### Response format

Burada dikkat edilmesi gereken **Response format** ayarıdır; bu ayar öğesi, büyük modelin yanıt içeriği formatını (metin veya JSON olabilir) belirtmek için kullanılır. JSON modu seçilirse şunlara dikkat edilmelidir:

- İlgili LLM modelinin JSON modunda çağrılmayı desteklemesi gerekir, aynı zamanda kullanıcının Prompt içinde LLM'nin JSON formatında yanıt vermesini açıkça belirtmesi gerekir, örneğin: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". Aksi takdirde yanıt alınamayabilir ve `400 status code (no body)` hatası verebilir.
- Yanıt sonucu bir JSON dizesidir; kullanıcıların içindeki yapılandırılmış içeriği kullanabilmesi için iş akışındaki diğer düğümlerin yeteneklerini kullanarak bunu ayrıştırması gerekir. Ayrıca [Yapılandırılmış Çıktı](/ai-employees/workflow/nodes/llm/structured-output) özelliği de kullanılabilir.

## Mesajlar

LLM modeline gönderilen ve bir dizi geçmiş mesajı içerebilen mesaj dizisidir. Mesajlar üç türü destekler:

- System - Genellikle sohbette LLM modelinin üstlendiği rolü ve davranışı tanımlamak için kullanılır.
- User - Kullanıcı tarafından girilen içerik.
- Assistant - Model tarafından yanıtlanan içerik.

Kullanıcı mesajları için, modelin desteklemesi koşuluyla, bir istemde `content` parametresine karşılık gelen birden fazla içerik ekleyebilirsiniz. Kullanılan model yalnızca dize formatındaki `content` parametresini destekliyorsa (çok modlu sohbetleri desteklemeyen modellerin çoğu bu kategoriye girer), lütfen mesajı her istemde yalnızca bir içerik kalacak şekilde birden fazla isteme bölün; böylece düğüm içeriği dize formatında gönderecektir.

![](https://static-docs.nocobase.com/202503041016140.png)

Mesaj içeriğinde iş akışı bağlamına atıfta bulunmak için değişkenler kullanabilirsiniz.

![](https://static-docs.nocobase.com/202503041017879.png)

## LLM Düğümünün Yanıt İçeriğini Kullanma

LLM düğümünün yanıt içeriğini diğer düğümlerde değişken olarak kullanabilirsiniz.

![](https://static-docs.nocobase.com/202503041018508.png)