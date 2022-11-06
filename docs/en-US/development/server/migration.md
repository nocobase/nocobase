# Database Migration

There may be some incompatible changes during the plugin update iteration, these incompatible upgrade scripts can be handled by writing migration files.

## How to add a migration file?

```ts
export class MyPlugin extends Plugin {
  load() {
    // Load a single Migration file
    this.db.addMigration();
    // Load multiple Migration files
    this.db.addMigrations();
  }
}
```

API reference.

- [db.addMigration()](/api/database#addmigration)
- [db.addMigrations()](/api/database#addmigrations)

## When to execute?

```bash
## When the app is upgraded, migrator.up() and db.sync() are executed
yarn nocobase upgrade
# Trigger migration separately
yarn nocobase migrator up
```

## When do I need to write a migration file?

It is usually used to update the system configuration stored in the database during the upgrade process. If it is just a collection configuration change, you don't need to configure migration, just execute ``yarn nocobase db:sync`` to synchronize to the database.

## Migration file

```ts
import { Migration } from '@nocobase/server';

export default class CustomMigration extends Migration {
  async up() {
    // 
  }

  async down() {
    // 
  }
}
```
