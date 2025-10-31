# 区块配置


## 邮件消息区块

### 添加区块

在配置页面，可以点击 Add block 按钮，选择 Mail messages(All) 和  Mail messages(Personal) 区块进行添加邮件消息区块
*  Mail messages(All) ： 所有的邮件消息
* Mail messages(Personal)： 当前登录人的邮件消息

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_03_58_PM.png)


### 字段配置

点击区块 Configure columns 按钮，可以选择需要显示的字段，详细操作可以参照表格的字段配置

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_37_PM.png)


### 数据筛选配置

点击表格右侧配置，选择 "Set the data scope"，可以设置筛选的邮件数据

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_39_PM.png)

可通过变量筛选相同后缀的邮件
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_41_PM.png)


## 邮件详情区块
先在邮件消息区块的字段上配置 Enable click to open
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_45_PM.png)

在弹窗内添加邮件详情区块
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_46_PM.png)

可以查看邮件的详细内容
![](https://static-docs.nocobase.com/email-manager/Loading--10-31-2025_04_49_PM.png)

底部可以自行配置想要的按钮


## 邮件发送区块

创建邮件发送表单有两种形式，一种是在表格顶部添加 发送邮件按钮

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_52_PM.png)

另外一种是添加邮件发送区块
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM.png)

最终都可以创建一个邮件发送表单
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM%20(1).png)

邮件表单的每个字段都和普通表单一致，可以配置默认值或者校验规则等

> 邮件详情底部自带的邮件回复表单和邮件转发表单默认携带了一些数据处理，可以通过 事件流进行 修改
