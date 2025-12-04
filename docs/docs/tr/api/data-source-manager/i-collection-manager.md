:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# ICollectionManager

`ICollectionManager` arayüzü, bir veri kaynağının `koleksiyon` örneklerini yönetmek için kullanılır.

## API

### registerFieldTypes()

Bir `koleksiyon` içindeki alan türlerini kaydeder.

#### İmza

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Bir `koleksiyon`un `arayüzünü` kaydeder.

#### İmza

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Bir `koleksiyon Şablonunu` kaydeder.

#### İmza

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Bir `Model` kaydeder.

#### İmza

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Bir `Repository` kaydeder.

#### İmza

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Kayıtlı bir repository örneğini alır.

#### İmza

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Bir `koleksiyon` tanımlar.

#### İmza

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Mevcut bir `koleksiyon`un özelliklerini değiştirir.

#### İmza

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Bir `koleksiyon`un var olup olmadığını kontrol eder.

#### İmza

- `hasCollection(name: string): boolean`

### getCollection()

Bir `koleksiyon` örneğini alır.

#### İmza

- `getCollection(name: string): ICollection`

### getCollections()

Tüm `koleksiyon` örneklerini alır.

#### İmza

- `getCollections(): Array<ICollection>`

### getRepository()

Bir `Repository` örneğini alır.

#### İmza

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Veri kaynağını senkronize eder. Mantık, alt sınıflar tarafından uygulanır.

#### İmza

- `sync(): Promise<void>`