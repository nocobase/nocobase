# Migration Scripts

During the development and update process of NocoBase plugins, incompatible changes may occur in the plugin's database structure or configuration. To ensure a smooth upgrade process, NocoBase provides a **Migration** mechanism to handle these changes by writing migration files. This article will provide a systematic overview of how to use and develop Migrations.

## Concept of Migration

Migrations are scripts that run automatically when a plugin is upgraded, used to solve the following issues:

- Table structure adjustments (adding new fields, modifying field types, etc.)
- Data migration (such as batch updating field values)
- Plugin configuration or internal logic updates

Migrations are executed at three different stages:

| Type | Trigger Time | Execution Scenario |
|------|----------|----------|
| `beforeLoad` | Before any plugin configurations are loaded | |
| `afterSync`  | After collection configurations are synchronized with the database (table structure has been changed) | |
| `afterLoad`  | After all plugin configurations are loaded | |

## Creating a Migration File

Migration files should be placed in the `src/server/migrations/*.ts` directory of your plugin. NocoBase provides the `create-migration` command to quickly generate a migration file.

```bash
yarn nocobase create-migration [options] <name>
```

Options

| Parameter | Description |
|------|------|
| `--pkg <pkg>` | Specify the plugin package name |
| `--on [on]`  | Specify the execution stage. Options are `beforeLoad`, `afterSync`, or `afterLoad`. |

Example

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

The generated migration file will be located at:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

The initial content of the file is:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Write your upgrade logic here
  }
}
```

> ⚠️ `appVersion` is used to identify the target version for the upgrade. This migration will run in environments with a version lower than the one specified.

## Writing a Migration

Within the migration file, you can access the following common properties and APIs via `this` to interact with the database, plugin, and application instance:

Common Properties

- **`this.app`**  
  The current NocoBase application instance. It can be used to access global services, plugins, or configurations.  
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  The database service instance, providing an interface to operate on models (Collections).  
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  The current plugin instance, which can be used to access custom methods of the plugin.  
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  The Sequelize instance, which can be used to execute raw SQL or transaction operations.  
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  Sequelize's QueryInterface, often used for modifying table structures, such as adding fields or deleting tables.  
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Migration Writing Example

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Use queryInterface to add a field
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // Use db to access the data model
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // Execute a custom method of the plugin
    await this.plugin.customMethod();
  }
}
```

In addition to the common properties listed above, Migration provides a rich set of APIs. For detailed documentation, please refer to the [Migration API](/api/server/migration).

## Triggering a Migration

Migrations are triggered by the `nocobase upgrade` command:

```bash
$ yarn nocobase upgrade
```

During an upgrade, the system determines the execution order based on the migration's type and `appVersion`.

## Testing a Migration

During plugin development, it is recommended to use a **Mock Server** to test whether the migration executes correctly, to avoid corrupting real data.

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
    // Write validation logic, e.g., check if a field exists or if data was migrated successfully
  });
});
```

> Tip: Using a Mock Server allows you to quickly simulate an upgrade scenario and verify the execution order and data changes of the migration.

## Development Best Practices

1. **Split Migrations**  
   For each upgrade, try to generate a separate migration file to maintain atomicity, which makes troubleshooting easier.
2. **Specify the Execution Stage**  
   Choose `beforeLoad`, `afterSync`, or `afterLoad` based on the operation's target to avoid dependencies on unloaded modules.
3. **Pay Attention to Versioning**  
   Use `appVersion` to clearly define the applicable version for the migration to prevent it from running repeatedly.
4. **Ensure Test Coverage**  
   Verify the migration on a Mock Server before running the upgrade in a real environment.