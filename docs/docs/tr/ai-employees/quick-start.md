:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/ai-employees/quick-start) bakın.
:::

# Hızlı Başlangıç

AI Çalışanı için minimum kullanılabilir yapılandırmayı 5 dakikada tamamlayalım.

## Eklentiyi Yükleme

AI Çalışanları, NocoBase'in yerleşik bir eklentisidir (`@nocobase/plugin-ai`), bu nedenle ayrıca kurulum yapılmasına gerek yoktur.

## Modelleri Yapılandırma

LLM servislerini aşağıdaki giriş noktalarından herhangi birini kullanarak yapılandırabilirsiniz:

1. Yönetim paneli girişi: `Sistem Ayarları -> AI Çalışanları -> LLM servisi`.
2. Ön yüz kısayol girişi: AI sohbet panelinde model seçmek için `Model Switcher` (Model Değiştirici) kullanırken, doğrudan yönlendirme için "LLM servisi ekle" kısayoluna tıklayın.

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

Genellikle şunları onaylamanız gerekir:
1. Sağlayıcıyı (Provider) seçin.
2. API Anahtarını (API Key) girin.
3. `Etkin Modelleri` (Enabled Models) yapılandırın; varsayılan olarak "Recommend" (Önerilen) seçeneğini kullanmanız yeterlidir.

## Yerleşik Çalışanları Etkinleştirme

Yerleşik AI Çalışanları varsayılan olarak etkindir ve genellikle her birini manuel olarak tek tek açmanız gerekmez.

Kullanılabilirlik durumunu ayarlamanız gerekirse (belirli bir çalışanı etkinleştirme/devre dışı bırakma), `Sistem Ayarları -> AI Çalışanları` liste sayfasındaki `Etkin` (Enabled) anahtarını değiştirebilirsiniz.

![ai-employee-list-enable-switch.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-list-enable-switch.png)

## İş Birliğine Başlama

Uygulama sayfasında, sağ alt köşedeki kısayol girişinin üzerine gelin ve bir AI Çalışanı seçin.
![ai-employees-entry-bottom-right.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employees-entry-bottom-right.png)

AI sohbet kutusunu açmak için tıklayın:

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)

Ayrıca şunları yapabilirsiniz:  
* Blok ekleme
* Ek ekleme
* Web Aramasını etkinleştirme
* AI Çalışanını değiştirme
* Model seçme

Bu çalışanlar, sayfa yapısını bağlam olarak otomatik olarak alabilirler. Örneğin, bir form bloğundaki Dex, formun alan yapısını otomatik olarak okuyabilir ve sayfada işlem yapmak için uygun becerileri çağırabilir.

## Kısayol Görevleri

Her bir AI Çalışanı için bulunduğunuz konumda sık kullanılan görevler önceden ayarlayabilirsiniz; böylece tek bir tıklamayla çalışmaya başlayabilir, süreci hızlı ve kolay hale getirebilirsiniz.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## Yerleşik Çalışanlara Genel Bakış

NocoBase, farklı senaryolara yönelik birden fazla yerleşik AI Çalışanı sunar.

Sadece şunları yapmanız yeterlidir:

1. LLM servislerini yapılandırın.
2. Gerektiğinde çalışanların etkinlik durumunu ayarlayın (varsayılan olarak etkindir).
3. Sohbette bir model seçin ve iş birliğine başlayın.

| Çalışan Adı | Rol Konumlandırması | Temel Yetenekler |
| :--- | :--- | :--- |
| **Cole** | NocoBase Asistanı | Ürün kullanımı Soru-Cevap, doküman arama |
| **Ellis** | E-posta Uzmanı | E-posta yazma, özet oluşturma, yanıt önerileri |
| **Dex** | Veri Düzenleme Uzmanı | Alan çevirisi, biçimlendirme, bilgi çıkarma |
| **Viz** | Öngörü Analisti | Veri öngörüsü, trend analizi, temel gösterge yorumlama |
| **Lexi** | Çeviri Asistanı | Çok dilli çeviri, iletişim desteği |
| **Vera** | Araştırma Analisti | Web araması, bilgi toplama, derinlemesine araştırma |
| **Dara** | Veri Görselleştirme Uzmanı | Grafik yapılandırma, görsel rapor oluşturma |
| **Orin** | Veri Modelleme Uzmanı | Koleksiyon yapısı tasarımına yardımcı olma, alan önerileri |
| **Nathan** | Ön Yüz Mühendisi | Ön yüz kod parçacıkları yazmaya yardımcı olma, stil düzenlemeleri |

**Notlar**

Bazı yerleşik AI Çalışanları, özel çalışma senaryolarına sahip oldukları için sağ alt listede görünmezler:

- Orin: Veri modelleme sayfaları.
- Dara: Grafik yapılandırma blokları.
- Nathan: JS Bloğu ve benzeri kod düzenleyiciler.