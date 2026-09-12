---
title: "Migration"
description: "NocoBase Migration API reference: Migration base class, up/down methods, on execution timing, appVersion version control, and available properties."
keywords: "Migration,data migration,up,down,appVersion,on,beforeLoad,afterSync,afterLoad,NocoBase"
---

# Migration

Migration is the base class for data migrations in NocoBase, used to handle database schema changes and data migrations during plugin upgrades. Import it from `@nocobase/server`.

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<1.0.0';

  async up() {
    // Upgrade logic
  }
}
```

## Class Properties

### on

```ts
on: 'beforeLoad' | 'afterSync' | 'afterLoad';
```

Controls when the migration executes during the upgrade process. Defaults to `'afterLoad'`.

| Value | Execution Timing | Use Case |
|-------|------------------|----------|
| `'beforeLoad'` | Before plugins are loaded | Low-level DDL operations (e.g., adding columns, adding constraints); Repository API is not available |
| `'afterSync'` | After `db.sync()`, before plugin upgrade | Data migrations that need the new table schema but don't depend on plugin logic |
| `'afterLoad'` | After all plugins are loaded | **Default value**; most migrations use this. Full Repository API is available |

### appVersion

```ts
appVersion: string;
```

A semver range string that determines which application versions this migration runs on. The framework uses `semver.satisfies()` to evaluate: the migration only executes when the current application version satisfies this range.

```ts
// Only executes when upgrading from a version below 1.0.0
appVersion = '<1.0.0';

// Only executes when upgrading from a version below 0.21.0-alpha.13
appVersion = '<0.21.0-alpha.13';

// Leave empty to execute on every upgrade
appVersion = '';
```

## Instance Properties

### app

```ts
get app(): Application
```

The NocoBase Application instance. Use it to access various application modules:

```ts
async up() {
  // Get application version
  const version = this.app.version;

  // Get logger
  this.app.log.info('Migration started');
}
```

### db

```ts
get db(): Database
```

The NocoBase Database instance, which can be used to get repositories and execute queries:

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

The current plugin instance. Only available in plugin-level migrations (`undefined` in core migrations).

```ts
async up() {
  const pluginName = this.plugin.name;
}
```

### sequelize

```ts
get sequelize(): Sequelize
```

The Sequelize instance for executing raw SQL directly:

```ts
async up() {
  await this.sequelize.query(`UPDATE users SET status = 'active' WHERE status IS NULL`);
}
```

### queryInterface

```ts
get queryInterface(): QueryInterface
```

The Sequelize QueryInterface for DDL operations (adding/removing columns, adding constraints, modifying column types, etc.):

```ts
async up() {
  const { DataTypes } = require('@nocobase/database');

  // Add a column
  await this.queryInterface.addColumn('users', 'nickname', {
    type: DataTypes.STRING,
  });

  // Add a unique constraint
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

The plugin manager. Use `this.pm.repository` to query and modify plugin metadata:

```ts
async up() {
  const plugins = await this.pm.repository.find();
  for (const plugin of plugins) {
    // Batch modify plugin records
  }
}
```

## Instance Methods

### up()

```ts
async up(): Promise<void>
```

**Executed during upgrade.** Subclasses must override this method with the migration logic.

### down()

```ts
async down(): Promise<void>
```

**Executed during rollback.** Most migrations leave this empty. If rollback support is needed, write the reverse operations here.

## Complete Examples

### Update data using Repository API (afterLoad)

The most common scenario — use the Repository API to batch update data after all plugins are loaded:

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

### Modify table schema using QueryInterface (beforeLoad)

Execute low-level DDL before plugins are loaded — for example, adding new columns and unique constraints to a table:

```ts
import { DataTypes } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad';
  appVersion = '<0.14.0-alpha.2';

  async up() {
    const tableName = this.pm.collection.getTableNameWithSchema();
    const field = this.pm.collection.getField('packageName');

    // Check if the field already exists
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

### Use raw SQL (afterSync)

After table schema synchronization is complete, use raw SQL for data migration:

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

## Creating Migration Files

Create via CLI command:

```bash
yarn nocobase create-migration my-migration --pkg @my-project/plugin-hello
```

The command generates a timestamped file in the plugin's `src/server/migrations/` directory with the following template:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<current version>';

  async up() {
    // coding
  }
}
```

Command parameters:

| Parameter | Description |
|-----------|-------------|
| `<name>` | Migration name, used to generate the file name |
| `--pkg <pkg>` | Package name, determines the file output path |
| `--on <on>` | Execution timing, defaults to `'afterLoad'` |

## Related Links

- [Migration Scripts (Plugin Development)](../../plugin-development/server/migration.md) — Tutorial on using migrations in plugin development
- [Collections](../../plugin-development/server/collections.md) — defineCollection and table schema synchronization
- [Database Operations](../../plugin-development/server/database.md) — Repository API and database operations
- [Plugin](../../plugin-development/server/plugin.md) — Relationship between install() and migrations in the plugin lifecycle
