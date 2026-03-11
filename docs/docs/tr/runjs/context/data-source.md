:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/data-source) bakın.
:::

# ctx.dataSource

Mevcut RunJS yürütme bağlamına bağlı veri kaynağı örneği (`DataSource`). **Mevcut veri kaynağı içinde** koleksiyonlara, alan meta verilerine erişmek ve koleksiyon yapılandırmalarını yönetmek için kullanılır. Genellikle mevcut sayfa veya blok için seçilen veri kaynağına (örneğin ana veritabanı `main`) karşılık gelir.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **Tek Veri Kaynağı İşlemleri** | Mevcut veri kaynağı bilindiğinde koleksiyon ve alan meta verilerini alma. |
| **Koleksiyon Yönetimi** | Mevcut veri kaynağı altındaki koleksiyonları alma, ekleme, güncelleme veya silme. |
| **Yola Göre Alanları Getirme** | Alan tanımlarını almak için `koleksiyonAdı.alanYolu` formatını kullanma (ilişki yollarını destekler). |

> Not: `ctx.dataSource` mevcut bağlam için tek bir veri kaynağını temsil eder; diğer veri kaynaklarını listelemek veya onlara erişmek için lütfen [ctx.dataSourceManager](./data-source-manager.md) kullanın.

## Tip Tanımı

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Salt okunur özellikler
  get flowEngine(): FlowEngine;   // Mevcut FlowEngine örneği
  get displayName(): string;      // Görüntülenen ad (i18n destekler)
  get key(): string;              // Veri kaynağı anahtarı, örn. 'main'
  get name(): string;             // Anahtar ile aynı

  // Koleksiyon okuma
  getCollections(): Collection[];                      // Tüm koleksiyonları getir
  getCollection(name: string): Collection | undefined; // Ada göre koleksiyonu getir
  getAssociation(associationName: string): CollectionField | undefined; // İlişki alanını getir (örn. users.roles)

  // Koleksiyon yönetimi
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Alan meta verileri
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Sık Kullanılan Özellikler

| Özellik | Tip | Açıklama |
|------|------|------|
| `key` | `string` | Veri kaynağı anahtarı, örn. `'main'` |
| `name` | `string` | Anahtar ile aynı |
| `displayName` | `string` | Görüntülenen ad (i18n destekler) |
| `flowEngine` | `FlowEngine` | Mevcut FlowEngine örneği |

## Sık Kullanılan Metotlar

| Metot | Açıklama |
|------|------|
| `getCollections()` | Mevcut veri kaynağı altındaki tüm koleksiyonları getirir (sıralanmış ve gizli olanlar filtrelenmiş şekilde). |
| `getCollection(name)` | Ada göre bir koleksiyon getirir; `name`, bir ilişkinin hedef koleksiyonunu almak için `koleksiyonAdı.alanAdı` olabilir. |
| `getAssociation(associationName)` | `koleksiyonAdı.alanAdı` ile bir ilişki alanı tanımını getirir. |
| `getCollectionField(fieldPath)` | `users.profile.avatar` gibi ilişki yollarını destekleyerek `koleksiyonAdı.alanYolu` ile bir alan tanımını getirir. |

## ctx.dataSourceManager ile İlişkisi

| Gereksinim | Önerilen Kullanım |
|------|----------|
| **Mevcut bağlama bağlı tek veri kaynağı** | `ctx.dataSource` |
| **Tüm veri kaynakları için giriş noktası** | `ctx.dataSourceManager` |
| **Mevcut veri kaynağı içinde koleksiyon alma** | `ctx.dataSource.getCollection(name)` |
| **Veri kaynakları arası koleksiyon alma** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Mevcut veri kaynağı içinde alan alma** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Veri kaynakları arası alan alma** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Örnek

### Koleksiyonları ve Alanları Getirme

```ts
// Tüm koleksiyonları getir
const collections = ctx.dataSource.getCollections();

// Ada göre koleksiyonu getir
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// "koleksiyonAdı.alanYolu" ile alan tanımını getir (ilişkileri destekler)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### İlişki Alanlarını Getirme

```ts
// koleksiyonAdı.alanAdı ile ilişki alanı tanımını getir
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // Hedef koleksiyon yapısına göre işlemleri gerçekleştirin
}
```

### Dinamik İşleme İçin Koleksiyonlar Üzerinde Gezinme

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Alan Meta Verilerine Dayalı Doğrulama veya Dinamik UI Gerçekleştirme

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // Arayüz (interface), enum, doğrulama (validation) vb. bilgilere göre UI mantığını veya doğrulamayı çalıştırın
}
```

## Notlar

- `getCollectionField(fieldPath)` için yol formatı `koleksiyonAdı.alanYolu` şeklindedir; ilk bölüm koleksiyon adıdır ve sonraki bölümler alan yoludur (ilişkileri destekler, örn. `user.name`).
- `getCollection(name)`, ilişki alanının hedef koleksiyonunu döndüren `koleksiyonAdı.alanAdı` formatını destekler.
- RunJS bağlamında `ctx.dataSource` genellikle mevcut blok veya sayfanın veri kaynağı tarafından belirlenir; bağlama bağlı bir veri kaynağı yoksa `undefined` olabilir, kullanmadan önce boş değer kontrolü yapılması önerilir.

## İlgili Konular

- [ctx.dataSourceManager](./data-source-manager.md): Veri kaynağı yöneticisi, tüm veri kaynaklarını yönetir.
- [ctx.collection](./collection.md): Mevcut bağlamla ilişkili koleksiyon.
- [ctx.collectionField](./collection-field.md): Mevcut alan için koleksiyon alanı tanımı.