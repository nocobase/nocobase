# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## 在 NocoBase 上新增认证器

首先在 NocoBase 上新增一个认证器：插件设置 - 用户认证 - 添加 - OIDC.

复制回调 URL.

![](https://static-docs.nocobase.com/202412021504114.png)

## 注册应用程序

打开 Microsoft Entra 管理中心，注册一个新的应用程序。

![](https://static-docs.nocobase.com/202412021506837.png)

此处填入刚才复制的回调 URL.

![](https://static-docs.nocobase.com/202412021520696.png)

## 获取并填写相应的信息

点击进入刚才注册的应用程序，在首页复制 **Application (client) ID** 和 **Directory (tenant) ID**.

![](https://static-docs.nocobase.com/202412021522063.png)

点击 Certificates & secrets, 创建一个新的客户端密钥 (Client secrets)，并复制 **Value**.

![](https://static-docs.nocobase.com/202412021522846.png)

以上信息和 NocoBase 认证器配置的对应关系如下：

| Microsoft Entra 信息    | NocoBase 认证器配置                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application (client) ID | Client ID                                                                                                                                        |
| Client secrets - Value  | Client secret                                                                                                                                    |
| Directory (tenant) ID   | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, `{tenant}` 需要替换成相应的 Directory (tenant) ID |
