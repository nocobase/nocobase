:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/data-source-manager) bakın.
:::

# ctx.dataSourceManager

Veri Kaynağı Yöneticisi (`DataSourceManager` örneği), birden fazla veri kaynağını (örneğin ana veritabanı `main`, günlük veritabanı `logging` vb.) yönetmek ve bunlara erişmek için kullanılır. Birden fazla veri kaynağı mevcut olduğunda veya veri kaynakları arası meta veri erişimi gerektiğinde kullanılır.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **Çoklu veri kaynağı** | Tüm veri kaynaklarını listeleme, anahtara (key) göre belirli bir veri kaynağını alma. |
| **Veri kaynakları arası erişim** | Mevcut bağlamın veri kaynağı bilinmediğinde, "veri kaynağı anahtarı + koleksiyon adı" kullanarak meta verilere erişim. |
| **Tam yol ile alan alma** | Farklı veri kaynaklarındaki alan tanımlarını almak için `dataSourceKey.koleksiyonAdı.alanYolu` formatını kullanma. |

> Not: Yalnızca mevcut veri kaynağı üzerinde işlem yapıyorsanız, `ctx.dataSource` kullanımına öncelik verin; `ctx.dataSourceManager`'ı yalnızca veri kaynaklarını listelemeniz veya aralarında geçiş yapmanız gerektiğinde kullanın.

## Tür Tanımı

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // Veri kaynağı yönetimi
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // Veri kaynaklarını okuma
  getDataSources(): DataSource[];                     // Tüm veri kaynaklarını al
  getDataSource(key: string): DataSource | undefined;  // Anahtara göre veri kaynağını al

  // Veri kaynağı + koleksiyon ile doğrudan meta verilere erişim
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## ctx.dataSource ile İlişkisi

| Gereksinim | Önerilen Kullanım |
|------|----------|
| **Mevcut bağlama bağlı tekil veri kaynağı** | `ctx.dataSource` (örneğin mevcut sayfanın/bloğun veri kaynağı) |
| **Tüm veri kaynakları için giriş noktası** | `ctx.dataSourceManager` |
| **Veri kaynaklarını listeleme veya değiştirme** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Mevcut veri kaynağı içindeki koleksiyonu alma** | `ctx.dataSource.getCollection(name)` |
| **Veri kaynakları arası koleksiyon alma** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Mevcut veri kaynağı içindeki alanı alma** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Veri kaynakları arası alanı alma** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Örnekler

### Belirli bir Veri Kaynağını Alma

```ts
// 'main' adlı veri kaynağını al
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Bu veri kaynağı altındaki tüm koleksiyonları al
const collections = mainDS?.getCollections();
```

### Veri Kaynakları Arası Koleksiyon Meta Verilerine Erişim

```ts
// dataSourceKey + collectionName ile koleksiyonu al
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Koleksiyonun birincil anahtarını al
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Tam Yol ile Alan Tanımını Alma

```ts
// Format: dataSourceKey.collectionName.fieldPath
// "veri kaynağı anahtarı.koleksiyon adı.alan yolu" ile alan tanımını al
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// İlişkili alan yollarını destekler
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Tüm Veri Kaynaklarını Dolaşma

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Veri Kaynağı: ${ds.key}, Görünen Ad: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Koleksiyon: ${col.name}`);
  }
}
```

### Değişkenlere Göre Dinamik Veri Kaynağı Seçimi

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## Notlar

- `getCollectionField` yol formatı `dataSourceKey.collectionName.fieldPath` şeklindedir; ilk bölüm veri kaynağı anahtarıdır, ardından koleksiyon adı ve alan yolu gelir.
- `getDataSource(key)`, veri kaynağı mevcut değilse `undefined` döndürür; kullanmadan önce boş değer kontrolü yapılması önerilir.
- `addDataSource`, anahtar zaten mevcutsa bir hata fırlatır; `upsertDataSource` ise mevcut olanın üzerine yazar veya yeni bir tane ekler.

## İlgili

- [ctx.dataSource](./data-source.md): Mevcut veri kaynağı örneği
- [ctx.collection](./collection.md): Mevcut bağlamla ilişkili koleksiyon
- [ctx.collectionField](./collection-field.md): Mevcut alan için koleksiyon alanı tanımı