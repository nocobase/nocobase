# 表格区块

## 介绍

表格区块是 NocoBase 内置的核心数据区块之一，以表格形式展示和管理结构化数据。它具备灵活的配置选项，可定制表格列、列宽、排序规则、数据范围等，内置了多种操作供配置：筛选、新建、编辑、删除等,同时支持对数据进行快捷编辑。

## 区块配置项

<!-- ![20251023150305](https://static-docs.nocobase.com/20251023150305.png) -->

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

<!-- ![20240415215319](https://static-docs.nocobase.com/20240415215319.png) -->

### 设置数据范围

示例：默认筛选「状态」为已付款的订单。

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

更多内容参考 [设置数据范围](/handbook/ui/blocks/block-settings/data-scope)

### 设置排序规则

示例：订单日期倒序显示。

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

更多内容参考 [设置排序规则](/handbook/ui/blocks/block-settings/sorting-rule)

## 配置字段

### 本表字段

**注意 ** 继承表的字段（父表字段）也会合并显示出来
![20240415223714](https://static-docs.nocobase.com/20240415223714.png)

### 关系表字段

![20240415223746](https://static-docs.nocobase.com/20240415223746.png)

## 配置操作

### 全局操作

![20240415225525](https://static-docs.nocobase.com/20240415225525.png)

- [筛选](/handbook/ui/actions/types/filter)
- [添加](/handbook/ui/actions/types/add-new)
- [删除](/handbook/ui/actions/types/delete)
- [刷新](/handbook/ui/actions/types/refresh)
- [导入](/handbook/action-import)
- [导出](/handbook/action-export)
- [批量更新](/handbook/action-bulk-update)

### 行操作

![20240415225657](https://static-docs.nocobase.com/20240415225657.png)

- [查看](/handbook/ui/actions/types/view)
- [编辑](/handbook/ui/actions/types/edit)
- [删除](/handbook/ui/actions/types/delete)
- [弹窗](/handbook/ui/actions/types/pop-up)
- [链接](/handbook/ui/actions/types/link)
