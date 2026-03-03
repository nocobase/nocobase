:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/solution/ticket-system/design) bakın.
:::

# Destek Talebi Çözümü Detaylı Tasarımı

> **Sürüm**: v2.0-beta

> **Güncelleme Tarihi**: 2026-01-05

> **Durum**: Önizleme

## 1. Sisteme Genel Bakış ve Tasarım Felsefesi

### 1.1 Sistem Konumlandırması

Bu sistem, NocoBase düşük kodlu platformu üzerine inşa edilmiş **AI destekli akıllı bir destek talebi yönetim platformudur**. Temel hedef şudur:

```
Müşteri hizmetlerinin sıkıcı süreç operasyonlarına değil, sorunları çözmeye odaklanmasını sağlayın
```

### 1.2 Tasarım Felsefesi

#### Felsefe 1: T-Tipi Veri Mimarisi

**T-Tipi Mimari Nedir?**

"T-tipi insan" kavramından esinlenilmiştir — yatay genişlik + dikey derinlik:

- **Yatay (Ana Tablo)**: Tüm iş türlerini kapsayan evrensel yetenekler — numara, durum, atanan kişi, SLA gibi temel alanlar.
- **Dikey (Genişletme Tabloları)**: Belirli iş kollarına özgü uzmanlık alanları — cihaz onarımı için seri numaraları, şikayetler için tazminat planları.

![ticketing-imgs-2025-12-31-22-50-45](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-50-45.png)

**Neden Bu Tasarım?**

| Geleneksel Yöntem | T-Tipi Mimari |
|-------------------|---------------|
| Her iş türü için bir tablo, yinelenen alanlar | Ortak alanlar merkezi yönetimde, iş alanları ihtiyaca göre genişletilir |
| İstatistiksel raporlar için birden fazla tabloyu birleştirmek gerekir | Tek bir ana tablo üzerinden tüm taleplerin istatistiği tutulur |
| Süreç değişiklikleri birden fazla yerde düzenleme gerektirir | Temel süreç değişiklikleri sadece tek bir noktada yapılır |
| Yeni iş türleri için yeni tablolar gerekir | Sadece genişletme tablosu eklenir, ana akış değişmez |

#### Felsefe 2: AI Çalışan Ekibi

Sadece "AI özellikleri" değil, "AI çalışanları". Her AI'nın net bir rolü, kişiliği ve sorumlulukları vardır:

| AI Çalışanı | Pozisyon | Temel Sorumluluklar | Tetikleme Senaryosu |
|-------------|----------|---------------------|---------------------|
| **Sam** | Hizmet Masası Sorumlusu | Talep yönlendirme, öncelik değerlendirme, eskalasyon kararları | Talep oluşturulduğunda otomatik |
| **Grace** | Müşteri Başarı Uzmanı | Yanıt oluşturma, üslup düzenleme, şikayet yönetimi | Temsilci "AI Yanıtı"na tıkladığında |
| **Max** | Bilgi Asistanı | Benzer vakalar, bilgi bankası önerileri, çözüm sentezi | Talep detay sayfasında otomatik |
| **Lexi** | Tercüman | Çok dilli çeviri, yorum çevirisi | Yabancı dil algılandığında otomatik |

**Neden "AI Çalışanı" Modeli?**

- **Net Sorumluluklar**: Sam yönlendirmeyle, Grace yanıtlarla ilgilenir; karışıklık olmaz.
- **Anlaşılması Kolay**: Kullanıcıya "Sınıflandırma API'sini çağır" demek yerine "Bırakalım Sam analiz etsin" demek daha dostanedir.
- **Genişletilebilir**: Yeni AI yetenekleri eklemek = yeni çalışan işe almak.

#### Felsefe 3: Bilgi Öz-Döngüsü

![ticketing-imgs-2025-12-31-22-51-09](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-09.png)

Bu, bir **Bilgi Birikimi - Bilgi Uygulaması** kapalı döngüsü oluşturur.

---

## 2. Temel Varlıklar ve Veri Modeli

### 2.1 Varlık İlişkilerine Genel Bakış

![ticketing-imgs-2025-12-31-22-51-23](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-23.png)


### 2.2 Temel Tablo Detayları

#### 2.2.1 Destek Talebi Ana Tablosu (nb_tts_tickets)

Sistemin çekirdeğidir; sık kullanılan tüm alanları ana tabloda toplayan "geniş tablo" tasarımı kullanır.

**Temel Bilgiler**

