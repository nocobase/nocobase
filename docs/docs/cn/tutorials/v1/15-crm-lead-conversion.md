# 实现 CRM 线索转化

## 1. 引言

本教程将一步一步地引导您如何在 NocoBase 中实现 CRM 的商机转化（Opportunity Conversion）功能。我们将介绍如何创建所需的 collections（数据表）、配置数据管理页面、设计转化流程以及设置关联管理，从而帮助您顺利构建整个业务流程。

🎉 [NocoBase CRM 解决方案正式上线！欢迎体验](https://www.nocobase.com/cn/blog/crm-solution)

## 2. 准备工作：创建所需的 Collections

在开始之前，我们需要准备以下 4 个 collections，并配置它们之间的关联关系。

### 2.1 LEAD Collection（线索）

这是用于存储潜在客户信息的 collection，其字段定义如下：


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

### 2.2 ACCOUNT Collection（公司）

用于保存公司的详细信息，其字段配置如下：


| Field name | 字段显示名称 | Field interface  | Description                |
| ---------- | ------------ | ---------------- | -------------------------- |
| name       | **名称**     | Single line text | 账户名称（公司或组织名称） |
| industry   | **行业**     | Single select    | 账户所属行业               |
| phone      | **电话**     | Phone            | 账户联系电话               |
| website    | **网站**     | URL              | 账户官方网站地址           |

### 2.3 CONTACT Collection（联系人）

存储联系人信息的 collection，包含以下字段：


| Field name | 字段显示名称 | Field interface  | Description          |
| ---------- | ------------ | ---------------- | -------------------- |
| name       | **名称**     | Single line text | 联系人的姓名         |
| email      | **电子邮箱** | Email            | 联系人的电子邮箱地址 |
| phone      | **电话**     | Phone            | 联系人的联系电话     |

### 2.4 OPPORTUNITY Collection（商机）

用于记录商机信息，其字段定义如下：


| Field name | 字段显示名称 | Field interface  | Description                                                      |
| ---------- | ------------ | ---------------- | ---------------------------------------------------------------- |
| name       | **名称**     | Single line text | 商机的名称                                                       |
| stage      | **阶段**     | Single select    | 商机所处阶段（资格审查, 需求, 提案, 谈判, 交易关闭, 成功, 失败） |
| amount     | **金额**     | Number           | 商机的金额                                                       |
| close_date | **关闭日期** | Datetime         | 商机预计的关闭日期                                               |

## 3. 理解商机转化流程

### 3.1 正常转化流程概述

一个商机从线索转化为正式商机一般会经历如下流程：

![20250225211802](https://static-docs.nocobase.com/20250225211802.png)

### 3.2 关联关系说明

假设您已经成功创建上述 4 个 collections，并映射配置好它们之间的业务关系：

![关联关系](https://static-docs.nocobase.com/20250225090913.png)

## 4. 创建数据管理页面

在 NocoBase 的工作区中，为各个 collections 创建数据管理页面，并随机新增一些线索数据以便后续测试。

![数据管理页面](https://static-docs.nocobase.com/20250224234721.png)

## 5. 实现商机转化功能

本章节重点讲解如何将一个线索转化为公司、联系人及商机数据，并确保转化操作不会被重复触发。

### 5.1 创建“转化”编辑操作

在对应的线索详情界面中，创建一个编辑操作，命名为“转化”。在转化弹窗内，进行如下配置：

#### 5.1.1 展示线索基本信息

以只读方式展示当前线索的基本信息，确保用户不会误修改原数据。

#### 5.1.2 显示关联关系字段

在弹窗中展示以下三个关联字段，并为每个字段开启“快速创建”功能，以便在未找到匹配数据时，可以即时创建新数据。

![显示关联字段](https://static-docs.nocobase.com/20250224234155.png)

#### 5.1.3 配置快速创建的默认映射

在“快速创建”弹窗的设置中，为各关联字段配置默认值，从而将线索信息自动映射到目标 collection。映射规则如下：

- 线索/线索名 → 公司/名称
- 线索/电子邮箱 → 公司/电子邮箱
- 线索/联系电话 → 公司/电话
- 线索/线索名 → 联系人/名称
- 线索/电子邮箱 → 联系人/电子邮箱
- 线索/联系电话 → 联系人/电话
- 线索/线索名 → 商机/名称
- 线索/状态 → 商机/阶段

配置示例截图：

![默认映射1](https://static-docs.nocobase.com/20250225000218.png)

接下来，我们给提交操作再加一个友好的反馈：
![20250226154935](https://static-docs.nocobase.com/20250226154935.png)
![20250226154952](https://static-docs.nocobase.com/20250226154952.png)

提交效果：
![默认映射2](https://static-docs.nocobase.com/20250225001256.png)

#### 5.1.4 查看转化效果

配置完成后，执行转化操作时，系统将根据映射关系创建并关联新的公司、联系人以及商机数据。效果示例如下：

![](https://static-docs.nocobase.com/202502252130-transfer1.gif)
![](https://static-docs.nocobase.com/202502252130-transfer2.gif)

### 5.2 防止重复转化

为避免同一线索被多次转化，可以通过以下方式进行控制：

#### 5.2.1 更新线索状态

在转化表单的提交操作中，增加一个数据自动更新的步骤，将线索状态修改为“已转化”。

配置截图：

![更新状态1](https://static-docs.nocobase.com/20250225001758.png)
![更新状态2](https://static-docs.nocobase.com/20250225001817.png)
效果演示：
![202502252130-transfer](https://static-docs.nocobase.com/202502252130-transfer.gif)

#### 5.2.2 设置按钮联动规则

为转化按钮添加联动规则：当线索状态为“已转化”时，自动隐藏转化按钮，从而避免重复操作。

配置截图：

![按钮联动1](https://static-docs.nocobase.com/20250225001838.png)
![按钮联动2](https://static-docs.nocobase.com/20250225001939.png)
![按钮联动3](https://static-docs.nocobase.com/20250225002026.png)

## 6. 配置详情页面的关联管理区块

为了让用户在各个 Collection 的详情页面中查看关联数据，您需要配置相应的 list 区块或详情区块。

### 6.1 配置公司 Collection 详情页面

在公司的详情页面（例如，在联系人的编辑/详情弹窗中），分别添加以下 list 区块：

- 联系人 list
- 商机 list
- 线索 list

示例截图：

![公司详情页面](https://static-docs.nocobase.com/20250225085418.png)

### 6.2 添加筛选条件

为每个 list 区块增加筛选规则，确保只显示关联到当前公司 ID 的数据。

配置截图：

![筛选条件1](https://static-docs.nocobase.com/20250225085513.png)
![筛选条件2](https://static-docs.nocobase.com/20250225085638.png)

### 6.3 配置联系人与商机详情页面

在联系人 Collection 的详情弹窗中，添加以下区块：

- 商机 list
- 公司详情
- 线索 list（并按照 ID 进行筛选）

截图：

![联系人详情](https://static-docs.nocobase.com/20250225090231.png)

在商机详情页面，同样添加：

- 联系人 list
- 公司详情
- 线索 list（按 ID 过滤）

截图：

![商机详情](https://static-docs.nocobase.com/20250225091208.png)

## 7. 总结

通过以上步骤，您已成功实现一个简单的 CRM 商机转化功能，并配置了联系人、公司与线索之间的关联管理。希望本教程能够以清晰、循序渐进的方式，帮助您掌握整个业务流程的构建，从而为您的项目带来便利和高效的操作体验。

---

若在操作过程中遇到任何问题，欢迎前往[NocoBase社区](https://forum.nocobase.com)交流或查阅[官方文档](https://docs-cn.nocobase.com)。希望本指南能帮助您根据实际需求顺利实现用户注册审核，并根据需要灵活扩展。祝您使用顺利，项目成功！
