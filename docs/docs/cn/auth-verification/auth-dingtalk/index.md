---
pkg: '@nocobase/plugin-auth-dingtalk'
title: "认证：钉钉"
description: "NocoBase 钉钉登录：支持钉钉账号登录、自动登录，配置 Client ID、Client Secret、回调 URL 或微应用免登参数。"
keywords: "钉钉,DingTalk,钉钉登录,自动登录,OAuth,Client ID,回调 URL,NocoBase"
---

# 认证：钉钉

## 介绍

认证：钉钉 插件支持用户使用钉钉账号登录 NocoBase.

## 激活插件

![](https://static-docs.nocobase.com/20260513231045.png)

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

![](https://static-docs.nocobase.com/20260513231225.png)

- Sign up automatically when the user does not exist - 当使用手机号匹配不到已有用户时，是否自动创建新用户。
- Client ID 和 Client Secret - 填写上一步复制的信息。
- Redirect URL - 回调 URL，复制并进入下一步。
- Automatic login - 开启后，在钉钉客户端内打开应用链接时，NocoBase 会自动检测并尝试登录。多个钉钉认证器同时存在时，只允许一个开启该选项。
- Automatic login mode - 自动登录模式：
  - OAuth redirect automatic login：通过钉钉 OAuth 重定向自动登录，不要求额外配置钉钉微应用首页；如果你不想单独创建或维护微应用，优先使用这个模式。
  - DingTalk micro-app automatic login：通过钉钉 JSAPI 获取 `authCode` 免登，需要额外填写 `Corp ID`，并将 NocoBase 地址配置到钉钉微应用首页。
- Corp ID - 仅在「微应用免登」模式下必填。

## 自动登录说明

自动登录只会在**钉钉客户端内**生效；如果用户在普通浏览器中访问 NocoBase，仍然按常规第三方登录流程处理。

### OAuth 重定向自动登录

适用于希望在钉钉内打开链接后自动进入系统、但**不想依赖微应用首页配置**的场景。启用后，用户在钉钉内访问应用地址时，会自动跳转到钉钉 OAuth 授权流程并回到原页面。

### 微应用免登

适用于已经配置了钉钉微应用的场景。启用后，前端会通过钉钉 JSAPI 请求 `authCode`，再调用 NocoBase 登录接口完成免登。

使用该模式时需要注意：

1. 认证器中必须填写 `Corp ID`。
2. 需要将 NocoBase 页面地址配置到钉钉微应用首页。
3. 本地开发地址如 `http://127.0.0.1:13000` 不能直接作为钉钉可访问的微应用域名，通常需要公网 HTTPS 域名或隧道转发地址。

## 在钉钉开发者后台配置回调 URL

将复制的回调 URL 填写到钉钉开发者后台。

![](https://static-docs.nocobase.com/202406120012221.png)

## 登录

访问登录页面，点击登录表单下方按钮发起第三方登录。

![](https://static-docs.nocobase.com/202406120014539.png)