| Alan | Tür | Açıklama | Örnek |
|------|-----|----------|-------|
| id | BIGINT | Birincil anahtar | 1001 |
| ticket_no | VARCHAR | Talep numarası | TKT-20251229-0001 |
| title | VARCHAR | Başlık | Ağ bağlantısı yavaş |
| description | TEXT | Sorun açıklaması | Bu sabahtan beri ofis ağı... |
| biz_type | VARCHAR | İş türü | it_support |
| priority | VARCHAR | Öncelik | P1 |
| status | VARCHAR | Durum | processing |

**Kaynak Takibi**

| Alan | Tür | Açıklama | Örnek |
|------|-----|----------|-------|
| source_system | VARCHAR | Kaynak sistem | crm / email / iot |
| source_channel | VARCHAR | Kaynak kanal | web / phone / wechat |
| external_ref_id | VARCHAR | Harici referans ID | CRM-2024-0001 |

**İletişim Bilgileri**

| Alan | Tür | Açıklama |
|------|-----|----------|
| customer_id | BIGINT | Müşteri ID |
| contact_name | VARCHAR | İlgili kişi adı |
| contact_phone | VARCHAR | İletişim telefonu |
| contact_email | VARCHAR | İletişim e-postası |
| contact_company | VARCHAR | Şirket adı |

**Atanan Bilgisi**

| Alan | Tür | Açıklama |
|------|-----|----------|
| assignee_id | BIGINT | Atanan kişi ID |
| assignee_department_id | BIGINT | Atanan departman ID |
| transfer_count | INT | Aktarım sayısı |

**Zaman Noktaları**

| Alan | Tür | Açıklama | Tetikleme Zamanı |
|------|-----|----------|------------------|
| submitted_at | TIMESTAMP | Gönderim zamanı | Talep oluşturulduğunda |
| assigned_at | TIMESTAMP | Atama zamanı | Sorumlu belirlendiğinde |
| first_response_at | TIMESTAMP | İlk yanıt zamanı | Müşteriye ilk yanıt verildiğinde |
| resolved_at | TIMESTAMP | Çözüm zamanı | Durum 'resolved' olduğunda |
| closed_at | TIMESTAMP | Kapanış zamanı | Durum 'closed' olduğunda |

**SLA İlişkili**

| Alan | Tür | Açıklama |
|------|-----|----------|
| sla_config_id | BIGINT | SLA yapılandırma ID |
| sla_response_due | TIMESTAMP | Yanıt son tarihi |
| sla_resolve_due | TIMESTAMP | Çözüm son tarihi |
| sla_paused_at | TIMESTAMP | SLA duraklatma başlangıcı |
| sla_paused_duration | INT | Toplam duraklatma süresi (dakika) |
| is_sla_response_breached | BOOLEAN | Yanıt süresi ihlali |
| is_sla_resolve_breached | BOOLEAN | Çözüm süresi ihlali |

**AI Analiz Sonuçları**

| Alan | Tür | Açıklama | Dolduran |
|------|-----|----------|----------|
| ai_category_code | VARCHAR | AI tarafından tanımlanan kategori | Sam |
| ai_sentiment | VARCHAR | Duygu analizi | Sam |
| ai_urgency | VARCHAR | Aciliyet seviyesi | Sam |
| ai_keywords | JSONB | Anahtar kelimeler | Sam |
| ai_reasoning | TEXT | Akıl yürütme süreci | Sam |
| ai_suggested_reply | TEXT | Önerilen yanıt | Sam/Grace |
| ai_confidence_score | NUMERIC | Güven puanı | Sam |
| ai_analysis | JSONB | Tam analiz sonucu | Sam |

**Çoklu Dil Desteği**

| Alan | Tür | Açıklama | Dolduran |
|------|-----|----------|----------|
| source_language_code | VARCHAR | Orijinal dil | Sam/Lexi |
| target_language_code | VARCHAR | Hedef dil | Sistem varsayılanı EN |
| is_translated | BOOLEAN | Çevrildi mi? | Lexi |
| description_translated | TEXT | Çevrilmiş açıklama | Lexi |

#### 2.2.2 İş Genişletme Tabloları

**Cihaz Onarımı (nb_tts_biz_repair)**

| Alan | Tür | Açıklama |
|------|-----|----------|
| ticket_id | BIGINT | İlişkili talep ID |
| equipment_model | VARCHAR | Cihaz modeli |
| serial_number | VARCHAR | Seri numarası |
| fault_code | VARCHAR | Hata kodu |
| spare_parts | JSONB | Yedek parça listesi |
| maintenance_type | VARCHAR | Bakım türü |

