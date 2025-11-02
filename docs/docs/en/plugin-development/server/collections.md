# Collections

In NocoBase plugin development, the **Collection** is one of the most core concepts. You can add or modify collection structures within a plugin by defining or extending a Collection. Unlike collections created through the data source management interface, **Collections defined in code are typically system-level metadata tables** and will not appear in the data source management list.

## Define a Collection

According to the conventional directory structure, Collection files should be placed in the `./src/server/collections` directory. Use `defineCollection()` to create a new collection, and `extendCollection()` to extend an existing one.

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

- `name`: The collection name (a table with the same name will be automatically generated in the database).
- `title`: The display name of the collection in the interface.
- `fields`: A collection of fields, where each field includes properties like `type` and `name`.

When you need to add fields to or modify the configuration of a Collection from another plugin, you can use `extendCollection()`:

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

After activating the plugin, the system will automatically add the `isPublished` field to the existing `articles` collection.

:::tip
The conventional directory structure is loaded before the `load()` method of any plugin is executed, thus avoiding dependency issues caused by some collections not being loaded yet.
:::

## Synchronize Database Schema

When a plugin is activated for the first time, the system automatically synchronizes the Collection configuration with the database schema. If the plugin is already installed and running, you need to manually run the upgrade command after adding or modifying a Collection:

```bash
yarn nocobase upgrade
```

If an exception or dirty data occurs during synchronization, you can rebuild the table structure by reinstalling the application:

```bash
yarn nocobase install -f
```

## Automatic Resource Generation

After defining a Collection, the system automatically generates a corresponding Resource for it, allowing you to perform CRUD operations on this resource directly via the API. For details, see [Resource Manager](./resource-manager.md).