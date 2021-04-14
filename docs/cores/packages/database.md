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

```ts
{ type: 'boolean', name: 'agree' }
```

### integer
### float
### double
### decimal
### real
### string
### text
### json
### time
### date
### virtual
### formula
### password
### sort
### radio
### hasMany

- target
- sourceKey
- foreignKey
- targetKey

### hasOne
### belongsTo
### belongsToMany

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
### registerFields
### getField
### registerModel
### registerModels
### getRegisteredModel
### extend
### Operator.register <Badge>实验性</Badge>
### database.constructor
### database.import
### database.table
### database.extend
### database.isDefined
### database.getModel
### database.getModels
### database.getTable
### database.getTables
### database.sync
### database.close
### table.getOptions
### table.getModel
### table.hasField
### table.getField
### table.addField
### table.setFields
### table.getFields
### table.addIndex
### table.addIndexes
### table.extend
### table.sync
### Model.database
### Model.parseApiJson
### model.database
### model.updateAssociations
### model.updateAssociation
### model.updateMultipleAssociation
### model.updateSingleAssociation
### model.getValuesByFieldNames <Badge>实验性</Badge>
