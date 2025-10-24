# 下拉选择器

## 介绍

下拉选择器支持从目标表的已有数据选择数据关联或为目标表添加数据后关联，下拉选项支持模糊搜索。

![20240409230638](https://static-docs.nocobase.com/20240409230638.png)

## 字段配置项

### 快速创建：先添加数据后选中该数据

#### 下拉菜单添加

为目标表新建数据后自动选中该数据并在表单提交后关联，需要配置标题字段，适用于数据简单的场景，如标签。

订单表有多对一关系字段「标签」。

 <video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240410113002.mp4" type="video/mp4">
 </video>

#### 弹窗添加

在弹窗中配置新建表单，适用于较复杂的场景，如商品录入。

订单表有多对多关系字段「商品」。

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240410113351.mp4" type="video/mp4">
</video>

### 设置数据范围

控制下拉列表的数据范围。

![20240422204957](https://static-docs.nocobase.com/20240422204957.png)

更多内容参考 [设置数据范围](/handbook/ui/fields/field-settings/data-scope)

### 设置排序规则

控制下拉选择器数据的排序。

示例：按生产日期倒序排序。

![20240422205340](https://static-docs.nocobase.com/20240422205340.png)

### 允许添加/关联多条

限制对多的关系数据仅允许关联一条数据。

### 标题字段


![20240422205632](https://static-docs.nocobase.com/20240422205632.gif)

更多内容参考 [标题字段](/handbook/ui/fields/field-settings/title-field)

- [字段组件](/handbook/ui/fields/association-field)；
