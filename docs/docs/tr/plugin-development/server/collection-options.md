:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


## Koleksiyon Yapılandırma Parametreleri

```ts
export type MigrationRule =
  | 'overwrite'
  | 'skip'
  | 'upsert'
  | 'schema-only'
  | 'insert-ignore';

export interface CollectionOptions {
  name: string;
  title?: string;
  migrationRules?: MigrationRule[];
  inherits?: string[] | string;
  filterTargetKey?: string | string[];
  fields?: FieldOptions[];
  model?: string | ModelStatic<Model>;
  repository?: string | RepositoryType;
  autoGenId?: boolean;
  timestamps?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
  deletedAt?: boolean;
  paranoid?: boolean;
  underscored?: boolean;
  indexes?: ModelIndexesOptions[];
}
```

### `name` - Koleksiyon Adı
- **Tip**: `string`
- **Zorunlu**: ✅
- **Açıklama**: Koleksiyon için benzersiz tanımlayıcıdır ve uygulama genelinde benzersiz olmalıdır.
- **Örnek**:
```typescript
{
  name: 'users'  // Kullanıcı koleksiyonu
}
```

### `title` - Koleksiyon Başlığı
- **Tip**: `string`
- **Zorunlu**: ❌
- **Açıklama**: Koleksiyonun görüntüleme başlığıdır, ön uç arayüzünde gösterilir.
- **Örnek**:
```typescript
{
  name: 'users',
  title: 'Kullanıcı Yönetimi'  // Arayüzde "Kullanıcı Yönetimi" olarak görünür
}
```

### `migrationRules` - Taşıma Kuralları
- **Tip**: `MigrationRule[]`
- **Zorunlu**: ❌
- **Açıklama**: Veri taşıması sırasında uygulanacak işleme kurallarıdır.
- **Örnek**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Mevcut verilerin üzerine yazar
  fields: [...]
}
```

### `inherits` - Koleksiyonları Devralma
- **Tip**: `string[] | string`
- **Zorunlu**: ❌
- **Açıklama**: Diğer koleksiyonlardan alan tanımlarını devralır. Tek veya çoklu koleksiyon devralmayı destekler.
- **Örnek**:

```typescript
// Tekli devralma
{
  name: 'admin_users',
  inherits: 'users',  // 'users' koleksiyonundaki tüm alanları devralır
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// Çoklu devralma
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // Birden fazla koleksiyondan devralır
  fields: [...]
}
```

### `filterTargetKey` - Hedef Anahtarı Filtreleme
- **Tip**: `string | string[]`
- **Zorunlu**: ❌
- **Açıklama**: Sorguları filtrelemek için kullanılan hedef anahtardır. Tek veya çoklu anahtarları destekler.
- **Örnek**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Kullanıcı ID'sine göre filtrele
  fields: [...]
}

// Çoklu filtre anahtarları
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Kullanıcı ID'si ve kategori ID'sine göre filtrele
  fields: [...]
}
```

### `fields` - Alan Tanımları
- **Tip**: `FieldOptions[]`
- **Zorunlu**: ❌
- **Varsayılan Değer**: `[]`
- **Açıklama**: Koleksiyon için alan tanımlarının bir dizisidir. Her alan tip, ad ve yapılandırma gibi bilgileri içerir.
- **Örnek**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Kullanıcı Adı'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'E-posta'
    },
    {
      type: 'password',
      name: 'password',
      title: 'Parola'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'Oluşturulma Tarihi'
    }
  ]
}
```

### `model` - Özel Model
- **Tip**: `string | ModelStatic<Model>`
- **Zorunlu**: ❌
- **Açıklama**: Özel bir Sequelize model sınıfı belirtir; sınıf adı veya model sınıfının kendisi olabilir.
- **Örnek**:
```typescript
// Model sınıfı adını string olarak belirtin
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Model sınıfını kullanın
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Özel Depo
- **Tip**: `string | RepositoryType`
- **Zorunlu**: ❌
- **Açıklama**: Veri erişim mantığını işlemek için özel bir depo sınıfı belirtir.
- **Örnek**:
```typescript
// Depo sınıfı adını string olarak belirtin
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Depo sınıfını kullanın
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - ID'yi Otomatik Oluştur
- **Tip**: `boolean`
- **Zorunlu**: ❌
- **Varsayılan Değer**: `true`
- **Açıklama**: Birincil anahtar ID'sinin otomatik olarak oluşturulup oluşturulmayacağını belirler.
- **Örnek**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Birincil anahtar ID'sini otomatik olarak oluştur
  fields: [...]
}

// ID'nin otomatik oluşturulmasını devre dışı bırakın (birincil anahtarın manuel olarak belirtilmesi gerekir)
{
  name: 'external_data',
  autoGenId: false,
fields: [
  {
    type: 'string',
      name: 'id',
      primaryKey: true
    }
  ]
}
```

