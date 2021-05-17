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

### date

日期，包括时间

### dateonly

日期，不包括时间

### time

时间

### json <Badge>待完善</Badge>

JSON 是个特殊的数据类型，在不同数据库里有所不同，目前只兼容了 PostgreSQL 的一些情况。

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

### registerField(type: string, field: Field)

- type：字段类型，不区分大小写
- field：字段类

注册字段

### registerFields

批量注册字段，用法同 registerField

### getField

获取已注册字段类

<Alert title="注意" type="warning">
虽然直接通过 import/require 可以引用已导出的字段类型，但是更推荐用 getField 来处理，尤其在插件化的场景下。
</Alert>

```ts
import CustomField from './CustomField';

registerFields({ CustomField });

// 以下三种写法最终效果一致，区别在于用 getField 只能获取已注册的字段类型
import CustomField from './CustomField';
const CustomField = require('./CustomField');
// CustomField 只是 key，真实的类由 registerFields 控制
const CustomField = getField('CustomField');
```

### registerModel

注册 Model

```ts
import { Model, registerModel } from '@nocobase/database';

class Test extends Model {
  // 在这个类里可以为 Test Model 扩展其他 API
  static hello() {

  }
}

registerModel('test', Test);

db.table({
  name: 'tests',
  model: 'test',
});

const Test = db.getModel('tests');
// Test 可以调用 hello 方法了
Test.hello();
```

### registerModels

批量注册 Model，用法同 registerModel

### getRegisteredModel

获取已注册字段类型

### extend <Badge>实验性</Badge>

