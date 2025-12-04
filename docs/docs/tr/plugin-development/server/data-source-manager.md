:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# DataSourceManager Veri Kaynağı Yönetimi

NocoBase, birden fazla veri kaynağını yönetmek için `DataSourceManager` sağlar. Her bir `DataSource`'un kendine ait bir `Database`, `ResourceManager` ve `ACL` örneği bulunur. Bu yapı, geliştiricilerin birden fazla veri kaynağını esnek bir şekilde yönetmesini ve genişletmesini kolaylaştırır.

## Temel Kavramlar

Her bir `DataSource` örneği aşağıdaki bileşenleri içerir:

- **`dataSource.collectionManager`**: Koleksiyonları ve alanları yönetmek için kullanılır.
- **`dataSource.resourceManager`**: Kaynaklarla ilgili işlemleri (örneğin, CRUD işlemleri gibi) yönetir.
- **`dataSource.acl`**: Kaynak işlemleri için erişim kontrolünü (ACL) sağlar.

Kolay erişim sağlamak amacıyla, ana veri kaynağı üyeleri için kısayol takma adları (alias) sunulmuştur:

- `app.db`, `dataSourceManager.get('main').collectionManager.db` ile eşdeğerdir.
- `app.acl`, `dataSourceManager.get('main').acl` ile eşdeğerdir.
- `app.resourceManager`, `dataSourceManager.get('main').resourceManager` ile eşdeğerdir.

## Sık Kullanılan Metotlar

### dataSourceManager.get(dataSourceKey)

Bu metot, belirtilen `DataSource` örneğini döndürür.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Tüm veri kaynakları için middleware (ara yazılım) kaydeder. Bu işlem, tüm veri kaynaklarındaki operasyonları etkileyecektir.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Veri kaynağı yüklenmeden önce çalışır. Genellikle model sınıfları ve alan türü kaydı gibi statik sınıf kayıtları için kullanılır:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Özel alan türü
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Veri kaynağı yüklendikten sonra çalışır. Genellikle operasyonları kaydetmek, erişim kontrolünü ayarlamak gibi işlemler için kullanılır.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Erişim izinlerini ayarlar
});
```

## Veri Kaynağı Genişletme

Veri kaynağı genişletme hakkında daha fazla bilgi için lütfen [veri kaynağı genişletme bölümüne](#) bakınız.