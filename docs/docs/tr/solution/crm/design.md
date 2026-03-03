:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/solution/crm/design) bakın.
:::

# CRM 2.0 Sistemi Detaylı Tasarımı


## 1. Sisteme Genel Bakış ve Tasarım Felsefesi

### 1.1 Sistem Konumlandırması

Bu sistem, NocoBase kodsuz (no-code) platformu üzerine inşa edilmiş bir **CRM 2.0 Satış Yönetim Platformudur**. Temel hedef şudur:

```
Satış ekibinin veri girişi ve tekrarlayan analizler yerine müşteri ilişkileri kurmaya odaklanmasını sağlayın.
```

Sistem, rutin görevleri iş akışları aracılığıyla otomatikleştirir ve aday müşteri puanlama, fırsat analizi gibi görevlerde yardımcı olması için AI desteğinden yararlanarak satış ekiplerinin verimliliğini artırmasına yardımcı olur.

### 1.2 Tasarım Felsefesi

#### İlke 1: Tam Satış Hunisi

**Uçtan Uca Satış Süreci:**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**Neden bu şekilde tasarlandı?**

| Geleneksel Yöntem | Entegre CRM |
|---------|-----------|
| Farklı aşamalar için birden fazla sistem kullanılır | Tüm yaşam döngüsünü kapsayan tek bir sistem |
| Sistemler arası manuel veri aktarımı | Otomatik veri akışı ve dönüşümü |
| Tutarsız müşteri görünümleri | Birleşik 360 derece müşteri görünümü |
| Parçalı veri analizi | Uçtan uca satış hattı analizi |

#### İlke 2: Yapılandırılabilir Satış Hattı
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)

Farklı sektörler, kod değiştirmeye gerek kalmadan satış hattı aşamalarını özelleştirebilir.

#### İlke 3: Modüler Tasarım

- Çekirdek modüller (Müşteriler + Fırsatlar) zorunludur; diğer modüller ihtiyaca göre etkinleştirilebilir.
- Modülleri devre dışı bırakmak kod değişikliği gerektirmez; NocoBase arayüz yapılandırması üzerinden yapılır.
- Her modül, bağımlılığı azaltmak için bağımsız olarak tasarlanmıştır.

---

## 2. Modül Mimarisi ve Özelleştirme

### 2.1 Modüllere Genel Bakış

CRM sistemi **modüler bir mimari** tasarımı benimser; her modül iş gereksinimlerine göre bağımsız olarak etkinleştirilebilir veya devre dışı bırakılabilir.
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 Modül Bağımlılıkları

| Modül | Zorunlu mu? | Bağımlılıklar | Devre Dışı Bırakma Koşulu |
|-----|---------|--------|---------|
| **Müşteri Yönetimi** | ✅ Evet | - | Devre dışı bırakılamaz (Çekirdek) |
| **Fırsat Yönetimi** | ✅ Evet | Müşteri Yönetimi | Devre dışı bırakılamaz (Çekirdek) |
| **Aday Müşteri Yönetimi** | İsteğe bağlı | - | Aday müşteri edinimi gerekmediğinde |
| **Teklif Yönetimi** | İsteğe bağlı | Fırsatlar, Ürünler | Resmi teklif gerektirmeyen basit işlemler |
| **Sipariş Yönetimi** | İsteğe bağlı | Fırsatlar (veya Teklifler) | Sipariş/ödeme takibi gerekmediğinde |
| **Ürün Yönetimi** | İsteğe bağlı | - | Ürün kataloğu gerekmediğinde |
| **E-posta Entegrasyonu** | İsteğe bağlı | Müşteriler, Kişiler | Harici bir e-posta sistemi kullanıldığında |

### 2.3 Önceden Yapılandırılmış Sürümler

| Sürüm | İçerdiği Modüller | Kullanım Durumu | Koleksiyon Sayısı |
|-----|---------|---------|-----------|
| **Lite (Hafif)** | Müşteriler + Fırsatlar | Basit işlem takibi | 6 |
| **Standart** | Lite + Aday Müşteriler + Teklifler + Siparişler + Ürünler | Tam satış döngüsü | 15 |
| **Kurumsal** | Standart + E-posta Entegrasyonu | E-posta dahil tam işlevsellik | 17 |

### 2.4 Modül-Koleksiyon Eşleştirmesi

#### Çekirdek Modül Koleksiyonları (Her Zaman Gerekli)

| Koleksiyon | Modül | Açıklama |
|-------|------|------|
| nb_crm_customers | Müşteri Yönetimi | Müşteri/Şirket kayıtları |
| nb_crm_contacts | Müşteri Yönetimi | İletişim Kişileri |
| nb_crm_customer_shares | Müşteri Yönetimi | Müşteri paylaşım izinleri |
| nb_crm_opportunities | Fırsat Yönetimi | Satış fırsatları |
| nb_crm_opportunity_stages | Fırsat Yönetimi | Aşama yapılandırmaları |
| nb_crm_opportunity_users | Fırsat Yönetimi | Fırsat iş ortakları |
| nb_crm_activities | Etkinlik Yönetimi | Etkinlik kayıtları |
| nb_crm_comments | Etkinlik Yönetimi | Yorumlar/Notlar |
| nb_crm_tags | Çekirdek | Paylaşılan etiketler |
| nb_cbo_currencies | Temel Veri | Para birimi sözlüğü |
| nb_cbo_regions | Temel Veri | Ülke/Bölge sözlüğü |

### 2.5 Modüller Nasıl Devre Dışı Bırakılır?

NocoBase yönetim arayüzünde ilgili modülün menü girişini gizlemeniz yeterlidir; kodu değiştirmenize veya koleksiyonları silmenize gerek yoktur.

---

## 3. Temel Varlıklar ve Veri Modeli

### 3.1 Varlık İlişkilerine Genel Bakış
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 Temel Koleksiyon Detayları

#### 3.2.1 Aday Müşteriler (nb_crm_leads)

Basitleştirilmiş 4 aşamalı bir iş akışı kullanan aday müşteri yönetimi.

**Aşama Süreci:**
```
Yeni → Takipte → Doğrulanmış → Müşteriye/Fırsata Dönüştürüldü
         ↓          ↓
    Uygun Değil  Uygun Değil
```

