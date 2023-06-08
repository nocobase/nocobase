# SAML

提供SAML2.0 SSO登录功能。

## 依赖

- `@nocobase/auth` 认证插件，提供认证相关功能，表、模型、函数复用等。

## 使用方法

> 以Google WorkSpace IdP为例

### 将Google设置为IdP

[Google管理控制台](https://admin.google.com/) - 应用 - Web应用和移动应用

<img src="https://s2.loli.net/2023/05/18/O7UYh9pjePrKzTq.png" width="800px" />   


进行应用设置之后，复制**SSO网址**、**实体ID**和**证书**。

<img src="https://s2.loli.net/2023/05/18/Mpwk3dAIvShmUCe.png" width="800px"/>

### 在Nocobase上新增认证器

插件设置 - 认证 - 新增 - SAML

<img src="https://s2.loli.net/2023/05/18/EpXsJ1BM5lju2mY.png" width="800px" />

将刚才复制的信息依次进行填写
- SSO URL: SSO网址
- Public Certificate: 证书
- idP Issuer: 实体id
- http: 如果是本地http测试可以勾选

之后复制`Usage`中的`SP Issuer/EntityID`和`ACS URL`.

### 在Google上填写SP信息

回到Google控制台，在**服务提供商详细信息**页面，输入刚才复制的ACS网址和实体ID，并勾选**已签署响应**。

在**属性映射**位置，添加映射，映射对应属性，Nocobase可供映射的字段有：

- email（必填）
- phone (仅对scope支持phone的平台生效，如阿里云)
- nickname
- username
- firstName
- lastName

用户名使用规则优先级: `nickname` > `username` > `firstName lastName` > `nameID`

`nameID`为SAML协议携带，无需映射，将作为用户唯一标识保存。

在有email或nameID为email的情况下，登录时将尝试匹配已有用户，否则创建新用户。