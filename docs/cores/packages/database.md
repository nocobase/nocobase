---
title: '@nocobase/database'
order: 1
# toc: menu
group: 
  order: 1
  title: 核心库
---

# @nocobase/database

## 介绍

用于配置数据表（Table），提供数据操作（Model），可单独使用。核心主要有两个东西：

- Table：描述数据的类型、结构和关系
- Model：数据库操作

<Alert title="Table 和 Model 的关系" type="warning">
Model 是动态的，由 Table 初始化，一般并不需要单独配置。Model 目前已经适配了 Sequelize.Model，如果需要，后续还可以适配 Mongoose.Model 等。Table 也可以更进一步抽象，提供更灵活的适配方法。
</Alert>

## 安装

```bash
yarn add @nocobase/database
```

## Usage

```ts
import Database from '@nocobase/database';

const db = new Database({
  // 省略配置信息
});

const table = db.table({
  name: 'posts',
  fields: [
    { type: 'string', name: 'title' },
  ],
});

table.addField({ type: 'text', name: 'content' });

await table.sync();

const Post = db.getModel('posts');

const post = await Post.create({
  title: '这是标题',
  content: '这是内容',
});
```

## Field Types

<Alert title="注意" type="warning">
在 NocoBase 里，Field Type 表示字段的数据类型。
</Alert>

在 JSON 里，数据有六种基本类型：

- boolean
- string
- number
- object
- array
- null

其中表示数据的结构有两种：

- object
- array

两种结构可以内嵌，再结合其他数据类型，可以呈现出无数种结构化的数据。JSON 数据是可以直接储存的，但是可能会产生冗余，所以在关系型数据库的设计规范中，会根据需要把 object 或 array 的数据存放在另一张表里，然后通过主外键字段建立关联。在关系型数据库里，数据有四种基本关系：

- O2O/hasOne - 一对一
- O2M/hasMany - 一对多
- M2O/belongsTo - 多对一
- M2M/belongsToMany - 多对多
- Polymorphic - 多态（反模式）

字段的数据类型（Field Type）也由此扩展而来，以下为 JSON 类型与字段数据类型的对应关系：

- boolean：boolean
- string：string、text、time、date
- number：integer、float、double、decimal、real
- object：hasOne、belongsTo
- array：hasMany、belongsToMany
- null：不填写时为空，需要区分空字符串
- json：一种特殊的数据类型，即使是根节点也可以存任意类型数据

除此之外，字段类型还提供了 virtual 的情况，是一种虚拟字段

### boolean

布尔型

### integer

整型

### float

单精度浮点型

### double

双精度浮点型

### decimal

货币类型

### string

字符串

### text

长文本

### json <Badge>待完善</Badge>

JSON 是个特殊的数据类型，在不同数据库里有所不同，目前只兼容了 PostgreSQL 的一些情况。

### time

时间

### date

日期

### virtual

虚拟字段

```ts
interface VirtualOptions {

  name: string;

  type: 'virtual';

  get?(this: M): unknown;

  set?(this: M, val: unknown): void;
}
```

### formula <Badge>待完善</Badge>

计算公式，一种特殊的虚拟字段

```ts
interface FormulaOptions {

  name: string;

  type: 'formula';

  /**
   * 计算公式
   */
  formula: string;

  /**
   * 输出格式
   */
  format: 'string' | 'number';
}
```

### reference <Badge>未实现</Badge>

引用

```ts
interface ReferenceOptions {

  name: string;

  type: 'reference';

  /**
   * 数据路径
   */
  dataIndex: string;
}
```

### password

密码

```ts
interface PasswordOptions {

  name: string;

  type: 'password';

  /**
   * 暂时只支持 bcrypt 算法
   * 
   * 默认值：bcrypt
   */
  algo: 'bcrypt' | 'argon2';
}
```

### sort

顺序类型

