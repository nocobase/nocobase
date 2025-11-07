**参数**

| 参数名                 | 类型          | 默认值 | 描述                                            |
| ---------------------- | ------------- | ------ | ----------------------------------------------- |
| `options.values`       | `M`           | `{}`   | 插入的数据对象                                  |
| `options.whitelist?`   | `string[]`    | -      | `values` 字段的白名单，只有名单内的字段会被存储 |
| `options.blacklist?`   | `string[]`    | -      | `values` 字段的黑名单，名单内的字段不会被存储   |
| `options.transaction?` | `Transaction` | -      | 事务                                            |