**BT Desteği (nb_tts_biz_it_support)**

| Alan | Tür | Açıklama |
|------|-----|----------|
| ticket_id | BIGINT | İlişkili talep ID |
| asset_number | VARCHAR | Varlık numarası |
| os_version | VARCHAR | İşletim sistemi sürümü |
| software_name | VARCHAR | İlgili yazılım |
| remote_address | VARCHAR | Uzak adres |
| error_code | VARCHAR | Hata kodu |

**Müşteri Şikayeti (nb_tts_biz_complaint)**

| Alan | Tür | Açıklama |
|------|-----|----------|
| ticket_id | BIGINT | İlişkili talep ID |
| related_order_no | VARCHAR | İlgili sipariş no |
| complaint_level | VARCHAR | Şikayet seviyesi |
| compensation_amount | DECIMAL | Tazminat tutarı |
| compensation_type | VARCHAR | Tazminat yöntemi |
| root_cause | TEXT | Kök neden |

#### 2.2.3 Yorum Tablosu (nb_tts_ticket_comments)

**Temel Alanlar**

| Alan | Tür | Açıklama |
|------|-----|----------|
| id | BIGINT | Birincil anahtar |
| ticket_id | BIGINT | Talep ID |
| parent_id | BIGINT | Üst yorum ID (ağaç yapısı desteği) |
| content | TEXT | Yorum içeriği |
| direction | VARCHAR | Yön: inbound (müşteri)/outbound (temsilci) |
| is_internal | BOOLEAN | Dahili not mu? |
| is_first_response | BOOLEAN | İlk yanıt mı? |

**AI Denetim Alanları (Giden yorumlar için)**

| Alan | Tür | Açıklama |
|------|-----|----------|
| source_language_code | VARCHAR | Kaynak dil |
| content_translated | TEXT | Çevrilmiş içerik |
| is_translated | BOOLEAN | Çevrildi mi? |
| is_ai_blocked | BOOLEAN | AI tarafından engellendi mi? |
| ai_block_reason | VARCHAR | Engelleme nedeni |
| ai_block_detail | TEXT | Detaylı açıklama |
| ai_quality_score | NUMERIC | Kalite puanı |
| ai_suggestions | TEXT | İyileştirme önerileri |

#### 2.2.4 Değerlendirme Tablosu (nb_tts_ratings)

| Alan | Tür | Açıklama |
|------|-----|----------|
| ticket_id | BIGINT | Talep ID (benzersiz) |
| overall_rating | INT | Genel memnuniyet (1-5) |
| response_rating | INT | Yanıt hızı (1-5) |
| professionalism_rating | INT | Profesyonellik (1-5) |
| resolution_rating | INT | Sorun çözümü (1-5) |
| nps_score | INT | NPS puanı (0-10) |
| tags | JSONB | Hızlı etiketler |
| comment | TEXT | Yazılı değerlendirme |

#### 2.2.5 Bilgi Bankası Makaleleri (nb_tts_qa_articles)

| Alan | Tür | Açıklama |
|------|-----|----------|
| article_no | VARCHAR | Makale no KB-T0001 |
| title | VARCHAR | Başlık |
| content | TEXT | İçerik (Markdown) |
| summary | TEXT | Özet |
| category_code | VARCHAR | Kategori kodu |
| keywords | JSONB | Anahtar kelimeler |
| source_type | VARCHAR | Kaynak: ticket/faq/manual |
| source_ticket_id | BIGINT | Kaynak talep ID |
| ai_generated | BOOLEAN | AI tarafından mı oluşturuldu? |
| ai_quality_score | NUMERIC | Kalite puanı |
| status | VARCHAR | Durum: draft/published/archived |
| view_count | INT | Görüntülenme sayısı |
| helpful_count | INT | Faydalı sayısı |

### 2.3 Veri Tablosu Listesi

