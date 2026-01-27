
# 多对一

一个图书馆数据库，其中有两个实体：图书和作者。一个作者可以写多本书，但每本书只有一个作者（多数情况下）。这种情况下，作者和书之间就是多对一的关系。多本书可以关联到同一个作者，但每本书只能有一个作者。

ER 关系如下

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

字段配置

![alt text](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## 参数说明

### Source collection

源表，也就是当前字段所在表。

### Target collection

目标表，与哪个表关联。

### Foreign key

源表的字段，用于建立两个表之间的关联。

### Target key

外键约束引用的字段，必须具备唯一性。

### ON DELETE

ON DELETE 是指在删除父表中的记录时对相关子表中的外键引用的操作规则，它是用于定义外键约束时的一个选项。常见的 ON DELETE 选项包括：

- CASCADE：当删除父表中的记录时，自动删除子表中与之关联的所有记录。
- SET NULL：当删除父表中的记录时，将子表中与之关联的外键值设为 NULL。
- RESTRICT：默认选项，当试图删除父表中的记录时，如果存在与之关联的子表记录，则拒绝删除父表记录。
- NO ACTION：与 RESTRICT 类似，如果存在与之关联的子表记录，则拒绝删除父表记录。