:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Veri Kaynağı (Soyut)

`DataSource` soyut bir sınıftır ve bir veritabanı, API gibi çeşitli veri kaynağı türlerini temsil etmek için kullanılır.

## Üyeler

### collectionManager

Veri kaynağının `CollectionManager` örneğidir ve [`ICollectionManager`](/api/data-source-manager/i-collection-manager) arayüzünü uygulamalıdır.

### resourceManager

Veri kaynağının `resourceManager` örneğidir.

### acl

Veri kaynağının `ACL` örneğidir.

## API

### constructor()

Yapıcı fonksiyon, bir `DataSource` örneği oluşturur.

#### İmza

- `constructor(options: DataSourceOptions)`

### init()

Başlatma fonksiyonu, `constructor` çağrıldıktan hemen sonra çalışır.

#### İmza

- `init(options: DataSourceOptions)`

### name

#### İmza

- `get name()`

Veri kaynağının örnek adını döndürür.

### middleware()

`DataSource` için ara yazılımı (middleware) döndürür; bu, sunucuya istekleri almak üzere bağlanmak için kullanılır.

### testConnection()

Bağlantı testi işlemi sırasında çağrılan statik bir metottur. Parametre doğrulama için kullanılabilir ve özel mantığı alt sınıf tarafından uygulanır.

#### İmza

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### İmza

- `async load(options: any = {})`

Veri kaynağının yükleme işlemidir. Mantığı alt sınıf tarafından uygulanır.

### createCollectionManager()

#### İmza
- `abstract createCollectionManager(options?: any): ICollectionManager`

Veri kaynağı için bir `CollectionManager` örneği oluşturur. Mantığı alt sınıf tarafından uygulanır.

### createResourceManager()

Veri kaynağı için bir `ResourceManager` örneği oluşturur. Alt sınıflar bu uygulamayı geçersiz kılabilir. Varsayılan olarak, `@nocobase/resourcer` içindeki `ResourceManager`'ı oluşturur.

### createACL()

- `DataSource` için bir `ACL` örneği oluşturur. Alt sınıflar bu uygulamayı geçersiz kılabilir. Varsayılan olarak, `@nocobase/acl` içindeki `ACL`'yi oluşturur.