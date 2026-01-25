---
pkg: "@nocobase/plugin-data-source-main"
---

# 普通表

## 介绍

用于大多数场景。除非需要特殊的数据表模板，否则都可以用普通表。

## 使用手册

![20240324085739](https://static-docs.nocobase.com/20240324085739.png)

### 设置主键字段

数据表需要指定主键字段，新建数据表时推荐勾选 ID 预设字段，ID 字段默认的主键类型是 `Snowflake ID (53-bit)`

![20251209210153](https://static-docs.nocobase.com/20251209210153.png)

鼠标悬停在 ID 字段的 Interface 上可以选择其他主键类型。

![20251209210517](https://static-docs.nocobase.com/20251209210517.png)

可选的主键类型有：
- [文本](/data-sources/data-modeling/collection-fields/basic/input)
- [整数](/data-sources/data-modeling/collection-fields/basic/integer)
- [Snowflake ID (53-bit)](/data-sources/data-modeling/collection-fields/advanced/snowflake-id)
- [UUID](/data-sources/data-modeling/collection-fields/advanced/uuid)
- [Nano ID](/data-sources/data-modeling/collection-fields/advanced/nano-id)
