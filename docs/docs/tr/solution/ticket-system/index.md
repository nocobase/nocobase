:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/solution/ticket-system/index) bakın.
:::

# Destek Talebi Çözümüne Genel Bakış

> **Not**: Bu sürüm erken bir önizleme sürümüdür. Özellikler henüz tamamlanmamıştır ve sürekli iyileştirme aşamasındayız. Geri bildirimlerinizi bekliyoruz!

## 1. Arka Plan (Neden)

### Hangi Sektör / Rol / Yönetim Sorunlarını Çözer?

İşletmeler günlük operasyonlarında çeşitli hizmet talepleriyle karşılaşırlar: cihaz onarımı, BT desteği, müşteri şikayetleri, danışmanlık önerileri vb. Bu talepler farklı kaynaklardan (CRM sistemleri, saha mühendisleri, e-postalar, genel formlar vb.) gelir, işlem süreçleri farklılık gösterir ve birleşik bir takip ve yönetim mekanizmasından yoksundur.

**Tipik İş Senaryosu Örnekleri:**

- **Cihaz Onarımı**: Satış sonrası ekibi cihaz onarım taleplerini işler; seri numaraları, hata kodları ve yedek parçalar gibi cihaza özel bilgilerin kaydedilmesi gerekir.
- **BT Desteği**: BT departmanı; dahili çalışanların şifre sıfırlama, yazılım kurulumu ve ağ arızaları gibi taleplerini yönetir.
- **Müşteri Şikayetleri**: Müşteri hizmetleri ekibi çok kanallı müşteri şikayetlerini yönetir; bazı duygusal yoğunluğu yüksek müşterilerin öncelikli olarak ele alınması gerekir.
- **Müşteri Self-Servis**: Son kullanıcılar, hizmet taleplerini kolayca iletmek ve işlem sürecini takip etmek isterler.

### Hedef Kullanıcı Profili

| Boyut | Açıklama |
|------|------|
| İşletme Ölçeği | Önemli miktarda müşteri hizmeti ihtiyacı olan küçük, orta ve büyük ölçekli işletmeler |
| Rol Yapısı | Müşteri hizmetleri ekipleri, BT desteği, satış sonrası ekipler, operasyon yöneticileri |
| Dijital Olgunluk | Başlangıç ile orta seviye arası; Excel/e-posta yönetiminden sistematik yönetime geçmek isteyenler |

### Mevcut Ana Akım Çözümlerin Sorunlu Noktaları

- **Yüksek Maliyet / Yavaş Özelleştirme**: SaaS destek talebi sistemleri pahalıdır ve özel geliştirme süreçleri uzundur.
- **Sistem Parçalanması ve Veri Adaları**: Çeşitli iş verileri farklı sistemlere dağılmıştır, bu da birleşik analiz ve karar vermeyi zorlaştırır.
- **Hızlı Değişen İş İhtiyaçları, Evrilmesi Zor Sistemler**: İş gereksinimleri değiştiğinde, sistemlerin hızlıca ayarlanması zordur.
- **Yavaş Hizmet Yanıtı**: Farklı sistemler arasında dolaşan talepler zamanında atanamaz.
- **Şeffaf Olmayan Süreç**: Müşteriler talebin ilerlemesini takip edemez, sıkça sorulan sorular müşteri hizmetleri üzerindeki baskıyı artırır.
- **Kalite Güvencesi Zorluğu**: SLA izleme eksikliği nedeniyle, zaman aşımları ve olumsuz geri bildirimler zamanında uyarılmaz.

---

## 2. Referans Ürünler ve Karşılaştırma (Benchmark)

### Piyasadaki Ana Akım Ürünler

- **SaaS**: Salesforce, Zendesk, Odoo vb.
- **Özel Sistemler / Dahili Sistemler**

### Karşılaştırma Boyutları

- Özellik Kapsamı
- Esneklik
- Genişletilebilirlik
- Yapay Zeka Kullanım Biçimi

### NocoBase Çözümünün Farklılıkları

**Platform Düzeyinde Avantajlar:**

