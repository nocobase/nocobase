:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# DataSource (абстрактний)

`DataSource` – це абстрактний клас, який використовується для представлення певного типу джерела даних, наприклад, бази даних, API тощо.

## Члени

### collectionManager

Екземпляр CollectionManager для джерела даних, який повинен реалізовувати інтерфейс [`ICollectionManager`](/api/data-source-manager/i-collection-manager).

### resourceManager

Екземпляр resourceManager для джерела даних.

### acl

Екземпляр ACL для джерела даних.

## API

### constructor()

Конструктор, створює екземпляр `DataSource`.

#### Підпис

- `constructor(options: DataSourceOptions)`

### init()

Функція ініціалізації, яка викликається одразу після `constructor`.

#### Підпис

- `init(options: DataSourceOptions)`


### name

#### Підпис

- `get name()`

Повертає ім'я екземпляра джерела даних.

### middleware()

Отримує проміжне програмне забезпечення (middleware) для DataSource, яке використовується для підключення до Server для отримання запитів.

### testConnection()

Статичний метод, який викликається під час операції перевірки з'єднання. Його можна використовувати для валідації параметрів, а конкретна логіка реалізується підкласом.

#### Підпис

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Підпис

- `async load(options: any = {})`

Операція завантаження для джерела даних. Логіка реалізується підкласом.

### createCollectionManager()

#### Підпис
- `abstract createCollectionManager(options?: any): ICollectionManager`

Створює екземпляр CollectionManager для джерела даних. Логіка реалізується підкласом.

### createResourceManager()

Створює екземпляр ResourceManager для джерела даних. Підкласи можуть перевизначати реалізацію. За замовчуванням створюється `ResourceManager` з `@nocobase/resourcer`.

### createACL()

Створює екземпляр ACL для DataSource. Підкласи можуть перевизначати реалізацію. За замовчуванням створюється `ACL` з `@nocobase/acl`.