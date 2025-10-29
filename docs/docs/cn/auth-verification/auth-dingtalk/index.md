# 认证：钉钉

<PluginInfo commercial="true" name="auth-dingtalk"></PluginInfo>

## 介绍

认证：钉钉 插件支持用户使用钉钉账号登录 NocoBase.

## 激活插件

![](https://static-docs.nocobase.com/202406120929356.png)

## 在钉钉开发者后台申请接口权限

参考 <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">钉钉开放平台 - 实现登录第三方网站</a>，创建一个应用。

进入应用管理后台，开通“个人手机号信息”和“通讯录个人信息读权限”。

![](https://static-docs.nocobase.com/202406120006620.png)

## 从钉钉开发者后台获取密钥

复制 Client ID 和 Client Secret.

![](https://static-docs.nocobase.com/202406120000595.png)

## 在 NocoBase 上添加钉钉认证

进入用户认证插件管理页面。

![](https://static-docs.nocobase.com/202406112348051.png)

添加 - 钉钉

![](https://static-docs.nocobase.com/202406112349664.png)

### 配置

![](https://static-docs.nocobase.com/202406120016896.png)

- Sign up automatically when the user does not exist - 当使用手机号匹配不到已有用户时，是否自动创建新用户。
- Client ID 和 Client Secret - 填写上一步复制的信息。
- Redirect URL - 回调 URL，复制并进入下一步。

## 在钉钉开发者后台配置回调 URL

将复制的回调 URL 填写到钉钉开发者后台。

![](https://static-docs.nocobase.com/202406120012221.png)

## 登录

访问登录页面，点击登录表单下方按钮发起第三方登录。

![](https://static-docs.nocobase.com/202406120014539.png)