| No | Tablo Adı | Açıklama | Kayıt Türü |
|----|-----------|----------|------------|
| 1 | nb_tts_tickets | Destek talebi ana tablosu | İş Verisi |
| 2 | nb_tts_biz_repair | Cihaz onarımı genişletmesi | İş Verisi |
| 3 | nb_tts_biz_it_support | BT desteği genişletmesi | İş Verisi |
| 4 | nb_tts_biz_complaint | Müşteri şikayeti genişletmesi | İş Verisi |
| 5 | nb_tts_customers | Müşteri ana tablosu | İş Verisi |
| 6 | nb_tts_customer_contacts | Müşteri ilgili kişileri | İş Verisi |
| 7 | nb_tts_ticket_comments | Talep yorumları | İş Verisi |
| 8 | nb_tts_ratings | Memnuniyet değerlendirmeleri | İş Verisi |
| 9 | nb_tts_qa_articles | Bilgi bankası makaleleri | Bilgi Verisi |
| 10 | nb_tts_qa_article_relations | Makale ilişkileri | Bilgi Verisi |
| 11 | nb_tts_faqs | Sıkça sorulan sorular | Bilgi Verisi |
| 12 | nb_tts_tickets_categories | Talep kategorileri | Yapılandırma |
| 13 | nb_tts_sla_configs | SLA yapılandırması | Yapılandırma |
| 14 | nb_tts_skill_configs | Beceri yapılandırması | Yapılandırma |
| 15 | nb_tts_business_types | İş türleri | Yapılandırma |

---

## 3. Destek Talebi Yaşam Döngüsü

### 3.1 Durum Tanımları

| Durum | Adı | Açıklama | SLA Zamanlaması | Renk |
|-------|-----|----------|-----------------|------|
| new | Yeni | Yeni oluşturuldu, atama bekliyor | Başlat | 🔵 Mavi |
| assigned | Atandı | Sorumlu belirlendi, kabul bekliyor | Devam Et | 🔷 Cam Göbeği |
| processing | İşleniyor | Üzerinde çalışılıyor | Devam Et | 🟠 Turuncu |
| pending | Beklemede | Müşteri geri bildirimi bekleniyor | **Duraklat** | ⚫ Gri |
| transferred | Aktarıldı | Başka birine devredildi | Devam Et | 🟣 Mor |
| resolved | Çözüldü | Müşteri onayı bekleniyor | Durdur | 🟢 Yeşil |
| closed | Kapalı | Talep sonuçlandı | Durdur | ⚫ Gri |
| cancelled | İptal Edildi | Talep iptal edildi | Durdur | ⚫ Gri |

### 3.2 Durum Akış Diyagramı

**Ana Akış (Soldan Sağa)**

![ticketing-imgs-2025-12-31-22-51-45](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-45.png)

**Yan Akışlar**

![ticketing-imgs-2025-12-31-22-52-42](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-52-42.png)

![ticketing-imgs-2025-12-31-22-52-53](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-52-53.png)


**Tam Durum Makinesi**

![ticketing-imgs-2025-12-31-22-54-23](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-54-23.png)

### 3.3 Kritik Durum Geçiş Kuralları

| Kaynak | Hedef | Tetikleyici Koşul | Sistem Eylemi |
|--------|-------|-------------------|---------------|
| new | assigned | Sorumlu atanması | assigned_at kaydı |
| assigned | processing | Sorumlunun "Kabul Et"e tıklaması | Yok |
| processing | pending | "Beklemeye Al"a tıklanması | sla_paused_at kaydı |
| pending | processing | Müşteri yanıtı / Manuel devam | Duraklatma süresini hesapla, paused_at'i temizle |
| processing | resolved | "Çözüldü"ye tıklanması | resolved_at kaydı |
| resolved | closed | Müşteri onayı / 3 gün zaman aşımı | closed_at kaydı |
| * | cancelled | Talebin iptal edilmesi | Yok |


---

## 4. SLA Hizmet Seviyesi Yönetimi

### 4.1 Öncelik ve SLA Yapılandırması

| Öncelik | Adı | Yanıt Süresi | Çözüm Süresi | Uyarı Eşiği | Tipik Senaryo |
|---------|-----|--------------|--------------|-------------|---------------|
| P0 | Kritik | 15 dakika | 2 saat | %80 | Sistem çökmesi, üretim hattı durması |
| P1 | Yüksek | 1 saat | 8 saat | %80 | Önemli özellik arızası |
| P2 | Orta | 4 saat | 24 saat | %80 | Genel sorunlar |
| P3 | Düşük | 8 saat | 72 saat | %80 | Danışma, öneriler |

### 4.2 SLA Hesaplama Mantığı

![ticketing-imgs-2025-12-31-22-53-54](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-53-54.png)

#### Talep Oluşturulduğunda

```
Yanıt Son Tarihi = Gönderim Zamanı + Yanıt Süresi (dakika)
Çözüm Son Tarihi = Gönderim Zamanı + Çözüm Süresi (dakika)
```

#### Beklemeye Alındığında (pending)