### `timestamps` - Zaman Damgalarını Etkinleştir
- **Tip**: `boolean`
- **Zorunlu**: ❌
- **Varsayılan Değer**: `true`
- **Açıklama**: `createdAt` ve `updatedAt` alanlarının etkinleştirilip etkinleştirilmeyeceğini belirler.
- **Örnek**:
```typescript
{
  name: 'users',
  timestamps: true,  // Zaman damgalarını etkinleştir
  fields: [...]
}
```

### `createdAt` - Oluşturulma Tarihi Alanı
- **Tip**: `boolean | string`
- **Zorunlu**: ❌
- **Varsayılan Değer**: `true`
- **Açıklama**: `createdAt` alanı için yapılandırma.
- **Örnek**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // createdAt alanı için özel ad
  fields: [...]
}
```

### `updatedAt` - Güncelleme Tarihi Alanı
- **Tip**: `boolean | string`
- **Zorunlu**: ❌
- **Varsayılan Değer**: `true`
- **Açıklama**: `updatedAt` alanı için yapılandırma.
- **Örnek**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // updatedAt alanı için özel ad
  fields: [...]
}
```

### `deletedAt` - Yumuşak Silme Alanı
- **Tip**: `boolean | string`
- **Zorunlu**: ❌
- **Varsayılan Değer**: `false`
- **Açıklama**: Yumuşak silme alanı için yapılandırma.
- **Örnek**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Yumuşak silmeyi etkinleştir
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Yumuşak Silme Modu
- **Tip**: `boolean`
- **Zorunlu**: ❌
- **Varsayılan Değer**: `false`
- **Açıklama**: Yumuşak silme modunun etkinleştirilip etkinleştirilmeyeceğini belirler.
- **Örnek**:
```typescript
{
  name: 'users',
  paranoid: true,  // Yumuşak silmeyi etkinleştir
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Alt Çizgi Adlandırma
- **Tip**: `boolean`
- **Zorunlu**: ❌
- **Varsayılan Değer**: `false`
- **Açıklama**: Alt çizgi adlandırma stilinin kullanılıp kullanılmayacağını belirler.
- **Örnek**:
```typescript
{
  name: 'users',
  underscored: true,  // Alt çizgi adlandırma stilini kullan
  fields: [...]
}
```

### `indexes` - Dizin Yapılandırması
- **Tip**: `ModelIndexesOptions[]`
- **Zorunlu**: ❌
- **Açıklama**: Veritabanı dizin yapılandırması.
- **Örnek**:
```typescript
{
  name: 'users',
  indexes: [
    {
      fields: ['email'],
      unique: true
    },
    {
      fields: ['username', 'status']
    }
  ],
  fields: [...]
}
```

## Alan Parametreleri Yapılandırması

NocoBase, birden çok alan tipini destekler ve tüm alanlar `FieldOptions` birleşim tipine göre tanımlanır. Alan yapılandırması; temel özellikleri, veri tipine özgü özellikleri, ilişki özelliklerini ve ön uç render özelliklerini içerir.

### Temel Alan Seçenekleri

Tüm alan tipleri `BaseFieldOptions`'tan devralır ve ortak alan yapılandırma yetenekleri sunar:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Ortak parametreler
  name?: string;                    // Alan adı
  hidden?: boolean;                 // Gizli mi
  validation?: ValidationOptions<T>; // Doğrulama kuralları

  // Sık kullanılan sütun alanı özellikleri
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Ön uç ile ilgili
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**Örnek**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // Boş değerlere izin verme
  unique: true,           // Benzersiz kısıtlama
  defaultValue: '',       // Varsayılan olarak boş string
  index: true,            // Dizin oluştur
  comment: 'Kullanıcı giriş adı'    // Veritabanı yorumu
}
```

