---
pkg: "@nocobase/plugin-field-m2m-array"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Çoktan Çoka (Dizi)

## Giriş

Bu özellik, bir veri **koleksiyonu** içinde dizi alanları kullanarak hedef tablodaki birden fazla benzersiz anahtarı saklamanıza ve böylece iki tablo arasında çoktan çoka bir ilişki kurmanıza olanak tanır. Örneğin, Makaleler ve Etiketler gibi varlıkları ele alalım. Bir makale birden fazla etiketle ilişkilendirilebilir ve makale tablosu, etiketler tablosundaki ilgili kayıtların ID'lerini bir dizi alanında saklar.

:::warning{title=Dikkat}

- Mümkün olduğunca, bu yönteme güvenmek yerine standart bir [çoktan çoka](../data-modeling/collection-fields/associations/m2m/index.md) ilişki kurmak için bir ara **koleksiyon** kullanmanız önerilir.
- Şu anda, dizi alanlarıyla kurulan çoktan çoka ilişkiler için kaynak **koleksiyon** verilerini hedef tablodaki alanları kullanarak filtrelemeyi yalnızca PostgreSQL desteklemektedir. Örneğin, yukarıdaki senaryoda, etiketler tablosundaki başlık gibi diğer alanlara göre makaleleri filtreleyebilirsiniz.

  :::

### Alan Yapılandırması

![many-to-many(array) field configuration](https://static-docs.nocobase.com/202407051108180.png)

## Parametre Açıklamaları

### Kaynak koleksiyon

Mevcut alanın bulunduğu kaynak **koleksiyon**.

### Hedef koleksiyon

İlişkinin kurulduğu hedef **koleksiyon**.

### Yabancı anahtar

Kaynak **koleksiyonunda** hedef tablodaki hedef anahtarı saklayan dizi alanı.

Dizi alanı türleri için karşılık gelen ilişkiler şunlardır:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Hedef anahtar

Kaynak tablonun dizi alanında saklanan değerlere karşılık gelen hedef **koleksiyondaki** alan. Bu alan benzersiz olmalıdır.