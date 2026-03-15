:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/ai-employees/configuration/admin-configuration) bakın.
:::

# AI Çalışanı · Yönetici Yapılandırma Rehberi

> Bu belge, model hizmetlerinden görev atamasına kadar tüm süreci adım adım anlatarak Yapay Zeka çalışanlarını nasıl yapılandıracağınızı ve yöneteceğinizi hızlıca anlamanıza yardımcı olur.


## I. Başlamadan Önce

### 1. Sistem Gereksinimleri

Yapılandırmadan önce, ortamınızın aşağıdaki koşulları karşıladığından emin olun:

* **NocoBase 2.0 veya üzeri** sürüm yüklü olmalı
* **AI Çalışanı eklentisi** etkinleştirilmiş olmalı
* En az bir adet kullanılabilir **Büyük Dil Modeli (LLM) hizmeti** (örn. OpenAI, Claude, DeepSeek, GLM vb.) bulunmalı


### 2. AI Çalışanlarının İki Katmanlı Tasarımını Anlama

AI çalışanları iki katmana ayrılır: **"Rol Tanımı"** ve **"Görev Özelleştirme"**.

| Katman | Açıklama | Özellikler | İşlev |
| -------- | ------------ | ---------- | ------- |
| **Rol Tanımı** | Çalışanın temel kişiliği ve çekirdek yetenekleri | "Özgeçmiş" gibi sabit ve değişmez | Rol tutarlılığını sağlar |
| **Görev Özelleştirme** | Farklı iş senaryolarına yönelik yapılandırma | Esnek ve ayarlanabilir | Belirli görevlere uyum sağlar |

**Basitçe ifade etmek gerekirse:**

> "Rol Tanımı" bu çalışanın kim olduğunu belirler,
> "Görev Özelleştirme" ise şu anda ne yapacağını belirler.

Bu tasarımın avantajları şunlardır:

* Rol sabit kalır ancak farklı senaryolarda görev alabilir
* Görevlerin yükseltilmesi veya değiştirilmesi çalışanın kendisini etkilemez
* Arka plan ve görevler birbirinden bağımsızdır, bakımı daha kolaydır


## II. Yapılandırma Süreci (5 Adımda Tamamlayın)

### Adım 1: Model Hizmetini Yapılandırın

Model hizmeti, AI çalışanının beyni gibidir ve öncelikle kurulması gerekir.

> 💡 Ayrıntılı yapılandırma talimatları için lütfen şuraya bakın: [LLM Hizmetini Yapılandırın](/ai-employees/features/llm-service)

**Yol:**
`Sistem Ayarları → AI Çalışanı → LLM service`

