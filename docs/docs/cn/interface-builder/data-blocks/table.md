# 表格区块

## 介绍

表格区块是 NocoBase 内置的核心数据区块之一，以表格形式展示和管理结构化数据。它具备灵活的配置选项，可定制表格列、列宽、排序规则、数据范围等，同时内置了多种操作供配置：筛选、新建、复制、编辑、删除等。

## 添加区块

 <video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240415215027.mp4" type="video/mp4">
</video>

## 区块配置项

![20240415215319](https://static-docs.nocobase.com/20240415215319.png)

### 设置数据范围

示例：默认筛选「状态」为已发货的单据。

![20240415215404](https://static-docs.nocobase.com/20240415215404.png)

更多内容参考 [设置数据范围](/handbook/ui/blocks/block-settings/data-scope)

### 设置排序规则

示例：将单据按发货日期倒序显示。

![20240415215509](https://static-docs.nocobase.com/20240415215509.png)

更多内容参考 [设置排序规则](/handbook/ui/blocks/block-settings/sorting-rule)

### 连接数据区块

示例：订单表格区块和订单详情区块连接，实现筛选联动。

  <video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240415221426.mp4" type="video/mp4">
</video>

更多内容参考 [连接数据区块](/handbook/ui/blocks/block-settings/connect-block)

### 设置区块高度

示例：设置订单表格区块高度为「全高」模式。

![20240604225958](https://static-docs.nocobase.com/20240604225958.gif)

更多内容参考 [区块高度](/handbook/ui/blocks/block-settings/block-height)

- [编辑区块标题](/handbook/ui/blocks/block-settings/block-title)
- [设置数据加载方式](/handbook/ui/blocks/block-settings/loading-mode)
- [保存为区块模板](/handbook/block-template)

## 配置字段

### 本表字段

![20240415223714](https://static-docs.nocobase.com/20240415223714.png)

### 关系表字段

![20240415223746](https://static-docs.nocobase.com/20240415223746.png)

### 显示继承表字段（父表字段）

示例：租赁订单表继承订单表。

![20240415224242](https://static-docs.nocobase.com/20240415224242.png)

表格列字段配置项可参考 [表格列字段](/handbook/ui/fields/generic/table-column)

## 配置操作

### 全局操作

![20240415225525](https://static-docs.nocobase.com/20240415225525.png)

- [筛选](/handbook/ui/actions/types/filter)
- [添加](/handbook/ui/actions/types/add-new)
- [删除](/handbook/ui/actions/types/delete)
- [刷新](/handbook/ui/actions/types/refresh)
- [导入](/handbook/action-import)
- [导出](/handbook/action-export)
- [添加数据](/handbook/action-add-record)
- [批量更新](/handbook/action-bulk-update)
- [批量编辑](/handbook/action-bulk-edit)

### 行操作

![20240415225657](https://static-docs.nocobase.com/20240415225657.png)

- [查看](/handbook/ui/actions/types/view)
- [编辑](/handbook/ui/actions/types/edit)
- [复制](/handbook/action-duplicate)
- [删除](/handbook/ui/actions/types/delete)
- [弹窗](/handbook/ui/actions/types/pop-up)
- [更新记录](/handbook/ui/actions/types/update-record)
- [自定义请求](/handbook/action-custom-request)
