---
pkg: "@nocobase/plugin-email-manager"
---

# 区块配置

## 邮件消息区块

### 添加区块

在配置页面点击 **创建区块** 按钮，选择 **邮件表格** 区块以添加邮件消息区块。

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_56_PM.png)

### 字段配置

点击区块的 **字段** 按钮可选择需要显示的字段，详细操作可参考表格的字段配置。

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_58_PM.png)

### 设置数据范围
区块右侧配置可选择数据范围：全部邮件或当前登录用户的邮件。

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_58_PM%20(1).png)

### 基于邮箱地址进行数据筛选

点击邮件消息区块右侧的配置按钮，选择 **数据范围**，设置用于筛选邮件的数据范围。

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_32_PM.png)

配置筛选条件，选择需要筛选的邮箱地址字段，点击 **确定** 保存。

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_26_PM.png)

邮件消息区块将显示符合筛选条件的邮件。

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_29_PM.png)

> 基于邮箱地址的筛选不区分大小写

### 基于邮箱后缀进行数据筛选

在业务表中创建用于存储邮箱后缀的字段（类型为JSON），以便在后续对邮件消息进行筛选。

![](https://static-docs.nocobase.com/email-manager/data-source-manager-main-NocoBase-12-02-2025_04_36_PM.png)

维护邮箱后缀信息。

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_38_PM.png)

点击邮件消息区块右侧的配置按钮，选择 **数据范围**，设置筛选邮件的数据范围。

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_32_PM.png)

配置筛选条件，选择需要筛选的邮箱后缀字段，点击 **确定** 保存。

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_41_PM.png)

邮件消息表将显示符合筛选条件的邮件。

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_48_PM.png)

## 邮件详情区块

首先在邮件消息区块的字段中开启 **启用点击打开** 功能。

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_01_PM.png)

在弹窗中添加 **邮件详情** 区块。

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_02_PM.png)

可查看邮件的详细内容。

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_03_PM.png)

底部可自定义配置所需的按钮。

> 若当前邮件为草稿状态，默认显示草稿编辑表单。

## 邮件发送区块

创建邮件发送表单有两种方式：

1. 在表格顶部添加 **发送邮件** 按钮：  
   ![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_04_PM.png)

2. 添加 **邮件发送** 区块：  
   ![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_05_PM.png)

两种方式都可创建完整的邮件发送表单。

![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_05_PM%20(1).png)

邮件表单的每个字段与普通表单一致，可配置 **默认值** 或 **联动规则** 等。
