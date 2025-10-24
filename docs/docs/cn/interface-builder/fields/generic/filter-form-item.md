# 筛选表单字段

## 介绍

筛选表单支持选择本表字段和关系表字段（关系的关系字段）作为筛选字段。

![20240409100014](https://static-docs.nocobase.com/20240409100014.png)


示例：以关系表的字段作为筛选字段，订单表和客户表是多对一的关系，配置客户表的名称和手机号为筛选字段用于筛选订单。

![20240422151626](https://static-docs.nocobase.com/20240422151626.png)

## 字段配置项

### 运算符

根据字段类型选择合适的运算符进行筛选，以提高筛选的准确性和效率，对于字符串类型字段默认为模糊匹配。

![20240412112748](https://static-docs.nocobase.com/20240412112748.png)

![20240412112823](https://static-docs.nocobase.com/20240412112823.png)

![20240422151953](https://static-docs.nocobase.com/20240422151953.png)

- [编辑字段标题](/handbook/ui/fields/field-settings/edit-title)
- [显示标题](/handbook/ui/fields/field-settings/display-title)
- [编辑字段描述](/handbook/ui/fields/field-settings/edit-description)
- [编辑字段提示信息](/handbook/ui/fields/field-settings/edit-tooltip)