- **Yapılandırma Öncelikli**: Temel veri tablolarından iş türlerine, SLA'dan beceri tabanlı yönlendirmeye kadar her şey yapılandırma yoluyla yönetilir.
- **Düşük Kod (Low-Code) ile Hızlı Kurulum**: Özel geliştirmeden daha hızlı, SaaS çözümlerinden daha esnektir.

**Geleneksel Sistemlerin Yapamadığı veya Maliyetinin Çok Yüksek Olduğu Alanlar:**

- **Yerleşik Yapay Zeka Entegrasyonu**: NocoBase'in yapay zeka eklentileri sayesinde akıllı sınıflandırma, form doldurma yardımı ve bilgi önerileri sağlanır.
- **Tüm Tasarımlar Kullanıcı Tarafından Kopyalanabilir**: Kullanıcılar şablonlar üzerinden kendi sistemlerini genişletebilirler.
- **T-Tipi Veri Mimarisi**: Ana tablo + iş genişletme tabloları; yeni bir iş türü eklemek için sadece bir genişletme tablosu eklemek yeterlidir.

---

## 3. Tasarım İlkeleri (Principles)

- **Düşük Bilişsel Maliyet**
- **Teknolojiden Önce İş Süreçleri**
- **Tek Seferlik Değil, Evrilebilir Yapı**
- **Yapılandırma Öncelikli, Kod Son Çare**
- **Yapay Zekanın İnsanın Yerini Alması Değil, İnsan-Yapay Zeka İş Birliği**
- **Tüm Tasarımlar Kullanıcı Tarafından Kopyalanabilir Olmalıdır**

---

## 4. Çözüme Genel Bakış (Solution Overview)

### Özet Tanıtım

NocoBase düşük kod platformu üzerine inşa edilen genel destek talebi merkezi şunları sağlar:

- **Birleşik Giriş**: Çok kaynaklı erişim, standartlaştırılmış işlem.
- **Akıllı Dağıtım**: Yapay zeka destekli sınıflandırma, yük dengeli atama.
- **Polimorfik İş Yapısı**: Çekirdek ana tablo + iş genişletme tabloları ile esnek genişleme.
- **Kapalı Döngü Geri Bildirim**: SLA izleme, müşteri değerlendirmesi, olumsuz geri bildirim takibi.

### Destek Talebi İşlem Süreci

```
Çok Kaynaklı Giriş → Ön İşleme/AI Analizi → Akıllı Atama → Manuel Uygulama → Geri Bildirim Döngüsü
        ↓                  ↓                   ↓                ↓                   ↓
 Mükerrer Kontrolü   Niyet Tanımlama      Beceri Eşleştirme   Durum Akışı      Memnuniyet Değerlendirmesi
                     Duygu Analizi        Yük Dengeleme       SLA İzleme       Olumsuz Geri Bildirim Takibi
                     Otomatik Yanıt       Kuyruk Yönetimi     Yorum İletişimi  Veri Arşivleme
```

### Temel Modül Listesi

| Modül | Açıklama |
|------|----------|
| Talep Alımı | Genel formlar, müşteri portalı, müşteri temsilcisi kaydı, API/Webhook, e-posta ayrıştırma |
| Talep Yönetimi | Talep CRUD işlemleri, durum akışı, atama/devretme, yorum iletişimi, işlem günlükleri |
| İş Genişletme | Cihaz onarımı, BT desteği, müşteri şikayetleri vb. için iş genişletme tabloları |
| SLA Yönetimi | SLA yapılandırması, zaman aşımı uyarıları, zaman aşımı yükseltme |
| Müşteri Yönetimi | Müşteri ana tablosu, kişi yönetimi, müşteri portalı |
| Değerlendirme Sistemi | Çok boyutlu puanlama, hızlı etiketler, NPS, olumsuz geri bildirim uyarıları |
| Yapay Zeka Yardımı | Niyet sınıflandırması, duygu analizi, bilgi önerisi, yanıt yardımı, üslup düzenleme |

### Temel Arayüz Gösterimi