```ts
interface SortOptions {

  name: string;

  type: 'sort';

  /**
   * 限定范围
   */
  scope?: string[];

  /**
   * 新值创建策略
   * 
   * max: 使用最大值
   * min: 使用最小值
   * 
   * Defaults to 'max'
   */
  next?: 'min' | 'max';
}
```

### radio

radio 类型

```ts
interface RadioOptions {

  name: string;

  type: 'radio';

  /**
   * 限定范围
   */
  scope?: string[];
}
```

### hasOne

一对一

```ts
interface HasManyOptions {

  type: 'hasMany';

  /**
   * 关系字段名称
   */
  name: string;

  /**
   * 目标数据表名称
   * 
   * 默认值：<name>
   */
  target?: string;

  /**
   * 目标数据表字段（外键字段）
   * 
   * 默认值：<targetName>_<targetPrimaryKeyAttribute>
   */
  foreignKey?: string;

  /**
   * 来源数据表字段（一般为主键字段）
   * 
   * 默认值：<sourcePrimaryKeyAttribute>
   */
  sourceKey?: string;
}
```

### hasMany

一对多

```ts
interface HasManyOptions {

  type: 'hasMany';

  /**
   * 关系字段名称
   */
  name: string;

  /**
   * 目标数据表名称
   * 
   * 默认值：<name>
   */
  target?: string;

  /**
   * 目标数据表字段（外键字段）
   * 
   * 默认值：<targetName>_<targetPrimaryKeyAttribute>
   */
  foreignKey?: string;

  /**
   * 来源数据表字段（一般为主键字段）
   * 
   * 默认值：<sourcePrimaryKeyAttribute>
   */
  sourceKey?: string;
}
```

### belongsTo

多对一

```ts
interface BelongsToOptions {

  type: 'belongsTo';

  /**
   * 关系字段名称
   */
  name: string;

  /**
   * 目标数据表名称
   * 
   * 默认值：<name plural>
   */
  target?: string;

  /**
   * 来源数据表字段（外键字段）
   * 
   * 默认值：<sourceName>_<sourcePrimaryKeyAttribute>
   */
  foreignKey?: string;

  /**
   * 目标数据表字段（一般为主键字段）
   * 
   * 默认值：<targetPrimaryKeyAttribute>
   */
  targetKey?: string;
}
```

### belongsToMany

多对多

```ts
interface BelongsToManyOptions {

  type: 'belongsToMany';

  /**
   * 关系字段名称
   */
  name: string;


  /**
   * 目标数据表名称
   * 
   * 默认值：<name>
   */
  target?: string;

  /**
   * 中间表名称
   * 
   * 默认值：sourceName 和 targetName 按字母顺序排序之后连接
   */
  through?: string;

  /**
   * 来源数据表字段（一般为主键字段）
   * 
   * 默认值：<sourcePrimaryKeyAttribute>
   */
  sourceKey?: string;

  /**
   * 来源数据表字段（外键字段）
   * 
   * 默认值：<sourceName>_<sourcePrimaryKeyAttribute>
   */
  foreignKey?: string;

  /**
   * 目标数据表字段（一般为主键字段）
   * 
   * 默认值：<targetPrimaryKeyAttribute>
   */
  targetKey?: string;

  /**
   * 目标数据表字段（外键字段）
   * 
   * 默认值：<targetName>_<targetPrimaryKeyAttribute>
   */
  otherKey?: string;
}
```

### 字段扩展

以密码字段为例：

