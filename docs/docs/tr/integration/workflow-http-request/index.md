:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# İş Akışı HTTP İstek Entegrasyonu

HTTP İstek düğümü sayesinde, NocoBase iş akışları herhangi bir HTTP servisine proaktif olarak istek gönderebilir, böylece harici sistemlerle veri alışverişi ve iş entegrasyonu sağlanır.

## Genel Bakış

HTTP İstek düğümü, iş akışlarındaki temel bir entegrasyon bileşenidir. İş akışı yürütme sırasında üçüncü taraf API'leri, dahili servis arayüzlerini veya diğer web servislerini çağırarak veri almanızı veya harici işlemleri tetiklemenizi sağlar.

## Tipik Kullanım Senaryoları

### Veri Alma

- **Üçüncü Taraf Veri Sorguları**: Hava durumu API'leri, döviz kuru API'leri gibi kaynaklardan gerçek zamanlı veri alın.
- **Adres Çözümleme**: Adres ayrıştırma ve coğrafi kodlama için harita servis API'lerini çağırın.
- **Kurumsal Veri Senkronizasyonu**: CRM, ERP sistemlerinden müşteri, sipariş gibi verileri alın.

### İş Tetikleyicileri

- **Mesaj Gönderme**: SMS, e-posta, WeCom gibi servisleri kullanarak bildirimler gönderin.
- **Ödeme İstekleri**: Ödeme ağ geçitleri aracılığıyla ödeme, iade gibi işlemleri başlatın.
- **Sipariş İşleme**: Lojistik sistemlerine sevk irsaliyeleri gönderin, lojistik durumunu sorgulayın.

### Sistem Entegrasyonu

- **Mikroservis Çağrıları**: Mikroservis mimarilerinde diğer servislerin API'lerini çağırın.
- **Veri Raporlama**: İş verilerini analiz platformlarına, izleme sistemlerine raporlayın.
- **Üçüncü Taraf Servisler**: Yapay zeka servisleri, OCR tanıma, konuşma sentezi gibi servisleri entegre edin.

### Otomasyon İşlemleri

- **Zamanlanmış Görevler**: Verileri senkronize etmek için harici API'leri düzenli olarak çağırın.
- **Olay Yanıtı**: Veri değiştiğinde ilgili sistemleri bilgilendirmek için harici API'leri otomatik olarak çağırın.
- **Onay İş Akışları**: Onay sistemi API'leri aracılığıyla onay istekleri gönderin.

## Özellikler

### Tam HTTP Desteği

- GET, POST, PUT, PATCH, DELETE gibi tüm HTTP metotlarını destekler.
- Özel istek başlıklarını (Headers) destekler.
- JSON, form verisi, XML gibi birden fazla veri formatını destekler.
- URL parametreleri, yol parametreleri, istek gövdesi gibi çeşitli parametre gönderme yöntemlerini destekler.

### Esnek Veri İşleme

- **Değişken Referansları**: İş akışı değişkenlerini kullanarak istekleri dinamik olarak oluşturun.
- **Yanıt Ayrıştırma**: JSON yanıtlarını otomatik olarak ayrıştırın ve gerekli verileri çıkarın.
- **Veri Dönüşümü**: İstek ve yanıt verilerinin formatlarını dönüştürün.
- **Hata Yönetimi**: Yeniden deneme stratejilerini, zaman aşımı ayarlarını ve hata işleme mantığını yapılandırın.

### Güvenlik Kimlik Doğrulaması

- **Temel Kimlik Doğrulama (Basic Auth)**: HTTP temel kimlik doğrulaması.
- **Taşıyıcı Token (Bearer Token)**: Token tabanlı kimlik doğrulama.
- **API Anahtarı**: Özel API anahtarı kimlik doğrulaması.
- **Özel Başlıklar**: Herhangi bir kimlik doğrulama yöntemini destekler.

## Kullanım Adımları

### 1. Eklentinin Etkin Olduğunu Doğrulayın

HTTP İstek düğümü, **iş akışı** eklentisinin yerleşik bir özelliğidir. **[İş Akışı](/plugins/@nocobase/plugin-workflow/)** eklentisinin etkin olduğundan emin olun.

### 2. İş Akışına HTTP İstek Düğümü Ekleme

1. Bir iş akışı oluşturun veya düzenleyin.
2. İstediğiniz konuma bir **HTTP İstek** düğümü ekleyin.