**Kritik Alanlar:**

| Alan | Tür | Açıklama |
|-----|------|------|
| id | BIGINT | Birincil Anahtar |
| lead_no | VARCHAR | Aday No (Otomatik oluşturulur) |
| name | VARCHAR | Kişi Adı |
| company | VARCHAR | Şirket Adı |
| title | VARCHAR | Ünvan |
| email | VARCHAR | E-posta |
| phone | VARCHAR | Telefon |
| mobile_phone | VARCHAR | Cep Telefonu |
| website | TEXT | Web Sitesi |
| address | TEXT | Adres |
| source | VARCHAR | Kaynak: website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | Sektör |
| annual_revenue | VARCHAR | Yıllık Gelir Ölçeği |
| number_of_employees | VARCHAR | Çalışan Sayısı Ölçeği |
| status | VARCHAR | Durum: new/working/qualified/unqualified |
| rating | VARCHAR | Derecelendirme: hot/warm/cold |
| owner_id | BIGINT | Sorumlu (FK → users) |
| ai_score | INTEGER | AI Kalite Puanı 0-100 |
| ai_convert_prob | DECIMAL | AI Dönüşüm Olasılığı |
| ai_best_contact_time | VARCHAR | AI Önerilen İletişim Zamanı |
| ai_tags | JSONB | AI Tarafından Oluşturulan Etiketler |
| ai_scored_at | TIMESTAMP | AI Puanlama Zamanı |
| ai_next_best_action | TEXT | AI Bir Sonraki En İyi Aksiyon Önerisi |
| ai_nba_generated_at | TIMESTAMP | AI Öneri Oluşturma Zamanı |
| is_converted | BOOLEAN | Dönüştürüldü İşareti |
| converted_at | TIMESTAMP | Dönüşüm Zamanı |
| converted_customer_id | BIGINT | Dönüştürülen Müşteri ID |
| converted_contact_id | BIGINT | Dönüştürülen Kişi ID |
| converted_opportunity_id | BIGINT | Dönüştürülen Fırsat ID |
| lost_reason | TEXT | Kaybetme Nedeni |
| disqualification_reason | TEXT | Uygunsuzluk Nedeni |
| description | TEXT | Açıklama |

#### 3.2.2 Müşteriler (nb_crm_customers)

Uluslararası ticareti destekleyen müşteri/şirket yönetimi.

**Kritik Alanlar:**

