:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Database

`Database` — это важная часть источников данных (`DataSource`) типа "база данных". Каждый источник данных типа "база данных" имеет соответствующий экземпляр `Database`, доступ к которому можно получить через `dataSource.db`. Экземпляр базы данных основного источника данных также предоставляет удобный псевдоним `app.db`. Знакомство с общими методами `db` является основой для написания серверных плагинов.

## Компоненты Database

Типичный `Database` состоит из следующих частей:

- **Коллекция**: Определяет структуру таблиц данных.
- **Model**: Соответствует моделям ORM (обычно управляется Sequelize).
- **Repository**: Уровень репозитория, который инкапсулирует логику доступа к данным, предоставляя методы для операций более высокого уровня.
- **FieldType**: Типы полей.
- **FilterOperator**: Операторы, используемые для фильтрации.
- **Event**: События жизненного цикла и события базы данных.

## Время использования в плагинах

### Что подходит для этапа `beforeLoad`

На этом этапе операции с базой данных не допускаются. Он подходит для регистрации статических классов или прослушивания событий.

- `db.registerFieldTypes()` — Регистрация пользовательских типов полей
- `db.registerModels()` — Регистрация пользовательских классов моделей
- `db.registerRepositories()` — Регистрация пользовательских классов репозиториев
- `db.registerOperators()` — Регистрация пользовательских операторов фильтрации
- `db.on()` — Прослушивание событий, связанных с базой данных

### Что подходит для этапа `load`

На этом этапе все предыдущие определения классов и события уже загружены, поэтому при загрузке таблиц данных не будет пропущенных или отсутствующих зависимостей.

- `db.defineCollection()` — Определение новых таблиц данных
- `db.extendCollection()` — Расширение существующих конфигураций таблиц данных

Если вы определяете встроенные таблицы для плагина, рекомендуется размещать их в директории `./src/server/collections`. Подробнее см. в разделе [Коллекции](./collections.md).

## Операции с данными

`Database` предоставляет два основных способа доступа и работы с данными:

### Операции через Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

Уровень Repository обычно используется для инкапсуляции бизнес-логики, такой как пагинация, фильтрация, проверка разрешений и т.д.

### Операции через Model

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

Уровень Model напрямую соответствует сущностям ORM и подходит для выполнения низкоуровневых операций с базой данных.

## На каких этапах разрешены операции с базой данных?

### Жизненный цикл плагина

| Этап | Операции с БД разрешены |
|------|------------------------|
| `staticImport` | Нет |
| `afterAdd` | Нет |
| `beforeLoad` | Нет |
| `load` | Нет |
| `install` | Да |
| `beforeEnable` | Да |
| `afterEnable` | Да |
| `beforeDisable` | Да |
| `afterDisable` | Да |
| `remove` | Да |
| `handleSyncMessage` | Да |

### События приложения

| Этап | Операции с БД разрешены |
|------|------------------------|
| `beforeLoad` | Нет |
| `afterLoad` | Нет |
| `beforeStart` | Да |
| `afterStart` | Да |
| `beforeInstall` | Нет |
| `afterInstall` | Да |
| `beforeStop` | Да |
| `afterStop` | Нет |
| `beforeDestroy` | Да |
| `afterDestroy` | Нет |
| `beforeLoadPlugin` | Нет |
| `afterLoadPlugin` | Нет |
| `beforeEnablePlugin` | Да |
| `afterEnablePlugin` | Да |
| `beforeDisablePlugin` | Да |
| `afterDisablePlugin` | Да |
| `afterUpgrade` | Да |

### События/хуки Database

| Этап | Операции с БД разрешены |
|------|------------------------|
| `beforeSync` | Нет |
| `afterSync` | Да |
| `beforeValidate` | Да |
| `afterValidate` | Да |
| `beforeCreate` | Да |
| `afterCreate` | Да |
| `beforeUpdate` | Да |
| `afterUpdate` | Да |
| `beforeSave` | Да |
| `afterSave` | Да |
| `beforeDestroy` | Да |
| `afterDestroy` | Да |
| `afterCreateWithAssociations` | Да |
| `afterUpdateWithAssociations` | Да |
| `afterSaveWithAssociations` | Да |
| `beforeDefineCollection` | Нет |
| `afterDefineCollection` | Нет |
| `beforeRemoveCollection` | Нет |
| `afterRemoveCollection` | Нет |