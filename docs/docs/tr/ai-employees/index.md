---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/ai-employees/index) bakın.
:::

# Genel Bakış

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

AI Çalışanları (`AI Employees`), NocoBase iş sistemlerine derinlemesine entegre edilmiş akıllı ajan yetenekleridir.

Bunlar sadece "sohbet eden" robotlar değil, iş arayüzünde bağlamı doğrudan anlayabilen ve işlemleri gerçekleştirebilen "dijital meslektaşlardır":

- **İş bağlamını anlar**: Mevcut sayfayı, blokları, veri yapısını ve seçili içeriği algılar.
- **Eylemleri doğrudan gerçekleştirebilir**: Sorgulama, analiz, doldurma, yapılandırma ve oluşturma gibi görevleri tamamlamak için yetenekleri çağırabilir.
- **Rol tabanlı iş birliği**: Pozisyona göre farklı çalışanlar yapılandırın ve görüşme sırasında modelleri değiştirerek iş birliği yapın.

## 5 Dakikada Başlangıç Yolu

Önce [Hızlı Başlangıç](/ai-employees/quick-start) bölümüne bakın ve aşağıdaki sırayla minimum kullanılabilir yapılandırmayı tamamlayın:

1. En az bir [LLM hizmeti](/ai-employees/features/llm-service) yapılandırın.
2. En az bir [AI çalışanını](/ai-employees/features/enable-ai-employee) etkinleştirin.
3. Bir sohbet açın ve [AI çalışanları ile iş birliği yapmaya](/ai-employees/features/collaborate) başlayın.
4. İhtiyaca göre [İnternet araması](/ai-employees/features/web-search) ve [Hızlı görevleri](/ai-employees/features/task) açın.

## Özellik Haritası

### A. Temel Yapılandırma (Yönetici)

- [LLM hizmetini yapılandırın](/ai-employees/features/llm-service): Sağlayıcıları (Provider) bağlayın, kullanılabilir modelleri yapılandırın ve yönetin.
- [AI çalışanını etkinleştirin](/ai-employees/features/enable-ai-employee): Yerleşik çalışanları başlatın veya durdurun, kullanılabilirlik kapsamını kontrol edin.
- [Yeni AI çalışanı oluşturun](/ai-employees/features/new-ai-employees): Rolü, kişiliği (role setting), karşılama mesajını ve yetenek sınırlarını tanımlayın.
- [Yetenekleri kullanın](/ai-employees/features/tool): Yetenek izinlerini (`Sor` / `İzin Ver`) yapılandırın ve yürütme risklerini kontrol edin.

### B. Günlük İş Birliği (İş Kullanıcıları)

- [AI çalışanları ile iş birliği yapın](/ai-employees/features/collaborate): Sohbet içinde çalışanları ve modelleri değiştirerek iş birliğine devam edin.
- [Bağlam ekle - Bloklar](/ai-employees/features/pick-block): Sayfa bloklarını AI'ya bağlam olarak gönderin.
- [Hızlı görevler](/ai-employees/features/task): Sayfa/blok üzerinde sık kullanılan görevleri önceden ayarlayın ve tek tıkla çalıştırın.
- [İnternet araması](/ai-employees/features/web-search): Güncel bilgilere ihtiyaç duyulduğunda arama destekli yanıtları etkinleştirin.

### C. Gelişmiş Yetenekler (Uzantılar)

- [Yerleşik AI çalışanları](/ai-employees/features/built-in-employee): Önceden ayarlanmış çalışanların konumlandırmasını ve uygun senaryolarını anlayın.
- [Yetki kontrolü](/ai-employees/permission): Çalışanları, yetenekleri ve veri erişimini organizasyon yetki modeline göre kontrol edin.
- [AI Bilgi tabanı](/ai-employees/knowledge-base/index): Kurumsal bilgileri dahil ederek yanıt kararlılığını ve izlenebilirliğini artırın.
- [İş akışı LLM düğümü](/ai-employees/workflow/nodes/llm/chat): AI yeteneklerini otomatik süreçlere (workflow) dahil edin.

## Temel Kavramlar (Önce uyum sağlanması önerilir)

Aşağıdaki terimler sözlükle tutarlıdır, ekip içinde ortak kullanılması önerilir:

- **AI Çalışanı (AI Employee)**: Kişilik (Role setting) ve yeteneklerden (Tool / Skill) oluşan yürütülebilir bir ajan.
- **LLM Hizmeti (LLM Service)**: Sağlayıcıları ve model listelerini yönetmek için kullanılan model erişim ve yetenek yapılandırma birimi.
- **Sağlayıcı (Provider)**: LLM hizmetinin arkasındaki model tedarikçisi.
- **Etkinleştirilen Modeller (Enabled Models)**: Mevcut LLM hizmetinin sohbet içinde seçilmesine izin verdiği model seti.
- **AI Çalışanı Değiştirici (AI Employee Switcher)**: Sohbet içinde mevcut iş birliği yapılan çalışanı değiştirme.
- **Model Değiştirici (Model Switcher)**: Sohbet içinde model değiştirme ve çalışan bazında tercihleri hatırlama.
- **Yetenek (Tool / Skill)**: AI tarafından çağrılabilen yürütülebilir yetenek birimi.
- **Yetenek Yetkisi (Permission: Ask / Allow)**: Yetenek çağrılmadan önce manuel onay gerekip gerekmediği.
- **Bağlam (Context)**: Sayfa, blok, veri yapısı gibi iş ortamı bilgileri.
- **Sohbet (Chat)**: Kullanıcı ile AI çalışanı arasındaki sürekli etkileşim süreci.
- **İnternet Araması (Web Search)**: Gerçek zamanlı bilgileri tamamlamak için harici aramaya dayalı yetenek.
- **Bilgi Tabanı (Knowledge Base / RAG)**: Arama destekli üretim yoluyla kurumsal bilgilerin dahil edilmesi.
- **Vektör Deposu (Vector Store)**: Bilgi tabanı için anlamsal arama yeteneği sağlayan vektörleştirilmiş depolama.

## Kurulum Talimatları

AI çalışanları, NocoBase'in yerleşik bir eklentisidir (`@nocobase/plugin-ai`), kutudan çıktığı gibi çalışır ve ayrıca kurulum gerektirmez.