扩展配置的语法糖，需要与 database.import 配合使用，extend 的用法参考 [database.extend](#databaseextend)。 table 配置只有 extend 时，不处理。

如某配置文件 `./path1/foos-extends.ts`

```ts
import { extend } from '@nocobase/database';

export default extend({
  name: 'foos',
  fields: [],
});
```

导入配置

```ts
database.import({
  directory: '/path1',
});

// foos 只有 extend 配置文件，不导入处理
database.isDefined('foos'); // false
```

### Operator.register <Badge>实验性</Badge> <Badge>待完善</Badge>

注册自定义 op

### database.constructor

初始化实例

```ts
const db = new Database({
  username,
  password,
  database,
  host,
  port,
  dialect,
  dialectOptions,
  pool,
  logging,
  define,
  sync,
});
```

更多用法参考 [Sequelize.Options](https://github.com/sequelize/sequelize/blob/5b16b32259f0599a6af2d1eb625622da9054265e/types/lib/sequelize.d.ts#L180)

### database.import

- directory：文件夹路径
- extensions：扩展，默认 `['js', 'ts', 'json']`

批量导入配置

```ts
database.import({
  directory: '/path1/tables',
  extensions: ['js', 'ts', 'json'],
});
```

### database.table

- name：表名
- fields：字段
- model：绑定自定义的 Model

更多参数查看 [TableOptions](https://github.com/nocobase/nocobase/blob/bbcd31016913b1297f258786df97b237d9fbd977/packages/database/src/table.ts#L48)（继承 [Sequelize.ModelOptions](https://github.com/sequelize/sequelize/blob/5b16b32259f0599a6af2d1eb625622da9054265e/types/lib/model.d.ts#L1361)）

配置数据表

用例：

```ts
database.table({
  name: 'demos',
  fields: [],
});
```

### database.extend

配置扩展。更多用法参考 [table.extend](#tableextend)

```ts
db.table({
  name: 'foos',
  fields: [
    {type: 'string', name: 'name'},
  ],
});

db.extend({
  name: 'foos',
  fields: [
    {type: 'string', name: 'content'},
  ],
});
```

<Alert title="database.table 与 database.extend 区别？" type="warning">
database.table 用于初始化，database.extend 用于处理扩展，需要 table 已存在。
</Alert>

### database.isDefined

判断数据表是否已定义

### database.getModel

获取已定义的 Model

```ts
database.table({
  name: 'posts',
  fields: [
    {type: 'string', name: 'title'},
    {type: 'string', name: 'content'},
  ],
});

const Post = database.getModel('posts');

await Post.create({
  title: 't1',
  content: 'c1',
})
```

### database.getModels

批量获取已定义的 Models

```ts
const [User, Post] = database.getModels(['users', 'posts']);
```

### database.getTable

获取已定义的 Table

```ts
const table = database.getTable('posts');
```

### database.getTables

批量获取已定义的 Tables

```ts
const [user, post] = database.getTables(['users', 'posts']);
```

### database.sync

- tables：与数据库结构同步的表

数据表配置与数据库表结构同步

```ts
await db.sync({
  tables: ['users', 'posts'],
});
```

更多参数参考 [Sequelize.sync](https://github.com/sequelize/sequelize/blob/5b16b32259f0599a6af2d1eb625622da9054265e/types/lib/sequelize.d.ts#L45)

<Alert title="database.sync、table.sync、sequelize.sync、Model.sync 区别？" type="warning">

- database.sync：所有已配置表同步，可以指定 tables 范围
- table.sync：当前表同步，如果有关系字段，关系表也会处理
- sequelize.sync：所有 sequelize.models 同步
- Model.sync 只处理某个 Model.attributes 同步，并不处理关系 Model 的情况

</Alert>

### database.close

关闭数据库连接

```ts
await database.close();
```

### database.addHook  <Badge>待完善</Badge>

为数据表配置提供的钩子，目前 HookType 有：

- beforeTableInit
- afterTableInit
- beforeAddField
- afterAddField

<Alert title="注意" type="warning">

目前这部分的 api 主要用于弥补数据表配置的事件，长远来看还需要继续完善的有：

- 统一 hook 接口（Table 和 Model）
- 钩子需要支持优先级（顺序）

</Alert>

### database.runHooks  <Badge>待完善</Badge>

运行当前钩子挂载的函数

### table.getOptions

获取数据表配置

```ts
const options = table.getOptions();
const fields = table.getOptions('fields');
```

### table.getModel

获取当前配置表对应的 Model

### table.hasField

判断字段是否存在

### table.getField

获取已配置字段

### table.addField

新增字段（附加操作），字段的配置参考 [Field Types](#field-types)

```ts
const table = db.table({
  name: 'foos',
});

table.addField({type: 'string', name: 'name'});
table.addField({type: 'string', name: 'status'});
```

### table.setFields

批量新增字段（替换操作）

### table.getFields

获取当前表字段列表

### table.addIndex

建立索引

### table.addIndexes

批量建立索引，同 table.addIndex

### table.extend(tableOptions: TableOptions, mergeOptions?: MergeOptions)

- tableOptions：表配置
- mergeOptions：自定义合并规则，非必填，参数参考 [deepmerge](https://www.npmjs.com/package/deepmerge#options)

配置扩展

```ts
table.extend({
  // 与 table.table 一致
}, {
  // 自定义
  arrayMerge,
  customMerge,
})
```

<Alert title="table.extend、database.extend、extend 区别？" type="warning">

- table.extend：用于处理当前表扩展
- database.extend：需要指定 tableName，其他用法同 table.extend
- extend：Markup 函数，只用于标记哪些配置用于扩展，用于 database.import 的配置文件中，用法同 database.extend

</Alert>

### table.sync <Badge>待完善</Badge>

当前表配置与数据库表结构同步

更多参数参考 [Sequelize.sync](https://github.com/sequelize/sequelize/blob/5b16b32259f0599a6af2d1eb625622da9054265e/types/lib/sequelize.d.ts#L45)

```ts
await table.sync({})
```

<Alert title="注意">

因为没有更细度的 field.sync 所以配置有更新时，直接执行 table.sync，如果 table 里存在关系字段，关系表也会执行 sync 可能导致执行时间超时，数据库连接断开。后续需要提供更细度的 field.sync 以减少不必要的性能消耗。

</Alert>

### Model.database

获取当前 database 实例

### Model.parseApiJson <Badge>待完善</Badge>

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

#### page

当前分页

#### perPage

每页多少条数据，当 `perPage=-1` 时，输出所有数据，最多不超过 500 条

#### context

注入上下文，目前主要用于处理 filter 的动态参数

### model.database

获取当前 database 实例

### model.updateAssociations <Badge>待完善</Badge>

更新关系数据

```ts
const user = User.create({});
const post = Post.create({});
await post.updateAssociations({
  // 支持直接提供外键值，一般为 Model.primaryKeyAttribute
  user: 1,
  // 或者是 object 对象，如果数据不存在会直接创建
  user: {
    name: 'name1',
  },
  // 也可以是 model 对象
  user,
  // 如果是 hasMany 或 belongsToMany 关系，可以是上面三种写法，也可以是数组类型
  categories: 1,
  tags: [
    1,
    {name: 'tag2'}, // object
    tag, // tag 对象
  ],
  comments: [
    { content: '' },
    comment, // comment model 对象
  ]
});
```

<Alert title="为什么需要 model.updateAssociations？">

关系数据的新增或更新非常复杂，尤其在表单场景里非常受用。

注意：还需要支持仅关联和可新增或更新关系数据两种情况。

- 仅关联：只建立关系，不更新关系数据内容
- 可新增或更新关系数据：建立关联的同时，更新关系数据内容

</Alert>

### model.getValuesByFieldNames <Badge>待完善</Badge>

获取当前 model 在 scope 范围内的值

如，某 model 的 dataValues 如下：

```ts
{
  id: 1,
  status: 'publish',
  user: { // 关系数据，可能需要异步获取
    id: 1,
    email: 'admin@example.com'
  },
}
```

```ts
await model.getValuesByFieldNames(['status', 'user.email']);

// 理想化输出的结果为：
{
  status: 'publish',
  'user.email': 'admin@example.com',
}
```

可能用于与 filter 进行比较

```ts
compareFilterWithScope(
  {
    and: [{ status: 'publish' }]
  },
  {
    status: 'publish',
    'user.email': 'admin@example.com',
  }
); // => true
```