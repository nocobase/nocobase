:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Yapay Zeka Çalışanı · Yönetici Yapılandırma Rehberi

> Bu belge, Yapay Zeka Çalışanlarını nasıl yapılandıracağınızı ve yöneteceğinizi hızlıca anlamanıza yardımcı olacak. Model hizmetlerinden görev atamasına kadar tüm süreci adım adım sizinle birlikte tamamlayacağız.

## I. Başlamadan Önce

### 1. Sistem Gereksinimleri

Yapılandırmaya başlamadan önce ortamınızın aşağıdaki koşulları karşıladığından emin olun:

* **NocoBase 2.0 veya üzeri** sürüm yüklü olmalı
* **Yapay Zeka Çalışanı eklentisi** etkinleştirilmiş olmalı
* En az bir adet kullanılabilir **Büyük Dil Modeli hizmeti** (örn. OpenAI, Claude, DeepSeek, GLM vb.) bulunmalı

### 2. Yapay Zeka Çalışanlarının İki Katmanlı Tasarımını Anlama

Yapay Zeka Çalışanları iki katmana ayrılır: **"Rol Tanımı"** ve **"Görev Özelleştirme"**.

| Katman | Açıklama | Özellikler | İşlev |
|---|---|---|---|
| **Rol Tanımı** | Çalışanın temel kişiliği ve çekirdek yetenekleri | "Özgeçmiş" gibi, sabit ve değişmez | Rol tutarlılığını sağlar |
| **Görev Özelleştirme** | Farklı iş senaryolarına yönelik yapılandırma | Esnek ve ayarlanabilir | Belirli görevlere uyum sağlar |

**Basitçe ifade etmek gerekirse:**

> "Rol Tanımı" bu çalışanın kim olduğunu belirler,
> "Görev Özelleştirme" ise şu anda ne yapacağını belirler.

Bu tasarımın faydaları şunlardır:

* Rol sabit kalır, ancak farklı senaryolarda görev alabilir
* Görevleri yükseltmek veya değiştirmek çalışanın kendisini etkilemez
* Arka plan ve görevler birbirinden bağımsızdır, bu da bakımı kolaylaştırır

## II. Yapılandırma Süreci (5 Adımda Tamamlayın)

### Adım 1: Model Hizmetini Yapılandırın

Model hizmeti, bir Yapay Zeka Çalışanının beyni gibidir ve öncelikle kurulması gerekir.

> 💡 Ayrıntılı yapılandırma talimatları için lütfen şuraya bakın: [LLM Hizmetini Yapılandırın](/ai-employees/quick-start/llm-service)

**Yol:**
`Sistem Ayarları → Yapay Zeka Çalışanı → Model Hizmeti`