| Alan | Tür | Açıklama |
|-----|------|------|
| id | BIGINT | Birincil Anahtar |
| name | VARCHAR | Müşteri Adı (Zorunlu) |
| account_number | VARCHAR | Müşteri Numarası (Otomatik oluşturulur, Benzersiz) |
| phone | VARCHAR | Telefon |
| website | TEXT | Web Sitesi |
| address | TEXT | Adres |
| industry | VARCHAR | Sektör |
| type | VARCHAR | Tür: prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | Çalışan Sayısı Ölçeği |
| annual_revenue | VARCHAR | Yıllık Gelir Ölçeği |
| level | VARCHAR | Seviye: normal/important/vip |
| status | VARCHAR | Durum: potential/active/dormant/churned |
| country | VARCHAR | Ülke |
| region_id | BIGINT | Bölge (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | Tercih Edilen Para Birimi: CNY/USD/EUR |
| owner_id | BIGINT | Sorumlu (FK → users) |
| parent_id | BIGINT | Ana Şirket (FK → self) |
| source_lead_id | BIGINT | Kaynak Aday ID |
| ai_health_score | INTEGER | AI Sağlık Puanı 0-100 |
| ai_health_grade | VARCHAR | AI Sağlık Derecesi: A/B/C/D |
| ai_churn_risk | DECIMAL | AI Kaybetme Riski 0-100% |
| ai_churn_risk_level | VARCHAR | AI Kaybetme Riski Seviyesi: low/medium/high |
| ai_health_dimensions | JSONB | AI Sağlık Boyutu Puanları |
| ai_recommendations | JSONB | AI Öneri Listesi |
| ai_health_assessed_at | TIMESTAMP | AI Sağlık Değerlendirme Zamanı |
| ai_tags | JSONB | AI Tarafından Oluşturulan Etiketler |
| ai_best_contact_time | VARCHAR | AI Önerilen İletişim Zamanı |
| ai_next_best_action | TEXT | AI Bir Sonraki En İyi Aksiyon Önerisi |
| ai_nba_generated_at | TIMESTAMP | AI Öneri Oluşturma Zamanı |
| description | TEXT | Açıklama |
| is_deleted | BOOLEAN | Yazılımsal Silme İşareti |

#### 3.2.3 Fırsatlar (nb_crm_opportunities)

Yapılandırılabilir satış hattı aşamalarına sahip satış fırsatı yönetimi.

**Kritik Alanlar:**

| Alan | Tür | Açıklama |
|-----|------|------|
| id | BIGINT | Birincil Anahtar |
| opportunity_no | VARCHAR | Fırsat No (Otomatik oluşturulur, Benzersiz) |
| name | VARCHAR | Fırsat Adı (Zorunlu) |
| amount | DECIMAL | Beklenen Tutar |
| currency | VARCHAR | Para Birimi |
| exchange_rate | DECIMAL | Döviz Kuru |
| amount_usd | DECIMAL | USD Karşılığı Tutar |
| customer_id | BIGINT | Müşteri (FK) |
| contact_id | BIGINT | Birincil Kişi (FK) |
| stage | VARCHAR | Aşama Kodu (FK → stages.code) |
| stage_sort | INTEGER | Aşama Sıralaması (Kolay sıralama için yedekli) |
| stage_entered_at | TIMESTAMP | Mevcut Aşamaya Giriş Zamanı |
| days_in_stage | INTEGER | Mevcut Aşamada Geçen Gün |
| win_probability | DECIMAL | Manuel Kazanma Olasılığı |
| ai_win_probability | DECIMAL | AI Tahmini Kazanma Olasılığı |
| ai_analyzed_at | TIMESTAMP | AI Analiz Zamanı |
| ai_confidence | DECIMAL | AI Tahmin Güveni |
| ai_trend | VARCHAR | AI Tahmin Trendi: up/stable/down |
| ai_risk_factors | JSONB | AI Tarafından Belirlenen Risk Faktörleri |
| ai_recommendations | JSONB | AI Öneri Listesi |
| ai_predicted_close | DATE | AI Tahmini Kapanış Tarihi |
| ai_next_best_action | TEXT | AI Bir Sonraki En İyi Aksiyon Önerisi |
| ai_nba_generated_at | TIMESTAMP | AI Öneri Oluşturma Zamanı |
| expected_close_date | DATE | Beklenen Kapanış Tarihi |
| actual_close_date | DATE | Gerçek Kapanış Tarihi |
| owner_id | BIGINT | Sorumlu (FK → users) |
| last_activity_at | TIMESTAMP | Son Etkinlik Zamanı |
| stagnant_days | INTEGER | Etkinlik Olmadan Geçen Gün Sayısı |
| loss_reason | TEXT | Kaybetme Nedeni |
| competitor_id | BIGINT | Rakip (FK) |
| lead_source | VARCHAR | Aday Kaynağı |
| campaign_id | BIGINT | Pazarlama Kampanyası ID |
| expected_revenue | DECIMAL | Beklenen Gelir = tutar × olasılık |
| description | TEXT | Açıklama |

#### 3.2.4 Teklifler (nb_crm_quotations)

Çoklu para birimi ve onay iş akışlarını destekleyen teklif yönetimi.

**Durum Akışı:**
```
Taslak → Onay Bekliyor → Onaylandı → Gönderildi → Kabul Edildi/Reddedildi/Süresi Doldu
              ↓
           Reddedildi → Düzenle → Taslak
```

**Kritik Alanlar:**

| Alan | Tür | Açıklama |
|-----|------|------|
| id | BIGINT | Birincil Anahtar |
| quotation_no | VARCHAR | Teklif No (Otomatik oluşturulur, Benzersiz) |
| name | VARCHAR | Teklif Adı |
| version | INTEGER | Versiyon Numarası |
| opportunity_id | BIGINT | Fırsat (FK, Zorunlu) |
| customer_id | BIGINT | Müşteri (FK) |
| contact_id | BIGINT | Kişi (FK) |
| owner_id | BIGINT | Sorumlu (FK → users) |
| currency_id | BIGINT | Para Birimi (FK → nb_cbo_currencies) |
| exchange_rate | DECIMAL | Döviz Kuru |
| subtotal | DECIMAL | Ara Toplam |
| discount_rate | DECIMAL | İndirim Oranı |
| discount_amount | DECIMAL | İndirim Tutarı |
| shipping_handling | DECIMAL | Nakliye/İşlem Ücreti |
| tax_rate | DECIMAL | Vergi Oranı |
| tax_amount | DECIMAL | Vergi Tutarı |
| total_amount | DECIMAL | Toplam Tutar |
| total_amount_usd | DECIMAL | USD Karşılığı Toplam Tutar |
| status | VARCHAR | Durum: draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | Sunulma Zamanı |
| approved_by | BIGINT | Onaylayan (FK → users) |
| approved_at | TIMESTAMP | Onay Zamanı |
| rejected_at | TIMESTAMP | Red Zamanı |
| sent_at | TIMESTAMP | Gönderilme Zamanı |
| customer_response_at | TIMESTAMP | Müşteri Yanıt Zamanı |
| expired_at | TIMESTAMP | Süre Dolum Zamanı |
| valid_until | DATE | Geçerlilik Tarihi |
| payment_terms | TEXT | Ödeme Koşulları |
| terms_condition | TEXT | Şartlar ve Koşullar |
| address | TEXT | Teslimat Adresi |
| description | TEXT | Açıklama |

#### 3.2.5 Siparişler (nb_crm_orders)

Ödeme takibini içeren sipariş yönetimi.

**Kritik Alanlar:**

| Alan | Tür | Açıklama |
|-----|------|------|
| id | BIGINT | Birincil Anahtar |
| order_no | VARCHAR | Sipariş No (Otomatik oluşturulur, Benzersiz) |
| customer_id | BIGINT | Müşteri (FK) |
| contact_id | BIGINT | Kişi (FK) |
| opportunity_id | BIGINT | Fırsat (FK) |
| quotation_id | BIGINT | Teklif (FK) |
| owner_id | BIGINT | Sorumlu (FK → users) |
| currency | VARCHAR | Para Birimi |
| exchange_rate | DECIMAL | Döviz Kuru |
| order_amount | DECIMAL | Sipariş Tutarı |
| paid_amount | DECIMAL | Ödenen Tutar |
| unpaid_amount | DECIMAL | Ödenmeyen Tutar |
| status | VARCHAR | Durum: pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | Ödeme Durumu: unpaid/partial/paid |
| order_date | DATE | Sipariş Tarihi |
| delivery_date | DATE | Beklenen Teslimat Tarihi |
| actual_delivery_date | DATE | Gerçek Teslimat Tarihi |
| shipping_address | TEXT | Teslimat Adresi |
| logistics_company | VARCHAR | Lojistik Şirketi |
| tracking_no | VARCHAR | Takip Numarası |
| terms_condition | TEXT | Şartlar ve Koşullar |
| description | TEXT | Açıklama |

### 3.3 Koleksiyon Özeti

#### CRM İş Koleksiyonları

| No. | Koleksiyon Adı | Açıklama | Tür |
|-----|------|------|------|
| 1 | nb_crm_leads | Aday Müşteri Yönetimi | İş |
| 2 | nb_crm_customers | Müşteriler/Şirketler | İş |
| 3 | nb_crm_contacts | Kişiler | İş |
| 4 | nb_crm_opportunities | Satış Fırsatları | İş |
| 5 | nb_crm_opportunity_stages | Aşama Yapılandırması | Yapılandırma |
| 6 | nb_crm_opportunity_users | Fırsat İş Ortakları (Satış Ekibi) | İlişki |
| 7 | nb_crm_quotations | Teklifler | İş |
| 8 | nb_crm_quotation_items | Teklif Kalemleri | İş |
| 9 | nb_crm_quotation_approvals | Onay Kayıtları | İş |
| 10 | nb_crm_orders | Siparişler | İş |
| 11 | nb_crm_order_items | Sipariş Kalemleri | İş |
| 12 | nb_crm_payments | Ödeme Kayıtları | İş |
| 13 | nb_crm_products | Ürün Kataloğu | İş |
| 14 | nb_crm_product_categories | Ürün Kategorileri | Yapılandırma |
| 15 | nb_crm_price_tiers | Kademeli Fiyatlandırma | Yapılandırma |
| 16 | nb_crm_activities | Etkinlik Kayıtları | İş |
| 17 | nb_crm_comments | Yorumlar/Notlar | İş |
| 18 | nb_crm_competitors | Rakipler | İş |
| 19 | nb_crm_tags | Etiketler | Yapılandırma |
| 20 | nb_crm_lead_tags | Aday-Etiket İlişkisi | İlişki |
| 21 | nb_crm_contact_tags | Kişi-Etiket İlişkisi | İlişki |
| 22 | nb_crm_customer_shares | Müşteri Paylaşım İzinleri | İlişki |
| 23 | nb_crm_exchange_rates | Döviz Kuru Geçmişi | Yapılandırma |

#### Temel Veri Koleksiyonları (Ortak Modüller)

| No. | Koleksiyon Adı | Açıklama | Tür |
|-----|------|------|------|
| 1 | nb_cbo_currencies | Para Birimi Sözlüğü | Yapılandırma |
| 2 | nb_cbo_regions | Ülke/Bölge Sözlüğü | Yapılandırma |

### 3.4 Yardımcı Koleksiyonlar

#### 3.4.1 Yorumlar (nb_crm_comments)

Çeşitli iş nesneleriyle ilişkilendirilebilen genel yorum/not koleksiyonu.

| Alan | Tür | Açıklama |
|-----|------|------|
| id | BIGINT | Birincil Anahtar |
| content | TEXT | Yorum İçeriği |
| lead_id | BIGINT | İlişkili Aday (FK) |
| customer_id | BIGINT | İlişkili Müşteri (FK) |
| opportunity_id | BIGINT | İlişkili Fırsat (FK) |
| order_id | BIGINT | İlişkili Sipariş (FK) |

#### 3.4.2 Müşteri Paylaşımları (nb_crm_customer_shares)

Müşteriler için çok kişili iş birliğini ve izin paylaşımını sağlar.

| Alan | Tür | Açıklama |
|-----|------|------|
| id | BIGINT | Birincil Anahtar |
| customer_id | BIGINT | Müşteri (FK, Zorunlu) |
| shared_with_user_id | BIGINT | Paylaşılan Kullanıcı (FK, Zorunlu) |
| shared_by_user_id | BIGINT | Paylaşan Kullanıcı (FK) |
| permission_level | VARCHAR | İzin Seviyesi: read/write/full |
| shared_at | TIMESTAMP | Paylaşım Zamanı |

#### 3.4.3 Fırsat İş Ortakları (nb_crm_opportunity_users)

Fırsatlar üzerinde satış ekibi iş birliğini destekler.

| Alan | Tür | Açıklama |
|-----|------|------|
| opportunity_id | BIGINT | Fırsat (FK, Bileşik PK) |
| user_id | BIGINT | Kullanıcı (FK, Bileşik PK) |
| role | VARCHAR | Rol: owner/collaborator/viewer |

#### 3.4.4 Bölgeler (nb_cbo_regions)

Ülke/Bölge temel veri sözlüğü.

| Alan | Tür | Açıklama |
|-----|------|------|
| id | BIGINT | Birincil Anahtar |
| code_alpha2 | VARCHAR | ISO 3166-1 Alpha-2 Kodu (Benzersiz) |
| code_alpha3 | VARCHAR | ISO 3166-1 Alpha-3 Kodu (Benzersiz) |
| code_numeric | VARCHAR | ISO 3166-1 Sayısal Kodu |
| name | VARCHAR | Ülke/Bölge Adı |
| is_active | BOOLEAN | Etkin mi? |
| sort_order | INTEGER | Sıralama |

---

## 4. Aday Müşteri Yaşam Döngüsü

Aday müşteri yönetimi basitleştirilmiş 4 aşamalı bir iş akışı kullanır. Yeni bir aday müşteri oluşturulduğunda, bir iş akışı otomatik olarak AI puanlamasını tetikleyerek satış ekibinin yüksek kaliteli adayları hızlıca belirlemesine yardımcı olabilir.

### 4.1 Durum Tanımları

| Durum | Ad | Açıklama |
|-----|------|------|
| new | Yeni | Yeni oluşturuldu, iletişim bekleniyor |
| working | Takipte | Aktif olarak takip ediliyor |
| qualified | Doğrulanmış | Dönüşüme hazır |
| unqualified | Uygun Değil | Uygun bir aday değil |

### 4.2 Durum Akış Şeması

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 Aday Müşteri Dönüşüm Süreci

Dönüşüm arayüzü aynı anda üç seçenek sunar; kullanıcılar şunları oluşturmayı veya ilişkilendirmeyi seçebilir:

- **Müşteri**: Yeni bir müşteri oluşturun VEYA mevcut bir müşteriyle ilişkilendirin.
- **Kişi**: Yeni bir kişi oluşturun (müşteriyle ilişkili).
- **Fırsat**: Bir fırsat oluşturulması zorunludur.
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**Dönüşüm Sonrası Kayıtlar:**
- `converted_customer_id`: İlişkili Müşteri ID
- `converted_contact_id`: İlişkili Kişi ID
- `converted_opportunity_id`: Oluşturulan Fırsat ID

---

## 5. Fırsat Yaşam Döngüsü

Fırsat yönetimi yapılandırılabilir satış hattı aşamalarını kullanır. Bir fırsat aşaması değiştiğinde, satış ekibinin riskleri ve fırsatları belirlemesine yardımcı olmak için otomatik olarak AI kazanma olasılığı tahminini tetikleyebilir.

### 5.1 Yapılandırılabilir Aşamalar

Aşamalar `nb_crm_opportunity_stages` koleksiyonunda saklanır ve özelleştirilebilir:

| Kod | Ad | Sıra | Varsayılan Kazanma Olasılığı |
|-----|------|------|---------|
| prospecting | Ön Görüşme | 1 | 10% |
| analysis | İhtiyaç Analizi | 2 | 30% |
| proposal | Teklif Sunumu | 3 | 60% |
| negotiation | Pazarlık/İnceleme | 4 | 80% |
| won | Kazanıldı | 5 | 100% |
| lost | Kaybedildi | 6 | 0% |

### 5.2 Satış Hattı Akışı
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)