### `name` - Alan Adı

- **Tip**: `string`
- **Zorunlu**: ❌
- **Açıklama**: Alanın veritabanındaki sütun adıdır ve koleksiyon içinde benzersiz olmalıdır.
- **Örnek**:
```typescript
{
  type: 'string',
  name: 'username',  // Alan adı
  title: 'Kullanıcı Adı'
}
```

### `hidden` - Gizli Alan

- **Tip**: `boolean`
- **Varsayılan Değer**: `false`
- **Açıklama**: Bu alanın varsayılan olarak listelerde/formlarda gizlenip gizlenmeyeceğini belirler.
- **Örnek**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Dahili ID alanını gizle
  title: 'Dahili ID'
}
```

### `validation` - Doğrulama Kuralları

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Doğrulama tipi
  rules: FieldValidationRule<T>[];  // Doğrulama kuralları dizisi
  [key: string]: any;              // Diğer doğrulama seçenekleri
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Kural anahtarı
  name: FieldValidationRuleName<T>; // Kural adı
  args?: {                         // Kural argümanları
    [key: string]: any;
  };
  paramsType?: 'object';           // Parametre tipi
}
```

- **Tip**: `ValidationOptions<T>`
- **Açıklama**: Sunucu tarafı doğrulama kurallarını Joi kullanarak tanımlar.
- **Örnek**:
```typescript
{
  type: 'string',
  name: 'email',
  validation: {
    type: 'string',
    rules: [
      { key: 'email', name: 'email' },
      { key: 'required', name: 'required' }
    ]
  }
}
```

### `allowNull` - Boş Değerlere İzin Ver

- **Tip**: `boolean`
- **Varsayılan Değer**: `true`
- **Açıklama**: Veritabanının `NULL` değerleri yazmaya izin verip vermediğini kontrol eder.
- **Örnek**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Boş değerlere izin verme
  title: 'Kullanıcı Adı'
}
```

### `defaultValue` - Varsayılan Değer

- **Tip**: `any`
- **Açıklama**: Alan için varsayılan değerdir; bir kayıt oluşturulurken bu alan için bir değer sağlanmadığında kullanılır.
- **Örnek**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // Varsayılan olarak taslak durumu
  title: 'Durum'
}
```

### `unique` - Benzersiz Kısıtlama

- **Tip**: `boolean | string`
- **Varsayılan Değer**: `false`
- **Açıklama**: Değerin benzersiz olup olmadığını belirler. String bir kısıtlama adı belirtmek için kullanılabilir.
- **Örnek**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // E-posta benzersiz olmalıdır
  title: 'E-posta'
}
```

### `primaryKey` - Birincil Anahtar

- **Tip**: `boolean`
- **Varsayılan Değer**: `false`
- **Açıklama**: Bu alanı birincil anahtar olarak tanımlar.
- **Örnek**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Birincil anahtar olarak ayarla
  autoIncrement: true
}
```

### `autoIncrement` - Otomatik Artırma

- **Tip**: `boolean`
- **Varsayılan Değer**: `false`
- **Açıklama**: Otomatik artırmayı etkinleştirir (yalnızca sayısal alanlar için geçerlidir).
- **Örnek**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Otomatik artır
  primaryKey: true
}
```

### `field` - Veritabanı Sütun Adı

- **Tip**: `string`
- **Açıklama**: Gerçek veritabanı sütun adını belirtir (Sequelize'ın `field`'ı ile uyumludur).
- **Örnek**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Veritabanındaki sütun adı
  title: 'Kullanıcı ID\'si'
}
```

### `comment` - Veritabanı Yorumu

- **Tip**: `string`
- **Açıklama**: Veritabanı alanı için bir yorumdur, dokümantasyon amaçlı kullanılır.
- **Örnek**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'Kullanıcı giriş adı, sistem girişi için kullanılır',  // Veritabanı yorumu
  title: 'Kullanıcı Adı'
}
```

### `title` - Görüntüleme Başlığı

- **Tip**: `string`
- **Açıklama**: Alan için görüntüleme başlığıdır, genellikle ön uç arayüzünde kullanılır.
- **Örnek**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Kullanıcı Adı',  // Ön uçta görüntülenen başlık
  allowNull: false
}
```

### `description` - Alan Açıklaması

