# 表格区块

## 介绍


表格区块是 **NocoBase** 内置的核心数据区块之一，主要用于以表格形式展示和管理结构化数据。它提供灵活的配置选项，用户可以根据需求定制表格的列、列宽、排序规则和数据范围等，确保表格展示的数据符合特定业务需求。

#### 主要功能：
- **灵活的列配置**：可以自定义表格的列和列宽，以适应不同的数据展示需求。
- **排序规则**：支持对表格数据进行排序，用户可以根据不同字段对数据进行升序或降序排列。
- **数据范围设置**：通过设置数据范围，用户可以控制展示的数据范围，避免无关数据的干扰。
- **操作配置**：表格区块内置了多种操作选项，用户可以轻松配置筛选、新建、编辑、删除等操作，以便快速管理数据。
- **快捷编辑**：支持直接在表格内进行数据编辑，简化操作流程，提高工作效率。

## 区块配置项

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### 区块联动规则

通过联动规则控制区块行为（如是否显示或执行javaScript）。

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

更多内容参考 [联动规则](/interface-builder/linkage-rule)

### 设置数据范围

示例：默认筛选「状态」为已付款的订单。

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

更多内容参考 [设置数据范围](/interface-builder/blocks/block-settings/data-scope)

### 设置排序规则

示例：订单日期倒序显示。

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

更多内容参考 [设置排序规则](/interface-builder/blocks/block-settings/sorting-rule)

### 启用快速编辑

在区块配置和表格列配置中「启用快速便捷」激活，便可自定义哪些列可以快捷编辑。

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### 启用树表

当数据表为树形表时，表格区块可选择开启「启用树表」功能，默认情况下保持关闭。开启后，区块将以树形结构展示数据，同时支持相应的配置选项和操作功能。

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### 默认展开所有行

当启用树表时，支持区块加载时默认展开所有子数据。
## 配置字段

### 本表字段

> **注意**：继承表中的字段（即父表字段）会自动合并显示在当前字段列表中。

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### 关系表字段

> **注意**：支持将关系表字段显示出来（目前仅支持对一关系）。

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### 其他自定义列

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [JS Field](/interface-builder/fields/specific/js-field)
- [JS Column](/interface-builder/fields/specific/js-column)

## 配置操作

### 全局操作

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

- [筛选](/interface-builder/actions/types/filter)
- [添加](/interface-builder/actions/types/add-new)
- [删除](/interface-builder/actions/types/delete)
- [刷新](/interface-builder/actions/types/refresh)
- [导入](/interface-builder/actions/types/import)
- [导出](/interface-builder/actions/types/export)
- [模板打印](/template-print/index)
- [批量更新](/interface-builder/actions/types/bulk-update)
- [导出附件](/interface-builder/actions/types/export-attachments)
- [触发工作流](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI 员工](/interface-builder/actions/types/ai-employee)

### 行操作

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [查看](/interface-builder/actions/types/view)
- [编辑](/interface-builder/actions/types/edit)
- [删除](/interface-builder/actions/types/delete)
- [弹窗](/interface-builder/actions/types/pop-up)
- [链接](/interface-builder/actions/types/link)
- [更新记录](/interface-builder/actions/types/update-record)
- [模板打印](/template-print/index)
- [触发工作流](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI 员工](/interface-builder/actions/types/ai-employee)
