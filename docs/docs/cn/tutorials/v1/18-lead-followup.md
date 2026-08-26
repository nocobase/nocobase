# 线索跟进与状态管理

## 1. 简介

### 1.1 本章目标

在本章中，我们将一起学习如何在 NocoBase 中实现 CRM 商机转化。通过线索跟进和状态管理，您可以提升业务效率，实现更精细的销售过程控制。

### 1.2 最终效果预览

在上一章节中，我们讲解了如何关联管理线索与公司、联系人以及商机的数据。现在，我们聚焦于线索模块，主要探讨如何进行线索的跟进与状态管理。请先观看以下效果示例：
![](https://static-docs.nocobase.com/202502250226-transfer3.gif)

## 2. 线索 Collection 结构说明

### 2.1 线索 Collection 介绍

在线索跟进功能中，“状态”（status）字段扮演着至关重要的角色，不仅反映了线索的当前进展（如未达标、新线索、处理中、跟进中、交易进行中、完成），而且还驱动整个表单的显示与变化。下面的 table block 展示了线索 collection 的字段结构及其详细描述：


| Field name     | 字段显示名称       | Field interface  | Description                                                      |
| -------------- | ------------------ | ---------------- | ---------------------------------------------------------------- |
| id             | **Id**             | Integer          | 主键                                                             |
| account_id     | **account_id**     | Integer          | ACCOUNT 外键                                                     |
| contact_id     | **contact_id**     | Integer          | CONTACT 外键                                                     |
| opportunity_id | **opportunity_id** | Integer          | OPPORTUNITY 外键                                                 |
| name           | **线索名**         | Single line text | 潜在客户的姓名                                                   |
| company        | **公司名**         | Single line text | 潜在客户所在的公司名称                                           |
| email          | **电子邮箱**       | Email            | 潜在客户的电子邮箱地址                                           |
| phone          | **联系电话**       | Phone            | 联系电话                                                         |
| status         | **状态**           | Single select    | 线索当前状态（未达标, 新线索, 处理中, 跟进中, 交易进行中, 完成） |
| Account        | **公司**           | Many to one      | 关联到公司 Collection                                            |
| Contact        | **联系人**         | Many to one      | 关联到联系人 Collection                                          |
| Opportunity    | **商机**           | Many to one      | 关联到商机 Collection                                            |

## 3. 创建 Leads 表格区块（table block）与详情区块

### 3.1 创建说明

首先，我们需要创建一个 “Leads” 的 table block 用于展示必要的字段。同时，在页面右侧配置一个详情区块，当您点击某条记录时，右侧会自动显示对应的详细信息。请参见下图的配置效果：
![](https://static-docs.nocobase.com/20250226090009.png)

## 4. 配置操作按钮

### 4.1 按钮总体说明

为了满足各种操作需求，我们需要创建共计 11 个按钮。每个按钮都依据记录的状态（status）采用不同的显示方式（隐藏、激活或禁用），从而引导用户按照正确的业务流程操作。
![20250226173632](https://static-docs.nocobase.com/20250226173632.png)

### 4.2 各功能按钮详细配置

#### 4.2.1 编辑按钮

- 联动规则：当记录的 status 为 “Completed”（已完成）时，自动禁用该按钮，防止进行不必要的编辑。

#### 4.2.2 未达标 按钮1（未激活）

- 样式与外观：标题显示为 “Unqualified >”。
- 操作与行为：点击后执行 update 操作，将记录的 status 更新为 “Unqualified”，更新成功后返回上一级页面，并显示 “Unqualified” 的成功提示。
- 联动规则：仅当记录的 status 为空时显示；一旦 status 有值，该按钮将自动隐藏。

#### 4.2.3 未达标 按钮2（激活状态）

- 样式与外观：同样显示为 “Unqualified >”。
- 操作与行为：用于更新记录的 status 为 “Unqualified”。
- 联动规则：当 status 为空时，此按钮隐藏；如果 status 为 “Completed”，则按钮会被禁用。

#### 4.2.4 新线索 按钮1（未激活）

- 样式与外观：标题显示为 “New >”。
- 操作与行为：点击后更新记录，将 status 设置为 “New”，更新成功后显示 “New” 的提示。
- 联动规则：如果记录的 status 已处于 “New”、“Working”、“Nurturing” 或 “Completed” 状态时，该按钮将隐藏。

#### 4.2.5 新线索 按钮2（激活状态）

- 样式与外观：标题依然为 “New >”。
- 操作与行为：同样用于更新记录，将 status 设置为 “New”。
- 联动规则：当 status 属于 “Unqualified” 或为空时隐藏；若 status 为 “Completed”，则按钮被禁用。

#### 4.2.6 处理中 按钮（未激活）

- 样式与外观：标题显示为 “Working >”。
- 操作与行为：点击按钮后，记录的 status 更新为 “Working”，并显示 “Working” 成功提示。
- 联动规则：若记录的 status 已为 “Working”、“Nurturing” 或 “Completed”，则该按钮隐藏。

#### 4.2.7 处理中 按钮（激活状态）

- 样式与外观：标题依然为 “Working >”。
- 操作与行为：用于将记录的 status 更新为 “Working”。
- 联动规则：当 status 为 “Unqualified”、“New” 或为空时，该按钮隐藏；如果 status 为 “Completed”，则按钮禁用。

#### 4.2.8 跟进中 按钮（未激活）

- 样式与外观：标题显示为 “Nurturing >”。
- 操作与行为：点击按钮后，将记录的 status 更新为 “Nurturing”，并显示 “Nurturing” 的成功提示。
- 联动规则：若记录的 status 已为 “Nurturing” 或 “Completed”，按钮隐藏。

#### 4.2.9 跟进中 按钮（激活状态）

- 样式与外观：标题同样为 “Nurturing >”。
- 操作与行为：同样用于更新记录的 status 为 “Nurturing”。
- 联动规则：当 status 为 “Unqualified”、“New”、“Working” 或为空时隐藏；若 status 为 “Completed”，则按钮禁用。

#### 4.2.10 转化 按钮

- 样式与外观：标题显示为 “transfer”，并以 modal 弹窗形式打开。
- 操作与行为：主要用于执行记录转移操作。更新操作后，系统会弹出一个包含抽屉、Tabs 以及表单的界面，方便您进行记录转移。
- 联动规则：当记录的 status 为 “Completed”时，此按钮隐藏，以防止重复的转移。
  ![](https://static-docs.nocobase.com/20250226094223.png)

#### 4.2.11 转化完成 按钮（激活状态）

- 样式与外观：标题显示为 “transfered”，同样以 modal 弹窗形式打开。
- 操作与行为：该按钮只用于展示转化完成后的信息，不具备编辑功能。
- 联动规则：仅在记录的 status 为 “Completed”时显示，其他状态（如 “Unqualified”、“New”、“Working”、“Nurturing” 或为空）时隐藏。
  ![](https://static-docs.nocobase.com/20250226094203.png)

### 4.3 按钮配置总结

- 每项功能均提供未激活和激活状态下的不同按钮样式。
- 利用联动规则，根据记录的 status 动态控制按钮的显示（隐藏或禁用），从而引导销售人员按照正确的工作流程进行操作。

## 5. 表单联动规则设置

### 5.1 规则 1：仅展示名称

- 当记录未确认或 status 为空时，只展示名称。
  ![](https://static-docs.nocobase.com/20250226092629.png)
  ![](https://static-docs.nocobase.com/20250226092555.png)

### 5.2 规则 2："新线索" 状态下的显示优化

- 在 status 为 “新线索” 时，页面将隐藏公司名，并展示联系方式。
  ![](https://static-docs.nocobase.com/20250226092726.png)

## 6. 页面 Markdown 规则与 Handlebars 语法

### 6.1 动态文案展示

在页面中，我们使用 Handlebars 语法根据记录的状态动态展示不同的提示信息。以下是各状态下的示例代码：

当状态为 “未达标” 时：

```markdown
{{#if (eq $nRecord.status "未达标")}}
**跟踪你那些不合格线索的相关信息。**  
如果你的线索对产品不感兴趣或已离开相关公司，则可能是不合格的。  
- 记录经验教训以供今后参考  
- 保存外联细节和联系方式  
{{/if}}
```

当状态为 “新线索” 时：

```markdown
{{#if (eq $nRecord.status "新线索")}}
**识别这一机会所需的产品或服务。**  
- 收集客户案例、参考资料或竞争分析  
- 确认你的主要利益相关者  
- 确定可供使用的资源  
{{/if}}
```

当状态为 “处理中” 时：

```markdown
{{#if (eq $nRecord.status "处理中")}}
**向利益相关者交付你的解决方案。**  
- 传达解决方案的价值  
- 明确时间表和预算  
- 与客户制定何时以及如何成交的计划  
{{/if}}
```

当状态为 “跟进中” 时：

```markdown
{{#if (eq $nRecord.status "跟进中")}}
**确定客户的项目实施计划。**  
- 根据需要达成协议  
- 遵循内部折扣流程  
- 获取签署的合同  
{{/if}}
```

当状态为 “转化完成” 时：

```markdown
{{#if (eq $nRecord.status "转化完成")}}
**确认项目实施计划和最终步骤。**  
- 确保所有剩余协议和签字手续到位  
- 遵循内部折扣政策  
- 确保合同已签署且项目实施按计划进行  
{{/if}}
```

## 7. 展示转化完成后的关联对象及跳转链接

### 7.1 关联对象说明

在转化完成后，我们希望展示相关的关联对象（公司、联系人、商机），并附上跳转至详情页面的链接。注意：在其他弹窗或页面中，详情链接格式的最后部分（filterbytk 后的数字）代表当前对象的 id，例如：

```text
http://localhost:13000/apps/tsting/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/1
```

### 7.2 使用 Handlebars 生成关联链接

对于 公司：

```markdown
{{#if (eq $nRecord.status "已完成")}}
**Account:**
[{{$nRecord.account.name}}](http://localhost:13000/apps/tsting/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{{$nRecord.account_id}})
{{/if}}
```

对于 联系人：

```markdown
{{#if (eq $nRecord.status "已完成")}}
**Contact:**
[{{$nRecord.contact.name}}](http://localhost:13000/apps/tsting/admin/1oqybfwrocb/popups/8bbsqy5bbpl/filterbytk/{{$nRecord.contact_id}})
{{/if}}
```

对于 商机：

```markdown
{{#if (eq $nRecord.status "已完成")}}
**Opportunity:**
[{{$nRecord.opportunity.name}}](http://localhost:13000/apps/tsting/admin/si0io9rt6q6/popups/yyx8uflsowr/filterbytk/{{$nRecord.opportunity_id}})
{{/if}}
```

![](https://static-docs.nocobase.com/20250226093501.png)

## 8. 隐藏关联对象但保留值

为确保在转化完成后正常展示关联信息，需要将 “公司”、 “联系人” 和 “商机” 的状态设置为 “隐藏（保留值）”。这样，尽管这些字段不在表单中显示，但其值依然会被记录和传递。
![](https://static-docs.nocobase.com/20250226093906.png)

## 9. 防止转化完成后状态修改

为了防止转化完成后意外更改状态，我们为所有按钮添加了一个判断条件：在状态为 “已完成” 时，所有按钮将被禁用。
![](https://static-docs.nocobase.com/20250226094302.png)

## 10. 结束语

完成以上所有步骤后，您的线索跟进转化功能就大功告成啦！通过本章的分步讲解，希望您能更清晰地理解 NocoBase 中状态表单变化联动的实现方式。祝您操作顺利，使用愉快！