![HTTP İstek - Düğüm Ekle](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. İstek parametrelerini yapılandırın.

### 3. İstek Parametrelerini Yapılandırma

![HTTP İstek Düğümü - Yapılandırma](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### Temel Yapılandırma

- **İstek URL'si**: Hedef API adresi, değişken kullanımını destekler.
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **İstek Metodu**: GET, POST, PUT, DELETE vb. seçin.

- **İstek Başlıkları**: HTTP Başlıklarını yapılandırın.
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **İstek Parametreleri**:
  - **Sorgu Parametreleri**: URL sorgu parametreleri.
  - **Gövde Parametreleri**: İstek gövdesi verileri (POST/PUT).

#### Gelişmiş Yapılandırma

- **Zaman Aşımı**: İstek zaman aşımını ayarlayın (varsayılan 30 saniye).
- **Başarısızlıkta Yeniden Dene**: Yeniden deneme sayısını ve aralığını yapılandırın.
- **Başarısızlığı Yoksay**: İstek başarısız olsa bile iş akışının yürütülmesine devam edin.
- **Proxy Ayarları**: HTTP proxy'sini yapılandırın (gerekirse).

### 4. Yanıt Verilerini Kullanma

HTTP İstek düğümü yürütüldükten sonra, yanıt verileri sonraki düğümlerde kullanılabilir:

- `{{$node.data.status}}`: HTTP durum kodu
- `{{$node.data.headers}}`: Yanıt başlıkları
- `{{$node.data.data}}`: Yanıt gövdesi verileri
- `{{$node.data.error}}`: Hata mesajı (istek başarısız olursa)

![HTTP İstek Düğümü - Yanıt Kullanımı](https://static-docs.nocobase.com/20240529110610.png)

## Örnek Senaryolar

### Örnek 1: Hava Durumu Bilgisi Alma

```javascript
// Yapılandırma
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// Yanıtı Kullanma
Temperature: {{$node.data.data.temperature}}
Weather: {{$node.data.data.condition}}
```

### Örnek 2: WeCom Mesajı Gönderme

```javascript
// Yapılandırma
URL: https://qyapi.weixin.qq.com/cgi-bin/message/send
Method: POST
Headers:
  Content-Type: application/json
Body:
{
  "touser": "{{$context.userId}}",
  "msgtype": "text",
  "agentid": 1000001,
  "text": {
    "content": "Sipariş {{$context.orderId}} gönderildi"
  }
}
```

### Örnek 3: Ödeme Durumunu Sorgulama

```javascript
// Yapılandırma
URL: https://api.payment.com/v1/orders/{{$context.orderId}}/status
Method: GET
Headers:
  Authorization: Bearer {{$context.apiKey}}
  Content-Type: application/json

// Koşullu Mantık
Eğer {{$node.data.data.status}} "paid" değerine eşitse
  - Sipariş durumunu "Ödendi" olarak güncelleyin
  - Ödeme başarı bildirimini gönderin
Değilse eğer {{$node.data.data.status}} "pending" değerine eşitse
  - Sipariş durumunu "Ödeme Bekleniyor" olarak tutun
Değilse
  - Ödeme hatası günlüğünü kaydedin
  - Yöneticileri istisnayı ele almaları için bilgilendirin
```

### Örnek 4: Verileri CRM'e Senkronize Etme

```javascript
// Yapılandırma
URL: https://api.crm.com/v1/customers
Method: POST
Headers:
  X-API-Key: {{$context.crmApiKey}}
  Content-Type: application/json
Body:
{
  "name": "{{$context.customerName}}",
  "email": "{{$context.email}}",
  "phone": "{{$context.phone}}",
  "source": "NocoBase",
  "created_at": "{{$context.createdAt}}"
}
```

## Kimlik Doğrulama Yapılandırması

### Temel Kimlik Doğrulama (Basic Authentication)

```javascript
Headers:
  Authorization: Basic base64(username:password)
```

### Taşıyıcı Token (Bearer Token)

```javascript
Headers:
  Authorization: Bearer your-access-token
```

### API Anahtarı

```javascript
// Başlıkta
Headers:
  X-API-Key: your-api-key

// Veya Sorguda
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

Önce access_token'ı alın, ardından kullanın:

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## Hata Yönetimi ve Hata Ayıklama

### Sık Görülen Hatalar

1. **Bağlantı Zaman Aşımı**: Ağ bağlantısını kontrol edin, zaman aşımı süresini artırın.
2. **401 Yetkisiz**: Kimlik doğrulama bilgilerinin doğru olup olmadığını doğrulayın.
3. **404 Bulunamadı**: URL'nin doğru olup olmadığını kontrol edin.
4. **500 Sunucu Hatası**: API sağlayıcısının servis durumunu kontrol edin.

### Hata Ayıklama İpuçları

1. **Günlük Düğümlerini Kullanın**: İstek ve yanıt verilerini kaydetmek için HTTP isteklerinden önce ve sonra günlük düğümleri ekleyin.

2. **Yürütme Günlüklerini Kontrol Edin**: İş akışı yürütme günlükleri, ayrıntılı istek ve yanıt bilgilerini içerir.

3. **Test Araçları**: API'yi önce Postman, cURL gibi araçlarla test edin.

4. **Hata Yönetimi**: Farklı yanıt durumlarını ele almak için koşullu mantık ekleyin.

```javascript
Eğer {{$node.data.status}} >= 200 ve {{$node.data.status}} < 300 ise
  - Başarılı mantığı işleyin
Değilse
  - Başarısızlık mantığını işleyin
  - Hatayı kaydedin: {{$node.data.error}}
```

## Performans Optimizasyonu Önerileri

### 1. Asenkron İşleme Kullanın

Anında sonuç gerektirmeyen istekler için asenkron iş akışları kullanmayı düşünün.

### 2. Makul Zaman Aşımları Yapılandırın

Aşırı beklemeyi önlemek için API'nin gerçek yanıt sürelerine göre zaman aşımlarını ayarlayın.

### 3. Önbellekleme Stratejileri Uygulayın

Sık değişmeyen veriler (yapılandırmalar, sözlükler gibi) için yanıtları önbelleğe almayı düşünün.

### 4. Toplu İşleme

Aynı API'yi birden fazla kez çağırmanız gerekiyorsa, API'nin toplu işlem arayüzlerini (eğer destekleniyorsa) kullanmayı düşünün.

### 5. Hata Yeniden Denemesi

Makul yeniden deneme stratejileri yapılandırın, ancak API hız sınırlamasına yol açabilecek aşırı yeniden denemelerden kaçının.

## Güvenlik En İyi Uygulamaları

### 1. Hassas Bilgileri Koruyun

- URL'lerde hassas bilgileri ifşa etmeyin.
- Şifreli iletim için HTTPS kullanın.
- API anahtarları ve hassas veriler gibi bilgileri ortam değişkenlerinde veya yapılandırma yönetiminde saklayın.

### 2. Yanıt Verilerini Doğrulayın

```javascript
// Yanıt durumunu doğrulayın
if (![200, 201].includes($node.data.status)) {
  throw new Error('API isteği başarısız oldu');
}

// Veri formatını doğrulayın
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('Geçersiz yanıt verisi');
}
```

### 3. İstek Sınırlaması

Üçüncü taraf API'lerinin hız sınırlamalarına uyun, engellenmekten kaçının.

### 4. Günlükleri Anonimleştirme

Günlük kaydı yaparken, hassas bilgilerin (parolalar, anahtarlar vb.) anonimleştirilmesine dikkat edin.

## Webhook ile Karşılaştırma

| Özellik | HTTP İstek Düğümü | Webhook Tetikleyici |
|---------|-------------------|---------------------|
| Yön     | NocoBase hariciyi çağırır | Harici NocoBase'i çağırır |
| Zamanlama | İş akışı yürütülürken | Harici olay meydana geldiğinde |
| Amaç    | Veri al, harici işlemleri tetikle | Harici bildirimleri, olayları al |
| Tipik Senaryolar | Ödeme API'sini çağır, hava durumunu sorgula | Ödeme geri bildirimleri, mesaj bildirimleri |

Bu iki özellik birbirini tamamlayarak eksiksiz bir sistem entegrasyon çözümü oluşturur.

## İlgili Kaynaklar

- [İş Akışı Eklentisi Dokümantasyonu](/plugins/@nocobase/plugin-workflow/)
- [İş Akışı: HTTP İstek Düğümü](/workflow/nodes/request)
- [İş Akışı: Webhook Tetikleyici](/integration/workflow-webhook/)
- [API Anahtarları Kimlik Doğrulaması](/integration/api-keys/)
- [API Dokümantasyon Eklentisi](/plugins/@nocobase/plugin-api-doc/)