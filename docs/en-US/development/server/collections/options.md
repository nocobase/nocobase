# Collection 协议

Collection 是 NocoBase 的中枢，是一种用于描述数据结构（数据表和字段）的协议，和关系型数据库的概念非常接近，但不仅限于关系型数据库，也可以是 NoSQL 数据库、HTTP API 等数据源。

<img src="./schema.svg" style="max-width: 800px;" >

现阶段基于 Collection 协议实现了关系型数据库的对接（db.collections），NoSQL 数据库、HTTP API 等数据源在未来也会逐步实现。

Collection 协议主要包括 CollectionOptions 和 FieldOptions 两部分，因为 Field 是可扩展的，所以 FieldOptions 的参数非常灵活。

## CollectionOptions

```ts
interface CollectionOptions {
  name: string;
  title?: string;
  // 树结构表，TreeRepository
  tree?: 'adjacency-list' | 'closure-table' | 'materialized-path' | 'nested-set';
  // 父子继承
  inherits?: string | string[];
  fields?: FieldOptions[];
  timestamps?: boolean;
  paranoid?: boolean;
  sortable?: CollectionSortable;
  model?: string;
  repository?: string;
  [key: string]: any;
}

type CollectionSortable = string | boolean | { name?: string; scopeKey?: string };
```

## FieldOptions

通用的字段参数

```ts
interface FieldOptions {
  name: string;
  type: string;
  hidden?: boolean;
  index?: boolean;
  interface?: string;
  uiSchema?: ISchema;
```

[UI Schema 的介绍点此查看](/development/client/ui-schema-designer/what-is-ui-schema)

### Field Type

Field Type 包括 Attribute Type 和 Association Type 两类：

**Attribute Type**

- 'boolean'
- 'integer'
- 'bigInt'
- 'double'
- 'real'
- 'decimal'
- 'string'
- 'text'
- 'password'
- 'date'
- 'time'
- 'array'
- 'json'
- 'jsonb'
- 'uuid'
- 'uid'
- 'formula'
- 'radio'
- 'sort'
- 'virtual'

**Association Type**

- 'belongsTo'
- 'hasOne'
- 'hasMany'
- 'belongsToMany'

### Field Interface

**Basic**

- input
- textarea
- phone
- email
- integer
- number
- percent
- password
- icon

**Choices**

- checkbox
- select
- multipleSelect
- radioGroup
- checkboxGroup
- chinaRegion

**Media**

- attachment
- markdown
- richText

**Date & Time**

- datetime
- time

**Relation**

- linkTo - `type: 'belongsToMany'`
- oho - `type: 'hasOne'`
- obo - `type: 'belongsTo'`
- o2m - `type: 'hasMany'`
- m2o - `type: 'belongsTo'`
- m2m - `type: 'belongsToMany'`

**Advanced**

- formula
- sequence

**System info**

- id
- createdAt
- createdBy
- updatedAt
- updatedBy