![Yapılandırma sayfasına girin](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

**Ekle**'ye tıklayın ve aşağıdaki bilgileri doldurun:

| Öğe | Açıklama | Notlar |
| ------ | -------------------------- | --------- |
| Provider (Sağlayıcı) | Örn. OpenAI, Claude, Gemini, Kimi vb. | Aynı spesifikasyonu kullanan hizmetlerle uyumludur |
| API Anahtarı | Hizmet sağlayıcısı tarafından verilen anahtar | Gizli tutun ve düzenli olarak değiştirin |
| Base URL | API Uç Noktası (isteğe bağlı) | Proxy kullanırken değiştirilmesi gerekir |
| Enabled Models | Önerilen modeller / Model seç / Manuel giriş | Sohbet içinde değiştirilebilecek model kapsamını belirler |

![Büyük model hizmeti oluşturun](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Yapılandırmadan sonra lütfen `Test flight` ile **bağlantıyı test edin**.
Başarısız olursa; ağı, anahtarı veya model adını kontrol edin.

![Bağlantıyı test edin](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)


### Adım 2: AI Çalışanı Oluşturun

> 💡 Ayrıntılı talimatlar için lütfen şuraya bakın: [AI Çalışanı Oluşturun](/ai-employees/features/new-ai-employees)

Yol: `AI Çalışanı Yönetimi → Çalışan Oluştur`

Temel bilgileri doldurun:

| Alan | Gerekli | Örnek |
| ----- | -- | -------------- |
| Ad | ✓ | viz, dex, cole |
| Takma Ad | ✓ | Viz, Dex, Cole |
| Etkin Durum | ✓ | Açık |
| Biyografi | - | "Veri Analizi Uzmanı" |
| Ana İstek (Prompt) | ✓ | İstek Mühendisliği Rehberine bakın |
| Karşılama Mesajı | - | "Merhaba, ben Viz…" |

![Temel bilgi yapılandırması](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Çalışan oluşturma aşamasında temel olarak rol ve beceri yapılandırması tamamlanır. Gerçek kullanımda model, sohbet içindeki `Model Switcher` aracılığıyla seçilebilir.

**İstek (Prompt) Yazma Önerileri:**

* Çalışanın rolünü, tonunu ve sorumluluklarını netleştirin
* Kuralları vurgulamak için "mutlaka", "asla" gibi kelimeler kullanın
* Soyut açıklamalardan kaçınmak için mümkün olduğunca örnekler ekleyin
* 500–1000 karakter arasında tutun

> İstek ne kadar net olursa, AI performansı o kadar istikrarlı olur.
> [İstek Mühendisliği Rehberi](./prompt-engineering-guide.md) belgesine başvurabilirsiniz.


### Adım 3: Becerileri Yapılandırın

Beceriler, çalışanın "ne yapabileceğini" belirler.

> 💡 Ayrıntılı talimatlar için lütfen şuraya bakın: [Beceriler](/ai-employees/features/tool)

| Tip | Yetenek Kapsamı | Örnek | Risk Seviyesi |
| ---- | ------- | --------- | ------ |
| Ön Uç | Sayfa etkileşimi | Blok verilerini okuma, form doldurma | Düşük |
| Veri Modeli | Veri sorgulama ve analiz | Toplu istatistikler | Orta |
| İş Akışı | İş süreçlerini yürütme | Özel araçlar | İş akışına bağlıdır |
| Diğer | Harici uzantılar | Web araması, dosya işlemleri | Duruma göre değişir |

**Yapılandırma Önerileri:**

* Her çalışan için 3–5 beceri en uygunudur
* Tüm becerileri seçmek önerilmez, kafa karışıklığına yol açabilir
* Önemli işlemler için `Allow` (İzin Ver) yerine `Ask` (Sor) yetkisini kullanın

![Becerileri yapılandırın](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)


### Adım 4: Bilgi Tabanını Yapılandırın (İsteğe Bağlı)

AI çalışanınızın ürün kılavuzları, SSS'ler gibi büyük miktarda materyali hatırlaması veya bunlara atıfta bulunması gerekiyorsa, bir bilgi tabanı yapılandırabilirsiniz.

> 💡 Ayrıntılı talimatlar için lütfen şuraya bakın:
> - [AI Bilgi Tabanına Genel Bakış](/ai-employees/knowledge-base/index)
> - [Vektör Veritabanı](/ai-employees/knowledge-base/vector-database)
> - [Bilgi Tabanı Yapılandırması](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Erişim Destekli Üretim)](/ai-employees/knowledge-base/rag)

Bu, vektör veritabanı eklentisinin ek olarak yüklenmesini gerektirir.

![Bilgi tabanını yapılandırın](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Uygulanabilir Senaryolar:**

* AI'nın kurumsal bilgiyi anlamasını sağlamak
* Belge soru-cevap ve erişimini desteklemek
* Alana özgü asistanlar eğitmek


### Adım 5: Etkiyi Doğrulayın

Tamamlandıktan sonra, sayfanın sağ alt köşesinde yeni çalışanın avatarını göreceksiniz.

![Yapılandırmayı doğrulayın](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Lütfen her bir öğeyi kontrol edin:

* ✅ Simge normal görüntüleniyor mu?
* ✅ Temel bir sohbet gerçekleştirilebiliyor mu?
* ✅ Beceriler doğru şekilde çağrılabiliyor mu?

Hepsi geçerse, yapılandırma başarılı demektir 🎉


## III. Görev Yapılandırması: AI'yı Gerçekten İşe Başlatma

Şimdiye kadar "çalışan oluşturma" işlemini tamamladık, şimdi onları "işe gönderme" zamanı.

AI görevleri, çalışanın belirli bir sayfadaki veya bloktaki davranışını tanımlar.

> 💡 Ayrıntılı talimatlar için lütfen şuraya bakın: [Görevler](/ai-employees/features/task)


### 1. Sayfa Düzeyinde Görevler

"Bu sayfadaki verileri analiz et" gibi tüm sayfa kapsamı için geçerlidir.

**Yapılandırma Girişi:**
`Sayfa Ayarları → AI Çalışanı → Görev Ekle`

| Alan | Açıklama | Örnek |
| ---- | -------- | --------- |
| Başlık | Görev adı | Aşama Dönüşüm Analizi |
| Bağlam | Mevcut sayfanın bağlamı | Potansiyel Müşteri liste sayfası |
| Varsayılan Mesaj | Önceden ayarlanmış sohbet | "Lütfen bu ayın trendlerini analiz edin" |
| Varsayılan Blok | Otomatik olarak bir koleksiyonla ilişkilendir | leads tablosu |
| Beceriler | Mevcut araçlar | Veri sorgulama, grafik oluşturma |

![Sayfa düzeyinde görev yapılandırması](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Çoklu Görev Desteği:**
Aynı AI çalışanına birden fazla görev yapılandırılabilir ve bunlar kullanıcıya seçenek olarak sunulur:

![Çoklu görev desteği](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Öneriler:

* Bir görev tek bir hedefe odaklanmalı
* Adı açık ve anlaşılır olmalı
* Görev sayısı 5–7 ile sınırlandırılmalı


### 2. Blok Düzeyinde Görevler

"Mevcut formu çevir" gibi belirli bir blok üzerinde işlem yapmak için uygundur.

**Yapılandırma Yöntemi:**

1. Blok işlem yapılandırmasını açın
2. "AI Çalışanı" ekleyin

![AI Çalışanı düğmesini ekle](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. Hedef çalışanı bağlayın

![AI Çalışanını seçin](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Blok düzeyinde görev yapılandırması](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Karşılaştırma | Sayfa Düzeyi | Blok Düzeyi |
| ---- | ---- | --------- |
| Veri Kapsamı | Tüm sayfa | Mevcut blok |
| Granülerlik | Global analiz | Detaylı işlem |
| Tipik Kullanım | Trend analizi | Form çevirisi, alan çıkarma |


## IV. En İyi Uygulamalar

### 1. Yapılandırma Önerileri

| Öğe | Öneri | Neden |
| ---------- | ----------- | -------- |
| Beceri Sayısı | 3–5 adet | Yüksek doğruluk, hızlı yanıt |
| Yetki Modu (Ask / Allow) | Veri değişikliği için Ask önerilir | Hatalı işlemleri önler |
| İstek Uzunluğu | 500–1000 karakter | Hız ve kaliteyi dengeler |
| Görev Hedefi | Tek ve net | AI'nın kafasının karışmasını önler |
| İş Akışı | Karmaşık görevleri kapsülleyerek kullanın | Başarı oranı daha yüksektir |


### 2. Pratik Öneriler

**Küçükten başlayın, kademeli olarak optimize edin:**

1. Önce temel çalışanları oluşturun (örn. Viz, Dex)
2. Test için 1–2 temel beceriyi açın
3. Görevlerin normal şekilde yürütülebildiğini doğrulayın
4. Ardından daha fazla beceri ve görevi kademeli olarak genişletin

**Sürekli optimizasyon süreci:**

1. İlk sürümü çalıştırın
2. Kullanım geri bildirimlerini toplayın
3. İstekleri ve görev yapılandırmalarını optimize edin
4. Test edin ve döngüsel olarak iyileştirin


## V. Sıkça Sorulan Sorular

### 1. Yapılandırma Aşaması

**S: Kaydetme başarısız olursa ne yapmalıyım?**
C: Tüm zorunlu alanların, özellikle model hizmeti ve isteğin doldurulduğundan emin olun.

**S: Hangi modeli seçmeliyim?**

* Kodlama işleri → Claude, GPT-4
* Analiz işleri → Claude, DeepSeek
* Maliyet hassasiyeti → Qwen, GLM
* Uzun metin → Gemini, Claude


### 2. Kullanım Aşaması

**S: AI yanıtı çok mu yavaş?**

* Beceri sayısını azaltın
* İsteği optimize edin
* Model hizmeti gecikmesini kontrol edin
* Modeli değiştirmeyi düşünün

**S: Görev yürütme hatalı mı?**

* İstek yeterince net değil
* Çok fazla beceri kafa karışıklığına neden oluyor
* Görevleri küçültün, örnekler ekleyin

**S: Ask / Allow ne zaman seçilmeli?**

* Sorgulama türü görevler için `Allow` kullanılabilir
* Veri değiştirme türü görevler için `Ask` önerilir

**S: AI'nın belirli bir formu işlemesini nasıl sağlarım?**

C: Sayfa düzeyinde bir yapılandırma ise, bloğu manuel olarak seçmeniz gerekir.

![Bloğu manuel olarak seçin](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Blok düzeyinde görev yapılandırması ise veri bağlamı otomatik olarak bağlanır.


## VI. Daha Fazla Okuma

AI çalışanınızı daha güçlü hale getirmek için aşağıdaki belgeleri okumaya devam edebilirsiniz:

**Yapılandırma ile İlgili:**

* [İstek Mühendisliği Rehberi](./prompt-engineering-guide.md) - Yüksek kaliteli istekler yazma teknikleri ve en iyi uygulamalar
* [LLM Hizmetini Yapılandırın](/ai-employees/features/llm-service) - Büyük model hizmetleri için ayrıntılı yapılandırma talimatları
* [AI Çalışanı Oluşturun](/ai-employees/features/new-ai-employees) - AI çalışanlarının oluşturulması ve temel yapılandırması
* [AI Çalışanı ile İş Birliği Yapın](/ai-employees/features/collaborate) - AI çalışanları ile nasıl etkili diyalog kurulur

**Gelişmiş Özellikler:**

* [Beceriler](/ai-employees/features/tool) - Çeşitli becerilerin yapılandırması ve kullanımına dair derinlemesine bilgi
* [Görevler](/ai-employees/features/task) - Görev yapılandırması için gelişmiş teknikler
* [Blok Seçimi](/ai-employees/features/pick-block) - AI çalışanları için veri blokları nasıl belirlenir
* Veri Kaynağı - Lütfen ilgili eklentinin veri kaynağı yapılandırma belgelerine bakın
* [Web Araması](/ai-employees/features/web-search) - AI çalışanının web arama yeteneğini yapılandırma

**Bilgi Tabanı ve RAG:**

* [AI Bilgi Tabanına Genel Bakış](/ai-employees/knowledge-base/index) - Bilgi tabanı özelliğinin tanıtımı
* [Vektör Veritabanı](/ai-employees/knowledge-base/vector-database) - Vektör veritabanının yapılandırması
* [Bilgi Tabanı](/ai-employees/knowledge-base/knowledge-base) - Bilgi tabanı nasıl oluşturulur ve yönetilir
* [RAG (Erişim Destekli Üretim)](/ai-employees/knowledge-base/rag) - RAG teknolojisinin uygulaması

**İş Akışı Entegrasyonu:**

* [LLM Düğümü - Metin Sohbeti](/ai-employees/workflow/nodes/llm/chat) - İş akışlarında metin sohbeti kullanma
* [LLM Düğümü - Çok Modlu Sohbet](/ai-employees/workflow/nodes/llm/multimodal-chat) - Resimler, dosyalar gibi çok modlu girdileri işleme
* [LLM Düğümü - Yapılandırılmış Çıktı](/ai-employees/workflow/nodes/llm/structured-output) - Yapılandırılmış AI yanıtları alma


## 结语 (Sonuç)

AI çalışanlarını yapılandırırken en önemli kural: **Önce çalıştırın, sonra optimize edin**.
İlk çalışanınızı başarıyla işe başlatın, ardından kademeli olarak genişletin ve ince ayar yapın.

Sorun giderme adımlarını şu sırayla izleyebilirsiniz:

1. Model hizmeti bağlı mı?
2. Beceri sayısı çok mu fazla?
3. İstek net mi?
4. Görev hedefi açık mı?

Adım adım ilerleyerek gerçekten verimli bir AI ekibi oluşturabilirsiniz.