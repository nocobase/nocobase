---
title: "多工作区"
keywords: "多工作区,插件,NocoBase"
displayName: "多工作区"
packageName: '@nocobase/plugin-multi-portal'
supportedVersions:
  - 2.x
description: |
  创建由 NocoBase 布局或可信自定义前端应用承载的工作区入口。
isFree: false
builtIn: false
defaultEnabled: false
editionLevel: 2
---

# 多工作区

**多工作区（Multi-portal）** 可以为同一个 NocoBase 应用提供多个工作区入口。每个工作区都有自己的访问路径和角色权限，并且可以使用 NocoBase 布局或通过轻插件上传的自定义前端应用。

## 开始之前

先启用「多工作区」和 UI 布局插件。如果要使用自定义前端，还需要启用[轻插件](../plugin-light-extension/index.md)，并先上传一个客户端应用包。

:::warning 注意

自定义前端会作为可信的同源 HTML 和 JavaScript 运行。只绑定经过管理员检查和上传的包。工作区权限不会把它变成不可信代码沙箱。

:::

## 创建工作区

进入「插件设置 / 多工作区」，点击「新增多工作区」。填写标题、UID、访问路径、前端类型和启用状态。

访问路径必须以 `/` 开头，不能是 `/`，也不能包含通配符、query 或 hash。NocoBase 会根据路径的第一个 segment 生成 route name。

### 使用 NocoBase 布局

选择「NocoBase 布局」，再选择一个已经启用的桌面或移动端布局。已有布局工作区会继续保留原来的布局、菜单、路由和角色行为。

### 使用自定义前端

选择「自定义前端」，再选择一个已经通过轻插件上传的可用应用。

多工作区只保存应用的 Entry ID。使用相同 `key` 替换上传包后，绑定会继续生效；把工作区切回 NocoBase 布局时，对 client-app 的引用会被删除。

如果应用不可用，列表会显示以下稳定状态之一：

| 状态 | 含义 |
|---|---|
| 正常 | 仓库、Entry 和当前资源均可用 |
| 仓库已停用 | 轻插件仓库处于停用状态 |
| 仓库已归档 | 轻插件仓库已经归档 |
| Entry 不存在 | 绑定的 Entry 已不存在或健康状态异常 |
| 静态资源缺失 | Entry 存在，不过当前资源不完整 |
| 轻插件不可用 | 轻插件已关闭或暂时不可用 |

点击「修复」可以打开轻插件，处理仓库、Entry 或重新上传。多工作区不会悄悄回退到 NocoBase 布局。

## 配置工作区访问权限

开启登录检查后，未登录的文档请求会前往 NocoBase v2 登录页，登录成功后再回到原工作区 URL。未登录的 JS、CSS、图片、字体或 WASM 请求返回 `401`，不会返回登录页面。

在多工作区权限设置中给需要的角色授权。已登录但没有工作区权限的用户会收到 `403`。

关闭登录检查后，工作区文档和静态资源可以公开访问。不过这个设置不会让 NocoBase 数据 API 变成公开接口。

## 区分工作区权限和数据权限

工作区权限只控制某个角色能否加载工作区前端。API 请求仍然要经过 NocoBase 原有的 resource 和数据 ACL 检查。

同源 GET 请求可以使用原生 `fetch`：

```js
const apiBase = window.__nocobase_api_base_url__ || '/api/';

const response = await fetch(`${apiBase.replace(/\/$/, '')}/orders:list`, {
  credentials: 'same-origin',
});
```

除 GET、HEAD 和 OPTIONS 外，其他 HTTP method 都要把当前应用的 CSRF Cookie 放到 `X-CSRF-Token` header：

```js
const apiBase = window.__nocobase_api_base_url__ || '/api/';
const appNameMatch = apiBase.match(/\/__app\/([^/]+)/);
const appName = appNameMatch ? decodeURIComponent(appNameMatch[1]) : 'main';
const csrfToken = document.cookie
  .split(';')
  .map((item) => item.trim())
  .find((item) => item.startsWith(`nb_csrf_token_${appName}=`))
  ?.split('=')
  .slice(1)
  .join('=');

await fetch(`${apiBase.replace(/\/$/, '')}/orders:create`, {
  method: 'POST',
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
    ...(csrfToken ? { 'X-CSRF-Token': decodeURIComponent(csrfToken) } : {}),
  },
  body: JSON.stringify({ title: '新订单' }),
});
```

把 SDK 作为应用依赖一起构建进浏览器 bundle：

```bash
yarn add @nocobase/sdk
```

`@nocobase/sdk/client` 会读取页面注入的 API base URL，并沿用已有 Cookie 和 CSRF 行为：

```ts
import { createClient } from '@nocobase/sdk/client';

const client = createClient();

await client.request({
  url: 'orders:list',
  method: 'get',
});
```

切换当前 role 后，API 权限会像 NocoBase 默认界面一样变化。能访问某个工作区，不会绕过 collection、field、action 或 record 权限。

## URL 和静态资源行为

工作区根路径会跳转到带结尾 `/` 的 URL。入口 HTML 会得到正确的 `<base>`，所以 history router 深层路径仍然使用同一组相对 JS、CSS、图片、字体和 WASM 地址。

自定义前端包必须使用相对资源路径。首版不支持根绝对 `/assets/*`。只有 HTML 文档导航可以 fallback 到应用入口；缺失静态资源会返回 `404`。

工作区始终提供当前上传内容。这里没有 release list、publish、版本历史或回滚。

## 排查问题

| 响应或状态 | 检查内容 |
|---|---|
| `401` | 请求是未登录的静态资源请求，而不是文档导航 |
| `403` | 当前角色没有工作区权限，或者目标 API 拒绝对应的数据操作 |
| `404` | 工作区、Entry 或请求的相对资源不存在 |
| `503` | 轻插件、仓库、Entry runtime 或当前资源不可用 |

如果登录后打开深层 URL 时出现 NocoBase 默认前端，检查工作区是否启用，并且仍然选择了「自定义前端」。客户端兜底路由只会执行一次受保护的整页 reload；如果 Gateway 无法提供应用，它会停止重复 reload 并显示错误。

## 相关链接

- [轻插件](../plugin-light-extension/index.md) — 准备、上传、替换和排查自定义前端包
