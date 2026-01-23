:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# İş Akışı Webhook Entegrasyonu

Webhook tetikleyicileri aracılığıyla NocoBase, üçüncü taraf sistemlerden HTTP çağrıları alabilir ve iş akışlarını otomatik olarak tetikleyerek harici sistemlerle sorunsuz entegrasyon sağlayabilir.

## Genel Bakış

Webhook'lar, harici sistemlerin belirli olaylar meydana geldiğinde NocoBase'e proaktif olarak veri göndermesine olanak tanıyan bir "ters API" mekanizmasıdır. Aktif yoklamaya kıyasla Webhook'lar, daha gerçek zamanlı ve verimli bir entegrasyon yaklaşımı sunar.

## Tipik Kullanım Senaryoları

### Form Veri Gönderimi
Harici anket sistemleri, kayıt formları ve müşteri geri bildirim formları gibi sistemler, kullanıcı veri gönderdikten sonra Webhook aracılığıyla verileri NocoBase'e iletir; otomatik olarak kayıtlar oluşturur ve takip eden süreçleri (onay e-postası gönderme, görev atama vb.) tetikler.

### Mesaj Bildirimleri
Üçüncü taraf mesajlaşma platformlarındaki (WeCom, DingTalk, Slack gibi) olaylar (yeni mesajlar, @bahsetmeler veya onay tamamlanmaları gibi) Webhook'lar aracılığıyla NocoBase'deki otomatik işleme süreçlerini tetikleyebilir.

### Veri Senkronizasyonu
Harici sistemlerde (CRM, ERP gibi) veriler değiştiğinde, Webhook'lar aracılığıyla NocoBase'e gerçek zamanlı olarak iletilir ve veri senkronizasyonu sağlanır.

### Üçüncü Taraf Hizmet Entegrasyonu
- **GitHub**: Kod göndermeler, PR oluşturma olayları otomasyon iş akışlarını tetikler
- **GitLab**: CI/CD süreç durumu bildirimleri
- **Form Gönderimleri**: Harici form sistemleri NocoBase'e veri gönderir
- **IoT Cihazları**: Cihaz durumu değişiklikleri, sensör veri raporlaması

## Özellikler

### Esnek Tetikleme Mekanizması
- GET, POST, PUT, DELETE gibi HTTP metotlarını destekler
- JSON, form verileri ve diğer yaygın formatları otomatik olarak ayrıştırır
- Güvenilir kaynakları sağlamak için istek doğrulama yapılandırılabilir

### Veri İşleme Yetenekleri
- Alınan veriler iş akışlarında değişken olarak kullanılabilir
- Karmaşık veri dönüştürme ve işleme mantığını destekler
- Karmaşık iş mantığını uygulamak için diğer iş akışı düğümleriyle birleştirilebilir

### Güvenlik Güvencesi
- Sahte istekleri önlemek için imza doğrulamasını destekler
- Yapılandırılabilir IP beyaz listesi
- HTTPS şifreli iletim

## Kullanım Adımları

### 1. Eklentiyi Kurun
Eklenti yöneticisinde **[İş Akışı: Webhook Tetikleyicisi](/plugins/@nocobase/plugin-workflow-webhook/)** eklentisini bulun ve kurun.

> Not: Bu, ayrı olarak satın alınması veya abone olunması gereken ticari bir eklentidir.

### 2. Webhook İş Akışı Oluşturun
1. **İş Akışı Yönetimi** sayfasına gidin
2. **İş Akışı Oluştur**'a tıklayın
3. Tetikleyici türü olarak **Webhook Tetikleyicisi**'ni seçin

