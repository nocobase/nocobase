# RelationRepository

`RelationRepository` 是关系类型的 `Repository` 对象，`RelationRepository` 可以实现在不加载关联的情况下对关联数据进行操作。基于 `RelationRepository`，每种关联都派生出对应的实现，分别为

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## 构造函数

**签名**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**参数**

| 参数名             | 类型               | 默认值 | 描述                                                      |
| ------------------ | ------------------ | ------ | --------------------------------------------------------- |
| `sourceCollection` | `Collection`       | -      | 关联中的参照关系（referencing relation）对应的 Collection |
| `association`      | `string`           | -      | 关联名称                                                  |
| `sourceKeyValue`   | `string \| number` | -      | 参照关系中对应的 key 值                                   |

## 基类属性

### `db: Database`

数据库对象

### `sourceCollection`

关联中的参照关系（referencing relation）对应的 Collection

### `targetCollection`

关联中被参照关系（referenced relation）对应的 Collection

### `association`

sequelize 中的与当前关联对应的 association 对象

### `associationField`

collection 中的与当前关联对应的字段

### `sourceKeyValue`

参照关系中对应的 key 值
