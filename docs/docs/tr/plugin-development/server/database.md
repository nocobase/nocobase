:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Veritabanı

`Database`, veritabanı türündeki veri kaynaklarının (`DataSource`) önemli bir bileşenidir. Her veritabanı türündeki veri kaynağının, `dataSource.db` üzerinden erişilebilen karşılık gelen bir `Database` örneği bulunur. Ana veri kaynağının veritabanı örneği ayrıca kullanışlı `app.db` takma adını da sağlar. `db`'nin yaygın yöntemlerine aşina olmanız, sunucu tarafı eklentileri yazmanın temelini oluşturur.

## Veritabanı Bileşenleri

Tipik bir `Database` aşağıdaki bölümlerden oluşur:

- **koleksiyon**: Veri tablosu yapısını tanımlar.
- **Model**: ORM modellerine karşılık gelir (genellikle Sequelize tarafından yönetilir).
- **Repository**: Veri erişim mantığını kapsülleyen, daha üst düzey işlem yöntemleri sunan bir depo katmanıdır.
- **FieldType**: Alan türleri.
- **FilterOperator**: Filtreleme için kullanılan operatörler.
- **Event**: Yaşam döngüsü olayları ve veritabanı olayları.

## Eklentilerde Kullanım Zamanlaması

### beforeLoad Aşamasında Yapılabilecekler

Bu aşamada veritabanı işlemleri yapılamaz. Statik sınıf kaydı veya olay dinleme için uygundur.

- `db.registerFieldTypes()` — Özel alan türleri
- `db.registerModels()` — Özel model sınıflarını kaydetme
- `db.registerRepositories()` — Özel repository sınıflarını kaydetme
- `db.registerOperators()` — Özel filtre operatörlerini kaydetme
- `db.on()` — Veritabanı ile ilgili olayları dinleme

### load Aşamasında Yapılabilecekler

Bu aşamada, önceki tüm sınıf tanımları ve olaylar yüklendiği için, veri tablolarını yüklerken eksik veya atlanmış bağımlılıklar olmaz.

- `db.defineCollection()` — Yeni veri tabloları tanımlama
- `db.extendCollection()` — Mevcut veri tablosu yapılandırmalarını genişletme

Eklentinin dahili tablolarını tanımlamak için, bunları `./src/server/collections` dizinine yerleştirmeniz daha çok önerilir. Ayrıntılar için [Koleksiyonlar](./collections.md) bölümüne bakınız.

## Veri İşlemleri

`Database`, verilere erişmek ve onları işlemek için iki ana yöntem sunar:

### Repository Üzerinden İşlemler

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

Repository katmanı genellikle sayfalama, filtreleme, yetki kontrolü gibi iş mantığını kapsüllemek için kullanılır.

### Model Üzerinden İşlemler

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

Model katmanı doğrudan ORM varlıklarına karşılık gelir ve daha alt düzey veritabanı işlemleri için uygundur.

## Hangi Aşamalarda Veritabanı İşlemleri Yapılabilir?

### Eklenti Yaşam Döngüsü

| Aşama | Veritabanı İşlemlerine İzin Verilir |
|------|------------------------------------|
| `staticImport` | Hayır |
| `afterAdd` | Hayır |
| `beforeLoad` | Hayır |
| `load` | Hayır |
| `install` | Evet |
| `beforeEnable` | Evet |
| `afterEnable` | Evet |
| `beforeDisable` | Evet |
| `afterDisable` | Evet |
| `remove` | Evet |
| `handleSyncMessage` | Evet |

### Uygulama Olayları

| Aşama | Veritabanı İşlemlerine İzin Verilir |
|------|------------------------------------|
| `beforeLoad` | Hayır |
| `afterLoad` | Hayır |
| `beforeStart` | Evet |
| `afterStart` | Evet |
| `beforeInstall` | Hayır |
| `afterInstall` | Evet |
| `beforeStop` | Evet |
| `afterStop` | Hayır |
| `beforeDestroy` | Evet |
| `afterDestroy` | Hayır |
| `beforeLoadPlugin` | Hayır |
| `afterLoadPlugin` | Hayır |
| `beforeEnablePlugin` | Evet |
| `afterEnablePlugin` | Evet |
| `beforeDisablePlugin` | Evet |
| `afterDisablePlugin` | Evet |
| `afterUpgrade` | Evet |

### Veritabanı Olayları/Kancaları

| Aşama | Veritabanı İşlemlerine İzin Verilir |
|------|------------------------------------|
| `beforeSync` | Hayır |
| `afterSync` | Evet |
| `beforeValidate` | Evet |
| `afterValidate` | Evet |
| `beforeCreate` | Evet |
| `afterCreate` | Evet |
| `beforeUpdate` | Evet |
| `afterUpdate` | Evet |
| `beforeSave` | Evet |
| `afterSave` | Evet |
| `beforeDestroy` | Evet |
| `afterDestroy` | Evet |
| `afterCreateWithAssociations` | Evet |
| `afterUpdateWithAssociations` | Evet |
| `afterSaveWithAssociations` | Evet |
| `beforeDefineCollection` | Hayır |
| `afterDefineCollection` | Hayır |
| `beforeRemoveCollection` | Hayır |
| `afterRemoveCollection` | Hayır |