```
SLA Duraklatma Başlangıcı = Şu anki zaman
```

#### Devam Edildiğinde (pending durumundan processing durumuna)

```
-- Mevcut duraklatma süresini hesapla
Mevcut Duraklatma Süresi = Şu anki zaman - SLA Duraklatma Başlangıcı

-- Toplam duraklatma süresine ekle
Toplam Duraklatma Süresi = Toplam Duraklatma Süresi + Mevcut Duraklatma Süresi

-- Son tarihleri uzat (duraklatma süresi SLA'ya dahil edilmez)
Yanıt Son Tarihi = Yanıt Son Tarihi + Mevcut Duraklatma Süresi
Çözüm Son Tarihi = Çözüm Son Tarihi + Mevcut Duraklatma Süresi

-- Duraklatma başlangıcını temizle
SLA Duraklatma Başlangıcı = Boş
```

#### SLA İhlal Kararı

```
-- Yanıt İhlali
Yanıt İhlal Edildi mi? = (İlk Yanıt Zamanı boş VE Şu anki zaman > Yanıt Son Tarihi)
                       VEYA (İlk Yanıt Zamanı > Yanıt Son Tarihi)

-- Çözüm İhlali
Çözüm İhlal Edildi mi? = (Çözüm Zamanı boş VE Şu anki zaman > Çözüm Son Tarihi)
                       VEYA (Çözüm Zamanı > Çözüm Son Tarihi)
```

### 4.3 SLA Uyarı Mekanizması

| Uyarı Seviyesi | Koşul | Bildirim Alacak Kişi | Yöntem |
|----------------|-------|----------------------|--------|
| Sarı Uyarı | Kalan süre < %20 | Sorumlu | Sistem içi mesaj |
| Kırmızı Uyarı | Zaman aşımı gerçekleşti | Sorumlu + Yönetici | Sistem içi + E-posta |
| Eskalasyon | Zaman aşımı + 1 saat | Departman Müdürü | E-posta + SMS |

### 4.4 SLA Gösterge Paneli Metrikleri

| Metrik | Formül | Sağlık Eşiği |
|--------|--------|--------------|
| Yanıt Uyumluluk Oranı | İhlal edilmeyen talepler / Toplam talepler | > %95 |
| Çözüm Uyumluluk Oranı | İhlal edilmeden çözülenler / Toplam çözülenler | > %90 |
| Ortalama Yanıt Süresi | TOPLAM(Yanıt Süresi) / Talep Sayısı | < SLA'nın %50'si |
| Ortalama Çözüm Süresi | TOPLAM(Çözüm Süresi) / Talep Sayısı | < SLA'nın %80'i |

---

## 5. AI Yetenekleri ve Çalışan Sistemi

### 5.1 AI Çalışan Ekibi

Sistem, iki kategoride 8 AI çalışanı ile yapılandırılmıştır:

**Yeni Çalışanlar (Destek Sistemine Özel)**

| ID | Adı | Pozisyon | Temel Yetenekler |
|----|-----|----------|------------------|
| sam | Sam | Hizmet Masası Sorumlusu | Talep yönlendirme, öncelik değerlendirme, eskalasyon kararları, SLA risk tespiti |
| grace | Grace | Müşteri Başarı Uzmanı | Profesyonel yanıt oluşturma, üslup düzenleme, şikayet yönetimi, memnuniyet kurtarma |
| max | Max | Bilgi Asistanı | Benzer vaka bulma, bilgi bankası önerileri, çözüm sentezi |

**Yeniden Kullanılan Çalışanlar (Genel Yetenekler)**

| ID | Adı | Pozisyon | Temel Yetenekler |
|----|-----|----------|------------------|
| dex | Dex | Veri Düzenleyici | E-postadan talep oluşturma, çağrıdan talep oluşturma, toplu veri temizleme |
| ellis | Ellis | E-posta Uzmanı | E-posta duygu analizi, yazışma özeti, yanıt taslağı hazırlama |
| lexi | Lexi | Tercüman | Talep çevirisi, yanıt çevirisi, gerçek zamanlı diyalog çevirisi |
| cole | Cole | NocoBase Uzmanı | Sistem kullanım rehberliği, iş akışı yapılandırma yardımı |
| vera | Vera | Araştırma Analisti | Teknik çözüm araştırması, ürün bilgisi doğrulama |

### 5.2 AI Görev Listesi

Her AI çalışanı 4 spesifik görevle yapılandırılmıştır:

#### Sam'in Görevleri

