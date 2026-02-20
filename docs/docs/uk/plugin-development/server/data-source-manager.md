:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# DataSourceManager: Керування джерелами даних

NocoBase надає `DataSourceManager` для керування кількома джерелами даних. Кожне `DataSource` має власні екземпляри `Database`, `ResourceManager` та `ACL`, що дозволяє розробникам гнучко керувати та розширювати різні джерела даних.

## Основні концепції

Кожен екземпляр `DataSource` містить наступне:

- **`dataSource.collectionManager`**: Використовується для керування колекціями та полями.
- **`dataSource.resourceManager`**: Обробляє операції, пов'язані з ресурсами (наприклад, створення, читання, оновлення, видалення тощо).
- **`dataSource.acl`**: Контроль доступу (ACL) для операцій з ресурсами.

Для зручного доступу надаються псевдоніми для основних членів джерела даних:

- ``app.db` еквівалентно `dataSourceManager.get('main').collectionManager.db``
- ``app.acl` еквівалентно `dataSourceManager.get('main').acl``
- ``app.resourceManager` еквівалентно `dataSourceManager.get('main').resourceManager``

## Поширені методи

### dataSourceManager.get(dataSourceKey)

Цей метод повертає вказаний екземпляр `DataSource`.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Реєструє проміжне програмне забезпечення (middleware) для всіх джерел даних. Це вплине на операції з усіма джерелами даних.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Виконується перед завантаженням джерела даних. Зазвичай використовується для реєстрації статичних класів, таких як класи моделей та типи полів:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Користувацький тип поля
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Виконується після завантаження джерела даних. Зазвичай використовується для реєстрації операцій, налаштування контролю доступу тощо.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Налаштування прав доступу
});
```

## Розширення джерел даних

Щоб отримати повну інформацію про розширення джерел даних, зверніться до розділу «Розширення джерел даних».