- **Tip**: `string`
- **Açıklama**: Alan hakkında açıklayıcı bilgidir, kullanıcıların alanın amacını anlamalarına yardımcı olmak için kullanılır.
- **Örnek**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'E-posta',
  description: 'Lütfen geçerli bir e-posta adresi girin',  // Alan açıklaması
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Arayüz Bileşeni

- **Tip**: `string`
- **Açıklama**: Alan için önerilen ön uç arayüz bileşenidir.
- **Örnek**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'İçerik',
  interface: 'textarea',  // Metin alanı bileşenini kullanılması önerilir
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Alan Tipi Arayüzleri

### `type: 'string'` - String Alanı

- **Açıklama**: Kısa metin verilerini depolamak için kullanılır. Uzunluk sınırlamalarını ve otomatik boşluk kırpmayı destekler.
- **Veritabanı Tipi**: `VARCHAR`
- **Özel Özellikler**:
  - `length`: String uzunluk sınırı
  - `trim`: Başındaki ve sonundaki boşlukları otomatik olarak kaldırıp kaldırmayacağı

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // String uzunluk sınırı
  trim?: boolean;     // Başındaki ve sonundaki boşlukları otomatik olarak kaldırıp kaldırmayacağı
}
```

**Örnek**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Kullanıcı Adı',
  length: 50,           // Maksimum 50 karakter
  trim: true,           // Boşlukları otomatik olarak kaldır
    allowNull: false,
    unique: true,
    validation: {
      type: 'string',
      rules: [
        { key: 'min', name: 'min', args: { limit: 3 } },
      { key: 'max', name: 'max', args: { limit: 20 } }
    ]
  }
}
```

### `type: 'text'` - Metin Alanı

- **Açıklama**: Uzun metin verilerini depolamak için kullanılır. MySQL'deki farklı uzunluktaki metin tiplerini destekler.
- **Veritabanı Tipi**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Özel Özellikler**:
  - `length`: MySQL metin uzunluk tipi (tiny/medium/long)

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // MySQL metin uzunluk tipi
}
```

**Örnek**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'İçerik',
  length: 'medium',     // MEDIUMTEXT kullan
  allowNull: true
}
```

### Sayısal Tipler

### `type: 'integer'` - Tam Sayı Alanı

- **Açıklama**: Tam sayı verilerini depolamak için kullanılır. Otomatik artırma ve birincil anahtarı destekler.
- **Veritabanı Tipi**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Sequelize INTEGER tipinin tüm seçeneklerini devralır
}
```

**Örnek**:
```typescript
  {
    type: 'integer',
  name: 'id',
  title: 'ID',
  primaryKey: true,
  autoIncrement: true,
  allowNull: false
}
```

### `type: 'bigInt'` - Büyük Tam Sayı Alanı

- **Açıklama**: Büyük tam sayı verilerini depolamak için kullanılır, integer'dan daha geniş bir aralığa sahiptir.
- **Veritabanı Tipi**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**Örnek**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'Kullanıcı ID\'si',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Ondalık Sayı Alanı

- **Açıklama**: Tek hassasiyetli ondalık sayıları depolamak için kullanılır.
- **Veritabanı Tipi**: `FLOAT`
- **Özel Özellikler**:
  - `precision`: Hassasiyet (toplam basamak sayısı)
  - `scale`: Ondalık basamak sayısı

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Hassasiyet
  scale?: number;      // Ondalık basamak sayısı
}
```

**Örnek**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'Puan',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - Çift Hassasiyetli Ondalık Sayı Alanı

- **Açıklama**: Çift hassasiyetli ondalık sayıları depolamak için kullanılır, float'tan daha yüksek hassasiyete sahiptir.
- **Veritabanı Tipi**: `DOUBLE`
- **Özel Özellikler**:
  - `precision`: Hassasiyet (toplam basamak sayısı)
  - `scale`: Ondalık basamak sayısı

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**Örnek**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'Fiyat',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - Gerçek Sayı Alanı

- **Açıklama**: Gerçek sayıları depolamak için kullanılır; veritabanına bağımlıdır.
- **Veritabanı Tipi**: `REAL`
- **Özel Özellikler**:
  - `precision`: Hassasiyet (toplam basamak sayısı)
  - `scale`: Ondalık basamak sayısı

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**Örnek**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'Kur',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - Ondalık Alan

