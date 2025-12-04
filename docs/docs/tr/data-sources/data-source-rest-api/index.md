---
pkg: "@nocobase/plugin-data-source-rest-api"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# REST API Veri Kaynağı

## Giriş

Bu eklenti, REST API kaynaklarından gelen verileri sorunsuz bir şekilde entegre etmenizi sağlar.

## Kurulum

Bu bir ticari eklentidir ve eklenti yöneticisi aracılığıyla yüklenip etkinleştirilmesi gerekir.

![20240323162741](https://static-docs.nocobase.com/20240323162741.png)

## REST API Kaynağı Ekleme

Eklentiyi etkinleştirdikten sonra, veri kaynağı yönetimi bölümündeki "Yeni ekle" açılır menüsünden REST API'yi seçerek bir REST API kaynağı ekleyebilirsiniz.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

REST API kaynağını yapılandırın.

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Koleksiyon Ekleme

NocoBase'de, bir RESTful kaynak bir koleksiyona eşlenir; örneğin, bir Kullanıcılar koleksiyonu.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Bu API uç noktaları NocoBase'de şu şekilde eşlenir:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

NocoBase API tasarım spesifikasyonları hakkında kapsamlı bir rehber için API belgelerine başvurabilirsiniz.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Detaylı bilgi için "NocoBase API - Çekirdek" bölümünü inceleyin.

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

Bir REST API veri kaynağı için koleksiyon yapılandırması şunları içerir:

### Listeleme

Kaynakların bir listesini görüntülemek için arayüzü eşleyin.

![20240716211351](https://static-docs.nocobase.com/20240716211351.png)

### Getir

Kaynak detaylarını görüntülemek için arayüzü eşleyin.

![20240716211532](https://static-docs.nocobase.com/20240716211532.png)

### Oluştur

Bir kaynak oluşturmak için arayüzü eşleyin.

![20240716211634](https://static-docs.nocobase.com/20240716211634.png)

### Güncelle

Bir kaynağı güncellemek için arayüzü eşleyin.
![20240716211733](https://static-docs.nocobase.com/20240716211733.png)

### Sil

Bir kaynağı silmek için arayüzü eşleyin.

![20240716211808](https://static-docs.nocobase.com/20240716211808.png)

Listeleme ve Getir arayüzlerinin her ikisinin de yapılandırılması zorunludur.

## API Hata Ayıklama

### İstek Parametre Entegrasyonu

Örnek: Listeleme API'si için sayfalama parametrelerini yapılandırın. Üçüncü taraf API'si yerel olarak sayfalama desteklemiyorsa, NocoBase alınan liste verilerine göre sayfalama yapacaktır.

![20241121205229](https://static-docs.nocobase.com/20241121205229.png)

Lütfen dikkat, yalnızca arayüze eklenen değişkenler geçerli olacaktır.

| Üçüncü Taraf API Parametre Adı | NocoBase Parametresi               |
| ------------------------------ | ---------------------------------- |
| page                           | {{request.params.page}}            |
| limit                          | {{request.params.pageSize}}        |

Hata ayıklamak ve yanıtı görüntülemek için "Deneyin" (Try it out) düğmesine tıklayabilirsiniz.

![20241121210320](https://static-docs.nocobase.com/20241121210320.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Yanıt Formatı Dönüşümü

Üçüncü taraf API'sinin yanıt formatı NocoBase standardında olmayabilir ve ön uçta doğru şekilde görüntülenebilmesi için dönüştürülmesi gerekir.

![20241121214638](https://static-docs.nocobase.com/20241121214638.png)

Çıktının NocoBase standardına uygun olmasını sağlamak için dönüşüm kurallarını üçüncü taraf API'sinin yanıt formatına göre ayarlayın.

![20241121215100](https://static-docs.nocobase.com/20241121215100.png)

Hata ayıklama süreci açıklaması

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

## Değişkenler

REST API veri kaynağı, API entegrasyonu için üç tür değişkeni destekler:

- Özel veri kaynağı değişkenleri
- NocoBase istek değişkenleri
- Üçüncü taraf yanıt değişkenleri

### Özel Veri Kaynağı Değişkenleri

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### NocoBase İsteği

- Params: URL sorgu parametreleri (Search Params), arayüze göre değişiklik gösterir.
- Headers: Özel istek başlıkları, öncelikli olarak NocoBase'den belirli X- bilgilerini sağlar.
- Body: İstek gövdesi.
- Token: Mevcut NocoBase isteği için API anahtarı (token).

![20240716222042](https://static-docs.nocobase.com/20240716222042.png)

### Üçüncü Taraf Yanıtları

Şu anda yalnızca yanıt gövdesi mevcuttur.

![20240716222303](https://static-docs.nocobase.com/20240716222303.png)

Her arayüz için mevcut değişkenler aşağıdadır:

### Listeleme

| Parametre               | Açıklama                                                   |
| ----------------------- | ---------------------------------------------------------- |
| request.params.page     | Geçerli sayfa                                              |
| request.params.pageSize | Sayfa başına öğe sayısı                                    |
| request.params.filter   | Filtre kriterleri (NocoBase Filtre formatına uygun olmalı) |
| request.params.sort     | Sıralama kriterleri (NocoBase Sıralama formatına uygun olmalı) |
| request.params.appends  | İsteğe bağlı yüklenecek alanlar, genellikle ilişki alanları için |
| request.params.fields   | Dahil edilecek alanlar (beyaz liste)                       |
| request.params.except   | Hariç tutulacak alanlar (kara liste)                       |

### Getir

| Parametre                 | Açıklama                                                   |
| ------------------------- | ---------------------------------------------------------- |
| request.params.filterByTk | Zorunlu, genellikle mevcut kayıt kimliği                   |
| request.params.filter     | Filtre kriterleri (NocoBase Filtre formatına uygun olmalı) |
| request.params.appends    | İsteğe bağlı yüklenecek alanlar, genellikle ilişki alanları için |
| request.params.fields     | Dahil edilecek alanlar (beyaz liste)                       |
| request.params.except     | Hariç tutulacak alanlar (kara liste)                       |

### Oluştur

| Parametre                | Açıklama                   |
| ------------------------ | -------------------------- |
| request.params.whiteList | Beyaz liste                |
| request.params.blacklist | Kara liste                 |
| request.body             | Oluşturma için başlangıç verisi |

### Güncelle

| Parametre                 | Açıklama                                       |
| ------------------------- | ---------------------------------------------- |
| request.params.filterByTk | Zorunlu, genellikle mevcut kayıt kimliği       |
| request.params.filter     | Filtre kriterleri (NocoBase Filtre formatına uygun olmalı) |
| request.params.whiteList  | Beyaz liste                                    |
| request.params.blacklist  | Kara liste                                     |
| request.body              | Güncelleme verisi                              |

### Sil

| Parametre                 | Açıklama                                       |
| ------------------------- | ---------------------------------------------- |
| request.params.filterByTk | Zorunlu, genellikle mevcut kayıt kimliği       |
| request.params.filter     | Filtre kriterleri (NocoBase Filtre formatına uygun olmalı) |

## Alan Yapılandırması

Uyarlanan kaynağın CRUD arayüz verilerinden alan meta verileri (Alanlar), koleksiyonun alanları olarak çıkarılır.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Alan meta verilerini çıkarın.

![20241121230436](https://static-docs.nocobase.com/20241121230436.png)

Alanlar ve önizleme.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Alanları düzenleyin (diğer veri kaynaklarına benzer şekilde).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## REST API Veri Kaynağı Blokları Ekleme

Koleksiyon yapılandırıldıktan sonra, arayüze bloklar ekleyebilirsiniz.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)