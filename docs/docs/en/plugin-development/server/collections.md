# Collections

In NocoBase plugin development, **Collection (data table)** is one of the core concepts. You can add or modify data table structures in plugins by defining or extending Collections. Unlike data tables created through the data source management interface, **Collections defined in code are usually system-level metadata tables** and won't appear in the data source management list.

## Defining Data Tables

Following the conventional directory structure, Collection files should be placed in the `./src/server/collections` directory. Use `defineCollection()` to create new tables and `extendCollection()` to extend existing tables.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Sample Articles',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Title', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'Content' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Author' },
    },
  ],
});
```

In the example above:

- `name`: Table name (a table with the same name will be automatically generated in the database).
- `title`: Display name of the table in the interface.
- `fields`: Field collection, each field contains `type`, `name`, and other attributes.

When you need to add fields or modify configurations for other plugins' Collections, you can use `extendCollection()`:

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

After activating the plugin, the system will automatically add the `isPublished` field to the existing `articles` table.

:::tip
The conventional directory will complete loading before all plugins' `load()` methods execute, thus avoiding dependency issues caused by some data tables not being loaded.
:::

## Synchronizing Database Structure

When a plugin is first activated, the system will automatically synchronize Collection configurations with the database structure. If the plugin is already installed and running, after adding or modifying Collections, you need to manually execute the upgrade command:

```bash
yarn nocobase upgrade
```

If exceptions or dirty data occur during synchronization, you can rebuild the table structure by reinstalling the application:

```bash
yarn nocobase install -f
```

## Auto-generating Resources

After defining a Collection, the system will automatically generate a corresponding Resource, on which you can directly perform CRUD operations via API. See [Resource Manager](./resource-manager.md).