![Webhook İş Akışı Oluştur](https://static-docs.nocobase.com/20241210105049.png)

4. Webhook parametrelerini yapılandırın

![Webhook Tetikleyicisi Yapılandırması](https://static-docs.nocobase.com/20241210105441.png)
   - **İstek Yolu**: Özel Webhook URL yolu
   - **İstek Metodu**: İzin verilen HTTP metotlarını seçin (GET/POST/PUT/DELETE)
   - **Senkron/Asenkron**: İş akışı tamamlanana kadar sonuçların dönmesini bekleyip beklemeyeceğinizi seçin
   - **Doğrulama**: İmza doğrulamasını veya diğer güvenlik mekanizmalarını yapılandırın

### 3. İş Akışı Düğümlerini Yapılandırın
İş gereksinimlerinize göre iş akışı düğümleri ekleyin, örneğin:

- **Koleksiyon İşlemleri**: Kayıtları oluşturma, güncelleme, silme
- **Koşullu Mantık**: Alınan verilere göre dallanma
- **HTTP İsteği**: Diğer API'leri çağırma
- **Bildirimler**: E-posta, SMS vb. gönderme
- **Özel Kod**: JavaScript kodu çalıştırma

### 4. Webhook URL'sini Edinin
İş akışı oluşturulduktan sonra sistem, genellikle şu formatta benzersiz bir Webhook URL'si oluşturur:

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. Üçüncü Taraf Sistemde Yapılandırın
Oluşturulan Webhook URL'sini üçüncü taraf sistemde yapılandırın:

- Form sistemlerinde veri gönderme geri çağırma adresini ayarlayın
- GitHub/GitLab'de Webhook'u yapılandırın
- WeCom/DingTalk'ta olay gönderme adresini yapılandırın

### 6. Webhook'u Test Edin
Webhook'u Postman veya cURL gibi araçlar kullanarak test edin:

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## İstek Verilerine Erişim
İş akışlarında, Webhook tarafından alınan verilere değişkenler aracılığıyla erişebilirsiniz:

- `{{$context.data}}`: İstek gövdesi verileri
- `{{$context.headers}}`: İstek başlıkları
- `{{$context.query}}`: URL sorgu parametreleri
- `{{$context.params}}`: Yol parametreleri

![İstek Parametreleri Ayrıştırma](https://static-docs.nocobase.com/20241210111155.png)

![İstek Gövdesi Ayrıştırma](https://static-docs.nocobase.com/20241210112529.png)

## Yanıt Yapılandırması

![Yanıt Ayarları](https://static-docs.nocobase.com/20241210114312.png)

### Senkron Mod
İş akışı yürütmesi tamamlandıktan sonra sonuçları döndürür, yapılandırılabilir:

- **Yanıt Durum Kodu**: 200, 201 vb.
- **Yanıt Verileri**: Özel JSON yanıtı
- **Yanıt Başlıkları**: Özel HTTP başlıkları

### Asenkron Mod
Anında onay yanıtı döndürür, iş akışı arka planda yürütülür. Şunlar için uygundur:

- Uzun süreli iş akışları
- Yürütme sonuçları gerektirmeyen senaryolar
- Yüksek eşzamanlılık senaryoları

## Güvenlik En İyi Uygulamaları

### 1. İmza Doğrulamasını Etkinleştirin
Çoğu üçüncü taraf hizmeti imza mekanizmalarını destekler:

```javascript
// Örnek: GitHub Webhook imzasını doğrulayın
const crypto = require('crypto');
const signature = context.headers['x-hub-signature-256'];
const payload = JSON.stringify(context.data);
const secret = 'your-webhook-secret';
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

### 2. HTTPS Kullanın
Veri iletimini korumak için NocoBase'in HTTPS ortamında dağıtıldığından emin olun.

### 3. İstek Kaynaklarını Kısıtlayın
Yalnızca güvenilir kaynaklardan gelen isteklere izin vermek için IP beyaz listesini yapılandırın.

### 4. Veri Doğrulama
Alınan verilerin doğru formatta ve geçerli içerikte olduğundan emin olmak için iş akışlarına veri doğrulama mantığı ekleyin.

### 5. Denetim Günlüğü
Tüm Webhook isteklerini izleme ve sorun giderme amacıyla kaydedin.

## Sıkça Sorulan Sorular

### Webhook Tetiklenmiyor mu?
1. Webhook URL'sinin doğru olduğundan emin olun
2. İş akışı durumunun "Etkin" olduğunu doğrulayın
3. Üçüncü taraf sistemin gönderme günlüklerini kontrol edin
4. Güvenlik duvarı ve ağ yapılandırmasını gözden geçirin

### Webhook'ları Nasıl Hata Ayıklarsınız?
1. İstekler ve sonuçlar hakkında detaylı bilgi için iş akışı yürütme kayıtlarını kontrol edin
2. İstekleri doğrulamak için Webhook test araçlarını (Webhook.site gibi) kullanın
3. Yürütme kayıtlarında anahtar verileri ve hata mesajlarını inceleyin

### Yeniden Denemeler Nasıl Yönetilir?
Bazı üçüncü taraf hizmetler, başarılı bir yanıt almadıklarında yeniden göndermeyi dener:

- İş akışının idempotent olduğundan emin olun
- Tekrarları önlemek için benzersiz tanımlayıcılar kullanın
- İşlenmiş istek ID'lerini kaydedin

### Performans Optimizasyon İpuçları
- Zaman alıcı işlemleri asenkron modda işleyin
- Gereksiz istekleri filtrelemek için koşullu mantık ekleyin
- Yüksek eşzamanlılık senaryoları için mesaj kuyrukları kullanmayı düşünün

## Örnek Senaryolar

### Harici Form Gönderimi İşleme

```javascript
// 1. Veri kaynağını doğrulayın
// 2. Form verilerini ayrıştırın
const formData = context.data;

// 3. Müşteri kaydı oluşturun
// 4. İlgili sorumluya atayın
// 5. Göndericiye onay e-postası gönderin
if (formData.email) {
  // E-posta bildirimi gönderin
}
```

### GitHub Kod Gönderme Bildirimi

```javascript
// 1. Gönderme verilerini ayrıştırın
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. Ana dal ise
if (branch === 'main') {
  // 3. Dağıtım sürecini tetikleyin
  // 4. Ekip üyelerini bilgilendirin
}
```

![Webhook İş Akışı Örneği](https://static-docs.nocobase.com/20241210120655.png)

## İlgili Kaynaklar

- [İş Akışı Eklentisi Dokümantasyonu](/plugins/@nocobase/plugin-workflow/)
- [İş Akışı: Webhook Tetikleyicisi](/workflow/triggers/webhook)
- [İş Akışı: HTTP İstek Düğümü](/integration/workflow-http-request/)
- [API Anahtarı Kimlik Doğrulaması](/integration/api-keys/)