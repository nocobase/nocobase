---
title: "Collections"
description: "NocoBase plugin Collection definition: defineCollection, extendCollection, fields, src/server/collections directory conventions."
keywords: "Collections,defineCollection,extendCollection,data tables,Collection definition,NocoBase"
---

# Collections

In NocoBase plugin development, **Collection (data table)** is one of the core concepts. You can add or modify data table structures in plugins by defining or extending Collections. Unlike data tables created through the "Data Source Management" interface, **Collections defined in code are usually system-level metadata tables** and won't appear in the data source management list.

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

:::tip Tip

The conventional directory will complete loading before all plugins' `load()` methods execute, thus avoiding dependency issues caused by some data tables not being loaded.

:::

## Field Type Quick Reference

In `defineCollection`'s `fields`, `type` determines the column type of the field in the database. Below are all built-in field types:

### Text

| type | Database Type | Description | Specific Parameters |
|------|--------------|-------------|---------------------|
| `string` | VARCHAR(255) | Short text | `length?: number` (custom length), `trim?: boolean` |
| `text` | TEXT | Long text | `length?: 'tiny' \| 'medium' \| 'long'` (MySQL only) |

### Number

| type | Database Type | Description | Specific Parameters |
|------|--------------|-------------|---------------------|
| `integer` | INTEGER | Integer | -- |
| `bigInt` | BIGINT | Big integer | -- |
| `float` | FLOAT | Float | -- |
| `double` | DOUBLE | Double precision float | -- |
| `decimal` | DECIMAL(p,s) | Fixed-point number | `precision: number`, `scale: number` |

### Boolean

| type | Database Type | Description |
|------|--------------|-------------|
| `boolean` | BOOLEAN | Boolean value |

### DateTime

| type | Database Type | Description | Specific Parameters |
|------|--------------|-------------|---------------------|
| `date` | DATE(3) | DateTime (with milliseconds) | `defaultToCurrentTime?`, `onUpdateToCurrentTime?` |
| `dateOnly` | DATEONLY | Date only, no time | -- |
| `time` | TIME | Time only | -- |
| `unixTimestamp` | BIGINT | Unix timestamp | `accuracy?: 'second' \| 'millisecond'` |

:::tip Tip

`date` is the most commonly used date type. If you need to differentiate timezone handling, there are also `datetimeTz` (with timezone) and `datetimeNoTz` (without timezone) available.

:::

### Structured Data

| type | Database Type | Description | Specific Parameters |
|------|--------------|-------------|---------------------|
| `json` | JSON / JSONB | JSON data | `jsonb?: boolean` (use JSONB under PostgreSQL) |
| `jsonb` | JSONB / JSON | Prefer JSONB | -- |
| `array` | ARRAY / JSON | Array | Native ARRAY type available under PostgreSQL |

### ID Generation

| type | Database Type | Description | Specific Parameters |
|------|--------------|-------------|---------------------|
| `uid` | VARCHAR(255) | Auto-generated short ID | `prefix?: string` |
| `uuid` | UUID | UUID v4 | `autoFill?: boolean` (default true) |
| `nanoid` | VARCHAR(255) | NanoID | `size?: number` (default 12), `customAlphabet?: string` |
| `snowflakeId` | BIGINT | Snowflake ID | `autoFill?: boolean` (default true) |

### Special Types

| type | Database Type | Description |
|------|--------------|-------------|
| `password` | VARCHAR(255) | Auto salted hash storage |
| `virtual` | No actual column | Virtual field, no column created in database |
| `context` | Configurable | Auto-populated from request context (e.g. `currentUser.id`) |

### Relation Types

Relation fields do not create database columns; instead, they establish inter-table relationships at the ORM layer:

| type | Description | Key Parameters |
|------|-------------|----------------|
| `belongsTo` | Many-to-one | `target` (target table), `foreignKey` (foreign key field) |
| `hasOne` | One-to-one | `target`, `foreignKey` |
| `hasMany` | One-to-many | `target`, `foreignKey` |
| `belongsToMany` | Many-to-many | `target`, `through` (junction table), `foreignKey`, `otherKey` |

Usage example for relation fields:

```ts
export default defineCollection({
  name: 'articles',
  fields: [
    { type: 'string', name: 'title' },
    // Many-to-one: article belongs to one author
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
    },
    // One-to-many: article has many comments
    {
      type: 'hasMany',
      name: 'comments',
      target: 'comments',
      foreignKey: 'articleId',
    },
    // Many-to-many: article has many tags
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags',
      through: 'articlesTags',  // junction table name
    },
  ],
});
```

### Common Parameters

All column fields support the following parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Field name (required) |
| `defaultValue` | `any` | Default value |
| `allowNull` | `boolean` | Whether null is allowed |
| `unique` | `boolean` | Whether unique |
| `primaryKey` | `boolean` | Whether primary key |
| `autoIncrement` | `boolean` | Whether auto-increment |
| `index` | `boolean` | Whether to create index |
| `comment` | `string` | Field comment |

## Synchronizing Database Structure

When a plugin is first activated, the system will automatically synchronize Collection configurations with the database structure. If the plugin is already installed and running, after adding or modifying Collections, you need to manually execute the upgrade command:

```bash
yarn nocobase upgrade
```

If exceptions or dirty data occur during synchronization, you can rebuild the table structure by reinstalling the application:

```bash
yarn nocobase install -f
```

If you need to migrate existing data during plugin upgrades -- such as renaming fields, splitting tables, backfilling default values, etc. -- you should handle it through [Migration](./migration.md) scripts rather than manually modifying the database.

## Making a Collection Appear in the UI Data Table List

Collections defined via `defineCollection` are internal server-side tables and by default **will not appear** in the "Data Source Management" list, nor in the data table selection list when "Adding a Block."

**Recommended approach**: Add the corresponding data table in the NocoBase "[Data Source Management](../../data-sources/data-source-main/)" interface. After configuring the fields and interface types, the table will automatically appear in the block's data table selection list.

![Selectable when adding a block](https://static-docs.nocobase.com/20260409143839.png)

If you really need to register in plugin code (e.g. for demo scenarios in example plugins), you can manually register via `addCollection` in the client-side plugin. Note that you must register through the `eventBus` pattern, not directly in `load()` -- `ensureLoaded()` will clear and re-set all collections after `load()`. For a complete example, see [Building a Fullstack Data Management Plugin](../client/examples/fullstack-plugin.md).

## Auto-generating Resources

After defining a Collection, NocoBase will automatically generate corresponding REST API resources with out-of-the-box CRUD endpoints (`list`, `get`, `create`, `update`, `destroy`) without additional code. If the built-in CRUD operations are not sufficient -- for example, you need a "batch import" or "aggregation statistics" endpoint -- you can register custom actions via `resourceManager`. See [ResourceManager](./resource-manager.md) for details.

## Related Links

- [Database](./database.md) -- CRUD, Repository, transactions, and database events
- [DataSourceManager](./data-source-manager.md) -- Managing multiple data sources and their collections
- [Migration](./migration.md) -- Data migration scripts for plugin upgrades
- [Plugin](./plugin.md) -- Plugin class lifecycle, member methods, and the `app` object
- [ResourceManager](./resource-manager.md) -- Custom REST API and action handlers
- [Building a Fullstack Data Management Plugin](../client/examples/fullstack-plugin.md) -- Complete example with defineCollection + addCollection
- [Project Directory Structure](../project-structure.md) -- `src/server/collections` directory conventions