### 5.3 Hareketsizlik Tespiti

Etkinlik olmayan fırsatlar işaretlenecektir:

| Etkinlik Olmadan Geçen Gün | Aksiyon |
|-----------|------|
| 7 Gün | Sarı Uyarı |
| 14 Gün | Sorumluya Turuncu Hatırlatma |
| 30 Gün | Yöneticiye Kırmızı Hatırlatma |

```sql
-- Hareketsizlik günlerini hesapla
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 Kazanma/Kaybetme İşlemleri

**Kazanıldığında:**
1. Aşamayı 'won' olarak güncelleyin.
2. Gerçek kapanış tarihini kaydedin.
3. Müşteri durumunu 'active' olarak güncelleyin.
4. Sipariş oluşturmayı tetikleyin (eğer bir teklif kabul edildiyse).

**Kaybedildiğinde:**
1. Aşamayı 'lost' olarak güncelleyin.
2. Kaybetme nedenini kaydedin.
3. Rakip ID'sini kaydedin (eğer bir rakibe kaybedildiyse).
4. Yöneticiyi bilgilendirin.

---

## 6. Teklif Yaşam Döngüsü

### 6.1 Durum Tanımları

| Durum | Ad | Açıklama |
|-----|------|------|
| draft | Taslak | Hazırlık aşamasında |
| pending_approval | Onay Bekliyor | Onay bekliyor |
| approved | Onaylandı | Gönderilmeye hazır |
| sent | Gönderildi | Müşteriye gönderildi |
| accepted | Kabul Edildi | Müşteri tarafından kabul edildi |
| rejected | Reddedildi | Müşteri tarafından reddedildi |
| expired | Süresi Doldu | Geçerlilik tarihi geçti |

### 6.2 Onay Kuralları (Kesinleşecek)

Onay iş akışları aşağıdaki koşullara göre tetiklenir:

| Koşul | Onay Seviyesi |
|------|---------|
| İndirim > 10% | Satış Müdürü |
| İndirim > 20% | Satış Direktörü |
| Tutar > $100K | Finans + Genel Müdür |

### 6.3 Çoklu Para Birimi Desteği

#### Tasarım Felsefesi

Tüm raporlar ve analizler için **temel para birimi olarak USD** kullanın. Her tutar kaydı şunları saklar:
- Orijinal para birimi ve tutar (müşterinin gördüğü)
- İşlem anındaki döviz kuru
- USD karşılığı tutar (dahili karşılaştırma için)

#### Para Birimi Sözlüğü (nb_cbo_currencies)

Para birimi yapılandırması, dinamik yönetimi destekleyen ortak bir temel veri koleksiyonu kullanır. `current_rate` alanı, `nb_crm_exchange_rates` tablosundaki en güncel kayıttan bir zamanlanmış görev tarafından güncellenen mevcut döviz kurunu saklar.

| Alan | Tür | Açıklama |
|-----|------|------|
| id | BIGINT | Birincil Anahtar |
| code | VARCHAR | Para Birimi Kodu (Benzersiz): USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | Para Birimi Adı |
| symbol | VARCHAR | Para Birimi Sembolü |
| decimal_places | INTEGER | Ondalık Basamak Sayısı |
| current_rate | DECIMAL | USD Karşılığı Mevcut Kur (Geçmişten senkronize edilir) |
| is_active | BOOLEAN | Etkin mi? |
| sort_order | INTEGER | Sıralama |

#### Döviz Kuru Geçmişi (nb_crm_exchange_rates)

Geçmiş döviz kuru verilerini kaydeder. Zamanlanmış bir görev, en son kurları `nb_cbo_currencies.current_rate` alanına senkronize eder.

| Alan | Tür | Açıklama |
|-----|------|------|
| id | BIGINT | Birincil Anahtar |
| currency_code | VARCHAR | Para Birimi Kodu (CNY/EUR/GBP/JPY) |
| rate_to_usd | DECIMAL(10,6) | USD Karşılığı Kur |
| effective_date | DATE | Yürürlük Tarihi |
| source | VARCHAR | Kaynak: manual/api |
| createdAt | TIMESTAMP | Oluşturulma Zamanı |

> **Not**: Teklifler, `currency_id` yabancı anahtarı aracılığıyla `nb_cbo_currencies` koleksiyonuyla ilişkilendirilir ve döviz kuru doğrudan `current_rate` alanından alınır. Fırsatlar ve siparişler, para birimi kodunu saklamak için bir `currency` VARCHAR alanı kullanır.

#### Tutar Alanı Deseni

Tutar içeren koleksiyonlar şu deseni izler:

| Alan | Tür | Açıklama |
|-----|------|------|
| currency | VARCHAR | İşlem Para Birimi |
| amount | DECIMAL | Orijinal Tutar |
| exchange_rate | DECIMAL | İşlem anındaki USD kuru |
| amount_usd | DECIMAL | USD Karşılığı (Hesaplanan) |

**Uygulandığı yerler:**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### İş Akışı Entegrasyonu
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)

**Döviz Kuru Alma Mantığı:**
1. İşlemler sırasında döviz kurunu doğrudan `nb_cbo_currencies.current_rate` alanından alın.
2. USD İşlemleri: Kur = 1.0, sorgulama gerekmez.
3. `current_rate`, en son `nb_crm_exchange_rates` kaydından zamanlanmış bir görevle senkronize edilir.

### 6.4 Versiyon Yönetimi

Bir teklif reddedildiğinde veya süresi dolduğunda, yeni bir versiyon olarak çoğaltılabilir:

```
QT-20260119-001 v1 → Reddedildi
QT-20260119-001 v2 → Gönderildi
QT-20260119-001 v3 → Kabul Edildi
```

---

## 7. Sipariş Yaşam Döngüsü

### 7.1 Siparişe Genel Bakış

Siparişler, bir teklif kabul edildiğinde oluşturulur ve onaylanmış bir iş taahhüdünü temsil eder.
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)

### 7.2 Sipariş Durum Tanımları

| Durum | Kod | Açıklama | İzin Verilen Aksiyonlar |
|-----|------|------|---------|
| Taslak | `draft` | Sipariş oluşturuldu, henüz onaylanmadı | Düzenle, Onayla, İptal Et |
| Onaylandı | `confirmed` | Sipariş onaylandı, yerine getirilmesi bekleniyor | İşlemi Başlat, İptal Et |
| İşleniyor | `in_progress` | Sipariş işleniyor/üretiliyor | İlerlemeyi Güncelle, Sevket, İptal Et (onay gerektirir) |
| Sevk Edildi | `shipped` | Ürünler müşteriye sevk edildi | Teslim Edildi Olarak İşaretle |
| Teslim Edildi | `delivered` | Müşteri malları teslim aldı | Siparişi Tamamla |
| Tamamlandı | `completed` | Sipariş tamamen tamamlandı | Yok |
| İptal Edildi | `cancelled` | Sipariş iptal edildi | Yok |

### 7.3 Sipariş Veri Modeli

#### nb_crm_orders

| Alan | Tür | Açıklama |
|-----|------|------|
| id | BIGINT | Birincil Anahtar |
| order_no | VARCHAR | Sipariş No (Otomatik oluşturulur, Benzersiz) |
| customer_id | BIGINT | Müşteri (FK) |
| contact_id | BIGINT | Kişi (FK) |
| opportunity_id | BIGINT | Fırsat (FK) |
| quotation_id | BIGINT | Teklif (FK) |
| owner_id | BIGINT | Sorumlu (FK → users) |
| status | VARCHAR | Sipariş Durumu |
| payment_status | VARCHAR | Ödeme Durumu: unpaid/partial/paid |
| order_date | DATE | Sipariş Tarihi |
| delivery_date | DATE | Beklenen Teslimat Tarihi |
| actual_delivery_date | DATE | Gerçek Teslimat Tarihi |
| currency | VARCHAR | Sipariş Para Birimi |
| exchange_rate | DECIMAL | USD Karşılığı Kur |
| order_amount | DECIMAL | Toplam Sipariş Tutarı |
| paid_amount | DECIMAL | Ödenen Tutar |
| unpaid_amount | DECIMAL | Ödenmeyen Tutar |
| shipping_address | TEXT | Teslimat Adresi |
| logistics_company | VARCHAR | Lojistik Şirketi |
| tracking_no | VARCHAR | Takip Numarası |
| terms_condition | TEXT | Şartlar ve Koşullar |
| description | TEXT | Açıklama |

#### nb_crm_order_items

| Alan | Tür | Açıklama |
|-----|------|------|
| id | BIGINT | Birincil Anahtar |
| order_id | FK | Üst Sipariş |
| product_id | FK | Ürün Referansı |
| product_name | VARCHAR | Ürün Adı Anlık Görüntüsü |
| quantity | INT | Sipariş Edilen Miktar |
| unit_price | DECIMAL | Birim Fiyat |
| discount_percent | DECIMAL | İndirim Yüzdesi |
| line_total | DECIMAL | Satır Toplamı |
| notes | TEXT | Satır Notları |

### 7.4 Ödeme Takibi

#### nb_crm_payments

| Alan | Tür | Açıklama |
|-----|------|------|
| id | BIGINT | Birincil Anahtar |
| order_id | BIGINT | İlişkili Sipariş (FK, Zorunlu) |
| customer_id | BIGINT | Müşteri (FK) |
| payment_no | VARCHAR | Ödeme No (Otomatik oluşturulur, Benzersiz) |
| amount | DECIMAL | Ödeme Tutarı (Zorunlu) |
| currency | VARCHAR | Ödeme Para Birimi |
| payment_method | VARCHAR | Yöntem: transfer/check/cash/credit_card/lc |
| payment_date | DATE | Ödeme Tarihi |
| bank_account | VARCHAR | Banka Hesap Numarası |
| bank_name | VARCHAR | Banka Adı |
| notes | TEXT | Ödeme Notları |

---

## 8. Müşteri Yaşam Döngüsü

### 8.1 Müşteriye Genel Bakış

Müşteriler, aday müşteri dönüşümü sırasında veya bir fırsat kazanıldığında oluşturulur. Sistem, edinmeden marka elçiliğine kadar tüm yaşam döngüsünü takip eder.
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)

### 8.2 Müşteri Durum Tanımları

| Durum | Kod | Sağlık | Açıklama |
|-----|------|--------|------|
| Potansiyel | `prospect` | Yok | Dönüştürülmüş aday, henüz sipariş yok |
| Aktif | `active` | ≥70 | Ödeme yapan müşteri, iyi etkileşim |
| Büyüyen | `growing` | ≥80 | Genişleme fırsatları olan müşteri |
| Risk Altında | `at_risk` | <50 | Kaybedilme belirtileri gösteren müşteri |
| Kaybedilen | `churned` | Yok | Artık aktif değil |
| Geri Kazanılan | `win_back` | Yok | Yeniden etkinleştirilen eski müşteri |
| Destekçi | `advocate` | ≥90 | Yüksek memnuniyet, referans sağlar |

### 8.3 Müşteri Sağlık Puanlaması

Müşteri sağlığı birden fazla faktöre göre hesaplanır:

| Faktör | Ağırlık | Metrik |
|-----|------|---------|
| Satın Alma Güncelliği | 25% | Son siparişten bu yana geçen gün |
| Satın Alma Sıklığı | 20% | Dönem başına sipariş sayısı |
| Parasal Değer | 20% | Toplam ve ortalama sipariş değeri |
| Etkileşim | 15% | E-posta açılma oranları, toplantı katılımı |
| Destek Sağlığı | 10% | Destek talebi hacmi ve çözüm oranı |
| Ürün Kullanımı | 10% | Aktif kullanım metrikleri (varsa) |

**Sağlık Eşikleri:**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 Müşteri Segmentasyonu

#### Otomatik Segmentasyon

| Segment | Koşul | Önerilen Aksiyon |
|-----|------|---------|
| VIP | LTV > $100K | Özel hizmet, üst düzey yönetici desteği |
| Kurumsal | Şirket Ölçeği > 500 | Özel Müşteri Yöneticisi |
| Orta Ölçekli | Şirket Ölçeği 50-500 | Düzenli kontroller, ölçekli destek |
| Girişim | Şirket Ölçeği < 50 | Kendi kendine hizmet kaynakları, topluluk |
| Atıl | 90+ Gün Etkinlik Yok | Yeniden etkinleştirme pazarlaması |

---

## 9. E-posta Entegrasyonu

### 9.1 Genel Bakış

NocoBase, Gmail ve Outlook'u destekleyen yerleşik bir e-posta entegrasyon eklentisi sunar. E-postalar senkronize edildikten sonra, iş akışları e-posta duyarlılığını ve niyetini analiz etmek için otomatik olarak AI analizini tetikleyebilir ve satış ekibinin müşteri tutumlarını hızlıca anlamasına yardımcı olabilir.

### 9.2 E-posta Senkronizasyonu

**Desteklenen Sağlayıcılar:**
- Gmail (OAuth 2.0 üzerinden)
- Outlook/Microsoft 365 (OAuth 2.0 üzerinden)

**Senkronizasyon Davranışı:**
- Gönderilen ve alınan e-postaların çift yönlü senkronizasyonu.
- E-postaların CRM kayıtlarıyla (Adaylar, Kişiler, Fırsatlar) otomatik ilişkilendirilmesi.
- Eklerin NocoBase dosya sisteminde saklanması.

### 9.3 E-posta-CRM İlişkilendirmesi (Kesinleşecek)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 E-posta Şablonları

Satış ekibi önceden ayarlanmış şablonları kullanabilir:

| Şablon Kategorisi | Örnekler |
|---------|------|
| İlk İletişim | Soğuk e-posta, Sıcak giriş, Etkinlik takibi |
| Takip | Toplantı takibi, Teklif takibi, Yanıtsızlık hatırlatması |
| Teklif | Teklif ektedir, Teklif revizyonu, Teklif süresi doluyor |
| Sipariş | Sipariş onayı, Sevkiyat bildirimi, Teslimat onayı |
| Müşteri Başarısı | Hoş geldiniz, Kontrol, Değerlendirme isteği |

---

## 10. AI Destekli Yetenekler

### 10.1 AI Çalışan Ekibi

CRM sistemi, CRM'e özgü görevlerle yapılandırılmış aşağıdaki yerleşik AI çalışanlarını kullanarak NocoBase AI eklentisini entegre eder:

| ID | Ad | Yerleşik Rol | CRM Genişletme Yetenekleri |
|----|------|---------|-------------|
| viz | Viz | Veri Analisti | Satış verileri analizi, satış hattı tahmini |
| dara | Dara | Grafik Uzmanı | Veri görselleştirme, rapor geliştirme, gösterge paneli tasarımı |
| ellis | Ellis | Editör | E-posta yanıt taslağı hazırlama, iletişim özetleri, iş e-postası taslakları |
| lexi | Lexi | Çevirmen | Çok dilli müşteri iletişimi, içerik çevirisi |
| orin | Orin | Organizatör | Günlük öncelikler, sonraki adım önerileri, takip planlaması |

### 10.2 AI Görev Listesi

AI yetenekleri iki bağımsız kategoriye ayrılır:

#### I. AI Çalışanları (Ön Yüz Bloğu Tetiklemeli)

Kullanıcılar, analiz ve öneriler almak için ön yüzdeki AI Çalışanı blokları aracılığıyla AI ile doğrudan etkileşime girer.

| Çalışan | Görev | Açıklama |
|------|------|------|
| Viz | Satış Verileri Analizi | Satış hattı trendlerini ve dönüşüm oranlarını analiz eder |
| Viz | Satış Hattı Tahmini | Ağırlıklı satış hattına göre geliri tahmin eder |
| Dara | Grafik Oluşturma | Satış raporu grafikleri oluşturur |
| Dara | Gösterge Paneli Tasarımı | Veri gösterge paneli düzenlerini tasarlar |
| Ellis | Yanıt Taslağı Hazırlama | Profesyonel e-posta yanıtları oluşturur |
| Ellis | İletişim Özeti | E-posta dizilerini özetler |
| Ellis | İş E-postası Taslağı | Toplantı davetleri, takipler, teşekkür e-postaları vb. |
| Orin | Günlük Öncelikler | Gün için önceliklendirilmiş bir görev listesi oluşturur |
| Orin | Sonraki En İyi Aksiyon | Her fırsat için sonraki adımları önerir |
| Lexi | İçerik Çevirisi | Pazarlama materyallerini, teklifleri ve e-postaları çevirir |

#### II. İş Akışı LLM Düğümleri (Arka Plan Otomatik Yürütme)

İş akışları içine yerleştirilmiş, koleksiyon olayları, aksiyon olayları veya zamanlanmış görevler tarafından AI Çalışanlarından bağımsız olarak otomatik olarak tetiklenen LLM düğümleri.

| Görev | Tetikleme Yöntemi | Açıklama | Hedef Alan |
|------|---------|------|---------|
| Aday Puanlama | Koleksiyon Olayı (Oluşturma/Güncelleme) | Aday kalitesini değerlendirir | ai_score, ai_convert_prob |
| Kazanma Olasılığı Tahmini | Koleksiyon Olayı (Aşama Değişimi) | Fırsat başarı olasılığını tahmin eder | ai_win_probability, ai_risk_factors |

> **Not**: İş akışı LLM düğümleri, yapılandırılmış JSON için istemler (prompts) ve Şema çıktısı kullanır; bu veriler kullanıcı müdahalesi olmadan ayrıştırılır ve iş verisi alanlarına yazılır.

### 10.3 Veritabanındaki AI Alanları

| Tablo | AI Alanı | Açıklama |
|----|--------|------|
| nb_crm_leads | ai_score | AI Puanı 0-100 |
| | ai_convert_prob | Dönüşüm Olasılığı |
| | ai_best_contact_time | En İyi İletişim Zamanı |
| | ai_tags | AI Tarafından Oluşturulan Etiketler (JSONB) |
| | ai_scored_at | Puanlama Zamanı |
| | ai_next_best_action | Sonraki En İyi Aksiyon Önerisi |
| | ai_nba_generated_at | Öneri Oluşturma Zamanı |
| nb_crm_opportunities | ai_win_probability | AI Tahmini Kazanma Olasılığı |
| | ai_analyzed_at | Analiz Zamanı |
| | ai_confidence | Tahmin Güveni |
| | ai_trend | Trend: up/stable/down |
| | ai_risk_factors | Risk Faktörleri (JSONB) |
| | ai_recommendations | Öneri Listesi (JSONB) |
| | ai_predicted_close | Tahmini Kapanış Tarihi |
| | ai_next_best_action | Sonraki En İyi Aksiyon Önerisi |
| | ai_nba_generated_at | Öneri Oluşturma Zamanı |
| nb_crm_customers | ai_health_score | Sağlık Puanı 0-100 |
| | ai_health_grade | Sağlık Derecesi: A/B/C/D |
| | ai_churn_risk | Kaybetme Riski 0-100% |
| | ai_churn_risk_level | Kaybetme Riski Seviyesi: low/medium/high |
| | ai_health_dimensions | Boyut Puanları (JSONB) |
| | ai_recommendations | Öneri Listesi (JSONB) |
| | ai_health_assessed_at | Sağlık Değerlendirme Zamanı |
| | ai_tags | AI Tarafından Oluşturulan Etiketler (JSONB) |
| | ai_best_contact_time | En İyi İletişim Zamanı |
| | ai_next_best_action | Sonraki En İyi Aksiyon Önerisi |
| | ai_nba_generated_at | Öneri Oluşturma Zamanı |

---

## 11. İş Akışı Motoru

### 11.1 Uygulanan İş Akışları

| İş Akışı Adı | Tetikleme Türü | Durum | Açıklama |
|-----------|---------|------|------|
| Leads Created | Koleksiyon Olayı | Etkin | Bir aday oluşturulduğunda tetiklenir |
| CRM Overall Analytics | AI Çalışanı Olayı | Etkin | Genel CRM veri analizi |
| Lead Conversion | Aksiyon Sonrası Olay | Etkin | Aday dönüştürme süreci |
| Lead Assignment | Koleksiyon Olayı | Etkin | Otomatik aday atama |
| Lead Scoring | Koleksiyon Olayı | Devre Dışı | Aday puanlama (Kesinleşecek) |
| Follow-up Reminder | Zamanlanmış Görev | Devre Dışı | Takip hatırlatıcıları (Kesinleşecek) |

### 11.2 Uygulanacak İş Akışları

| İş Akışı | Tetikleme Türü | Açıklama |
|-------|---------|------|
| Fırsat Aşaması İlerlemesi | Koleksiyon Olayı | Aşama değişiminde kazanma olasılığını güncelle ve zamanı kaydet |
| Fırsat Hareketsizlik Tespiti | Zamanlanmış Görev | Atıl fırsatları tespit et ve hatırlatıcı gönder |
| Teklif Onayı | Aksiyon Sonrası Olay | Çok seviyeli onay süreci |
| Sipariş Oluşturma | Aksiyon Sonrası Olay | Teklif kabulünden sonra otomatik sipariş oluştur |

---

## 12. Menü ve Arayüz Tasarımı

### 12.1 Yönetim Yapısı

| Menü | Tür | Açıklama |
|------|------|------|
| **Dashboards** | Grup | Gösterge Panelleri |
| - Dashboard | Sayfa | Varsayılan Gösterge Paneli |
| - SalesManager | Sayfa | Satış Müdürü Görünümü |
| - SalesRep | Sayfa | Satış Temsilcisi Görünümü |
| - Executive | Sayfa | Yönetici Görünümü |
| **Leads** | Sayfa | Aday Müşteri Yönetimi |
| **Customers** | Sayfa | Müşteri Yönetimi |
| **Opportunities** | Sayfa | Fırsat Yönetimi |
| - Table | Sekme | Fırsat Listesi |
| **Products** | Sayfa | Ürün Yönetimi |
| - Categories | Sekme | Ürün Kategorileri |
| **Orders** | Sayfa | Sipariş Yönetimi |
| **Settings** | Grup | Ayarlar |
| - Stage Settings | Sayfa | Fırsat Aşaması Yapılandırması |
| - Exchange Rate | Sayfa | Döviz Kuru Ayarları |
| - Activity | Sayfa | Etkinlik Kayıtları |
| - Emails | Sayfa | E-posta Yönetimi |
| - Contacts | Sayfa | Kişi Yönetimi |
| - Data Analysis | Sayfa | Veri Analizi |

### 12.2 Gösterge Paneli Görünümleri

#### Satış Müdürü Görünümü

| Bileşen | Tür | Veri |
|-----|------|------|
| Satış Hattı Değeri | KPI Kartı | Aşamaya göre toplam satış hattı tutarı |
| Ekip Liderlik Tablosu | Tablo | Temsilci performans sıralaması |
| Risk Uyarıları | Uyarı Listesi | Yüksek riskli fırsatlar |
| Kazanma Oranı Trendi | Çizgi Grafik | Aylık kazanma oranı |
| Hareketsiz İşlemler | Liste | İlgi gerektiren işlemler |

#### Satış Temsilcisi Görünümü

| Bileşen | Tür | Veri |
|-----|------|------|
| Kota İlerlemem | İlerleme Çubuğu | Aylık Gerçekleşen vs. Kota |
| Bekleyen Fırsatlar | KPI Kartı | Bekleyen fırsatlarımın sayısı |
| Bu Hafta Kapanacaklar | Liste | Yakında kapanması beklenen işlemler |
| Gecikmiş Etkinlikler | Uyarı | Süresi geçmiş görevler |
| Hızlı Aksiyonlar | Butonlar | Etkinlik kaydet, Fırsat oluştur |

#### Yönetici Görünümü

| Bileşen | Tür | Veri |
|-----|------|------|
| Yıllık Gelir | KPI Kartı | Yılbaşından bugüne gelir |
| Satış Hattı Değeri | KPI Kartı | Toplam satış hattı tutarı |
| Kazanma Oranı | KPI Kartı | Genel kazanma oranı |
| Müşteri Sağlığı | Dağılım | Sağlık puanı dağılımı |
| Tahmin | Grafik | Aylık gelir tahmini |


---

*Belge Sürümü: v2.0 | Güncelleme Tarihi: 2026-02-06*