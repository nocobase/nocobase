:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# NocoBase'de API Anahtarlarını Kullanma

Bu rehber, NocoBase'de API Anahtarlarını kullanarak veri almayı pratik bir "Yapılacaklar" örneği üzerinden göstermektedir. Tüm iş akışını anlamak için aşağıdaki adım adım talimatları takip ediniz.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 API Anahtarlarını Anlama

Bir API Anahtarı, yetkili kullanıcılardan gelen API isteklerini doğrulamak için kullanılan güvenli bir jetondur. Web uygulamaları, mobil uygulamalar veya arka uç betikleri aracılığıyla NocoBase sistemine erişirken isteği yapanın kimliğini doğrulayan bir kimlik bilgisi olarak işlev görür.

HTTP istek başlığındaki formatı:

```txt
Authorization: Bearer {API anahtarı}
```

"Bearer" öneki, ardından gelen dizenin, isteği yapanın izinlerini doğrulamak için kullanılan doğrulanmış bir API Anahtarı olduğunu belirtir.

### Yaygın Kullanım Senaryoları

API Anahtarları genellikle aşağıdaki senaryolarda kullanılır:

1.  **İstemci Uygulama Erişimi**: Web tarayıcıları ve mobil uygulamalar, yalnızca yetkili kullanıcıların verilere erişebilmesini sağlamak için kullanıcı kimliğini doğrulamak amacıyla API Anahtarlarını kullanır.
2.  **Otomatik Görev Yürütme**: Arka plan süreçleri ve zamanlanmış görevler, güncellemeleri, veri senkronizasyonunu ve günlük kaydı işlemlerini güvenli bir şekilde yürütmek için API Anahtarlarını kullanır.
3.  **Geliştirme ve Test**: Geliştiriciler, hata ayıklama ve test sırasında doğrulanmış istekleri simüle etmek ve API yanıtlarını doğrulamak için API Anahtarlarını kullanır.

API Anahtarları; kimlik doğrulama, kullanım izleme, istek oranı sınırlaması ve tehdit önleme gibi çok sayıda güvenlik avantajı sunarak NocoBase'in istikrarlı ve güvenli çalışmasını sağlar.

## 2 NocoBase'de API Anahtarları Oluşturma

### 2.1 Kimlik Doğrulama: API Anahtarları eklentisini etkinleştirin

Yerleşik [Kimlik Doğrulama: API Anahtarları](/plugins/@nocobase/plugin-api-keys/) eklentisinin etkinleştirildiğinden emin olun. Etkinleştirildikten sonra, sistem ayarlarında yeni bir API Anahtarları yapılandırma sayfası belirecektir.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Bir Test Koleksiyonu Oluşturun

Gösterim amacıyla, aşağıdaki alanları içeren `todos` adında bir koleksiyon oluşturun:

-   `id`
-   `başlık (title)`
-   `tamamlandı mı (completed)`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Koleksiyona bazı örnek kayıtlar ekleyin:

-   yemek ye
-   uyu
-   oyun oyna

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Bir Rol Oluşturun ve Atayın

API Anahtarları kullanıcı rollerine bağlıdır ve sistem, atanan role göre istek izinlerini belirler. Bir API Anahtarı oluşturmadan önce, bir rol oluşturmalı ve uygun izinleri yapılandırmalısınız. "Yapılacaklar API Rolü" adında bir rol oluşturun ve bu role `todos` koleksiyonuna tam erişim yetkisi verin.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Bir API Anahtarı oluştururken "Yapılacaklar API Rolü" mevcut değilse, mevcut kullanıcının bu role atandığından emin olun:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Rol atamasından sonra, sayfayı yenileyin ve API Anahtarları yönetim sayfasına gidin. "API Anahtarı Ekle"ye tıklayarak "Yapılacaklar API Rolü"nün rol seçiminde göründüğünü doğrulayın.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Daha iyi erişim kontrolü için, özellikle API Anahtarı yönetimi ve testi için ayrılmış bir kullanıcı hesabı (örneğin, "Yapılacaklar API Kullanıcısı") oluşturmayı düşünebilirsiniz. "Yapılacaklar API Rolü"nü bu kullanıcıya atayın.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 API Anahtarını Oluşturun ve Kaydedin

Formu gönderdikten sonra, sistem yeni oluşturulan API Anahtarı ile birlikte bir onay mesajı gösterecektir. **Önemli**: Bu anahtarı hemen kopyalayın ve güvenli bir yerde saklayın, çünkü güvenlik nedenleriyle bir daha gösterilmeyecektir.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Örnek API Anahtarı:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Önemli Notlar

-   API Anahtarının geçerlilik süresi, oluşturulurken yapılandırılan son kullanma ayarı tarafından belirlenir.
-   API Anahtarı oluşturma ve doğrulama, `APP_KEY` ortam değişkenine bağlıdır. **Bu değişkeni değiştirmeyin**, aksi takdirde sistemdeki tüm mevcut API Anahtarlarını geçersiz kılarsınız.

## 3 API Anahtarı Kimlik Doğrulamasını Test Etme

### 3.1 API Dokümantasyonu eklentisini kullanma

