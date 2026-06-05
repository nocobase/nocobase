:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# DataSourceManager

NocoBase предоставляет `DataSourceManager` для управления несколькими **источниками данных**. Каждый `DataSource` имеет собственные экземпляры `Database`, `ResourceManager` и `ACL`, что позволяет разработчикам гибко управлять и расширять множество **источников данных**.

## Основные понятия

Каждый экземпляр `DataSource` включает следующее:

- **`dataSource.collectionManager`**: Используется для управления **коллекциями** и полями.
- **`dataSource.resourceManager`**: Обрабатывает операции, связанные с ресурсами (например, создание, чтение, обновление, удаление и т.д.).
- **`dataSource.acl`**: Контроль доступа (ACL) для операций с ресурсами.

Для удобного доступа предусмотрены быстрые псевдонимы для основных членов **источника данных**:

- `app.db` эквивалентно `dataSourceManager.get('main').collectionManager.db`
- `app.acl` эквивалентно `dataSourceManager.get('main').acl`
- `app.resourceManager` эквивалентно `dataSourceManager.get('main').resourceManager`

## Часто используемые методы

### dataSourceManager.get(dataSourceKey)

Этот метод возвращает указанный экземпляр `DataSource`.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Регистрирует промежуточное ПО для всех **источников данных**. Это повлияет на операции со всеми **источниками данных**.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Выполняется перед загрузкой **источника данных**. Часто используется для регистрации статических классов, таких как классы моделей и типов полей:

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

Выполняется после загрузки **источника данных**. Часто используется для регистрации операций, настройки контроля доступа и т.д.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Установка прав доступа
});
```

## Расширение источников данных

Полное описание расширения **источников данных** вы найдете в соответствующем разделе.