![Yapılandırma sayfasına girin](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

**Ekle**'ye tıklayın ve aşağıdaki bilgileri doldurun:

| Öğe | Açıklama | Notlar |
|---|---|---|
| Arayüz Tipi | Örn. OpenAI, Claude vb. | Aynı spesifikasyonu kullanan hizmetlerle uyumludur |
| API Anahtarı | Hizmet sağlayıcısı tarafından verilen anahtar | Gizli tutun ve düzenli olarak değiştirin |
| Hizmet Adresi | API Uç Noktası | Proxy kullanırken değiştirilmesi gerekir |
| Model Adı | Belirli model adı (örn. gpt-4, claude-opus) | Yetenekleri ve maliyeti etkiler |

![Büyük bir model hizmeti oluşturun](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Yapılandırmadan sonra lütfen **bağlantıyı test edin**.
Başarısız olursa, ağınızı, API anahtarınızı veya model adını kontrol edin.

![Bağlantıyı test edin](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

### Adım 2: Bir Yapay Zeka Çalışanı Oluşturun

> 💡 Ayrıntılı talimatlar için lütfen şuraya bakın: [Yapay Zeka Çalışanı Oluşturun](/ai-employees/quick-start/ai-employees)

Yol: `Yapay Zeka Çalışanı Yönetimi → Çalışan Oluştur`

Temel bilgileri doldurun:

| Alan | Gerekli | Örnek |
|---|---|---|
| Ad | ✓ | viz, dex, cole |
| Takma Ad | ✓ | Viz, Dex, Cole |
| Etkin Durum | ✓ | Açık |
| Biyografi | - | "Veri Analizi Uzmanı" |
| Ana İstek (Prompt) | ✓ | İstek Mühendisliği Rehberine bakın |
| Karşılama Mesajı | - | "Merhaba, ben Viz…" |

![Temel bilgi yapılandırması](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Ardından, az önce yapılandırdığınız **model hizmetini** bağlayın.

![Büyük model hizmetini bağlayın](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-22-27.png)

**İstek (Prompt) Yazma Önerileri:**

* Çalışanın rolünü, tonunu ve sorumluluklarını net bir şekilde belirtin
* Kuralları vurgulamak için "mutlaka", "asla" gibi kelimeler kullanın
* Soyut açıklamalardan kaçınmak için mümkün olduğunca örnekler ekleyin
* 500–1000 karakter arasında tutun

> İstek ne kadar net olursa, Yapay Zeka'nın performansı o kadar istikrarlı olur.
> [İstek Mühendisliği Rehberi](./prompt-engineering-guide.md) belgesine başvurabilirsiniz.

### Adım 3: Becerileri Yapılandırın

Beceriler, bir çalışanın "ne yapabileceğini" belirler.

> 💡 Ayrıntılı talimatlar için lütfen şuraya bakın: [Beceriler](/ai-employees/advanced/skill)

| Tip | Yetenek Kapsamı | Örnek | Risk Seviyesi |
|---|---|---|---|
| Ön Uç | Sayfa etkileşimi | Blok verilerini okuma, form doldurma | Düşük |
| Veri Modeli | Veri sorgulama ve analiz | Toplu istatistikler | Orta |
| İş Akışı | İş süreçlerini yürütme | Özel araçlar | İş akışına bağlıdır |
| Diğer | Harici uzantılar | Web araması, dosya işlemleri | Duruma göre değişir |

**Yapılandırma Önerileri:**

* Her çalışan için 3–5 beceri en uygunudur
* Tüm becerileri seçmek önerilmez, bu durum kafa karışıklığına yol açabilir
* Önemli işlemlerden önce otomatik kullanımı (Auto usage) kapatın

![Becerileri yapılandırın](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)

### Adım 4: Bilgi Tabanını Yapılandırın (İsteğe Bağlı)

Yapay Zeka çalışanınızın ürün kılavuzları, SSS'ler gibi çok sayıda materyali hatırlaması veya referans göstermesi gerekiyorsa, bir bilgi tabanı yapılandırabilirsiniz.

> 💡 Ayrıntılı talimatlar için lütfen şuraya bakın:
> - [Yapay Zeka Bilgi Tabanına Genel Bakış](/ai-employees/knowledge-base/index)
> - [Vektör Veritabanı](/ai-employees/knowledge-base/vector-database)
> - [Bilgi Tabanı Yapılandırması](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Erişim Destekli Üretim)](/ai-employees/knowledge-base/rag)

Bu, vektör veritabanı eklentisinin ek olarak yüklenmesini gerektirir.

![Bilgi tabanını yapılandırın](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Uygulanabilir Senaryolar:**

* Yapay Zeka'nın kurumsal bilgiyi anlamasını sağlamak
* Belge Soru-Cevap ve erişimi desteklemek
* Alan odaklı asistanlar eğitmek

### Adım 5: Etkiyi Doğrulayın

Tamamlandıktan sonra, sayfanın sağ alt köşesinde yeni çalışanın avatarını göreceksiniz.

![Yapılandırmayı doğrulayın](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Lütfen her bir öğeyi kontrol edin:

* ✅ Simge doğru şekilde görüntüleniyor mu?
* ✅ Temel bir sohbet gerçekleştirebiliyor mu?
* ✅ Beceriler doğru şekilde çağrılabiliyor mu?

Hepsi geçerse, yapılandırma başarılı demektir 🎉

## III. Görev Yapılandırması: Yapay Zeka'yı Gerçekten İşe Başlatma

Şimdiye kadar "çalışan oluşturma" işlemini tamamladık.
Sırada onları "işe başlatmak" var.

Yapay Zeka görevleri, çalışanın belirli bir sayfadaki veya bloktaki davranışını tanımlar.

> 💡 Ayrıntılı talimatlar için lütfen şuraya bakın: [Görevler](/ai-employees/advanced/task)

### 1. Sayfa Düzeyinde Görevler

"Bu sayfadaki verileri analiz et" gibi, tüm sayfa kapsamı için geçerlidir.

**Yapılandırma Girişi:**
`Sayfa Ayarları → Yapay Zeka Çalışanı → Görev Ekle`

| Alan | Açıklama | Örnek |
|---|---|---|
| Başlık | Görev adı | Aşama Dönüşüm Analizi |
| Bağlam | Mevcut sayfanın bağlamı | Potansiyel Müşteri listesi sayfası |
| Varsayılan Mesaj | Önceden ayarlanmış sohbet başlatıcı | "Lütfen bu ayın trendlerini analiz edin" |
| Varsayılan Blok | Otomatik olarak bir koleksiyonla ilişkilendir | potansiyel müşteriler tablosu |
| Beceriler | Mevcut araçlar | Veri sorgulama, grafik oluşturma |

![Sayfa düzeyinde görev yapılandırması](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Çoklu Görev Desteği:**
Aynı Yapay Zeka çalışanına birden fazla görev yapılandırılabilir ve bunlar kullanıcıya seçenek olarak sunulur:

![Çoklu görev desteği](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Öneriler:

* Bir görev tek bir hedefe odaklanmalı
* Adı açık ve anlaşılır olmalı
* Görev sayısı 5–7 arasında tutulmalı

### 2. Blok Düzeyinde Görevler

"Mevcut formu çevir" gibi belirli bir blok üzerinde işlem yapmak için uygundur.

**Yapılandırma Yöntemi:**

1. Blok işlem yapılandırmasını açın
2. "Yapay Zeka Çalışanı" ekleyin

![Yapay Zeka Çalışanı düğmesini ekle](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. Hedef çalışanı bağlayın

![Yapay Zeka Çalışanını seçin](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Blok düzeyinde görev yapılandırması](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Karşılaştırma Öğesi | Sayfa Düzeyi | Blok Düzeyi |
|---|---|---|
| Veri Kapsamı | Tüm sayfa | Mevcut blok |
| Granülerlik | Global analiz | Detaylı işlem |
| Tipik Kullanım | Trend analizi | Form çevirisi, alan çıkarma |

## IV. En İyi Uygulamalar

### 1. Yapılandırma Önerileri

| Öğe | Öneri | Neden |
|---|---|---|
| Beceri Sayısı | 3–5 | Yüksek doğruluk, hızlı yanıt |
| Otomatik kullanım | Dikkatli etkinleştirin | Yanlış işlemleri önler |
| İstek Uzunluğu | 500–1000 karakter | Hız ve kaliteyi dengeler |
| Görev Hedefi | Tek ve net | Yapay Zeka'nın kafasının karışmasını önler |
| İş Akışı | Karmaşık görevler kapsüllendikten sonra kullanın | Daha yüksek başarı oranı |

### 2. Pratik Öneriler

**Küçükten başlayın, kademeli olarak optimize edin:**

1. Öncelikle temel çalışanlar oluşturun (örn. Viz, Dex)
2. Test için 1–2 temel beceriyi etkinleştirin
3. Görevlerin normal şekilde yürütülebildiğini doğrulayın
4. Ardından, daha fazla beceri ve görevi kademeli olarak genişletin

**Sürekli optimizasyon süreci:**

1. İlk sürümü çalıştırın
2. Kullanıcı geri bildirimlerini toplayın
3. İstekleri ve görev yapılandırmalarını optimize edin
4. Test edin ve döngüsel olarak iyileştirin

## V. Sıkça Sorulan Sorular

### 1. Yapılandırma Aşaması

**S: Kaydetme başarısız olursa ne yapmalıyım?**
C: Tüm gerekli alanların, özellikle model hizmeti ve isteğin doldurulduğundan emin olun.

**S: Hangi modeli seçmeliyim?**

* Kod ile ilgili → Claude, GPT-4
* Analiz ile ilgili → Claude, DeepSeek
* Maliyet hassasiyeti → Qwen, GLM
* Uzun metin → Gemini, Claude

### 2. Kullanım Aşaması

**S: Yapay Zeka yanıtı çok yavaş mı?**

* Beceri sayısını azaltın
* İsteği optimize edin
* Model hizmeti gecikmesini kontrol edin
* Modeli değiştirmeyi düşünebilirsiniz

**S: Görev yürütme hatalı mı?**

* İstek yeterince net değil
* Çok fazla beceri kafa karışıklığına neden oluyor
* Görevi daha küçük parçalara ayırın, örnekler ekleyin

**S: Otomatik kullanım ne zaman etkinleştirilmelidir?**

* Sorgu türü görevler için etkinleştirilebilir
* Veri değiştirme türü görevler için kapatılması önerilir

**S: Yapay Zeka'nın belirli bir formu işlemesini nasıl sağlarım?**

C: Sayfa düzeyinde bir yapılandırma ise, bloğu manuel olarak seçmeniz gerekir.

![Bloğu manuel olarak seçin](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Blok düzeyinde görev yapılandırmalarında ise veri bağlamı otomatik olarak bağlanır.

## VI. Daha Fazla Okuma

Yapay Zeka çalışanlarınızı daha güçlü hale getirmek için aşağıdaki belgeleri okumaya devam edebilirsiniz:

**Yapılandırma ile İlgili:**

* [İstek Mühendisliği Rehberi](./prompt-engineering-guide.md) - Yüksek kaliteli istekler yazma teknikleri ve en iyi uygulamalar
* [LLM Hizmetini Yapılandırın](/ai-employees/quick-start/llm-service) - Büyük model hizmetleri için ayrıntılı yapılandırma talimatları
* [Yapay Zeka Çalışanı Oluşturun](/ai-employees/quick-start/ai-employees) - Yapay Zeka çalışanlarının oluşturulması ve temel yapılandırması
* [Yapay Zeka Çalışanı ile İş Birliği Yapın](/ai-employees/quick-start/collaborate) - Yapay Zeka çalışanları ile nasıl etkili diyalog kurulur

**Gelişmiş Özellikler:**

* [Beceriler](/ai-employees/advanced/skill) - Çeşitli becerilerin yapılandırması ve kullanımına dair derinlemesine bilgi
* [Görevler](/ai-employees/advanced/task) - Görev yapılandırması için gelişmiş teknikler
* [Blok Seçimi](/ai-employees/advanced/pick-block) - Yapay Zeka çalışanları için veri blokları nasıl belirlenir
* [Veri Kaynağı](/ai-employees/advanced/datasource) - Veri kaynaklarının yapılandırması ve yönetimi
* [Web Araması](/ai-employees/advanced/web-search) - Yapay Zeka çalışanlarının web arama yeteneğini yapılandırma

**Bilgi Tabanı ve RAG:**

* [Yapay Zeka Bilgi Tabanına Genel Bakış](/ai-employees/knowledge-base/index) - Bilgi tabanı özelliğinin tanıtımı
* [Vektör Veritabanı](/ai-employees/knowledge-base/vector-database) - Vektör veritabanının yapılandırması
* [Bilgi Tabanı](/ai-employees/knowledge-base/knowledge-base) - Bilgi tabanı nasıl oluşturulur ve yönetilir
* [RAG (Erişim Destekli Üretim)](/ai-employees/knowledge-base/rag) - RAG teknolojisinin uygulaması

**İş Akışı Entegrasyonu:**

* [LLM Düğümü - Metin Sohbeti](/ai-employees/workflow/nodes/llm/chat) - İş akışlarında metin sohbeti kullanma
* [LLM Düğümü - Çok Modlu Sohbet](/ai-employees/workflow/nodes/llm/multimodal-chat) - Resimler, dosyalar gibi çok modlu girdileri işleme
* [LLM Düğümü - Yapılandırılmış Çıktı](/ai-employees/workflow/nodes/llm/structured-output) - Yapılandırılmış Yapay Zeka yanıtları alma

## Sonuç

Yapay Zeka çalışanlarını yapılandırırken en önemli şey: **önce çalıştırın, sonra optimize edin**.
İlk çalışanınızı başarıyla işe başlatın, ardından kademeli olarak genişletin ve ince ayar yapın.

Sorun giderme adımlarını aşağıdaki sıraya göre izleyebilirsiniz:

1. Model hizmeti bağlı mı?
2. Beceri sayısı çok fazla mı?
3. İstek net mi?
4. Görev hedefi açıkça tanımlanmış mı?

Adım adım ilerlediğiniz sürece, gerçekten verimli bir Yapay Zeka ekibi oluşturabilirsiniz.