Her bir API uç noktasının istek yöntemlerini, URL'lerini, parametrelerini ve başlıklarını görüntülemek için [API Dokümantasyonu](/plugins/@nocobase/plugin-api-doc/) eklentisini açın.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Temel CRUD İşlemlerini Anlama

NocoBase, veri işleme için standart CRUD (Oluşturma, Okuma, Güncelleme, Silme) API'leri sağlar:

-   **Liste Sorgusu (list API):**

    ```txt
    GET {baseURL}/{collectionName}:list
    İstek Başlığı:
    - Authorization: Bearer <API anahtarı>

    ```
-   **Kayıt Oluşturma (create API):**

    ```txt
    POST {baseURL}/{collectionName}:create

    İstek Başlığı:
    - Authorization: Bearer <API anahtarı>

    İstek Gövdesi (JSON formatında), örneğin:
        {
            "title": "123"
        }
    ```
-   **Kayıt Güncelleme (update API):**

    ```txt
    POST {baseURL}/{collectionName}:update?filterByTk={id}
    İstek Başlığı:
    - Authorization: Bearer <API anahtarı>

    İstek Gövdesi (JSON formatında), örneğin:
        {
            "title": "123",
            "completed": true
        }
    ```
-   **Kayıt Silme (delete API):**

    ```txt
    POST {baseURL}/{collectionName}:destroy?filterByTk={id}
    İstek Başlığı:
    - Authorization: Bearer <API anahtarı>
    ```

Burada:
-   `{baseURL}`: NocoBase sistem URL'niz
-   `{collectionName}`: Koleksiyon adı

Örnek: `localhost:13000` adresindeki yerel bir örnek ve `todos` adlı bir koleksiyon için:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Postman ile Test Etme

Postman'de aşağıdaki yapılandırmayla bir GET isteği oluşturun:
-   **URL**: İstek uç noktası (örneğin `http://localhost:13000/api/todos:list`)
-   **Başlıklar**: `Authorization` başlığını aşağıdaki değerle ekleyin:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**Başarılı Yanıt:**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**Hata Yanıtı (Geçersiz/Süresi Dolmuş API Anahtarı):**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**Sorun Giderme**: Kimlik doğrulama başarısız olursa, rol izinlerini, API Anahtarı bağlamasını ve jeton formatını doğrulayın.

### 3.4 İstek Kodunu Dışa Aktırma

Postman, isteği çeşitli formatlarda dışa aktarmanıza olanak tanır. Örnek cURL komutu:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 JS Bloğunda API Anahtarlarını Kullanma

NocoBase 2.0, JS bloklarını kullanarak sayfalarda doğrudan yerel JavaScript kodu yazmayı destekler. Bu örnek, API Anahtarlarını kullanarak harici API verilerinin nasıl alınacağını göstermektedir.

### Bir JS Bloğu Oluşturma

NocoBase sayfanıza bir JS bloğu ekleyin ve yapılacaklar listesi verilerini almak için aşağıdaki kodu kullanın:

```javascript
// API Anahtarını kullanarak yapılacaklar listesi verilerini alın
async function fetchTodos() {
  try {
    // Yükleme mesajını göster
    ctx.message.loading('Veriler alınıyor...');

    // HTTP istekleri için axios kütüphanesini yükle
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('HTTP kütüphanesi yüklenemedi');
      return;
    }

    // API Anahtarı (gerçek API anahtarınızla değiştirin)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // API isteği yap
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Sonuçları göster
    console.log('Yapılacaklar Listesi:', response.data);
    ctx.message.success(`${response.data.data.length} veri başarıyla alındı`);

    // Verileri burada işleyebilirsiniz
    // Örneğin: bir tabloda gösterin, form alanlarını güncelleyin vb.

  } catch (error) {
    console.error('Veri alınırken hata oluştu:', error);
    ctx.message.error('Veri alınamadı: ' + error.message);
  }
}

// Fonksiyonu çalıştır
fetchTodos();
```

### Temel Noktalar

-   **ctx.requireAsync()**: HTTP istekleri için harici kütüphaneleri (axios gibi) dinamik olarak yükler
-   **ctx.message**: Kullanıcı bildirimlerini (yükleniyor, başarılı, hata mesajları) görüntüler
-   **API Anahtarı Kimlik Doğrulaması**: `Authorization` istek başlığında API Anahtarını `Bearer` önekiyle birlikte iletin
-   **Yanıt İşleme**: Geri dönen verileri gerektiği gibi işleyin (görüntüleme, dönüştürme vb.)

## 5 Özet

Bu rehber, NocoBase'de API Anahtarlarını kullanmaya yönelik tüm iş akışını kapsamaktadır:

1.  **Kurulum**: API Anahtarları eklentisini etkinleştirme ve bir test koleksiyonu oluşturma
2.  **Yapılandırma**: Uygun izinlere sahip roller oluşturma ve API Anahtarları üretme
3.  **Test Etme**: Postman ve API Dokümantasyonu eklentisini kullanarak API Anahtarı kimlik doğrulamasını doğrulama
4.  **Entegrasyon**: JS bloklarında API Anahtarlarını kullanma

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**Ek Kaynaklar:**
-   [API Anahtarları eklentisi dokümantasyonu](/plugins/@nocobase/plugin-api-keys/)
-   [API Dokümantasyonu eklentisi](/plugins/@nocobase/plugin-api-doc/)