| Görev ID | Adı | Tetikleme Yöntemi | Açıklama |
|----------|-----|-------------------|----------|
| SAM-01 | Talep Analizi ve Yönlendirme | Otomatik iş akışı | Yeni talep oluştuğunda otomatik analiz |
| SAM-02 | Öncelik Yeniden Değerlendirme | Ön yüz etkileşimi | Yeni bilgilere göre önceliği ayarla |
| SAM-03 | Eskalasyon Kararı | Ön yüz/İş akışı | Eskalasyon gerekip gerekmediğine karar ver |
| SAM-04 | SLA Risk Değerlendirmesi | Otomatik iş akışı | Zaman aşımı risklerini belirle |

#### Grace'in Görevleri

| Görev ID | Adı | Tetikleme Yöntemi | Açıklama |
|----------|-----|-------------------|----------|
| GRACE-01 | Profesyonel Yanıt Oluşturma | Ön yüz etkileşimi | Bağlama göre yanıt oluştur |
| GRACE-02 | Yanıt Üslup Düzenleme | Ön yüz etkileşimi | Mevcut yanıtın üslubunu optimize et |
| GRACE-03 | Şikayet Yatıştırma | Ön yüz/İş akışı | Müşteri şikayetlerini çözüme kavuştur |
| GRACE-04 | Memnuniyet Kurtarma | Ön yüz/İş akışı | Olumsuz deneyim sonrası takip |

#### Max'in Görevleri

| Görev ID | Adı | Tetikleme Yöntemi | Açıklama |
|----------|-----|-------------------|----------|
| MAX-01 | Benzer Vaka Arama | Ön yüz/İş akışı | Geçmişteki benzer talepleri bul |
| MAX-02 | Bilgi Makalesi Önerisi | Ön yüz/İş akışı | İlgili bilgi bankası makalelerini öner |
| MAX-03 | Çözüm Sentezi | Ön yüz etkileşimi | Çoklu kaynaktan çözüm sentezle |
| MAX-04 | Sorun Giderme Kılavuzu | Ön yüz etkileşimi | Sistematik sorun giderme süreci oluştur |

#### Lexi'nin Görevleri

| Görev ID | Adı | Tetikleme Yöntemi | Açıklama |
|----------|-----|-------------------|----------|
| LEXI-01 | Talep Çevirisi | Otomatik iş akışı | Talep içeriğini çevir |
| LEXI-02 | Yanıt Çevirisi | Ön yüz etkileşimi | Temsilci yanıtlarını çevir |
| LEXI-03 | Toplu Çeviri | Otomatik iş akışı | Toplu çeviri işlemi |
| LEXI-04 | Gerçek Zamanlı Diyalog Çevirisi | Ön yüz etkileşimi | Canlı sohbet çevirisi |

### 5.3 AI Çalışanları ve Talep Yaşam Döngüsü

![ticketing-imgs-2025-12-31-22-55-04](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-04.png)

### 5.4 AI Yanıt Örnekleri

#### SAM-01 Talep Analiz Yanıtı

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "giriş hatası", "zaman aşımı", "ay sonu kapanışı"],
  "confidence": 0.92,
  "reasoning": "Bu talep, finans departmanının ay sonu kapanışını etkileyen bir ERP sistemi giriş sorununu tanımlıyor, aciliyet yüksek",
  "suggested_reply": "Sayın Müşterimiz, bu sorunu bildirdiğiniz için teşekkür ederiz...",
  "source_language_code": "tr",
  "is_translated": true,
  "description_translated": "Merhaba, ERP sistemimize giriş yapamıyoruz..."
}
```

#### GRACE-01 Yanıt Oluşturma Yanıtı

```
Sayın Ahmet Bey,

ERP giriş sorunuyla ilgili bizimle iletişime geçtiğiniz için teşekkür ederiz. Bu sorunun 
şirketinizin ay sonu kapanış çalışmalarını etkilediğini tamamen anlıyorum ve bu konuyu 
yüksek öncelikli olarak işleme aldık.

Mevcut durum:
- Teknik ekibimiz sunucu bağlantı sorunlarını inceliyor
- 30 dakika içinde size bir güncelleme sunmayı bekliyoruz

Bu sırada şunları deneyebilirsiniz:
1. Yedek adres üzerinden erişim: https://erp-backup.company.com
2. Acil rapor ihtiyaçlarınız için dışa aktarma yardımı almak üzere bizimle iletişime geçebilirsiniz

Başka bir sorunuz olursa lütfen çekinmeden bana ulaşın.

