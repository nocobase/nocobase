# Collection

## 构造函数

**签名**

* `new Collection(options: CollectionOptions): Collection`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.name` | `string` | - | collection 标识 |
| `options.tableName?` | `string` | - | 数据库表名 |
| `options.fields?` | `FieldOptions[]` | - | 字段定义 |
| `options.model?` | `string \| ModelCtor<Model>` | - | Sequelize 的 Model 类型，如果使用的是 `string`，则需要调用之前在 db 上注册过该模型名称 |
| `options.repository?` | `string \| RepositoryType` | - | 集合仓库类型 |
| `sortable` | `string \| boolean \| { name?: string; scopeKey?: string }` | - | 数据可排序字段配置，默认不排序 |
