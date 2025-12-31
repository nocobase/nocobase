---
pkg: "@nocobase/plugin-email-manager"
---

# 邮件中心

<PluginInfo commercial="true" name="email-manager"></PluginInfo>

## 介绍
邮件插件启用后，系统默认提供邮件管理中心，用于账号接入、邮件管理和功能配置。

点击右上方邮件消息图标即可进入邮件管理页面

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_02_PM.png)

## 账号关联

### 关联账号

点击 **设置** 按钮，打开浮层后点击 **Link account** 按钮，选择需要关联的邮箱类型

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_03_PM.png)

浏览器自动打开对应邮箱的登录页面，登录账户并同意授权（不同服务商授权流程有所差异）

![](https://static-docs.nocobase.com/mail-1733816162534.png)

![](https://static-docs.nocobase.com/email-manager/Microsoft-%E5%B8%90%E6%88%B7-12-31-2025_09_49_PM.png)

授权完成后会重新跳转到 NocoBase，选择同步开始时间进行账户关联和数据同步（首次同步可能需要较长时间，请稍候）

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_51_PM.png)

数据同步完成后当前页面将自动关闭，并跳回原邮件消息页面，此时可以看到账户已关联

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_51_PM%20(1).png)

### 删除账户
点击 **删除** 可删除账户及关联的邮件

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_08_PM.png)

## 邮件管理

### 邮件筛选

邮件管理页面左侧为筛选区，右侧为邮件列表区

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_11_PM.png)

相同主题的邮件会进行合并处理，在主题字段后标识共有多少封往来邮件

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_13_PM.png)

未读邮件标题以粗体形式展示，顶部邮件图标旁会标记未读邮件数量


### 手动同步邮件

当前邮件同步间隔为 5 分钟。若需强制同步邮件，可点击 **同步邮件** 按钮

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_43_PM.png)

### 发送邮件

点击顶部 **发送邮件** 按钮可打开发件表单

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_13_PM%20(2).png)

填写相关信息后进行邮件发送。附件只支持 3MB 以内的文件

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_14_PM.png)

### 查看邮件

点击行上 **主题** 字段可查看邮件详情。邮件详情有两种形式：

单一邮件形式可直接查看详细信息

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_34_PM.png)

同主题多封邮件默认以列表形式显示，可点击展开或折叠

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_29_PM.png)

查看邮件详情后，邮件状态默认设为已读。可点击右侧 **...** 按钮中的 **标为未读** 操作将其设为未读

### 回复和转发

进入邮件详情后，底部有 **回复**、**转发** 按钮，可进行相应操作

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_45_PM.png)
