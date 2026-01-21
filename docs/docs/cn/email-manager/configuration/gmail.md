---
pkg: "@nocobase/plugin-email-manager"
---

# 谷歌配置

### 前置条件

想要后续用户能够将谷歌邮箱接入到NocoBase，必须部署在支持访问谷歌服务的服务器上，后台将会调用Google API
    
### 注册账户

1. 打开 https://console.cloud.google.com/welcome 进入Google Cloud  
2. 首次进入需要同意相关条款
    
![](https://static-docs.nocobase.com/mail-1733818617807.png)

### 创建App

1. 点击顶部 "Select a project"
    
![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. 点击浮层内 "NEW PROJECT" 按钮

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. 填写项目信息
    
![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. 项目创建完成后选中项目

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### 开启 Gmail API

1. 点击 "APIs & Services" 按钮

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. 进入 APIs & Services 面板

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. 搜索 **mail**

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. 点击 **ENABLE** 按钮启用 Gmail API

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### 配置 OAuth consent screen

1. 点击左侧 "OAuth consent screen" 菜单

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. 选择 **External**

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. 填写项目信息（用于后续授权页面显示）点击保存

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. 填写 Developer contact information，点击继续

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. 点击继续

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. 添加测试用户，用于App发布前测试

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. 点击继续

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. 查看概览信息，返回控制面板

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### 创建凭证 Credentials

1. 点击左侧 **Credentials** 菜单

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. 点击 "CREATE CREDENTIALS" 按钮，选择 "OAuth client ID"

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. 选择 "Web application"

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. 填写应用信息

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. 填写项目最终部署的域名（此处示例为NocoBase的测试地址）

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. 添加授权回调地址，必须为 `域名 + "/admin/settings/mail/oauth2"`，示例：`https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. 点击创建，可以查看OAuth信息

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. 分别拷贝 Client ID 和 Client serret 内容填写到 邮件配置页面中

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. 点击保存，配置完成  

### 应用发布

当上述流程完成，以及测试用户授权登录，邮件发送等功能测试完成后进行发布

1. 点击 "OAuth consent screen" 菜单

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. 点击 "EDIT APP" 按钮，随后点击底部 "SAVE AND CONTINUE" 按钮

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. 点击 "ADD OR REMOVE SCOPES" 按钮，进行用户权限范围勾选 

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. 输入 "Gmail API" 进行搜索，然后勾选 "Gmail API"（确认Scope值为 "https://mail.google.com/"的 Gmail API）

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. 点击底部 **UPDATE** 按钮进行保存

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. 点击每个页面底部 "SAVE AND CONTINUE" 按钮，最后点击 "BACK TO DASHBOARD" 按钮返回控制面板页面

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. 点击 **PUBLISH APP** 按钮后出现发布确认页面，列出了发布所需提供的相关信息。随后点击 **CONFIRM** 按钮

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. 再次回到控制台页面，可以看到发布状态为 "In production"

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. 点击 "PREPARE FOR VERIFICATION" 按钮，填写必填的相关信息，点击 "SAVE AND CONTINUE" 按钮（图内数据仅为示例）

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. 继续填写相关必要信息（图内数据仅为示例）

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. 点击 "SAVE AND CONTINUE" 按钮

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. 点击 "SUBMIT FOR VERIFICATION" 按钮，提交 Verification

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. 等待审批结果

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. 在审批尚未通过的情况下，用户可以点击 unsafe 链接进行授权登录

![](https://static-docs.nocobase.com/mail-1735633689645.png)