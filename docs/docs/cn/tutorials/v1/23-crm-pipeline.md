# CRM 销售管道可视化

## 1. 简介

### 1.1 前言

本章是 [如何在 NocoBase 中实现 CRM 的线索转化](https://www.nocobase.com/cn/tutorials/how-to-implement-lead-conversion-in-nocobase) 系列教程的第二部分。在上一章中，我们已经介绍了线索转化的基础知识，包括创建所需的数据集合（Collections）、配置数据管理页面以及实现线索到公司、联系人和商机的转化功能。本章将重点关注线索的跟进流程和状态管理的实现。

🎉 [NocoBase CRM 解决方案正式上线！欢迎体验](https://www.nocobase.com/cn/blog/crm-solution)

### 1.2 本章目标

在本章中，我们将一起学习如何在 NocoBase 中实现 CRM 线索转化。通过线索跟进和状态管理，您可以提升业务效率，实现更精细的销售过程控制。

### 1.3 最终效果预览

在上一章节中，我们讲解了如何关联管理线索与公司、联系人以及商机的数据。现在，我们聚焦于线索模块，主要探讨如何进行线索的跟进与状态管理。请先观看以下效果示例：
![](https://static-docs.nocobase.com/202502250226-transfer3.gif)

## 2. 线索 Collection 结构说明

### 2.1 线索 Collection 介绍

在线索跟进功能中，"状态"（status）字段扮演着至关重要的角色，不仅反映了线索的当前进展（如未达标、新线索、处理中、跟进中、交易进行中、完成），而且还驱动整个表单的显示与变化。下面的 table block 展示了线索 collection 的字段结构及其详细描述：


| Field name     | 字段显示名称       | Field interface  | Description                                                                      |
| -------------- | ------------------ | ---------------- | -------------------------------------------------------------------------------- |
| id             | **Id**             | Integer          | 主键                                                                             |
| account_id     | **account_id**     | Integer          | 公司表 ACCOUNT 外键                                                              |
| contact_id     | **contact_id**     | Integer          | 联系人表 CONTACT 外键                                                            |
| opportunity_id | **opportunity_id** | Integer          | 商机表 OPPORTUNITY 外键                                                          |
| name           | **线索名**         | Single line text | 潜在客户的姓名                                                                   |
| company        | **公司名**         | Single line text | 潜在客户所在的公司名称                                                           |
| email          | **电子邮箱**       | Email            | 潜在客户的电子邮箱地址                                                           |
| phone          | **联系电话**       | Phone            | 联系电话                                                                         |
| status         | **状态**           | Single select    | 线索当前状态, 默认为"未达标"（未达标, 新线索, 处理中, 跟进中, 交易进行中, 完成） |
| Account        | **公司**           | Many to one      | 关联到公司                                                                       |
| Contact        | **联系人**         | Many to one      | 关联到联系人                                                                     |
| Opportunity    | **商机**           | Many to one      | 关联到商机                                                                       |

## 3. 创建 Leads 表格区块（table block）与详情区块

### 3.1 创建说明

首先，我们需要创建一个 "Leads" 的 table block 用于展示必要的字段。同时，在页面右侧配置一个详情区块，当您点击某条记录时，右侧会自动显示对应的详细信息。请参见下图的配置效果：
![](https://static-docs.nocobase.com/20250226090009.png)

## 4. 配置操作按钮

### 4.1 按钮总体说明

为了满足各种操作需求，我们需要创建共计 10 个按钮。每个按钮都依据记录的状态（status）采用不同的显示方式（隐藏、激活或禁用），从而引导用户按照正确的业务流程操作。
![20250311083825](https://static-docs.nocobase.com/20250311083825.png)

### 4.2 各功能按钮详细配置


| 按钮                      | 样式                               | 操作                                                         | 联动规则                                                                                     |
| ------------------------- | ---------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| 编辑按钮                  | 编辑操作                           | —                                                           | 当记录的 status 为 "Completed"（已完成）时自动禁用，防止不必要的编辑。                       |
| 未达标 按钮（激活状态）   | "Unqualified >"                    | 更新记录的 status 为 "Unqualified"。                         | 默认展示；若 status 为 "Completed"，则按钮被禁用。                                           |
| 新线索 按钮（未激活）     | 更新数据操作，"New >"              | 将 status 设置为 "New"，更新成功后显示 "New" 的提示。        | 如果记录的 status 不为 "Unqualified" 则隐藏。（即记录已处于 "New" 或之后状态，应为激活状态） |
| 新线索 按钮（激活状态）   | 更新数据操作，"New >"              | 更新记录的 status 为 "New"。                                 | 当 status 为 "Unqualified" 时隐藏；若 status 为 "Completed"，则按钮禁用。                    |
| 处理中 按钮（未激活）     | 更新数据操作，"Working >"          | 将 status 更新为 "Working"，并显示 "Working" 成功提示。      | 当记录的 status 不为 "Unqualified"、"New" 时隐藏。                                           |
| 处理中 按钮（激活状态）   | 更新数据操作，"Working >"          | 更新记录的 status 为 "Working"。                             | 当 status 为 "Unqualified"、"New" 时隐藏；若 status 为 "Completed"，则按钮禁用。             |
| 跟进中 按钮（未激活）     | 更新数据操作，"Nurturing >"        | 将 status 设置为 "Nurturing"，并显示 "Nurturing" 成功提示。  | 当记录的 status 不为 "Unqualified"、"New"、"Working" 时隐藏。                                |
| 跟进中 按钮（激活状态）   | 更新数据操作，"Nurturing >"        | 更新记录的 status 为 "Nurturing"。                           | 当 status 为 "Unqualified"、"New"、"Working" 时隐藏；若 status 为 "Completed"，则按钮禁用。  |
| 转化 按钮                 | 编辑操作 ，"transfer"，图标为"√"  | 弹出转化表单，表单提交时，更新记录的 status 为 "Completed"。 | 当记录的 status 为 "Completed" 时隐藏，以防重复转移。                                        |
| 转化完成 按钮（激活状态） | 查看操作，"transfered"，图标为"√" | 仅用于展示转化完成后的信息，不具备编辑功能。                 | 仅在记录的 status 为 "Completed" 时显示；其他状态时隐藏。                                    |

- 联动规则示例：
  处理中 (未激活)
  ![20250311084104](https://static-docs.nocobase.com/20250311084104.png)
  处理中 (激活)
  ![20250311083953](https://static-docs.nocobase.com/20250311083953.png)
- 转化表单：
  转化按钮（未激活）
  ![](https://static-docs.nocobase.com/20250226094223.png)
  转化按钮（激活）
  ![](https://static-docs.nocobase.com/20250226094203.png)
- 转化提交时弹出提示：
  ![20250311084638](https://static-docs.nocobase.com/20250311084638.png)

### 4.3 按钮配置总结

- 每项功能均提供未激活和激活状态下的不同按钮样式。
- 利用联动规则，根据记录的 status 动态控制按钮的显示（隐藏或禁用），从而引导销售人员按照正确的工作流程进行操作。

## 5. 表单联动规则设置

### 5.1 规则 1：仅展示名称

- 当记录未确认时，只展示名称。
  ![](https://static-docs.nocobase.com/20250226092629.png)
  ![](https://static-docs.nocobase.com/20250226092555.png)

### 5.2 规则 2："新线索" 状态下的显示优化

- 在 status 为 "新线索" 时，页面将隐藏公司名，并展示联系方式。
  ![](https://static-docs.nocobase.com/20250226092726.png)

## 6. 页面 Markdown 规则与 Handlebars 语法

### 6.1 动态文案展示

在页面中，我们使用 Handlebars 语法根据记录的状态动态展示不同的提示信息。以下是各状态下的示例代码：

当状态为 "未达标" 时：

```markdown
{{#if (eq $nRecord.status "未达标")}}
**跟踪你那些不合格线索的相关信息。**  
如果你的线索对产品不感兴趣或已离开相关公司，则可能是不合格的。  
- 记录经验教训以供今后参考  
- 保存外联细节和联系方式  
{{/if}}
```

当状态为 "新线索" 时：

```markdown
{{#if (eq $nRecord.status "新线索")}}
**收集更多关于这条线索的信息。**  
- 了解潜在客户的需求和兴趣点
- 收集基础联系资料和公司背景
- 确定后续跟进的优先级和方式
{{/if}}
```

当状态为 "处理中" 时：

```markdown
{{#if (eq $nRecord.status "处理中")}}
**主动联系线索并初步评估需求。**  
- 通过电话/邮件与潜在客户建立联系
- 了解客户面临的问题和挑战
- 初步判断客户的需求与公司产品/服务的匹配度
{{/if}}
```

当状态为 "跟进中" 时：

```markdown
{{#if (eq $nRecord.status "跟进中")}}
**深入挖掘客户需求，进行线索培育。**  
- 提供相关产品资料或解决方案建议
- 回答客户的问题，消除顾虑
- 评估线索的转化可能性
{{/if}}
```

当状态为 "转化完成" 时：

```markdown
{{#if (eq $nRecord.status "转化完成")}}
**线索已成功转化为客户。**  
- 确认已创建相关的公司和联系人记录
- 创建商机记录，设置跟进计划
- 将相关资料和沟通记录传递给负责的销售人员
{{/if}}
```

## 7. 展示转化完成后的关联对象及跳转链接

### 7.1 关联对象说明

在转化完成后，我们希望展示相关的关联对象（公司、联系人、商机），并能够直接跳转至详情页面。
这个时候随便找一个详情弹窗，比如公司，然后复制链接。
![20250311085502](https://static-docs.nocobase.com/20250311085502.png)
注意：在其他弹窗或页面中，详情链接格式的最后部分（filterbytk 后的数字）代表当前对象的 id，例如：

```text
{Base URL}/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{id}
```

### 7.2 使用 Handlebars 生成关联链接

公司：

```markdown
{{#if (eq $nRecord.status "已完成")}}
**公司:**
[{{$nRecord.account.name}}](w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{{$nRecord.account_id}})
{{/if}}
```

联系人：

```markdown
{{#if (eq $nRecord.status "已完成")}}
**联系人:**
[{{$nRecord.contact.name}}](1oqybfwrocb/popups/8bbsqy5bbpl/filterbytk/{{$nRecord.contact_id}})
{{/if}}
```

商机：

```markdown
{{#if (eq $nRecord.status "已完成")}}
**商机:**
[{{$nRecord.opportunity.name}}](si0io9rt6q6/popups/yyx8uflsowr/filterbytk/{{$nRecord.opportunity_id}})
{{/if}}
```

![](https://static-docs.nocobase.com/20250226093501.png)

## 8. 隐藏关联对象但保留值

为确保在转化完成后正常展示关联信息，需要将 "公司"、 "联系人" 和 "商机" 的状态设置为 "隐藏（保留值）"。这样，尽管这些字段不在表单中显示，但其值依然会被记录和传递。
![](https://static-docs.nocobase.com/20250226093906.png)

## 9. 防止转化完成后状态修改

为了防止转化完成后意外更改状态，我们为所有按钮添加了一个判断条件：在状态为 "已完成" 时，所有按钮将被禁用。
![](https://static-docs.nocobase.com/20250226094302.png)

## 10. 结束语

完成以上所有步骤后，您的线索跟进转化功能就大功告成啦！通过本章的分步讲解，希望您能更清晰地理解 NocoBase 中状态表单变化联动的实现方式。祝您操作顺利，使用愉快！
