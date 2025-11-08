# 关系字段组件

## 介绍

NocoBase 的关系字段组件旨在帮助用户更好地展示和处理关联数据。无论关系类型如何，这些组件具有灵活性和通用性，用户能够根据具体需求选择并配置这些组件。

### 下拉选择器

除了目标表为文件表的所有关系字段，编辑状态下的默认组件均为下拉选择器，下拉选项显示的是标题字段的值，适用于通过显示一个关键字段信息即快速选取关联数据的场景。

![20240429205659](https://static-docs.nocobase.com/20240429205659.png)

更多内容参考 [下拉选择器](/interface-builder/fields/specific/select)

### 数据选择器

数据选择器以弹窗形态呈现数据，用户可以在数据选择器中配置需要显示的字段（包括关系的关系字段），从而更精确地选取关联数据。

![20240429210824](https://static-docs.nocobase.com/20240429210824.png)

更多内容参考 [数据选择器](/interface-builder/fields/specific/picker)

### 子表单

当处理较复杂的关系数据时，使用下拉选择器或数据选择器操作都会显得不便捷。这种情况下，用户需要频繁打开弹窗。针对这种场景，则可以使用子表单，用户能够在当前页面或当前弹窗区块上直接维护关系表字段，而无需反复打开新的弹窗，操作流程更流畅。多层级的关系以嵌套表单的形态展示。

![20251029122948](https://static-docs.nocobase.com/20251029122948.png)

更多内容参考 [子表单](/interface-builder/fields/specific/sub-form)

### 子表格

子表格以表格形式展示一对多或多对多关系记录。它提供了一种清晰、结构化的方式来展示和管理关联数据，支持批量新建数据或选择已有数据关联。

![20251029123042](https://static-docs.nocobase.com/20251029123042.png)

更多内容参考 [子表格](/interface-builder/fields/specific/sub-table)

### 子详情

子详情是子表单在阅读模式下的对应组件，支持多层关系嵌套展示数据。

![20251030213050](https://static-docs.nocobase.com/20251030213050.png)

更多内容参考 [子详情](/interface-builder/fields/specific/sub-detail)

### 文件管理器

文件管理器是专门用于处理关系目标表为文件表的关系字段组件。

![20240429222753](https://static-docs.nocobase.com/20240429222753.png)

更多内容参考 [文件管理器](/interface-builder/fields/specific/file-manager)

### 标题

标题字段组件是阅读模式下使用的关系字段组件，通过配置标题字段可以配置对应的字段组件。

![20251030213327](https://static-docs.nocobase.com/20251030213327.png)

更多内容参考 [标题](/interface-builder/fields/specific/title)
