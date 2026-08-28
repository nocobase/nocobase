# Менеджер источников данных (dataSourceManager)

NocoBase предоставляет `Менеджер источников данных` для управления несколькими источниками данных. Каждый источник данных `DataSource` имеет собственные экземпляры `Database`, `ResourceManager` и `ACL`, что позволяет разработчикам гибко управлять несколькими источниками данных и расширять их.

## Основные понятия

Каждый экземпляр `DataSource` содержит следующее:

- **`dataSource.collectionManager`**: используется для управления коллекциями и полями.
- **`dataSource.resourceManager`**: обрабатывает операции, связанные с ресурсами (например, создание, чтение, обновление и удаление).
- **`dataSource.acl`**: контроль доступа (ACL) для операций с ресурсами.

Для удобного доступа к основным компонентам основного источника данных предусмотрены псевдонимы:

- `app.db` эквивалентно `dataSourceManager.get('main').collectionManager.db`
- `app.acl` эквивалентно `dataSourceManager.get('main').acl`
- `app.resourceManager` эквивалентно `dataSourceManager.get('main').resourceManager`

## Общие методы

### dataSourceManager.get(dataSourceKey)

Этот метод возвращает указанный экземпляр `DataSource`.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Регистрирует промежуточный обработчик для всех источников данных. Это повлияет на операции во всех источниках данных.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('Этот промежуточный обработчик применяется ко всем источникам данных.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Выполняется перед загрузкой источника данных. Обычно используется для регистрации статических классов, например классов моделей и типов полей:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Пользовательский тип поля
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Выполняется после загрузки источника данных. Обычно используется для регистрации операций и настройки контроля доступа.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Настроить права доступа
});
```

## Расширение источника данных

Полное описание расширения источника данных см. в главе «Расширение источника данных».