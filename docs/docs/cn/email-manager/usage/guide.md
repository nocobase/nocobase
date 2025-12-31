---
pkg: "@nocobase/plugin-email-manager"
---

# 邮件中心

<PluginInfo commercial="true" name="email-manager"></PluginInfo>

## 介绍
在邮件插件开启后，默认会有邮件管理中心，用于账号接入、邮件管理、功能配置等

点击右上方邮件消息图标，可以进入到邮件管理页面

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_02_PM.png)

## 账号关联

### 关联账号

点击 "设置" 按钮，打开浮层后点击 "Link account" 按钮，选择需要关联的邮箱账户类型

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_03_PM.png)

浏览器自动打开对应的邮箱登录页面，进行账号登录，并同意相关授权（不同服务商之间有差异）

![](https://static-docs.nocobase.com/mail-1733816162534.png)

![](https://static-docs.nocobase.com/email-manager/Microsoft-%E5%B8%90%E6%88%B7-12-31-2025_09_49_PM.png)

授权完成后会将重新跳转到 NocoBase 网页，选择同步开始时间，进行账户关联和数据同步（首次同步可能需要一些时间，稍微等待下）

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_51_PM.png)

数据完成同步后当前页面将自动关闭，并跳回到原邮件消息页面，可以看到账户已经关联

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_51_PM%20(1).png)

点击蒙层区域，关闭弹窗后可以看到邮件列表

### 删除账户
可以点击 **删除**，将删除账户和关联的邮件

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_08_PM.png)

## 邮件管理

### 邮件筛选

邮件管理页面，左侧为筛选区，右侧为邮件列表区

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_11_PM.png)

相同主题的邮件会进行合并处理，并在主题字段后面标识共有多少封往来邮件
当相同主题的某些主题符合筛选条件时，会带出主题的根邮件，且会在主题字段边标识当前根邮件的类型

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_13_PM.png)

未读邮件标题将会以粗体形式展示，并且顶部邮件图标侧会标记未读邮件数量


### 手动同步邮件

当前邮件的同步间隔为5分钟，如果想强制同步邮件，可以点击 **同步邮件** 按钮

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_43_PM.png)

### 发送邮件

点击顶部 **发送邮件** 按钮可以打开发件面板

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_13_PM%20(2).png)

填写相关信息后可以进行邮件发送，当前附件只支持 3M以内

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_14_PM.png)

### 查看邮件

点击行上 **主题** 字段，可以查看邮件详情，目前有两种形式，一种是单一邮件的，可以直接看到邮件详细信息

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_34_PM.png)

另外一种是同主题的多封邮件，默认会以列表的形式显示，可以点击展开折叠

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_29_PM.png)

邮件点击查看详情后，默认会将邮件状态置为已读，可以点击右侧 "..." 按钮内 **标为未读** 操作，置为未读

### 回复和转发

进入邮件详情后，底部有 **回复**、**转发** 按钮，可以进行回复、转发操作。

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_45_PM.png)