- **Açıklama**: Kesin ondalık sayıları depolamak için kullanılır, finansal hesaplamalar için uygundur.
- **Veritabanı Tipi**: `DECIMAL`
- **Özel Özellikler**:
  - `precision`: Hassasiyet (toplam basamak sayısı)
  - `scale`: Ondalık basamak sayısı

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Hassasiyet (toplam basamak sayısı)
  scale?: number;      // Ondalık basamak sayısı
}
```

**Örnek**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'Miktar',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00,
  validation: {
    type: 'number',
    rules: [
      { key: 'min', name: 'min', args: { limit: 0 } }
    ]
  }
}
```

### Boolean Tipleri

### `type: 'boolean'` - Boolean Alanı

- **Açıklama**: Doğru/yanlış değerleri depolamak için kullanılır, genellikle açma/kapama durumları için tercih edilir.
- **Veritabanı Tipi**: `BOOLEAN` veya `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**Örnek**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'Aktif mi',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Radyo Alanı

- **Açıklama**: Tek seçili bir değeri depolamak için kullanılır, genellikle ikili seçimler için tercih edilir.
- **Veritabanı Tipi**: `BOOLEAN` veya `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**Örnek**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'Varsayılan mı',
  defaultValue: false,
  allowNull: false
}
```

### Tarih ve Saat Tipleri

### `type: 'date'` - Tarih Alanı

- **Açıklama**: Tarih verilerini depolamak için kullanılır, saat bilgisi içermez.
- **Veritabanı Tipi**: `DATE`
- **Özel Özellikler**:
  - `timezone`: Zaman dilimi bilgisini içerip içermediği

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Zaman dilimi bilgisini içerip içermediği
}
```

**Örnek**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'Doğum Tarihi',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - Saat Alanı

- **Açıklama**: Saat verilerini depolamak için kullanılır, tarih bilgisi içermez.
- **Veritabanı Tipi**: `TIME`
- **Özel Özellikler**:
  - `timezone`: Zaman dilimi bilgisini içerip içermediği

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**Örnek**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'Başlangıç Saati',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - Zaman Dilimli Tarih Saat Alanı

- **Açıklama**: Zaman dilimi bilgisi içeren tarih ve saat verilerini depolamak için kullanılır.
- **Veritabanı Tipi**: `TIMESTAMP WITH TIME ZONE`
- **Özel Özellikler**:
  - `timezone`: Zaman dilimi bilgisini içerip içermediği

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**Örnek**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'Oluşturulma Tarihi',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - Zaman Dilimsiz Tarih Saat Alanı

- **Açıklama**: Zaman dilimi bilgisi içermeyen tarih ve saat verilerini depolamak için kullanılır.
- **Veritabanı Tipi**: `TIMESTAMP` veya `DATETIME`
- **Özel Özellikler**:
  - `timezone`: Zaman dilimi bilgisini içerip içermediği

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**Örnek**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'Güncelleme Tarihi',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Yalnızca Tarih Alanı

- **Açıklama**: Yalnızca tarihi içeren verileri depolamak için kullanılır, saat bilgisi içermez.
- **Veritabanı Tipi**: `DATE`
- **Örnek**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Yayın Tarihi',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Unix Zaman Damgası Alanı

- **Açıklama**: Unix zaman damgası verilerini depolamak için kullanılır.
- **Veritabanı Tipi**: `BIGINT`
- **Özel Özellikler**:
  - `epoch`: Dönem zamanı

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Dönem zamanı
}
```

**Örnek**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'Son Giriş Zamanı',
  allowNull: true,
  epoch: 0
}
```

### JSON Tipleri

### `type: 'json'` - JSON Alanı

- **Açıklama**: JSON formatındaki verileri depolamak için kullanılır, karmaşık veri yapılarını destekler.
- **Veritabanı Tipi**: `JSON` veya `TEXT`
- **Örnek**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Meta Veri',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - JSONB Alanı

- **Açıklama**: JSONB formatındaki verileri depolamak için kullanılır (PostgreSQL'e özgü), dizinlemeyi ve sorgulamayı destekler.
- **Veritabanı Tipi**: `JSONB` (PostgreSQL)
- **Örnek**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Yapılandırma',
  allowNull: true,
  defaultValue: {}
}
```

### Dizi Tipleri

### `type: 'array'` - Dizi Alanı

- **Açıklama**: Dizi verilerini depolamak için kullanılır, çeşitli eleman tiplerini destekler.
- **Veritabanı Tipi**: `JSON` veya `ARRAY`
- **Özel Özellikler**:
  - `dataType`: Depolama tipi (json/array)
  - `elementType`: Eleman tipi (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Depolama tipi
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Eleman tipi
}
```

