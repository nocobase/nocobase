# 数据库迁移

应用在业务发展或版本升级过程中，某些情况会需要修改数据库表或字段等信息，为保证安全无冲突且可回溯的解决数据库变更，通常的做法是使用数据库迁移的方式完成。

## 介绍

Nocobase 基于 npm 包 [Umzug](https://www.npmjs.com/package/umzug) 处理数据库迁移。并将相关功能集成在命令行的子命令 `nocobase migrator` 中，大部分操作通过该命令处理。

### 仅增加表或字段无需迁移脚本

通常如果只是增加数据表或增加字段，可以不使用数据库迁移脚本，而是直接修改数据表定义（`collection`）的内容即可。例如文章表定义（`collections/posts.ts`）初始状态：

```ts
export default {
  name: 'posts',
  fields: [
    {
      name: 'title',
      type: 'string',
    }
  ]
}
```

当需要增加一个分类字段时，直接修改原来的表结构定义文件内容：

```ts
export default {
  name: 'posts',
  fields: [
    {
      name: 'title',
      type: 'string',
    },
    {
      name: 'category',
      type: 'belongsTo'
    }
  ]
}
```

当新版本代码在环境中调用升级命令时，新的字段会以 Sequelize 中 sync 的逻辑自动同步到数据库中，完成表结构变更。

### 创建迁移文件

如果表结构的变更涉及到字段类型变更、索引调整等，需要人工创建迁移脚本文件：

```bash
yarn nocobase migrator create --name change-some-field.ts --folder path/to/migrations
```

该命令会在 `path/to/migrations` 目录中创建一个基于时间戳的迁移脚本文件 `YYYY.MM.DDTHH.mm.ss.change-some-field.ts`，内容如下：

```ts
import { Migration } from '@nocobase/server';

export default class MyMigration extends Migration {
  async up() {
    // TODO
  }

  async down() {
    // TODO
  }
}
```

脚本导出的主类相关 API 可以参考 [`Migration` 类](/api/server/migration)。

### 数据库操作内容

`up()`、`down()` 是一对互逆操作，升级时会调用 `up()`，降级时会调用 `down()`。大部分情况我们主要考虑升级操作。

在升级中我们有几种方式进行数据库变更：

```ts
import { Migration } from '@nocobase/server';

export default class MyMigration extends Migration {
  async up() {
    // 1. 针对自行管理的静态数据表，调用 Sequelize 提供的 queryInterface 实例上的方法
    await this.queryInterface.changeColumn('posts', 'title', {
      type: DataTypes.STRING,
      unique: true // 添加索引
    });

    // 2. 针对被 collection-manager 插件管理的动态数据表，调用插件提供的 collections / fields 表的数据仓库方法
    await this.db.getRepository('fields').update({
      values: {
        collectionName: 'posts',
        name: 'title',
        type: 'string',
        unique: true // 添加索引
      }
    });
  }
}
```

### 数据变更

除了表结构变更，也可以在迁移过程中导入需要的数据，或对数据进行调整：

```ts
import { Migration } from '@nocobase/server';

export default class MyMigration extends Migration {
  async up() {
    await this.sequelize.transaction(async transaction => {
      const defaultCategory = await this.db.getRepository('categories').create({
        values: {
          title: '默认分类'
        },
        transaction
      });

      await this.db.getRepository('posts').update({
        filter: {
          categoryId: null
        },
        values: {
          categoryId: defaultCategory.id
        },
        transaction
      });
    });
  }
}
```

在一个脚本中有多项数据库操作时，建议使用事务保证所有操作都成功才算迁移完成。

### 执行升级

迁移脚本准备好以后，在项目目录下执行对应的升级命令即可完成数据库变更：

```bash
yarn nocobase upgrade
```

根据数据库迁移的机制，迁移脚本执行成功后也会被记录在数据库的升级记录表中，只有第一次执行有效，之后的多次重复执行都会被忽略。

## 示例

### 修改主键字段类型

假设订单表一开始使用数字类型，但后期希望改成可以包含字母的字符串类型，我们可以在迁移文件中填写：

```ts
import { Migration } from '@nocobase/server';

export default class MyMigration extends Migration {
  async up() {
    await this.sequelize.transaction(async transaction => {
      await this.queryInterface.changeColumn('orders', 'id', {
        type: DataTypes.STRING
      }, {
        transaction
      });
    });
  }
}
```

注：修改字段类型只有在未加入新类型数据之前可以进行逆向降级操作，否则需要自行备份数据并对数据进行特定处理。

另外，直接修改数据表主键 `id` 的类型在某些数据库中会提示错误（SQLite 正常，PostgreSQL 失败）。这时候需要把相关操作分步执行：

1. 创建一个新的字符串类型字段 `id_new；`
2. 复制原有表 `id` 的数据到新的字段；
3. 移除原有 `id` 主键约束；
4. 将原有 `id` 列改名为不使用的列名 `id_old`；
5. 将新的 `id_new` 列改名为 `id`；
6. 对新的 `id` 列增加主键约束；

```ts
import { Migration } from '@nocobase/server';

export default class MyMigration extends Migration {
  async up() {
    await this.sequelize.transaction(async transaction => {
      await this.queryInterface.addColumn('orders', 'id_new', {
        type: DataTypes.STRING
      }, { transaction });

      const PendingOrderModel = this.sequelize.define('orders', {
        id_new: DataTypes.STRING
      });

      await PendingOrderModel.update({
        id_new: col('id')
      }, {
        where: {
          id: { [Op.not]: null }
        },
        transaction
      });

      await this.queryInterface.removeConstraint('orders', 'orders_pkey', { transaction });

      await this.queryInterface.renameColumn('orders', 'id', 'id_old', { transaction });

      await this.queryInterface.renameColumn('orders', 'id_new', 'id', { transaction });

      await this.queryInterface.addConstraint('orders', {
        type: 'PRIMARY KEY',
        name: 'orders_pkey',
        fields: ['id'],
        transaction
      });
    });
  }
}
```

通常修改列类型在已存在数据量较大的表里操作时也建议用新列代替旧列的方式，性能会更好。其他更多细节可以参考 [Sequelize 的 `queryInterface` API](https://sequelize.org/api/v6/class/src/dialects/abstract/query-interface.js)，以及各个数据库引擎的细节。

注：在执行升级命令后，应用启动之前请确保变更的表结构能够对应上 collections 中定义的内容，以免不一致导致错误。