Saygılarımla,
Teknik Destek Ekibi
```

### 5.5 AI Duygusal Zeka Güvenlik Duvarı

Grace tarafından yürütülen yanıt kalitesi denetimi şu sorunları engeller:

| Sorun Türü | Orijinal Örnek | AI Önerisi |
|------------|----------------|------------|
| Olumsuz Üslup | "Hayır, bu garanti kapsamında değil" | "Bu arıza şu an için ücretsiz garanti kapsamında değildir, size ücretli bir onarım planı sunabiliriz" |
| Müşteriyi Suçlama | "Kendiniz bozmuşsunuz" | "Yapılan inceleme sonucunda bu arızanın kaza sonucu oluşan bir hasar olduğu tespit edilmiştir" |
| Sorumluluktan Kaçma | "Bizim sorunumuz değil" | "Sorunun nedenini daha detaylı araştırmanıza yardımcı olayım" |
| Soğuk İfade | "Bilmiyorum" | "Sizin için ilgili bilgileri hemen araştırıyorum" |
| Hassas Bilgi | "Şifreniz: abc123" | [Engellendi] Hassas bilgi içeriyor, gönderilmesine izin verilmiyor |

---

## 6. Bilgi Bankası Sistemi

### 6.1 Bilgi Kaynakları

![ticketing-imgs-2025-12-31-22-55-20](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-20.png)


### 6.2 Talepten Bilgiye Dönüşüm Akışı

![ticketing-imgs-2025-12-31-22-55-38](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-38.png)

**Değerlendirme Boyutları**:
- **Genellik**: Bu yaygın bir sorun mu?
- **Tamlık**: Çözüm net ve eksiksiz mi?
- **Tekrarlanabilirlik**: Adımlar yeniden kullanılabilir mi?

### 6.3 Bilgi Önerisi Mekanizması

Bir temsilci talep detaylarını açtığında, Max otomatik olarak ilgili bilgileri önerir:

```
┌────────────────────────────────────────────────────────────┐
│ 📚 Önerilen Bilgiler                          [Genişlet/Daralt] │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 CNC Servo Sistemi Arıza Teşhis Kılavuzu Eşleşme: %94 │
│ │ İçerik: Alarm kodu yorumlama, servo sürücü kontrol adımları    │
│ │ [Görüntüle] [Yanıta Uygula] [Faydalı Olarak İşaretle]          │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 XYZ-CNC3000 Serisi Bakım El Kitabı      Eşleşme: %87 │
│ │ İçerik: Yaygın arızalar, önleyici bakım planı                  │
│ │ [Görüntüle] [Yanıta Uygula] [Faydalı Olarak İşaretle]          │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 7. İş Akışı Motoru

### 7.1 İş Akışı Kategorileri

| Kod | Kategori | Açıklama | Tetikleme Yöntemi |
|-----|----------|----------|-------------------|
| WF-T | Talep Akışı | Talep yaşam döngüsü yönetimi | Form olayları |
| WF-S | SLA Akışı | SLA hesaplama ve uyarılar | Form olayları/Zamanlanmış |
| WF-C | Yorum Akışı | Yorum işleme ve çeviri | Form olayları |
| WF-R | Değerlendirme Akışı | Değerlendirme davetleri ve istatistikler | Form olayları/Zamanlanmış |
| WF-N | Bildirim Akışı | Bildirim gönderimi | Olay odaklı |
| WF-AI | AI Akışı | AI analizi ve içerik oluşturma | Form olayları |

### 7.2 Temel İş Akışları

#### WF-T01: Talep Oluşturma Akışı

![ticketing-imgs-2025-12-31-22-55-51](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-51.png)

#### WF-AI01: Talep AI Analizi

![ticketing-imgs-2025-12-31-22-56-03](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-03.png)

#### WF-AI04: Yorum Çevirisi ve Denetimi

![ticketing-imgs-2025-12-31-22-56-19](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-19.png)

#### WF-AI03: Bilgi Oluşturma

![ticketing-imgs-2025-12-31-22-56-37](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-37.png)

### 7.3 Zamanlanmış Görevler

| Görev | Sıklık | Açıklama |
|-------|--------|----------|
| SLA Uyarı Kontrolü | Her 5 dakikada bir | Zaman aşımına yaklaşan talepleri kontrol et |
| Talep Otomatik Kapatma | Günlük | 'Resolved' durumundaki talepleri 3 gün sonra kapat |
| Değerlendirme Daveti | Günlük | Kapandıktan 24 saat sonra değerlendirme daveti gönder |
| İstatistik Güncelleme | Saatlik | Müşteri talep istatistiklerini güncelle |

