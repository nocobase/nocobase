# 多对多（数组）

<PluginInfo name="field-m2m-array"></PluginInfo>

## 介绍

支持在数据表中，使用数组字段保存目标表的多个唯一键，从而和目标表建立多对多关联关系。例如：有文章和标签两个实体，一篇文章可以关联多个标签，在文章表中用一个数组字段保存标签表对应记录的 ID.

:::warning{title=注意}

- 请尽可能使用中间表来建立标准的 [多对多](../data-modeling/collection-fields/associations/m2m/index.md) 关系，避免使用该种关系类型。
- 对于用数组字段建立的多对多关联关系，目前只有使用 PostgreSQL, 才支持用目标表的字段过滤源表数据。例如：在上述例子中，使用标签表的其他字段，如标题，来过滤文章。
  :::

### 字段配置

![many-to-many(array) field configuration](https://static-docs.nocobase.com/202407051108180.png)

## 参数说明

### Source collection

源表，即当前字段所在表。

### Target collection

目标表，与哪个表关联。

### Foreign key

数组字段，在源表中存储目标表 Target key 的字段。

数组字段类型的对应关系：

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Target key

源表数组字段存储值对应的字段，必须具备唯一性。
