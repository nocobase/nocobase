# 一对多

班级和学生的关系，一个班级可以有多个学生，但一个学生只能属于一个班级。这种情况下，班级和学生之间就是一对多关系。

ER 关系如下

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

字段配置

![alt text](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## 参数说明

### Source collection

源表，也就是当前字段所在表。

### Target collection

目标表，与哪个表关联。

### Source key

外键约束引用的字段，必须具备唯一性。

### Foreign key

目标表的字段，用于建立两个表之间的关联。

### Target key

目标表的字段，用于关系区块的每行记录的查看，一般为具备唯一性的字段。

### ON DELETE

ON DELETE 是指在删除父表中的记录时对相关子表中的外键引用的操作规则，它是用于定义外键约束时的一个选项。常见的 ON DELETE 选项包括：

- CASCADE：当删除父表中的记录时，自动删除子表中与之关联的所有记录。
- SET NULL：当删除父表中的记录时，将子表中与之关联的外键值设为 NULL。
- RESTRICT：默认选项，当试图删除父表中的记录时，如果存在与之关联的子表记录，则拒绝删除父表记录。
- NO ACTION：与 RESTRICT 类似，如果存在与之关联的子表记录，则拒绝删除父表记录。