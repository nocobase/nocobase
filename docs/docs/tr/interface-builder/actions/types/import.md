---
pkg: "@nocobase/plugin-action-import"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# İçe Aktarma

## Giriş

Verilerinizi bir Excel şablonu kullanarak içe aktarabilirsiniz. Hangi alanların içe aktarılacağını yapılandırabilir ve şablonu otomatik olarak oluşturabilirsiniz.

![20251029165818](https://static-docs.nocobase.com/20251029165818.png)

## İçe Aktarma Talimatları

### Sayı Tipi Alanlar

Sayıları ve yüzdeleri destekler. `N/A` veya `-` gibi ifadeler filtrelenir.

| Number1 | Percentage | Number2 | Number3 |
| ------- | ---------- | ------- | ------- |
| 123     | 25%        | N/A     | -       |

JSON'a dönüştürüldükten sonra:

```ts
{
  "Number1": 123,
  "Percentage": 0.25,
  "Number2": null,
  "Number3": null
}
```

### Boole Tipi Alanlar

Desteklenen giriş metinleri (İngilizce'de büyük/küçük harf ayrımı yapmaz):

- `Yes`, `Y`, `True`, `1`, `是`
- `No`, `N`, `False`, `0`, `否`

| Field1 | Field2 | Field3 | Field4 | Field5 |
| ------ | ------ | ------ | ------ | ------ |
| No     | Yes    | Y      | true   | 0      |

JSON'a dönüştürüldükten sonra:

```ts
{
  "Field1": false,
  "Field2": true,
  "Field3": true,
  "Field4": true,
  "Field5": false
}
```

### Tarih Tipi Alanlar

| DateOnly            | Local(+08:00)       | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

JSON'a dönüştürüldükten sonra:

```ts
{
  "DateOnly": "2023-01-18T00:00:00.000Z",
  "Local(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z"
}
```

### Seçim Tipi Alanlar

Hem seçenek değerleri hem de seçenek etiketleri içe aktarma metni olarak kullanılabilir. Birden fazla seçenek virgül (`,` `，`) veya sıralama virgülü (`、`) ile ayrılır.

Örneğin, `Öncelik` alanı için seçenekler şunları içerir:

| Seçenek Değeri | Seçenek Etiketi |
| -------------- | --------------- |
| low            | Low             |
| medium         | Medium          |
| high           | High            |

Hem seçenek değerleri hem de seçenek etiketleri içe aktarma metni olarak kullanılabilir.

| Öncelik |
| -------- |
| High     |
| low      |

JSON'a dönüştürüldükten sonra:

```ts
[{ "Priority": "high" }, { "Priority": "low" }]
```

### Çin İdari Bölge Alanları

| Bölge1        | Bölge2        |
| ------------- | ------------- |
| 北京市/市辖区 | 天津市/市辖区 |

JSON'a dönüştürüldükten sonra:

```ts
{
  "Region1": ["11", "1101"],
  "Region2": ["12", "1201"]
}
```

### Ek Alanları

| Ek                                       |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

JSON'a dönüştürüldükten sonra:

```ts
{
  "Attachment": [
    {
      "filename": "logo.png",
      "title": "logo.png",
      "extname": ".png",
      "url": "https://www.nocobase.com/images/logo.png"
    }
  ]
}
```

### İlişki Tipi Alanlar

Birden fazla veri girişi virgül (`,` `，`) veya sıralama virgülü (`、`) ile ayrılır.

| Departman/Ad     | Kategori/Başlık      |
| ---------------- | -------------------- |
| Geliştirme Ekibi | Kategori1, Kategori2 |

JSON'a dönüştürüldükten sonra:

```ts
{
  "Department": [1], // 1, "Geliştirme Ekibi" adlı departmanın kayıt kimliğidir
  "Category": [1, 2] // 1,2, "Kategori1" ve "Kategori2" başlıklı kategorilerin kayıt kimlikleridir
}
```

### JSON Tipi Alanlar

| JSON1           |
| --------------- |
| {"key":"value"} |

JSON'a dönüştürüldükten sonra:

```ts
{
  "JSON": { "key": "value" }
}
```

### Harita Geometri Tipleri

| Point | Line        | Polygon           | Circle |
| ----- | ----------- | ----------------- | ------ |
| 1,2   | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3  |

JSON'a dönüştürüldükten sonra:

```ts
{
  "Point": [1, 2],
  "Line": [[1, 2], [3, 4]],
  "Polygon": [[1, 2], [3, 4], [1, 2]],
  "Circle": [1, 2, 3]
}
```

## Özel İçe Aktarma Formatı

`db.registerFieldValueParsers()` yöntemi aracılığıyla özel bir `ValueParser` kaydedebilirsiniz, örneğin:

```ts
import { BaseValueParser } from '@nocobase/database';

class PointValueParser extends BaseValueParser {
  async setValue(value) {
    if (Array.isArray(value)) {
      this.value = value;
    } else if (typeof value === 'string') {
      this.value = value.split(',');
    } else {
      this.errors.push('Value invalid');
    }
  }
}

const db = new Database();

// type=point alanları içe aktarılırken, veriler PointValueParser tarafından ayrıştırılır.
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

İçe Aktarma Örneği

| Point |
| ----- |
| 1,2   |

JSON'a dönüştürüldükten sonra:

```ts
{
  "Point": [1, 2]
}
```

## Eylem Ayarları

![20251029170959](https://static-docs.nocobase.com/20251029170959.png)

- İçe aktarılabilir alanları yapılandırın

![20251029171036](https://static-docs.nocobase.com/20251029171036.png)

- [Bağlantı Kuralları](/interface-builder/actions/action-settings/linkage-rule): Düğmeyi dinamik olarak gösterin/gizleyin;
- [Düğmeyi Düzenle](/interface-builder/actions/action-settings/edit-button): Düğmenin başlığını, tipini ve simgesini düzenleyin;