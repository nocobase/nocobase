# 认证：企业微信

<PluginInfo commercial="true" name="wecom"></PluginInfo>

## 介绍

**企业微信**插件支持用户使用企业微信账号登录 NocoBase.

## 激活插件

![](https://static-docs.nocobase.com/202406272056962.png)

## 创建和配置企业微信自建应用

进入企业微信管理后台，创建企业微信自建应用。

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

点击应用进入详情页，下拉页面，点击「企业微信授权登录」。

![](https://static-docs.nocobase.com/202406272104655.png)

设置授权回调域为 NocoBase 应用域名。

![](https://static-docs.nocobase.com/202406272105662.png)

回到应用详情页，点击「网页授权及 JS-SDK」。

![](https://static-docs.nocobase.com/202406272107063.png)

设置并验证可作为应用 OAuth2.0 网页授权功能的回调域名。

![](https://static-docs.nocobase.com/202406272107899.png)

在应用详情页，点击「企业可信 IP」。

![](https://static-docs.nocobase.com/202406272108834.png)

配置 NocoBase 应用 IP.

![](https://static-docs.nocobase.com/202406272109805.png)

## 从企业微信管理后台获取密钥

在企业微信管理后台 - 我的企业，复制「企业 ID」.

![](https://static-docs.nocobase.com/202406272111637.png)

在企业微信管理后台 - 应用管理，进入上一步创建的应用的详情页，复制 AgentId 和 Secret

![](https://static-docs.nocobase.com/202406272122322.png)

## 在 NocoBase 上添加企业微信认证

进入用户认证插件管理页面。

![](https://static-docs.nocobase.com/202406272115044.png)

添加 - 企业微信

![](https://static-docs.nocobase.com/202406272115805.png)

### 配置

![](https://static-docs.nocobase.com/202412041459250.png)

| 配置项                                                                                                | 说明                                                                                                 | 版本要求 |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| When a phone number does not match an existing user, <br />should a new user be created automatically | 当使用手机号匹配不到已有用户时，是否自动创建新用户。                                                   | -        |
| Company ID                                                                                            | 企业 ID, 从企业微信管理后台获取。                                                                      | -        |
| AgentId                                                                                               | 从企业微信管理后台自建应用配置获取。                                                                   | -        |
| Secret                                                                                                | 从企业微信管理后台自建应用配置获取。                                                                   | -        |
| Origin                                                                                                | 当前应用域名。                                                                                         | -        |
| Workbench application redirect link                                                                   | 成功登录后跳转的应用路径。                                                                             | `v1.4.0` |
| Automatic login                                                                                       | 在企业微信浏览器里打开应用链接时，自动登录。当配置有多个企业微信认证器的时候，只有一个能开启该选项。 | `v1.4.0` |
| Workbench application homepage link                                                                   | 工作台应用主页链接。                                                                                   | -        |

## 配置企业微信应用首页

:::info
`v1.4.0` 以上版本，在启用「自动登录」选项的情况下，应用主页链接可以简化为: `https://<url>/<path>`，例如 `https://example.nocobase.com/admin`.

也可以将分别配置手机和电脑端，例如 `https://example.nocobase.com/m` 和 `https://example.nocobase.com/admin`.
:::

进入企业微信管理员后台，将复制的工作台应用主页链接填写到对应应用的应用主页地址栏。

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## 登录

访问登录页面，点击登录表单下方按钮发起第三方登录。

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
由于企业微信对于手机号等敏感信息的权限限制，只能在企业微信客户端内完成授权。第一次使用企业微信登录时，请参考以下步骤在企业微信客户端内完成首次登录授权。
:::

## 初次登录

从企业微信客户端进入工作台，下拉至底部，点击应用进入前面填写的应用主页，即可完成首次授权登录，之后就可以在 NocoBase 应用内使用企业微信登录。

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />
