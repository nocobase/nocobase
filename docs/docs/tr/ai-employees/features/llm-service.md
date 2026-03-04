:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/ai-employees/features/llm-service) bakın.
:::

# LLM Servisini Yapılandırın

AI Çalışanlarını kullanmadan önce, kullanılabilir LLM servislerini yapılandırmanız gerekir.

Şu anda OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi ve Ollama yerel modelleri desteklenmektedir.

## Yeni Servis Oluşturun

`Sistem Ayarları -> AI Çalışanları -> LLM servisi` bölümüne gidin.

1. Yeni bir oluşturma penceresi açmak için `Add New` butonuna tıklayın.
2. `Sağlayıcı` (Provider) seçin.
3. `Başlık` (Title), `API Anahtarı` (API Key) ve `Temel URL` (Base URL - isteğe bağlı) bilgilerini doldurun.
4. `Etkinleştirilen Modelleri` (Enabled Models) yapılandırın:
   - `Recommended models`: Resmi olarak önerilen modelleri kullanın.
   - `Select models`: Sağlayıcıdan gelen model listesinden seçim yapın.
   - `Manual input`: Model kimliğini (ID) ve görünen adını manuel olarak girin.
5. Kaydetmek için `Submit` butonuna tıklayın.

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## Servisleri Etkinleştirme ve Sıralama

LLM servis listesinde şunları yapabilirsiniz:

- `Enabled` anahtarını kullanarak servis durumunu değiştirebilirsiniz.
- Servisleri sürükleyerek sıralayabilirsiniz (bu işlem modellerin görüntülenme sırasını etkiler).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## Kullanılabilirlik Testi

Servis ve modelin kullanılabilirliğini doğrulamak için servis yapılandırma penceresinin altındaki `Test flight` özelliğini kullanın.

Üretime geçmeden önce bu testi çalıştırmanız önerilir.