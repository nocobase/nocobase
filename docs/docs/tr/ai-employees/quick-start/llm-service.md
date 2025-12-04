:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Hızlı Başlangıç

## Giriş

Yapay Zeka Çalışanı'nı kullanmadan önce, çevrimiçi bir LLM hizmetine bağlanmanız gerekir. NocoBase şu anda OpenAI, Gemini, Claude, DepSeek, Qwen gibi başlıca çevrimiçi LLM hizmetlerini desteklemektedir. Çevrimiçi LLM hizmetlerine ek olarak, NocoBase Ollama yerel modellerinin entegrasyonunu da destekler.

## LLM Hizmetini Yapılandırma

Yapay Zeka Çalışanı eklentisi yapılandırma sayfasına gidin, `LLM service` sekmesine tıklayarak LLM hizmeti yönetim sayfasına ulaşın.

![20251021213122](https://static-docs.nocobase.com/20251021213122.png)

LLM hizmeti listesinin sağ üst köşesindeki `Add New` (Yeni Ekle) düğmesinin üzerine gelin ve kullanmak istediğiniz LLM hizmetini seçin.

![20251021213358](https://static-docs.nocobase.com/20251021213358.png)

OpenAI'ı örnek olarak ele alalım: Açılan pencerede kolayca hatırlanabilir bir `title` (başlık) girin, ardından OpenAI'dan aldığınız `API key`'i girin ve kaydetmek için `Submit` (Gönder) düğmesine tıklayın. Böylece LLM hizmeti yapılandırmasını tamamlamış olacaksınız.

`Base URL` genellikle boş bırakılabilir. Eğer OpenAI arayüzüyle uyumlu bir üçüncü taraf LLM hizmeti kullanıyorsanız, lütfen ilgili Base URL'i doldurun.

![20251021214549](https://static-docs.nocobase.com/20251021214549.png)

## Kullanılabilirlik Testi

LLM hizmeti yapılandırma sayfasında, `Test flight` (Test Uçuşu) düğmesine tıklayın, kullanmak istediğiniz modelin adını girin ve `Run` (Çalıştır) düğmesine tıklayın. Böylece LLM hizmetinin ve modelin kullanılabilirliğini test edebilirsiniz.

![20251021214903](https://static-docs.nocobase.com/20251021214903.png)