# Migration

During NocoBase plugin development and updates, plugin database structures or configurations may undergo incompatible changes. To ensure smooth upgrades, NocoBase provides a **Migration** mechanism to handle these changes by writing migration files. This guide will help you systematically understand Migration usage and development workflow.

## Migration Concept

Migration is a script that automatically executes during plugin upgrades, used to solve the following problems:

- Data table structure adjustments (adding fields, modifying field types, etc.)
- Data migration (such as batch updates of field values)
- Plugin configuration or internal logic updates

Migration execution timing is divided into three types:

| Type        | Trigger Timing                                      | Execution Scenario |
| ----------- | --------------------------------------------------- | ------------------ |
| `beforeLoad` | Before all plugin configurations are loaded         |                    |
| `afterSync`  | After collection configurations are synchronized with the database (the collection structure has already been changed) | |
| `afterLoad`  | After all plugin configurations are loaded          |                    |

## Create Migration Files

Migration files should be placed in `src/server/migrations/*.ts` in the plugin directory. NocoBase provides the `create-migration` command to quickly generate migration files.

```bash
yarn nocobase create-migration [options] <name>
```

Optional Parameters

| Parameter      | Description |
| -------------- | ----------- |
| `--pkg <pkg>`  | Specify plugin package name |
| `--on [on]`    | Specify execution timing, options: `beforeLoad`, `afterSync`, `afterLoad` |

Example

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

Generated migration file path:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

File initial content:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Write upgrade logic here
  }
}
```

> ⚠️ `appVersion` is used to identify the version targeted by the upgrade. Environments with versions less than the specified version will execute this migration.

## Writing Migration

In Migration files, you can access the following common properties and APIs through `this` to conveniently operate database, plugins, and application instances:

Common Properties

- **`this.app`**  
  Current NocoBase application instance. Can be used to access global services, plugins, or configuration.  
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  Database service instance, provides interfaces for operating on models (Collections).  
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  Current plugin instance, can be used to access plugin custom methods.  
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  Sequelize instance, can directly execute raw SQL or transaction operations.  
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  Sequelize's QueryInterface, commonly used to modify table structures, such as adding fields, deleting tables, etc.  
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Writing Migration Example

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Use queryInterface to add field
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // Use db to access data models
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // Execute plugin custom method
    await this.plugin.customMethod();
  }
}
```

In addition to the common properties listed above, Migration also provides rich APIs. For detailed documentation, see [Migration API](/api/server/migration).

## Trigger Migration

Migration execution is triggered by the `nocobase upgrade` command:

```bash
$ yarn nocobase upgrade
```

During upgrade, the system will determine execution order based on Migration type and `appVersion`.

## Testing Migration

In plugin development, it's recommended to use **Mock Server** to test whether migration executes correctly, avoiding damage to real data.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // Plugin name
      version: '0.18.0-alpha.5', // Version before upgrade
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // Write verification logic, such as checking if field exists, if data migration succeeded
  });
});
```

> Tip: Using Mock Server can quickly simulate upgrade scenarios and verify Migration execution order and data changes.

## Development Practice Recommendations

1. **Split Migration**  
   Try to generate one migration file per upgrade, to maintain atomicity and simplify troubleshooting.

2. **Specify Execution Timing**  
   Choose `beforeLoad`, `afterSync`, or `afterLoad` based on operation objects, avoid depending on unloaded modules.

3. **Handle Versioning**  
   Use `appVersion` to clearly specify the version applicable to the migration to prevent repeated execution.

4. **Test Coverage**  
   Verify the migration on a Mock Server before executing the upgrade in a real environment.

