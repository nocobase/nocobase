# 邮件：使用手册

<PluginInfo commercial="true" name="email-manager"></PluginInfo>

## 介绍
邮件插件允许将对谷歌、微软邮件账户接入到NocoBase中，进行邮件的收发、查看、管理等操作。也可以将邮件集成到任意页面和区块中


## 关联邮件账号

### 关联账户

在邮件插件开启后，点击右上方邮件消息图标，可以进入到邮件消息管理页面

![](https://static-docs.nocobase.com/mail-1733816161753.png)

点击 "Account setting" 按钮，打开浮层后点击 "Link account" 按钮，选择需要关联的邮箱账户类型

![](https://static-docs.nocobase.com/mail-1733816162279.png)

浏览器自动打开对应的邮箱登录页面，进行账号登录，并同意相关授权

![](https://static-docs.nocobase.com/mail-1733816162534.png)

授权完成后会将重新跳转到 NocoBase 网页，进行账户关联和数据同步（首次同步可能需要一些时间，稍微等待下）

![](https://static-docs.nocobase.com/mail-1733816162794.png)

数据完成同步后当前页面将自动关闭，并跳回到原邮件消息页面，可以看到账户已经关联

![](https://static-docs.nocobase.com/mail-1733816163177.png)

点击蒙层区域，关闭弹窗后可以看到邮件列表

![](https://static-docs.nocobase.com/mail-1733816163503.png)

### 删除账户
可以点击 "Delete"，将删除账户和关联的邮件

![](https://static-docs.nocobase.com/mail-1733816163758.png)


## 邮件管理

### 邮件筛选

邮件管理页面，左侧为筛选区，右侧为邮件列表区，进入页面时默认为收件箱

![](https://static-docs.nocobase.com/mail-1733816165536.png)

相同主题的邮件会进行合并处理，并在主题字段后面标识共有多少封往来邮件
当相同主题的某些主题符合筛选条件时，会带出主题的根邮件，且会在主题字段边标识当前根邮件的类型

![](https://static-docs.nocobase.com/mail-1733816165797.png)

未读邮件标题将会以粗体形式展示，并且顶部邮件图标侧会标记未读邮件数量

![](https://static-docs.nocobase.com/mail-1733816166067.png)

### 手动同步邮件

当前邮件的同步间隔为5分钟，如果想强制同步邮件，可以点击 "Refresh" 按钮

![](https://static-docs.nocobase.com/mail-1733816166364.png)

### 已读状态变更

"Mark as read"，"Mark as unread" 按钮可以批量操作邮件已读状态

![](https://static-docs.nocobase.com/mail-1733816166621.png)

### 发送邮件

点击顶部 "Write email" 按钮可以打开发件面板

![](https://static-docs.nocobase.com/mail-1733816166970.png)

填写相关信息后可以进行邮件发送，当前附件只支持 3M以内

![](https://static-docs.nocobase.com/mail-1733816167214.png)

### 查看邮件

点击行上 "View" 按钮，可以查看邮件详情，目前有两种形式，一种是单一邮件的，可以直接看到邮件详细信息

![](https://static-docs.nocobase.com/mail-1733816167456.png)

另外一种是同主题的多封邮件，默认会以列表的形式显示，可以点击展开折叠

![](https://static-docs.nocobase.com/mail-1733816167750.png)

邮件点击查看详情后，默认会将邮件状态置为已读，可以点击右侧 "..." 按钮内 Mark as unread 操作，置为未读

### 回复邮件

进入邮件详情后，底部有 "Replay" 按钮，可以进行回复操作，如果涉及到多人，可以点击 Replay all 回复所有人

![](https://static-docs.nocobase.com/mail-1733816167998.png)

### 转发邮件

可以点击底部 Forward 按钮，将邮件转发给别人

![](https://static-docs.nocobase.com/mail-1733816168241.png)

## 邮件消息区块

### 添加区块

在配置页面，可以点击 Add block 按钮，选择 Mail messages区块进行添加

![](https://static-docs.nocobase.com/mail-1733816168487.png)

### 字段配置

点击区块 Configure columns 按钮，可以选择需要显示的字段，详细操作可以参照表格字段配置

![](https://static-docs.nocobase.com/mail-1733816168737.png)

### 顶部操作配置

点击区块 Configure actions 按钮，可以配置顶部按钮，按钮最终的执行效果可以参照邮件管理

![](https://static-docs.nocobase.com/mail-1733816168977.png)

发送邮件按钮可以配置邮件的默认内容

![](https://static-docs.nocobase.com/mail-1733816169243.png)

![](https://static-docs.nocobase.com/mail-1733816169515.png)

### 数据筛选配置

点击表格右侧配置，选择 "Set the data scope"，可以设置筛选的邮件数据

![](https://static-docs.nocobase.com/mail-1733816169764.png)


## 邮件发送

#### 创建邮件发送按钮

1. 在表格操作栏添加 "Write email" 按钮

![](https://static-docs.nocobase.com/mail-1735634129950.png)

2. 进入按钮配置菜单，可以编辑按钮名称

![](https://static-docs.nocobase.com/mail-1735634130387.png)

#### 配置邮件默认发送内容

1. 进入按钮配置菜单，选择 "Mail default value"

![](https://static-docs.nocobase.com/mail-1735634130581.png)

2. 配置默认收件人为当前行数据的email

![](https://static-docs.nocobase.com/mail-1735634130773.png)

![](https://static-docs.nocobase.com/mail-1735634130997.png)

3. 点击 "Write email 按钮"，可以看到默认收件人已经填入

![](https://static-docs.nocobase.com/mail-1735634131163.png)


## 取消授权

如果您的邮箱账户已经授权，但是想删除或者重新授权，可以按如下操作

#### **谷歌邮箱**

1. 打开 https://myaccount.google.com/u/0/connections 并登录

![](https://static-docs.nocobase.com/mail-1735634131347.png)

2. 点击对应应用，然后点击删除

![](https://static-docs.nocobase.com/mail-1735634131518.png)

![](https://static-docs.nocobase.com/mail-1735634131697.png)

#### **微软邮箱**

1. 打开 https://account.microsoft.com/ 并登录
    
2. 点击 "Apps and services that can access your data" 按钮

![](https://static-docs.nocobase.com/mail-1735634131870.png)

3. 点击编辑并移除

![](https://static-docs.nocobase.com/mail-1735634132052.png)