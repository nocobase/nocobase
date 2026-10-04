---
title: '快速开始'
description: '用五分钟登录你的新应用，看看认证相关的东西都在哪，然后让 Agent 完成第一个小改动。'
keywords: 'NocoBase,认证,快速开始,AUTH_SECRET'
---

# 快速开始

你已经用应用模板建好了一个应用，能在本地跑起来。接下来五分钟带你看清认证这部分。

## 登录进去

打开应用，你会被带到登录页。安装时已经创建了一个管理员：

```text
用户名  nocobase
邮箱    admin@nocobase.com
密码    admin123
```

用户名或邮箱都可以。登录后右上角的用户菜单可以退出。这个账号上线前记得改密码，或者新建一个管理员后把它禁用。

顺便点点看登录页的另外几个入口：注册、忘记密码。它们都已经能用，只是忘记密码的邮件还没配发送方式，这一步在[定制登录页面](./development/login-pages.md)里。

## 东西都在哪

你不需要马上改它们，但知道在哪，跟 Agent 说需求时会更准：

```text
server/config/auth.ts                 服务端认证配置：开哪些认证方式、Better Auth 插件、邮件回调
client/config/auth.ts                 浏览器端的对应配置
client/routes.ts                      /login /register /forgot-password /reset-password 四条路由
client/pages/auth/                    四个页面，加一个共用的 logo 和宣传面板
client/extensions/nocobase-auth-*/    登录页布局、多方式 tab、第三方按钮、密码表单
database/migrations/                  新认证方式要加表的话放这里
config.yml 或 AUTH_SECRET             部署密钥和公网地址
```

页面和表单都是你应用里的代码，想怎么改就怎么改。认证插件本身只管协议、会话、守卫这些看不见的部分。

## 确认 Agent 拿到了 Skill

Agent 靠插件同步到应用里的 Skill 了解认证怎么用。看一眼 `.agents/skills/nocobase-app-plugin-authentication/` 在不在，不在就在应用根目录运行：

```bash
pnpm nocobase skills sync
```

这个目录是自动生成的，别手改。

## 让 Agent 做第一个改动

挑一个不涉及外部系统的需求练手，比如关掉自助注册：

> 这个应用只允许管理员创建账号，帮我关闭自助注册。注册接口要拒绝请求，登录页不再显示注册入口，忘记密码保留。改完补上测试，跑一遍应用的检查。

你应该看到 Agent 做了两件事：在服务端配置里关闭注册，让接口本身拒绝；再从路由和登录页里去掉注册入口。如果它只把链接藏起来，注册接口其实还开着，让它补上。

## 准备上线时

- `AUTH_SECRET`：至少 32 个字符，放在 `config.yml` 或环境变量里，所有实例一致；
- `app.publicOrigin`：用户在浏览器里看到的 HTTPS 地址，反向代理要转发 Host 和协议；
- 跑两个以上实例时配共享缓存，否则限流和一次性验证码在实例间对不上；
- 要开放忘记密码，先配好发邮件并真实收一封。

不确定漏了什么，直接问：

> 我们要部署到 `https://apps.example.com/crm/`，两个实例，前面有 Nginx。认证相关必须配哪些项，每项为什么，当前配置里缺什么？

## 下一步

- [保护接口和页面](./development/protecting-apis.md)
- [定制登录页面](./development/login-pages.md)
- [增加认证方式](./development/sign-in-methods.md)
