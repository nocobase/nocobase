:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# RelationRepository

`RelationRepository`, ilişki türleri için bir `Repository` nesnesidir. `RelationRepository`, ilişkili veriler üzerinde, ilişkiyi yüklemeye gerek kalmadan işlem yapmanızı sağlar. `RelationRepository` temel alınarak, her ilişki türü için karşılık gelen türetilmiş uygulamalar şunlardır:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Yapıcı Fonksiyon

**İmza**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Parametreler**

| Parametre Adı      | Tip                | Varsayılan Değer | Açıklama                                                  |
| :----------------- | :----------------- | :----- | :-------------------------------------------------------- |
| `sourceCollection` | `Collection`       | -      | İlişkideki referans veren ilişkiye karşılık gelen `Collection` |
| `association`      | `string`           | -      | İlişki adı                                                |
| `sourceKeyValue`   | `string \| number` | -      | Referans veren ilişkideki karşılık gelen anahtar değeri   |

## Temel Sınıf Özellikleri

### `db: Database`

Veritabanı nesnesi

### `sourceCollection`

İlişkideki referans veren ilişkiye karşılık gelen `Collection`

### `targetCollection`

İlişkideki referans verilen ilişkiye karşılık gelen `Collection`

### `association`

Sequelize'deki mevcut ilişkiye karşılık gelen ilişki nesnesi

### `associationField`

Koleksiyondaki mevcut ilişkiye karşılık gelen alan

### `sourceKeyValue`

Referans veren ilişkideki karşılık gelen anahtar değeri