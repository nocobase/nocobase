# Collection protocol

Collection is the backbone of NocoBase, a protocol for describing data structures (collections and fields), very close to the concept of a relational database, but not limited to relational databases, but can also be a data source for NoSQL databases, HTTP APIs, etc.

<img src="./schema.svg" style="max-width: 800px;" >

At this stage, the Collection protocol is based on the relational database interface (db.collections), and data sources such as NoSQL databases and HTTP APIs will be implemented gradually in the future.

Collection protocol mainly includes two parts: CollectionOptions and FieldOptions. Because Field is extensible, the parameters of FieldOptions are very flexible.

## CollectionOptions

```ts
interface CollectionOptions {
  name: string;
  title?: string;
  // Tree structure table, TreeRepository
  tree?: 'adjacency-list' | 'closure-table' | 'materialized-path' | 'nested-set';
  // parent-child inheritance
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

Generic field parameters

```ts
interface FieldOptions {
  name: string;
  type: string;
  hidden?: boolean;
  index?: boolean;
  interface?: string;
  uiSchema?: ISchema;
```

[Introduction to UI Schema here](/development/client/ui-schema-designer/what-is-ui-schema)

### Field Type

Field Type includes Attribute Type and Association Type.

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

- linkTo - `type: 'believesToMany'`
- oho - `type: 'hasOne'`
- obo - `type: 'believesTo'`
- o2m - `type: 'hasMany'`
- m2o - `type: 'believesTo'`
- m2m - `type: 'believesToMany'`

**Advanced**

- formula
- sequence

**System info**

- id
- createdAt
- createdBy
- updatedAt
- updatedBy