```ts
import bcrypt from 'bcrypt';
import { StringOptions, FieldContext, registerFields, getField } from '@nocobase/database';

export class PASSWORD extends STRING {

  getDataType() {
    return DataTypes.STRING;
  }

  constructor(options: StringOptions, context: FieldContext) {
    super(options, context);
    const Model = context.sourceTable.getModel();
    Model.addHook('beforeCreate', PASSWORD.hash.bind(this));
    Model.addHook('beforeUpdate', PASSWORD.hash.bind(this));
  }

  static async hash(this: PASSWORD, model) {
    const { name } = this.options;
    if (!model.changed(name as any)) {
      return;
    }
    const value = model.get(name) as string;
    if (value) {
      if (value.startsWith('$2b$10$') && value.length === 60) {
        return;
      }
      const hash = await bcrypt.hash(value, 10);
      model.set(name, hash);
    } else {
      model.set(name, null);
    }
  }

  static async verify(value: string, hash: string) {
    return await bcrypt.compare(value, hash);
  }
}

registerFields({ PASSWORD });

const db = new Database({
  // 省略配置信息
});

const table = db.table({
  name: 'users',
  fields: [
    { type: 'password', name: 'password' },
  ],
});

await table.sync();

const User = db.getModel('users');

const user = User.create({
  password: '123456',
});

const Pwd = getField('password');

await Pwd.verify('123456', user.password); // true
```

## API

### registerField

注册字段

### registerFields

批量注册字段，用法同 registerField

### getField

获取已注册字段类

<Alert title="注意" type="warning">
虽然直接 import/require 已导出的字段类型也可以，但是更推荐用 getField 来处理。
</Alert>

### registerModel

注册模型

### registerModels

批量注册模型，用法同 registerModel

### getRegisteredModel

获取已注册字段类型

### extend <Badge>实验性</Badge>

与 database.import 配合使用

### Operator.register <Badge>实验性</Badge>

注册自定义 op

### database.constructor

初始化实例

### database.import

批量导入配置

### database.table

配置数据表

### database.extend

配置扩展

### database.isDefined

判断数据表是否已定义

### database.getModel

获取已定义的 Model

### database.getModels

批量获取已定义的 Models

### database.getTable

获取已定义的 Table

### database.getTables

批量获取已定义的 Tables

### database.sync

数据表配置与数据库表结构同步

### database.close

关闭数据库连接

### database.addHook  <Badge>待完善</Badge>

为数据表配置提供的钩子，目前 HookType 有：

- beforeTableInit
- afterTableInit
- beforeAddField
- afterAddField

### database.runHooks  <Badge>待完善</Badge>

运行当前钩子挂载的函数

### table.getOptions

获取数据表配置

### table.getModel

获取当前配置表对应的 Model

### table.hasField

判断字段是否存在

### table.getField

获取已配置字段

### table.addField

新增字段（附加操作）

### table.setFields

批量新增字段（替换操作）

### table.getFields

获取当前表字段列表

### table.addIndex

建立索引

### table.addIndexes

批量建立索引，同 table.addIndex

### table.extend

配置扩展

### table.sync

当前表配置与数据库表结构同步

### Model.database

获取当前 database 实例

### Model.parseApiJson

将 filter、fields、sort 等参数转换为 where、attributes、include、order 等

#### filter

过滤条件，支持两种格式

```ts
{
  filter: {
    [field: string]: {
      [operator: Op]: any,
    }
  },
}
```

逻辑运算符 - and/or：

```ts
{
  ['and'|'or']: [
    {
      [field: string]: {
        [operator: Op]: any,
      }
    },
    {
      ['and'|'or']: [
        {
          [field: string]: {
            [operator: Op]: any,
          }
        },
      ],
    },
  ],
}
```

#### fields

简单用法（同 only 用法）：

```ts
{
  fields: ['col1', 'col2'],
}
```

复杂用法：

```ts
{
  fields: {
    // 附加，一般用于关系字段（默认不输出关系字段数据）
    appends: ['col1', 'col2'],
    // 白名单
    only: ['col1', 'col2'],
    // 黑名单
    except: ['col1', 'col2'],
  },
}
```

#### sort

排序

```ts
{
  sort: [
    '-created_at', // 优先创建时间倒序
    'id' // 其次 id 正序
  ],
}
```

### model.database

获取当前 database 实例

### model.updateAssociations

更新关系数据

### model.getValuesByFieldNames <Badge>实验性</Badge>

获取当前 model 在 scope 范围内的值