# DataSource - Источник данных (абстрактный)

`DataSource` — это абстрактный класс, который используется для представления типа источника данных, например базы данных, API и т. д.

## Свойства

### collectionManager

Экземпляр CollectionManager для источника данных, который должен реализовывать интерфейс [`ICollectionManager`](/api/data-source-manager/i-collection-manager).

### resourceManager

Экземпляр resourceManager для источника данных.

### acl

Экземпляр ACL для источника данных.

## API

### constructor()

Конструктор, создает экземпляр `DataSource`.

#### Сигнатура

- `constructor(options: DataSourceOptions)`

### init()

Функция инициализации, вызывается сразу после `constructor`.

#### Сигнатура

- `init(options: DataSourceOptions)`


### name

#### Сигнатура

- `get name()`

Возвращает имя экземпляра источника данных.

### middleware()

Возвращает middleware для DataSource, которое используется для подключения к серверу и получения запросов.

### testConnection()

Статический метод, вызываемый во время операции проверки подключения. Может использоваться для валидации параметров, а конкретная логика реализуется в подклассе.

#### Сигнатура

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Сигнатура

- `async load(options: any = {})`

Операция загрузки для источника данных. Логика реализуется в подклассе.

### createCollectionManager()

#### Сигнатура
- `abstract createCollectionManager(options?: any): ICollectionManager`

Создает экземпляр CollectionManager для источника данных. Логика реализуется в подклассе.

### createResourceManager()

Создает экземпляр ResourceManager для источника данных. Подклассы могут переопределить реализацию. По умолчанию создается `ResourceManager` из `@nocobase/resourcer`.

### createACL()

- Создает экземпляр ACL для DataSource. Подклассы могут переопределить реализацию. По умолчанию создается `ACL` из `@nocobase/acl`.