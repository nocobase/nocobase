# 数据表与字段

## 基础概念

数据建模是一个应用最底层的基础，在 NocoBase 应用中我们通过数据表（Collection）和字段（Field）来进行数据建模，并且建模也将映射到数据库表以持久化。

### Collection

Collection 是所有同类数据的集合，在 NocoBase 中对应数据库表的概念，如订单、商品、用户、评论等都可以形成 Collection 定义。不同 Collection 通过 name 区分，包含的字段由 `fields` 定义，如：

```ts
db.collection({
  name: 'posts',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'content', type: 'text' },
    // ...
  ]
});
```

定义完成后 collection 暂时只处于内存中，还需要调用 [`db.sync()`](/api/database#sync) 方法将其同步到数据库中。

### Field

对应数据库表“字段”的概念，每个数据表（Collection）都可以有若干 Fields，例如：

```ts
db.collection({
  name: 'users',
  fields: [
    { type: 'string', name: 'name' },
    { type: 'integer', name: 'age' },
    // 其他字段
  ],
});
```

其中字段名称（`name`）和字段类型（`type`）是必填项，不同字段通过字段名（`name`）区分，除 `name` 与 `type` 以外，根据不同字段类型可以有更多的配置信息。所有数据库字段类型及配置详见 API 参考的[内置字段类型列表](/api/database/field#内置字段类型列表)部分。

## 示例

对于开发者，通常我们会建立与普通数据表不同的一些功能型数据表，并把这些数据表固化成插件的一部分，并结合其他数据处理流程以形成完整的功能。

接下来我们以一个简单的在线商店插件为例来介绍如何建模并管理插件的数据表。假设你已经学习过 [编写第一个插件](/development/your-first-plugin)，我们继续在之前的插件代码上开发，只不过插件的名称从 `hello` 改为 `shop-modeling`。

### 插件中定义并创建数据表

对于一个店铺，首先需要建立一张商品的数据表，命名为 `products`。与直接调用 [`db.collection()`](/api/database#collection) 这样的方法稍有差异，在插件中我们会使用更方便的方法一次性导入多个文件定义的数据表。所以我们先为商品数据表的定义创建一个文件命名为 `collections/products.ts`，填入以下内容：

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

可以看到，NocoBase 的数据表结构定义可以直接使用标准的 JSON 格式，其中 `name` 和 `fields` 都是必填项，代表数据表名和该表中的字段定义。字段定义中与 Sequelize 类似会默认创建主键（`id`）、数据创建时间（`createdAt`）和数据更新时间（`updatedAt`）等系统字段，如有特殊需要可以以同名的配置覆盖定义。

该文件定义的数据表我们可以在插件主类的 `load()` 周期中使用 `db.import()` 引入并完成定义。如下所示：

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

同时我们为了方便测试，先暂时允许针对这几张表里的数据资源的所有访问权限，后面我们会在 [权限管理](/development/guide/acl) 中详细介绍如何管理资源的权限。

这样在插件被主应用加载时，我们定义的 `products` 表也就被加载到数据库管理实例的内存中了。同时，基于 NocoBase 约定式的数据表资源映射，在应用的服务启动以后，会自动生成对应的 CRUD HTTP API。

当从客户端请求以下 URL 时，会得到对应的响应结果：

* `GET /api/products:list`：获取所有商品数据列表
* `GET /api/products:get?filterByTk=<id>`：获取指定 ID 的商品数据
* `POST /api/products`：创建一条新的商品数据
* `PUT /api/products:update?filterByTk=<id>`：更新一条商品数据
* `DELETE /api/products:destroy?filterByTk=<id>`：删除一条商品数据

### 定义关系表和关联字段

在上面的例子中，我们只定义了一个商品数据表，但是实际上一个商品还需要关联到一个分类，一个品牌，一个供应商等等。这些关联关系可以通过定义关系表来实现，比如我们可以定义一个 `categories` 表，用来存储商品的分类，然后在商品表中添加一个 `category` 字段来关联到分类表。

新增文件 `collections/categories.ts`，并填入内容：

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

我们为 `categories` 表定义了两个字段，一个是标题，另一个是该分类下关联的所有产品的一对多字段，会在后面一起介绍。因为我们已经在插件的主类中使用了 `db.import()` 方法导入 `collections` 目录下的所有数据表定义，所以这里新增的 `categories` 表也会被自动导入到数据库管理实例中。

修改文件 `collections/products.ts`，在 `fields` 中添加一个 `category` 字段：

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

可以看到，我们为 `products` 表新增的 `category` 字段是一个 `belongsTo` 类型的字段，它的 `target` 属性指向了 `categories` 表，这样就定义了一个 `products` 表和 `categories` 表之间的多对一关系。同时结合我们在 `categories` 表中定义的 `hasMany` 字段，就可以实现一个商品可以关联到多个分类，一个分类下可以有多个商品的关系。通常 `belongsTo` 和 `hasMany` 可以成对出现，分别定义在两张表中。

定义好两张表之间的关系后，同样的我们就可以直接通过 HTTP API 来请求关联数据了：

* `GET /api/products:list?appends=category`：获取所有商品数据，同时包含关联的分类数据
* `GET /api/products:get?filterByTk=<id>&appends=category`：获取指定 ID 的商品数据，同时包含关联的分类数据
* `GET /api/categories/<categoryId>/products:list`：获取指定分类下的所有商品数据
* `POST /api/categories/<categoryId>/products`：在指定分类下创建新的商品

与一般的 ORM 框架类似，NocoBase 内置了四种关系字段类型，更多信息可以参考 API 字段类型相关的章节：

* [`belongsTo` 类型](/api/database/field#belongsto)
* [`belongsToMany` 类型](/api/database/field#belongstomany)
* [`hasMany` 类型](/api/database/field#hasmany)
* [`hasOne` 类型](/api/database/field#hasone)

### 扩展已有数据表

在上面的例子中，我们已经有了商品表和分类表，为了提供销售流程，我们还需要一个订单表。我们可以在 `collections` 目录下新增一个 `orders.ts` 文件，然后定义一个 `orders` 表：

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

为了简化，订单表与商品的关联我们只简单的定义为多对一关系，而在实际业务中可能会用到多对多或快照等复杂的建模方式。可以看到，一个订单除了对应某个商品，我们还增加了一个对应用户的关系定义，用户是 NocoBase 内置插件管理的数据表（详细参考[用户插件的代码](https://github.com/nocobase/nocobase/tree/main/packages/plugins/users)）。如果我们希望针对已存在的用户表扩展定义“一个用户所拥有的多个订单”的关系，可以在当前的 shop-modeling 插件内继续新增一个数据表文件 `collections/users.ts`，与直接导出 JSON 数据表配置不同的是，这里使用 `@nocobase/database` 包的 `extend()` 方法，进行对已有数据表的扩展定义：

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

这样，原先已存在的用户表也就拥有了一个 `orders` 关联字段，我们可以通过 `GET /api/users/<userId>/orders:list` 来获取指定用户的所有订单数据。

这个方法在扩展其他插件已定义的数据表时非常有用，使得其他已有插件不会反向依赖新的插件，仅形成单向依赖关系，方便在扩展层面进行一定程度的解耦。

### 扩展字段类型

我们在定义订单表的时候针对 `id` 字段使用了 `uuid` 类型，这是一个内置的字段类型。有时候我们也会觉得 UUID 看起来太长比较浪费空间，且查询性能不佳，希望用一个更适合的字段类型，比如一个含日期信息等复杂的编号逻辑，或者是 Snowflake 算法，我们就需要扩展一个自定义字段类型。

假设我们需要直接应用 Snowflake ID 生成算法，扩展出一个 `snowflake` 字段类型，我们可以创建一个 `fields/snowflake.ts` 文件：

```ts
import { DataTypes } from 'sequelize';
// 引入算法工具包
import { Snowflake } from 'nodejs-snowflake';
// 引入字段类型基类
import { Field, BaseColumnFieldOptions } from '@nocobase/database';

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

之后在插件主文件向数据库注册新的字段类型：

```ts
import SnowflakeField from './fields/snowflake';

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

这样，我们就可以在订单表中使用 `snowflake` 字段类型了：

```ts
export default {
  name: 'orders',
  fields: [
    {
      type: 'snowflake'
      name: 'id',
      primaryKey: true
    },
    // ...other fields
  ]
}
```

## 小结

通过上面的示例，我们基本了解了如何在一个插件中进行数据建模，包括：

* 定义数据表和普通字段
* 定义关联表和关联字段关系
* 扩展已有的数据表的字段
* 扩展新的字段类型

我们将本章所涉及的代码放到了一个完整的示例包 [packages/samples/shop-modeling](https://github.com/nocobase/nocobase/tree/main/packages/samples/shop-modeling) 中，可以直接在本地运行，查看效果。
