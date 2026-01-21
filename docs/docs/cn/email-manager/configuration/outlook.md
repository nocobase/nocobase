---
pkg: "@nocobase/plugin-email-manager"
---

# 微软配置

### 前置条件
想要后续用户能够将Outlook邮箱接入到NocoBase，必须部署在支持访问微软服务的服务器上，后台将会调用微软API

### 注册账户

1. 打开 https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
    
2. 登录微软账户
    
![](https://static-docs.nocobase.com/mail-1733818625779.png)

### 创建租户

1. 打开 https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount，并登录账户
    
2. 填写基本信息，并获取验证码

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. 填写其他信息并继续

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. 填写信用卡相关信息（可以先不创建）

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### 获取 Client ID

1. 点击顶部菜单，选择 **Microsoft Entra ID**

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. 选择左侧 **App registrations**

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. 点击顶部 **New registration**

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. 填写信息并提交

名称可以随意，account types参照下图中选择，Redirect URI可以先不填

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. 获取到 Client ID

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### API 授权

1. 打开右侧 **API permissions** 菜单

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. 点击 **Add a permission** 按钮

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. 点击 **Microsoft Graph**

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. 搜索并添加如下权限，最终结果如下图
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (By default)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### 获取秘钥

1. 点击左侧 **Certificates & secrets**

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. 点击 **New client secret** 按钮

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. 填写描述和过期时间，并添加

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. 获取到 Secret ID

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. 分别拷贝 Client ID 和 Client serret 信息填写到 邮件配置页面中

![](https://static-docs.nocobase.com/mail-1733818630710.png)