---

## 8. Menü ve Arayüz Tasarımı

### 8.1 Yönetim Paneli

![ticketing-imgs-2025-12-31-22-59-10](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-59-10.png)

### 8.2 Müşteri Portalı

![ticketing-imgs-2025-12-31-22-59-32](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-59-32.png)

### 8.3 Gösterge Paneli Tasarımı

#### Yönetici Görünümü

| Bileşen | Tür | Veri Açıklaması |
|---------|-----|-----------------|
| SLA Uyumluluk Oranı | Gösterge | Bu ayın yanıt/çözüm uyumluluğu |
| Memnuniyet Trendi | Çizgi Grafik | Son 30 günlük memnuniyet değişimi |
| Talep Hacmi Trendi | Sütun Grafik | Son 30 günlük talep hacmi |
| İş Türü Dağılımı | Pasta Grafik | Her iş türünün oranı |

#### Sorumlu Yönetici Görünümü

| Bileşen | Tür | Veri Açıklaması |
|---------|-----|-----------------|
| Zaman Aşımı Uyarıları | Liste | Zaman aşımına yaklaşan/geçen talepler |
| Ekip İş Yükü | Sütun Grafik | Ekip üyelerinin talep sayıları |
| Bekleyen İş Dağılımı | Yığılmış Grafik | Durumlara göre talep sayıları |
| İşlem Süresi | Isı Haritası | Ortalama işlem süresi dağılımı |

#### Temsilci Görünümü

| Bileşen | Tür | Veri Açıklaması |
|---------|-----|-----------------|
| Yapılacaklarım | Sayı Kartı | Bekleyen talep sayısı |
| Öncelik Dağılımı | Pasta Grafik | P0/P1/P2/P3 dağılımı |
| Bugünün İstatistikleri | Metrik Kartı | Bugün işlenen/çözülen sayısı |
| SLA Geri Sayımı | Liste | En acil 5 talep |

---

## Ekler

### A. İş Türü Yapılandırması

| Tür Kodu | Adı | Simge | İlişkili Genişletme Tablosu |
|----------|-----|-------|----------------------------|
| repair | Cihaz Onarımı | 🔧 | nb_tts_biz_repair |
| it_support | BT Desteği | 💻 | nb_tts_biz_it_support |
| complaint | Müşteri Şikayeti | 📢 | nb_tts_biz_complaint |
| consultation | Danışma | ❓ | Yok |
| other | Diğer | 📝 | Yok |

### B. Kategori Kodları

| Kod | Adı | Açıklama |
|-----|-----|----------|
| CONVEYOR | Konveyör Sistemi | Konveyör sistemi sorunları |
| PACKAGING | Paketleme Makinesi | Paketleme makinesi sorunları |
| WELDING | Kaynak Ekipmanı | Kaynak ekipmanı sorunları |
| COMPRESSOR | Hava Kompresörü | Hava kompresörü sorunları |
| COLD_STORE | Soğuk Hava Deposu | Soğuk hava deposu sorunları |
| CENTRAL_AC | Merkezi Klima | Merkezi klima sorunları |
| FORKLIFT | Forklift | Forklift sorunları |
| COMPUTER | Bilgisayar | Bilgisayar donanım sorunları |
| PRINTER | Yazıcı | Yazıcı sorunları |
| PROJECTOR | Projeksiyon | Projeksiyon sorunları |
| INTERNET | İnternet | Ağ bağlantı sorunları |
| EMAIL | E-posta | E-posta sistemi sorunları |
| ACCESS | Erişim | Hesap yetki sorunları |
| PROD_INQ | Ürün Sorgulama | Ürün bilgisi sorgulama |
| COMPLAINT | Genel Şikayet | Genel şikayetler |
| DELAY | Nakliye Gecikmesi | Nakliye gecikme şikayeti |
| DAMAGE | Paket Hasarı | Paket hasarı şikayeti |
| QUANTITY | Miktar Eksikliği | Miktar eksikliği şikayeti |
| SVC_ATTITUDE | Hizmet Tutumu | Hizmet tutumu şikayeti |
| PROD_QUALITY | Ürün Kalitesi | Ürün kalitesi şikayeti |
| TRAINING | Eğitim | Eğitim talebi |
| RETURN | İade | İade talebi |

---

*Belge Sürümü: 2.0 | Son Güncelleme: 2026-01-05*