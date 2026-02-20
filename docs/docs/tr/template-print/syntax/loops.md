:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


## Döngü İşleme

Döngü işleme, dizilerdeki veya nesnelerdeki verileri tekrar tekrar oluşturmak için kullanılır. Tekrarlanacak içeriği belirlemek için döngü başlangıç ve bitiş işaretleri tanımlanır. Aşağıda sık karşılaşılan birkaç durumu inceleyeceğiz.

### Diziler Üzerinde Yineleme

#### 1. Söz Dizimi Açıklaması

- Mevcut döngü öğesini tanımlamak için `{d.array[i].özellik}` etiketini, döngü alanını işaretlemek için ise bir sonraki öğeyi belirtmek üzere `{d.array[i+1].özellik}` etiketini kullanın.
- Döngü sırasında, ilk satır (`[i]` kısmı) otomatik olarak tekrar için şablon olarak kullanılır; şablonda döngü örneğini yalnızca bir kez yazmanız yeterlidir.

Örnek söz dizimi formatı:
```
{d.diziAdı[i].özellik}
{d.diziAdı[i+1].özellik}
```

#### 2. Örnek: Basit Dizi Döngüsü

##### Veri
```json
{
  "cars": [
    { "brand": "Toyota", "id": 1 },
    { "brand": "Hyundai", "id": 2 },
    { "brand": "BMW",    "id": 3 },
    { "brand": "Peugeot","id": 4 }
  ]
}
```

##### Şablon
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### Sonuç
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```

#### 3. Örnek: İç İçe Dizi Döngüsü

Bir dizinin içinde başka dizilerin bulunduğu durumlar için uygundur; iç içe geçme seviyesi sınırsız olabilir.

##### Veri
```json
[
  {
    "brand": "Toyota",
    "models": [
      { "size": "Prius 4", "power": 125 },
      { "size": "Prius 5", "power": 139 }
    ]
  },
  {
    "brand": "Kia",
    "models": [
      { "size": "EV4", "power": 450 },
      { "size": "EV6", "power": 500 }
    ]
  }
]
```

##### Şablon
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### Sonuç
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```

#### 4. Örnek: Çift Yönlü Döngü (Gelişmiş Özellik, v4.8.0+)

Çift yönlü döngüler, hem satırlar hem de sütunlar üzerinde aynı anda yineleme yapılmasına olanak tanır. Bu özellik, karşılaştırma tabloları ve diğer karmaşık düzenler oluşturmak için uygundur (Not: Şu anda bazı formatlar yalnızca DOCX, HTML ve MD şablonlarında resmi olarak desteklenmektedir).

##### Veri
```json
{
  "titles": [
    { "name": "Kia" },
    { "name": "Toyota" },
    { "name": "Hopium" }
  ],
  "cars": [
    { "models": [ "EV3", "Prius 1", "Prototype" ] },
    { "models": [ "EV4", "Prius 2", "" ] },
    { "models": [ "EV6", "Prius 3", "" ] }
  ]
}
```

##### Şablon
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### Sonuç
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```

#### 5. Örnek: Döngü Yineleyici Değerlerine Erişme (v4.0.0+)

Bir döngü içinde, mevcut yinelemenin indeks değerine doğrudan erişebilirsiniz. Bu, özel biçimlendirme gereksinimlerini karşılamanıza yardımcı olur.

##### Şablon Örneği
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> Not: Nokta sayısı, farklı seviyelerdeki indeks değerlerini belirtir (örneğin, `.i` mevcut seviyeyi, `..i` ise önceki seviyeyi temsil eder). Şu anda ters sıralama ile ilgili bir sorun bulunmaktadır; ayrıntılar için lütfen resmi belgelere bakın.

### Nesneler Üzerinde Yineleme

#### 1. Söz Dizimi Açıklaması

- Bir nesnedeki özellikler için, özellik adını almak üzere `.att` ve özellik değerini almak üzere `.val` kullanabilirsiniz.
- Yineleme sırasında, her bir özellik öğesi tek tek gezilir.

Örnek söz dizimi formatı:
```
{d.nesneAdı[i].att}  // Özellik adı
{d.nesneAdı[i].val}  // Özellik değeri
```

#### 2. Örnek: Nesne Özelliği Yinelemesi

##### Veri
```json
{
  "myObject": {
    "paul": "10",
    "jack": "20",
    "bob":  "30"
  }
}
```

##### Şablon
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### Sonuç
```
People namePeople age
paul10
jack20
bob30
```

### Sıralama İşlemi

Sıralama özelliğini kullanarak, dizi verilerini doğrudan şablon içinde sıralayabilirsiniz.

#### 1. Söz Dizimi Açıklaması: Artan Sırada Sıralama

- Döngü etiketinde bir özelliği sıralama ölçütü olarak kullanın. Söz dizimi formatı şöyledir:
  ```
  {d.array[sıralamaÖzelliği, i].özellik}
  {d.array[sıralamaÖzelliği+1, i+1].özellik}
  ```
- Birden fazla sıralama ölçütü için, köşeli parantez içinde özellikleri virgülle ayırın.

#### 2. Örnek: Sayısal Özelliğe Göre Sıralama

##### Veri
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3 },
    { "brand": "Peugeot", "power": 1 },
    { "brand": "BMW",     "power": 2 },
    { "brand": "Lexus",   "power": 1 }
  ]
}
```