**Örnek**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'Etiketler',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - Küme Alanı

- **Açıklama**: Küme verilerini depolamak için kullanılır; diziye benzer ancak benzersizlik kısıtlamasına sahiptir.
- **Veritabanı Tipi**: `JSON` veya `ARRAY`
- **Özel Özellikler**:
  - `dataType`: Depolama tipi (json/array)
  - `elementType`: Eleman tipi (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**Örnek**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'Kategoriler',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### Tanımlayıcı Tipleri

### `type: 'uuid'` - UUID Alanı

- **Açıklama**: UUID formatında benzersiz tanımlayıcıları depolamak için kullanılır.
- **Veritabanı Tipi**: `UUID` veya `VARCHAR(36)`
- **Özel Özellikler**:
  - `autoFill`: Otomatik doldurma

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Otomatik doldurma
}
```

**Örnek**:
```typescript
{
  type: 'uuid',
  name: 'id',
  title: 'ID',
  autoFill: true,
  allowNull: false,
  primaryKey: true
}
```

### `type: 'nanoid'` - Nanoid Alanı

- **Açıklama**: Nanoid formatında kısa, benzersiz tanımlayıcıları depolamak için kullanılır.
- **Veritabanı Tipi**: `VARCHAR`
- **Özel Özellikler**:
  - `size`: ID uzunluğu
  - `customAlphabet`: Özel karakter seti
  - `autoFill`: Otomatik doldurma

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // ID uzunluğu
  customAlphabet?: string;  // Özel karakter seti
  autoFill?: boolean;
}
```

**Örnek**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'Kısa ID',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Özel UID Alanı

- **Açıklama**: Özel formatta benzersiz tanımlayıcıları depolamak için kullanılır.
- **Veritabanı Tipi**: `VARCHAR`
- **Özel Özellikler**:
  - `prefix`: Önek
  - `pattern`: Doğrulama deseni

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Önek
  pattern?: string; // Doğrulama deseni
}
```

**Örnek**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: 'Kod',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - Snowflake ID Alanı

- **Açıklama**: Snowflake algoritması tarafından oluşturulan benzersiz tanımlayıcıları depolamak için kullanılır.
- **Veritabanı Tipi**: `BIGINT`
- **Örnek**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'Snowflake ID',
  allowNull: false,
  unique: true
}
```

### Fonksiyonel Alanlar

### `type: 'password'` - Parola Alanı

- **Açıklama**: Şifrelenmiş parola verilerini depolamak için kullanılır.
- **Veritabanı Tipi**: `VARCHAR`
- **Özel Özellikler**:
  - `length`: Hash uzunluğu
  - `randomBytesSize`: Rastgele bayt boyutu

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Hash uzunluğu
  randomBytesSize?: number;  // Rastgele bayt boyutu
}
```

**Örnek**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'Parola',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - Şifreleme Alanı

- **Açıklama**: Şifrelenmiş hassas verileri depolamak için kullanılır.
- **Veritabanı Tipi**: `VARCHAR`
- **Örnek**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Gizli Anahtar',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Sanal Alan

- **Açıklama**: Hesaplanmış sanal verileri depolamak için kullanılır, veritabanında depolanmaz.
- **Veritabanı Tipi**: Yok (sanal alan)
- **Örnek**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Tam Ad'
}
```

### `type: 'context'` - Bağlam Alanı

