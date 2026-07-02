---
title: "Migration"
description: "Справочник по API Migration в NocoBase: базовый класс Migration, методы up/down, время выполнения on, контроль версий appVersion, доступные свойства."
keywords: "Migration,миграция данных,up,down,appVersion,on,beforeLoad,afterSync,afterLoad,NocoBase"
---

# Migration

Migration — базовый класс миграции данных в NocoBase, используемый для обработки изменений структуры базы данных и миграции данных при обновлении плагинов. Импортируется из `@nocobase/server`.

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<1.0.0';

  async up() {
    // логика обновления
  }
}
```

## Свойства класса

### on

```ts
on: 'beforeLoad' | 'afterSync' | 'afterLoad';
```

Управляет моментом выполнения migration в процессе upgrade. По умолчанию `'afterLoad'`.

| Значение | Время выполнения | Подходящие сценарии |
|----|----------|----------|
| `'beforeLoad'` | Перед загрузкой плагинов | Низкоуровневые DDL-операции (например, добавление столбца, добавление ограничения), Repository API недоступен |
| `'afterSync'` | После `db.sync()`, перед upgrade плагинов | Миграция данных, требующая новой структуры таблиц, но не зависящая от логики плагинов |
| `'afterLoad'` | После загрузки всех плагинов | **Значение по умолчанию**, подходит для большинства migration. Доступен полный Repository API |

### appVersion

```ts
appVersion: string;
```

Строка диапазона semver, определяющая, для каких версий приложения выполняется данная migration. Фреймворк использует `semver.satisfies()` для проверки: migration выполняется только если текущая версия приложения соответствует указанному диапазону.

```ts
// выполняется только при обновлении с версии ниже 1.0.0
appVersion = '<1.0.0';

// выполняется только при обновлении с версии ниже 0.21.0-alpha.13
appVersion = '<0.21.0-alpha.13';

// пустая строка — выполняется при каждом upgrade
appVersion = '';
```

## Свойства экземпляра

### app

```ts
get app(): Application
```

Экземпляр NocoBase Application. Через него можно получить доступ к различным модулям приложения:

```ts
async up() {
  // получить версию приложения
  const version = this.app.version;

  // получить логгер
  this.app.log.info('Migration started');
}
```

### db

```ts
get db(): Database
```

Экземпляр NocoBase Database, через который можно получить Repository, выполнять запросы и т.д.:

```ts
async up() {
  const repo = this.db.getRepository('users');
  await repo.update({
    filter: { status: 'inactive' },
    values: { status: 'disabled' },
  });
}
```

### plugin

```ts
get plugin(): Plugin
```

Экземпляр текущего плагина. Доступен только в migration уровня плагина (в core migration значение `undefined`).

```ts
async up() {
  const pluginName = this.plugin.name;
}
```

### sequelize

```ts
get sequelize(): Sequelize
```

Экземпляр Sequelize, позволяющий выполнять прямые SQL-запросы:

```ts
async up() {
  await this.sequelize.query(`UPDATE users SET status = 'active' WHERE status IS NULL`);
}
```

### queryInterface

```ts
get queryInterface(): QueryInterface
```

Sequelize QueryInterface для выполнения DDL-операций (добавление/удаление столбцов, добавление ограничений, изменение типа столбца и т.д.):

```ts
async up() {
  const { DataTypes } = require('@nocobase/database');

  // добавить столбец
  await this.queryInterface.addColumn('users', 'nickname', {
    type: DataTypes.STRING,
  });

  // добавить уникальное ограничение
  await this.queryInterface.addConstraint('users', {
    type: 'unique',
    fields: ['email'],
  });
}
```

### pm

```ts
get pm(): PluginManager
```

Менеджер плагинов. Через `this.pm.repository` можно запрашивать и изменять метаданные плагинов:

```ts
async up() {
  const plugins = await this.pm.repository.find();
  for (const plugin of plugins) {
    // пакетное изменение записей плагинов
  }
}
```

## Методы экземпляра

### up()

```ts
async up(): Promise<void>
```

**Выполняется при обновлении.** Подкласс должен переопределить этот метод и реализовать логику миграции.

### down()

```ts
async down(): Promise<void>
```

**Выполняется при откате.** Большинство migration оставляют пустым. При необходимости поддержки отката здесь реализуются обратные операции.

## Полные примеры

### Обновление данных с помощью Repository API (afterLoad)

Наиболее распространённый сценарий — после загрузки всех плагинов пакетное обновление данных через Repository API:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<1.0.0';

  async up() {
    const repo = this.db.getRepository('roles');
    await repo.update({
      filter: {
        $or: [{ allowConfigure: true }, { name: 'root' }],
      },
      values: {
        snippets: ['ui.*', 'pm', 'pm.*'],
        allowConfigure: false,
      },
    });
  }

  async down() {}
}
```

### Изменение структуры таблицы с помощью QueryInterface (beforeLoad)

Выполнение низкоуровневого DDL перед загрузкой плагинов — например, добавление нового столбца и уникального ограничения:

```ts
import { DataTypes } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad';
  appVersion = '<0.14.0-alpha.2';

  async up() {
    const tableName = this.pm.collection.getTableNameWithSchema();
    const field = this.pm.collection.getField('packageName');

    // проверить, существует ли поле
    const exists = await field.existsInDb();
    if (exists) return;

    await this.queryInterface.addColumn(tableName, field.columnName(), {
      type: DataTypes.STRING,
    });

    await this.queryInterface.addConstraint(tableName, {
      type: 'unique',
      fields: [field.columnName()],
    });
  }
}
```

### Использование сырого SQL (afterSync)

Миграция данных с помощью сырого SQL после завершения синхронизации структуры таблиц:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<1.0.0-alpha.3';

  async up() {
    const items = await this.pm.repository.find();
    for (const item of items) {
      if (item.name.startsWith('@nocobase/plugin-')) {
        item.set('name', item.name.substring('@nocobase/plugin-'.length));
        await item.save();
      }
    }
  }
}
```

## Создание файла Migration

Создание через команду CLI:

```bash
nb scaffold migration my-migration --pkg @my-project/plugin-hello
```

Команда создаст файл с временной меткой в каталоге `src/server/migrations/` плагина по следующему шаблону:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<текущая версия>';

  async up() {
    // coding
  }
}
```

Параметры команды:

| Параметр | Описание |
|------|------|
| `<name>` | Имя migration, используется для генерации имени файла |
| `--pkg <pkg>` | Имя пакета, определяет путь сохранения файла |
| `--on <on>` | Время выполнения, по умолчанию `'afterLoad'` |

## Связанные ссылки

- [Migration скрипты обновления (разработка плагинов)](../../plugin-development/server/migration.md) — руководство по использованию migration при разработке плагинов
- [Collections таблицы данных](../../plugin-development/server/collections.md) — defineCollection и синхронизация структуры таблиц
- [Database операции с базой данных](../../plugin-development/server/database.md) — Repository API и операции с базой данных
- [Plugin плагин](../../plugin-development/server/plugin.md) — связь install() и migration в жизненном цикле плагина
