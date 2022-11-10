## Collections and Fields

## Basic Concepts

Data modeling is the lowest level foundation of an application. In NocoBase applications we model data through data tables (Collection) and fields (Field), and the modeling is also mapped to database tables for persistence.

### Collection

Collection is a collection of all similar data, which corresponds to the concept of database tables in NocoBase. Such as orders, products, users, comments, etc. can form a collection definition. Different collections are distinguished by name and contain fields defined by `fields`, such as

```ts
db.collection({
  name: 'posts',
  fields: [
    { name: 'title', type: 'string' }
    { name: 'content', type: 'text' },
    // ...
  ]
});
```

The collection is only in memory after the definition, you need to call the [``db.sync()`'' (/api/database#sync) method to synchronize it to the database.

### Field

Corresponding to the concept of database table "fields", each data table (Collection) can have a number of Fields, for example.

```ts
db.collection({
  name: 'users',
  fields: [
    { type: 'string', name: 'name' }
    { type: 'integer', name: 'age' }
    // Other fields
  ],
});
```

The field name (`name`) and field type (`type`) are required, and different fields are distinguished by the field name (`name`). All field types and their configurations are described in the [List of built-in field types](/api/database/field#List of built-in field types) section of the API reference.

## Example

For developers, we usually build functional collections that are different from normal collections and solidify these collections as part of the plugin and combine them with other data processing processes to form a complete functionality.

Let's take a simple online store plugin as an example to show how to model and manage the collections of the plugin. Assuming you have already learned about [Develop your first plugin](/development/your-first-plugin), we continue to build on the previous plugin code, except that the name of the plugin is changed from `hello` to `shop-modeling`.

### Define and create collections in the plugin

For a store, you first need to create a collection of products, named `products`. Instead of calling [`db.collection()`](/api/database#collection) directly, in the plugin we will use a more convenient method to import multiple files of defined data tables at once. So let's start by creating a file for the product collection definition named ``collections/products.ts`` and fill it with the following content.

```ts
export default {
  name: 'products',
  fields: [
    {
      type: 'string',
      name: 'title'
    },
    {
      type: 'integer',
      name: 'price'
    },
    {
      type: 'boolean',
      name: 'enabled'
    },
    {
      type: 'integer',
      name: 'inventory'
    }
  ]
};
```

As you can see, the collections structure definition can be used directly in standard JSON format, where `name` and `fields` are required representing the collection's name and the field definitions in the collection. Field definitions similar to Sequelize create system fields such as primary key (`id`), data creation time (`createdAt`) and data update time (`updatedAt`) by default, which can be overridden by a configuration with the same name if there is a special need.

The data table defined in this file we can introduce and complete the definition in the `load()` cycle of the main plugin class using `db.import()`. This is shown below.

```ts
import path from 'path';
import { Plugin } from '@nocobase/server';

export default class ShopPlugin extends Plugin {
  async load() {
    await this.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    this.app.acl.allow('products', '*');
    this.app.acl.allow('categories', '*');
    this.app.acl.allow('orders', '*');
  }
}
```

In the meantime, for testing purposes, we will temporarily allow all access permissions for the data in these collections, and later we will detail how to manage data permissions in [Permissions Management](/development/guide/acl).

This way, when the plugin is loaded by the main application, the `products` collection we defined is also loaded into the memory of the database management instance. At the same time, the NocoBase constraint-based resource mapping of the collections  automatically generates the corresponding CRUD HTTP API after the application's service is started.

When the following URLs are requested from the client, the corresponding responses are obtained.

* `GET /api/products:list`: Get a list of all product data
* `GET /api/products:get?filterByTk=<id>`: Get the product data for the specified ID
* `POST /api/products`: Create a new product data
* `PUT /api/products:update?filterByTk=<id>`: Update a product data
* `DELETE /api/products:destroy?filterByTk=<id>`: Delete a product data

### Defining associated collections and fields

In the above example, we only defined a product collection, but in reality a product also needs to be associated to a category, a brand, a supplier, etc. For example, we can define a `categories` collection to store the categories, and then add a `category` field to the product collection to associate it with the category collection.

Add a new file `collections/categories.ts` and fill in the content.

```ts
export default {
  name: 'categories',
  fields: [
    {
      type: 'string',
      name: 'title'
    },
    {
      type: 'hasMany',
      name: 'products',
    }
  ]
};
```

We have defined two fields for the `categories` collection, one for the title and another one-to-many field for all the products associated under that category, which will be described later. Since we have already used the `db.import()` method in the plugin's main class to import all the data table definitions under the `collections` directory, the new `categories` collection added here will also be automatically imported into the database management instance.

Modify the file `collections/products.ts`` to add a `category` field to the `fields`.

```ts
{
  name: 'products',
  fields: [
    // ...
    {
      type: 'belongsTo',
      name: 'category',
      target: 'categories',
    }
  ]
}
```

As you can see, the `category` field we added to the `products` collection is a `belongsTo` type field, and its `target` property points to the `categories` collection, thus defining a many-to-one relationship between the `products` collection and the `categories` collection. Combined with the `hasMany` field defined in the `categories` collection, we can achieve a relationship where one product can be associated to multiple categories and multiple products under one category. Usually `belongsTo` and `hasMany` can appear in pairs, defined in two separate collections.

Once the relationship between the two collections is defined, we can also request the associated data directly through the HTTP API

* `GET /api/products:list?appends=category`: Get all products data, including the associated categories data
* `GET /api/products:get?filterByTk=<id>&appends=category`: Get the product data for the specified ID, including the associated category data.
* `GET /api/categories/<categoryId>/products:list`: Get all the products under the specified category
* `POST /api/categories/<categoryId>/products`: Create a new product under the specified category

Similar to the general ORM framework, NocoBase has four built-in relational field types, for more information you can refer to the section about API field types.

* [`belongsTo` type](/api/database/field#belongsto)
* [`belongsToMany` type](/api/database/field#belongstomany)
* [`hasMany` type](/api/database/field#hasmany)
* [`hasOne` type](/api/database/field#hasone)

### Extend an existing collection

In the above example, we already have a product collection and a category collection, in order to provide the sales process we also need an order collection. We can add a new `orders.ts` file to the `collections` directory and define an `orders` collection as follows

```ts
export default {
  name: 'orders',
  fields: [
    {
      type: 'uuid',
      name: 'id',
      primaryKey: true
    },
    {
      type: 'belongsTo',
      name: 'product'
    },
    {
      type: 'integer',
      name: 'quantity'
    },
    {
      type: 'integer',
      name: 'totalPrice'
    },
    {
      type: 'integer',
      name: 'status'
    },
    {
      type: 'string',
      name: 'address'
    },
    {
      type: 'belongsTo',
      name: 'user'
    }
  ]
}
```

For the sake of simplicity, the association between the order collection and the product collection we simply define as a many-to-one relationship, while in the actual business may be used in a complex modeling approach such as many-to-many or snapshot. As you can see, an order in addition to corresponding to a commodity, we also added a relationship definition corresponding to the users, which is a collection managed by the NocoBase built-in plugins (refer to [code for users plugin](https://github.com/nocobase/nocobase/tree/main/packages/) for details plugins/users)). If we want to extend the definition of the "multiple orders owned by a user" relationship for the existing users collection, we can continue to add a new collection file `collections/users.ts` inside the current shop-modeling plugin, which is different from exporting the JSON collection directly. Unlike the direct export of a JSON, the `@nocobase/database` package's `extend()` method is used here to extend the definition of an existing collection: ``ts

```ts
import { extend } from '@nocobase/database';

export extend({
  name: 'users',
  fields: [
    {
      type: 'hasMany',
      name: 'orders'
    }
  ]
});
```

This way, the existing users table also has an `orders` associated field, and we can retrieve all the order data for a given user via `GET /api/users/<userId>/orders:list`.

This method is very useful when extending collections already defined by other plugins, so that other existing plugins do not depend on the new plugin in reverse, but only form one-way dependencies, facilitating a certain degree of decoupling at the extension level.

### Extend field types

We use `uuid` type for `id` field when we define order table, which is a built-in field type. Sometimes we may feel that UUID looks too long and waste space, and the query performance is not good, we want to use a more suitable field type, such as a complex numbering logic with date information, or Snowflake algorithm, we need to extend a custom field type.

Suppose we need to apply the Snowflake ID generation algorithm directly to extend a ``snowflake`` field type, we can create a ``fields/snowflake.ts`` file.

```ts
// Import the algorithm toolkit
import { Snowflake } from 'nodejs-snowflake';
// Import field type base class
import { DataTypes, Field, BaseColumnFieldOptions } from '@nocobase/database';

export interface SnowflakeFieldOptions extends BaseColumnFieldOptions {
  type: 'snowflake';
  epoch: number;
  instanceId: number;
}

export class SnowflakeField extends Field {
  get dataType() {
    return DataTypes.BIGINT;
  }

  constructor(options: SnowflakeFieldOptions, context) {
    super(options, context);

    const {
      epoch: custom_epoch,
      instanceId: instance_id = process.env.INSTANCE_ID ? Number.parseInt(process.env.INSTANCE_ID) : 0,
    } = options;
    this.generator = new Snowflake({ custom_epoch, instance_id });
  }
  
  setValue = (instance) => {
    const { name } = this.options;
    instance.set(name, this.generator.getUniqueID());
  };

  bind() {
    super.bind();
    this.on('beforeCreate', this.setValue);
  }

  unbind() {
    super.unbind();
    this.off('beforeCreate', this.setValue);
  }
}

export default SnowflakeField;
```

Afterwards, register the new field type into the collection in the main plugin file.

```ts
import SnowflakeField from '. /fields/snowflake';

export default class ShopPlugin extends Plugin {
  initialize() {
    // ...
    this.db.registerFieldTypes({
      snowflake: SnowflakeField
    });
    // ...
  }
}
```

This allows us to use the `snowflake` field type in the order table: 

```ts
export default {
  name: 'orders',
  fields: [
    {
      type: 'snowflake'
      name: 'id',
      primaryKey: true
    },
    // ... . other fields
  ]
}
```

## Summary

With the above example, we basically understand how to model data in a plugin, including.

* Defining collections and common fields
* Defining association collections and fields relationships
* Extending fields of an existing collections
* Extending new field types

We have put the code covered in this chapter into a complete sample package [packages/samples/shop-modeling](https://github.com/nocobase/nocobase/tree/main/packages/samples/shop-modeling), which can be run directly locally to see the results.

