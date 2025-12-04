:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Harici Veritabanı

## Giriş

Mevcut harici veritabanlarını veri kaynağı olarak kullanabilirsiniz. Şu anda desteklenen harici veritabanları arasında MySQL, MariaDB, PostgreSQL, MSSQL ve Oracle bulunmaktadır.

## Kullanım Talimatları

### Harici Veritabanı Ekleme

Eklentiyi etkinleştirdikten sonra, veri kaynağı yönetimindeki "Yeni ekle" açılır menüsünden seçerek ekleyebilirsiniz.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Bağlanmak istediğiniz veritabanı bilgilerini doldurun.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Koleksiyon Senkronizasyonu

Harici bir veritabanıyla bağlantı kurulduktan sonra, veri kaynağındaki tüm koleksiyonlar doğrudan okunacaktır. Harici veritabanları, doğrudan koleksiyon eklemeyi veya tablo yapısını değiştirmeyi desteklemez. Eğer değişiklik yapmanız gerekirse, bunları bir veritabanı istemcisi aracılığıyla gerçekleştirebilir ve ardından arayüzdeki "Yenile" düğmesine tıklayarak senkronize edebilirsiniz.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Alanları Yapılandırma

Harici veritabanı, mevcut koleksiyonların alanlarını otomatik olarak okuyacak ve gösterecektir. Alanın başlığını, veri tipini (Field type) ve UI tipini (Field interface) hızlıca görüntüleyebilir ve yapılandırabilirsiniz. Ayrıca, daha fazla yapılandırma yapmak için "Düzenle" düğmesine tıklayabilirsiniz.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Harici veritabanları tablo yapısını değiştirmeyi desteklemediği için, yeni bir alan eklerken seçilebilecek tek tür ilişki alanıdır. İlişki alanları gerçek alanlar değildir; koleksiyonlar arasında bağlantı kurmak için kullanılırlar.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Daha fazla bilgi için [Koleksiyon Alanları/Genel Bakış](/data-sources/data-modeling/collection-fields) bölümüne bakabilirsiniz.

### Alan Tipi Eşleştirme

NocoBase, harici veritabanındaki alan tiplerini otomatik olarak karşılık gelen veri tipine (Field type) ve UI tipine (Field Interface) eşleştirir.

- Veri tipi (Field type): Bir alanın depolayabileceği verinin türünü, formatını ve yapısını tanımlamak için kullanılır;
- UI tipi (Field interface): Kullanıcı arayüzünde alan değerlerini görüntülemek ve girmek için kullanılan kontrol türünü ifade eder.

| PostgreSQL | MySQL/MariaDB | NocoBase Data Type | NocoBase Interface Type |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCLE |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Desteklenmeyen Alan Tipleri

Desteklenmeyen alan tipleri ayrı olarak gösterilir. Bu alanlar, kullanılabilmeleri için geliştirme adaptasyonu gerektirir.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Filtre Hedef Anahtarı

Blok olarak gösterilen koleksiyonların bir Filtre hedef anahtarı (Filter target key) yapılandırılmış olması gerekir. Filtre hedef anahtarı, belirli bir alana göre verileri filtrelemek için kullanılır ve alan değeri benzersiz olmalıdır. Varsayılan olarak, filtre hedef anahtarı koleksiyonun birincil anahtar alanıdır. Görünümler, birincil anahtarı olmayan koleksiyonlar veya bileşik birincil anahtara sahip koleksiyonlar için özel bir filtre hedef anahtarı tanımlamanız gerekir.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Yalnızca filtre hedef anahtarı yapılandırılmış koleksiyonlar sayfaya eklenebilir.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)