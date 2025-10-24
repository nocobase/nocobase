# 详情区块

## 介绍

详情区块用于展示每条数据的各个字段值。它支持灵活的字段布局，并内置多种数据操作功能，方便用户查看和管理信息。

## 区块配置项

![20240511114328](https://static-docs.nocobase.com/20240511114328.png)

### 区块联动规则

通过联动规则控制区块行为（如是否显示或执行javaScript）。

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
更多内容参考 [联动规则](/handbook/ui/blocks/linkage-rule)

### 设置数据范围

示例：只显示已付款的订单

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

更多内容参考 [设置数据范围](/handbook/ui/blocks/block-settings/data-scope)

### 字段联动规则

详情区块中的联动规则支持动态设置字段 显示/隐藏。

示例：订单状态为「取消」时不显示金额。

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

更多内容参考 [联动规则](/handbook/ui/blocks/linkage-rule)

## 配置字段

### 本表字段

> **注意**：继承表中的字段（即父表字段）会自动合并显示在当前字段列表中。

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### 关系表字段

> **注意**：支持将关系表字段显示出来（目前仅支持对一关系）。

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)


### 其他字段
- JS Field
- JS Item
- 分割线
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **提示**：你可以编写 JavaScript 来实现自定义显示内容，从而展示更复杂的内容。  
> 例如，可以根据不同的数据类型、条件或逻辑渲染不同的显示效果。

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)



## 配置操作

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [编辑](/handbook/ui/actions/types/edit)
- [删除](/handbook/ui/actions/types/delete)
- [链接](/handbook/ui/actions/types/link)
- [弹窗](/handbook/ui/actions/types/pop-up)
- [更新记录](/handbook/ui/actions/types/update-record)
- [模板打印](/handbook/action-template-print)
- [触发工作流](/handbook/action-trigger-workflow)
- [JS action ](/handbook/action-js-action)
- [AI 员工](/handbook/action-ai-employee)