- **Açıklama**: Çalışma zamanı bağlamından veri okumak için kullanılır (örneğin, mevcut kullanıcı bilgileri).
- **Veritabanı Tipi**: `dataType`'a göre belirlenir
- **Özel Özellikler**:
  - `dataIndex`: Veri dizin yolu
  - `dataType`: Veri tipi
  - `createOnly`: Yalnızca oluşturma sırasında ayarlanır

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Veri dizin yolu
  dataType?: string;   // Veri tipi
  createOnly?: boolean; // Yalnızca oluşturma sırasında ayarlanır
}
```

**Örnek**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'Mevcut Kullanıcı ID\'si',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### İlişki Alanları

### `type: 'belongsTo'` - Ait Olma İlişkisi

- **Açıklama**: Çoktan-bire bir ilişkiyi temsil eder; mevcut kaydın başka bir kayda ait olduğunu belirtir.
- **Veritabanı Tipi**: Yabancı anahtar alanı
- **Özel Özellikler**:
  - `target`: Hedef koleksiyon adı
  - `foreignKey`: Yabancı anahtar alan adı
  - `targetKey`: Hedef koleksiyondaki hedef anahtar alan adı
  - `onDelete`: Silme sırasında basamaklı işlem
  - `onUpdate`: Güncelleme sırasında basamaklı işlem
  - `constraints`: Yabancı anahtar kısıtlamalarını etkinleştirip etkinleştirmediği

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Hedef koleksiyon adı
  foreignKey?: string;  // Yabancı anahtar alan adı
  targetKey?: string;   // Hedef koleksiyondaki hedef anahtar alan adı
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Yabancı anahtar kısıtlamalarını etkinleştirip etkinleştirmediği
}
```

**Örnek**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: 'Yazar',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - Bire Bir İlişki

- **Açıklama**: Bire bir ilişkiyi temsil eder; mevcut kaydın bir ilişkili kayda sahip olduğunu belirtir.
- **Veritabanı Tipi**: Yabancı anahtar alanı
- **Özel Özellikler**:
  - `target`: Hedef koleksiyon adı
  - `foreignKey`: Yabancı anahtar alan adı
  - `sourceKey`: Kaynak koleksiyondaki kaynak anahtar alan adı
  - `onDelete`: Silme sırasında basamaklı işlem
  - `onUpdate`: Güncelleme sırasında basamaklı işlem
  - `constraints`: Yabancı anahtar kısıtlamalarını etkinleştirip etkinleştirmediği

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Kaynak koleksiyondaki kaynak anahtar alan adı
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Örnek**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'Kullanıcı Profili',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Bire Çok İlişki

- **Açıklama**: Bire çok ilişkiyi temsil eder; mevcut kaydın birden çok ilişkili kayda sahip olduğunu belirtir.
- **Veritabanı Tipi**: Yabancı anahtar alanı
- **Özel Özellikler**:
  - `target`: Hedef koleksiyon adı
  - `foreignKey`: Yabancı anahtar alan adı
  - `sourceKey`: Kaynak koleksiyondaki kaynak anahtar alan adı
  - `sortBy`: Sıralama alanı
  - `sortable`: Sıralanabilir mi
  - `onDelete`: Silme sırasında basamaklı işlem
  - `onUpdate`: Güncelleme sırasında basamaklı işlem
  - `constraints`: Yabancı anahtar kısıtlamalarını etkinleştirip etkinleştirmediği

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Sıralama alanı
  sortable?: boolean; // Sıralanabilir mi
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Örnek**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'Yazılar',
  target: 'articles',
  foreignKey: 'authorId',
  sourceKey: 'id',
    sortBy: ['createdAt'],
  sortable: true,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'belongsToMany'` - Çoktan Çoğa İlişki

- **Açıklama**: Çoktan çoğa bir ilişkiyi temsil eder; iki koleksiyonu bir ara tablo aracılığıyla bağlar.
- **Veritabanı Tipi**: Ara tablo
- **Özel Özellikler**:
  - `target`: Hedef koleksiyon adı
  - `through`: Ara tablo adı
  - `foreignKey`: Yabancı anahtar alan adı
  - `otherKey`: Ara tablodaki diğer yabancı anahtar
  - `sourceKey`: Kaynak koleksiyondaki kaynak anahtar alan adı
  - `targetKey`: Hedef koleksiyondaki hedef anahtar alan adı
  - `onDelete`: Silme sırasında basamaklı işlem
  - `onUpdate`: Güncelleme sırasında basamaklı işlem
  - `constraints`: Yabancı anahtar kısıtlamalarını etkinleştirip etkinleştirmediği

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Ara tablo adı
  foreignKey?: string;
  otherKey?: string;  // Ara tablodaki diğer yabancı anahtar
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Örnek**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'Etiketler',
  target: 'article_tags',
  through: 'article_tag_relations',
  foreignKey: 'articleId',
  otherKey: 'tagId',
  sourceKey: 'id',
  targetKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```