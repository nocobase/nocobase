---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# Yapılandırılmış Çıktı

## Giriş

Bazı uygulama senaryolarında, LLM modelinin JSON formatında yapılandırılmış içerik yanıtlamasını isteyebilirsiniz. Bu özelliği "Yapılandırılmış Çıktı"yı yapılandırarak etkinleştirebilirsiniz.

![](https://static-docs.nocobase.com/202503041306405.png)

## Yapılandırma

- **JSON Schema** - Modelin yanıtının beklenen yapısını bir [JSON Schema](https://json-schema.org/) yapılandırarak belirleyebilirsiniz.
- **Ad (Name)** - _İsteğe bağlı_, modelin JSON Schema tarafından temsil edilen nesneyi daha iyi anlamasına yardımcı olmak için kullanılır.
- **Açıklama (Description)** - _İsteğe bağlı_, modelin JSON Schema'nın amacını daha iyi anlamasına yardımcı olmak için kullanılır.
- **Strict** - Modelin yanıtı JSON Schema yapısına kesinlikle uygun olarak oluşturmasını gerektirir. Şu anda, bu parametre yalnızca OpenAI'ın bazı yeni modelleri tarafından desteklenmektedir. Etkinleştirmeden önce modelinizin uyumlu olup olmadığını lütfen kontrol edin.

## Yapılandırılmış İçerik Oluşturma Yöntemi

Bir modelin yapılandırılmış içerik oluşturma şekli, kullanılan **model** ve onun **Yanıt formatı** yapılandırmasına bağlıdır:

1. Yanıt formatının yalnızca `text` desteklediği modeller
   - Çağrıldığında, düğüm JSON Schema'ya dayalı JSON formatında içerik üreten bir Araç (Tool) bağlar ve modeli bu Aracı çağırarak yapılandırılmış bir yanıt oluşturmaya yönlendirir.

2. Yanıt formatının JSON modunu (`json_object`) desteklediği modeller
   - Çağrıldığında JSON modu seçilirse, Prompt'ta modele JSON formatında yanıt vermesi için açıkça talimat vermeniz ve yanıt alanları için açıklamalar sağlamanız gerekir.
   - Bu modda, JSON Schema yalnızca model tarafından döndürülen JSON dizesini ayrıştırmak ve onu hedef JSON nesnesine dönüştürmek için kullanılır.

3. Yanıt formatının JSON Schema'yı (`json_schema`) desteklediği modeller
   - JSON Schema, model için hedef yanıt yapısını doğrudan belirtmek için kullanılır.
   - İsteğe bağlı **Strict** parametresi, modelin yanıtı oluştururken JSON Schema'ya kesinlikle uymasını gerektirir.

4. Ollama yerel modelleri
   - Bir JSON Schema yapılandırılmışsa, çağrıldığında düğüm bunu `format` parametresi olarak modele iletir.

## Yapılandırılmış Çıktı Sonucunu Kullanma

Modelin yanıtının yapılandırılmış içeriği, düğümün 'Yapılandırılmış içerik' alanında bir JSON nesnesi olarak kaydedilir ve sonraki düğümler tarafından kullanılabilir.

![](https://static-docs.nocobase.com/202503041330291.png)

![](https://static-docs.nocobase.com/202503041331279.png)