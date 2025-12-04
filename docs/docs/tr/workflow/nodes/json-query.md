---
pkg: '@nocobase/plugin-workflow-json-query'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# JSON Hesaplama

## Giriş

Farklı JSON hesaplama motorlarını kullanarak, yukarı akış düğümleri tarafından üretilen karmaşık JSON verilerini hesaplar veya yapısını dönüştürür, böylece sonraki düğümler bunları kullanabilir. Örneğin, SQL işlemi ve HTTP isteği düğümlerinin sonuçlarını, bu düğüm aracılığıyla gerekli değerlere ve değişken formatlarına dönüştürebilirsiniz, böylece sonraki düğümler bunları kullanabilir.

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, süreçteki artı ("+") düğmesine tıklayarak bir "JSON Hesaplama" düğümü ekleyebilirsiniz:

![Düğüm Oluşturma](https://static-docs.nocobase.com/7de76517539ad9dfc88b7160f1d0dd7.png)

:::info{title=İpucu}
Genellikle, JSON Hesaplama düğümü, diğer veri düğümlerinin altına oluşturulur, böylece bu verileri ayrıştırabilirsiniz.
:::

## Düğüm Yapılandırması

### Ayrıştırma Motoru

JSON Hesaplama düğümü, farklı ayrıştırma motorları aracılığıyla çeşitli söz dizimlerini destekler. Tercihlerinize ve her motorun özelliklerine göre seçim yapabilirsiniz. Şu anda üç ayrıştırma motoru desteklenmektedir:

- [JMESPath](https://jmespath.org/)
- [JSONPath Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
- [JSONata](https://jsonata.org/)

![Motor Seçimi](https://static-docs.nocobase.com/29be3b92a62b7d20312d1673e749f2ec.png)

### Veri Kaynağı

Veri kaynağı, yukarı akış düğümünün sonucu veya iş akışı bağlamındaki bir veri nesnesi olabilir. Genellikle, SQL düğümünün sonucu veya bir HTTP isteği düğümünün sonucu gibi, yerleşik bir yapıya sahip olmayan bir veri nesnesidir.

![Veri Kaynağı](https://static-docs.nocobase.com/f5a97e20693b3d30b3a994a576aa282d.png)

:::info{title=İpucu}
Genellikle, koleksiyon (collection) ile ilgili düğümlerin veri nesneleri, koleksiyon yapılandırma bilgileri aracılığıyla zaten yapılandırılmıştır ve bu nedenle JSON Hesaplama düğümü aracılığıyla ayrıştırılmaları genellikle gerekmez.
:::

### Ayrıştırma İfadesi

Ayrıştırma gereksinimlerinize ve seçtiğiniz ayrıştırma motoruna göre özel ayrıştırma ifadeleri tanımlayabilirsiniz.

![Ayrıştırma İfadesi](https://static-docs.nocobase.com/181abd162fd32c09b62f6aa1d1cb3ed4.png)

:::info{title=İpucu}
Farklı motorlar farklı ayrıştırma söz dizimleri sunar. Ayrıntılar için lütfen bağlantılardaki belgelere bakınız.
:::

`v1.0.0-alpha.15` sürümünden itibaren, ifadeler değişken kullanımını desteklemektedir. Değişkenler, belirli motor yürütülmeden önce önceden ayrıştırılır; dize şablonu kurallarına göre değişkenler belirli dize değerleriyle değiştirilir ve ifadedeki diğer statik dizelerle birleştirilerek nihai ifade oluşturulur. Bu özellik, örneğin bazı JSON içeriklerinin dinamik anahtarlar aracılığıyla ayrıştırılması gerektiğinde olduğu gibi, ifadeleri dinamik olarak oluşturmanız gerektiğinde çok kullanışlıdır.

### Özellik Eşleme

Hesaplama sonucu bir nesne (veya nesne dizisi) olduğunda, gerekli özellikleri özellik eşleme aracılığıyla alt değişkenlere eşleyerek sonraki düğümlerin kullanımına sunabilirsiniz.

![Özellik Eşleme](https://static-docs.nocobase.com/b876abe4ccf6b4709eb8748f21ef3527.png)

:::info{title=İpucu}
Bir nesne (veya nesne dizisi) sonucu için, özellik eşlemesi yapılmazsa, tüm nesne (veya nesne dizisi) düğümün sonucunda tek bir değişken olarak kaydedilir ve nesnenin özellik değerleri doğrudan değişken olarak kullanılamaz.
:::

## Örnek

Ayrıştırılması gereken verilerin, önceden çalıştırılmış bir SQL düğümünden geldiğini ve bu düğümün bir dizi sipariş verisi döndürdüğünü varsayalım:

```json
[
  {
    "id": 1,
    "products": [
      {
        "id": 1,
        "title": "Product 1",
        "price": 100,
        "quantity": 1
      },
      {
        "id": 2,
        "title": "Product 2",
        "price": 120,
        "quantity": 2
      }
    ]
  },
  {
    "id": 2,
    "products": [
      {
        "id": 3,
        "title": "Product 3",
        "price": 130,
        "quantity": 1
      },
      {
        "id": 4,
        "title": "Product 4",
        "price": 140,
        "quantity": 2
      }
    ]
  }
]
```

Verideki iki siparişin ayrı ayrı toplam fiyatını ayrıştırmamız ve hesaplamamız, ardından bunları ilgili sipariş kimlikleriyle bir nesne halinde birleştirerek siparişin toplam fiyatını güncellememiz gerekirse, aşağıdaki gibi yapılandırabiliriz:

![Örnek - SQL Yapılandırmasını Ayrıştırma](https://static-docs.nocobase.com/e62322a868b26ff98120bfcd6dcdb3bd.png)

1. JSONata ayrıştırma motorunu seçin;
2. SQL düğümünün sonucunu veri kaynağı olarak seçin;
3. `$[0].{"id": id, "total": products.(price * quantity)}` JSONata ifadesini kullanarak ayrıştırın;
4. Özellik eşlemeyi seçerek `id` ve `total` değerlerini alt değişkenlere eşleyin;

Nihai ayrıştırma sonucu aşağıdaki gibidir:

```json
[
  {
    "id": 1,
    "total": 340
  },
  {
    "id": 2,
    "total": 410
  }
]
```

Daha sonra, elde edilen sipariş dizisini döngüye alarak siparişlerin toplam fiyatını güncelleyebilirsiniz.

![İlgili Siparişin Toplam Fiyatını Güncelleme](https://static-docs.nocobase.com/b3329b0efe4471f5eed1f0673bef740e.png)