![ticketing-imgs-2026-01-01-00-46-12](https://static-docs.nocobase.com/ticketing-imgs-2026-01-01-00-46-12.jpg)

---

## 5. Yapay Zeka Çalışanları (AI Employee)

### Yapay Zeka Çalışan Türleri ve Senaryoları

- **Müşteri Hizmetleri Asistanı**, **Satış Asistanı**, **Veri Analisti**, **Denetçi**
- İnsanların yerini almak için değil, onlara yardımcı olmak için.

### Yapay Zeka Çalışan Değerinin Sayısallaştırılması

Bu çözümde, yapay zeka çalışanları şunları yapabilir:

| Değer Boyutu | Somut Etki |
|--------------|------------|
| Verimliliği Artırma | Otomatik sınıflandırma ile manuel ayıklama süresinde %50+ azalma; bilgi önerileri ile sorunların daha hızlı çözülmesi |
| Maliyetleri Düşürme | Basit sorulara otomatik yanıt vererek müşteri hizmetleri iş yükünü azaltma |
| İnsan Çalışanları Güçlendirme | Duygu uyarıları ile temsilcilerin önceden hazırlanmasına yardımcı olma; yanıt düzenleme ile iletişim kalitesini artırma |
| Müşteri Memnuniyetini Artırma | Daha hızlı yanıt, daha doğru atama, daha profesyonel cevaplar |

---

## 6. Öne Çıkanlar (Highlights)

### 1. T-Tipi Veri Mimarisi

- Tüm talepler ana tabloyu paylaşır ve birleşik akış mantığını kullanır.
- İş genişletme tabloları, türe özgü alanları taşır ve esnek genişleme sağlar.
- Yeni bir iş türü eklemek, ana akışı etkilemeden sadece bir genişletme tablosu eklemeyi gerektirir.

### 2. Tam Destek Talebi Yaşam Döngüsü

- Yeni → Atandı → İşleniyor → Beklemede → Çözüldü → Kapatıldı.
- Devretme, iade etme, yeniden açma gibi karmaşık senaryoları destekler.
- SLA zamanlaması, bekleme/duraklatma durumlarında hassas şekilde hesaplanır.

### 3. Çok Kanallı Birleşik Erişim

- Genel formlar, müşteri portalı, API, e-posta, temsilci kaydı.
- Mükerrerlik (idempotency) kontrolü ile aynı talebin birden fazla oluşturulması engellenir.

### 4. Yerleşik Yapay Zeka Entegrasyonu

- Sadece bir "AI butonu eklemek" değil, her aşamaya entegre edilmiştir.
- Niyet tanıma, duygu analizi, bilgi önerisi, yanıt düzenleme.

---

## 7. Kurulum ve Dağıtım

### Nasıl Kurulur ve Kullanılır

Çeşitli kısmi uygulamaları diğer uygulamalara taşımak ve entegre etmek için taşıma yönetimini kullanın.

---

## 8. Yol Haritası (Sürekli Güncelleniyor)

- **Sistem Gömme**: Destek talebi modülünün ERP, CRM gibi farklı iş sistemlerine gömülmesini destekleme.
- **Talep Bağlantısı**: Sistemler arası talep iş birliğini sağlamak için alt/üst sistem talep erişimi ve durum geri bildirimleri.
- **Yapay Zeka Otomasyonu**: İş akışlarına gömülü, arka planda otomatik çalışan ve insansız işlem yapabilen yapay zeka çalışanları.
- **Çoklu Kiracılık Desteği**: Çoklu alan/çoklu uygulama mimarisi ile farklı müşteri hizmetleri ekiplerine bağımsız operasyon imkanı.
- **Bilgi Tabanı RAG**: Akıllı arama ve bilgi önerileri için tüm verilerin (talepler, müşteriler, ürünler vb.) otomatik vektörleştirilmesi.
- **Çoklu Dil Desteği**: Uluslararası/bölgeler arası ekip iş birliği ihtiyaçlarını karşılamak için arayüz ve içerikte çoklu dil seçeneği.