---
pkg: "@nocobase/plugin-email-manager"
---

# 区块配置

## 邮件消息区块

### 添加区块

在配置页面，点击 **创建区块** 按钮，选择 **邮件消息 (全部)** 或 **邮件消息 (个人)** 区块以添加邮件消息区块

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_03_58_PM.png)

### 字段配置

点击区块的 **字段** 按钮，可选择需要显示的字段。详细操作可参考表格的字段配置方法。  

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_37_PM.png)

### 数据筛选配置

点击表格右侧的配置，选择 **数据范围**，可以设置筛选邮件的数据范围。  

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_39_PM.png)

可通过变量筛选相同后缀的邮件：  
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_41_PM.png)

## 邮件详情区块

首先在邮件消息区块字段上开启 **启用点击打开** 功能：  
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_45_PM.png)

在弹窗中添加 **邮件详情** 区块：  
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_46_PM.png)

可查看邮件的详细内容：  
![](https://static-docs.nocobase.com/email-manager/Loading--10-31-2025_04_49_PM.png)

底部可以自行配置所需的按钮。

## 邮件发送区块

创建邮件发送表单有两种方式：

1. 在表格顶部添加 **发送邮件** 按钮：  
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_52_PM.png)

2. 添加 **邮件发送** 区块：  
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM.png)

最终都可以创建完整的邮件发送表单：  
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM%20(1).png)

邮件表单的每个字段与普通表单一致，可配置 **默认值** 或 **联动规则** 等。

> 邮件详情底部自带的邮件回复表单和邮件转发表单默认携带部分数据处理，可通过 **事件流** 进行修改。
