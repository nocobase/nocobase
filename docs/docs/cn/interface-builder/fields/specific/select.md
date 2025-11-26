# 下拉选择器

## 介绍

下拉选择器支持从目标表的已有数据选择数据关联或为目标表添加数据后关联，下拉选项支持模糊搜索。

![20251029205901](https://static-docs.nocobase.com/20251029205901.png)

## 字段配置项

### 设置数据范围

控制下拉列表的数据范围。

![20251029210025](https://static-docs.nocobase.com/20251029210025.png)

更多内容参考 [设置数据范围](/interface-builder/fields/field-settings/data-scope)

### 设置排序规则

控制下拉选择器数据的排序。

示例：按服务日期倒序排序。

![20251029210105](https://static-docs.nocobase.com/20251029210105.png)

### 允许添加/关联多条

限制对多的关系数据仅允许关联一条数据。

![20251029210145](https://static-docs.nocobase.com/20251029210145.png)

### 标题字段

标题字段是选项显示的标签字段。

![20251029210507](https://static-docs.nocobase.com/20251029210507.gif)

> 支持根据标题字段快速检索

更多内容参考 [标题字段](/interface-builder/fields/field-settings/title-field)


### 快速创建：先添加数据后选中该数据

![20251125220046](https://static-docs.nocobase.com/20251125220046.png)

#### 下拉菜单添加

为目标表新建数据后自动选中该数据并在表单提交后关联。

订单表有多对一关系字段「Account」。

![20251125220447](https://static-docs.nocobase.com/20251125220447.gif)

#### 弹窗添加

弹窗添加适用于较复杂的录入场景，可以配置新增表单。


![20251125220607](https://static-docs.nocobase.com/20251125220607.gif)


[字段组件](/interface-builder/fields/association-field)；
