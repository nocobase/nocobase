---
pkg: "@nocobase/plugin-block-list"
---
# 列表区块

## 介绍

列表区块以列表形式展示数据，适用于任务列表、新闻资讯、产品信息等数据展示场景。

## 区块配置项

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### 设置数据范围

如图：筛选订单状态为取消的单据

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

更多内容参考 [设置数据范围](/interface-builder/blocks/block-settings/data-scope)

### 设置排序规则

如图：按订单金额大小倒序排序

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

更多内容参考 [设置排序规则](/interface-builder/blocks/block-settings/sorting-rule)

## 配置字段

### 本表字段

> **注意**：继承表中的字段（即父表字段）会自动合并显示在当前字段列表中。

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### 关系表字段

> **注意**：支持将关系表字段显示出来（目前仅支持对一关系）。

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

列表字段配置项可参考 [详情字段](/interface-builder/fields/generic/detail-form-item)

## 配置操作

### 全局操作

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

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

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)


- [编辑](/interface-builder/actions/types/edit)
- [删除](/interface-builder/actions/types/delete)
- [链接](/interface-builder/actions/types/link)
- [弹窗](/interface-builder/actions/types/pop-up)
- [更新记录](/interface-builder/actions/types/update-record)
- [模板打印](/template-print/index)
- [触发工作流](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI 员工](/interface-builder/actions/types/ai-employee)
