:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# DataSource (абстрактный)

`DataSource` — это абстрактный класс, который используется для представления определенного типа **источника данных**, например, базы данных или API.

## Члены

### collectionManager

Экземпляр `CollectionManager` для **источника данных**, который должен реализовывать интерфейс [`ICollectionManager`](/api/data-source-manager/i-collection-manager).

### resourceManager

Экземпляр `resourceManager` для **источника данных**.

### acl

Экземпляр `ACL` для **источника данных**.

## API

### constructor()

Конструктор, который создает экземпляр `DataSource`.

#### Сигнатура

- `constructor(options: DataSourceOptions)`

### init()

Функция инициализации, которая вызывается сразу после `constructor`.

#### Сигнатура

- `init(options: DataSourceOptions)`


### name

#### Сигнатура

- `get name()`

Возвращает имя экземпляра **источника данных**.

### middleware()

Получает промежуточное ПО (`middleware`) для `DataSource`, которое используется для монтирования на сервер и приема запросов.

### testConnection()

Статический метод, который вызывается во время операции проверки соединения. Его можно использовать для валидации параметров, а конкретная логика реализуется подклассом.

#### Сигнатура

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Сигнатура

- `async load(options: any = {})`

Операция загрузки для **источника данных**. Логика реализуется подклассом.

### createCollectionManager()

#### Сигнатура
- `abstract createCollectionManager(options?: any): ICollectionManager`

Создает экземпляр `CollectionManager` для **источника данных**. Логика реализуется подклассом.

### createResourceManager()

Создает экземпляр `ResourceManager` для **источника данных**. Подклассы могут переопределять эту реализацию. По умолчанию создается `ResourceManager` из `@nocobase/resourcer`.

### createACL()

- Создает экземпляр `ACL` для `DataSource`. Подклассы могут переопределять эту реализацию. По умолчанию создается `ACL` из `@nocobase/acl`.