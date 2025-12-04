:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# DataSourceManager

`DataSourceManager`, birden fazla `dataSource` örneğinin yönetim sınıfıdır.

## API

### add()
Bir `dataSource` örneği ekler.

#### İmza

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

`dataSource` örneğine genel ara yazılım ekler.

### middleware()

Mevcut `dataSourceManager` örneğinin ara yazılımını alır. Bu ara yazılım, HTTP isteklerine yanıt vermek için kullanılabilir.

### afterAddDataSource()

Yeni bir `dataSource` eklendikten sonra çağrılan bir kanca fonksiyonudur.

#### İmza

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Bir veri kaynağı türünü ve sınıfını kaydeder.

#### İmza

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Veri kaynağı sınıfını alır.

#### İmza

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Kayıtlı veri kaynağı türüne ve örnek seçeneklerine göre bir veri kaynağı örneği oluşturur.

#### İmza

- `buildDataSourceByType(type: string, options: any): DataSource`