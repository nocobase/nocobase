---
pkg: '@nocobase/plugin-auth'
---

# 密码认证

## 配置界面

![](https://static-docs.nocobase.com/202411131505095.png)

## 是否允许注册

允许注册时，登录页会显示创建账号的连接，并可以跳转至注册页

![](https://static-docs.nocobase.com/78903930d4b47aaf75cf94c55dd3596e.png)

注册页

![](https://static-docs.nocobase.com/ac3c3ab42df28cb7c6dc70b24e99e7f7.png)

不允许注册时，登录页不会显示创建账号的连接

![](https://static-docs.nocobase.com/8d5e3b6df9991bfc1c2e095a93745121.png)

不允许注册时，无法访问注册页面

![](https://static-docs.nocobase.com/09325c4b07e09f88f80a14dff8430556.png)

## 注册表单设置<Badge>v1.4.0-beta.7+</Badge>

支持设置用户表中的哪些字段在注册表单中显示以及是否必填。至少需要设置用户名或邮箱中一个字段为显示和必填。

![](https://static-docs.nocobase.com/202411262133669.png)

注册页

![](https://static-docs.nocobase.com/202411262135801.png)

## 忘记密码<Badge>v1.8.0+</Badge>

忘记密码功能允许用户在忘记密码时，通过邮箱验证的方式重新设置密码。

### 管理员配置

1. **启用忘记密码功能**

   在"设置" > "用户认证" > "忘记密码"选项卡中，勾选"启用忘记密码功能"复选框。

   ![20250423071957_rec_](https://static-docs.nocobase.com/20250423071957_rec_.gif)

2. **配置通知渠道**

   选择一个邮件通知渠道（当前仅支持邮件）。如果没有可用的通知渠道，需要先添加一个。

   ![20250423072225_rec_](https://static-docs.nocobase.com/20250423072225_rec_.gif)

3. **配置密码重置邮件**

   自定义邮件主题和内容，支持 HTML 或纯文本格式。可以使用以下变量：
   - 当前用户（Current user）
   - 系统设置（System settings）
   - 重置密码链接（Reset password link）
   - 重置链接有效期（分钟）（Reset link expiration (minutes)）

   ![20250427170047](https://static-docs.nocobase.com/20250427170047.png)

4. **设置重置链接有效期**

   设置重置链接的有效时间（分钟），默认为 120 分钟。

   ![20250423073557](https://static-docs.nocobase.com/20250423073557.png)

### 用户使用流程

1. **发起密码重置请求**

   在登录页面点击"忘记密码"链接（需要管理员先开启忘记密码功能），进入忘记密码页面。

   ![20250421103458_rec_](https://static-docs.nocobase.com/20250421103458_rec_.gif)

   输入注册邮箱并点击"发送重置邮件"按钮。

   ![20250421113442_rec_](https://static-docs.nocobase.com/20250421113442_rec_.gif)

2. **重置密码**

   用户会收到一封包含重置链接的邮件。点击链接后，在打开的页面中设置新密码。

   ![20250421113748](https://static-docs.nocobase.com/20250421113748.png)

   设置完成后，用户可以使用新密码登录系统。

### 注意事项

- 重置链接有时间限制，默认是在生成后的 120 分钟内有效（可由管理员配置）
- 链接只能使用一次，使用后立即失效
- 如果用户没有收到重置邮件，请检查邮箱地址是否正确，或查看垃圾邮件文件夹
- 管理员应确保邮件服务器配置正确，以保证重置邮件能够成功发送