##### Şablon
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### Sonuç
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. Örnek: Çoklu Özellik Sıralaması

##### Veri
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3, "sub": { "size": 1 } },
    { "brand": "Aptera",  "power": 1, "sub": { "size": 20 } },
    { "brand": "Peugeot", "power": 1, "sub": { "size": 20 } },
    { "brand": "BMW",     "power": 2, "sub": { "size": 1 } },
    { "brand": "Kia",     "power": 1, "sub": { "size": 10 } }
  ]
}
```

##### Şablon
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### Sonuç
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```

### Filtreleme İşlemi

Filtreleme işlemi, bir döngüdeki veri satırlarını belirli koşullara göre filtrelemek için kullanılır.

#### 1. Söz Dizimi Açıklaması: Sayısal Filtreleme

- Döngü etiketine koşullar ekleyin (örneğin, `age > 19`). Söz dizimi formatı şöyledir:
  ```
  {d.array[i, koşul].özellik}
  ```

#### 2. Örnek: Sayısal Filtreleme

##### Veri
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### Şablon
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### Sonuç
```
People
John
Bob
```

#### 3. Söz Dizimi Açıklaması: Metin Filtreleme

- Metin koşullarını tek tırnak kullanarak belirtin. Örnek format:
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. Örnek: Metin Filtreleme

##### Veri
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### Şablon
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### Sonuç
```
People
Falcon 9
Falcon Heavy
```

#### 5. Söz Dizimi Açıklaması: İlk N Öğeyi Filtreleme

- İlk N öğeyi filtrelemek için döngü indeksi `i`'yi kullanabilirsiniz. Örnek söz dizimi:
  ```
  {d.array[i, i < N].özellik}
  ```

#### 6. Örnek: İlk İki Öğeyi Filtreleme

##### Veri
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Şablon
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### Sonuç
```
People
Falcon 9
Model S
```

#### 7. Söz Dizimi Açıklaması: Son N Öğeyi Hariç Tutma

- Sondan öğeleri temsil etmek için negatif indeksleme `i`'yi kullanın. Örneğin:
  - Son öğeyi almak için `{d.array[i=-1].özellik}`
  - Son öğeyi hariç tutmak için `{d.array[i, i!=-1].özellik}`

#### 8. Örnek: Son Bir ve Son İki Öğeyi Hariç Tutma

##### Veri
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Şablon
```
Son öğe: {d[i=-1].name}

Son öğeyi hariç tutma:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

Son iki öğeyi hariç tutma:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### Sonuç
```
Son öğe: Falcon Heavy

Son öğeyi hariç tutma:
Falcon 9
Model S
Model 3

Son iki öğeyi hariç tutma:
Falcon 9
Model S
```

#### 9. Söz Dizimi Açıklaması: Akıllı Filtreleme

- Akıllı koşul bloklarını kullanarak, karmaşık koşullara göre tüm bir satırı gizleyebilirsiniz. Örnek format:
  ```
  {d.array[i].özellik:ifIN('anahtarKelime'):drop(row)}
  ```

#### 10. Örnek: Akıllı Filtreleme

##### Veri
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Şablon
```
People
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### Sonuç
```
People
Model S
Model 3
```
(Not: Şablonda "Falcon" içeren satırlar, akıllı filtreleme koşulu tarafından kaldırılmıştır.)

### Tekrar Edenleri Kaldırma (Deduplikasyon)

#### 1. Söz Dizimi Açıklaması

- Özel bir yineleyici kullanarak, bir özelliğin değerine göre benzersiz (tekrarlanmayan) öğeler elde edebilirsiniz. Söz dizimi normal bir döngüye benzer, ancak tekrar eden öğeler otomatik olarak göz ardı edilir.

Örnek format:
```
{d.array[özellik].özellik}
{d.array[özellik+1].özellik}
```

#### 2. Örnek: Benzersiz Veri Seçimi

##### Veri
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### Şablon
```
Vehicles
{d[type].brand}
{d[type+1].brand}
```

##### Sonuç
```
Vehicles
Hyundai
Airbus
```